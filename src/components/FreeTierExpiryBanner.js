'use client';

import React, { useState, useCallback } from 'react';
import { Clock, Sparkles, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Floating banner shown to the HOST of a free-tier invitation
 * when there are fewer than 7 days remaining.
 *
 * Shows countdown + upgrade CTA.
 * Dismissible (localStorage).
 */
export default function FreeTierExpiryBanner({
  daysRemaining,
  hoursRemaining,
  invitationId,
  slug,
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`__expiry_dismissed_${invitationId}`) === '1';
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(`__expiry_dismissed_${invitationId}`, '1');
    } catch {}
  }, [invitationId]);

  if (dismissed) return null;

  const isUrgent = daysRemaining <= 3;
  const isCritical = daysRemaining <= 1;

  return (
    <div className="fixed bottom-4 right-4 z-[150] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className={`
        rounded-2xl shadow-2xl border overflow-hidden
        ${isCritical
          ? 'bg-gradient-to-br from-red-950 via-red-900 to-red-950 border-red-500/30 shadow-red-500/20'
          : isUrgent
            ? 'bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 border-amber-500/30 shadow-amber-500/20'
            : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border-white/10 shadow-black/30'
        }
      `}>
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
          aria-label="Dismiss expiry warning"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`
              shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
              ${isCritical ? 'bg-red-500/20' : isUrgent ? 'bg-amber-500/20' : 'bg-white/10'}
            `}>
              <Clock className={`w-5 h-5 ${isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white/60'}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-white font-bold text-xs sm:text-sm mb-1">
                {isCritical
                  ? '⚠️ Your free invitation expires today!'
                  : isUrgent
                    ? `⏰ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left on free tier`
                    : `Free invitation expires in ${daysRemaining} days`
                }
              </div>
              <div className="text-white/40 text-[11px] leading-relaxed mb-3">
                {isCritical
                  ? 'Upgrade now to keep your invitation live after today.'
                  : 'Upgrade to Premium (₹399) to keep your invitation live until 3 days after your event.'
                }
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-1.5 mb-3">
                {[
                  { value: daysRemaining, label: 'D' },
                  { value: hoursRemaining, label: 'H' },
                ].map(({ value, label }) => (
                  <div key={label} className={`
                    px-2 py-1 rounded-lg text-center min-w-[36px]
                    ${isCritical ? 'bg-red-500/20 text-red-300' : isUrgent ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/70'}
                  `}>
                    <div className="text-sm sm:text-base font-bold leading-none">{value ?? '—'}</div>
                    <div className="text-[8px] uppercase tracking-wider opacity-60 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              <a
                href={`/checkout?slug=${encodeURIComponent(slug || '')}&invitationId=${encodeURIComponent(invitationId || '')}`}
                className={`
                  group w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98]
                  ${isCritical
                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30'
                  }
                `}
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Premium — ₹399
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
