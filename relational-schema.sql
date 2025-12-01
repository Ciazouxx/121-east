-- Relational Schema for IMProject
-- This creates proper foreign key relationships between tables
-- Run this AFTER cleaning up duplicate tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Add foreign key columns if they don't exist
-- ============================================

-- Add payee_id to disbursements if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disbursements' AND column_name = 'payee_id'
  ) THEN
    ALTER TABLE disbursements ADD COLUMN payee_id UUID;
  END IF;
END $$;

-- Add account_id to disbursements if it doesn't exist (for linking to chart of accounts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disbursements' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE disbursements ADD COLUMN account_id UUID;
  END IF;
END $$;

-- ============================================
-- STEP 2: Update existing data to link relationships
-- ============================================

-- Link disbursements to payees by name (if payee_id is null)
UPDATE disbursements d
SET payee_id = p.id
FROM payees p
WHERE d.name = p.name AND d.payee_id IS NULL;

-- Link disbursements to charts_of_account by account_number (if account_id is null and account_number exists)
UPDATE disbursements d
SET account_id = coa.account_id
FROM charts_of_account coa
WHERE d.account_number = coa.account_number::text AND d.account_id IS NULL;

-- ============================================
-- STEP 3: Create foreign key constraints
-- ============================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS fk_disbursements_payee;
ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS fk_disbursements_account;

-- Add foreign key: disbursements -> payees
ALTER TABLE disbursements
ADD CONSTRAINT fk_disbursements_payee
FOREIGN KEY (payee_id) REFERENCES payees(id) ON DELETE SET NULL;

-- Add foreign key: disbursements -> charts_of_account
ALTER TABLE disbursements
ADD CONSTRAINT fk_disbursements_account
FOREIGN KEY (account_id) REFERENCES charts_of_account(account_id) ON DELETE SET NULL;

-- ============================================
-- STEP 4: Make payee_id NOT NULL for new records (optional)
-- ============================================
-- Uncomment below if you want to enforce payee_id is always required
-- ALTER TABLE disbursements ALTER COLUMN payee_id SET NOT NULL;

-- ============================================
-- STEP 5: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_disbursements_payee_id ON disbursements(payee_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_account_id ON disbursements(account_id);

-- ============================================
-- STEP 6: Update RLS policies if needed
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts_of_account ENABLE ROW LEVEL SECURITY;

-- Verify policies exist (create if they don't)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payees' AND policyname = 'Allow all operations on payees'
  ) THEN
    CREATE POLICY "Allow all operations on payees" ON payees FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'disbursements' AND policyname = 'Allow all operations on disbursements'
  ) THEN
    CREATE POLICY "Allow all operations on disbursements" ON disbursements FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'charts_of_account' AND policyname = 'Allow all operations on charts_of_account'
  ) THEN
    CREATE POLICY "Allow all operations on charts_of_account" ON charts_of_account FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('disbursements', 'payees', 'charts_of_account');

