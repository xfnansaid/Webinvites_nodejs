'use client';

import React, { useState } from 'react';
import { Sparkles, Crown, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * GracePeriodBanner
 * Displayed on freshly published free-tier invitations during the first 36 hours.
 * Informs the host that ads are paused for 36 hours and offers a direct 1-click
 * CTA to upgrade to ₹399 Premium to lock in an ad-free experience permanently.
 */
export default function GracePeriodBanner({
  invitationId,
  slug,
  hoursRemaining,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const checkoutUrl = `/checkout?invitationId=${encodeURIComponent(invitationId || '')}&slug=${encodeURIComponent(slug || '')}`;

  return (
    <aside
      aria-label="Grace period preview banner"
      className="
        sticky top-0 z-50 w-full
        border-b border-amber-300/30
        bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#1c1917]
        px-3 py-2 sm:px-4 sm:py-2.5
        text-white shadow-[0_4px_20px_rgba(0,0,0,0.35)]
        backdrop-blur-md
      "
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left Side: Status */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/40">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-200">
              Free Tier Active
            </span>
            <span className="hidden text-stone-300 sm:inline">
              {' '}— Ad-free grace period. Upgrade to remove ads permanently.
            </span>
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
