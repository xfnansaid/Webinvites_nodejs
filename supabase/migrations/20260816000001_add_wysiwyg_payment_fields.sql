-- Adds the missing columns required for the WYSIWYG unified editor and
-- Razorpay payment confirmation tracking.

-- 3 editable WYSIWYG text fields so users' hero & countdown customizations
-- persist after publish (they are saved via /api/create-order and rendered
-- in /i/[slug]).
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_tagline TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS hero_event_text TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS countdown_title TEXT;

-- Razorpay payment confirmation tracking fields used by /api/webhook and
-- /api/confirm-payment routes. paid_at allows instant reporting of when the
-- customer actually paid. razorpay_webhook_event_id is for idempotency so
-- Razorpay can re-deliver the webhook safely without double-processing.
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS razorpay_webhook_event_id TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
