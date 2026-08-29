-- ============================================================
-- Invitation Expiry System
-- ============================================================
-- Adds is_active column to invitations table.
-- Free tier invitations expire 21 days after paid_at.
-- Premium tier invitations expire 3 days after wedding_date.
-- The /api/cron/expire-invitations job sets is_active = false
-- on expired invitations, and the /i/[slug] page checks it.

-- 1. Add is_active column (default true for existing rows)
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Backfill: mark already-expired free tier invitations as inactive
--    Free: paid_at + 21 days < now
UPDATE public.invitations
SET is_active = false
WHERE is_active = true
  AND tier = 'free'
  AND paid_at IS NOT NULL
  AND (paid_at + INTERVAL '21 days') < now();

-- 3. Backfill: mark already-expired premium invitations as inactive
--    Premium: wedding_date + 3 days < now
UPDATE public.invitations
SET is_active = false
WHERE is_active = true
  AND (tier = 'premium' OR (tier IS NULL AND is_ad_supported = false))
  AND wedding_date IS NOT NULL
  AND (wedding_date::date + INTERVAL '3 days') < now();

-- 4. Index for the cron query (fast lookup of active paid invitations)
CREATE INDEX IF NOT EXISTS idx_invitations_active_paid
  ON public.invitations (is_paid, is_active, tier, paid_at, wedding_date)
  WHERE is_paid = true;

-- 5. Also clean up page_views for expired invitations (older than 30 days past expiry)
--    This is handled by the cron job, but we add an index for performance.
CREATE INDEX IF NOT EXISTS idx_page_views_slug_created
  ON public.page_views (slug, created_at);
