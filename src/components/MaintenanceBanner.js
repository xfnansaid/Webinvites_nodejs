'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageCircle, RefreshCw, Sparkles, Heart } from 'lucide-react';
import { SUPPORT_WHATSAPP } from '@/lib/support-config';

/**
 * MaintenanceBanner — Friendly, simple, and elegant downtime screen.
 * Safety:
 * - Automatically bypasses /admin, /signin, and /api routes so admins are NEVER locked out.
 * - Warm, light, reassuring aesthetic matching the wedding invites brand.
 */
export default function MaintenanceBanner({ forceOpen = false, onForceClose = null, customConfig = null }) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(customConfig);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Strict admin paths whitelist — NEVER lock out operator routes
  const isWhitelistedPath =
    !forceOpen &&
    (pathname?.startsWith('/admin') ||
      pathname?.startsWith('/signin') ||
      pathname?.startsWith('/api'));

  useEffect(() => {
    setMounted(true);

    if (customConfig) {
      setMaintenance(customConfig);
      return;
    }

    async function checkMaintenance() {
      try {
        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.config?.maintenance?.enabled) {
          setMaintenance(data.config.maintenance);
        } else {
          setMaintenance(null);
        }
      } catch (err) {
        // Non-blocking fallback
      }
    }

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 20_000);
    return () => clearInterval(interval);
  }, [customConfig]);

  if (!mounted || isWhitelistedPath || (!forceOpen && !maintenance?.enabled)) {
    return null;
  }

  const cleanWhatsapp = (maintenance?.supportWhatsapp || SUPPORT_WHATSAPP || '919846012345').replace(/\D/g, '');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Soft Warm Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-[#071d15]/50 backdrop-blur-md"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-900/10 bg-white p-7 sm:p-9 text-center shadow-2xl z-10 my-auto"
        >
          {/* Subtle Ambient Glow Background */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-100/60 blur-3xl pointer-events-none" />

          {/* Close button for admin preview mode only */}
          {forceOpen && onForceClose && (
            <button
              onClick={onForceClose}
              className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Exit Preview
            </button>
          )}

          {/* Animated Friendly Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-50 to-amber-50 border border-emerald-100/80 text-emerald-700 shadow-sm relative">
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
            <Sparkles className="h-8 w-8 text-emerald-700 animate-pulse" />
          </div>

          {/* Simple Pill Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/60 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
            Quick Update in Progress
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-[1.75rem] font-bold text-slate-900 tracking-tight mb-2.5 font-serif leading-snug">
            {maintenance?.title || "We'll Be Right Back!"}
          </h2>

          {/* Message */}
          <p className="text-sm text-slate-600 leading-relaxed mb-5 font-sans">
            {maintenance?.message || "We're making some quick improvements behind the scenes. Everything will be back up and running shortly!"}
          </p>

          {/* Estimated Duration Chip */}
          {maintenance?.estimatedReturn && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 mb-6">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{maintenance.estimatedReturn}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0e3b2e] hover:bg-[#08261e] text-white text-sm font-bold shadow-md shadow-emerald-950/15 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Check Again'}</span>
            </button>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('Hi, I am visiting the website and would like to ask a quick question.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold border border-emerald-200/60 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Need help? Chat on WhatsApp</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
