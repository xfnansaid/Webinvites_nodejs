import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server';

// On-demand payment status checker — used by the customer success page
// (/i/slug?success=true) when `is_paid` is still false even after a moment
// (e.g. confirm-payment failed, webhook was delayed, service_role key is a
// placeholder, or the user closed the tab before the handler ran).
//
// This route is the FINAL FALLBACK after confirm-payment + webhook. It
// directly calls Razorpay /orders/:id to get the source-of-truth payment
// status and updates Supabase accordingly.
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { orderId } = params || {};
    if (!orderId || typeof orderId !== 'string' || orderId.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid orderId' },
        { status: 400 },
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

    // 1. Pull order status from Razorpay (source of truth)
    const order = await razorpay.orders.fetch(orderId);
    const isRazorpayPaid = String(order?.status || '').toLowerCase() === 'paid';
    const orderAmount = order?.amount_paid ?? order?.amount ?? null;

    // 2. Find the invitation row by razorpay_order_id
    const { data: invitation, error: selectErr } = await supabaseServer
      .from('invitations')
      .select('id, slug, is_paid, razorpay_order_id, razorpay_payment_id, paid_at')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (selectErr || !invitation) {
      return NextResponse.json({
        ok: true,
        isPaid: !!isRazorpayPaid,
        razorpay: { status: order?.status, amountPaid: orderAmount },
        note: 'No invitation row found for this order_id in Supabase.',
      });
    }

    // 3. If Razorpay says PAID but DB says is_paid=false, flip it now.
    //    If service role is not configured this will return a clear error
    //    telling the user to wait for the webhook.
    let dbUpdateFailed = false;
    let dbUpdateErr = null;
    if (isRazorpayPaid && !invitation.is_paid) {
      const payload = {
        is_paid: true,
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

      const { error: updErr } = await supabaseServer
        .from('invitations')
        .update(payload)
        .eq('id', invitation.id);

      if (updErr) {
        dbUpdateFailed = true;
        dbUpdateErr = updErr;
      } else {
        invitation.is_paid = true;
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
