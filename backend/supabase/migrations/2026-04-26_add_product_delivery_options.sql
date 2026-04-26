-- Add delivery_options to products table
ALTER TABLE public.products 
ALTER COLUMN delivery_options SET DEFAULT '{morning, afternoon, express}';

-- Update existing products to remove 'evening' and add 'afternoon' if they had the old default
UPDATE public.products 
SET delivery_options = array_replace(delivery_options, 'evening', 'afternoon');

/**
 * DELIVERY SLOTS DEFINITION (Managed via App Logic):
 * 1. express: Express Delivery (90 mins)
 * 2. morning: 9 AM - 12 PM (Available Today if ordered before 9 AM, always available for Tomorrow)
 * 3. afternoon: 12 PM - 6 PM (Available Today if ordered before 12 PM, always available for Tomorrow)
 */

-- Comment explaining the options
COMMENT ON COLUMN public.products.delivery_options IS 'Supported delivery types for this product. Supported: morning, afternoon, express';
