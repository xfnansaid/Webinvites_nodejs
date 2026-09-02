'use client';

import React from 'react';
import {
  Sparkles,
  Crown,
  X,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

/**
 * PublishChoiceModal / RewardedPublishModal
 *
 * Primary CTA: Large Upgrade for ₹399 Ad-Free
 * Secondary Action: Clean, instant Publish for Free (no ads, no sponsor wait)
 */
export default function RewardedPublishModal({
  isOpen,
  onClose,
  onRewardEarned,
  onUpgradeToPaid,
  templateTitle = 'Wedding Invitation',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-stone-100 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-6">
          {/* Header Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-700/20 ring-8 ring-emerald-50">
            <Crown className="h-8 w-8 text-amber-300" />
          </div>

          {/* Title & Context */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
              Publish Your Invitation
            </h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              Ready to take <span className="font-semibold text-stone-800">"{templateTitle}"</span> live for your guests.
            </p>
          </div>

          {/* Primary Large CTA: Upgrade for ₹399 Ad-Free */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onUpgradeToPaid) {
                  onUpgradeToPaid();
                }
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white font-bold text-base sm:text-lg shadow-xl shadow-emerald-800/30 hover:from-emerald-900 hover:via-emerald-800 hover:to-teal-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
            >
              <Sparkles className="h-5 w-5 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform" />
              <span>Upgrade for ₹399 · Ad-Free</span>
              <ArrowRight className="h-5 w-5 text-emerald-200 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-500 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>100% ad-free experience for guests · Instant live link</span>
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="relative pt-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-stone-400 font-medium tracking-wider">or</span>
            </div>
          </div>

          {/* Secondary Option: Instant Clean Publish for Free */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (onRewardEarned) {
                  onRewardEarned({ type: 'free_instant' });
                }
              }}
              className="group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-emerald-700 transition-colors py-2.5 px-5 rounded-xl hover:bg-stone-50 active:scale-95 border border-stone-200/80 hover:border-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Publish for Free</span>
              <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
