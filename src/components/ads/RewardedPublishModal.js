'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Volume2,
  X,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';

/**
 * RewardedPublishModal
 *
 * Monetag Direct Link + Interactive Ad Modal for Free Tier Publishing.
 *
 * How it works:
 * 1. Host clicks "Watch Ad & Publish Free".
 * 2. Directly triggers Monetag SmartLink (https://omg10.com/4/11680626) in a sponsor tab.
 * 3. Shows active 15-second sponsor verification countdown on the main page.
 * 4. Once the countdown completes, automatically triggers onRewardEarned() and publishes the invitation.
 * 5. Hosts can also skip anytime for ₹399.
 */
export default function RewardedPublishModal({
  isOpen,
  onClose,
  onRewardEarned,
  onUpgradeToPaid,
  templateTitle = 'Wedding Invitation',
}) {
  const [adState, setAdState] = useState('ready'); // 'ready' | 'playing' | 'completed' | 'failed'
  const [countdown, setCountdown] = useState(15);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);
  const rewardGrantedRef = useRef(false);

  const directAdUrl =
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL || 'https://omg10.com/4/11680626';

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setAdState('ready');
    setCountdown(15);
    setProgress(0);
    rewardGrantedRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Complete reward session
  const completeRewardSession = useCallback(() => {
    if (rewardGrantedRef.current) return;
    rewardGrantedRef.current = true;
    setAdState('completed');
    setProgress(100);
    setCountdown(0);

    if (onRewardEarned) {
      onRewardEarned({ type: 'monetag_direct_reward', duration: 15 });
    }
  }, [onRewardEarned]);

  // Start watching ad (Opens Direct Link + starts countdown)
  const handleStartAd = useCallback(() => {
    setAdState('playing');
    setCountdown(15);
    setProgress(0);

    // Open Monetag Direct Link in a new tab
    try {
      if (typeof window !== 'undefined') {
        window.open(directAdUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.warn('Could not auto-open direct link:', e);
    }

    const totalSeconds = 15;
    let elapsed = 0;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setCountdown(remaining);
      setProgress((elapsed / totalSeconds) * 100);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        completeRewardSession();
      }
    }, 1000);
  }, [directAdUrl, completeRewardSession]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-stone-100 overflow-hidden">
        
        {/* Close Button */}
        {adState !== 'playing' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* 1. READY STATE */}
        {adState === 'ready' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--emerald-primary)] ring-8 ring-emerald-50/50">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-stone-900 font-display">
                Publish for Free
              </h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
                Visit our sponsor message for 15 seconds to publish{' '}
                <span className="font-semibold text-stone-800">"{templateTitle}"</span>{' '}
                for free with a live shareable URL.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartAd}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <PlayCircle className="h-5 w-5 shrink-0" />
                <span>Visit Sponsor &amp; Publish Free</span>
              </button>
              <p className="mt-2.5 text-[11px] text-stone-400">
                ⚡ Unlocks your free live invitation link in 15 seconds
              </p>
            </div>
          </div>
        )}

        {/* 2. ACTIVE SPONSOR SESSION STATE */}
        {adState === 'playing' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 p-6 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Sponsor Session Active
                </div>

                <div className="text-4xl font-extrabold font-display my-2 tracking-tight text-white">
                  0:{countdown < 10 ? `0${countdown}` : countdown}
                </div>

                <p className="text-xs text-stone-300">
                  Sponsor page opened in new tab. Keep this page open.
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-stone-700/60 rounded-full h-2 mt-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Manual Sponsor link if popup was blocked */}
                <a
                  href={directAdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Didn't open? Click here to view sponsor</span>
                </a>
              </div>

              {/* Ambient Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              <span>Verifying sponsor session &amp; publishing...</span>
            </div>
          </div>
        )}

        {/* 3. COMPLETED REWARD STATE */}
        {adState === 'completed' && (
          <div className="py-6 space-y-4 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-9 w-9 text-emerald-600 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-stone-900 font-display">
                Reward Earned!
              </h3>
              <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
                Thank you for supporting our platform sponsors.
              </p>
            </div>

            <div className="py-3 px-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center gap-2.5 text-emerald-800 font-semibold text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
              <span>Publishing your live wedding invitation...</span>
            </div>
          </div>
        )}

        {/* Footer Direct Upgrade Option */}
        <div className="mt-6 border-t border-stone-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Want a 100% ad-free invite?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onUpgradeToPaid) {
                onUpgradeToPaid();
              } else if (onClose) {
                onClose();
              }
            }}
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Upgrade for ₹399 →
          </button>
        </div>
      </div>
    </div>
  );
}
