'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Check, Sparkles, X } from 'lucide-react';

export default function RemoveAdsModal({ invitationId, slug, onClose }) {
  const checkoutUrl = `/checkout?slug=${encodeURIComponent(slug || '')}&invitationId=${encodeURIComponent(invitationId || '')}`;

  return (
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
            <span>Removes all banner &amp; anchor ad units</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Instant activation &amp; lifetime ad-free link</span>
          </div>
        </div>

        {/* CTA Button navigating to clean dedicated checkout */}
        <a
          href={checkoutUrl}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 hover:from-emerald-800 hover:to-teal-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Continue to Secure Checkout (₹399)</span>
        </a>

        <div className="mt-3 text-[11px] text-stone-400">
          🔒 Secure 256-bit encrypted checkout via Razorpay / UPI
        </div>
      </div>
    </div>
  );
}
