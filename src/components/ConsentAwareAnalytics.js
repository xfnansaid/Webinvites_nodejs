'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { hasConsent } from '@/lib/cookie-consent';

/**
 * Consent-aware Google Analytics loader.
 * Only loads GA scripts when the user has given analytics consent.
 *
 * This component MUST be client-side ('use client') because
 * it reads consent preferences from localStorage.
 */
export default function ConsentAwareAnalytics() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  useEffect(() => {
    // Check initial consent
    setHasAnalyticsConsent(hasConsent('analytics'));

    // Listen for consent changes
    const handler = () => {
      setHasAnalyticsConsent(hasConsent('analytics'));
    };
    window.addEventListener('cookie-consent-updated', handler);
    return () => window.removeEventListener('cookie-consent-updated', handler);
  }, []);

  // Don't load analytics if no consent
  if (!hasAnalyticsConsent) return null;

  return (
    <>
      {/* Google Analytics 4 (GA4) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-BPNYZQ4PHZ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BPNYZQ4PHZ', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
