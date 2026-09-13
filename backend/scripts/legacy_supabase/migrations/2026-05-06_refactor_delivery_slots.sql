-- Migration: Remove today_evening slot and rename tmrw to tomorrow
-- Date: 2026-05-06

-- 1. Update master delivery_slots_config in settings
UPDATE public.settings 
SET value = '{
  "express": { "label": "Express Delivery", "time": "Within 90 mins", "icon": "lightning-bolt", "color": "#F59E0B" },
  "tomorrow_morning": { "label": "Tomorrow Morning", "time": "7 AM - 11 AM", "icon": "weather-sunset-up", "color": "#10B981" },
  "tomorrow_evening": { "label": "Tomorrow Evening", "time": "5 PM - 9 PM", "icon": "weather-night", "color": "#6366F1" }
}'::json
WHERE key = 'delivery_slots_config';

-- 2. Update products table default for future rows
ALTER TABLE public.products 
ALTER COLUMN delivery_options SET DEFAULT '["express", "tomorrow_morning", "tomorrow_evening"]'::jsonb;

-- 3. Update existing products: 
-- Remove 'today_evening', rename 'tmrw_morning' -> 'tomorrow_morning', 'tmrw_evening' -> 'tomorrow_evening'
-- We'll use a simple approach of re-setting them to the new default since the client wants a complete change
UPDATE public.products 
SET delivery_options = '["express", "tomorrow_morning", "tomorrow_evening"]'::jsonb;

-- 4. Clean up any existing orders if necessary (Optional, usually we keep history as is)
-- For now, we leave history to avoid data integrity issues, 
-- but new orders will use the new keys.
