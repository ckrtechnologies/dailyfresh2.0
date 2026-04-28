-- ================================================================
-- PRODUCT VARIANTS MIGRATION
-- ================================================================

-- 1. Create Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT, -- for the info tooltip
    price NUMERIC(10,2) NOT NULL,
    discount_price NUMERIC(10,2),
    weight_text TEXT, -- e.g. "Net: 500g"
    gross_weight_text TEXT, -- e.g. "Gross: 715g"
    image_url TEXT,
    delivery_info TEXT DEFAULT 'Tomorrow Morning',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update order_items to include variant_id
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- 3. Update cart_items to include variant_id
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- 4. Unique constraint for cart items with variants
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_store_id_key;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_product_id_store_id_variant_id_key UNIQUE(user_id, product_id, store_id, variant_id);

-- 5. Enable RLS and set policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for variants" ON product_variants
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access for variants" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'store_manager')
        )
    );
