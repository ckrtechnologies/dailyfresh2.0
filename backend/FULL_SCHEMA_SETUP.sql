-- ============================================================
-- DAILY FRESH - COMPLETE DATABASE SCHEMA SETUP SCRIPT
-- Generated: 2026-08-18
-- Version: Final (covers all migrations up to 2026-05-08)
--
-- HOW TO USE:
--   1. Open your new Supabase project SQL Editor
--   2. Copy-paste this ENTIRE file and run it once
--   3. This script is idempotent - safe to run on an empty DB
--
-- TABLES CREATED (in dependency order):
--   profiles, stores, riders, categories, sub_categories,
--   products, product_variants, addresses, delivery_slots,
--   coupons, orders, order_items, deliveries, cart_items,
--   user_favorites, notifications, banners, home_sections,
--   settings, rider_distance_logs
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT        NOT NULL,
    email       TEXT        UNIQUE NOT NULL,
    phone       TEXT        UNIQUE NOT NULL,
    avatar_url  TEXT,
    role        TEXT        NOT NULL DEFAULT 'customer'
                            CHECK (role IN ('customer', 'store_manager', 'rider', 'admin')),
    fcm_token   TEXT,
    is_active   BOOLEAN     DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. STORES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stores (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_user_id      UUID         REFERENCES public.profiles(id),
    name                 TEXT         NOT NULL,
    logo_url             TEXT,
    cover_url            TEXT,
    description          TEXT,
    address              TEXT,
    city                 TEXT,
    state                TEXT,
    pincode              TEXT         NOT NULL,
    latitude             NUMERIC(10,7),
    longitude            NUMERIC(10,7),
    phone                TEXT,
    email                TEXT,
    opening_time         TIME,
    closing_time         TIME,
    delivery_radius_km   NUMERIC(5,2) DEFAULT 10,
    serviceable_pincodes TEXT[]       DEFAULT '{}',
    is_active            BOOLEAN      DEFAULT true,
    created_at           TIMESTAMPTZ  DEFAULT now(),
    updated_at           TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- 3. RIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.riders (
    id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID    UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_store_id UUID    REFERENCES public.stores(id),
    vehicle_type      TEXT,
    vehicle_number    TEXT,
    license_number    TEXT,
    govt_id_url       TEXT,
    license_url       TEXT,
    fcm_token         TEXT,
    is_online         BOOLEAN DEFAULT false,
    current_lat       NUMERIC(10,7),
    current_lng       NUMERIC(10,7),
    approval_status   TEXT    NOT NULL DEFAULT 'pending'
                              CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT    NOT NULL,
    slug          TEXT    UNIQUE NOT NULL,
    description   TEXT,
    image_url     TEXT,
    display_order INTEGER DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. SUB_CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sub_categories (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID    NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name          TEXT    NOT NULL,
    slug          TEXT    UNIQUE NOT NULL,
    description   TEXT,
    image_url     TEXT,
    display_order INTEGER DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id            UUID          NOT NULL REFERENCES public.stores(id),
    sub_category_id     UUID          REFERENCES public.sub_categories(id),
    name                TEXT          NOT NULL,
    slug                TEXT          UNIQUE NOT NULL,
    description         TEXT,
    cooking_guide       TEXT,
    product_highlights  JSONB         DEFAULT '[]',
    sku                 TEXT          UNIQUE,
    price               NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_price      NUMERIC(10,2),
    weight_unit         TEXT          NOT NULL DEFAULT 'kg',
    stock_quantity      INTEGER       DEFAULT 0,
    express_stock_qty   INTEGER       DEFAULT 0,
    scheduled_stock_qty INTEGER       DEFAULT 0,
    delivery_options    JSONB         DEFAULT '["express", "tomorrow_morning", "tomorrow_evening"]',
    is_active           BOOLEAN       DEFAULT true,
    is_featured         BOOLEAN       DEFAULT false,
    is_deal             BOOLEAN       DEFAULT false,
    is_flash_sale       BOOLEAN       DEFAULT false,
    is_exclusive        BOOLEAN       DEFAULT false,
    is_trending         BOOLEAN       DEFAULT false,
    is_frozen           BOOLEAN       DEFAULT false,
    is_new_launch       BOOLEAN       DEFAULT false,
    cut_options         TEXT[]        DEFAULT '{}',
    cleaning_options    TEXT[]        DEFAULT '{}',
    images              TEXT[]        DEFAULT '{}',
    image_url           TEXT,
    metadata            JSONB         DEFAULT '{}',
    created_at          TIMESTAMPTZ   DEFAULT now(),
    updated_at          TIMESTAMPTZ   DEFAULT now()
);

-- ============================================================
-- 7. PRODUCT_VARIANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name              TEXT          NOT NULL,
    description       TEXT,
    price             NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_price    NUMERIC(10,2),
    weight_text       TEXT,
    gross_weight_text TEXT,
    image_url         TEXT,
    delivery_info     TEXT[]        DEFAULT ARRAY['Tomorrow Morning'],
    display_order     INTEGER       DEFAULT 0,
    created_at        TIMESTAMPTZ   DEFAULT now(),
    updated_at        TIMESTAMPTZ   DEFAULT now()
);

-- ============================================================
-- 8. ADDRESSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label      TEXT    DEFAULT 'Home',
    full_name  TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    line1      TEXT    NOT NULL,
    line2      TEXT,
    city       TEXT    NOT NULL,
    state      TEXT    NOT NULL,
    pincode    TEXT    NOT NULL,
    latitude   NUMERIC(10,7),
    longitude  NUMERIC(10,7),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. DELIVERY_SLOTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_slots (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    type          TEXT    NOT NULL
                          CHECK (type IN ('tomorrow_morning', 'tomorrow_evening')),
    slot_name     TEXT    NOT NULL,
    start_time    TIME,
    end_time      TIME,
    display_order INTEGER DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT          UNIQUE NOT NULL,
    description         TEXT,
    discount_type       TEXT          NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value      NUMERIC(10,2) NOT NULL,
    min_order_amount    NUMERIC(10,2) DEFAULT 0,
    max_discount_amount NUMERIC(10,2),
    start_date          TIMESTAMPTZ   DEFAULT now(),
    end_date            TIMESTAMPTZ,
    usage_limit         INTEGER,
    used_count          INTEGER       DEFAULT 0,
    is_active           BOOLEAN       DEFAULT true,
    created_at          TIMESTAMPTZ   DEFAULT now(),
    updated_at          TIMESTAMPTZ   DEFAULT now()
);

-- ============================================================
-- 11. ORDERS TABLE
-- NOTE: rider_id references profiles(id) not riders(id)
--       because the app stores rider.user_id in orders.rider_id
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        TEXT    UNIQUE NOT NULL,
    user_id             UUID    NOT NULL REFERENCES public.profiles(id),
    store_id            UUID    NOT NULL REFERENCES public.stores(id),
    rider_id            UUID    REFERENCES public.profiles(id),
    address_id          UUID    REFERENCES public.addresses(id),
    delivery_type       TEXT    NOT NULL DEFAULT 'express'
                                CHECK (delivery_type IN ('express', 'tomorrow_morning', 'tomorrow_evening')),
    delivery_slot_id    UUID    REFERENCES public.delivery_slots(id),
    delivery_slot_label TEXT,
    delivery_slot       TEXT,
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    status              TEXT    NOT NULL DEFAULT 'placed'
                                CHECK (status IN (
                                    'placed', 'pending', 'confirmed', 'preparing', 'ready',
                                    'accepted', 'out_for_delivery', 'picked_up',
                                    'delivered', 'cancelled', 'failed'
                                )),
    payment_status      TEXT    NOT NULL DEFAULT 'unpaid'
                                CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
    payment_method      TEXT    NOT NULL,
    total_items_price   NUMERIC(10,2) NOT NULL,
    delivery_charge     NUMERIC(10,2) DEFAULT 0.00,
    gst_amount          NUMERIC(10,2) DEFAULT 0.00,
    discount_amount     NUMERIC(10,2) DEFAULT 0.00,
    total_amount        NUMERIC(10,2) NOT NULL,
    coupon_code         TEXT,
    coupon_id           UUID    REFERENCES public.coupons(id),
    razorpay_order_id   TEXT,
    razorpay_payment_id TEXT,
    status_updated_at   TIMESTAMPTZ,
    status_updated_by   UUID    REFERENCES public.profiles(id),
    status_updated_role TEXT,
    cancellation_reason TEXT,
    customer_notes      TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. ORDER_ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id  UUID    REFERENCES public.products(id),
    variant_id  UUID    REFERENCES public.product_variants(id),
    store_id    UUID    NOT NULL REFERENCES public.stores(id),
    name        TEXT    NOT NULL,
    quantity    INTEGER NOT NULL,
    unit_price  NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    preferences JSONB   DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. DELIVERIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rider_id       UUID    REFERENCES public.riders(id),
    store_id       UUID    NOT NULL REFERENCES public.stores(id),
    status         TEXT    NOT NULL DEFAULT 'pending_assignment'
                           CHECK (status IN (
                               'pending_assignment', 'assigned', 'accepted',
                               'picked_up', 'delivered', 'failed', 'cancelled'
                           )),
    otp            TEXT,
    delivery_proof TEXT,
    rider_earning  NUMERIC(10,2),
    picked_up_at   TIMESTAMPTZ,
    delivered_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. CART_ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id          UUID    NOT NULL REFERENCES public.products(id),
    variant_id          UUID    REFERENCES public.product_variants(id),
    store_id            UUID    NOT NULL REFERENCES public.stores(id),
    quantity            INTEGER NOT NULL DEFAULT 1,
    cut_preference      TEXT,
    cleaning_preference TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 15. USER_FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- ============================================================
-- 16. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID    REFERENCES public.profiles(id) ON DELETE CASCADE,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    type       TEXT    NOT NULL,
    data       JSONB   DEFAULT '{}',
    is_read    BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. BANNERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT    NOT NULL,
    image_url     TEXT    NOT NULL,
    link_url      TEXT,
    placement     TEXT    NOT NULL DEFAULT 'hero'
                          CHECK (placement IN ('hero', 'promotional', 'category_page')),
    display_order INTEGER DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    valid_from    TIMESTAMPTZ DEFAULT now(),
    valid_until   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 18. HOME_SECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.home_sections (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT    NOT NULL,
    subtitle      TEXT,
    section_type  TEXT,
    config        JSONB   DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 19. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    data_type   TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 20. RIDER_DISTANCE_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rider_distance_logs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id      UUID         REFERENCES public.riders(id) ON DELETE CASCADE,
    log_date      DATE         NOT NULL,
    start_reading DECIMAL(10,2),
    end_reading   DECIMAL(10,2),
    distance_km   DECIMAL(10,2) NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ  DEFAULT now(),
    updated_at    TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (rider_id, log_date)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_subcategory        ON public.products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_store              ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_parent       ON public.sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user                 ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store                ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status               ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_rider                ON public.orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order           ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user             ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user          ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_rider_distance_logs_date    ON public.rider_distance_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_rider_distance_logs_rider   ON public.rider_distance_logs(rider_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product    ON public.product_variants(product_id);

-- ============================================================
-- RLS - Enable Row Level Security
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_distance_logs   ENABLE ROW LEVEL SECURITY;

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- stores
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stores' AND policyname='Public read active stores') THEN
    CREATE POLICY "Public read active stores" ON public.stores FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Public read categories') THEN
    CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- sub_categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sub_categories' AND policyname='Public read sub_categories') THEN
    CREATE POLICY "Public read sub_categories" ON public.sub_categories FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Public read active products') THEN
    CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- product_variants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_variants' AND policyname='Public read product variants') THEN
    CREATE POLICY "Public read product variants" ON public.product_variants FOR SELECT USING (true);
  END IF;
END $$;

-- banners
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banners' AND policyname='Public read active banners') THEN
    CREATE POLICY "Public read active banners" ON public.banners FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- home_sections
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='home_sections' AND policyname='Public read home sections') THEN
    CREATE POLICY "Public read home sections" ON public.home_sections FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='settings' AND policyname='Public read settings') THEN
    CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
  END IF;
END $$;

-- delivery_slots
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_slots' AND policyname='admin_manage_delivery_slots') THEN
    CREATE POLICY "admin_manage_delivery_slots" ON public.delivery_slots
      FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'store_manager'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_slots' AND policyname='public_read_active_delivery_slots') THEN
    CREATE POLICY "public_read_active_delivery_slots" ON public.delivery_slots
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- addresses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='addresses' AND policyname='Users manage own addresses') THEN
    CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Users see own orders') THEN
    CREATE POLICY "Users see own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- order_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Users see own order items') THEN
    CREATE POLICY "Users see own order items" ON public.order_items FOR SELECT
      USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
  END IF;
