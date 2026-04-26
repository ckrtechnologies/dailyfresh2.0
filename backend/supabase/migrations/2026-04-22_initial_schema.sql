-- DAILY FRESH INITIAL SCHEMA MIGRATION (REVISED: 2-TABLE CATEGORY STRUCTURE)
-- CREATED: 2026-04-22

-- 1. Profiles Table (Auth Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'store_manager', 'rider', 'admin')),
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Stores Table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_user_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    phone TEXT,
    email TEXT,
    opening_time TIME,
    closing_time TIME,
    delivery_radius_km NUMERIC(5,2) DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Riders Table
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_store_id UUID REFERENCES stores(id),
    vehicle_type TEXT,
    vehicle_number TEXT,
    license_number TEXT,
    govt_id_url TEXT,
    license_url TEXT,
    is_online BOOLEAN DEFAULT false,
    current_lat NUMERIC(10,7),
    current_lng NUMERIC(10,7),
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Categories Table (Top-level)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Sub Categories Table
CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    sub_category_id UUID REFERENCES sub_categories(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_price NUMERIC(10,2),
    weight_unit TEXT NOT NULL DEFAULT 'kg',
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    cut_options TEXT[] DEFAULT '{}',
    cleaning_options TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Addresses Table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    address_id UUID REFERENCES addresses(id),
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled', 'failed')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
    payment_method TEXT NOT NULL,
    total_items_price NUMERIC(10,2) NOT NULL,
    delivery_charge NUMERIC(10,2) DEFAULT 0.00,
    gst_amount NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    coupon_code TEXT,
    delivery_slot TEXT,
    cancellation_reason TEXT,
    customer_notes TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Deliveries Table
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    status TEXT NOT NULL DEFAULT 'pending_assignment' 
        CHECK (status IN ('pending_assignment','assigned','accepted','picked_up','delivered','failed','cancelled')),
    otp TEXT,
    delivery_proof TEXT,
    rider_earning NUMERIC(10,2),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    data_type TEXT CHECK (data_type IN ('string','number','boolean','json')),
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_products_subcategory ON products(sub_category_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_sub_categories_parent ON sub_categories(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);

-- Initial Settings Data
INSERT INTO settings (key, value, data_type, description) VALUES
('gst_rate', '5', 'number', 'GST percentage'),
('free_delivery_above', '499', 'number', 'Order value for free delivery'),
('default_delivery_charge', '60', 'number', 'Charge below threshold'),
('min_order_value', '99', 'number', 'Min order amount');

-- Initial Categories & Subcategories Seed
DO $$
DECLARE
    sea_food_id UUID;
    meat_id UUID;
BEGIN
    INSERT INTO categories (name, slug, description, display_order) 
    VALUES ('Sea Food', 'sea-food', 'Fresh from the ocean', 1) 
    RETURNING id INTO sea_food_id;

    INSERT INTO categories (name, slug, description, display_order) 
    VALUES ('Meat', 'meat', 'Fresh poultry and red meat', 2) 
    RETURNING id INTO meat_id;

    -- Subcategories for Sea Food
    INSERT INTO sub_categories (name, slug, category_id, display_order) 
    VALUES ('Seawater Fish', 'seawater-fish', sea_food_id, 1);
    
    INSERT INTO sub_categories (name, slug, category_id, display_order) 
    VALUES ('Freshwater Fish', 'freshwater-fish', sea_food_id, 2);

    INSERT INTO sub_categories (name, slug, category_id, display_order) 
    VALUES ('Shellfish', 'shellfish', sea_food_id, 3);

    -- Subcategories for Meat
    INSERT INTO sub_categories (name, slug, category_id, display_order) 
    VALUES ('Chicken', 'chicken', meat_id, 1);

    INSERT INTO sub_categories (name, slug, category_id, display_order) 
    VALUES ('Mutton', 'mutton', meat_id, 2);
END $$;
