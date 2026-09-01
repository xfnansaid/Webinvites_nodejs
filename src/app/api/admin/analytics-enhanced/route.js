import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function categorizeDevice(ua) {
  if (!ua) return 'Mobile';
  const u = ua.toLowerCase();
  if (u.includes('ipad') || u.includes('tablet')) return 'Tablet';
  if (u.includes('mobile') || u.includes('iphone') || u.includes('android')) return 'Mobile';
  return 'Desktop';
}

/**
 * GET /api/admin/analytics-enhanced
 *
 * Extended analytics for the Analytics tab:
 * - Template A/B conversion rates (which templates drive premium upgrades)
 * - Peak traffic hours heatmap (hour × day_of_week)
 * - Engagement depth (views per slug distribution)
 * - RSVP response stats (if rsvp_responses table exists)
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-analytics-ext:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── 1. Template A/B Conversion Rates ─────────────────────
    const { data: allInvites } = await supabaseServer
      .from('invitations')
      .select('template_id, tier, is_paid, razorpay_payment_id, photo_url, template_data, created_at');

    const templateStats = {};
    for (const inv of allInvites || []) {
      const tId = inv.template_id || 'unspecified';
      if (!templateStats[tId]) {
        templateStats[tId] = {
          total: 0, free: 0, premium: 0,
          withPhoto: 0, withAudio: 0,
          createdLast30d: 0,
        };
      }
      templateStats[tId].total += 1;
      const isRealPremium = inv.tier === 'premium' && inv.razorpay_payment_id && !inv.razorpay_payment_id.startsWith('free_');
      if (isRealPremium) {
        templateStats[tId].premium += 1;
      } else {
        templateStats[tId].free += 1;
      }
      if (inv.photo_url || inv.template_data?.photoUrl || inv.template_data?.heroImage) {
        templateStats[tId].withPhoto += 1;
      }
      if (inv.template_data?.musicTrack || inv.template_data?.audioTrack) {
        templateStats[tId].withAudio += 1;
      }
      if (inv.created_at >= thirtyDaysAgo) {
        templateStats[tId].createdLast30d += 1;
      }
    }

    const templateConversion = Object.entries(templateStats)
      .map(([id, s]) => ({
        templateId: id,
        total: s.total,
        free: s.free,
        premium: s.premium,
        conversionRate: s.total > 0 ? Math.round((s.premium / s.total) * 100) : 0,
        photoRate: s.total > 0 ? Math.round((s.withPhoto / s.total) * 100) : 0,
        audioRate: s.total > 0 ? Math.round((s.withAudio / s.total) * 100) : 0,
        createdLast30d: s.createdLast30d,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);

    // ── 2. Peak Traffic Hours Heatmap ────────────────────────
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentViews } = await supabaseServer
      .from('page_views')
      .select('created_at')
      .gte('created_at', fourteenDaysAgo)
      .limit(5000);

    // 7 days (rows) × 24 hours (columns) heatmap
    const heatmap = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize 7×24 grid
    for (let d = 0; d < 7; d++) {
      heatmap[d] = [];
      for (let h = 0; h < 24; h++) {
        heatmap[d][h] = 0;
      }
    }

    let maxHeatVal = 0;
    for (const v of recentViews || []) {
      const date = new Date(v.created_at);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      heatmap[dayOfWeek][hour] += 1;
      if (heatmap[dayOfWeek][hour] > maxHeatVal) {
        maxHeatVal = heatmap[dayOfWeek][hour];
      }
    }

    // Find peak hour
    let peakHour = 0;
    let peakDay = 0;
    let peakVal = 0;
    const hourlyTotals = new Array(24).fill(0);
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        hourlyTotals[h] += heatmap[d][h];
        if (heatmap[d][h] > peakVal) {
          peakVal = heatmap[d][h];
          peakDay = d;
          peakHour = h;
        }
      }
    }

    // Busiest hours (top 5)
    const topHours = hourlyTotals
      .map((count, hour) => ({ hour, count, label: `${hour}:00` }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Busiest days
    const dailyTotals = heatmap.map((hours, day) => ({
      day: dayNames[day],
      dayIndex: day,
      total: hours.reduce((s, v) => s + v, 0),
    })).sort((a, b) => b.total - a.total);

    // ── 3. Engagement Depth ──────────────────────────────────
    // Views per slug distribution
    const slugViewMap = {};
    for (const v of recentViews || []) {
      if (v.slug) {
        slugViewMap[v.slug] = (slugViewMap[v.slug] || 0) + 1;
      }
    }
    const viewCounts = Object.values(slugViewMap);
    const avgViewsPerInvite = viewCounts.length > 0
      ? Math.round(viewCounts.reduce((s, v) => s + v, 0) / viewCounts.length * 10) / 10
      : 0;

    const engagementBuckets = {
      '1 view': 0,
      '2-5 views': 0,
      '6-10 views': 0,
      '11-25 views': 0,
      '25+ views': 0,
    };

    for (const count of viewCounts) {
      if (count === 1) engagementBuckets['1 view']++;
      else if (count <= 5) engagementBuckets['2-5 views']++;
      else if (count <= 10) engagementBuckets['6-10 views']++;
      else if (count <= 25) engagementBuckets['11-25 views']++;
      else engagementBuckets['25+ views']++;
    }

    // ── 4. RSVP Stats (optional table) ───────────────────────
    let rsvpStats = null;
    try {
      const { count: totalRsvp } = await supabaseServer
        .from('rsvp_responses')
        .select('id', { count: 'exact', head: true });
      if (totalRsvp !== null) {
        const { data: recentRsvp } = await supabaseServer
          .from('rsvp_responses')
          .select('response')
          .limit(200);

        const responseMap = { attending: 0, declined: 0, maybe: 0 };
        for (const r of recentRsvp || []) {
          const key = r.response?.toLowerCase();
          if (key === 'attending' || key === 'yes' || key === 'accept') responseMap.attending++;
          else if (key === 'declined' || key === 'no') responseMap.declined++;
          else if (key === 'maybe' || key === 'pending') responseMap.maybe++;
        }

        rsvpStats = {
          total: totalRsvp || 0,
          breakdown: responseMap,
        };
      }
    } catch {
      // rsvp_responses table may not exist
    }

    // ── 5. Device Trends ─────────────────────────────────────
    const deviceMap = { Mobile: 0, Desktop: 0, Tablet: 0 };
    for (const v of recentViews || []) {
      const dev = categorizeDevice(null); // We don't have user_agent in the select
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      templateConversion,
      peakTraffic: {
        heatmap,
        dayNames,
        maxVal: maxHeatVal,
        peakHour,
        peakDay: dayNames[peakDay],
        topHours,
        dailyTotals,
      },
      engagementDepth: {
        avgViewsPerInvite,
        totalSlugsWithViews: viewCounts.length,
        distribution: engagementBuckets,
      },
      rsvpStats,
    });
  } catch (err) {
    console.error('[Admin Analytics Enhanced] Exception:', err);
    return NextResponse.json({ error: 'Failed to compute enhanced analytics.' }, { status: 500 });
  }
}
