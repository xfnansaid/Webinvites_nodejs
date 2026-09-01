import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function categorizeReferrer(referrer) {
  if (!referrer || referrer === '' || referrer === 'null') return 'Direct / Link Copy';
  const r = referrer.toLowerCase();
  if (r.includes('whatsapp') || r.includes('wa.me')) return 'WhatsApp';
  if (r.includes('instagram') || r.includes('ig')) return 'Instagram';
  if (r.includes('facebook') || r.includes('fb.com')) return 'Facebook';
  if (r.includes('google')) return 'Google Search';
  if (r.includes('twitter') || r.includes('t.co') || r.includes('x.com')) return 'X (Twitter)';
  if (r.includes('telegram')) return 'Telegram';
  try {
    const url = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'Other Web';
  }
}

function categorizeDevice(ua) {
  if (!ua) return 'Mobile';
  const u = ua.toLowerCase();
  if (u.includes('ipad') || u.includes('tablet')) return 'Tablet';
  if (u.includes('mobile') || u.includes('iphone') || u.includes('android')) return 'Mobile';
  return 'Desktop';
}

/**
 * GET /api/admin/analytics
 *
 * Provides traffic trends, top viewed slugs, device splits, referrers,
 * and template popularity breakdown for the Admin Command Center.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-analytics:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch total page views count
    const { count: totalViewsCount } = await supabaseServer
      .from('page_views')
      .select('id', { count: 'exact', head: true });

    // 2. Fetch recent page views (last 14 days)
    const { data: recentViews, error: pvError } = await supabaseServer
      .from('page_views')
      .select('slug, user_agent, referrer, created_at')
      .gte('created_at', fourteenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (pvError) {
      console.warn('[Admin Analytics] page_views query warning:', pvError.message);
    }

    const views = recentViews || [];

    // Daily views breakdown (last 14 days)
    const dailyViews = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const count = views.filter((v) => {
        const c = v.created_at?.split('T')[0];
        return c >= dayStr && c < nextDay;
      }).length;

      dailyViews.push({
        date: dayStr,
        views: count,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
      });
    }

    // Slug frequency (top 10 most visited)
    const slugMap = {};
    const referrerMap = {};
    const deviceMap = { Mobile: 0, Desktop: 0, Tablet: 0 };

    for (const v of views) {
      if (v.slug) {
        slugMap[v.slug] = (slugMap[v.slug] || 0) + 1;
      }
      const refCategory = categorizeReferrer(v.referrer);
      referrerMap[refCategory] = (referrerMap[refCategory] || 0) + 1;

      const devCategory = categorizeDevice(v.user_agent);
      deviceMap[devCategory] = (deviceMap[devCategory] || 0) + 1;
    }

    const topSlugs = Object.entries(slugMap)
      .map(([slug, count]) => ({ slug, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const topReferrers = Object.entries(referrerMap)
      .map(([source, count]) => ({
        source,
        count,
        percentage: views.length > 0 ? Math.round((count / views.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Fetch template distribution & feature adoption
    const { data: allInvites } = await supabaseServer
      .from('invitations')
      .select('template_id, tier, photo_url, template_data');

    const templateMap = {};
    let withPhoto = 0;
    let withAudio = 0;
    let withRsvp = 0;
    const totalInvites = (allInvites || []).length;

    for (const inv of allInvites || []) {
      const tId = inv.template_id || 'unspecified';
      if (!templateMap[tId]) {
        templateMap[tId] = { total: 0, free: 0, premium: 0 };
      }
      templateMap[tId].total += 1;
      if (inv.tier === 'free') templateMap[tId].free += 1;
      else templateMap[tId].premium += 1;

      if (inv.photo_url || inv.template_data?.photoUrl || inv.template_data?.heroImage) {
        withPhoto += 1;
      }
      if (inv.template_data?.musicTrack || inv.template_data?.audioTrack) {
        withAudio += 1;
      }
      if (inv.template_data?.showRsvp !== false) {
        withRsvp += 1;
      }
    }

    const templatePopularity = Object.entries(templateMap)
      .map(([templateId, counts]) => ({
        templateId,
        total: counts.total,
        free: counts.free,
        premium: counts.premium,
        percentage: totalInvites > 0 ? Math.round((counts.total / totalInvites) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      ok: true,
      traffic: {
        totalViews: totalViewsCount || views.length,
        recentViewsCount: views.length,
        dailyViews,
        topSlugs,
        topReferrers,
        devices: deviceMap,
      },
      templates: {
        totalInvitations: totalInvites,
        templatePopularity,
        featureAdoption: {
          photoPercentage: totalInvites > 0 ? Math.round((withPhoto / totalInvites) * 100) : 0,
          audioPercentage: totalInvites > 0 ? Math.round((withAudio / totalInvites) * 100) : 0,
          rsvpPercentage: totalInvites > 0 ? Math.round((withRsvp / totalInvites) * 100) : 0,
          withPhoto,
          withAudio,
          withRsvp,
        },
      },
    });
  } catch (err) {
    console.error('[Admin Analytics] Exception:', err);
    return NextResponse.json({ error: 'Failed to aggregate analytics.' }, { status: 500 });
  }
}
