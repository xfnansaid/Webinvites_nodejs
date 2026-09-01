import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reset-analytics
 *
 * Returns live data counts for:
 * - Page views (traffic / guest analytics)
 * - Drafts (unpaid / abandoned templates)
 * - Free tier published invitations
 * - Total invitations
 *
 * POST /api/admin/reset-analytics
 *
 * Actions:
 * - 'page_views': Clears all page views tracking data (resets views, traffic graphs, and heatmaps to 0)
 * - 'drafts': Clears all unpaid / draft invitations
 * - 'all': Clears page views AND drafts for a clean slate
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-reset-stats:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    // 1. Page views count
    const { count: pageViewsCount } = await supabaseServer
      .from('page_views')
      .select('id', { count: 'exact', head: true });

    // 2. Drafts count (unpaid invitations)
    const { count: draftsCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('is_paid', false);

    // 3. Free published invitations count
    const { count: freeCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'free')
      .eq('is_paid', true);

    // 4. Total invitations count
    const { count: totalInvitationsCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      ok: true,
      counts: {
        pageViews: pageViewsCount || 0,
        drafts: draftsCount || 0,
        freePublished: freeCount || 0,
        totalInvitations: totalInvitationsCount || 0,
      },
    });
  } catch (err) {
    console.error('[Admin Reset Analytics] GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve stats for reset preview.' }, { status: 500 });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-reset-action:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, confirm } = body;

    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation is required. Pass { confirm: true } to proceed.' },
        { status: 400 }
      );
    }

    const adminEmail = user.email || user.user_metadata?.email || 'admin';
    const results = {
      action,
      adminEmail,
      timestamp: new Date().toISOString(),
      deleted: {},
    };

    // ── 1. Clear Page Views / Traffic Analytics ──
    if (action === 'page_views' || action === 'all') {
      const { count: beforeViews } = await supabaseServer
        .from('page_views')
        .select('id', { count: 'exact', head: true });

      if (beforeViews && beforeViews > 0) {
        const { error: viewsErr, count: deletedViews } = await supabaseServer
          .from('page_views')
          .delete({ count: 'exact' })
          .gte('created_at', '1970-01-01T00:00:00Z');

        if (viewsErr) {
          console.error('[Admin Reset Analytics] Failed to clear page_views:', viewsErr.message);
          return NextResponse.json({ error: `Failed to clear page views: ${viewsErr.message}` }, { status: 500 });
        }
        results.deleted.pageViews = deletedViews ?? beforeViews;
      } else {
        results.deleted.pageViews = 0;
      }
    }

    // ── 2. Clear Draft Invitations ──
    if (action === 'drafts' || action === 'all') {
      const { count: beforeDrafts } = await supabaseServer
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('is_paid', false);

      if (beforeDrafts && beforeDrafts > 0) {
        const { error: draftsErr, count: deletedDrafts } = await supabaseServer
          .from('invitations')
          .delete({ count: 'exact' })
          .eq('is_paid', false);

        if (draftsErr) {
          console.error('[Admin Reset Analytics] Failed to delete drafts:', draftsErr.message);
          return NextResponse.json({ error: `Failed to delete drafts: ${draftsErr.message}` }, { status: 500 });
        }
        results.deleted.drafts = deletedDrafts ?? beforeDrafts;
      } else {
        results.deleted.drafts = 0;
      }
    }

    // ── 3. Clear Optional Engagement Tables (if action is all) ──
    if (action === 'all' || action === 'engagement') {
      try {
        await supabaseServer
          .from('rsvp_responses')
          .delete()
          .gte('created_at', '1970-01-01T00:00:00Z');
      } catch {}

      try {
        await supabaseServer
          .from('guest_messages')
          .delete()
          .gte('created_at', '1970-01-01T00:00:00Z');
      } catch {}
    }

    if (!['page_views', 'drafts', 'all', 'engagement'].includes(action)) {
      return NextResponse.json({ error: `Unknown action: "${action}". Valid actions: page_views, drafts, all.` }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message:
        action === 'page_views'
          ? `Successfully reset all page views & traffic analytics (${results.deleted.pageViews || 0} views cleared).`
          : action === 'drafts'
          ? `Successfully deleted all unpaid draft invitations (${results.deleted.drafts || 0} drafts deleted).`
          : `Successfully reset all analytics data (${results.deleted.pageViews || 0} views and ${results.deleted.drafts || 0} drafts cleared).`,
      results,
    });
  } catch (err) {
    console.error('[Admin Reset Analytics] POST Exception:', err);
    return NextResponse.json({ error: 'Server error processing analytics reset.' }, { status: 500 });
  }
}
