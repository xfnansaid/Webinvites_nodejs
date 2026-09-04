'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, X, ArrowRight, BellRing } from 'lucide-react';

/**
 * WhatsNewModal — Pop-up dialog highlighting recent platform updates & enhancements.
 * Features:
 * - Admin-configurable headline, subtitle, changes list, versionTag, and CTA.
 * - Dismissal memory via localStorage (keyed by versionTag).
 * - Smooth Framer Motion transitions with backdrop blur.
 */
export default function WhatsNewModal({ forceOpen = false, onForceClose = null, customConfig = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(customConfig);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (customConfig) {
      setConfig(customConfig);
      if (forceOpen) {
        setIsOpen(true);
      }
      return;
    }

    async function loadSettings() {
      try {
        const res = await fetch(`/api/site-settings?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const whatsNew = data?.config?.whatsNew;

        if (whatsNew && whatsNew.enabled) {
          setConfig(whatsNew);
          const storageKey = `seen_updates_${whatsNew.versionTag || 'v1'}`;
          const hasSeen = localStorage.getItem(storageKey);

          if (!hasSeen || forceOpen) {
            // Slight delay so the homepage hero finishes initial mount
            setTimeout(() => {
              setIsOpen(true);
            }, 800);
          }
        }
      } catch (err) {
        // Silently ignore
      }
    }

    loadSettings();
  }, [forceOpen, customConfig]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (onForceClose) onForceClose();
    if (config?.versionTag) {
      try {
        localStorage.setItem(`seen_updates_${config.versionTag}`, 'true');
      } catch (e) {}
    }
  };

  if (!mounted || !config) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-white via-white to-[#FDFBF7] shadow-2xl z-10 my-auto"
          >
            {/* Header Accent Glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-amber-200/40 to-emerald-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-tr from-emerald-200/30 to-amber-200/30 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Badge & Icon */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  {config.versionTag || "What's New"}
                </span>
                <span className="text-xs font-semibold text-slate-400">Platform Update</span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2 font-serif">
                {config.title || "What's New in Web Invites"}
              </h2>
              <p className="text-sm text-slate-600 mb-6 font-sans">
                {config.subtitle || "Here's what we've recently improved to make your invitation experience even better:"}
              </p>

              {/* Changes List */}
              <div className="space-y-3 mb-6 max-h-[42vh] overflow-y-auto pr-1">
                {(config.changes || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed font-sans">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={config.buttonLink || '#templates'}
                  onClick={handleDismiss}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0e3b2e] hover:bg-[#092920] text-white text-sm font-bold shadow-lg shadow-emerald-950/15 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>{config.buttonText || "Explore Templates"}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  onClick={handleDismiss}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-bold transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
