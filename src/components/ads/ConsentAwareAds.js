'use client';

import React from 'react';
import {
  MonetagInFeedBanner,
  MonetagParallaxAd,
  MonetagPopunderAd,
  MonetagInPagePushAd,
} from '@/components/ads/MonetagAdUnits';
import FreeTierViralBadge from '@/components/ads/FreeTierViralBadge';

/**
 * Free Tier Ads & Viral Branding Container
 *
 * Renders on free-tier published invitations (/i/[slug]).
 * Displays:
 * 1. Monetag OnClick Popunder & Vignette Interstitials
 * 2. Monetag In-Page Push Notifications
 * 3. Parallax Scroll Sponsor Spotlight
 * 4. In-Feed Native Partner Banner
 * 5. Mobile Sticky Bottom Sponsor Bar
 * 6. Viral 'Create for Free' & 'Remove Ads' Host Badge
 *
 * Automatically hidden on paid / premium invitations (isAdSupported === false).
 */
export default function ConsentAwareAds({ invitationId, slug, isAdSupported }) {
  if (!isAdSupported) {
    return null;
  }

  return (
    <>
      {/* 1. Onclick Popunder & Vignette Interstitials on Guest Interaction */}
      <MonetagPopunderAd />

      {/* 2. In-Page Push Notifications */}
      <MonetagInPagePushAd />

      {/* 3. High-Impact Parallax Scroll Ad Window */}
      <MonetagParallaxAd />

      {/* 4. Mid-Page Native In-Feed Sponsor Card */}
      <MonetagInFeedBanner />

      {/* 5. Viral 'Create for Free' Logo & Ad-Free Upgrade Badge */}
      <FreeTierViralBadge
        invitationId={invitationId}
        slug={slug}
      />
    </>
  );
}
