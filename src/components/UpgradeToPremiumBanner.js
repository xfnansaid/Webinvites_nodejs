'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Crown,
  ShieldCheck,
  X,
  Clock,
  Check,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { getInviteExpiry } from '@/lib/invite-expiry-client';

function isPremiumInvite(invitation) {
  if (!invitation) return false;
  return Boolean(
    invitation.tier === 'premium' ||
    invitation.is_ad_supported === false ||
    (invitation.razorpay_payment_id && String(invitation.razorpay_payment_id).startsWith('pay_')) ||
    (invitation.razorpay_order_id && String(invitation.razorpay_order_id).startsWith('admin_') && invitation.paid_at),
  );
}

/**
 * Upgrade to Premium banner shown on the edit page for free tier invitations.
 * Shows expiry countdown and a prominent "Upgrade to Premium — ₹399" CTA leading to /checkout.
 */
export default function UpgradeToPremiumBanner({ invitation }) {
  const [dismissed, setDismissed] = useState(false);

  const expiryInfo = useMemo(() => getInviteExpiry(invitation), [invitation]);
  const isFreeTier = !isPremiumInvite(invitation);
  const isExpired = expiryInfo?.isExpired || invitation?.is_active === false;

  // Don't show if already premium or dismissed
  if (!isFreeTier || dismissed) return null;

  const checkoutUrl = `/checkout?invitationId=${encodeURIComponent(invitation.id)}&slug=${encodeURIComponent(invitation.slug || '')}`;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${
      isExpired
        ? 'bg-gradient-to-br from-red-50/90 via-white to-amber-50/50 border-red-200'
        : expiryInfo.daysRemaining !== null && expiryInfo.daysRemaining <= 7
          ? 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 border-amber-200'
          : 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-amber-200/70'
    }`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
            isExpired
              ? 'bg-red-100 text-red-600'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {isExpired ? (
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-[var(--ink)]">
                {isExpired
                  ? '⚠️ Free invitation has expired'
                  : 'Upgrade to Premium'
                }
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Free Tier
              </span>
            </div>

            {isExpired ? (
              <p className="text-xs sm:text-sm text-red-700/80 leading-relaxed mb-3">
                Your free invitation expired and is no longer visible to guests.
                Upgrade to <strong>Premium (₹399)</strong> to reactivate your link and keep it
                live until 3 days after your event — completely ad-free.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-amber-900/70 leading-relaxed mb-3">
                Your free invitation has ads and will expire in{' '}
                <strong className="text-amber-900">
                  {expiryInfo.daysRemaining} day{expiryInfo.daysRemaining !== 1 ? 's' : ''}
                </strong>.
                Upgrade to <strong>Premium (₹399)</strong> for ad-free hosting until 3 days
                after your event.
              </p>
            )}

            {/* Features comparison */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                <span className="text-red-700/80">Ads on page</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-emerald-700">No ads — premium</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                <span className="text-red-700/80">Expires in 21 days</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-emerald-700">Until 3 days post-event</span>
              </div>
            </div>

            {/* CTA linking to clean dedicated checkout */}
            <a
              href={checkoutUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] transition-all group"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to Premium — ₹399</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-amber-400/60 hover:text-amber-600 hover:bg-amber-100/50 transition-colors"
            aria-label="Dismiss upgrade banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
