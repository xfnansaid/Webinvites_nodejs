-- Adds support for anonymous "drafts" (saved invitations before sign-in).
--
-- Flow:
--   1. Anonymous user edits a template and clicks Publish Now → before
--      redirecting to Google OAuth, the client calls /api/save-draft which
--      INSERTs an invitations row with owner_id = NULL, is_paid = false,
--      and a cryptographically-random temp_owner_token stored in this
--      column.
--   2. Client stashes temp_owner_token in localStorage alongside the other
--      staged form edits, then redirects to Google sign-in.
--   3. After Google OAuth returns with a signed-in user, the client calls
--      /api/claim-draft { tempOwnerToken }. Server:
--        a. Looks up invitations.temp_owner_token = token
--        b. Verifies owner_id IS NULL (not already claimed)
--        c. SET owner_id = auth.uid(), NULL temp_owner_token
--      Result: the user's drafted edits are now PERMANENTLY linked to their
--      Google account, show up on /dashboard as an Unpaid Draft, and the
--      same draft can be resumed from any device (no longer just localStorage).
--
-- Run with:
--   * Supabase dashboard → SQL Editor → paste + run
--   * OR `supabase db push` from the repo root if CLI is installed.

-- temp_owner_token: 32-byte hex / 64 chars.  Unique index so two drafts never
-- share a token (prevents collisions / theft via brute force guesses).
ALTER TABLE IF EXISTS public.invitations
  ADD COLUMN IF NOT EXISTS temp_owner_token text
  CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80);

CREATE UNIQUE INDEX IF NOT EXISTS invitations_temp_owner_token_idx
  ON public.invitations (temp_owner_token);

CREATE INDEX IF NOT EXISTS invitations_owner_id_drafts_idx
  ON public.invitations (owner_id, is_paid)
  WHERE owner_id IS NOT NULL;

-- Optional readability column: status = 'draft' | 'paid' or NULL (legacy).
-- Not strictly required (we already have is_paid), but useful for dashboards
-- and future UX changes.
ALTER TABLE IF EXISTS public.invitations
  ADD COLUMN IF NOT EXISTS status text
  CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived'));

CREATE INDEX IF NOT EXISTS invitations_owner_status_idx
  ON public.invitations (owner_id, status)
  WHERE owner_id IS NOT NULL;

-- RLS: anonymous users can still WRITE new drafts (temp_owner_token filled).
-- Existing RLS policies in 20260816000002_rls_policies.sql already allow
-- INSERT for anon via `create_own_invitations`. But for drafts to be inserted
-- with temp_owner_token but owner_id=NULL we don't need to change the INSERT
-- policy (anon role can insert rows, owner_id null is fine). We DO need the
-- client to be able to READ its own draft (via temp_owner_token → server
-- route uses service client → bypasses RLS → returns the draft row).  So no
-- extra RLS changes are needed.
