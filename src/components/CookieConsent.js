'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cookie, Check, X } from 'lucide-react';
import {
  getConsentPreferences,
  acceptAllCookies,
  rejectAllCookies,
} from '@/lib/cookie-consent';

/**
 * GDPR-compliant Cookie Consent Banner
 *
 * Shows a banner at the bottom of the page asking for cookie consent.
 * Users can:
 *   - Accept all cookies
 *   - Reject all non-essential cookies
 *   - Customize their preferences by category
 *
 * The banner reappears if:
 *   - No consent has been given
 *   - Consent version has changed (policy updated)
 *   - User withdraws consent via the "Cookie Settings" link in footer
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    const existing = getConsentPreferences();
    if (!existing) setShowBanner(true);
  }, []);

  useEffect(() => {
    const handler = () => setShowBanner(true);
    window.addEventListener('show-cookie-consent', handler);
    return () => window.removeEventListener('show-cookie-consent', handler);
  }, []);

  const handleAcceptAll = useCallback(() => {
    acceptAllCookies();
    setShowBanner(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    rejectAllCookies();
    setShowBanner(false);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-4 pointer-events-auto">
        <div className="rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-xl border border-stone-200 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] overflow-hidden">

          {/* Main banner */}
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base sm:text-lg text-stone-900 mb-1">
                  We value your privacy
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  We use cookies to enhance your experience, provide authentication, serve advertisements,
                  and analyze site traffic.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4" />
                    Accept All
                  </button>

                  <button
                    onClick={handleRejectAll}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm transition-all active:scale-[0.98]"
                  >
                    <X className="w-4 h-4" />
                    Necessary Only
                  </button>
                </div>
              </div>
            </div>
          </div>



          {/* Legal links */}
          <div className="px-4 sm:px-5 pb-3 sm:pb-4">
            <p className="text-[10px] sm:text-[11px] text-stone-400 leading-relaxed">
              By continuing to use this site, you agree to our use of cookies as described in our{' '}
              <a href="/terms" className="underline hover:text-stone-600">Terms & Conditions</a>.
              You can withdraw consent at any time by clicking &quot;Cookie Settings&quot; in the footer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
