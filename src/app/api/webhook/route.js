import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';

// Razorpay Webhook route. Read Razorpay docs at:
//   https://razorpay.com/docs/webhooks
//
// Configured events recommended on Razorpay Dashboard:
//   - order.paid         (PRIMARY, authoritative source per docs)
//   - payment.captured   (fallback)
//   - payment.failed     (analytics only, no DB action)
//
// Webhook must be on port 443 (HTTPS) only.
// The env var RAZORPAY_WEBHOOK_SECRET is a PASSWORD YOU CREATE in the
// dashboard webhook form (40+ chars, alphanumeric+symbols). Do NOT paste the
// URL there.
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookEventId = request.headers.get('x-razorpay-event-id') || null;

    if (!secret) {
      console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured in environment variables');
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
    }

    // 1. Verify Signature (constant-time compare)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const sigOk =
      typeof signature === 'string' &&
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );

    if (!sigOk) {
      console.warn('[razorpay-webhook] invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventName = event.event;
    const eventId = event.id || webhookEventId;

    // 2. Non-success events → just return 200 OK (Razorpay retries on non-2xx)
    if (eventName !== 'payment.captured' && eventName !== 'order.paid') {
      console.log(`[razorpay-webhook] received non-success event ${eventName}, HTTP 200`);
      return NextResponse.json({ status: 'ok', ack: true, event: eventName, eventId });
    }

    // 3. Extract order id and/or payment id
    const payment = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const orderId = payment?.order_id || orderEntity?.id || null;
    const paymentId = payment?.id || null;

    if (!orderId) {
      console.warn('[razorpay-webhook] success event has no order_id, skipping');
      return NextResponse.json({ error: 'No order id on success event' }, { status: 400 });
    }

    // SECURITY: Verify the payment amount matches expected price (₹399 = 39900 paise).
    // This prevents an attacker from creating a ₹1 order and getting premium for cheap.
    const orderAmount = orderEntity?.amount || payment?.amount;
    const expectedAmount = 399 * 100; // ₹399 in paise
    if (orderAmount && orderAmount !== expectedAmount) {
      console.warn(`[razorpay-webhook] Amount mismatch: got ${orderAmount}, expected ${expectedAmount} for order ${orderId}`);
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // === IDEMPOTENCY GUARD ================================================
    // Before doing any UPDATE, see if this row is already marked paid
    // (either because confirm-payment ran first, or this is a Razorpay retry
    // after we replied 200 but Razorpay timed out waiting for the response).
    // We store razorpay_webhook_event_id so if Razorpay sends the exact
    // same event id twice a second later we just return 200 OK.
    const { data: existingInvite } = await supabaseServer
      .from('invitations')
      .select('id, slug, is_paid, razorpay_order_id, razorpay_payment_id, razorpay_webhook_event_id, paid_at')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (!existingInvite) {
      // Shouldn't happen but we just HTTP 200 — no need for Razorpay to keep
      // retrying a row that simply doesn't exist locally yet.
      console.warn(`[razorpay-webhook] no invitation row for order_id ${orderId}`);
      return NextResponse.json({ status: 'ok', eventId, orderId, note: 'No local row yet' });
    }

    if (existingInvite.is_paid && existingInvite.razorpay_webhook_event_id === eventId) {
      // Exact duplicate webhook delivery (Razorpay retry). Return 200 & do nothing.
      return NextResponse.json({
        status: 'ok',
        eventId,
        alreadyPaid: true,
        idempotent: true,
        slug: existingInvite.slug,
      });
    }

    if (existingInvite.is_paid) {
      // Already paid via confirm-payment or earlier webhook — we only need to
      // backfill razorpay_webhook_event_id & possibly razorpay_payment_id for
      // later forensic audits. Do a lightweight update only; skip if it fails.
      try {
        await supabaseServer
          .from('invitations')
          .update({
            razorpay_webhook_event_id: eventId || existingInvite.razorpay_webhook_event_id,
            razorpay_payment_id: paymentId || existingInvite.razorpay_payment_id,
          })
          .eq('id', existingInvite.id);
      } catch (_) { /* audit-only; ignore */ }
      return NextResponse.json({
        status: 'ok',
        eventId,
        alreadyPaid: true,
        slug: existingInvite.slug,
      });
    }

    // === PRIMARY ACTION: flip is_paid for the first time ================
    const updatePayload = {
      is_paid: true,
      tier: 'premium',
      is_ad_supported: false,
      paid_at: new Date().toISOString(),
    };
    if (paymentId) updatePayload.razorpay_payment_id = paymentId;
    if (eventId) updatePayload.razorpay_webhook_event_id = eventId;

    let { data, error } = await supabaseServer
      .from('invitations')
      .update(updatePayload)
      .eq('id', existingInvite.id)
      .select('id, slug, is_paid')
      .maybeSingle();

    if (error && (error.code === '42703' || error.message?.toLowerCase().includes('tier'))) {
      const fallbackPayload = {
        is_paid: true,
        paid_at: new Date().toISOString(),
      };
      if (paymentId) fallbackPayload.razorpay_payment_id = paymentId;
      if (eventId) fallbackPayload.razorpay_webhook_event_id = eventId;
      const retry = await supabaseServer
        .from('invitations')
        .update(fallbackPayload)
        .eq('id', existingInvite.id)
        .select('id, slug, is_paid')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error && !isServiceRoleConfigured()) {
      // Service role key is a placeholder → RLS blocks UPDATE.
      // This is NOT a failure: client-side check-payment fallback polls for
      // up to 30s and will flip the flag eventually. Still, we log loud so
      // operators notice and paste the service key.
      console.warn(
        `[razorpay-webhook] DB UPDATE blocked by RLS for order=${orderId}. ` +
          `Fix: paste real SUPABASE_SERVICE_ROLE_KEY into env vars. ` +
          `Client-side polling will still mark paid via check-payment route. code=${error?.code}`,
      );
      // Return 200 OK anyway — don't make Razorpay hammer us.
      return NextResponse.json({
        status: 'ok',
        eventId,
        pending: true,
        note: 'DB blocked by RLS; client-side polling or confirm-payment will handle.',
      });
    }

    if (error) {
      console.error('[razorpay-webhook] DB update error:', error);
      // Return 500 so Razorpay retries (per their docs they retry several times).
      return NextResponse.json({ error: 'Database update failed', code: error?.code }, { status: 500 });
    }

    console.log(
      `[razorpay-webhook] ✅ ${eventName} processed id=${data?.id || existingInvite.id} slug=${data?.slug || existingInvite.slug} eventId=${eventId}`,
    );
    return NextResponse.json({
      status: 'ok',
      eventId,
      event: eventName,
      slug: data?.slug || existingInvite.slug,
      isPaid: (data && data.is_paid) || true,
    });
  } catch (error) {
    console.error('[razorpay-webhook] unhandled route error:', error);
    // Always return 500 on unexpected exceptions so Razorpay retries.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
