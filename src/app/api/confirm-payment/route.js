import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // ---- Idempotency check:
    // Only return alreadyPaid if the invitation is already paid AND already premium ad-free
    const { data: existingInvite } = await supabaseServer
      .from('invitations')
      .select('id, slug, is_paid, tier, is_ad_supported, razorpay_order_id, razorpay_payment_id, paid_at')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (
      existingInvite &&
      existingInvite.is_paid &&
      existingInvite.tier === 'premium' &&
      existingInvite.is_ad_supported === false &&
      existingInvite.razorpay_payment_id === razorpay_payment_id
    ) {
      return NextResponse.json({
        status: 'ok',
        isPaid: true,
        tier: 'premium',
        isAdSupported: false,
        slug: existingInvite.slug,
        alreadyPaid: true,
        id: existingInvite.id,
      });
    }

    if (!existingInvite) {
      return NextResponse.json({
        status: 'ok',
        isPaid: false,
        pending: true,
        note: 'No invitation DB row found yet for this order — it will be marked paid shortly via webhook or polling.',
      });
    }

    // Mark invitation paid and upgrade to premium (ad-free)
    // Also reactivate if previously expired (is_active=false), and reset
    // paid_at so the new premium tier gets a fresh hosting window.
    const updatePayload = {
      is_paid: true,
      tier: 'premium',
      is_ad_supported: false,
      ad_removed_at: new Date().toISOString(),
      razorpay_payment_id: razorpay_payment_id,
      paid_at: new Date().toISOString(),
      is_active: true,
    };

    let { data, error } = await supabaseServer
      .from('invitations')
      .update(updatePayload)
      .eq('razorpay_order_id', razorpay_order_id)
      .select('id, slug, is_paid, tier, is_ad_supported')
      .maybeSingle();

    if (error) {
      // Fallback if tier/is_ad_supported columns don't exist yet
      const fallbackPayload = {
        is_paid: true,
        razorpay_payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString(),
      };
      const retry = await supabaseServer
        .from('invitations')
        .update(fallbackPayload)
        .eq('razorpay_order_id', razorpay_order_id)
        .select('id, slug, is_paid')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

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

    // ========================================================================
    //  REFERRAL REWARD LOOP (HOLE #3b PART 3)
    //  Runs ONLY AFTER successful HMAC-verified Razorpay signature + successful DB
    //  payment UPDATE.  The ENTIRE BLOCK wrapped in try/catch + inner  → ANY error
    //  here is swallowed so payment confirmation never fails for the client.
    // ========================================================================
    try {
      const cookieStore = await cookies();
      const viaRaw = cookieStore.get('referrer_via')?.value;
      let viaClean = typeof viaRaw === 'string' ? viaRaw.trim() : '';

      // BELT-AND-BRACES: If the cookie was cleared (e.g. user switched browsers,
      // cleared cookies, or cookie expired between save-draft and payment),
      // fall back to the referred_by_slug column saved directly on the
      // invitation row itself by /api/save-draft.  This way attribution
      // survives ANY client-side state loss.
      if (!viaClean) {
        const rowVia = (existingInvite && existingInvite.referred_by_slug) ? String(existingInvite.referred_by_slug).trim() : '';
        if (rowVia && rowVia.length >= 3 && rowVia.length <= 160) {
          viaClean = rowVia;
        }
      }

      if (viaClean && viaClean.length >= 3 && viaClean.length <= 160) {
        const currentSlug = data && data.slug ? data.slug : existingInvite.slug;
        const currentOwnerId = existingInvite.owner_id || null;
        const currentOwnerEmail = (existingInvite.owner_email || '').toLowerCase();

        // 1. Fetch the REFERRER invitation row (the one shared via WhatsApp)
        const { data: referrerInvite } = await supabaseServer
          .from('invitations')
          .select('id, slug, owner_id, owner_email, owner_phone, template_id, is_paid, tier, is_ad_supported')
          .eq('slug', viaClean)
          .maybeSingle();

        if (referrerInvite) {
          const referrerOwnerId    = referrerInvite.owner_id || null;
          const referrerOwnerEmail = (referrerInvite.owner_email || '').toLowerCase();

          // ── Anti-self-referral guards ──────────────────────────────
          const sameOwnerByOwnerId   = Boolean(currentOwnerId && referrerOwnerId && String(currentOwnerId) === String(referrerOwnerId));
          const sameOwnerByEmail    = Boolean(currentOwnerEmail && referrerOwnerEmail && currentOwnerEmail === referrerOwnerEmail);
          const sameSlug           = String(referrerInvite.slug || '').toLowerCase() === String(currentSlug || '').toLowerCase();
          const isSelfReferral    = sameOwnerByOwnerId || sameOwnerByEmail || sameSlug;

          if (!isSelfReferral) {
            // 2. Tag this PAID invitation as referred — set referred_by_slug
            //    (best-effort, column may not be migrated on live DB yet)
            try {
              const tagRes = await supabaseServer
                .from('invitations')
                .update({ referred_by_slug: viaClean })
                .eq('razorpay_order_id', razorpay_order_id);
              void tagRes;
            } catch {}

            // 3. Idempotency: build deterministic "reward slug" from the pair
            //    → if it already exists, we already granted → skip silently
            const currentIdSafe = String(currentSlug || String(existingInvite.id || 'x'))
              .replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
            const viaSafe = String(viaClean || 'ref').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
            const rewardSlugBase = ('referral-bonus-' + viaSafe + '-' + currentIdSafe)
              .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'referral-bonus-' + Date.now();

            let alreadyGranted = false;
            try {
              const { count: existingRewardCount } = await supabaseServer
                .from('invitations')
                .select('id', { count: 'exact', head: true })
                .ilike('slug', rewardSlugBase + '%');
              alreadyGranted = Number(existingRewardCount) > 0;
            } catch (chkErr) {
              alreadyGranted = false;
            }

            if (!alreadyGranted) {
              // 4. Grant: generate the REFERRER — build a premium reward row
              const nowISO = new Date().toISOString();
              const rewardTemplateId = referrerInvite.template_id || 'standard-crimson';
              const rewardOwnerName = referrerOwnerEmail
                ? referrerOwnerEmail.split('@')[0]
                : (referrerOwnerId ? 'Guest' : 'Loyal User');
              const tdNote = 'FREE PREMIUM invitation earned by referral program';
              const baseReward = {
                template_id: rewardTemplateId,
                groom_name: '🎁 Referral Bonus — ' + String(rewardOwnerName || 'Guest'),
                bride_name: tdNote,
                wedding_date: new Date(Date.now() + 60*60*24*30*1000).toISOString().split('T')[0],
                wedding_time: '11:00 AM',
                hero_tagline: 'Referral reward — your FREE PREMIUM invitation',
                hero_event_text: 'You earned this by sharing your invite with friends & family',
                countdown_title: 'Thank you for sharing the love!',
                is_paid: true,
                tier: 'premium',
                is_ad_supported: false,
                paid_at: nowISO,
                is_active: true,
                status: 'referral_reward',
                razorpay_order_id: 'reward_' + (razorpay_order_id || ('order_' + Date.now())),
                razorpay_payment_id: 'reward_' + (razorpay_payment_id || ('pay_' + Date.now())),
                ...(referrerOwnerId ? { owner_id: referrerOwnerId } : {}),
                ...(referrerInvite.owner_email ? { owner_email: referrerInvite.owner_email } : {}),
                ...(referrerInvite.owner_phone ? { owner_phone: referrerInvite.owner_phone } : {}),
              };

              // Iterative 42703 column-drop insert (same belt-and-braces pattern
              // pattern as PATCH /api/invitations/[id])
              let attempt = { ...baseReward, slug: rewardSlugBase };
              let rewardDone = null;
              for (let tries = 0; tries < 12; tries += 1) {
                const ins = await supabaseServer
                  .from('invitations')
                  .insert([attempt])
                  .select('id, slug, owner_id')
                  .maybeSingle();
                if (!ins.error) { rewardDone = ins.data; break; }
                const msg = String(ins.error?.message || '');
                if (ins.error?.code === '42703' || /column/.test(msg)) {
                  const m = msg.match(/column\s+"?([^"\s)]+)"?\s+of\s+relation/i);
                  const bad = (m && m[1]) ? m[1] : null;
                  if (bad && Object.prototype.hasOwnProperty.call(attempt, bad)) { delete attempt[bad]; continue; }
                }
                if (/duplicate|23505|unique.*slug/i.test(msg)) {
                  attempt.slug = rewardSlugBase + '-' + Math.random().toString(36).slice(2, 6);
                  continue;
                }
                break;
              }
              if (rewardDone) {
                console.log(
                  '[confirm-payment] 🎁 REFERRAL REWARD OK: ' +
                  'referrer_slug=' + viaClean +
                  ' reward_id=' + String(rewardDone.id) +
                  ' reward_slug=' + rewardDone.slug +
                  ' triggered_by=' + String(currentSlug || existingInvite.id)
                );
              }
            }
          }
        }
      }
    } catch (referralErr) {
      // ⚠️  HARD RULE:  referral reward subsystem FAILURE MUST NEVER LEAK
      //    UP INTO THE PAYMENT RESPONSE.  The customer's payment was captured
      //    successfully — that is the only thing that matters at this point.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[confirm-payment] referral/reward logic skipped (non-fatal):', referralErr?.message || referralErr);
      }
    }

    // ALWAYS clear the referral cookie on the response after payment so even if reward
    // grant failed (e.g. missing migration), we won't keep trying on future payments
    // made from the same browser.
    let responseCookies = [];
    try {
      const ck = await cookies();
      if (ck.get('referrer_via')?.value) {
        responseCookies.push('referrer_via=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax' + (process.env.NODE_ENV === 'production' ? '; Secure' : ''));
      }
    } catch {}

    console.log(
      `[confirm-payment] ✅ Instant confirmation OK invitation=${data?.id || existingInvite.id} slug=${data?.slug || existingInvite.slug}`,
    );
    const responseJson = {
      status: 'ok',
      isPaid: (data && data.is_paid) || true,
      slug: (data && data.slug) || existingInvite.slug,
    };
    const response = NextResponse.json(responseJson);
    for (const setCookie of responseCookies) {
      try { response.headers.append('Set-Cookie', setCookie); } catch {}
    }
    return response;
  } catch (err) {
    console.error('[confirm-payment] route error', err);
    return NextResponse.json(
      { error: 'Confirmation server error' },
      { status: 500 },
    );
  }
}
