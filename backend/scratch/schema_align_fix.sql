-- ================================================================
-- DAILY FRESH SCHEMA ALIGNMENT FIX
-- Run this to fix mismatches between code and database
-- ================================================================

-- 1. Fix Products Table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS cooking_guide text,
ADD COLUMN IF NOT EXISTS product_highlights jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_options jsonb DEFAULT '["morning", "express"]'::jsonb,
ADD COLUMN IF NOT EXISTS is_flash_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exclusive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_launch boolean DEFAULT false;

-- 2. Fix Orders Table (GPS and Coupon Logic)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS coupon_id uuid;

-- 3. Fix Cart Items (Alignment with cartController)
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS cut_preference text,
ADD COLUMN IF NOT EXISTS cleaning_preference text;

-- 4. Fix Stores Table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS serviceable_pincodes text[] DEFAULT '{}'::text[];

-- 5. Create Missing Tables
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  discount_value numeric NOT NULL,
  min_purchase_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Add standard Coupon function used by backend
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id_param;
END;
$$ LANGUAGE plpgsql;

-- 7. Add Standard Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
