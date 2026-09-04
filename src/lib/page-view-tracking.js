// ============================================================================
// PAGE VIEW TRACKING UTILITY
// ============================================================================
// Hashes IP addresses for privacy-safe view counting.
// No raw IPs are stored — only SHA-256 hashes.

import crypto from 'crypto';

/**
 * Hash an IP address using SHA-256 for privacy-safe storage.
 * Returns a truncated 16-char hex string (enough for uniqueness, not reversible).
 */
export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/**
 * Extract the real client IP from request headers or Next.js headers() instance.
 * Checks X-Forwarded-For, X-Real-IP, then falls back to x-vercel-forwarded-for.
 */
export function getClientIpForTracking(reqOrHeaders) {
  if (!reqOrHeaders) return '127.0.0.1';
  const getHeader = (name) => {
    if (typeof reqOrHeaders.get === 'function') return reqOrHeaders.get(name);
    if (reqOrHeaders.headers && typeof reqOrHeaders.headers.get === 'function') return reqOrHeaders.headers.get(name);
    if (typeof reqOrHeaders === 'object') return reqOrHeaders[name] || null;
    return null;
  };
  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = getHeader('x-real-ip');
  if (realIp) return realIp;
  return getHeader('x-vercel-forwarded-for') || '127.0.0.1';
}
