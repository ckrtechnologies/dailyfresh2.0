-- ================================================================
-- DAILY FRESH SCHEMA FINAL TWEAK
-- Renaming coupon columns to match controller logic
-- ================================================================

ALTER TABLE public.coupons 
RENAME COLUMN min_purchase_amount TO min_order_amount;

ALTER TABLE public.coupons 
RENAME COLUMN valid_from TO start_date;

ALTER TABLE public.coupons 
RENAME COLUMN valid_until TO end_date;
