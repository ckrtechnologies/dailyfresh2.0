-- FINAL SCHEMA ALIGNMENT MIGRATION
-- Aligns DB constraints and product data with the 'tmrw_morning' and 'tmrw_evening' keys

-- 1. Update existing products delivery_options (JSONB type)
-- We use valid JSON array syntax '["key1", "key2"]'
UPDATE public.products 
SET delivery_options = '["express", "today_evening", "tmrw_morning", "tmrw_evening"]'::jsonb;

-- 2. Update products table default for future rows
ALTER TABLE public.products 
ALTER COLUMN delivery_options SET DEFAULT '["express", "today_evening", "tmrw_morning", "tmrw_evening"]'::jsonb;

-- 3. Ensure stock columns are aligned
UPDATE public.products 
SET express_stock_qty = COALESCE(express_stock_qty, stock_quantity, 0),
    scheduled_stock_qty = COALESCE(scheduled_stock_qty, stock_quantity, 0);

-- 4. Update the master delivery_slots_config in settings (JSON type)
INSERT INTO settings (key, value, data_type, description)
VALUES (
  'delivery_slots_config',
  '{
    "express": { "label": "Express Delivery", "time": "Within 90 mins", "icon": "lightning-bolt", "color": "#F59E0B" },
    "today_evening": { "label": "Today Evening", "time": "5 PM - 9 PM", "icon": "weather-night", "color": "#4F46E5" },
    "tmrw_morning": { "label": "Tomorrow Morning", "time": "7 AM - 11 AM", "icon": "weather-sunset-up", "color": "#10B981" },
    "tmrw_evening": { "label": "Tomorrow Evening", "time": "5 PM - 9 PM", "icon": "weather-night", "color": "#6366F1" }
  }',
  'json',
  'Master configuration for delivery slots'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
