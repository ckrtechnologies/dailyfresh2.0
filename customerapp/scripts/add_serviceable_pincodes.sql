-- Migration to add serviceable_pincodes to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS serviceable_pincodes TEXT[] DEFAULT '{}';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stores_pincodes ON stores USING GIN (serviceable_pincodes);

-- Update existing store to include current pincode in the array
UPDATE stores SET serviceable_pincodes = ARRAY[pincode] WHERE pincode IS NOT NULL;
