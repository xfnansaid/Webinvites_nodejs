'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, Loader2, Sparkles, X, Copy, Check, LogIn } from 'lucide-react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth, userInitials } from '@/lib/auth';
import {
  saveStagedEdits,
  consumeForPublishStagedEdits,
  discardStagedEdits,
  STAGE_MAX_AGE_MS,
} from '@/lib/stage-edits';

// Poll with exponential backoff for window.Razorpay being ready after the
// checkout.js script injects. Ad blockers / corporate proxies sometimes
// block checkout.razorpay.com, so we fail cleanly with a troubleshooting
// message instead of throwing "window.Razorpay is not a constructor".
function waitForRazorpay(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let delay = 50;
    const tick = () => {
      if (typeof window !== 'undefined' && typeof window.Razorpay === 'function') {
        resolve(true);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(
          new Error(
            'Razorpay checkout script could not be loaded. Disable your ad blocker or privacy extension and refresh the page. ' +
              'If on a corporate/school network, checkout.razorpay.com may be blocked by a proxy.',
          ),
        );
        return;
      }
      delay = Math.min(delay * 2, 500);
      setTimeout(tick, delay);
    };
    tick();
  });
}

// Stage current formData to localStorage AND kick off the Google OAuth flow.
// After the Google redirect round-trip lands on /signin → signed-in → router.replace
// (back to `returnTo`). This component auto-detects staged data on mount and resumes
// the publish flow via handlePay within ~350ms (see the useEffect above handlePay).
//
// Before redirecting we also save a server-side "draft" row to Supabase so the
// user's edited template data is PERMANENTLY linked to their account after
// sign-in, not just in browser localStorage. See /api/save-draft.
async function stageEditsAndRedirect({
  formData,
  templateId,
  existingInvitationId,
  router,
  signInWithGoogle,
  session,
}) {
  if (typeof window === 'undefined') return;
  const returnTo = window.location.pathname + window.location.search;

  // Tier 1 — save to localStorage first (instant, always works, used for the
  // Live Editor to restore groom/bride/date fields before any server call completes).
  const stage = {
    formData: { ...formData },
    templateId,
    existingInvitationId: existingInvitationId || null,
    returnTo,
  };
  saveStagedEdits(stage);

  // Tier 2 (best-effort) — save the same form as an anonymous draft in Supabase.
  // If this succeeds we store draftId + temp_owner_token into the stage object
  // so after the Google redirect round-trip the client can call /api/claim-draft
  // to flip owner_id on the draft to the newly-signed-in user, making it show up
  // on their dashboard as an Unpaid Draft forever.
  try {
    const accessToken = session?.access_token || null;
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch('/api/save-draft', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({
        formData: { ...formData },
        templateId,
        existingInvitationId: existingInvitationId || null,
        returnTo,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.ok && data.tempOwnerToken) {
      saveStagedEdits({
        ...stage,
        draftId: data.draftId || null,
        tempOwnerToken: data.tempOwnerToken,
      });
    }
  } catch (serverSaveErr) {
    // Best-effort only. localStorage restore is sufficient for user experience;
    // failing here does not prevent publish.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[PaymentBanner] /api/save-draft best-effort call failed (localStorage only used):',
        serverSaveErr?.message || serverSaveErr,
      );
    }
  }

  // Use the Google OAuth redirect (signInWithGoogle stores nextRelative in a second
  // key — the signin page consumes it and routes back to returnTo after sign-in).
  if (signInWithGoogle) {
    signInWithGoogle({ nextRelative: returnTo }).catch((e) => {
      // Fallback if Google fails to start: plain redirect to sign-in page
      const next = encodeURIComponent(returnTo);
      router.push(`/signin?next=${next}&stage=1`);
    });
  } else {
    const next = encodeURIComponent(returnTo);
    router.push(`/signin?next=${next}&stage=1`);
  }
}

function tryConsumeStagedEdits() {
  const stage = consumeForPublishStagedEdits();
  if (!stage) return null;
  // Backwards compat: the old helper used a 10-minute age threshold. Our shared
  // helper uses a 20-minute threshold; if by chance we got a stale one, discard.
  if (stage.at && Date.now() - stage.at > STAGE_MAX_AGE_MS) {
    discardStagedEdits();
    return null;
  }
  return stage;
}

