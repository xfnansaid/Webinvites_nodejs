import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/admin/drafts/cleanup
 *
 * Preview mode: returns the count and list of draft (unpaid) invitations
 * that would be deleted, without actually deleting anything.
 *
 * POST /api/admin/drafts/cleanup
 *
 * Confirm mode: permanently deletes ALL draft (unpaid) invitations.
 * Body: { confirm: true }
 *
 * A "draft" is any invitation where is_paid = false and status != 'paid'.
 * These are invitations that were started but never completed payment.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-drafts:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_CACHE_HEADERS });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403, headers: NO_CACHE_HEADERS });
    }

    // Fetch all draft invitations (is_paid = false, not status 'paid')
    const { data: drafts, count, error } = await supabaseServer
      .from('invitations')
      .select('id, slug, groom_name, bride_name, owner_email, created_at, template_id', { count: 'exact' })
      .eq('is_paid', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Admin Drafts Cleanup] Query error:', error.message);
      return NextResponse.json({ error: 'Failed to query draft invitations.' }, { status: 500 });
    }

    const draftList = (drafts || []).map((d) => ({
      id: d.id,
      slug: d.slug,
      groomName: d.groom_name || '—',
      brideName: d.bride_name || '—',
      ownerEmail: d.owner_email || '—',
      templateId: d.template_id || '—',
      createdAt: d.created_at,
      daysOld: Math.floor((Date.now() - new Date(d.created_at).getTime()) / (24 * 60 * 60 * 1000)),
    }));

    return NextResponse.json({
      ok: true,
      count: count || 0,
      drafts: draftList,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[Admin Drafts Cleanup] Exception:', err);
    return NextResponse.json({ error: 'Failed to preview draft invitations.' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-drafts-delete:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_CACHE_HEADERS });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.confirm) {
      return NextResponse.json(
        { error: 'Confirmation required. Pass { confirm: true } to proceed.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // First, count how many drafts exist
    const { count: draftCount, error: countError } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('is_paid', false);

    if (countError) {
      console.error('[Admin Drafts Cleanup] Count error:', countError.message);
      return NextResponse.json({ error: 'Failed to count draft invitations.' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    if (!draftCount || draftCount === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No draft invitations to delete.',
        deleted: 0,
      }, { headers: NO_CACHE_HEADERS });
    }

    // Delete all draft invitations in one go
    const { error: deleteError, count: deletedCount } = await supabaseServer
      .from('invitations')
      .delete({ count: 'exact' })
      .eq('is_paid', false);

    if (deleteError) {
      console.error('[Admin Drafts Cleanup] Delete error:', deleteError.message);
      return NextResponse.json({ error: 'Failed to delete draft invitations.' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const actualDeleted = deletedCount ?? draftCount;

    return NextResponse.json({
      ok: true,
      message: `Successfully deleted ${actualDeleted} draft invitation${actualDeleted === 1 ? '' : 's'}.`,
      deleted: actualDeleted,
      adminEmail: user.email || user.user_metadata?.email || 'unknown',
      timestamp: new Date().toISOString(),
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[Admin Drafts Cleanup] Exception:', err);
    return NextResponse.json({ error: 'Server error processing draft cleanup.' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
