'use client';

import React, { useState, useEffect } from 'react';
import { hasConsent } from '@/lib/cookie-consent';

/**
 * ConsentGate - Conditionally renders children based on cookie consent.
 *
 * Usage:
 *   <ConsentGate category="analytics">
 *     <GoogleAnalytics />
 *   </ConsentGate>
 *
 *   <ConsentGate category="advertising">
 *     <AdBanner />
 *   </ConsentGate>
 *
 * If consent is not yet given, children are NOT rendered.
 * If consent is given, children ARE rendered.
 * If consent is later withdrawn, children stop rendering.
 *
 * The `fallback` prop is rendered when consent is not given.
 */
export default function ConsentGate({ category, children, fallback = null }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    // Check initial consent
    setConsented(hasConsent(category));

    // Listen for consent changes
    const handler = () => {
      setConsented(hasConsent(category));
    };
    window.addEventListener('cookie-consent-updated', handler);
    return () => window.removeEventListener('cookie-consent-updated', handler);
  }, [category]);

  if (!consented) return fallback;
  return children;
}
