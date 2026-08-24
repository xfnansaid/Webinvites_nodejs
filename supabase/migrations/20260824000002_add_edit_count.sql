-- Migration: Add edit_count column to track client edits on invitations
-- Limit: Clients can make edits up to 3 times after publishing.

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.invitations.edit_count IS 'Number of post-publish edits made by the client (max allowed is 3).';
