import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * GET /api/cron/expire-invitations
 *
 * Cron job that:
 * 1. Marks free tier invitations as inactive when paid_at + 21 days < now
 * 2. Marks premium invitations as inactive when wedding_date + 3 days < now
 * 3. Cleans up page_views for invitations that expired > 30 days ago
 *
 * Requires CRON_SECRET in environment variables.
 * Schedule: Run daily via Vercel Cron, GitHub Actions, or external service.
 *
 * Vercel Cron config (vercel.json):
 * { "crons": [{ "path": "/api/cron/expire-invitations", "schedule": "0 2 * * *" }] }
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const startTime = Date.now();

  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured.' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      freeTierExpired: 0,
      premiumExpired: 0,
      pageViewsCleaned: 0,
      errors: [],
    };

    // ── Step 1: Expire free tier invitations ──────────────────
    // Free tier: paid_at + 21 days < now
    try {
      const { data: freeExpired, error: freeError } = await supabaseServer
        .from('invitations')
        .update({ is_active: false })
        .eq('is_paid', true)
        .eq('tier', 'free')
        .eq('is_active', true)
        .lt('paid_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString())
        .select('id, slug, paid_at');

      if (freeError) {
        results.errors.push({ step: 'expire_free', error: freeError.message });
      } else {
        results.freeTierExpired = freeExpired?.length || 0;
      }
    } catch (e) {
      results.errors.push({ step: 'expire_free', error: e.message });
    }

    // ── Step 2: Expire premium invitations ────────────────────
    // Premium: wedding_date + 3 days < now
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

      const { data: premiumExpired, error: premError } = await supabaseServer
        .from('invitations')
        .update({ is_active: false })
        .eq('is_paid', true)
        .eq('is_active', true)
        .or('tier.eq.premium,and(tier.is.null,is_ad_supported.eq.false)')
        .lt('wedding_date', threeDaysAgoStr)
        .select('id, slug, wedding_date');

      if (premError) {
        results.errors.push({ step: 'expire_premium', error: premError.message });
      } else {
        results.premiumExpired = premiumExpired?.length || 0;
      }
    } catch (e) {
      results.errors.push({ step: 'expire_premium', error: e.message });
    }

    // ── Step 3: Clean up old page views ──────────────────────
    // Delete page_views for invitations that expired > 30 days ago
    // This keeps the page_views table from growing indefinitely
    try {
      // Find slugs of invitations that are inactive and expired > 30 days ago
      // Free: paid_at + 21 + 30 = paid_at + 51 days
      // Premium: wedding_date + 3 + 30 = wedding_date + 33 days
      const cutoffFree = new Date(Date.now() - 51 * 24 * 60 * 60 * 1000).toISOString();
      const cutoffPremium = new Date(Date.now() - 33 * 24 * 60 * 60 * 1000);
      const cutoffPremiumStr = cutoffPremium.toISOString().split('T')[0];

      // Get slugs of expired free invitations
      const { data: expiredFreeSlugs } = await supabaseServer
        .from('invitations')
        .select('slug')
        .eq('tier', 'free')
        .eq('is_active', false)
        .lt('paid_at', cutoffFree);

      // Get slugs of expired premium invitations
      const { data: expiredPremiumSlugs } = await supabaseServer
        .from('invitations')
        .select('slug')
        .or('tier.eq.premium,and(tier.is.null,is_ad_supported.eq.false)')
        .eq('is_active', false)
        .lt('wedding_date', cutoffPremiumStr);

      const allSlugs = [
        ...(expiredFreeSlugs || []).map(r => r.slug),
        ...(expiredPremiumSlugs || []).map(r => r.slug),
      ].filter(Boolean);

      if (allSlugs.length > 0) {
        const { data: cleaned, error: cleanError } = await supabaseServer
          .from('page_views')
          .delete()
          .in('slug', allSlugs)
          .select('id');

        if (cleanError) {
          results.errors.push({ step: 'clean_page_views', error: cleanError.message });
        } else {
          results.pageViewsCleaned = cleaned?.length || 0;
        }
      }
    } catch (e) {
      results.errors.push({ step: 'clean_page_views', error: e.message });
    }

    const elapsed = Date.now() - startTime;
    const hasErrors = results.errors.length > 0;

    console.log(
      `[Cron Expire Invitations] Completed in ${elapsed}ms — ` +
      `Free expired: ${results.freeTierExpired}, Premium expired: ${results.premiumExpired}, ` +
      `Page views cleaned: ${results.pageViewsCleaned}` +
      (hasErrors ? ` — ERRORS: ${JSON.stringify(results.errors)}` : '')
    );

    return NextResponse.json({
      success: !hasErrors,
      elapsed,
      ...results,
    });
  } catch (err) {
    console.error('[Cron Expire Invitations] Fatal error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
