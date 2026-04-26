-- RPC function for atomic stock decrement
CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
