// ============================================================================
// WhatsApp / Share-text builders — spec-compliant per section 42 of master
// prompt: emoji-prefixed lines with day-of-week, GPS line, category-specific
// header.  Apostrophes, emojis, long names — all handled.
//
// Three builder functions:
//   buildWeddingShareText(...)
//   buildBirthdayShareText(...)
//   buildHousewarmingShareText(...)
//
// And a dispatcher:
//   buildWhatsAppShareText({ templateId, ...common })
// ============================================================================

const FORMATTER_DATE_LONG = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const FORMATTER_TIME = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Parse a YYYY-MM-DD date + hh:mm AM/PM time into a Date object safely,
 * without the UTC drift caused by `new Date("YYYY-MM-DD")` (which treats
 * bare ISO as midnight UTC instead of midnight local).
 */
function parseLocal(dateStr, timeStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  let y, m, d;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    y = parseInt(iso[1], 10);
    m = parseInt(iso[2], 10) - 1;
    d = parseInt(iso[3], 10);
  } else {
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return null;
    y = dt.getFullYear();
    m = dt.getMonth();
    d = dt.getDate();
  }
  let hh = 12, mm = 0, pm = false;
  if (timeStr) {
    const t = String(timeStr).trim();
    const ampmMatch = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|a\.m\.|p\.m\.)/);
    const hmMatch = t.match(/^(\d{1,2}):(\d{2})$/);
    if (ampmMatch) {
      hh = parseInt(ampmMatch[1], 10);
      mm = parseInt(ampmMatch[2], 10);
      pm = /p/i.test(ampmMatch[3]);
    } else if (hmMatch) {
      hh = parseInt(hmMatch[1], 10);
      mm = parseInt(hmMatch[2], 10);
      pm = hh >= 12;
    }
    if (pm && hh < 12) hh += 12;
    if (!pm && hh === 12) hh = 0;
  }
  const built = new Date(y, m, d, hh, mm, 0, 0);
  return Number.isNaN(built.getTime()) ? null : built;
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = parseLocal(dateStr);
  if (!d) return String(dateStr);
  return FORMATTER_DATE_LONG.format(d);
}

function formatTime(dateStr, timeStr) {
  const d = parseLocal(dateStr, timeStr);
  if (!d) return timeStr ? String(timeStr) : '';
  // Intl produces "4:00 PM" on most locales; strip narrow non-breaking spaces
  return FORMATTER_TIME.format(d).replace(/\u202f/g, ' ');
}

// Build a possessive form: "Aarav" → "Aarav's", "Jesus" → "Jesus'" (simple)
function possessive(name) {
  if (!name) return '';
  const s = String(name).trim();
  if (!s) return '';
  return s.endsWith('s') || s.endsWith('S') ? `${s}'` : `${s}'s`;
}

/**
 * Wedding category — 💍 prefix, couple & separator.
 */
export function buildWeddingShareText({
  brideName = '',
  groomName = '',
  weddingDate = '',
  weddingTime = '',
  venue = '',
  venueAddress = '',
  shareUrl = '',
}) {
  const lines = [];
  const groom = String(groomName || '').trim();
  const bride = String(brideName || '').trim();
  const couple = [groom, bride].filter(Boolean).join(' & ') || 'the Happy Couple';

  lines.push(`💍 Wedding Invitation — ${couple}`);

  const dateLine = formatDateLong(weddingDate);
  const timeLine = formatTime(weddingDate, weddingTime);
  const headParts = [];
  if (dateLine) headParts.push(`📅 ${dateLine}`);
  if (timeLine) headParts.push(`⏰ ${timeLine}`);
  if (headParts.length) lines.push(headParts.join(' | '));

  const location = [venue, venueAddress].map(s => String(s || '').trim()).filter(Boolean).join(', ');
  if (location) lines.push(`📍 ${location}`);

  if (shareUrl) {
    lines.push(`🔗 View full invite & GPS map:`);
    lines.push(shareUrl);
  }
  return lines.join('\n');
}

/**
 * Birthday category — 🎉 prefix, celebrant possessive + age.
 */
