-- Force update order status check constraint
-- 1. Temporary remove the constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Identify and fix any rows that don't match the standard statuses
-- (Setting them to 'pending' as a fallback)
UPDATE public.orders 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'accepted', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled', 'failed');

-- 3. Add the updated constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'accepted', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'dispatched', 'picked_up', 'delivered', 'cancelled', 'failed'));
