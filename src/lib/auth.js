'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

// ---------- Admin / whitelist helpers ----------
//
// Owner/operator Google emails who can edit templates and publish for free
// without going through the Razorpay payment flow.
//
export function getAdminEmails() {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
  return envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminPhones() {
  const envPhones = process.env.NEXT_PUBLIC_ADMIN_PHONES || process.env.ADMIN_PHONES || '';
  return envPhones
    .split(',')
    .map((p) => p.replace(/\D/g, ''))
    .filter(Boolean);
}

export const ADMIN_EMAILS = Object.freeze(getAdminEmails());

export function isAdminEmail(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return getAdminEmails().some((a) => a === clean);
}

export function isAdminPhone(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return false;
  return getAdminPhones().some((p) => clean.endsWith(p) || p.endsWith(clean));
}

export function isAdminUser(user) {
  if (!user) return false;
  const emailMatch = isAdminEmail(user.email) || isAdminEmail(user?.user_metadata?.email);
  const phoneMatch = isAdminPhone(user.phone) || isAdminPhone(user?.user_metadata?.phone);
  return emailMatch || phoneMatch;
}

// ---------- Phone helpers (kept for WhatsApp / venue contact form fields) ----------
// Normalize an Indian / international phone number into E.164 (+91…) format.
// Accepts: +919876543210, 919876543210, 9876543210, 09876543210, +1 (555) 123-4567, etc.
export function normalizePhone(raw, { defaultCountry = 'IN', defaultDialCode = '+91' } = {}) {
  if (!raw) return '';
  const digitsOnly = String(raw).replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+')) return digitsOnly;
  const stripped = digitsOnly.replace(/^0+/, '');
  return defaultDialCode + stripped;
}

export function prettyPhone(e164) {
  if (!e164) return '';
  const digits = String(e164).replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return e164;
}

// ---------- User display helpers (Google OAuth friendly) ----------
export function userDisplayName(user) {
  if (!user) return '';
  const meta = user.user_metadata || {};
  if (meta.full_name) return meta.full_name;
  if (meta.name) return meta.name;
  if (user.email) return user.email.split('@')[0];
  if (user.phone) return prettyPhone(user.phone);
  return 'Guest';
}

export function userInitials(user) {
  const name = userDisplayName(user) || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (first + last).toUpperCase();
}

// ---------- Next URL / OAuth redirect helpers ----------
const STAGE_NEXT_KEY = 'wi_oauth_next_v1';

/** Store the post-sign-in destination before we redirect out to Google. */
export function setAuthRedirectNext(nextRelative) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      next: nextRelative || '/dashboard',
      ts: Date.now(),
    };
    localStorage.setItem(STAGE_NEXT_KEY, JSON.stringify(payload));
  } catch {}
}

/** Pop and return the stashed post-sign-in destination (valid for 10 min). */
export function consumeAuthRedirectNext() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STAGE_NEXT_KEY);
    if (!raw) return null;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return null; }
    localStorage.removeItem(STAGE_NEXT_KEY);
    if (!parsed?.next) return null;
    const age = Date.now() - (Number(parsed.ts) || 0);
    if (age > 10 * 60 * 1000) return null;
    return parsed.next;
  } catch {
    return null;
  }
}

const STORAGE_KEY = 'wi_auth_loading_done';

// Supabase persists the session in localStorage by default, which is NOT readable
// by server route handlers. To make server-side session resolution work
// (/api/user/invitations, /api/admin-publish, /api/create-order) we must
// mirror the session JSON into a standard Supabase-compatible cookie: sb-<ref>-auth-token.
// The cookie value is the same JSON shape the client keeps in localStorage so both sync.
function deriveCookieNameFromUrl(sbUrl) {
  try {
    const host = new URL(sbUrl).hostname || sbUrl;
    const ref = String(host).split('.')[0] || '';
    if (!/^[a-z0-9_-]+$/i.test(ref)) return '';
    return `sb-${ref}-auth-token`;
  } catch {
    return '';
  }
}

