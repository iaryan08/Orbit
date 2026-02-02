-- Allow all authenticated users to READ the global insights record
-- This allows fetching data for couple_id = '00000000-0000-0000-0000-000000000000'

CREATE POLICY "Enable read access for all users to global insights"
ON "public"."couple_insights"
FOR SELECT
TO authenticated
USING (
  couple_id = '00000000-0000-0000-0000-000000000000'
);
