-- SEED DATA FOR DAILY FRESH HOME SCREEN SEGMENTS
-- This script adds banners, categories, subcategories, and products for a complete home screen experience.

-- 1. Ensure Banners Table exists (as per SOW but missing in initial schema)
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    placement TEXT NOT NULL DEFAULT 'hero' CHECK (placement IN ('hero', 'promotional', 'category_page')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was created previously without them
ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS placement TEXT NOT NULL DEFAULT 'hero' CHECK (placement IN ('hero', 'promotional', 'category_page'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT now();
ALTER TABLE banners ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Add is_deal column to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT false;

-- 3. Clear existing data to avoid conflicts (Optional, but good for clean seed)
-- TRUNCATE TABLE banners CASCADE;
-- TRUNCATE TABLE products CASCADE;
-- TRUNCATE TABLE sub_categories CASCADE;
-- TRUNCATE TABLE categories CASCADE;

-- 4. Seed Banners (Hero Carousel)
INSERT INTO banners (title, image_url, link_url, placement, display_order) VALUES
('Fresh Sea Food Festival', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=1000&auto=format&fit=crop', '/category/sea-food', 'hero', 1),
('Organic Farm Chicken', 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=1000&auto=format&fit=crop', '/category/meat', 'hero', 2),
('Weekend Mutton Special', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=1000&auto=format&fit=crop', '/category/meat', 'hero', 3);

-- 5. Seed Categories & Sub-Categories (Refined for segments)
DO $$
DECLARE
    cat_fish UUID;
    cat_meat UUID;
    cat_ready UUID;
    sub_seawater UUID;
    sub_freshwater UUID;
    sub_chicken UUID;
    sub_mutton UUID;
    store_id UUID;
BEGIN
    -- Get a store ID (assuming one exists or create one)
    SELECT id INTO store_id FROM stores LIMIT 1;
    
    IF store_id IS NULL THEN
        -- Create a default store if none exists
        INSERT INTO stores (name, pincode, is_active, address, city, state) 
        VALUES ('Daily Fresh Main Store', '560001', true, 'Indiranagar 100ft Rd', 'Bangalore', 'Karnataka') 
        RETURNING id INTO store_id;
    END IF;

    -- Categories
    INSERT INTO categories (name, slug, description, image_url, display_order) 
    VALUES ('Fish & Seafood', 'sea-food', 'Fresh from the ocean to your plate', 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', 1) 
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url RETURNING id INTO cat_fish;

    INSERT INTO categories (name, slug, description, image_url, display_order) 
    VALUES ('Meat & Poultry', 'meat', 'Freshly cut farm meat', 'https://cdn-icons-png.flaticon.com/512/3143/3143643.png', 2) 
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url RETURNING id INTO cat_meat;

    INSERT INTO categories (name, slug, description, image_url, display_order) 
    VALUES ('Ready to Cook', 'ready-to-cook', 'Marinated and ready for the pan', 'https://cdn-icons-png.flaticon.com/512/1046/1046771.png', 3) 
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url RETURNING id INTO cat_ready;

    -- Subcategories
    INSERT INTO sub_categories (category_id, name, slug, display_order) 
    VALUES (cat_fish, 'Seawater Fish', 'seawater-fish', 1) 
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_fish RETURNING id INTO sub_seawater;

    INSERT INTO sub_categories (category_id, name, slug, display_order) 
    VALUES (cat_fish, 'Shellfish', 'shellfish', 2) 
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_fish RETURNING id INTO sub_freshwater;

    INSERT INTO sub_categories (category_id, name, slug, display_order) 
    VALUES (cat_meat, 'Chicken', 'chicken', 1) 
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_meat RETURNING id INTO sub_chicken;

    INSERT INTO sub_categories (category_id, name, slug, display_order) 
    VALUES (cat_meat, 'Mutton', 'mutton', 2) 
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_meat RETURNING id INTO sub_mutton;

    -- 6. Seed Products (Segment: Deal of the Day, Featured, Fresh Catch)
    
    -- Deal of the Day (is_deal = true)
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_chicken, 'Chicken Curry Cut (Large)', 'chicken-curry-cut-large', 320.00, 249.00, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=400', true, true, true, 50, 'Fresh farm chicken, expertly cut for your perfect curry.')
    ON CONFLICT (slug) DO UPDATE SET 
        price = EXCLUDED.price, 
        discount_price = EXCLUDED.discount_price, 
        image_url = EXCLUDED.image_url,
        is_deal = EXCLUDED.is_deal,
        is_featured = EXCLUDED.is_featured;

    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_seawater, 'White Pomfret (Medium)', 'white-pomfret-medium', 899.00, 749.00, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1000&auto=format&fit=crop', true, true, true, 20, 'Premium seawater pomfret, cleaned and ready to cook.')
    ON CONFLICT (slug) DO UPDATE SET 
        image_url = EXCLUDED.image_url,
        is_deal = EXCLUDED.is_deal;

    -- Fresh Catch / New Arrivals (is_featured = true)
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_seawater, 'King Fish / Surmai (Steaks)', 'king-fish-steaks', 1200.00, 1099.00, 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=1000&auto=format&fit=crop', true, true, false, 30, 'Firm and flavorful King Fish steaks, perfect for frying.')
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, is_featured = EXCLUDED.is_featured;

    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_chicken, 'Chicken Breast (Boneless)', 'chicken-breast-boneless', 450.00, 399.00, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=1000&auto=format&fit=crop', true, false, false, 100, 'Lean and tender chicken breast, antibiotic-free.')
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url;

    -- Category Section: Mutton
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_mutton, 'Premium Mutton Curry Cut', 'premium-mutton-curry-cut', 850.00, 799.00, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=1000&auto=format&fit=crop', true, true, false, 40, 'Tender goat meat, ethically sourced and fresh.')
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url;

    -- Category Section: Ready to Cook
    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_chicken, 'Peri Peri Chicken Wings', 'peri-peri-chicken-wings', 299.00, 249.00, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=1000&auto=format&fit=crop', true, false, false, 60, 'Spicy marinated wings, ready for the grill.')
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url;

    INSERT INTO products (store_id, sub_category_id, name, slug, price, discount_price, image_url, is_active, is_featured, is_deal, stock_quantity, description)
    VALUES (store_id, sub_chicken, 'Chicken Nuggets (Crispy)', 'chicken-nuggets-crispy', 199.00, 149.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1000&auto=format&fit=crop', true, true, true, 80, 'Golden crispy chicken nuggets, kid-friendly and fresh.')
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, is_deal = EXCLUDED.is_deal;

END $$;
