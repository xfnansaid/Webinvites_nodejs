/**
 * Client-side invitation expiry calculation.
 * Mirrors the server-side invite-expiry.js but runs in the browser.
 */

export const FREE_TIER_DAYS = 21;
export const PREMIUM_GRACE_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  let ts = new Date(`${dateStr}T${timeStr || '23:59:59'}`).getTime();
  if (!Number.isNaN(ts)) return ts;
  ts = new Date(`${dateStr} ${timeStr || '23:59:59'}`).getTime();
  if (!Number.isNaN(ts)) return ts;
  ts = new Date(dateStr).getTime();
  if (!Number.isNaN(ts)) return ts;
  return null;
}

/**
 * Get expiry info for an invitation row (client-safe).
 * @param {Object} inv - invitation row
 * @returns {{ isExpired, daysRemaining, hoursRemaining, tier, expiresAt }}
 */
export function getInviteExpiry(inv) {
  if (!inv) {
    return { isExpired: true, daysRemaining: null, hoursRemaining: null, tier: null, expiresAt: null };
  }

  const tier = inv.tier || (inv.is_ad_supported !== false ? 'free' : 'premium');
  const now = Date.now();

  if (tier === 'free') {
    const paidTs = parseTimestamp(inv.paid_at);
    if (!paidTs) {
      return { isExpired: false, daysRemaining: null, hoursRemaining: null, tier, expiresAt: null };
    }
    const expiresAt = paidTs + FREE_TIER_DAYS * MS_PER_DAY;
    const diff = expiresAt - now;
    const isExpired = diff <= 0;
    return {
      isExpired,
      daysRemaining: isExpired ? 0 : Math.floor(diff / MS_PER_DAY),
      hoursRemaining: isExpired ? 0 : Math.floor((diff % MS_PER_DAY) / (60 * 60 * 1000)),
      tier,
      expiresAt,
    };
  }

  // Premium
  const eventTs = parseTimestamp(inv.wedding_date, inv.wedding_time);
  if (!eventTs) {
    return { isExpired: false, daysRemaining: null, hoursRemaining: null, tier, expiresAt: null };
  }
  const expiresAt = eventTs + PREMIUM_GRACE_DAYS * MS_PER_DAY;
  const diff = expiresAt - now;
  const isExpired = diff <= 0;
  return {
    isExpired,
    daysRemaining: isExpired ? 0 : Math.floor(diff / MS_PER_DAY),
    hoursRemaining: isExpired ? 0 : Math.floor((diff % MS_PER_DAY) / (60 * 60 * 1000)),
    tier,
    expiresAt,
  };
}
