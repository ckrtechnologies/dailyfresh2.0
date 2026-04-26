-- Ensure addresses table exists with correct columns
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- Home, Work, Other
    full_name TEXT,
    phone TEXT,
    line1 TEXT NOT NULL, -- House No, Building
    line2 TEXT, -- Area, Landmark
    city TEXT DEFAULT 'Kolkata',
    state TEXT DEFAULT 'West Bengal',
    pincode TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses" 
ON public.addresses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
ON public.addresses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.addresses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.addresses FOR DELETE 
USING (auth.uid() = user_id);
