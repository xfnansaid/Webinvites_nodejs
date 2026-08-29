'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Crown,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  X,
  Clock,
  Check,
  XCircle,
} from 'lucide-react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getInviteExpiry } from '@/lib/invite-expiry-client';

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
        reject(new Error('Razorpay checkout script could not be loaded.'));
        return;
      }
      delay = Math.min(delay * 2, 500);
      setTimeout(tick, delay);
    };
    tick();
  });
}

/**
 * Upgrade to Premium banner shown on the edit page for free tier invitations.
 * Shows expiry countdown and a prominent "Upgrade to Premium — ₹399" CTA.
 */
export default function UpgradeToPremiumBanner({ invitation }) {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const expiryInfo = useMemo(() => getInviteExpiry(invitation), [invitation]);
  const isFreeTier = invitation?.tier === 'free' || invitation?.is_ad_supported !== false;
  const isExpired = expiryInfo?.isExpired || invitation?.is_active === false;

  // Don't show if already premium or dismissed
  if (!isFreeTier || dismissed) return null;

  const authHeaders = (() => {
    const h = { 'Content-Type': 'application/json' };
    const t = session?.access_token;
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  })();

  const handleUpgrade = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      router.push(`/signin?next=${encodeURIComponent('/edit/' + invitation.id)}`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await waitForRazorpay();

      const res = await fetch('/api/upgrade-to-premium', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ invitationId: invitation.id }),
        credentials: 'same-origin',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        if (data.code === 'ALREADY_PREMIUM') {
          setError({ message: 'This invitation is already premium!', type: 'info' });
          setLoading(false);
          return;
        }
        setError({ message: data.error || 'Failed to create upgrade order.', type: 'error' });
        setLoading(false);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'WEB INVITES',
        description: `Upgrade to Premium — ${data.groomName} & ${data.brideName}`,
        order_id: data.orderId,
        handler: async function (rzpResponse) {
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
            console.warn('confirm-payment call failed', e);
          }
          // Redirect to live page with success flag
          router.push(`/i/${data.slug}?success=true&upgraded=true`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        prefill: {
          name: `${data.groomName} & ${data.brideName}`,
          contact: user?.phone || '',
        },
        theme: {
          color: '#0F382C',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failEvt) {
        setError({
          message: failEvt?.error?.description || 'Payment failed.',
          type: 'error',
        });
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Upgrade error:', err);
      setError({
        message: err.message || 'Could not start upgrade payment.',
        type: 'error',
      });
      setLoading(false);
    }
  }, [invitation, user, authLoading, session, router, authHeaders]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className={`rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${
        isExpired
          ? 'bg-gradient-to-br from-red-50/90 via-white to-amber-50/50 border-red-200'
          : expiryInfo.daysRemaining !== null && expiryInfo.daysRemaining <= 7
            ? 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 border-amber-200'
            : 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-amber-200/70'
      }`}>
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
              isExpired
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isExpired ? (
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-[var(--ink)]">
                  {isExpired
                    ? '⚠️ Free invitation has expired'
                    : 'Upgrade to Premium'
                  }
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  Free Tier
                </span>
              </div>

              {isExpired ? (
                <p className="text-xs sm:text-sm text-red-700/80 leading-relaxed mb-3">
                  Your free invitation expired and is no longer visible to guests.
                  Upgrade to <strong>Premium (₹399)</strong> to reactivate your link and keep it
                  live until 3 days after your event — completely ad-free.
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-amber-900/70 leading-relaxed mb-3">
                  Your free invitation has ads and will expire in{' '}
                  <strong className="text-amber-900">
                    {expiryInfo.daysRemaining} day{expiryInfo.daysRemaining !== 1 ? 's' : ''}
                  </strong>.
                  Upgrade to <strong>Premium (₹399)</strong> for ad-free hosting until 3 days
                  after your event.
                </p>
              )}

              {/* Features comparison */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  <span className="text-red-700/80">Ads on page</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700">No ads — premium</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  <span className="text-red-700/80">Expires in 21 days</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700">Until 3 days post-event</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs sm:text-sm text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                  <span className="leading-relaxed">{error.message}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto shrink-0 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Premium — ₹399
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-amber-400/60 hover:text-amber-600 hover:bg-amber-100/50 transition-colors"
              aria-label="Dismiss upgrade banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