export default function PaymentBanner({
  formData,
  templateId,
  existingInvitationId = null,
  invitationAlreadyPaid = false,
  onAfterSignInAutoPublish,
}) {
  const router = useRouter();
  const { user, session, loading: authLoading, userPhone, userName, userEmail, userAvatar, isAdmin, signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null); // {message, code, hint, copyableSql}
  const [sqlCopied, setSqlCopied] = useState(false);
  const sqlTextareaRef = useRef(null);
  // Refs that let us invoke callbacks from a useEffect that runs BEFORE the
  // callbacks are declared.  This eliminates the temporal dead zone (TDZ)
  // "Cannot access before initialization" errors when React hook ordering
  // means the auto-resume effect is set up before the handlePay callback is
  // assigned.  The refs are assigned immediately after each callback is
  // declared, and are always dereferenced only inside a delayed setTimeout
  // body so the assignments have always run by the time we call them.
  const handlePayRef = useRef(null);
  const onAfterSignInAutoPublishRef = useRef(null);

  // On mount (after sign-in redirect): auto-consume staged edits and republish
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    // Wait for access_token in session to be available too (same render cycle
    // but we guard so we never call server with missing Bearer header on the
    // OAuth return page).
    if (!session?.access_token) return;
    const staged = tryConsumeStagedEdits();
    if (staged && (staged.templateId === templateId || !existingInvitationId)) {
      const t = setTimeout(() => {
        // IMPORTANT: read ONLY from refs here — this runs after 350ms so both
        // refs are guaranteed to be assigned; avoids any temporal dead zone
        // that would come from referencing handlePay / onAfter directly.
        const onAfter = onAfterSignInAutoPublishRef.current;
        const payFn = handlePayRef.current;
        if (typeof onAfter === 'function') onAfter();
        if (typeof payFn === 'function') {
          payFn(staged.formData || null, staged.existingInvitationId || null);
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [authLoading, user, session, templateId, existingInvitationId]);

  // Wipe the error banner when the user makes any edit so it doesn't hang around
  useEffect(() => {
    setLastError(null);
  }, [formData.groomName, formData.brideName, formData.weddingDate, formData.whatsappNumber]);

  const dismissError = useCallback(() => setLastError(null), []);
  const copySql = useCallback(async () => {
    if (!sqlTextareaRef.current) return;
    const sql = sqlTextareaRef.current.value;
    try {
      await navigator.clipboard.writeText(sql);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    } catch (e) {
      sqlTextareaRef.current.select();
      try {
        document.execCommand('copy');
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2500);
      } catch (_) {
        // no-op
      }
    }
  }, []);

  // Builds the headers we send along with every protected API call.
  // Always attaches a Bearer access token if the signed-in session has one,
  // which bypasses SameSite cookie quirks on localhost and races where the
  // session cookie has not yet been written after a Google OAuth redirect.
  const authHeaders = useMemo(() => {
    const h = { 'Content-Type': 'application/json' };
    const accessToken = session?.access_token || null;
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
    return h;
  }, [session]);

  /**
   * Admin publish flow — called in place of Razorpay for whitelisted Google
   * accounts. Hits /api/admin-publish which server-side validates admin email
   * via Supabase auth cookies and writes invitation with is_paid=true.
   */
  const handleAdminPublish = useCallback(async (overrideFormData = null, overrideExistingId = null) => {
    setLastError(null);
    try {
      setLoading(true);

      const payload = {
        ...(overrideFormData || formData),
        templateId,
        ...((overrideExistingId || existingInvitationId)
          ? { invitationId: overrideExistingId || existingInvitationId }
          : {}),
      };

      let response;
      try {
        response = await fetch('/api/admin-publish', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
          credentials: 'same-origin',
        });
      } catch (netErr) {
        setLastError({
          message: 'Could not reach the server. Please check your internet connection.',
          code: 'NETWORK',
          hint: netErr?.message || 'fetch() failed before reaching the /api/admin-publish route.',
        });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        setLastError({
          message: data?.error || `Server responded ${response.status}`,
          code: data?.code || `HTTP_${response.status}`,
          hint: data?.hint || data?.details || 'See the Next.js server terminal for the full stack trace.',
          copyableSql: data?.copyableSql || null,
        });
        return;
      }

      // Admin publish success — redirect exactly like Razorpay handler success
      // so the user lands on the live invitation with the success=true banner.
      router.push(`/i/${data.slug}?success=true`);
    } catch (unexpectedErr) {
      console.error('Unexpected admin-publish error:', unexpectedErr);
      setLastError({
        message: unexpectedErr?.message || 'Something unexpected happened.',
        code: 'UNEXPECTED',
        hint: 'Check the browser DevTools Console for red errors; screenshot them and send to support if this repeats.',
      });
    } finally {
      setLoading(false);
    }
  }, [router, templateId, formData, existingInvitationId, authHeaders]);

  /**
   * The unified Publish Now flow.
   *
   * 1) If anonymous → stage formData to localStorage → redirect to /signin.
   * 2a) If signed-in AND admin → call admin-publish API (bypasses Razorpay,
   *     sets is_paid=true server-side, writes owner_id + owner_phone).
   * 2b) If signed-in AND normal user → fetch create-order → open Razorpay.
   * 3) Success → redirect to /i/[slug]?success=true → Congratulations banner.
   */
  const handlePay = useCallback(async (overrideFormData = null, overrideExistingId = null) => {
    setLastError(null);

    // SIGN-IN GATE: If user is not authenticated, stage everything and
    // redirect to Google sign-in flow. 10-second cached auth check only (no spinner).
    if (!authLoading && !user) {
      stageEditsAndRedirect({
        formData: overrideFormData || formData,
        templateId,
        existingInvitationId: overrideExistingId || existingInvitationId,
        router,
        signInWithGoogle,
        session,
      });
      return;
    }
    // Auth still loading? wait briefly then fallback to stage.
    if (authLoading && !user) {
      const started = Date.now();
      await new Promise((res) => {
        const t = setInterval(() => {
          if (user || Date.now() - started > 500) { clearInterval(t); res(); }
        }, 50);
      });
      if (!user) {
        stageEditsAndRedirect({
          formData: overrideFormData || formData,
          templateId,
          existingInvitationId: overrideExistingId || existingInvitationId,
          router,
          signInWithGoogle,
          session,
        });
        return;
      }
    }

    // ADMIN BYPASS: Whitelisted Google users publish directly without
    // opening the Razorpay checkout modal.
    if (isAdmin) {
      await handleAdminPublish(overrideFormData, overrideExistingId);
      return;
    }

    try {
      setLoading(true);

      // 1. Make sure Razorpay checkout.js is available BEFORE hitting our server
      try {
        await waitForRazorpay();
      } catch (scriptErr) {
        setLastError({
          message: scriptErr.message,
          code: 'RZP_SCRIPT_BLOCKED',
          hint: 'Check browser extension icons (uBlock, AdGuard, Brave Shields) and allow checkout.razorpay.com, then refresh.',
        });
        return;
      }

      const payload = {
        ...(overrideFormData || formData),
        templateId,
        ...((overrideExistingId || existingInvitationId)
          ? { invitationId: overrideExistingId || existingInvitationId }
          : {}),
      };

      // 2. Ask our server to create a Razorpay order & draft invitation in Supabase
      let response;
      try {
        response = await fetch('/api/create-order', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
          credentials: 'same-origin', // ensures auth cookies are sent so server can set owner_id
        });
      } catch (netErr) {
        setLastError({
          message: 'Could not reach the server. Please check your internet connection.',
          code: 'NETWORK',
          hint: netErr?.message || 'fetch() failed before reaching the /api/create-order route.',
        });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        setLastError({
          message: data?.error || `Server responded ${response.status}`,
          code: data?.code || `HTTP_${response.status}`,
          hint: data?.hint || data?.details || 'See the Next.js server terminal for the full stack trace.',
          copyableSql: data?.copyableSql || null,
        });
        return;
      }

      // 3. Open Razorpay checkout modal
      const fd = overrideFormData || formData;
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'WEB INVITES',
        description: `Wedding Invitation - ${fd.groomName} & ${fd.brideName}`,
        order_id: data.orderId,
        handler: async function (rzpResponse) {
          // Instant server-side signature verification (recommended in
          // Razorpay docs) so is_paid flips to true BEFORE we redirect, so
          // the customer never sees a "DRAFT UNPAID" watermark flash.
          try {
            await fetch('/api/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              }),
            });
          } catch (e) {
            console.warn('confirm-payment call failed (webhook will retry shortly)', e);
          }
          router.push(`/i/${data.slug}?success=true`);
        },
        modal: {
          ondismiss: () => {
            // User pressed the X in the corner — not a failure, so just stop loading silently
            setLoading(false);
          },
        },
        prefill: {
          name: `${fd.groomName} & ${fd.brideName}`,
          contact: fd.whatsappNumber || userPhone,
        },
        theme: {
          color: '#0F382C', // Emerald Primary
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failEvt) {
          const reason = failEvt?.error?.description || 'Payment was declined by your bank/card issuer.';
          const step = failEvt?.error?.step || null;
          setLastError({
            message: reason,
            code: step ? `RZP_FAILED_${step}`.toUpperCase() : 'PAYMENT_FAILED',
            hint: 'You will NOT be charged. Try a different card, UPI, or wallet, or ask your bank to allow international/e-commerce transactions.',
          });
          setLoading(false);
        });
        rzp.open();
        // IMPORTANT: do NOT set loading(false) here — the `ondismiss` callback
        // or the `handler` success callback or `payment.failed` event will do it.
      } catch (rzpErr) {
        setLastError({
          message: rzpErr?.message || 'Could not open Razorpay checkout modal.',
          code: 'RZP_OPEN_FAILED',
          hint: 'Make sure you are in a normal browser window (not incognito with strict 3P cookie blocking).',
        });
        setLoading(false);
      }
    } catch (unexpectedErr) {
      console.error('Unexpected payment-initiation error:', unexpectedErr);
      setLastError({
        message: unexpectedErr?.message || 'Something unexpected happened.',
        code: 'UNEXPECTED',
        hint: 'Check the browser DevTools Console for red errors; screenshot them and send to support if this repeats.',
      });
    } finally {
      // No-op for happy/sad paths that set loading explicitly; this protects
      // against any unhandled throw leaving the button stuck.
    }
  }, [authLoading, user, isAdmin, handleAdminPublish, router, templateId, formData, existingInvitationId, userPhone, authHeaders]);

  // Sync ref immediately after the callback is assigned — any earlier effect
  // (like the auto-resume effect above) that reads this ref inside a
  // setTimeout will reliably get the function reference.
  handlePayRef.current = handlePay;
  onAfterSignInAutoPublishRef.current = typeof onAfterSignInAutoPublish === 'function'
    ? onAfterSignInAutoPublish
    : null;

  const buttonLabel = useMemo(() => {
    if (authLoading) return 'Checking account…';
    if (invitationAlreadyPaid) {
      if (user) return isAdmin ? 'Save edits & update live site' : 'Save edits & update live site';
      return 'Sign in with Google to update →';
    }
    if (user) return isAdmin ? 'Publish Now (Admin — Free)' : 'Publish Now';
    return 'Publish Now ';
  }, [authLoading, invitationAlreadyPaid, user, isAdmin]);

  const buttonIcon = useMemo(() => {
    if (authLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (!user) return <LogIn className="w-5 h-5" />;
    return <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />;
  }, [authLoading, user]);

  return (
    <>
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onError={(e) => {
          console.warn('Razorpay script failed to load (ad block, network, or extension).', e);
          setLastError({
            message:
              'Razorpay checkout script was blocked from loading. This is usually caused by an ad blocker or Brave Shields.',
            code: 'RZP_SCRIPT_BLOCKED',
            hint:
              '1) Temporarily disable your ad/privacy blocker on this page. 2) Turn off Brave Shields (lion icon in URL bar). 3) Refresh and try again.',
          });
        }}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Inline error banner — above the payment card. Fixed pointer-events auto so user can close/read it. */}
        {lastError && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 mb-3 sm:mb-4 pointer-events-auto">
            <div className="relative bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl shadow-[0_18px_50px_rgba(153,27,27,0.15)] p-4 sm:p-5 flex items-start gap-3 sm:gap-4 animate-in slide-in-from-bottom-6 fade-in duration-300">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-bold text-red-800 text-sm sm:text-base leading-none">
                    Couldn't start payment
                  </h4>
                  {lastError.code && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 font-mono text-[10px] sm:text-[11px] tracking-tight">
                      {lastError.code}
                    </span>
                  )}
                </div>
                <p className="text-red-700 text-[13px] sm:text-sm leading-relaxed mb-2">
                  {lastError.message}
                </p>
                {lastError.hint && (
                  <p className="text-red-600/90 text-[11px] sm:text-xs leading-relaxed bg-white/70 border border-red-100 rounded-xl px-3 py-2">
                    💡 {lastError.hint}
                  </p>
                )}

                {lastError.copyableSql && (
                  <div className="mt-3 border border-red-200 rounded-2xl bg-white overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between gap-2 bg-red-50 px-3 py-2 border-b border-red-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-bold text-red-800 tracking-wide uppercase">
                          Copy SQL — paste into Supabase SQL Editor
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={copySql}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 text-[11px] font-bold transition-colors shrink-0"
                      >
                        {sqlCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      ref={sqlTextareaRef}
                      readOnly
                      value={lastError.copyableSql}
                      rows={10}
                      spellCheck={false}
                      className="w-full block bg-white text-[11px] sm:text-xs font-mono text-gray-800 p-3 resize-none focus:outline-none leading-relaxed"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={dismissError}
                className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        )}

        {/* Main payment banner */}
        <div className="bg-white/92 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-[0_-10px_40px_rgba(15,56,44,0.1)] p-4 sm:p-5 md:p-3.5 lg:p-4 pointer-events-auto pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-5 lg:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 text-center md:text-left w-full md:w-auto md:min-w-0">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-1.5 pr-3 py-1.5 rounded-2xl bg-[var(--emerald-light)]/60 ring-1 ring-[var(--emerald-primary)]/10 border border-[var(--emerald-primary)]/10">
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--emerald-primary)] text-white text-[10px] font-bold">
                      {userInitials(user)}
                    </span>
                  )}
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--emerald-primary)]/80">Signed in with Google</div>
                    <div className="text-[12px] font-bold text-[var(--ink)] truncate max-w-[160px]">
                      {userName || userEmail || 'You'}
                    </div>
                  </div>
                </div>
              )}

              {/* Compact subtitle chip (desktop only) so users understand what this banner is for without wasting vertical */}
              <div className="hidden md:flex md:max-w-none items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[var(--champagne-500)]/10 text-[11px] font-bold text-[var(--champagne-700)] ring-1 ring-[var(--champagne-500)]/20">
                  {isAdmin ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {invitationAlreadyPaid ? 'Admin · Saving edits = instant site update' : 'ADMIN · PUBLISH INSTANTLY'}
                    </>
                  ) : user ? (
                    invitationAlreadyPaid ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Owner · Save edits directly to live site
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Secure Razorpay checkout · Flat ₹299
                      </>
                    )
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Sign in & publish in one-tap Google flow
                    </>
                  )}
                </span>
                {isAdmin && (
                  <span className="hidden xl:inline text-[11px] font-semibold text-[var(--ink-muted)] truncate max-w-[280px]">
                    Publishing under{' '}
                    <span className="text-[var(--ink-soft)] font-bold">{userName || userEmail || userDisplayName(user) || 'Operator'}</span>
                    {' '}— no payment required.
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handlePay()}
              disabled={loading}
              className="w-full md:w-auto px-8 sm:px-10 py-3.5 sm:py-4 md:py-3 md:px-8 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-[var(--emerald-dark)] transition-all shadow-xl shadow-[var(--emerald-primary)]/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isAdmin
                    ? invitationAlreadyPaid
                      ? 'Saving to your live site…'
                      : 'Publishing invitation…'
                    : invitationAlreadyPaid
                      ? 'Saving to your live site…'
                      : 'Securing Payment…'}
                </>
              ) : (
                <>
                  {buttonLabel}
                  {buttonIcon}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

