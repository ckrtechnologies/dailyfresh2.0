-- Migration: 2026-05-08_delivery_slot_on_orders.sql
-- Uses the existing public.delivery_slots table (type, slot_name, start_time, end_time, display_order, is_active)

-- 1. Add delivery slot reference columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_slot_id    uuid REFERENCES public.delivery_slots(id),
  ADD COLUMN IF NOT EXISTS delivery_slot_label text;
  -- delivery_slot_label is cached so order history stays readable
  -- even if the slot is later renamed or deleted.

-- 2. RLS on delivery_slots (run only if not already enabled)
ALTER TABLE public.delivery_slots ENABLE ROW LEVEL SECURITY;

-- Admins and store managers can do full CRUD
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_slots' AND policyname = 'admin_manage_delivery_slots'
  ) THEN
    CREATE POLICY "admin_manage_delivery_slots" ON public.delivery_slots
      FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'store_manager'));
  END IF;
END $$;

-- Customers (and unauthenticated requests via anon key) can read active slots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_slots' AND policyname = 'public_read_active_delivery_slots'
  ) THEN
    CREATE POLICY "public_read_active_delivery_slots" ON public.delivery_slots
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- 3. Seed default slots if the table is empty
INSERT INTO public.delivery_slots (type, slot_name, start_time, end_time, display_order)
SELECT * FROM (VALUES
  ('tomorrow_morning', '9 AM – 10 AM',  '09:00'::time, '10:00'::time, 1),
  ('tomorrow_morning', '10 AM – 12 PM', '10:00'::time, '12:00'::time, 2),
  ('tomorrow_evening', '4 PM – 6 PM',   '16:00'::time, '18:00'::time, 1),
  ('tomorrow_evening', '6 PM – 8 PM',   '18:00'::time, '20:00'::time, 2)
) AS v(type, slot_name, start_time, end_time, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_slots LIMIT 1);
