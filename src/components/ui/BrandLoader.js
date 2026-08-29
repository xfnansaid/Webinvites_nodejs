'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Luxury Brand Initial Page Loader
 * Shows a gold shimmering monogram and dissolves seamlessly once DOM & fonts are ready.
 */
export default function BrandLoader() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash loader briefly on initial page entry
    setMounted(true);
    const timer = setTimeout(() => {
      setFading(true);
      const removeTimer = setTimeout(() => {
        setMounted(false);
      }, 500);
      return () => clearTimeout(removeTimer);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#071712] transition-all duration-500 ease-out ${
        fading ? 'opacity-0 scale-[1.02] backdrop-blur-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/15 blur-[90px] animate-pulse" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Animated Concentric Gold Rings */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping opacity-30" />
          <div className="absolute inset-1 rounded-full border-2 border-amber-300/40 border-t-amber-400 animate-spin" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300/20 to-emerald-500/10 backdrop-blur-md border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex flex-col items-center">
          <span className="font-display text-sm font-bold uppercase tracking-[0.35em] text-[#FFFDF8]">
            Web Invites
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-amber-200/70">
            Crafting Digital Elegance
          </span>
        </div>
      </div>
    </div>
  );
}
