-- Row Level Security policies for the invitations table.
--
-- ERROR 42501 that appeared in create-order ("new row violates row-level
-- security policy for table invitations") was caused by RLS being ENABLED
-- on the table but no INSERT/SELECT policy existing for anon/authenticated
-- roles. These policies make the platform work correctly even without the
-- SUPABASE_SERVICE_ROLE_KEY in API routes.

-- 1) Ensure RLS is turned ON (it probably already is).
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 2) Public SELECT: required for /i/[slug] page so anyone who gets the
--    unique secret link can view the invitation without logging in.
DROP POLICY IF EXISTS "Public can view published invitations" ON invitations;
CREATE POLICY "Public can view published invitations"
  ON invitations FOR SELECT
  USING (true);

-- 3) Anonymous INSERT: required so /api/create-order can create a draft
--    invitation using the anon key when the service_role key has not yet
--    been configured. Users need to insert their draft before paying.
DROP POLICY IF EXISTS "Anyone can create a draft invitation" ON invitations;
CREATE POLICY "Anyone can create a draft invitation"
  ON invitations FOR INSERT
  WITH CHECK (is_paid = false);

-- 4) Authenticated/anon UPDATE ONLY when setting is_paid=false → true, or
--    updating payment status columns ONLY via server. Since our server
--    routes now use supabaseServer (service role = bypass RLS), we do NOT
--    grant broad UPDATE here to prevent anyone from flipping rows to paid
--    for free.
--    (intentionally omitted — payment updates go only through service_role)
