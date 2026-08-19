'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, Loader2, Sparkles, X, Copy, Check, LogIn } from 'lucide-react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth, userInitials } from '@/lib/auth';

// Storage key for the anonymous edits to stage through sign-in gate
const STAGE_KEY = 'wi_publish_stage_v1';

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
function stageEditsAndRedirect({ formData, templateId, existingInvitationId, router, signInWithGoogle }) {
  if (typeof window === 'undefined') return;
  const returnTo = window.location.pathname + window.location.search;
  const payload = {
    at: Date.now(),
    formData: { ...formData },
    templateId,
    existingInvitationId: existingInvitationId || null,
    returnTo,
  };
  try {
    localStorage.setItem(STAGE_KEY, JSON.stringify(payload));
  } catch {}
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
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire staged edits > 10 min old
    if (!parsed?.at || Date.now() - parsed.at > 10 * 60 * 1000) {
      localStorage.removeItem(STAGE_KEY);
      return null;
    }
    localStorage.removeItem(STAGE_KEY);
    return parsed;
  } catch {
    try { localStorage.removeItem(STAGE_KEY); } catch {}
    return null;
  }
}

export default function PaymentBanner({
  formData,
  templateId,
  existingInvitationId = null,
  invitationAlreadyPaid = false,
  onAfterSignInAutoPublish,
}) {
  const router = useRouter();
  const { user, loading: authLoading, userPhone, userName, userEmail, userAvatar, signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null); // {message, code, hint, copyableSql}
  const [sqlCopied, setSqlCopied] = useState(false);
  const sqlTextareaRef = useRef(null);

  // On mount (after sign-in redirect): auto-consume staged edits and republish
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const staged = tryConsumeStagedEdits();
    if (staged && (staged.templateId === templateId || !existingInvitationId)) {
      // Use the staged edits (most up-to-date from before the sign-in gate).
      // Trigger a synthetic click of Publish Now by calling the pay handler.
      // We need a small delay so the handler closure sees `user` hydrated.
      const t = setTimeout(() => {
        if (onAfterSignInAutoPublish) onAfterSignInAutoPublish();
        handlePay(staged.formData || null, staged.existingInvitationId || null);
      }, 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, templateId, existingInvitationId]);

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
      // Fallback: select+execCommand
      sqlTextareaRef.current.select();
      try {
        document.execCommand('copy');
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2500);
      } catch (_) {
        // no-op, user can copy manually
      }
    }
  }, []);

  /**
   * The unified Publish Now flow.
   *
   * 1) If anonymous → stage formData to localStorage → redirect to /signin.
   * 2) If signed in → fetch create-order (passes owner via cookies) → open Razorpay modal.
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
      });
      return;
    }
    // Auth still loading? wait briefly then fallback to stage.
    if (authLoading && !user) {
      // Wait up to 500ms for auth to hydrate; else proceed through stage.
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
        });
        return;
      }
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
          headers: { 'Content-Type': 'application/json' },
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
  }, [authLoading, user, router, templateId, formData, existingInvitationId, userPhone]);

  const buttonLabel = useMemo(() => {
    if (authLoading) return 'Checking account…';
    if (invitationAlreadyPaid) {
      return user ? 'Save edits & update live site' : 'Sign in with Google to update →';
    }
    return user ? 'Publish Now' : 'Sign in with Google & Publish →';
  }, [authLoading, invitationAlreadyPaid, user]);

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
        <div className="bg-white/92 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-[0_-10px_40px_rgba(15,56,44,0.1)] p-4 sm:p-5 md:p-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 text-center md:text-left w-full md:w-auto">
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

              <div className="min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--champagne-500)]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--ink-muted)]">
                    {invitationAlreadyPaid ? 'Update your live invitation' : 'Go live in under 30 seconds'}
                  </span>
                </div>
                <p className="text-[var(--ink-soft)] text-xs sm:text-sm font-medium leading-relaxed">
                  {user
                    ? invitationAlreadyPaid
                      ? `Editing your invitation (${userName || userEmail || 'your account'}). Razorpay ₹299 re-publication charge below.`
                      : `Publishing under ${userName || userEmail || 'your Google account'} — invite appears on your dashboard for future edits.`
                    : 'One-tap secure Google sign-in. Your invitation is saved to your account so you can edit & republish anytime.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePay()}
              disabled={loading}
              className="w-full md:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-[var(--emerald-dark)] transition-all shadow-xl shadow-[var(--emerald-primary)]/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {invitationAlreadyPaid ? 'Saving to your live site…' : 'Securing Payment…'}
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

