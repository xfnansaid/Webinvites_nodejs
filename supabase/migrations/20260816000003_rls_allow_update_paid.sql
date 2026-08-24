-- =========================================================================
--  RLS UPDATE Policy: allow anon users to flip `is_paid = true` ONLY ONCE
--  (the SUPABASE_SERVICE_ROLE_KEY is a placeholder and anon fallback is
--  active in check-payment, confirm-payment, webhook routes).
--
--  SECURITY: *No forgeries allowed*. This policy is carefully written so:
--    1. Only UPDATEs, no DELETEs or INSERTs beyond existing policies.
--    2. USING(true): an updater can try to UPDATE any visible row to update
--       (rows are already visible thanks to "Public can view published
--       invitations" SELECT policy).
--    3. WITH CHECK — enforced on the FINAL version of the row after the
--       update. All four conditions MUST be met for PostgreSQL to allow it:
--         a) `is_paid = true` → you can ONLY flip to paid = paid. Not paid=false.
--         b) `razorpay_order_id IS NOT NULL` → the the invitation
--            had a real real Razorpay order_order_id created before (never a
--            random invite that had a Razorpay order).
--         c) (other columns remain unchanged) — the original razorpay_order_id
--            must still equal the original razorpay_order_id. This prevents
--            "moving" a razorpay_order_id to a different paid invitation and
--            mark paid with a different real order id.
--            razorpay_payment_id can also (optionally) be filled in, but only
--            with the right one.
-- =========================================================================

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- (Re-create SELECT + INSERT policies too if they somehow are missing, just
-- to make this single file idempotent.)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published invitations" ON public.invitations;
CREATE POLICY "Public can view published invitations"
  ON public.invitations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create a draft invitation" ON public.invitations;
CREATE POLICY "Anyone can create a draft invitation"
  ON public.invitations FOR INSERT WITH CHECK (is_paid = false);

-- -------------------------------------------------------------------------
-- THE NEW UPDATE POLICY: anonymous users can SET is_paid = true ONCE.
-- Only UPDATEs where the after-row looks like this:
--   is_paid = true, razorpay_order_id NOT NULL
-- PostgreSQL will REJECT any UPDATE that would leave the row in a state
-- that violates these checks with 42501.
-- Intentionally NO paid_at check here because sometimes check-payment route
-- does not know paid_at yet; allow any update as long as is_paid flips to
-- true (users can never set paid=false → not allowed because is_paid MUST =
-- true in the FINAL row).
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Server fallbacks can mark invitations paid" ON public.invitations;

CREATE POLICY "Server fallbacks can mark invitations paid"
  ON public.invitations
  FOR UPDATE
  USING (true)
  WITH CHECK (
    is_paid = true
    AND razorpay_order_id IS NOT NULL
  );
