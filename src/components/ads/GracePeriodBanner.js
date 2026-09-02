'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, Clock, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * GracePeriodBanner
 * Displayed on freshly published free-tier invitations during the first 2 hours.
 * Informs the host that ads are paused for a limited time and offers a direct 1-click
 * CTA to upgrade to ₹399 Premium to lock in an ad-free experience permanently.
 */
export default function GracePeriodBanner({
  invitationId,
  slug,
  createdAt,
}) {
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const GRACE_PERIOD_MS = 2 * 60 * 60 * 1000; // 2 hours

  useEffect(() => {
    if (!createdAt) return;

    const createdTime = new Date(createdAt).getTime();
    const expiryTime = createdTime + GRACE_PERIOD_MS;

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [createdAt]);

  if (dismissed || !timeLeft) return null;

  const checkoutUrl = `/checkout?invitationId=${encodeURIComponent(invitationId || '')}&slug=${encodeURIComponent(slug || '')}`;

  return (
    <aside
      aria-label="Grace period preview banner"
      className="
        sticky top-0 z-50 w-full
        border-b border-amber-300/40
        bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#1c1917]
        px-3 py-2.5 sm:px-4 sm:py-3
        text-white shadow-[0_4px_20px_rgba(0,0,0,0.35)]
        backdrop-blur-md
      "
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left Side: Status / Timer */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/40">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium leading-tight">
              <span className="hidden font-bold tracking-wide text-amber-300 sm:inline">
                Ad-Free Preview Active:
              </span>
              <span className="flex items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-200">
                <Clock className="h-3 w-3 shrink-0" />
                {timeLeft} left
              </span>
              <span className="hidden text-stone-300 md:inline">
                — Ads will activate automatically for guests after 2 hours.
              </span>
            </div>
            <p className="hidden text-[11px] text-stone-400 sm:block md:hidden">
              Upgrade to Premium (₹399) to keep this invite 100% ad-free forever.
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button & Dismiss */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={checkoutUrl}
            className="
              inline-flex min-h-[34px] items-center gap-1.5
              rounded-full bg-gradient-to-r from-amber-400 to-amber-500
              px-3.5 py-1.5 text-xs font-bold text-stone-950
              shadow-md shadow-amber-500/25 transition-all
              hover:from-amber-300 hover:to-amber-400
              hover:shadow-amber-500/40 active:scale-95
              sm:min-h-[38px] sm:px-4 sm:text-xs
            "
          >
            <Crown className="h-3.5 w-3.5" />
            <span>Go Ad-Free (₹399)</span>
            <ArrowRight className="hidden h-3 w-3 sm:inline" />
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="
              flex h-7 w-7 items-center justify-center
              rounded-full text-stone-400 transition-colors
              hover:bg-white/10 hover:text-white
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
