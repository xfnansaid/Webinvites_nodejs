/**
 * Generates a unique slug for a wedding invitation.
 * Example: "rahul-and-priya"
 */
export function generateSlug(groomName, brideName) {
  const base = `${groomName}-and-${brideName}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and dashes
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes from ends
  
  // In a real app, we'd check the DB here, but for now we return the base.
  // The backend will handle unique suffixing (e.g. -2, -3).
  return base;
}

/**
 * Coerce a weddingDate value into a YYYY-MM-DD ISO date string.
 * Accepts ISO, Date.parse-able strings, or returns null for garbage input.
 */
export function coerceToIsoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
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
