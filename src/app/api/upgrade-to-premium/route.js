import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/upgrade-to-premium
 *
 * Creates a Razorpay order for upgrading a free tier invitation to premium.
 * The order is tagged with purpose: 'upgrade_to_premium' so confirm-payment
 * can handle the tier flip after signature verification.
 *
 * Rules:
 * 1. User must be signed in and own the invitation.
 * 2. Invitation must be on the free tier (tier='free' or is_ad_supported=true).
 * 3. After payment, invitation is upgraded to premium (ad-free).
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `upgrade-premium:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    );
  }

  try {
    // SECURITY: Authentication MUST happen before any database queries or order creation.
    const { user } = await resolveSupabaseUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to upgrade your invitation.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Missing invitationId.' },
        { status: 400 },
      );
    }

    // SECURITY: Validate invitationId is a UUID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invitationId)) {
      return NextResponse.json(
        { error: 'Invalid invitation ID format.' },
        { status: 400 },
      );
    }

    // Fetch the invitation
    const { data: invitation, error: fetchError } = await supabaseServer
      .from('invitations')
      .select('id, slug, tier, is_ad_supported, is_paid, owner_id, owner_email, groom_name, bride_name, wedding_date')
      .eq('id', invitationId)
      .maybeSingle();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found.' },
        { status: 404 },
      );
    }

    // Ownership check
    const ownerEmail = user.email?.trim?.().toLowerCase?.()
      || user.user_metadata?.email?.trim?.().toLowerCase?.()
      || null;

    const isOwner = (invitation.owner_id && String(invitation.owner_id) === String(user.id))
      || (ownerEmail && invitation.owner_email && invitation.owner_email.toLowerCase() === ownerEmail);

    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to upgrade this invitation.' },
        { status: 403 },
      );
    }

    // Check if already premium
    const isAlreadyPremium = invitation.tier === 'premium'
      || invitation.is_ad_supported === false
      || (invitation.razorpay_payment_id && !invitation.razorpay_payment_id.startsWith('free_'));

    if (isAlreadyPremium) {
      return NextResponse.json(
        { error: 'This invitation is already on the premium tier.', code: 'ALREADY_PREMIUM' },
        { status: 400 },
      );
    }

    // Create Razorpay order for ₹399
    const order = await razorpay.orders.create({
      amount: 399 * 100, // ₹399 in paise
      currency: 'INR',
      receipt: `upgrade_${Date.now()}`,
      notes: {
        purpose: 'upgrade_to_premium',
        invitationId: invitation.id,
      },
    });

    // Update the invitation with the new order ID (so confirm-payment can find it)
    const { error: updateError } = await supabaseServer
      .from('invitations')
      .update({
        razorpay_order_id: order.id,
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('[upgrade-to-premium] Failed to update invitation with order ID:', updateError);
      // Non-fatal — the order was created, and confirm-payment will still work
      // if the user completes payment, even if the order_id link is stale.
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
      invitationId: invitation.id,
      slug: invitation.slug,
      groomName: invitation.groom_name,
      brideName: invitation.bride_name,
    });
  } catch (err) {
    console.error('[upgrade-to-premium] Fatal error:', err);
    return NextResponse.json(
      { error: 'Failed to create upgrade order. Please try again.' },
      { status: 500 },
    );
  }
}
