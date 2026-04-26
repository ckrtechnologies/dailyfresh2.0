-- Add missing marketing flags and delivery options to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_launch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_options TEXT[] DEFAULT '{morning, evening, express}';
