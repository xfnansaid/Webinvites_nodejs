'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck } from 'lucide-react';

/**
 * FreeTierViralBadge
 *
 * Renders on free-tier published invitations (/i/[slug]).
 * Displays:
 * 1. Logo & Brand Title ("WEB INVITES")
 * 2. "Create for Free ✨" CTA button leading to /create
 * 3. "Remove Ads" host upgrade button (₹399) linking to /checkout
 */
export default function FreeTierViralBadge({ invitationId, slug }) {

  return (
    <>
      {/* Floating Bottom Center Viral Pill */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[94%] max-w-md pointer-events-auto print:hidden">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 bg-white/95 backdrop-blur-lg rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-stone-200/90">
          
          {/* Logo + Brand Name */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 group hover:opacity-90 transition-opacity shrink-0"
            title="Create your own digital invitation on Web Invites"
          >
            <span className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200 overflow-hidden shadow-xs">
              <img
                src="/logo.png"
                alt="Web Invites Logo"
                width={36}
                height={36}
                className="object-contain scale-[1.08]"
              />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[11px] sm:text-[12px] font-bold text-stone-900 truncate font-display tracking-wide">
                WEB INVITES
              </span>
              <span className="text-[9px] sm:text-[10px] text-stone-500 font-medium truncate">
                Digital Event Cards
              </span>
            </div>
          </Link>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Primary Guest CTA: Create for Free */}
            <Link
              href="/create"
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-3 sm:px-3.5 py-1.5 text-white text-[11px] sm:text-xs font-bold shadow-sm shadow-emerald-700/20 hover:from-emerald-800 hover:to-teal-800 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-300 animate-pulse" />
              <span>Create for Free</span>
            </Link>

            {/* Host Quick Upgrade to Remove Ads — hard reload to ensure 100% clean ad-free checkout context */}
            <a
              href={`/checkout?slug=${encodeURIComponent(slug || '')}&invitationId=${encodeURIComponent(invitationId || '')}`}
              className="inline-flex items-center justify-center h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-[10px] sm:text-[11px] font-semibold transition-colors shrink-0"
              title="Are you the host? Remove ads for ₹399"
            >
              <ShieldCheck className="h-3 w-3 sm:hidden mr-0.5 text-stone-400" />
              <span>Remove Ads</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
