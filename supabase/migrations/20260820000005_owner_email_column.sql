-- Captures the authenticated client's email address on every invitation (draft
-- or paid) so you can trace published invites back to the signed-in Google account
-- that created them in Supabase dashboard UI / analytics.
--
-- Populated in:
--   * /api/create-order  (normal Razorpay publish gate, on UPDATE of paid row)
--   * /api/admin-publish (operator publish, on INSERT/UPDATE)
--   * /api/save-draft    (anonymous draft save before Google redirect; if user
--                         is already signed in when saving, email captured here)
--   * /api/claim-draft   (first time user claims a pre-saved anonymous draft
--                         → flips owner_id + owner_email on the draft row)
--
-- Run in Supabase Dashboard → SQL Editor, or `supabase db push` from CLI.

ALTER TABLE IF EXISTS public.invitations
  ADD COLUMN IF NOT EXISTS owner_email text
  CONSTRAINT invitations_owner_email_maxlen CHECK (char_length(owner_email) <= 254);

-- Index on owner_email so you can run `WHERE owner_email = 'customer@gmail.com'`
-- queries instantly (Supabase dashboard filter / email lookups in admin tools).
CREATE INDEX IF NOT EXISTS invitations_owner_email_idx
  ON public.invitations (owner_email);

-- Composite (owner_id, owner_email) index for common admin pattern:
-- "show me all drafts and paid invites owned by this signed-in Google user".
CREATE INDEX IF NOT EXISTS invitations_owner_id_email_idx
  ON public.invitations (owner_id, owner_email);
