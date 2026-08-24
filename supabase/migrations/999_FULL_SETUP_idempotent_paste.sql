-- ============================================================================
-- WEB INVITES — FULL CUMULATIVE SETUP  (Supabase SQL Editor · 1-time paste)
-- ============================================================================
-- This file bundles all 7 incremental migrations from supabase/migrations/
-- into a single idempotent paste.  If you already ran some of them, nothing
-- breaks because EVERY statement uses IF NOT EXISTS / OR REPLACE / DROP IF.
--
-- Paste the ENTIRE contents of this file into:
--   Supabase Dashboard → SQL Editor → + New query → paste → "Run"
--
-- Expected "Success: rows affected" is a bunch of 0s (most objects already
-- exist).  That is NORMAL; you won't see errors if you paste twice.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1)  invitations TABLE  (create if missing — unlikely but safe guard)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
  id                      BIGSERIAL PRIMARY KEY,
  created_at              TIMESTAMPTZ  NOT NULL  DEFAULT NOW(),
  template_id             TEXT         NOT NULL,
  slug                    TEXT         UNIQUE,
  groom_name              TEXT,
  bride_name              TEXT,
  groom_name_secondary    TEXT,
  bride_name_secondary    TEXT,
  event_date              DATE,
  event_time              TEXT,
  venue_name              TEXT,
  venue_city              TEXT,
  venue_address           TEXT,          -- 20260816000000
  map_url                 TEXT,
  host_names              TEXT,
  rsvp_phone              TEXT,
  whatsapp_share_text     TEXT,
  template_data           JSONB        NOT NULL  DEFAULT '{}'::jsonb,
  is_paid                 BOOLEAN      NOT NULL  DEFAULT false,
  razorpay_order_id       TEXT,
  hero_tagline            TEXT,          -- 20260816000001
  hero_event_text         TEXT,          -- 20260816000001
  countdown_title         TEXT,          -- 20260816000001
  razorpay_payment_id     TEXT,          -- 20260816000001
  razorpay_webhook_event_id TEXT,        -- 20260816000001
  paid_at                 TIMESTAMPTZ,   -- 20260816000001
  owner_id                UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_phone             TEXT,
  owner_email             TEXT CONSTRAINT invitations_owner_email_maxlen CHECK (char_length(owner_email) <= 254),
  updated_at              TIMESTAMPTZ  DEFAULT NOW(),
  temp_owner_token        TEXT CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80),
  status                  TEXT CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived')),
  edit_count              INT          NOT NULL  DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 2)  Single ADD COLUMN IF NOT EXISTS calls  (redundant if above CREATE ran,
--     but kept because in most cases the invitations table already exists.)
-- ----------------------------------------------------------------------------
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS venue_address         TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS hero_tagline          TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS hero_event_text       TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS countdown_title       TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS razorpay_order_id     TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS razorpay_payment_id   TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS razorpay_webhook_event_id TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS paid_at               TIMESTAMPTZ;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS owner_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS owner_phone           TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ  DEFAULT NOW();
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS owner_email TEXT
  CONSTRAINT invitations_owner_email_maxlen CHECK (char_length(owner_email) <= 254);
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS temp_owner_token TEXT
  CONSTRAINT invitations_temp_owner_token_maxlen CHECK (char_length(temp_owner_token) <= 80);
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS status TEXT
  CONSTRAINT invitations_status_allowed CHECK (status IS NULL OR status IN ('draft', 'paid', 'archived'));
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 3)  INDEXES  (every column that appears in WHERE / ON clauses of API routes)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS invitations_slug_idx
  ON public.invitations (slug);
CREATE INDEX IF NOT EXISTS idx_invitations_owner_id
  ON public.invitations (owner_id);
CREATE INDEX IF NOT EXISTS idx_invitations_owner_phone
  ON public.invitations (owner_phone);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_temp_owner_token_idx
  ON public.invitations (temp_owner_token);
CREATE INDEX IF NOT EXISTS invitations_owner_email_idx
  ON public.invitations (owner_email);
