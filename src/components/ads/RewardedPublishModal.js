'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Volume2,
  X,
  ShieldCheck,
} from 'lucide-react';

/**
 * RewardedPublishModal
 *
 * Implements the Google Rewarded Video Ad publisher scheme for free tier invitations.
 *
 * How it works:
 * 1. Checks if Google Publisher Tag (GPT) is available and requests a Rewarded Video Ad slot.
 * 2. If GPT returns `rewardedSlotReady`, prompts user to watch the full 30s ad.
 * 3. Listens to `rewardedSlotGranted` to verify completion and triggers `onRewardEarned()`.
 * 4. Fallback / Dev Simulator: If live ads are unfilled or in local development, runs
 *    a clean 30-second video sponsor simulation with live progress so publishing is never broken.
 * 5. Provides a direct upgrade route: "Skip ads and publish for ₹399".
 */
export default function RewardedPublishModal({
  isOpen,
  onClose,
  onRewardEarned,
  onUpgradeToPaid,
  templateTitle = 'Wedding Invitation',
}) {
  const [adState, setAdState] = useState('initializing'); // 'initializing' | 'ready' | 'playing' | 'simulating' | 'completed' | 'failed'
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [progress, setProgress] = useState(0);

  const rewardedSlotRef = useRef(null);
  const rewardGrantedRef = useRef(false);
  const simTimerRef = useRef(null);

  // Initialize GPT Rewarded Ad Slot on open
  useEffect(() => {
    if (!isOpen) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    setAdState('initializing');
    setCountdown(30);
    setProgress(0);
    rewardGrantedRef.current = false;
    setErrorMessage('');

    const adUnitPath =
      process.env.NEXT_PUBLIC_GAM_REWARDED_AD_UNIT ||
      '/21775744923/example/rewarded';

    // Check if googletag is loaded or set up
    if (typeof window !== 'undefined') {
      window.googletag = window.googletag || { cmd: [] };

      // Set timeout fallback: if GPT takes > 4s to initialize or fails to fill, offer simulated ad
      const initTimeout = setTimeout(() => {
        if (adState === 'initializing') {
          setAdState('ready');
        }
      }, 3500);

      window.googletag.cmd.push(() => {
        try {
          if (!window.googletag.enums?.OutOfPageFormat?.REWARDED) {
            clearTimeout(initTimeout);
            setAdState('ready');
            return;
          }

          const rewardedSlot = window.googletag.defineOutOfPageSlot(
            adUnitPath,
            window.googletag.enums.OutOfPageFormat.REWARDED,
          );

          if (!rewardedSlot) {
            clearTimeout(initTimeout);
            setAdState('ready');
            return;
          }

          rewardedSlotRef.current = rewardedSlot;
          rewardedSlot.addService(window.googletag.pubads());

          window.googletag.pubads().addEventListener('rewardedSlotReady', (event) => {
            clearTimeout(initTimeout);
            setAdState('ready');
            window._makeRewardedAdVisible = () => {
              setAdState('playing');
              event.makeRewardedVisible();
            };
          });

          window.googletag.pubads().addEventListener('rewardedSlotGranted', (event) => {
            rewardGrantedRef.current = true;
            setAdState('completed');
            if (onRewardEarned) {
              onRewardEarned(event.payload || { type: 'gpt_reward' });
            }
          });

          window.googletag.pubads().addEventListener('rewardedSlotClosed', () => {
            if (rewardedSlotRef.current && window.googletag) {
              window.googletag.destroySlots([rewardedSlotRef.current]);
              rewardedSlotRef.current = null;
            }

            if (!rewardGrantedRef.current) {
              setAdState('failed');
              setErrorMessage(
                'The ad was closed before finishing. You must watch the entire sponsor video to publish for free.',
              );
            }
          });

          window.googletag.enableServices();
          window.googletag.display(rewardedSlot);
        } catch (e) {
          console.warn('[GPT Rewarded] initialization notice:', e);
          clearTimeout(initTimeout);
          setAdState('ready');
        }
      });

      return () => {
        clearTimeout(initTimeout);
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        if (rewardedSlotRef.current && window.googletag) {
          window.googletag.cmd.push(() => {
            window.googletag.destroySlots([rewardedSlotRef.current]);
            rewardedSlotRef.current = null;
          });
        }
      };
    }
  }, [isOpen, adState, onRewardEarned]);

  // Start watching ad (uses live GPT or active simulator)
  const handleStartWatchAd = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window._makeRewardedAdVisible === 'function') {
      try {
        window._makeRewardedAdVisible();
        return;
      } catch (e) {
        console.warn('Failed to make live GPT ad visible, falling back to simulator:', e);
      }
    }

    // Interactive 30s Rewarded Video simulation
    setAdState('simulating');
    setCountdown(30);
    setProgress(0);

    const totalSeconds = 30;
    let elapsed = 0;

    simTimerRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setCountdown(remaining);
      setProgress((elapsed / totalSeconds) * 100);

      if (remaining <= 0) {
        clearInterval(simTimerRef.current);
        rewardGrantedRef.current = true;
        setAdState('completed');
        if (onRewardEarned) {
          onRewardEarned({ type: 'simulated_reward', duration: 30 });
        }
      }
    }, 1000);
  }, [onRewardEarned]);

  if (!isOpen) return null;

  return (
    <>
      <Script
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
        strategy="afterInteractive"
      />

      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-stone-100 overflow-hidden">
          
          {/* Close button */}
          {adState !== 'simulating' && adState !== 'playing' && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--emerald-primary)] ring-8 ring-emerald-50/50">
            {adState === 'completed' ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600 animate-bounce" />
            ) : adState === 'failed' ? (
              <AlertCircle className="h-8 w-8 text-amber-600" />
            ) : adState === 'simulating' || adState === 'playing' ? (
              <Volume2 className="h-8 w-8 text-emerald-600 animate-pulse" />
            ) : (
              <Sparkles className="h-8 w-8 text-[var(--emerald-primary)]" />
            )}
          </div>

          <h3 className="text-xl font-bold text-[var(--ink)] font-display">
            {adState === 'completed'
              ? '🎉 Reward Granted! Publishing...'
              : adState === 'simulating' || adState === 'playing'
              ? 'Watching Sponsor Ad...'
              : 'Publish for Free'}
          </h3>

          <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
            {adState === 'completed'
              ? 'Thank you for watching! Your custom invitation is being published live.'
              : adState === 'simulating' || adState === 'playing'
              ? 'Keep this window open to earn your free publishing reward.'
              : 'Watch a short 30-second sponsor ad to publish your custom template for free.'}
          </p>

          {/* Ad Status & Interactive Area */}
          <div className="my-6">
            {adState === 'initializing' && (
              <div className="flex items-center justify-center gap-2 text-sm text-stone-500 py-4 bg-stone-50 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--emerald-primary)]" />
                Loading sponsor ad...
              </div>
            )}

            {adState === 'ready' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleStartWatchAd}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <PlayCircle className="h-5 w-5" />
                  Watch 30s Ad & Publish Free
                </button>
                <div className="text-[11px] text-stone-400">
                  ⚡ 1 free template per account · Google Ad supported
                </div>
              </div>
            )}

            {(adState === 'simulating' || adState === 'playing') && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-stone-900 p-5 text-white shadow-inner">
                <div className="flex items-center justify-between text-xs text-emerald-200 mb-2 font-mono">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    SPONSOR VIDEO AD
                  </span>
                  <span>{countdown}s remaining</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="text-[12px] text-stone-300">
                  Please don't close this modal while the sponsor video plays.
                </div>
              </div>
            )}

            {adState === 'completed' && (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 py-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Generating your live invitation link...
              </div>
            )}

            {adState === 'failed' && (
              <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 text-left border border-amber-200">
                <p className="font-semibold mb-1">Ad Incomplete</p>
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAdState('ready');
                  }}
                  className="mt-3 inline-block font-bold text-emerald-700 underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Option to Upgrade directly to Paid Ad-Free */}
          <div className="border-t border-stone-100 pt-4 flex items-center justify-between text-xs text-stone-500">
            <span>Want a 100% ad-free invite?</span>
            <button
              type="button"
              onClick={() => {
                if (onUpgradeToPaid) {
                  onUpgradeToPaid();
                } else if (onClose) {
                  onClose();
                }
              }}
              className="font-bold text-[var(--emerald-primary)] hover:underline flex items-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Publish Ad-Free for ₹399 →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
