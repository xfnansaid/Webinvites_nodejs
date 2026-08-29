import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAnonFallback } from '@/lib/supabase';

// Server-side Supabase client for API ROUTES ONLY.
//
// Priority:
//   1) If SUPABASE_SERVICE_ROLE_KEY is set AND looks like a real JWT (bypasses
//      RLS completely, used for payment confirmation / webhook updates where
//      we MUST be able to flip rows from is_paid=false → true for free).
//   2) Otherwise, silently FALL BACK to the standard anon client — this works
//      for create-order INSERTs because we added the RLS policy
//      "Anyone can create a draft invitation" WITH CHECK (is_paid = false).
//      This means users do not need to paste the service role key before the
//      editor can save drafts — payments still correctly use service_role via
//      error-retries.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Treat these values as "unset" (placeholders from .env.local template)
const PLACEHOLDER_PATTERNS = [
  /^PASTE_/i,
  /^your[_-]?service/i,
  /^placeholder$/i,
  /change_?me/i,
  /^$/,
];

const keyLooksReal =
  typeof supabaseServiceKey === 'string' &&
  supabaseServiceKey.length >= 40 &&
  !PLACEHOLDER_PATTERNS.some(re => re.test(supabaseServiceKey.trim()));

if (!supabaseUrl) {
  console.warn('[supabase-server] NEXT_PUBLIC_SUPABASE_URL is not configured');
}
if (!keyLooksReal) {
  console.warn(
    '[supabase-server] SUPABASE_SERVICE_ROLE_KEY looks like a placeholder — falling back to ANON client for DB writes. ' +
      '(Draft inserts still work via RLS policy; set the real service_role key to mark rows paid.)',
  );
  supabaseServiceKey = undefined;
}

// Build server client — if service key is missing, use anon key instead of
// crashing every route.
export const supabaseServer = keyLooksReal
  ? createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : supabaseAnonFallback;

// Also export a helper so routes that NEED service role (confirm-payment,
// webhook) can check at runtime and return a clean 500 with fix instructions
// instead of a silent RLS rejection.
export function isServiceRoleConfigured() {
  return keyLooksReal;
}
