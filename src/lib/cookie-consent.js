/**
 * Cookie Consent Management
 *
 * GDPR-compliant cookie consent system.
 * Categories:
 *   - essential: Always active (auth, security, session)
 *   - analytics: Google Analytics, GA4
 *   - advertising: Google Ads, Monetag ad networks
 *   - functional: Editor preferences, OAuth state
 *
 * Lawful basis:
 *   - Essential: Legitimate interest (required for site to function)
 *   - All others: Consent (requires explicit user opt-in)
 */

const CONSENT_KEY = 'wi_cookie_consent';
const CONSENT_VERSION = '1.0'; // Bump this to re-prompt users

/**
 * Cookie categories with descriptions for the consent banner.
 */
export const COOKIE_CATEGORIES = {
  essential: {
    label: 'Essential',
    description: 'Required for the website to function. These cookies enable core features like authentication, security, and session management. They cannot be disabled.',
    alwaysActive: true,
    cookies: [
      { name: 'sb-<project-ref>-auth-token', purpose: 'Supabase authentication session', duration: '7 days' },
      { name: 'csrf-token', purpose: 'Security - prevents cross-site request forgery', duration: 'Session' },
    ],
  },
  analytics: {
    label: 'Analytics',
    description: 'Help us understand how visitors use our website. We use this data to improve our services and user experience. All data is anonymized.',
    alwaysActive: false,
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - distinguishes unique users', duration: '2 years' },
      { name: '_gid', purpose: 'Google Analytics - distinguishes unique users', duration: '24 hours' },
      { name: '_gat', purpose: 'Google Analytics - throttles request rate', duration: '1 minute' },
    ],
  },
  advertising: {
    label: 'Advertising',
    description: 'Used to show you relevant advertisements. These cookies track your activity across websites to provide personalized ads. We earn revenue when you view or interact with these ads.',
    alwaysActive: false,
    cookies: [
      { name: 'Google Ads cookies', purpose: 'Personalized advertising', duration: 'Varies' },
      { name: 'Monetag cookies', purpose: 'Ad delivery and tracking', duration: 'Varies' },
    ],
  },
  functional: {
    label: 'Functional',
    description: 'Enable enhanced functionality like remembering your editor settings and preferences. If you disable these, some features may not work properly.',
    alwaysActive: false,
    cookies: [
      { name: 'wi_auth_loading_done', purpose: 'Remembers auth state to prevent flash of loading screen', duration: 'Session' },
      { name: 'wi_oauth_next_v1', purpose: 'Stores redirect destination after Google sign-in', duration: '10 minutes' },
      { name: 'editor-settings-*', purpose: 'Remembers your editor preferences (font, size, etc.)', duration: 'Persistent' },
    ],
  },
};

/**
 * Get stored consent preferences.
 * Returns null if no consent has been given yet.
 */
export function getConsentPreferences() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check if consent version matches (re-prompt if outdated)
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save consent preferences.
 */
export function saveConsentPreferences(preferences) {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true, // Always true
      analytics: !!preferences.analytics,
      advertising: !!preferences.advertising,
      functional: !!preferences.functional,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    // Dispatch event so components can react
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: data }));
    return data;
  } catch {
    return null;
  }
}

/**
 * Accept all cookies.
 */
export function acceptAllCookies() {
  return saveConsentPreferences({
    analytics: true,
    advertising: true,
    functional: true,
  });
}

/**
 * Reject all non-essential cookies.
 */
export function rejectAllCookies() {
  return saveConsentPreferences({
    analytics: false,
    advertising: false,
    functional: false,
  });
}

/**
 * Check if a specific cookie category is consented.
 */
export function hasConsent(category) {
  if (category === 'essential') return true; // Always allowed
  const prefs = getConsentPreferences();
  if (!prefs) return false; // No consent = no non-essential cookies
  return !!prefs[category];
}

/**
 * Check if analytics cookies are consented.
 */
export function hasAnalyticsConsent() {
  return hasConsent('analytics');
}

/**
 * Check if advertising cookies are consented.
 */
export function hasAdvertisingConsent() {
  return hasConsent('advertising');
}

/**
 * Check if functional cookies are consented.
 */
export function hasFunctionalConsent() {
  return hasConsent('functional');
}

/**
 * Check if user has given any consent (to show/hide banner).
 */
export function hasGivenConsent() {
  return getConsentPreferences() !== null;
}

/**
 * Clear all non-essential cookies.
 * Called when user rejects cookies or withdraws consent.
 */
export function clearNonEssentialCookies() {
  if (typeof document === 'undefined') return;

  // List of non-essential cookie names to clear
  const nonEssentialCookies = [
    '_ga',
    '_gid',
    '_gat',
    'wi_auth_loading_done',
    'wi_oauth_next_v1',
    'wi_publish_stage_v1',
  ];

  nonEssentialCookies.forEach(name => {
    // Clear for current domain
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    // Clear for parent domain
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; domain=.${window.location.hostname}`;
  });

  // Clear editor settings from localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('editor-settings-') || key.startsWith('wi_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Get consent status for display purposes.
 */
export function getConsentStatus() {
  const prefs = getConsentPreferences();
  if (!prefs) return { status: 'pending', message: 'No consent given yet' };
  return {
    status: 'given',
    message: `Consent given on ${new Date(prefs.timestamp).toLocaleDateString()}`,
    preferences: {
      essential: true,
      analytics: prefs.analytics,
      advertising: prefs.advertising,
      functional: prefs.functional,
    },
  };
}
