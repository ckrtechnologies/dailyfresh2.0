-- Update rider_distance_logs table to include start and end readings
ALTER TABLE rider_distance_logs 
ADD COLUMN IF NOT EXISTS start_reading DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS end_reading DECIMAL(10, 2);

-- Ensure distance_km is updated based on readings if provided
-- (Optional: You can handle this in the application logic or via a trigger)
