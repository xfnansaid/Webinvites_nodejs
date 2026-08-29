'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Check, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';

export default function RemoveAdsModal({ invitationId, slug, onClose, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRemoveAdsPayment = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Create order for ad removal
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          purpose: 'remove_ads',
          groomName: 'Upgrade',
          brideName: 'Premium',
          weddingDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create payment order. Please try again.');
      }

      // 2. Open Razorpay Checkout Modal
      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
        throw new Error('Razorpay script is not loaded. Please refresh or disable ad-blockers.');
      }

      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount || 39900,
        currency: 'INR',
        name: 'WEB INVITES',
        description: 'Remove Ads & Upgrade to Premium Ad-Free',
        order_id: data.orderId,
        handler: async function (rzpResponse) {
          try {
            setLoading(true);
            const confRes = await fetch('/api/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              }),
            });

            const confData = await confRes.json().catch(() => ({}));
            if (!confRes.ok || confData.error) {
              console.warn('Confirm payment returned warning:', confData);
            }

            if (onSuccess) {
              onSuccess();
            } else {
              if (onClose) onClose();
              router.refresh();
              window.location.reload();
            }
          } catch (confErr) {
            console.error('Ad removal confirmation error:', confErr);
            if (onClose) onClose();
            router.refresh();
          } finally {
            setLoading(false);
          }
        },
        theme: {
          color: '#0F382C',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Ad removal payment error:', err);
      setError(err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-stone-100">
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Badge Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
          </div>

          <h3 className="text-xl font-bold text-stone-900 font-display">
            Remove Ads from this Invitation
          </h3>

          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Upgrade this invitation to <strong className="text-stone-900">Premium Ad-Free</strong> so your guests experience a pristine, uninterrupted wedding card.
          </p>

          {/* Benefits list */}
          <div className="my-5 rounded-2xl bg-stone-50 p-4 text-left space-y-2.5 text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>100% Ad-Free guest experience</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Removes all banner & anchor ad units</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Instant activation & lifetime ad-free link</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleRemoveAdsPayment}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 hover:from-emerald-800 hover:to-teal-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Opening Checkout...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Remove Ads for ₹399</span>
              </>
            )}
          </button>

          <div className="mt-3 text-[11px] text-stone-400">
            🔒 Secure 128-bit encrypted payment via Razorpay / UPI
          </div>
        </div>
      </div>
    </>
  );
}
