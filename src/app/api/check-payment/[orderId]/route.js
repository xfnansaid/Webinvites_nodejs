import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { resolveSupabaseUser } from '@/lib/auth-server';

// On-demand payment status checker — used by the customer success page
// (/i/slug?success=true) when `is_paid` is still false even after a moment
// (e.g. confirm-payment failed, webhook was delayed, service_role key is a
// placeholder, or the user closed the tab before the handler ran).
//
// This route is the FINAL FALLBACK after confirm-payment + webhook. It
// directly calls Razorpay /orders/:id to get the source-of-truth payment
// status and updates Supabase accordingly.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  // SECURITY: Rate limit payment status checks — 10 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `check-payment:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again.' }, { status: 429 });
  }

  try {
    const { orderId } = params || {};
    if (!orderId || typeof orderId !== 'string' || orderId.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid orderId' },
        { status: 400 },
      );
    }

    // SECURITY: Verify the user owns this order before checking payment status.
    // This prevents IDOR — users can't check payment status of other users' orders.
    const { user } = await resolveSupabaseUser(request);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Please sign in to check payment status.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Look up the invitation to verify ownership
    const { data: ownershipCheck } = await supabaseServer
      .from('invitations')
      .select('id, owner_id, owner_email')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (!ownershipCheck) {
      return NextResponse.json(
        { ok: false, error: 'Order not found.' },
        { status: 404 },
      );
    }

    // Verify ownership: owner_id matches, or owner_email matches
    const userEmail = user.email?.trim?.().toLowerCase?.() || user.user_metadata?.email?.trim?.().toLowerCase?.() || null;
    const isOwner = (ownershipCheck.owner_id && String(ownershipCheck.owner_id) === String(user.id))
      || (userEmail && ownershipCheck.owner_email && ownershipCheck.owner_email.toLowerCase() === userEmail);

    if (!isOwner) {
      return NextResponse.json(
        { ok: false, error: 'Not authorized to check this payment.' },
        { status: 403 },
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Razorpay API keys are not configured on the server.',
          isPaid: null,
        },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 1 & 2. Razorpay order status + Supabase lookup are independent —
    // run them in parallel to halve the latency.
    const [order, { data: invitation, error: selectErr }] = await Promise.all([
      razorpay.orders.fetch(orderId),
      supabaseServer
        .from('invitations')
        .select('id, slug, is_paid, razorpay_order_id, razorpay_payment_id, paid_at')
        .eq('razorpay_order_id', orderId)
        .maybeSingle(),
    ]);
    const isRazorpayPaid = String(order?.status || '').toLowerCase() === 'paid';
    const orderAmount = order?.amount_paid ?? order?.amount ?? null;

    if (selectErr || !invitation) {
      return NextResponse.json({
        ok: true,
        isPaid: !!isRazorpayPaid,
        razorpay: { status: order?.status, amountPaid: orderAmount },
        note: 'No invitation row found for this order_id in Supabase.',
      });
    }

    // 3. If Razorpay says PAID, ensure the DB row is marked paid AND upgraded to premium ad-free
    let dbUpdateFailed = false;
    let dbUpdateErr = null;
    const needsUpgrade = !invitation.is_paid || invitation.tier !== 'premium' || invitation.is_ad_supported !== false;

    if (isRazorpayPaid && needsUpgrade) {
      const payload = {
        is_paid: true,
        tier: 'premium',
        is_ad_supported: false,
        ad_removed_at: new Date().toISOString(),
        paid_at: invitation.paid_at || new Date().toISOString(),
      };
      // Pull the latest payment_id attached to this order if we can
      try {
        const payments = await razorpay.orders.fetchPayments(orderId);
        const firstPaid = Array.isArray(payments?.items)
          ? payments.items.find(p => p.status === 'captured')
          : null;
        if (firstPaid?.id) payload.razorpay_payment_id = firstPaid.id;
      } catch (_) { /* ignore */ }

      let { error: updErr } = await supabaseServer
        .from('invitations')
        .update(payload)
        .eq('id', invitation.id);

      if (updErr && (updErr.code === '42703' || updErr.message?.toLowerCase().includes('tier'))) {
        const fallbackPayload = {
          is_paid: true,
          paid_at: invitation.paid_at || new Date().toISOString(),
          ...(payload.razorpay_payment_id ? { razorpay_payment_id: payload.razorpay_payment_id } : {}),
        };
        const retry = await supabaseServer
          .from('invitations')
          .update(fallbackPayload)
          .eq('id', invitation.id);
        updErr = retry.error;
      }

      if (updErr) {
        dbUpdateFailed = true;
        dbUpdateErr = updErr;
      } else {
        invitation.is_paid = true;
        invitation.tier = 'premium';
        invitation.is_ad_supported = false;
      }
    }

    return NextResponse.json({
      ok: true,
      slug: invitation.slug,
      isPaid: !!invitation.is_paid,
      razorpay: {
        status: order?.status,
        amountPaid: orderAmount,
        amountDue: order?.amount_due ?? null,
      },
      dbUpdateFailed,
      // If service_role key is a placeholder the DB UPDATE will fail with RLS
      // 42501, so we tell the client this clearly instead of silent false.
      hint: dbUpdateFailed && !isServiceRoleConfigured()
        ? 'Server needs SUPABASE_SERVICE_ROLE_KEY pasted in env vars OR a Razorpay webhook delivery to mark paid automatically. Please wait 10 seconds for webhook, it can still mark this paid asynchronously.'
        : dbUpdateFailed
        ? `DB update failed: ${dbUpdateErr?.message || dbUpdateErr?.code || 'unknown'}`
        : invitation.is_paid
        ? 'Invitation is now live & watermark removed.'
        : 'Razorpay has not captured payment yet.',
    });
  } catch (err) {
    console.error('[check-payment] route error', err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Unexpected error checking payment status',
        code: err?.code || null,
        isPaid: null,
      },
      { status: 500 },
    );
  }
}
