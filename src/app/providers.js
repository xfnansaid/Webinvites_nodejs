'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth';

/**
 * App-level providers wrapped in 'use client'.
 * All client-side hooks (useAuth, etc.) are usable inside AuthProvider.
 *
 * We use a separate client component so RootLayout (a server component in
 * Next.js 13+) can still generate metadata and fonts at request time without
 * becoming a client component.
 */
export default function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
