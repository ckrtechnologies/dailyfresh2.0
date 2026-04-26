-- Migration to add image_url to products table for consistency with categories and sub_categories
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optionally, if there's data in the first element of 'images' array, migrate it
-- UPDATE products SET image_url = images[1] WHERE image_url IS NULL AND array_length(images, 1) > 0;
