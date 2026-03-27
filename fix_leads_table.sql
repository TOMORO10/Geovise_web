-- Update the existing "Leads" table with missing columns
ALTER TABLE public."Leads" 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS product_of_interest text,
ADD COLUMN IF NOT EXISTS message text;

-- Enable Row Level Security if not already enabled
ALTER TABLE public."Leads" ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous inserts for the contact form
-- If the policy already exists from a previous step, this will skip it.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Leads' AND policyname = 'Allow anon lead insert'
    ) THEN
        CREATE POLICY "Allow anon lead insert" ON public."Leads" 
        FOR INSERT WITH CHECK (true);
    END IF;
END $$;
