-- Migration: Rename cooking_instructions to cooking_guide
ALTER TABLE products RENAME COLUMN cooking_instructions TO cooking_guide;

-- Comment for documentation
COMMENT ON COLUMN products.cooking_guide IS 'Detailed cooking instructions or recipe steps';
