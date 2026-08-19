-- ===========================================================================
-- WEB INVITES — User Authentication + Ownership Migration
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query
-- Supabase Project: https://supabase.com/dashboard
-- ===========================================================================

-- 1. Ensure auth.users exists (this table is created by Supabase automatically
--    when you enable Auth in the dashboard. We assume it's already present.)
--    To enable Phone Auth:
--      Dashboard → Authentication → Providers → Phone → Enable
--      (Choose Twilio / MessageBird / Vonage SMS provider for OTP sending)

-- 2. Add ownership columns to invitations table + indexes + RLS
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_invitations_owner_id ON invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_invitations_owner_phone ON invitations(owner_phone);

COMMENT ON COLUMN invitations.owner_id IS 'Supabase auth user who created/owns this invite';
COMMENT ON COLUMN invitations.owner_phone IS 'E.164 mobile number of the owner at time of creation';

-- 3. Ensure base RLS policies still exist (create-order fallback + public reading)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published invitations" ON invitations;
CREATE POLICY "Public can view published invitations"
ON invitations FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can create a draft invitation" ON invitations;
CREATE POLICY "Anyone can create a draft invitation"
ON invitations FOR INSERT
WITH CHECK (is_paid = false);

DROP POLICY IF EXISTS "Owners can update their own invitations" ON invitations;
CREATE POLICY "Owners can update their own invitations"
ON invitations FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 4. (Optional but strongly recommended) Auto-updated timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;
DROP TRIGGER IF EXISTS set_invitation_updated_at ON invitations;
CREATE TRIGGER set_invitation_updated_at
BEFORE UPDATE ON invitations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. WYSIWYG + Payment tracking columns (add if missing)
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_tagline TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_event_text TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS countdown_title TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_webhook_event_id TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ===========================================================================
-- Setup Checklist (outside SQL):
--
-- A) SUPABASE AUTH → Providers → Phone  :  Enable, enter Twilio credentials
-- B) AUTH → URL Configuration:
--      - Site URL: your NEXT_PUBLIC_APP_URL (e.g. https://yourdomain.com)
--      - Redirect URLs: wildcard * or your exact domain
-- C) AUTH → Rate Limits: set SMS / Phone OTP limits to taste
-- D) .env.local already needs these set:
--      NEXT_PUBLIC_SUPABASE_URL
--      NEXT_PUBLIC_SUPABASE_ANON_KEY
--      SUPABASE_SERVICE_ROLE_KEY
-- E) Payment (Razorpay) env vars:
--      RAZORPAY_KEY_ID
--      RAZORPAY_KEY_SECRET
-- ===========================================================================
