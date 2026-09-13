-- Migration: Remove 'Today Evening' from product_variants and cleanup delivery_info
-- Date: 2026-05-07

-- 1. Remove 'Today Evening' (and lowercase variation) from the delivery_info text array
UPDATE public.product_variants
SET delivery_info = array_remove(delivery_info, 'Today Evening')
WHERE 'Today Evening' = ANY(delivery_info);

UPDATE public.product_variants
SET delivery_info = array_remove(delivery_info, 'today evening')
WHERE 'today evening' = ANY(delivery_info);

-- 2. If an array becomes empty after removal, ensure it has at least 'Tomorrow Morning' as a fallback
UPDATE public.product_variants
SET delivery_info = ARRAY['Tomorrow Morning']
WHERE delivery_info = '{}' OR delivery_info IS NULL;

-- 3. Update the default value for the column (keeping it clean for new rows)
ALTER TABLE public.product_variants 
ALTER COLUMN delivery_info SET DEFAULT ARRAY['Tomorrow Morning'];
