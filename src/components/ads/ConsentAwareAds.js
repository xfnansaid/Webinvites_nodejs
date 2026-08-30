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
  const [razorpayOpen, setRazorpayOpen] = useState(false);

  useEffect(() => {
    setHasAdConsent(hasConsent('advertising'));

    const onConsentUpdate = () => setHasAdConsent(hasConsent('advertising'));
    const onRazorpayOpen = () => setRazorpayOpen(true);
    const onRazorpayClose = () => setRazorpayOpen(false);

    window.addEventListener('cookie-consent-updated', onConsentUpdate);
    window.addEventListener('razorpay-open', onRazorpayOpen);
    window.addEventListener('razorpay-close', onRazorpayClose);
    return () => {
      window.removeEventListener('cookie-consent-updated', onConsentUpdate);
      window.removeEventListener('razorpay-open', onRazorpayOpen);
      window.removeEventListener('razorpay-close', onRazorpayClose);
    };
  }, []);

  if (!isAdSupported || !hasAdConsent || razorpayOpen) {
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