CREATE INDEX IF NOT EXISTS invitations_owner_id_email_idx
  ON public.invitations (owner_id, owner_email);
CREATE INDEX IF NOT EXISTS invitations_owner_id_drafts_idx
  ON public.invitations (owner_id, is_paid)
  WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS invitations_owner_status_idx
  ON public.invitations (owner_id, status)
  WHERE owner_id IS NOT NULL;

COMMENT ON COLUMN public.invitations.owner_id IS 'Supabase auth user who created/owns this invite';
COMMENT ON COLUMN public.invitations.owner_phone IS 'E.164 mobile number of the owner at time of creation';

-- ----------------------------------------------------------------------------
-- 4)  Auto-updated  updated_at  trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

DROP TRIGGER IF EXISTS set_invitation_updated_at ON public.invitations;
CREATE TRIGGER set_invitation_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5)  ROW LEVEL SECURITY  +  policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone with the secret slug can view the invite
DROP POLICY IF EXISTS "Public can view published invitations" ON public.invitations;
CREATE POLICY "Public can view published invitations"
  ON public.invitations FOR SELECT
  USING (true);

-- INSERT: anonymous can create DRAFTS (is_paid=false).  Paid rows are set by
-- the SERVER (service_role client, bypasses RLS) after real Razorpay payment.
DROP POLICY IF EXISTS "Anyone can create a draft invitation" ON public.invitations;
CREATE POLICY "Anyone can create a draft invitation"
  ON public.invitations FOR INSERT
  WITH CHECK (is_paid = false);

-- UPDATE: Owner can update ONLY their own rows (used by dashboard /edit page).
DROP POLICY IF EXISTS "Owners can update their own invitations" ON public.invitations;
CREATE POLICY "Owners can update their own invitations"
  ON public.invitations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- UPDATE (anon fallback): Server fallbacks can mark is_paid=true ONCE.
-- This is a safety net if SUPABASE_SERVICE_ROLE_KEY is ever missing on the
-- Hostinger server.  It does NOT allow setting is_paid back to false.
DROP POLICY IF EXISTS "Server fallbacks can mark invitations paid" ON public.invitations;
CREATE POLICY "Server fallbacks can mark invitations paid"
  ON public.invitations
  FOR UPDATE
  USING (true)
  WITH CHECK (
    is_paid = true
    AND razorpay_order_id IS NOT NULL
  );

-- ----------------------------------------------------------------------------
-- 6)  AUTO-DELETE UNPAID DRAFTS AFTER 1 DAY (24 HOURS)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_expired_unpaid_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.invitations
  WHERE is_paid = false
    AND created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron and schedule hourly cleanup if supported
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.unschedule('delete-unpaid-drafts-job') 
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-unpaid-drafts-job');
    PERFORM cron.schedule('delete-unpaid-drafts-job', '0 * * * *', 'SELECT public.delete_expired_unpaid_drafts();');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- In environments without pg_cron privileges, cleanup is handled by Next.js /api/cron/cleanup-drafts
    NULL;
END $$;

-- ============================================================================
-- DONE.  Now return to setup instructions / Hostinger deploy guide.
--
-- NEXT (outside SQL):
--   A) Supabase → Auth → Providers → Enable Email + Google
--        - Google requires Client ID / Secret from Google Cloud Console
--        - Under "Authorized redirect URIs" add:
--            https://<PROJECT-REF>.supabase.co/auth/v1/callback
--   B) Supabase → Auth → URL Configuration:
--        Site URL          = NEXT_PUBLIC_APP_URL  (e.g. https://webinvites.shop)
--        Redirect URLs     =  *  (wildcard, or list each exact path)
--   C) Razorpay Dashboard → Settings → API Keys → copy LIVE keys → .env
--   D) Razorpay Dashboard → Webhooks → Add webhook
--        URL     =   https://webinvites.shop/api/webhook
--        Secret  =   <paste same value you put in RAZORPAY_WEBHOOK_SECRET>
--        Events  =   order.paid, payment.captured, payment.failed
-- ============================================================================
