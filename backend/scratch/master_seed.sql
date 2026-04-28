-- ================================================================
-- DAILY FRESH MASTER SEED SCRIPT (v2)
-- UPDATED TO MATCH NEW SCHEMA (image_url and flags)
-- ================================================================

-- 1. Create a Default Store (Required for products)
INSERT INTO stores (name, pincode, address, city, state, is_active, serviceable_pincodes)
VALUES (
  'Daily Fresh Kolkata Main',
  '700001',
  'New Market Area',
  'Kolkata',
  'West Bengal',
  true,
  ARRAY['700001', '700002', '700003', '700016']
)
ON CONFLICT DO NOTHING;

-- 2. Define Categories and get IDs
DO $$
DECLARE
    store_id UUID;
    cat_fish_id UUID;
    cat_meat_id UUID;
    cat_poultry_id UUID;
    sub_seawater_id UUID;
    sub_freshwater_id UUID;
    sub_chicken_id UUID;
    sub_mutton_id UUID;
BEGIN
    -- Get the store ID
    SELECT id INTO store_id FROM stores LIMIT 1;

    -- --- CATEGORIES ---
    INSERT INTO categories (name, slug, image_url, display_order) 
    VALUES ('Fish & Seafood', 'fish-seafood', 'https://assets.dailyfreshkolkata.in/categories/fish.png', 1) 
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url
    RETURNING id INTO cat_fish_id;

    INSERT INTO categories (name, slug, image_url, display_order) 
    VALUES ('Mutton', 'mutton', 'https://assets.dailyfreshkolkata.in/categories/mutton.png', 2) 
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url
    RETURNING id INTO cat_meat_id;

    INSERT INTO categories (name, slug, image_url, display_order) 
    VALUES ('Poultry', 'poultry', 'https://assets.dailyfreshkolkata.in/categories/poultry.png', 3) 
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url
    RETURNING id INTO cat_poultry_id;

    -- --- SUB CATEGORIES ---
    INSERT INTO sub_categories (category_id, name, slug, display_order)
    VALUES (cat_fish_id, 'Seawater Fish', 'seawater-fish', 1)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO sub_seawater_id;

    INSERT INTO sub_categories (category_id, name, slug, display_order)
    VALUES (cat_fish_id, 'Freshwater Fish', 'freshwater-fish', 2)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO sub_freshwater_id;

    INSERT INTO sub_categories (category_id, name, slug, display_order)
    VALUES (cat_poultry_id, 'Chicken', 'chicken', 1)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO sub_chicken_id;

    INSERT INTO sub_categories (category_id, name, slug, display_order)
    VALUES (cat_meat_id, 'Goat Meat', 'goat-meat', 1)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO sub_mutton_id;

    -- --- PRODUCTS ---
    -- 1. Rohu Fish
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_featured, is_trending, image_url)
    VALUES (
      store_id, sub_freshwater_id, 'Fresh Rohu Fish (Bengali Cut)', 'fresh-rohu-fish', 
      280, 249, 'kg', 50, true, true, true,
      'https://assets.dailyfreshkolkata.in/products/rohu.png'
    ) ON CONFLICT (slug) DO NOTHING;

    -- 2. Chicken Breast
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_deal, is_new_launch, image_url)
    VALUES (
      store_id, sub_chicken_id, 'Premium Chicken Breast (Boneless)', 'chicken-breast-boneless', 
      350, 299, 'kg', 100, true, true, true,
      'https://assets.dailyfreshkolkata.in/products/chicken-breast.png'
    ) ON CONFLICT (slug) DO NOTHING;

    -- 3. Hilsa (Ilish)
    INSERT INTO products (store_id, sub_category_id, name, slug, price, weight_unit, stock_quantity, is_active, is_exclusive, image_url)
    VALUES (
      store_id, sub_seawater_id, 'Padma Hilsa (Premium Size)', 'padma-hilsa-premium', 
      1800, 'kg', 20, true, true,
      'https://assets.dailyfreshkolkata.in/products/hilsa.png'
    ) ON CONFLICT (slug) DO NOTHING;

    -- 4. Mutton Curry Cut
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, weight_unit, stock_quantity, is_active, is_featured, image_url)
    VALUES (
      store_id, sub_mutton_id, 'Tender Mutton Curry Cut', 'mutton-curry-cut', 
      750, 699, 'kg', 30, true, true,
      'https://assets.dailyfreshkolkata.in/products/mutton.png'
    ) ON CONFLICT (slug) DO NOTHING;

END $$;

-- 3. Banner Seed
INSERT INTO banners (title, image_url, placement, display_order, is_active)
VALUES 
('Fresh Catch of the Day', 'https://assets.dailyfreshkolkata.in/banners/hero1.png', 'hero', 1, true),
('Special Sunday Mutton Offer', 'https://assets.dailyfreshkolkata.in/banners/hero2.png', 'hero', 2, true)
ON CONFLICT DO NOTHING;

-- 4. Settings Seed
INSERT INTO settings (key, value, data_type)
VALUES 
('gst_rate', '5', 'number'),
('free_delivery_above', '499', 'number'),
('default_delivery_charge', '40', 'number'),
('min_order_value', '100', 'number'),
('contact_support_phone', '+91 9876543210', 'string'),
('contact_support_email', 'support@dailyfresh.com', 'string')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
