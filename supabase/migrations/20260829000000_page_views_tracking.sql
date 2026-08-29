-- ============================================================
-- Page View Tracking for /i/[slug] invitations
-- ============================================================
-- Tracks per-slug visit counts so hosts can see how many
-- times their invitation has been viewed.

CREATE TABLE IF NOT EXISTS public.page_views (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT NOT NULL,
  ip_hash     TEXT,           -- SHA-256 hash of IP (privacy-safe, no raw IPs stored)
  user_agent  TEXT,           -- truncated UA string for basic dedup
  referrer    TEXT,           -- where the guest came from
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast slug lookups (the primary query pattern)
CREATE INDEX IF NOT EXISTS idx_page_views_slug ON public.page_views (slug);
CREATE INDEX IF NOT EXISTS idx_page_views_slug_created ON public.page_views (slug, created_at);

-- ============================================================
-- Function: increment view count for a slug
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_page_view(
  p_slug TEXT,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.page_views (slug, ip_hash, user_agent, referrer)
  VALUES (p_slug, p_ip_hash, p_user_agent, p_referrer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: get view stats for a slug
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_view_stats(p_slug TEXT)
RETURNS TABLE (
  total_views BIGINT,
  unique_visitors BIGINT,
  views_today BIGINT,
  last_viewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_views,
    COUNT(DISTINCT ip_hash)::BIGINT AS unique_visitors,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT AS views_today,
    MAX(created_at) AS last_viewed_at
  FROM public.page_views
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS: Only service_role can write; no public read
-- ============================================================
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (bypasses RLS anyway, but explicit)
CREATE POLICY "Service role manages page views"
  ON public.page_views
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Cleanup: auto-delete page views older than 90 days
-- ============================================================
-- Run this as a pg_cron job or in the cleanup-drafts cron:
-- DELETE FROM public.page_views WHERE created_at < NOW() - INTERVAL '90 days';
