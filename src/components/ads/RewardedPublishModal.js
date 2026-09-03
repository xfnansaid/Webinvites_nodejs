'use client';

import React from 'react';
import {
  Sparkles,
  X,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Crown,
} from 'lucide-react';

/**
 * RewardedPublishModal / PublishChoiceModal
 *
 * Primary CTA: Large "Publish for free (with ads)"
 * Secondary CTA below: "Get Premium for (ad-free) exp · ₹399"
 */
export default function RewardedPublishModal({
  isOpen,
  onClose,
  onRewardEarned,
  onUpgradeToPaid,
  templateTitle = 'Wedding Invitation',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose && !loading) onClose();
      }}
    >
      <div className="relative w-full max-w-[440px] rounded-[2rem] bg-white p-6 sm:p-8 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-stone-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-stone-100/90 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon Badge */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100/60 text-emerald-700 mb-4 ring-8 ring-emerald-50/60 shadow-inner">
          <Sparkles className="h-7 w-7 text-emerald-600" />
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-stone-900 font-serif">
          PUBLISH YOUR INVITATION
        </h3>

        {/* Context & Description */}
        <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
          Ready to take <span className="font-bold text-stone-900">"{templateTitle}"</span> live with a shareable WhatsApp-ready link.
        </p>

        {/* Actions Container */}
        <div className="mt-6 space-y-3">
          {/* Primary Large CTA: Publish for free (with ads) */}
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (onRewardEarned) {
                onRewardEarned();
              }
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-900 hover:via-emerald-800 hover:to-teal-900 text-white font-bold text-base sm:text-lg shadow-xl shadow-emerald-850/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Redirecting…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform" />
                <span>Publish for free (with ads)</span>
                <ArrowRight className="h-4 w-4 text-emerald-200 shrink-0 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-stone-500 font-medium">
            <span>⚡ Instant live invitation link · Ad-supported</span>
          </div>

          {/* Secondary CTA Below: Get Premium for (ad-free) exp */}
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (onUpgradeToPaid) {
                onUpgradeToPaid();
              }
            }}
            className="w-full py-3.5 px-5 rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2 shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>Get premium for (ad-free) exp · ₹399</span>
            <ArrowRight className="h-4 w-4 text-emerald-700 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}



