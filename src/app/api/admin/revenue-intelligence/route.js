import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const REVENUE_PER_PREMIUM = 399;

/**
 * GET /api/admin/revenue-intelligence
 *
 * Advanced revenue analytics:
 * - Conversion funnel: Created → Published → First View → Premium
 * - Revenue projection (next 30/60/90 days based on trend)
 * - Revenue breakdown by template
 * - Weekly cohort analysis
 * - ARPU (Average Revenue Per User)
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-revenue-intel:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const now = new Date();
    const nowTime = now.getTime();

    // ── 1. Conversion Funnel ──────────────────────────────────
    const { count: totalCreated } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true });

    const { count: totalPublished } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('is_paid', true);

    const { count: totalPremium } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true);

    // Count unique slugs that have page views (guest engagement)
    const { data: viewedSlugs } = await supabaseServer
      .from('page_views')
      .select('slug')
      .limit(5000);

    const uniqueViewedSlugs = new Set((viewedSlugs || []).map(v => v.slug));

    // Count published invitations with at least one view
    const { data: publishedSlugs } = await supabaseServer
      .from('invitations')
      .select('slug')
      .eq('is_paid', true)
      .limit(5000);

    const publishedSet = new Set((publishedSlugs || []).map(p => p.slug).filter(Boolean));
    let publishedAndViewed = 0;
    for (const slug of uniqueViewedSlugs) {
      if (publishedSet.has(slug)) publishedAndViewed++;
    }

    const funnel = {
      created: totalCreated || 0,
      published: totalPublished || 0,
      viewed: publishedAndViewed,
      premium: totalPremium || 0,
    };

    // ── 2. Revenue Projection (based on last 30 days trend) ──
    const thirtyDaysAgo = new Date(nowTime - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(nowTime - 60 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(nowTime - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { count: last30dPremium } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%')
      .gte('paid_at', thirtyDaysAgo);

    const { count: prev30dPremium } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%')
      .gte('paid_at', sixtyDaysAgo)
      .lt('paid_at', thirtyDaysAgo);

    const { count: prev60to90Premium } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%')
      .gte('paid_at', ninetyDaysAgo)
      .lt('paid_at', sixtyDaysAgo);

    const last30dRev = (last30dPremium || 0) * REVENUE_PER_PREMIUM;
    const prev30dRev = (prev30dPremium || 0) * REVENUE_PER_PREMIUM;
    const prev60to90Rev = (prev60to90Premium || 0) * REVENUE_PER_PREMIUM;

    // Growth rate: compare last 30d vs previous 30d
    const growthRate = prev30dRev > 0
      ? Math.round(((last30dRev - prev30dRev) / prev30dRev) * 100)
      : last30dRev > 0 ? 100 : 0;

    // Daily average revenue last 30d
    const dailyAvgRev = last30dPremium > 0 ? Math.round(last30dRev / 30) : 0;
    const dailyAvgOrders = Math.round(((last30dPremium || 0) / 30) * 10) / 10;

    const projection = {
      last30dRevenue: last30dRev,
      last30dOrders: last30dPremium || 0,
      prev30dRevenue: prev30dRev,
      prev30dOrders: prev30dPremium || 0,
      prev60to90Revenue: prev60to90Rev,
      growthRate,
      dailyAvgRevenue: dailyAvgRev,
      dailyAvgOrders,
      projected30d: dailyAvgRev * 30,
      projected60d: dailyAvgRev * 60,
      projected90d: dailyAvgRev * 90,
    };

    // ── 3. Revenue by Template ────────────────────────────────
    const { data: allPremiumInvites } = await supabaseServer
      .from('invitations')
      .select('template_id, tier, razorpay_payment_id, paid_at')
      .eq('is_paid', true);

    const templateRevenueMap = {};
    for (const inv of allPremiumInvites || []) {
      const tId = inv.template_id || 'unspecified';
      if (!templateRevenueMap[tId]) {
        templateRevenueMap[tId] = { total: 0, free: 0, premium: 0, revenue: 0 };
      }
      templateRevenueMap[tId].total += 1;
      const isRealPremium = inv.tier === 'premium' && inv.razorpay_payment_id && !inv.razorpay_payment_id.startsWith('free_');
      if (isRealPremium) {
        templateRevenueMap[tId].premium += 1;
        templateRevenueMap[tId].revenue += REVENUE_PER_PREMIUM;
      } else {
        templateRevenueMap[tId].free += 1;
      }
    }

    const revenueByTemplate = Object.entries(templateRevenueMap)
      .map(([templateId, data]) => ({
        templateId,
        total: data.total,
        free: data.free,
        premium: data.premium,
        revenue: data.revenue,
        conversionRate: data.total > 0 ? Math.round((data.premium / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── 4. Weekly Cohort Analysis (last 8 weeks) ─────────────
    const cohorts = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(nowTime - (w + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(nowTime - w * 7 * 24 * 60 * 60 * 1000);
      const weekStartStr = weekStart.toISOString();
      const weekEndStr = weekEnd.toISOString();

      const { count: weekCreated } = await supabaseServer
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStartStr)
        .lt('created_at', weekEndStr);

      const { count: weekPaid } = await supabaseServer
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('is_paid', true)
        .gte('paid_at', weekStartStr)
        .lt('paid_at', weekEndStr);

      const { count: weekPremium } = await supabaseServer
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('tier', 'premium')
        .eq('is_paid', true)
        .not('razorpay_payment_id', 'like', 'free_%')
        .gte('paid_at', weekStartStr)
        .lt('paid_at', weekEndStr);

      cohorts.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        label: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        created: weekCreated || 0,
        published: weekPaid || 0,
        premium: weekPremium || 0,
        revenue: (weekPremium || 0) * REVENUE_PER_PREMIUM,
      });
    }

    // ── 5. ARPU & Lifetime Metrics ────────────────────────────
    const { count: totalPaidUsers } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('is_paid', true);

    const totalRevenue = (totalPremium || 0) * REVENUE_PER_PREMIUM;
    const arpu = totalPaidUsers > 0 ? Math.round(totalRevenue / totalPaidUsers) : 0;

    // Average time from creation to payment (for premium users)
    const { data: premiumTimings } = await supabaseServer
      .from('invitations')
      .select('created_at, paid_at')
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%')
      .not('paid_at', 'is', null)
      .limit(200);

    let avgDaysToUpgrade = 0;
    if (premiumTimings && premiumTimings.length > 0) {
      const totalDays = premiumTimings.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const paid = new Date(t.paid_at).getTime();
        return sum + Math.max(0, (paid - created) / (24 * 60 * 60 * 1000));
      }, 0);
      avgDaysToUpgrade = Math.round((totalDays / premiumTimings.length) * 10) / 10;
    }

    return NextResponse.json({
      ok: true,
      funnel,
      projection,
      revenueByTemplate,
      cohorts,
      arpu,
      avgDaysToUpgrade,
    });
  } catch (err) {
    console.error('[Admin Revenue Intelligence] Exception:', err);
    return NextResponse.json({ error: 'Failed to compute revenue intelligence.' }, { status: 500 });
  }
}
