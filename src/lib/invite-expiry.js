/**
 * Invitation Expiration Logic
 *
 * Free tier invitations expire 21 days after they are published (paid_at).
 * Premium tier invitations expire 3 days after the event date.
 *
 * This module provides:
 * - getInviteExpiry() – returns expiry info (isExpired, expiresAt, daysRemaining, reason)
 * - FREE_TIER_DAYS – 21
 * - PREMIUM_GRACE_DAYS – 3
 */

export const FREE_TIER_DAYS = 21;
export const PREMIUM_GRACE_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse a date string into a timestamp, handling multiple formats.
 */
function parseTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;

  // Try ISO format first (YYYY-MM-DD)
  let ts = new Date(`${dateStr}T${timeStr || '23:59:59'}`).getTime();
  if (!Number.isNaN(ts)) return ts;

  // Try without T separator
  ts = new Date(`${dateStr} ${timeStr || '23:59:59'}`).getTime();
  if (!Number.isNaN(ts)) return ts;

  // Try raw date parse
  ts = new Date(dateStr).getTime();
  if (!Number.isNaN(ts)) return ts;

  return null;
}

/**
 * Determine whether an invitation has expired and return detailed expiry info.
 *
 * @param {Object} invitation – row from the invitations table
 * @returns {{ isExpired: boolean, expiresAt: number|null, daysRemaining: number|null, hoursRemaining: number|null, reason: string|null, tier: string }}
 */
export function getInviteExpiry(invitation) {
  if (!invitation) {
    return { isExpired: true, expiresAt: null, daysRemaining: null, hoursRemaining: null, reason: 'not_found', tier: null };
  }

  const tier = invitation.tier || (invitation.is_ad_supported !== false ? 'free' : 'premium');
  const now = Date.now();

  if (tier === 'free') {
    // Free tier: expires 21 days after paid_at (publish date)
    const paidAt = invitation.paid_at;
    const paidTs = parseTimestamp(paidAt);
    if (!paidTs) {
      // No paid_at recorded — treat as not expired (legacy data)
      return { isExpired: false, expiresAt: null, daysRemaining: null, hoursRemaining: null, reason: null, tier };
    }
    const expiresAt = paidTs + FREE_TIER_DAYS * MS_PER_DAY;
    const diff = expiresAt - now;
    const isExpired = diff <= 0;
    const daysRemaining = isExpired ? 0 : Math.floor(diff / MS_PER_DAY);
    const hoursRemaining = isExpired ? 0 : Math.floor((diff % MS_PER_DAY) / (60 * 60 * 1000));

    return {
      isExpired,
      expiresAt,
      daysRemaining,
      hoursRemaining,
      reason: isExpired ? 'free_tier_expired' : null,
      tier,
      publishedAt: paidTs,
      totalDays: FREE_TIER_DAYS,
    };
  }

  // Premium tier: expires 3 days after event date
  const eventDate = invitation.wedding_date;
  const eventTime = invitation.wedding_time;
  const eventTs = parseTimestamp(eventDate, eventTime);
  if (!eventTs) {
    // No event date — treat as not expired
    return { isExpired: false, expiresAt: null, daysRemaining: null, hoursRemaining: null, reason: null, tier };
  }
  const expiresAt = eventTs + PREMIUM_GRACE_DAYS * MS_PER_DAY;
  const diff = expiresAt - now;
  const isExpired = diff <= 0;
  const daysRemaining = isExpired ? 0 : Math.floor(diff / MS_PER_DAY);
  const hoursRemaining = isExpired ? 0 : Math.floor((diff % MS_PER_DAY) / (60 * 60 * 1000));

  return {
    isExpired,
    expiresAt,
    daysRemaining,
    hoursRemaining,
    reason: isExpired ? 'premium_expired' : null,
    tier,
    eventDate: eventTs,
    totalDays: PREMIUM_GRACE_DAYS,
  };
}
