'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, Loader2, Sparkles, X, Copy, Check } from 'lucide-react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

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

export default function PaymentBanner({ formData, templateId }) {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null); // {message, code, hint, copyableSql}
  const [sqlCopied, setSqlCopied] = useState(false);
  const sqlTextareaRef = useRef(null);
  const router = useRouter();

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

  const handlePay = async () => {
    setLastError(null);
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

      // 2. Ask our server to create a Razorpay order & draft invitation in Supabase
      let response;
      try {
        response = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            templateId,
          }),
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
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'WEB INVITES',
        description: `Wedding Invitation - ${formData.groomName} & ${formData.brideName}`,
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
          name: `${formData.groomName} & ${formData.brideName}`,
          contact: formData.whatsappNumber,
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
  };

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
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--emerald-light)] rounded-2xl sm:rounded-2xl flex items-center justify-center text-[var(--emerald-primary)] shadow-inner shrink-0">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-[var(--emerald-primary)] leading-none">
                    Ready to Publish?
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--champagne-500)]" />
                </div>
                <p className="text-[13px] sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                  Publish your invitation & get your premium shareable WhatsApp-ready link for just{' '}
                  <span className="text-[var(--emerald-primary)] font-bold">₹399</span>.
                </p>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full md:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-[var(--emerald-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-[var(--emerald-dark)] transition-all shadow-xl shadow-[var(--emerald-primary)]/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Securing Payment...
                </>
              ) : (
                <>
                  Pay & Publish Now
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
