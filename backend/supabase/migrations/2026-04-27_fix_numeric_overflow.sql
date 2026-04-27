-- FIX NUMERIC FIELD OVERFLOW ERRORS
-- Changes latitude, longitude, and distance fields to unconstrained NUMERIC to prevent overflow errors

-- 1. Stores Table
ALTER TABLE stores 
  ALTER COLUMN latitude TYPE NUMERIC,
  ALTER COLUMN longitude TYPE NUMERIC,
  ALTER COLUMN delivery_radius_km TYPE NUMERIC;

-- 2. Riders Table
ALTER TABLE riders 
  ALTER COLUMN current_lat TYPE NUMERIC,
  ALTER COLUMN current_lng TYPE NUMERIC;

-- 3. Addresses Table
ALTER TABLE addresses 
  ALTER COLUMN latitude TYPE NUMERIC,
  ALTER COLUMN longitude TYPE NUMERIC;

-- 4. Orders Table (Price fields are usually safe with NUMERIC(10,2) but let's check)
-- price NUMERIC(10,2) is 8 digits before decimal (up to 99 million). Should be fine.
-- But if the user wants "unlimited", we could change them too. 
-- However, lat/long/radius are the most likely culprits for the specific "overflow" error seen in map pickers.
