'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Clock,
  Lock,
  Sparkles,
  ArrowRight,
  Heart,
  ExternalLink,
  MessageCircle,
  Copy,
  CheckCircle2,
  Calendar,
  Timer,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { buildWhatsAppShareText } from '@/lib/share-text';

function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Beautiful expired invitation page shown when:
 * - Free tier: 21 days since publish
 * - Premium: 3 days after event date
 */
export default function InviteExpiredPage({
  invitation,
  expiryInfo,
  slug,
}) {
  const [copied, setCopied] = useState(false);

  const tier = expiryInfo?.tier || 'free';
  const isFreeTier = tier === 'free';
  const isPremiumExpired = expiryInfo?.reason === 'premium_expired';

  const bride = invitation?.bride_name || '';
  const groom = invitation?.groom_name || '';
  const couple = [bride, groom].filter(Boolean).join(' & ');
  const eventDate = invitation?.wedding_date;
  const venue = invitation?.venue || '';

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = process.env.NEXT_PUBLIC_APP_URL || `${window.location.protocol}//${window.location.host}`;
    return `${String(base).replace(/\/$/, '')}/i/${encodeURIComponent(slug || '')}`;
  }, [slug]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [shareUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = buildWhatsAppShareText({
      templateId: invitation?.template_id,
      templateData: invitation?.template_data,
      brideName: invitation?.bride_name,
      groomName: invitation?.groom_name,
      weddingDate: invitation?.wedding_date,
      venue: invitation?.venue,
      venueAddress: invitation?.venue_address,
      shareUrl,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }, [invitation, shareUrl]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center px-4 py-12 sm:py-20">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main Card */}
        <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Top decorative strip */}
          <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-stone-800/50 to-stone-900/50">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                {isFreeTier ? (
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400/80" />
                ) : (
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400/80" />
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 text-center">
            {/* Status badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-4 sm:mb-5">
              <AlertTriangle className="w-3 h-3" />
              {isFreeTier ? 'Free Tier Expired' : 'Invitation Expired'}
            </div>

            {/* Couple names */}
            {couple && (
              <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight tracking-tight mb-2">
                {couple}
              </h1>
            )}

            {/* Event date */}
            {eventDate && (
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{prettyDate(eventDate)}</span>
              </div>
            )}
            {venue && (
              <div className="text-white/30 text-xs mb-6 sm:mb-8">
                {venue}
              </div>
            )}

            {/* Expiry message */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-start gap-3 text-left">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mt-0.5">
                  <Timer className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base mb-1.5">
                    {isFreeTier
                      ? 'Your free invitation link has expired'
                      : 'This invitation is no longer available'
                    }
                  </h3>
                  <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                    {isFreeTier
                      ? `Free invitations are viewable for 21 days after publishing. Your link expired and is no longer accessible to guests. Upgrade to Premium to keep your invitation live permanently until 3 days after your event.`
                      : `Premium invitations expire 3 days after the event date. Your event has passed and the invitation link has been deactivated.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* CTA: Upgrade / Pay */}
            {isFreeTier && (
              <Link
                href={`/edit/${encodeURIComponent(invitation?.id || '')}`}
                className="group w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] transition-all mb-4"
              >
                <Sparkles className="w-5 h-5" />
                Upgrade to Premium — ₹399
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            {isPremiumExpired && (
              <Link
                href="/"
                className="group w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] transition-all mb-4"
              >
                <Sparkles className="w-5 h-5" />
                Create a New Invitation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            {/* Share link (still visible so owner can copy) */}
            {shareUrl && (
              <div className="mb-5">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <ExternalLink className="w-4 h-4 shrink-0 text-white/30" />
                  <span className="truncate text-xs font-medium text-white/30">
                    {shareUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white/80 text-[11px] font-bold transition-colors"
                  >
                    {copied ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/60 hover:text-white/90 hover:bg-white/[0.1] text-xs font-bold transition-colors"
              >
                <Heart className="w-3.5 h-3.5" />
                Browse Templates
              </Link>
            </div>
          </div>
        </div>

        {/* Brand footer */}
        <div className="mt-8 text-center">
          <div className="text-white/15 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold">
            WEB INVITES
          </div>
          <div className="text-white/10 text-[10px] mt-1">
            Digital Wedding Invitations
          </div>
        </div>
      </div>
    </main>
  );
}
