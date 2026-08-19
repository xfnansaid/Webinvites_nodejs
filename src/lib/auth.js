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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [oauthError, setOauthError] = useState('');

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!error) {
          setSession(data?.session || null);
          setUser(data?.session?.user || null);
        }
        // If there was an OAuth error hash fragment (e.g. user denied on Google), surface it.
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
      setSession(newSession || null);
      setUser(newSession?.user || null);
      setLoading(false);
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
        return { ok: false, error };
      }
    } catch (e) {
      console.warn('signOut error:', e?.message || e);
    } finally {
      setSession(null);
      setUser(null);
    }
    return { ok: true };
  }, []);

  // Convenience derived fields
  const userPhone = useMemo(() => user?.phone || user?.user_metadata?.phone || '', [user]);
  const userEmail = useMemo(() => user?.email || user?.user_metadata?.email || '', [user]);
  const userName = useMemo(() => userDisplayName(user), [user]);
  const userAvatar = useMemo(() => user?.user_metadata?.avatar_url || user?.app_metadata?.avatar_url || '', [user]);

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
