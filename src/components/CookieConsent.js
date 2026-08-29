'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cookie, Shield, BarChart3, Megaphone, Settings, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import {
  COOKIE_CATEGORIES,
  getConsentPreferences,
  saveConsentPreferences,
  acceptAllCookies,
  rejectAllCookies,
  hasGivenConsent,
} from '@/lib/cookie-consent';

const categoryIcons = {
  essential: Shield,
  analytics: BarChart3,
  advertising: Megaphone,
  functional: Settings,
};

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
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    advertising: false,
    functional: false,
  });

  useEffect(() => {
    // Check if consent has been given
    const existing = getConsentPreferences();
    if (existing) {
      setPreferences({
        essential: true,
        analytics: existing.analytics,
        advertising: existing.advertising,
        functional: existing.functional,
      });
    } else {
      // No consent given — show banner
      setShowBanner(true);
    }
  }, []);

  // Listen for external consent updates (e.g., from footer "Cookie Settings" link)
  useEffect(() => {
    const handler = () => {
      const prefs = getConsentPreferences();
      if (prefs) {
        setPreferences({
          essential: true,
          analytics: prefs.analytics,
          advertising: prefs.advertising,
          functional: prefs.functional,
        });
      }
      setShowBanner(true);
    };
    window.addEventListener('show-cookie-consent', handler);
    return () => window.removeEventListener('show-cookie-consent', handler);
  }, []);

  const handleAcceptAll = useCallback(() => {
    acceptAllCookies();
    setShowBanner(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    rejectAllCookies();
    setPreferences({ essential: true, analytics: false, advertising: false, functional: false });
    setShowBanner(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    saveConsentPreferences(preferences);
    setShowBanner(false);
  }, [preferences]);

  const toggleCategory = useCallback((category) => {
    if (category === 'essential') return; // Can't disable essential
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
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
                  and analyze site traffic. You can choose which cookies you allow below.
                  Essential cookies are always active as they are required for the site to function.
                </p>

                {/* Quick action buttons */}
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
                    Reject Non-Essential
                  </button>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showDetails ? 'Hide Details' : 'Customize'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed category toggles */}
          {showDetails && (
            <div className="border-t border-stone-100 p-4 sm:p-5 space-y-3">
              {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => {
                const Icon = categoryIcons[key] || Cookie;
                const isEnabled = preferences[key];
                const isEssential = category.alwaysActive;

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-3 sm:p-4 transition-all ${
                      isEnabled
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-stone-900">{category.label}</div>
                          {isEssential && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                              Always Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Toggle switch */}
                      <button
                        onClick={() => toggleCategory(key)}
                        disabled={isEssential}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          isEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                        } ${isEssential ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${category.label} cookies`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-stone-600 mt-2 ml-[42px] leading-relaxed">
                      {category.description}
                    </p>

                    {/* Cookie list */}
                    {showDetails && (
                      <div className="mt-2 ml-[42px]">
                        <div className="flex flex-wrap gap-1.5">
                          {category.cookies.map((cookie, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 ring-1 ring-stone-200 text-[10px] font-medium text-stone-600"
                            >
                              {cookie.name}
                              <span className="text-stone-400">· {cookie.duration}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Save preferences button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleSavePreferences}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  Save My Preferences
                </button>
              </div>
            </div>
          )}

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
