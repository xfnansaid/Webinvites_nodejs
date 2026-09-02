'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Compass,
  Heart,
  Gem,
  Camera,
  Utensils,
  Plane,
  Gift,
  ChevronRight,
} from 'lucide-react';

/**
 * MonetagTopHeaderBanner
 *
 * High-visibility sponsor announcement ribbon fixed at the top of the invitation.
 */
export function MonetagTopHeaderBanner({ directLinkUrl }) {
  const adUrl =
    directLinkUrl ||
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL ||
    'https://omg10.com/4/11680626';

  return (
    <div className="w-full bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-950 text-white border-b border-amber-400/25 py-2.5 px-3 sm:px-4 shadow-md print:hidden">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40">
            <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
          </span>
          <span className="text-[11px] sm:text-xs text-stone-200 font-medium">
            <span className="font-bold text-amber-300">Special Sponsor:</span> Exclusive Wedding Deals &amp; Discounts (Honeymoons, Jewelry &amp; Venues)
          </span>
        </div>
        <a
          href={adUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-[11px] tracking-wide transition-transform active:scale-95 shadow-sm"
        >
          <span>Claim Deals</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/**
 * MonetagInFeedBanner
 *
 * Responsive native in-feed banner card placed between invitation sections.
 */
export function MonetagInFeedBanner({ directLinkUrl }) {
  const adUrl =
    directLinkUrl ||
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL ||
    'https://omg10.com/4/11680626';

  return (
    <div className="w-full max-w-lg mx-auto my-8 px-4 print:hidden">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 p-4 sm:p-5 text-white shadow-xl border border-stone-700/60">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3 w-3" />
            <span>Featured Partner</span>
          </div>
          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
            SPONSORED
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          <div className="text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-stone-100 font-display">
              Exclusive Deals &amp; Wedding Specials
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Explore hand-curated gifts, venue bookings &amp; offers
            </p>
          </div>

          <a
            href={adUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <span>Explore Now</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * MonetagParallaxAd
 *
 * Implements a high-impact parallax scroll reveal window inside the invitation.
 * As guests scroll down the wedding card, a stylish sponsor window reveals with depth.
 */
export function MonetagParallaxAd({ directLinkUrl }) {
  const adUrl =
    directLinkUrl ||
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL ||
    'https://omg10.com/4/11680626';

  return (
    <div className="w-full my-10 px-4 max-w-xl mx-auto print:hidden">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-300/80 bg-stone-950">
        {/* Parallax Container */}
        <div
          className="relative min-h-[170px] sm:min-h-[200px] flex items-center justify-center p-6 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(13, 50, 36, 0.95), rgba(6, 24, 18, 0.98))`,
          }}
        >
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />

          {/* Content Overlay */}
          <div className="relative z-10 text-center space-y-2.5 max-w-md">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>Sponsor Spotlight</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-wide">
              Planning Your Own Special Celebration?
            </h3>

            <p className="text-xs text-stone-300 font-light max-w-xs mx-auto">
              Check out trending vendor discounts, decor ideas &amp; honeymoon offers.
            </p>

            <div className="pt-2">
              <a
                href={adUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs shadow-lg shadow-amber-400/20 transition-transform active:scale-95"
              >
                <span>View Special Offers</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MonetagFeaturedPartnersGrid
 *
 * 4-card interactive wedding partners showcase with categorized deals and direct clickout.
 */
export function MonetagFeaturedPartnersGrid({ directLinkUrl }) {
  const adUrl =
    directLinkUrl ||
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL ||
    'https://omg10.com/4/11680626';

  const deals = [
    {
      title: 'Honeymoon Packages & Flights',
      desc: 'All-inclusive resort deals & luxury getaways',
      icon: Plane,
      badge: 'Up to 40% OFF',
      badgeColor: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
    },
    {
      title: 'Bridal Gold & Diamond Jewelry',
      desc: 'Handcrafted wedding sets & bespoke designs',
      icon: Gem,
      badge: 'Trending Designs',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    },
    {
      title: 'Wedding Banquets & Catering',
      desc: 'Top-rated wedding halls & gourmet banquets',
      icon: Utensils,
      badge: 'Special Booking Deals',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
    },
    {
      title: 'Cinematic Photo & Video',
      desc: 'Capture every unforgettable celebration moment',
      icon: Camera,
      badge: 'Top Photographers',
      badgeColor: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto my-10 px-4 print:hidden">
      <div className="rounded-3xl bg-white/95 backdrop-blur-md p-5 sm:p-6 border border-stone-200/90 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Gift className="h-3.5 w-3.5 text-amber-700" />
            </span>
            <span className="text-sm font-bold text-stone-900 font-display">
              Curated Wedding Partner Deals
            </span>
          </div>
          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
            SPONSORED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {deals.map((deal, idx) => {
            const Icon = deal.icon;
            return (
              <a
                key={idx}
                href={adUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 p-3.5 text-white border border-stone-800 hover:border-amber-400/50 shadow-sm transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-amber-300 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${deal.badgeColor}`}
                    >
                      {deal.badge}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-100 font-display line-clamp-1 group-hover:text-amber-200 transition-colors">
                    {deal.title}
                  </h5>
                  <p className="text-[10px] text-stone-400 leading-tight line-clamp-2">
                    {deal.desc}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1 text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * MonetagStickyBottomBanner
 *
 * Mobile sticky bottom floating ad bar for guest view.
 */
export function MonetagStickyBottomBanner({ directLinkUrl }) {
  const adUrl =
    directLinkUrl ||
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL ||
    'https://omg10.com/4/11680626';

  return (
    <div className="w-full max-w-lg mx-auto my-4 px-4 print:hidden">
      <div className="flex items-center justify-between gap-3 bg-stone-900 text-white rounded-2xl p-3 border border-amber-400/30 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-bold truncate text-stone-100">
              Wedding Registry &amp; Special Offers
            </div>
            <div className="text-[9px] text-stone-400 truncate">
              Sponsored partner discounts &amp; gifting deals
            </div>
          </div>
        </div>

        <a
          href={adUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-[11px] shadow-sm transition-transform active:scale-95"
        >
          <span>View Deals</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/**
 * MonetagPopunderAd
 *
 * Implements Monetag Official Onclick (Popunder) & Vignette scripts:
 * - Onclick Zone: 11681268 (https://al5sm.com/tag.min.js)
 * - Vignette Zone: 11680224 (https://n6wxm.com/vignette.min.js)
 *
 * Runs on free-tier invitation pages (/i/[slug]) to monetize guest interactions.
 */
export function MonetagPopunderAd({ directLinkUrl, onclickZoneId, vignetteZoneId }) {
  const onclickZone =
    onclickZoneId || process.env.NEXT_PUBLIC_MONETAG_ONCLICK_ZONE_ID || '11681268';
  const vignetteZone =
    vignetteZoneId || process.env.NEXT_PUBLIC_MONETAG_VIGNETTE_ZONE_ID || '11680224';
  const adUrl =
    directLinkUrl ||
    process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL ||
    'https://omg10.com/4/11680626';

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Inject official Monetag OnClick script tag
    const onclickScriptId = `monetag-onclick-${onclickZone}`;
    if (!document.getElementById(onclickScriptId)) {
      try {
        const s = document.createElement('script');
        s.id = onclickScriptId;
        s.dataset.zone = String(onclickZone);
        s.src = 'https://al5sm.com/tag.min.js';
        s.async = true;
        const target = [document.documentElement, document.body].filter(Boolean).pop();
        if (target) target.appendChild(s);
      } catch (err) {
        console.warn('Monetag onclick injection:', err);
      }
    }

    // 2. Inject official Monetag Vignette script tag
    const vignetteScriptId = `monetag-vignette-${vignetteZone}`;
    if (!document.getElementById(vignetteScriptId)) {
      try {
        const v = document.createElement('script');
        v.id = vignetteScriptId;
        v.dataset.zone = String(vignetteZone);
        v.src = 'https://n6wxm.com/vignette.min.js';
        v.async = true;
        const target = [document.documentElement, document.body].filter(Boolean).pop();
        if (target) target.appendChild(v);
      } catch (err) {
        console.warn('Monetag vignette injection:', err);
      }
    }

    // 3. Frequency-capped direct link fallback trigger (max 1 per session)
    const handleFirstTap = (e) => {
      const target = e.target;
      // Do not intercept clicks on checkout, create, or dashboard buttons
      if (
        target?.closest('button[aria-label="Close"]') ||
        target?.closest('a[href*="/checkout"]') ||
        target?.closest('a[href*="/create"]') ||
        target?.closest('a[href*="/edit"]') ||
        target?.closest('a[href*="/dashboard"]') ||
        target?.closest('a[href*="/signin"]')
      ) {
        return;
      }

      try {
        const popCount = parseInt(sessionStorage.getItem('monetag_pop_count') || '0', 10);
        if (popCount < 1) {
          sessionStorage.setItem('monetag_pop_count', String(popCount + 1));
          window.open(adUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (e) {
        // Safe failover
      }
    };

    window.addEventListener('click', handleFirstTap, { once: false });
    return () => {
      window.removeEventListener('click', handleFirstTap);
    };
  }, [onclickZone, vignetteZone, adUrl]);

  return null;
}

/**
 * MonetagInPagePushAd
 *
 * Implements Monetag Official In-Page Push (IPP) tag:
 * - In-Page Push Zone: 11683927 (https://nap5k.com/tag.min.js)
 *
 * Runs automatically on free-tier invitation pages (/i/[slug]) to display high-CTR native push notifications.
 */
export function MonetagInPagePushAd({ pushZoneId }) {
  const zoneId =
    pushZoneId || process.env.NEXT_PUBLIC_MONETAG_INPAGE_PUSH_ZONE_ID || '11683927';

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const scriptId = `monetag-inpage-push-${zoneId}`;
    if (!document.getElementById(scriptId)) {
      try {
        const s = document.createElement('script');
        s.id = scriptId;
        s.dataset.zone = String(zoneId);
        s.src = 'https://nap5k.com/tag.min.js';
        s.async = true;
        const target = [document.documentElement, document.body].filter(Boolean).pop();
        if (target) target.appendChild(s);
      } catch (err) {
        console.warn('Monetag in-page push injection:', err);
      }
    }
  }, [zoneId]);

  return null;
}



