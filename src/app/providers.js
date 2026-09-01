'use client';

import React, { Suspense } from 'react';
import { AuthProvider } from '@/lib/auth';
import TopProgressBar from '@/components/ui/TopProgressBar';
import BrandLoader from '@/components/ui/BrandLoader';
import CookieConsent from '@/components/CookieConsent';

/**
 * App-level providers wrapped in 'use client'.
 * Mounts AuthProvider, TopProgressBar route transition indicator, BrandLoader,
 * and GDPR-compliant Cookie Consent banner.
 */
export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <BrandLoader />
      <CookieConsent />
      {children}
    </AuthProvider>
  );
}
