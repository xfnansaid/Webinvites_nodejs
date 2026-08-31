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
 * Extract the real client IP from request headers.
 * Checks X-Forwarded-For, X-Real-IP, then falls back to connection remoteAddress.
 */
export function getClientIpForTracking(request) {
  const forwarded = request.headers?.get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers?.get?.('x-real-ip');
  if (realIp) return realIp;
  return request.headers?.get?.('x-vercel-forwarded-for') || '0.0.0.0';
}
