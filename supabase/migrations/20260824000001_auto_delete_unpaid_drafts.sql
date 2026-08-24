-- ============================================================================
-- AUTO-DELETE UNPAID DRAFTS AFTER 1 DAY (24 HOURS)
-- ============================================================================
-- Deletes rows from `public.invitations` where:
--   1) `is_paid` is false (or status = 'draft')
--   2) `created_at` is older than 1 day (created_at < NOW() - INTERVAL '1 day')
-- ============================================================================

-- 1. Create cleanup function
CREATE OR REPLACE FUNCTION public.delete_expired_unpaid_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.invitations
  WHERE is_paid = false
    AND created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable pg_cron extension if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the cron job to run every hour at minute 0
-- If the job already exists, remove it first to avoid duplicates
SELECT cron.unschedule('delete-unpaid-drafts-job') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'delete-unpaid-drafts-job'
);

SELECT cron.schedule(
  'delete-unpaid-drafts-job',
  '0 * * * *',
  $$SELECT public.delete_expired_unpaid_drafts();$$
);
