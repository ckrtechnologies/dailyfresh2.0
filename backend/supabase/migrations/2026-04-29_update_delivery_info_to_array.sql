-- Final corrected migration to change delivery_info in product_variants to text[] array
-- This version handles existing defaults and avoids subquery restrictions

-- Step 1: Drop any existing default to avoid casting errors during type change
ALTER TABLE product_variants ALTER COLUMN delivery_info DROP DEFAULT;

-- Step 2: Alter the column type using translate to clean up JSON brackets and quotes
ALTER TABLE product_variants 
  ALTER COLUMN delivery_info TYPE text[] 
  USING 
    CASE 
      WHEN delivery_info IS NULL OR delivery_info = '' THEN ARRAY[]::text[]
      WHEN delivery_info ~ '^\[.*\]$' THEN 
        -- It's a JSON string like ["A", "B"]. 
        -- We remove [ ] " and then split by comma
        string_to_array(translate(delivery_info, '[]"', ''), ', ')
      ELSE 
        -- It's a normal comma-separated string like "A, B"
        string_to_array(delivery_info, ', ')
    END;

-- Step 3: Set the correct new default value for arrays
ALTER TABLE product_variants 
  ALTER COLUMN delivery_info SET DEFAULT ARRAY['Tomorrow Morning']::text[];
