'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, ArrowRight, Heart } from 'lucide-react';

/**
 * FreeTierViralBadge
 *
 * 1. Floating Bottom Bar: Logo + Brand + "Remove Ads" CTA for host.
 * 2. End of Template Card: "Create for Free ✨" guest viral card at the very bottom of the invitation.
 */
export default function FreeTierViralBadge({ invitationId, slug }) {
  const checkoutUrl = `/checkout?slug=${encodeURIComponent(slug || '')}&invitationId=${encodeURIComponent(invitationId || '')}`;

  return (
    <>
      {/* 1. End of Template Viral Section: Create for Free */}
      <div className="w-full max-w-md mx-auto my-12 px-4 text-center print:hidden">
        <div className="rounded-3xl bg-white/90 backdrop-blur-md p-6 sm:p-7 border border-stone-200/90 shadow-lg space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-4 ring-emerald-50/50">
            <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse" />
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900 font-display">
              Create Your Own Invitation
            </h4>
            <p className="text-xs text-stone-600 max-w-xs mx-auto mt-1 leading-relaxed">
              Design beautiful digital cards for weddings, birthdays, and celebrations in minutes.
            </p>
          </div>

          <div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-6 py-3 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-800/20 hover:from-emerald-900 hover:to-teal-900 active:scale-[0.98] transition-all group"
            >
              <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Create for Free</span>
              <ArrowRight className="h-4 w-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-[11px] text-stone-400 font-medium">
            Powered by Web Invites
          </p>
        </div>
      </div>

      {/* 2. Floating Bottom Center Bar with "Remove Ads" CTA */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[94%] max-w-md pointer-events-auto print:hidden">
        <div className="flex items-center justify-between gap-3 bg-white/95 backdrop-blur-lg rounded-2xl px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-stone-200/90">
          {/* Logo + Brand Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition-opacity shrink-0"
            title="Web Invites"
          >
            <span className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200 overflow-hidden shadow-xs">
              <img
                src="/logo.webp"
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

          {/* Remove Ads Button CTA */}
          <div className="flex items-center shrink-0">
            <a
              href={checkoutUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-3.5 py-1.5 sm:py-2 text-white text-[11px] sm:text-xs font-bold shadow-sm shadow-emerald-800/20 hover:from-emerald-900 hover:to-teal-900 active:scale-[0.98] transition-all"
              title="Remove ads for ₹399"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span>Remove Ads</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
