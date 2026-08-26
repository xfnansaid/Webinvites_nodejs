import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Instant confirmation route — called directly by the PaymentBanner client
// handler after the Razorpay Checkout modal returns success. This is the
// critical-user-facing supplement recommended in the Razorpay docs: webhooks
// are the primary source of truth, but if webhook delivery is slow we don't
// want the customer to see a "DRAFT" watermark immediately after paying.
//
// Security: We verify the same HMAC-SHA256 signature Razorpay generates using
// RAZORPAY_KEY_SECRET across order_id | payment_id — see:
//   https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/verify-payment-signature
//
// If signature verification fails we do NOT mark paid — we return 400 and
// the user will still eventually be marked paid once the Razorpay webhook
// arrives (so this can't be forged).
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // SECURITY: Rate limit payment confirmations — 5 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `confirm-payment:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again.' },
      { status: 429 },
    );
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: 'RAZORPAY_KEY_SECRET missing' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing razorpay signature fields' },
        { status: 400 },
      );
    }

    // Signature generation per Razorpay SDK:
    //   hmac_sha256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Constant-time string compare
    if (
      expected.length !== razorpay_signature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(razorpay_signature, 'hex'),
      )
    ) {
      console.warn(
        `[confirm-payment] signature mismatch order=${razorpay_order_id}`,
      );
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 },
      );
    }

    // ---- Idempotency: first, see if this order already is marked paid
    // If yes, return success immediately without doing an UPDATE. This lets
    // the payment handler redirect to success cleanly even if the Razorpay
    // webhook already beat us to it, or if the user retries the page.
    const { data: existingInvite } = await supabaseServer
      .from('invitations')
      .select('id, slug, is_paid, razorpay_order_id, razorpay_payment_id, paid_at')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (existingInvite && existingInvite.is_paid) {
      // Already paid — do nothing and return success
      return NextResponse.json({
        status: 'ok',
        isPaid: true,
        slug: existingInvite.slug,
        alreadyPaid: true,
        id: existingInvite.id,
      });
    }

    if (!existingInvite) {
      // No row found for this razorpay_order_id in invitations. Typically
      // this means the draft was written to DB but the server returned
      // before the select could read it. We still return success so the
      // user does NOT see an error — the check-payment route on the success
      // page will poll & flip it soon, or the Razorpay webhook will.
      return NextResponse.json({
        status: 'ok',
        isPaid: false,
        pending: true,
        note: 'No invitation DB row found yet for this order — it will be marked paid shortly via webhook or polling.',
      });
    }

    // Mark invitation paid
    const { data, error } = await supabaseServer
      .from('invitations')
      .update({
        is_paid: true,
        razorpay_payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select('id, slug, is_paid')
      .maybeSingle();

    if (error) {
      console.error(
        '[confirm-payment] DB update failed',
        razorpay_order_id,
        error,
      );
      // If UPDATE failed (e.g. service role key is placeholder + RLS blocks
      // UPDATE), still return success — our fallback /api/check-payment/[id]
      // poll on the success page will keep trying.
      return NextResponse.json({
        status: 'ok',
        isPaid: false,
        pending: true,
        note: 'Could not update database (service role likely missing). Will be confirmed via webhook shortly.',
        error_code: error?.code || null,
        slug: existingInvite.slug,
      });
    }

    console.log(
      `[confirm-payment] ✅ Instant confirmation OK invitation=${data?.id || existingInvite.id} slug=${data?.slug || existingInvite.slug}`,
    );
    return NextResponse.json({
      status: 'ok',
      isPaid: (data && data.is_paid) || true,
      slug: (data && data.slug) || existingInvite.slug,
    });
  } catch (err) {
    console.error('[confirm-payment] route error', err);
    return NextResponse.json(
      { error: 'Confirmation server error' },
      { status: 500 },
    );
  }
}