export function buildBirthdayShareText({
  celebrantName = '',
  age,
  birthdayDate = '',
  birthdayTime = '',
  venue = '',
  venueAddress = '',
  shareUrl = '',
}) {
  const lines = [];
  const celebrant = String(celebrantName || '').trim() || 'the Birthday Star';
  const ageStr = age ? ` ${age}th` : '';
  lines.push(`🎉 You're invited to celebrate ${possessive(celebrant)}${ageStr} Birthday!`);

  const dateLine = formatDateLong(birthdayDate);
  const timeLine = formatTime(birthdayDate, birthdayTime);
  const headParts = [];
  if (dateLine) headParts.push(`📅 ${dateLine}`);
  if (timeLine) headParts.push(`⏰ ${timeLine}`);
  if (headParts.length) lines.push(headParts.join(' | '));

  const location = [venue, venueAddress].map(s => String(s || '').trim()).filter(Boolean).join(', ');
  if (location) lines.push(`📍 ${location}`);

  if (shareUrl) {
    lines.push(`🔗 View full invite & GPS map:`);
    lines.push(shareUrl);
  }
  return lines.join('\n');
}

/**
 * Housewarming / Griha Pravesh category — 🏡 prefix, family name.
 */
export function buildHousewarmingShareText({
  familyName = '',
  eventDate = '',
  ceremonyTime = '',
  venue = '',
  venueAddress = '',
  shareUrl = '',
}) {
  const lines = [];
  const family = String(familyName || '').trim() ? `The ${String(familyName).trim()}` : 'Our Family';
  lines.push(`🏡 Griha Pravesham Invitation — ${family}`);

  const dateLine = formatDateLong(eventDate);
  const timeLine = formatTime(eventDate, ceremonyTime);
  const headParts = [];
  if (dateLine) headParts.push(`📅 ${dateLine}`);
  if (timeLine) headParts.push(`⏰ ${timeLine}`);
  if (headParts.length) lines.push(headParts.join(' | '));

  const location = [venue, venueAddress].map(s => String(s || '').trim()).filter(Boolean).join(', ');
  if (location) lines.push(`📍 ${location}`);

  if (shareUrl) {
    lines.push(`🔗 View full invite & GPS map:`);
    lines.push(shareUrl);
  }
  return lines.join('\n');
}

/**
 * Unified dispatcher — inspects templateId to pick category, falls back to
 * wedding-style output for any template not explicitly birthday/housewarming.
 *
 * Called from PaymentBanner, InvitationSuccessShell, and dashboard share UIs.
 */
export function buildWhatsAppShareText({
  templateId = '',
  templateData = {},
  brideName = '',
  groomName = '',
  weddingDate = '',
  weddingTime = '',
  venue = '',
  venueAddress = '',
  shareUrl = '',
}) {
  const isBirthday = String(templateId || '').startsWith('birthday-');
  const isHousewarming = String(templateId || '').startsWith('housewarming-');
  const td = templateData || {};

  if (isBirthday) {
    return buildBirthdayShareText({
      celebrantName: td.celebrantName || groomName || td.hostName || 'Celebrant',
      age: td.age,
      birthdayDate: td.birthdayDate || weddingDate || td.eventDate,
      birthdayTime: td.birthdayTime || weddingTime || td.eventTime,
      venue: td.venue || venue,
      venueAddress: td.venueAddress || venueAddress || td.address,
      shareUrl,
    });
  }

  if (isHousewarming) {
    return buildHousewarmingShareText({
      familyName: td.familyName || groomName || td.hostsName || 'Our Family',
      eventDate: td.eventDate || weddingDate || td.grihaPraveshDate,
      ceremonyTime: td.ceremonyTime || td.pujaTime || weddingTime || td.eventTime,
      venue: td.venue || venue,
      venueAddress: td.venueAddress || venueAddress || td.address,
      shareUrl,
    });
  }

  // Wedding (default)
  return buildWeddingShareText({
    brideName: brideName || td.brideName,
    groomName: groomName || td.groomName,
    weddingDate: weddingDate || td.weddingDate || td.eventDate,
    weddingTime: weddingTime || td.weddingTime || td.muhurthamTime || td.eventTime,
    venue: venue || td.venue,
    venueAddress: venueAddress || td.venueAddress || td.address,
    shareUrl,
  });
}

// Legacy aliases kept so callers that imported `prettyDateShort` don't break.
export function prettyDateShort(isoDate) {
  return formatDateLong(isoDate).split(', ').slice(-2).join(', ');
}
