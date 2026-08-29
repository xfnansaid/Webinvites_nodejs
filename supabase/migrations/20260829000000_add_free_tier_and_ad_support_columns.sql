-- ============================================================================
-- Migration: Add Free Tier & Ad-Supported Columns to Invitations Table
-- ============================================================================
-- Adds:
-- 1. tier: 'free' | 'premium' (Default 'premium' for existing paid invites)
-- 2. is_ad_supported: boolean (true for free tier, false for paid ₹399)
-- 3. photo_url: text (direct access column for uploaded couple photos)
-- ============================================================================

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'premium',
ADD COLUMN IF NOT EXISTS is_ad_supported boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_url text DEFAULT NULL;

-- Index to quickly check user entitlements and published free templates
CREATE INDEX IF NOT EXISTS idx_invitations_owner_tier 
ON public.invitations (owner_id, tier, is_ad_supported);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
