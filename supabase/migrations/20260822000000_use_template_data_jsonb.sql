-- ============================================================================
-- TEMPLATE DATA JSONB COLUMN — stores template-specific inline edits
-- (heroTitle, monogram, eyebrowMal, weddingDay, weddingMonth, etc.)
-- These are fields that are NOT part of the standard 13 columns but vary
-- per template and are edited inline by the client.
-- ============================================================================

-- Safety: column already exists in 999_FULL_SETUP but this is idempotent
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS template_data JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.invitations.template_data IS
  'JSONB bag for template-specific fields (heroTitle, monogram, etc.) that do not have dedicated columns. Merged into the data prop when rendering /i/[slug].';
