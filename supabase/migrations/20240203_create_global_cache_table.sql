-- Create a specific table for the global daily insights cache
-- This avoids the Foreign Key constraint on the 'couples' table which prevents using a dummy ID.

CREATE TABLE IF NOT EXISTS "public"."global_insights_cache" (
    "insight_date" date NOT NULL PRIMARY KEY,
    "content" jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE "public"."global_insights_cache" ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to READ this table
CREATE POLICY "Allow authenticated read access"
ON "public"."global_insights_cache"
FOR SELECT
TO authenticated
USING (true);

-- Allow Admin/Service Role to full access (for Cron jobs)
CREATE POLICY "Allow service role full access"
ON "public"."global_insights_cache"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
