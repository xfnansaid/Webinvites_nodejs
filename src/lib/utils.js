/**
 * Generates a unique slug for an invitation (wedding, birthday, housewarming, etc.).
 * Example: "rahul-and-priya" or "aarav-5th-birthday"
 */
export function generateSlug(groomName, brideName) {
  const p1 = (groomName && typeof groomName === 'string' && groomName.trim() !== 'undefined') ? groomName.trim() : '';
  const p2 = (brideName && typeof brideName === 'string' && brideName.trim() !== 'undefined') ? brideName.trim() : '';
  let combined = '';
  if (p1 && p2) {
    combined = `${p1}-and-${p2}`;
  } else if (p1) {
    combined = p1;
  } else if (p2) {
    combined = p2;
  } else {
    combined = 'invitation';
  }
  const base = combined
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and dashes
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes from ends
  
  return base || 'invitation';
}

/**
 * Coerce a date value (weddingDate, birthdayDate, eventDate) into a YYYY-MM-DD ISO date string.
 * Accepts ISO, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, Date instances, or returns null for invalid input.
 */
export function coerceToIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const s = String(value).trim();
  if (!s || s === 'undefined' || s === 'null') return null;

  // Standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const yyyy = dmyMatch[3];
    let day = p1;
    let month = p2;
    if (p2 > 12 && p1 <= 12) {
      // MM/DD/YYYY format
      month = p1;
      day = p2;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // YYYY/MM/DD
  const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const dd = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Fallback to native Date parser
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

/**
 * Normalize aliased map URL fields into the canonical mapsUrl value.
 */
export function pickMapFields(body) {
  return body.mapsUrl || body.mapUrl || body.directionsUrl || '';
}

/**
 * Computes the day of the week (e.g., "Wednesday", "Friday") from an ISO or standard date string.
 * Uses local calendar date components to avoid UTC timezone offset issues.
 */
export function formatDayOfWeek(dateStr, fallback = '') {
  if (!dateStr) return fallback;
  const clean = String(dateStr).trim();
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, day] = clean.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const parts = clean.split(/[\/\-]/).map(Number);
    let day = parts[0];
    let month = parts[1];
    if (parts[1] > 12 && parts[0] <= 12) {
      month = parts[0];
      day = parts[1];
    }
    d = new Date(parts[2], month - 1, day);
  } else {
    d = new Date(clean);
  }
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return fallback;
}
