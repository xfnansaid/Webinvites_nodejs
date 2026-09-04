// In-memory sliding-window rate limiter.
//
// Usage in a route handler:
//   import { rateLimit } from '@/lib/rate-limit';
//   const rl = rateLimit({ key: ip, limit: 30, windowMs: 60_000 });
//   if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
//
// For login / sensitive endpoints, use tighter limits:
//   rateLimit({ key: ip, limit: 5, windowMs: 15 * 60_000 })   // 5 per 15 min
//
// For general API:
//   rateLimit({ key: ip, limit: 60, windowMs: 60_000 })        // 60 per minute
//
// CAPTCHA fallback: when rateLimit returns rl.ok = false AND rl.captchaRequired = true,
// the client should present a CAPTCHA challenge before retrying.

const store = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks from old entries.
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.windowEnd < now) store.delete(key);
  }
}

/**
 * @param {object} opts
 * @param {string} opts.key   – Unique identifier (IP, user ID, email, etc.)
 * @param {number} opts.limit – Max requests allowed in the window.
 * @param {number} opts.windowMs – Window duration in milliseconds.
 * @returns {{ ok: boolean, remaining: number, resetMs: number, captchaRequired?: boolean }}
 */
export function rateLimit({ key, limit = 60, windowMs = 60_000 } = {}) {
  cleanup();

  const now = Date.now();
  let entry = store.get(key);

  // New window or expired window
  if (!entry || entry.windowEnd < now) {
    entry = {
      count: 1,
      windowStart: now,
      windowEnd: now + windowMs,
    };
    store.set(key, entry);
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }

  // Inside existing window
  entry.count += 1;

  if (entry.count > limit) {
    const resetMs = entry.windowEnd - now;
    // After 3x the limit, require CAPTCHA on retry
    const captchaRequired = entry.count > limit * 3;
    return { ok: false, remaining: 0, resetMs, captchaRequired };
  }

  return { ok: true, remaining: limit - entry.count, resetMs: entry.windowEnd - now };
}

/**
 * Extract the best IP key from a Next.js request.
 * Handles X-Forwarded-For (proxied) and direct connection.
 */
export function getClientIp(request) {
  const forwarded = request?.headers?.get?.('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can contain "client, proxy1, proxy2" — take first
    return String(forwarded).split(',')[0].trim();
  }
  const real = request?.headers?.get?.('x-real-ip');
  if (real) return real.trim();
  return '127.0.0.1';
}

/**
 * Sanitize error messages to avoid leaking internal details.
 * Returns a generic message in production; includes the original in dev.
 */
export function sanitizeError(err, fallback = 'An unexpected error occurred') {
  const msg = String(err?.message || err || '');
  const isDev = process.env.NODE_ENV !== 'production';

  // In production, never expose DB codes, column names, RLS hints, or Supabase internals
  if (!isDev) {
    return fallback;
  }

  // In dev, allow more detail but still redact service role key patterns
  return msg.replace(/service[_-]?role[_-]?key/gi, '[REDACTED]').slice(0, 200);
}
