-- MIGRATION: Update orders status check constraint
-- DATE: 2026-05-03

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'placed', 
    'pending', 
    'confirmed', 
    'preparing', 
    'ready', 
    'accepted', 
    'out_for_delivery', 
    'picked_up', 
    'delivered', 
    'cancelled', 
    'failed'
));
