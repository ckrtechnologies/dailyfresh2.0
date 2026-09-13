-- Create rider_distance_logs table
CREATE TABLE IF NOT EXISTS rider_distance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rider_id, log_date)
);

-- Enable RLS
ALTER TABLE rider_distance_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Riders can view their own logs"
    ON rider_distance_logs FOR SELECT
    USING (rider_id IN (SELECT id FROM riders WHERE user_id = auth.uid()));

CREATE POLICY "Riders can insert/update their own logs"
    ON rider_distance_logs FOR ALL
    USING (rider_id IN (SELECT id FROM riders WHERE user_id = auth.uid()));

-- Indexing
CREATE INDEX IF NOT EXISTS idx_rider_distance_logs_date ON rider_distance_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_rider_distance_logs_rider ON rider_distance_logs(rider_id);
