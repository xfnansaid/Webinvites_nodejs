import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/expiry-stats
 *
 * Admin-only endpoint returning:
 * - Total / free / premium invitation counts
 * - Expired free tier (paid_at + 21 days < now)
 * - Expired premium (wedding_date + 3 days < now)
 * - Revenue stats (total premium orders, upgrade conversions)
 * - List of recently expired invitations
 *
 * Requires admin authentication via ADMIN_EMAILS env var.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-expiry:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const now = new Date();
    const nowISO = now.toISOString();
    const todayStr = now.toISOString().split('T')[0];

    // ── Total counts ─────────────────────────────────────────
    const { count: totalCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true });

    const { count: freeCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'free');

    const { count: premiumCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium');

    const { count: draftCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('is_paid', false);

    // ── Expired free tier (paid_at + 21 days < now) ──────────
    const freeCutoff = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiredFree, count: expiredFreeCount } = await supabaseServer
      .from('invitations')
      .select('id, slug, groom_name, bride_name, paid_at, owner_email, wedding_date, tier', { count: 'exact' })
      .eq('tier', 'free')
      .eq('is_paid', true)
      .lt('paid_at', freeCutoff)
      .order('paid_at', { ascending: true })
      .limit(50);

    // ── Expiring soon (free tier, 18-21 days) ────────────────
    const expiringSoonStart = new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString();
    const { count: expiringSoonCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'free')
      .eq('is_paid', true)
      .gte('paid_at', expiringSoonStart)
      .lt('paid_at', freeCutoff);

    // ── Expired premium (wedding_date + 3 days < now) ────────
    const premiumCutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const premiumCutoffStr = premiumCutoffDate.toISOString().split('T')[0];
    const { data: expiredPremium, count: expiredPremiumCount } = await supabaseServer
      .from('invitations')
      .select('id, slug, groom_name, bride_name, wedding_date, owner_email, tier, razorpay_payment_id', { count: 'exact' })
      .eq('tier', 'premium')
      .lt('wedding_date', premiumCutoffStr)
      .order('wedding_date', { ascending: true })
      .limit(50);

    // ── Revenue stats ────────────────────────────────────────
    // Premium invitations with real Razorpay payment (not free_ prefixed)
    const { count: paidPremiumCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%');

    // Recent upgrades (premium paid in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentUpgradesCount } = await supabaseServer
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .not('razorpay_payment_id', 'like', 'free_%')
      .gte('paid_at', thirtyDaysAgo);

    // ── Tier distribution over time (last 7 days) ────────────
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPremium } = await supabaseServer
      .from('invitations')
      .select('paid_at, tier')
      .eq('tier', 'premium')
      .eq('is_paid', true)
      .gte('paid_at', sevenDaysAgo)
      .order('paid_at', { ascending: false });

    const { data: recentFree } = await supabaseServer
      .from('invitations')
      .select('paid_at, tier')
      .eq('tier', 'free')
      .eq('is_paid', true)
      .gte('paid_at', sevenDaysAgo)
      .order('paid_at', { ascending: false });

    // ── Build daily breakdown for last 7 days ────────────────
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const premiumOnDay = (recentPremium || []).filter(r => {
        const p = r.paid_at?.split('T')[0];
        return p >= dayStr && p < nextDay;
      }).length;
      const freeOnDay = (recentFree || []).filter(r => {
        const p = r.paid_at?.split('T')[0];
        return p >= dayStr && p < nextDay;
      }).length;
      dailyBreakdown.push({
        date: dayStr,
        premium: premiumOnDay,
        free: freeOnDay,
        total: premiumOnDay + freeOnDay,
      });
    }

    // ── Estimated revenue ────────────────────────────────────
    const REVENUE_PER_PREMIUM = 399; // ₹399 per premium invitation
    const estimatedRevenue = (paidPremiumCount || 0) * REVENUE_PER_PREMIUM;
    const recentRevenue = (recentUpgradesCount || 0) * REVENUE_PER_PREMIUM;

    return NextResponse.json({
      ok: true,
      stats: {
        total: totalCount || 0,
        free: freeCount || 0,
        premium: premiumCount || 0,
        drafts: draftCount || 0,
      },
      expiry: {
        expiredFree: expiredFreeCount || 0,
        expiredPremium: expiredPremiumCount || 0,
        expiringSoonFree: expiringSoonCount || 0,
        totalExpired: (expiredFreeCount || 0) + (expiredPremiumCount || 0),
      },
      revenue: {
        paidPremiumCount: paidPremiumCount || 0,
        recentUpgradesCount: recentUpgradesCount || 0,
        estimatedTotal: estimatedRevenue,
        recentRevenue,
      },
      dailyBreakdown,
      expiredFreeInvitations: (expiredFree || []).map(inv => ({
        id: inv.id,
        slug: inv.slug,
        groomName: inv.groom_name,
        brideName: inv.bride_name,
        paidAt: inv.paid_at,
        weddingDate: inv.wedding_date,
        ownerEmail: inv.owner_email,
        expiredDaysAgo: Math.floor((now.getTime() - new Date(inv.paid_at + '+00:00').getTime() - 21 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)),
      })),
      expiredPremiumInvitations: (expiredPremium || []).map(inv => ({
        id: inv.id,
        slug: inv.slug,
        groomName: inv.groom_name,
        brideName: inv.bride_name,
        weddingDate: inv.wedding_date,
        ownerEmail: inv.owner_email,
        isPaid: inv.razorpay_payment_id && !inv.razorpay_payment_id.startsWith('free_'),
      })),
    });
  } catch (err) {
    console.error('[Admin Expiry Stats] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch expiry stats.' },
      { status: 500 }
    );
  }
}
