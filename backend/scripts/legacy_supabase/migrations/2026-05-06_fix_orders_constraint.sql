-- Fix order delivery type constraint to support the new 3-slot system
-- Date: 2026-05-06

-- 1. Drop existing constraint first to allow updates
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;

-- 2. Clean up ALL existing rows to match the new 3-slot schema
-- This is NECESSARY because the constraint cannot be added if old values exist.
UPDATE public.orders SET delivery_type = 'tomorrow_morning' WHERE delivery_type = 'tmrw_morning';
UPDATE public.orders SET delivery_type = 'tomorrow_evening' WHERE delivery_type = 'tmrw_evening';
UPDATE public.orders SET delivery_type = 'tomorrow_evening' WHERE delivery_type = 'today_evening';

-- 3. In case there are any NULLs or unexpected values, set a default
UPDATE public.orders SET delivery_type = 'express' WHERE delivery_type NOT IN ('express', 'tomorrow_morning', 'tomorrow_evening') OR delivery_type IS NULL;

-- 4. Now add the updated constraint
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_type_check 
CHECK (delivery_type IN ('express', 'tomorrow_morning', 'tomorrow_evening'));
