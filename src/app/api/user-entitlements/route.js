import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user-entitlements
 *
 * Checks how many free & paid templates the signed-in user has published.
 *
 * Entitlement Rule:
 * - Each user gets up to 3 Free Template publications (tier: 'free', is_ad_supported: true).
 * - For a 4th or subsequent template, the user must pay ₹399.
 * - If the user is editing their existing published free template, re-publishing is always free.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `entitlements:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 },
    );
  }

  try {
    const { user } = await resolveSupabaseUser(request);

    if (!user) {
      return NextResponse.json({
        signedIn: false,
        canPublishFree: true, // Anonymous users will be prompted to sign in first
        freePublishedCount: 0,
        paidPublishedCount: 0,
        totalPublishedCount: 0,
        pricePerTemplate: 399,
      });
    }

    const ownerId = user.id;
    const ownerEmail = user.email?.trim().toLowerCase() || null;

    // Find all invitations published by this user
    // (matches owner_id OR owner_email to catch any linked accounts)
    let query = supabaseServer
      .from('invitations')
      .select('id, slug, tier, is_ad_supported, is_paid, created_at');

    if (ownerEmail) {
      query = query.or(`owner_id.eq.${ownerId},owner_email.eq.${ownerEmail}`);
    } else {
      query = query.eq('owner_id', ownerId);
    }

    let { data: invitations, error } = await query;

    if (error && error.code === '42703') {
      // Column 'tier' or 'is_ad_supported' does not exist yet in DB table -> fallback to standard columns
      let fallbackQuery = supabaseServer
        .from('invitations')
        .select('id, slug, is_paid, created_at');

      if (ownerEmail) {
        fallbackQuery = fallbackQuery.or(`owner_id.eq.${ownerId},owner_email.eq.${ownerEmail}`);
      } else {
        fallbackQuery = fallbackQuery.eq('owner_id', ownerId);
      }

      const fallbackRes = await fallbackQuery;
      invitations = fallbackRes.data || [];
      error = fallbackRes.error;
    } else if (error) {
      console.warn('[user-entitlements] query error:', error);
    }

    const list = invitations || [];
    // A published invite is one where is_paid is true (or tier is free/premium)
    const publishedInvites = list.filter((inv) => inv.is_paid || inv.tier === 'free');
    const freePublishedCount = publishedInvites.filter((inv) => inv.tier === 'free' || inv.is_ad_supported !== false).length;
    const paidPublishedCount = publishedInvites.filter((inv) => inv.tier === 'premium' || inv.is_ad_supported === false).length;

    // Entitlement Rules:
    // 1. User can publish up to 3 free templates (freePublishedCount < 3).
    // 2. Once they have 3 free published templates, publishing an additional (4th) template requires paying ₹399.
    // 3. If they delete a free template from dashboard, a free publishing slot is unlocked.
    const canPublishFree = freePublishedCount < 3;

    return NextResponse.json({
      signedIn: true,
      userId: user.id,
      canPublishFree,
      freePublishedCount,
      paidPublishedCount,
      totalPublishedCount: publishedInvites.length,
      pricePerTemplate: 399,
      publishedInvites: publishedInvites.map((inv) => ({
        id: inv.id,
        slug: inv.slug,
        tier: inv.tier || (inv.is_ad_supported ? 'free' : 'premium'),
        isAdSupported: inv.is_ad_supported !== false,
      })),
    });
  } catch (err) {
    console.error('[user-entitlements] unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch entitlements', details: err.message },
      { status: 500 },
    );
  }
}