function writeSupabaseCookie(sessionObject, cookieName) {
  if (!cookieName || typeof document === 'undefined') return;
  try {
    const sessionClear =
      !sessionObject ||
      (sessionObject.expires_in === 0 && !sessionObject.access_token) ||
      !sessionObject.access_token;
    if (sessionClear) {
      document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
      return;
    }
    const encoded = encodeURIComponent(JSON.stringify(sessionObject));
    const nowSec = Math.floor(Date.now() / 1000);
    let maxAgeSec = 60 * 60 * 24 * 7;
    if (typeof sessionObject.expires_at === 'number') {
      maxAgeSec = Math.max(360, Math.min(60 * 60 * 24 * 365, sessionObject.expires_at - nowSec));
    }
    document.cookie = `${cookieName}=${encoded}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] Failed to write Supabase session cookie:', e?.message || e);
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [oauthError, setOauthError] = useState('');

  useEffect(() => {
    let mounted = true;
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const cookieName = deriveCookieNameFromUrl(sbUrl);

    const hydrate = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!error) {
          const currentSession = data?.session || null;
          setSession(currentSession);
          setUser(currentSession?.user || null);
          writeSupabaseCookie(currentSession, cookieName);
        }
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const errDesc = url.hash.match(/error_description=([^&]+)/)?.[1];
          if (errDesc) {
            setOauthError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
          }
        }
      } catch (e) {
        console.warn('Auth hydrate error:', e?.message || e);
      } finally {
        if (mounted) {
          setLoading(false);
          setHydrationDone(true);
          try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
        }
      }
    };

    hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const sess = newSession || null;
      setSession(sess);
      setUser(sess?.user || null);
      setLoading(false);
      writeSupabaseCookie(sess, cookieName);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  /**
   * Start Google OAuth redirect flow.
   *
   * Optionally pass { nextRelative: '/edit/abc?x=1' } to go somewhere other
   * than /dashboard after Google bounces back. For anonymous publish we use
   * this together with PaymentBanner's wi_publish_stage_v1 key so the user
   * lands on the resume-payment flow without any additional clicks.
   */
  const signInWithGoogle = useCallback(async ({ nextRelative, redirectTo } = {}) => {
    setOauthError('');
    const siteUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    const finalRedirectTo = redirectTo || `${siteUrl}/signin`;
    try {
      if (nextRelative) setAuthRedirectNext(nextRelative);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });
      if (error) return { ok: false, error };
      // signInWithOAuth redirects the page, code below only runs if redirectTo
      // resolution fails (e.g. popup blocked).
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSession(null);
        setUser(null);
        const cookieName = deriveCookieNameFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
        writeSupabaseCookie(null, cookieName);
        return { ok: false, error };
      }
    } catch (e) {
      console.warn('signOut error:', e?.message || e);
    } finally {
      setSession(null);
      setUser(null);
      const cookieName = deriveCookieNameFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      writeSupabaseCookie(null, cookieName);
    }
    return { ok: true };
  }, []);

  // Convenience derived fields
  const userPhone = useMemo(() => user?.phone || user?.user_metadata?.phone || '', [user]);
  const userEmail = useMemo(() => user?.email || user?.user_metadata?.email || '', [user]);
  const userName = useMemo(() => userDisplayName(user), [user]);
  const userAvatar = useMemo(() => user?.user_metadata?.avatar_url || user?.app_metadata?.avatar_url || '', [user]);
  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  const value = {
    user,
    session,
    loading,
    hydrationDone,
    oauthError,
    userPhone,
    userEmail,
    userName,
    userAvatar,
    isAdmin,
    // Primary Google auth flow
    signInWithGoogle,
    // Kept for backwards compat with any leftover OTP references; returns a clear error.
    sendOtp: useCallback(async () => ({
      ok: false,
      error: new Error('Phone OTP is disabled. Please sign in with Google.'),
    }), []),
    verifyOtp: useCallback(async () => ({
      ok: false,
      error: new Error('Phone OTP is disabled. Please sign in with Google.'),
    }), []),
    signOut,
    raw: { supabase },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside an <AuthProvider> — wrap your root layout.');
  }
  return ctx;
}

export function useRequireAuth({ redirectTo = '/signin', allowIfLoading = true } = {}) {
  const { user, loading } = useAuth();
  const authenticated = !!user;
  const shouldRedirect = !loading && !authenticated;

  if (typeof window !== 'undefined' && shouldRedirect && !allowIfLoading) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`${redirectTo}${next ? `?next=${next}` : ''}`);
  }

  return {
    authenticated,
    loading,
    shouldRedirect,
  };
}
