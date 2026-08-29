'use client';

import React, { useState, useEffect } from 'react';
import { hasConsent } from '@/lib/cookie-consent';
import {
  MonetagInFeedBanner,
  MonetagParallaxAd,
  MonetagStickyBottomBanner,
  MonetagPopunderAd,
  MonetagInPagePushAd,
} from '@/components/ads/MonetagAdUnits';
import { InFeedAdBanner } from '@/components/ads/GoogleAdUnits';
import FreeTierViralBadge from '@/components/ads/FreeTierViralBadge';

/**
 * Consent-aware ad container.
 * Only renders ads when the user has given advertising consent.
 * Shows nothing (or a placeholder) when consent is not given.
 *
 * This component MUST be used client-side ('use client') because
 * it reads consent preferences from localStorage.
 */
export default function ConsentAwareAds({ invitationId, slug, isAdSupported }) {
  const [hasAdConsent, setHasAdConsent] = useState(false);

  useEffect(() => {
    // Check initial consent
    setHasAdConsent(hasConsent('advertising'));

    // Listen for consent changes
    const handler = () => {
      setHasAdConsent(hasConsent('advertising'));
    };
    window.addEventListener('cookie-consent-updated', handler);
    return () => window.removeEventListener('cookie-consent-updated', handler);
  }, []);

  // Don't render anything if not ad-supported or no consent
  if (!isAdSupported || !hasAdConsent) {
    return null;
  }

  return (
    <>
      {/* 1. Onclick Popunder Listener on first guest tap */}
      <MonetagPopunderAd />

      {/* 2. In-Page Push Notifications */}
      <MonetagInPagePushAd />

      {/* 3. High-Impact Parallax Scroll Ad Window */}
      <MonetagParallaxAd />

      {/* 4. Mid-Page Native In-Feed Sponsor Card */}
      <MonetagInFeedBanner />

      {/* 5. Mobile Floating Sticky Bottom Ad Bar */}
      <MonetagStickyBottomBanner />

      {/* 6. Viral 'Create for Free' Logo & Ad-Free Upgrade Badge */}
      <FreeTierViralBadge
        invitationId={invitationId}
        slug={slug}
      />
    </>
  );
}
