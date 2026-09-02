'use client';

import React from 'react';
import {
  MonetagTopHeaderBanner,
  MonetagInFeedBanner,
  MonetagParallaxAd,
  MonetagPopunderAd,
  MonetagInPagePushAd,
  MonetagFeaturedPartnersGrid,
  MonetagStickyBottomBanner,
} from '@/components/ads/MonetagAdUnits';
import { InFeedAdBanner } from '@/components/ads/GoogleAdUnits';
import FreeTierViralBadge from '@/components/ads/FreeTierViralBadge';

/**
 * Free Tier Ads & Viral Branding Container
 *
 * Renders on free-tier published invitations (/i/[slug]).
 * Displays:
 * 1. Monetag OnClick Popunder & Vignette Interstitials
 * 2. Monetag In-Page Push Notifications
 * 3. Responsive Google AdSense / In-Feed Unit
 * 4. High-Impact Parallax Scroll Sponsor Spotlight
 * 5. Mid-Page Native Sponsor Card
 * 6. Curated 4-Card Wedding Partners Deal Grid
 * 7. Mobile Sticky Bottom Sponsor Bar
 * 8. Viral 'Create for Free' & 'Remove Ads' Host Badge
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

      {/* 3. Responsive Google AdSense In-Feed Banner */}
      <InFeedAdBanner />

      {/* 4. High-Impact Parallax Scroll Ad Window */}
      <MonetagParallaxAd />

      {/* 5. Mid-Page Native In-Feed Sponsor Card */}
      <MonetagInFeedBanner />

      {/* 6. Curated 4-Card Wedding Partner Deal Showcase Grid */}
      <MonetagFeaturedPartnersGrid />

      {/* 7. Mobile Sticky Bottom Floating Sponsor Bar */}
      <MonetagStickyBottomBanner />

      {/* 8. Viral 'Create for Free' Logo & Ad-Free Upgrade Badge */}
      <FreeTierViralBadge
        invitationId={invitationId}
        slug={slug}
      />
    </>
  );
}
