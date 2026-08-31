'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

/**
 * Universal Luxury Ring Loader for Suspense & In-Component Loading
 */
export default function RingLoader({
  size = 'md',
  color = 'gold',
  label = 'Loading invitation…',
  className = '',
}) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const colors = {
    gold: {
      spinner: 'text-amber-400',
      sparkle: 'text-amber-300',
      glow: 'bg-amber-400/15',
      text: 'text-amber-950',
    },
    emerald: {
      spinner: 'text-emerald-500',
      sparkle: 'text-emerald-400',
      glow: 'bg-emerald-500/15',
      text: 'text-emerald-950',
    },
    crimson: {
      spinner: 'text-rose-700',
      sparkle: 'text-rose-500',
      glow: 'bg-rose-500/15',
      text: 'text-rose-950',
    },
    white: {
      spinner: 'text-white',
      sparkle: 'text-white/80',
      glow: 'bg-white/15',
      text: 'text-white',
    },
  };

  const selectedColor = colors[color] || colors.gold;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`absolute -inset-2 rounded-full ${selectedColor.glow} blur-md animate-pulse`} />
        <Loader2 className={`${selectedSize} animate-spin ${selectedColor.spinner}`} />
      </div>
      {label && (
        <span className={`text-xs font-semibold tracking-wider uppercase ${selectedColor.text}`}>
          {label}
        </span>
      )}
    </div>
  );
}
