-- Migration: Add columns for Product Detail Tabs (About & Cooking Guide)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cooking_guide TEXT,
ADD COLUMN IF NOT EXISTS product_highlights JSONB DEFAULT '[]';

-- Update existing products with dummy highlights for testing
UPDATE products SET product_highlights = '[
  {"icon": "ChefHat", "text": "Wash thoroughly"},
  {"icon": "Fire", "text": "Cook for 10 mins"},
  {"icon": "Timer", "text": "Serves 2-3"}
]'::jsonb WHERE product_highlights = '[]'::jsonb;
