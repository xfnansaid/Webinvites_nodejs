-- ============================================================================
-- ADD MISSING INDEXES — 2026-08-24
-- ============================================================================
-- These columns are filtered/sorted in API routes but had NO index,
-- causing full table scans on every request.
--
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================================

-- 1) razorpay_order_id — used by 3 payment routes:
--    - confirm-payment:  .eq('razorpay_order_id', razorpay_order_id)
--    - webhook:          .eq('razorpay_order_id', orderId)
--    - check-payment:    .eq('razorpay_order_id', orderId)
--    Without this index, every payment lookup scans the entire invitations table.
CREATE INDEX IF NOT EXISTS idx_invitations_razorpay_order_id
  ON public.invitations (razorpay_order_id);

-- 2) created_at — used for sorting in the user dashboard:
--    - user/invitations: .order('created_at', { ascending: false })
--    Without this index, Postgres must sort the entire result set in memory.
CREATE INDEX IF NOT EXISTS idx_invitations_created_at
  ON public.invitations (created_at DESC);
