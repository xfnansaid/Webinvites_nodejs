'use client';

import React, { Suspense } from 'react';
import { AuthProvider } from '@/lib/auth';
import TopProgressBar from '@/components/ui/TopProgressBar';
import BrandLoader from '@/components/ui/BrandLoader';

/**
 * App-level providers wrapped in 'use client'.
 * Mounts AuthProvider, TopProgressBar route transition indicator, and BrandLoader.
 */
export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <BrandLoader />
      {children}
    </AuthProvider>
  );
}
