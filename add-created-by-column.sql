-- Migration: Add created_by column to disbursements table
-- This column tracks which user created each disbursement for accountability

-- Add column only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disbursements' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE disbursements 
    ADD COLUMN created_by TEXT DEFAULT 'Unknown User';
    
    -- Add comment to the column for documentation
    COMMENT ON COLUMN disbursements.created_by IS 'Username of the user who created this disbursement';
  END IF;
END $$;

-- Refresh the schema cache to make the column visible to Supabase client
NOTIFY pgrst, 'reload schema';
