// Shared server-side Supabase current-user resolver.
//
// This is the single source of truth for every App Router API route that
// needs to know "who is currently signed in, based on the request cookies".
//
// Why a single file?
//   * Previously, resolveCurrentUser was copy-pasted across 3 API routes
//     and used a loose cookie name regex + an undocumented auth header hack
//     that broke once the Supabase client stopped honoring global.auth
//     headers inside auth.getUser().
//   * Now routes import resolveSupabaseUser(request) and get the same,
//     deterministic result every time.
//
// This resolver does NOT use global.auth headers. Instead:
//   1) Read the cookie named `sb-<project-ref>-auth-token` (computed from
//      NEXT_PUBLIC_SUPABASE_URL so it always matches the Supabase project).
//   2) JSON-decode the cookie value to extract access_token.
//   3) Call auth.getUser(accessToken) with the access token as the first
//      positional arg — this is the documented, stable way to validate a
//      JWT server-side without ever needing to set session state.
//   4) Return { user } on success, or { user: null } otherwise.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let cachedProjectRef = null;
function getProjectRef() {
  if (cachedProjectRef) return cachedProjectRef;
  if (!supabaseUrl) {
    cachedProjectRef = '';
    return cachedProjectRef;
  }
  try {
    const host = new URL(supabaseUrl).hostname || supabaseUrl;
    const firstLabel = String(host).split('.')[0] || '';
    cachedProjectRef = /^[a-z0-9_-]+$/i.test(firstLabel) ? firstLabel : '';
    return cachedProjectRef;
  } catch {
    cachedProjectRef = '';
    return cachedProjectRef;
  }
}

function cookieName() {
  const ref = getProjectRef();
  // If we cannot derive the ref (env URL missing / invalid) fall back to the
  // loose regex behavior on reads by returning a wildcard name string that
  // is handled specially in parseCookieHeader().
  return ref ? `sb-${ref}-auth-token` : '';
}

function readValue(cookieHeader, keyName) {
  if (!cookieHeader || !keyName) return null;
  const segments = String(cookieHeader).split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eqAt = trimmed.indexOf('=');
    if (eqAt <= 0) continue;
    const k = trimmed.slice(0, eqAt).trim();
    if (k === keyName) {
      return trimmed.slice(eqAt + 1);
    }
  }
  return null;
}

function readValueByRegex(cookieHeader, regex) {
  if (!cookieHeader) return null;
  const segments = String(cookieHeader).split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eqAt = trimmed.indexOf('=');
    if (eqAt <= 0) continue;
    const k = trimmed.slice(0, eqAt).trim();
    if (regex.test(k)) return trimmed.slice(eqAt + 1);
  }
  return null;
}

function extractAccessTokenFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const [scheme, token] = String(authHeader).split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (String(scheme).toLowerCase() !== 'bearer') return null;
  const cleaned = String(token).trim();
  return cleaned || null;
}

function parseSessionCookie(rawValue) {
  if (!rawValue) return null;
  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (decodeErr) {
    try {
      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
}

export async function resolveSupabaseUser(request) {
  const cookieHeader = request?.headers?.get?.('cookie') || '';
  const authHeader = request?.headers?.get?.('authorization') || request?.headers?.get?.('Authorization') || '';

  // Path 1 (preferred): session stored in the sb-<ref>-auth-token cookie
  let accessToken = null;
  let resolution = 'none';

  if (cookieHeader) {
    const primary = cookieName();
    let raw = primary ? readValue(cookieHeader, primary) : null;
    if (!raw) {
      raw = readValueByRegex(cookieHeader, /^sb-[a-z0-9_-]+-auth-token$/i);
    }
    if (raw) {
      const session = parseSessionCookie(raw);
      if (session?.access_token) {
        accessToken = session.access_token;
        resolution = 'cookie';
      }
    }
  }

  // Path 2 (fallback, always works): client sends Authorization: Bearer <accessToken>.
  // We use this path to bypass browser cookie SameSite quirks on localhost, short
  // race windows where cookie hasn't been written yet after OAuth redirect return,
  // or third-party cookie blockers in browsers.
  if (!accessToken) {
    const fromHeader = extractAccessTokenFromAuthHeader(authHeader);
    if (fromHeader) {
      accessToken = fromHeader;
      resolution = 'bearer';
    }
  }

  if (!accessToken) return { user: null, resolution };
  if (!supabaseUrl || !serviceKey) return { user: null, resolution };

  let tempClient = null;
  try {
    tempClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (buildErr) {
    console.warn('[auth-server] createClient failed:', buildErr?.message || buildErr);
    return { user: null, resolution };
  }

  try {
    // auth.getUser(accessToken) is the documented signature: pass the JWT
    // explicitly — does NOT require session storage or global auth headers.
    const { data, error } = await tempClient.auth.getUser(accessToken);
    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[auth-server] getUser(accessToken) returned an auth error:',
          error.name,
          error.code,
          error.message,
          `resolution=${resolution}`,
        );
      }
      return { user: null, resolution };
    }
    return { user: data?.user || null, resolution };
  } catch (thrown) {
    console.warn('[auth-server] getUser threw:', thrown?.message || thrown, `resolution=${resolution}`);
    return { user: null, resolution };
  }
}

export function getSupabaseProjectRef() {
  return getProjectRef();
}
