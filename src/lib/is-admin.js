// Server-side admin / whitelist checker.
// Reads securely from environment variables.
// The check is done via the resolved Supabase user, NOT via any client-provided flag.

function getAdminEmails() {
  const envEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getAdminPhones() {
  const envPhones = process.env.ADMIN_PHONES || process.env.NEXT_PUBLIC_ADMIN_PHONES || '';
  return envPhones
    .split(',')
    .map((p) => p.replace(/\D/g, ''))
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  const list = getAdminEmails();
  return list.includes(clean);
}

export function isAdminPhone(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return false;
  const list = getAdminPhones();
  return list.some((p) => clean.endsWith(p) || p.endsWith(clean));
}

export function isAdminUser(user) {
  if (!user) return false;
  const emailMatch = isAdminEmail(user.email) || isAdminEmail(user?.user_metadata?.email);
  const phoneMatch = isAdminPhone(user.phone) || isAdminPhone(user?.user_metadata?.phone);
  return emailMatch || phoneMatch;
}