END $$;

-- cart_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart_items' AND policyname='Users manage own cart') THEN
    CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- user_favorites
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_favorites' AND policyname='Users manage own favorites') THEN
    CREATE POLICY "Users manage own favorites" ON public.user_favorites FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users see own notifications') THEN
    CREATE POLICY "Users see own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- riders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='riders' AND policyname='Riders see own record') THEN
    CREATE POLICY "Riders see own record" ON public.riders FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- rider_distance_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rider_distance_logs' AND policyname='Riders can view their own logs') THEN
    CREATE POLICY "Riders can view their own logs" ON public.rider_distance_logs FOR SELECT
      USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rider_distance_logs' AND policyname='Riders can upsert their own logs') THEN
    CREATE POLICY "Riders can upsert their own logs" ON public.rider_distance_logs FOR ALL
      USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
  END IF;
END $$;

-- coupons
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Public read active coupons') THEN
    CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- ============================================================
-- DATABASE FUNCTIONS (RPCs)
-- ============================================================

-- Atomically increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id_param UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = coupon_id_param;
END;
$$;

-- Update rider GPS location
CREATE OR REPLACE FUNCTION public.update_rider_location(
    p_rider_id UUID,
    p_lat      NUMERIC,
    p_long     NUMERIC
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.riders
  SET current_lat = p_lat,
      current_lng = p_long,
      updated_at  = now()
  WHERE id = p_rider_id;
END;
$$;

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_profiles_updated_at') THEN
    CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_stores_updated_at') THEN
    CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON public.stores
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_riders_updated_at') THEN
    CREATE TRIGGER trg_riders_updated_at BEFORE UPDATE ON public.riders
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_products_updated_at') THEN
    CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_orders_updated_at') THEN
    CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================================
-- TRIGGER: auto-create profile on auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============================================================
-- SEED: PLATFORM SETTINGS
-- ============================================================
INSERT INTO public.settings (key, value, data_type, description) VALUES
  ('gst_rate',                '5',   'number', 'GST percentage applied to orders'),
  ('free_delivery_above',     '499', 'number', 'Order value above which delivery is free (INR)'),
  ('default_delivery_charge', '60',  'number', 'Standard delivery charge below free threshold (INR)'),
  ('min_order_value',         '99',  'number', 'Minimum order amount allowed (INR)'),
  ('contact_support_phone',   '',    'string', 'Customer support phone number'),
  ('contact_support_email',   '',    'string', 'Customer support email address'),
  ('delivery_slots_config',
   '{"express":{"label":"Express Delivery","time":"Within 90 mins","icon":"lightning-bolt","color":"#F59E0B"},"tomorrow_morning":{"label":"Tomorrow Morning","time":"7 AM - 11 AM","icon":"weather-sunset-up","color":"#10B981"},"tomorrow_evening":{"label":"Tomorrow Evening","time":"5 PM - 9 PM","icon":"weather-night","color":"#6366F1"}}',
   'json', 'Master configuration for delivery slot options shown in the app')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, data_type = EXCLUDED.data_type;

-- ============================================================
-- SEED: DELIVERY SLOTS (time-window sub-slots)
-- ============================================================
INSERT INTO public.delivery_slots (type, slot_name, start_time, end_time, display_order)
SELECT * FROM (VALUES
  ('tomorrow_morning'::text, '9 AM - 10 AM',  '09:00'::time, '10:00'::time, 1),
  ('tomorrow_morning'::text, '10 AM - 12 PM', '10:00'::time, '12:00'::time, 2),
  ('tomorrow_evening'::text, '4 PM - 6 PM',   '16:00'::time, '18:00'::time, 1),
  ('tomorrow_evening'::text, '6 PM - 8 PM',   '18:00'::time, '20:00'::time, 2)
) AS v(type, slot_name, start_time, end_time, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_slots LIMIT 1);

-- ============================================================
-- SEED: CATEGORIES & SUB-CATEGORIES
-- ============================================================
DO $$
DECLARE
  cat_fish  UUID;
  cat_meat  UUID;
  cat_ready UUID;
BEGIN
  INSERT INTO public.categories (name, slug, description, display_order)
    VALUES ('Fish & Seafood', 'sea-food', 'Fresh from the ocean to your plate', 1)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_fish;

  INSERT INTO public.categories (name, slug, description, display_order)
    VALUES ('Meat & Poultry', 'meat', 'Freshly cut farm meat and poultry', 2)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_meat;

  INSERT INTO public.categories (name, slug, description, display_order)
    VALUES ('Ready to Cook', 'ready-to-cook', 'Marinated and ready for the pan', 3)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_ready;

  INSERT INTO public.sub_categories (category_id, name, slug, display_order)
    VALUES (cat_fish, 'Seawater Fish',   'seawater-fish',   1)
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_fish;

  INSERT INTO public.sub_categories (category_id, name, slug, display_order)
    VALUES (cat_fish, 'Freshwater Fish', 'freshwater-fish', 2)
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_fish;

  INSERT INTO public.sub_categories (category_id, name, slug, display_order)
    VALUES (cat_fish, 'Shellfish', 'shellfish', 3)
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_fish;

  INSERT INTO public.sub_categories (category_id, name, slug, display_order)
    VALUES (cat_meat, 'Chicken', 'chicken', 1)
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_meat;

  INSERT INTO public.sub_categories (category_id, name, slug, display_order)
    VALUES (cat_meat, 'Mutton', 'mutton', 2)
    ON CONFLICT (slug) DO UPDATE SET category_id = cat_meat;
END $$;

-- ============================================================
-- END OF SCRIPT
-- ============================================================
-- NEXT STEPS on new VPS:
--   1. Supabase Dashboard -> Auth -> Settings:
--      Set Site URL, Redirect URLs
--   2. Create first Admin user via Supabase Auth -> Users
--   3. Insert that user into profiles with role='admin':
--      INSERT INTO profiles (id, full_name, email, phone, role)
--      VALUES ('<auth-user-uuid>', 'Admin', 'admin@example.com', '0000000000', 'admin');
--   4. Update .env:
--      SUPABASE_URL=https://<project>.supabase.co
--      SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
--      SUPABASE_ANON_KEY=<anon-key>
-- ============================================================
