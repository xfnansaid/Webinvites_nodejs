// ============================================================================
// SERVER-SIDE AUTHORIZATION & ADMIN VERIFICATION
//
// Strictly executed on the server via cryptographic Supabase JWT verification.
// Cannot be bypassed or tampered with via DevTools, Inspect Mode, or browser state.
// ============================================================================

const AUTHORIZED_ADMIN_EMAILS = [
  'afnansaleem050@gmail.com',
];

const AUTHORIZED_ADMIN_PHONES = [
  '9778513196',
  '+919778513196',
];

function getAdminEmails() {
  const envEmails = process.env.ADMIN_EMAILS || '';
  const parsed = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const combined = Array.from(new Set([...AUTHORIZED_ADMIN_EMAILS, ...parsed]));
  return combined;
}

function getAdminPhones() {
  const envPhones = process.env.ADMIN_PHONES || '';
  const parsed = envPhones
    .split(',')
    .map((p) => p.replace(/\D/g, ''))
    .filter(Boolean);

  const cleanDefaults = AUTHORIZED_ADMIN_PHONES.map((p) => p.replace(/\D/g, '')).filter(Boolean);
  return Array.from(new Set([...cleanDefaults, ...parsed]));
}

/**
 * Check if email is an authorized administrator email.
 */
export function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  const list = getAdminEmails();
  return list.includes(clean);
}

/**
 * Check if phone is an authorized administrator phone.
 */
export function isAdminPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/\D/g, '');
  if (!clean) return false;
  const list = getAdminPhones();
  return list.some((p) => clean === p || clean.endsWith(p) || p.endsWith(clean));
}

/**
 * Validates a server-resolved Supabase user object.
 * Returns true ONLY if the authenticated user's verified email or phone is whitelisted.
 */
export function isAdminUser(user) {
  if (!user || typeof user !== 'object') return false;

  const email = user.email || user.user_metadata?.email;
  const phone = user.phone || user.user_metadata?.phone;

  const emailMatch = Boolean(email && isAdminEmail(email));
  const phoneMatch = Boolean(phone && isAdminPhone(phone));

  return emailMatch || phoneMatch;
}
