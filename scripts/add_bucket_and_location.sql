-- Add location fields to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create Bucket List table
CREATE TABLE IF NOT EXISTS bucket_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS logic
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- Policies for bucket_list
CREATE POLICY "Bucket items are visible to the couple" ON bucket_list 
FOR SELECT USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Couple can insert bucket items" ON bucket_list 
FOR INSERT WITH CHECK (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Couple can update bucket items" ON bucket_list 
FOR UPDATE USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Couple can delete bucket items" ON bucket_list 
FOR DELETE USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
