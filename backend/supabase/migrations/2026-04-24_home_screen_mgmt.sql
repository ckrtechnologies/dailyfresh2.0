-- HOME SCREEN MANAGEMENT MIGRATION
-- Created: 2026-04-24

-- 1. Banners Table (Formalizing from seed script)
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

-- 2. Home Sections Configuration Table
-- This allows reordering and toggling sections on the home screen
CREATE TABLE IF NOT EXISTS home_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_type TEXT NOT NULL UNIQUE, -- e.g., 'BANNER_CAROUSEL', 'CATEGORY_STRIP', 'DEALS_OF_THE_DAY', 'FEATURED_PRODUCTS', 'TRUST_BANNER', 'DYNAMIC_CATEGORY'
    title TEXT,
    subtitle TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}', -- Store extra settings like 'category_id' for DYNAMIC_CATEGORY
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Seed Default Home Sections
INSERT INTO home_sections (section_type, title, subtitle, display_order) VALUES
('CATEGORY_STRIP', 'Browse Categories', NULL, 1),
('BANNER_CAROUSEL', 'Offers & New Arrivals', NULL, 2),
('DEALS_OF_THE_DAY', 'Deals of the Day', 'Flash sale on fresh items', 3),
('FEATURED_PRODUCTS', 'Fresh Catch Today', 'Best quality seafood & meat', 4),
('TRUST_BANNER', 'Why Daily Fresh?', NULL, 5)
ON CONFLICT (section_type) DO NOTHING;

-- 4. Ensure products have home screen flags
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
