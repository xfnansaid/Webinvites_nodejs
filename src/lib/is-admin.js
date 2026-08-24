// Server-side admin / whitelist email checker.
//
// This is the server-side mirror of src/lib/auth.js isAdminEmail / ADMIN_EMAILS.
// Keep this list in sync if you add more operators. The check is done via the
// resolved Supabase user email, NOT via any client-provided flag, so a browser
// can NOT forge admin status.

const ADMIN_EMAILS = [
  'afnansaleem050@gmail.com',
];

export function isAdminEmail(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.some((a) => a.trim().toLowerCase() === clean);
}

export function isAdminUser(user) {
  if (!user) return false;
  return isAdminEmail(user.email) || isAdminEmail(user?.user_metadata?.email);
}
