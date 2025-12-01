-- Make Existing Tables Relational with Foreign Keys
-- This script adds proper foreign key relationships to your existing tables
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Add Foreign Key Columns
-- ============================================

-- Add payee_id to disbursements (links to payees.id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disbursements' AND column_name = 'payee_id'
  ) THEN
    ALTER TABLE disbursements ADD COLUMN payee_id UUID REFERENCES payees(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_disbursements_payee_id ON disbursements(payee_id);
  END IF;
END $$;

-- Add account_id to disbursements (links to charts_of_account.account_id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disbursements' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE disbursements ADD COLUMN account_id UUID REFERENCES charts_of_account(account_id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_disbursements_account_id ON disbursements(account_id);
  END IF;
END $$;

-- ============================================
-- STEP 2: Populate Foreign Keys from Existing Data
-- ============================================

-- Link disbursements to payees by name
UPDATE disbursements d
SET payee_id = p.id
FROM payees p
WHERE d.name = p.name AND d.payee_id IS NULL;

-- Link disbursements to charts_of_account by account_number
UPDATE disbursements d
SET account_id = coa.account_id
FROM charts_of_account coa
WHERE d.account_number = coa.account_number::text AND d.account_id IS NULL;

-- ============================================
-- STEP 3: Add Foreign Key Constraints (if not already added)
-- ============================================

-- Ensure foreign key constraint exists for payee_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_disbursements_payee'
  ) THEN
    ALTER TABLE disbursements
    ADD CONSTRAINT fk_disbursements_payee
    FOREIGN KEY (payee_id) REFERENCES payees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure foreign key constraint exists for account_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_disbursements_account'
  ) THEN
    ALTER TABLE disbursements
    ADD CONSTRAINT fk_disbursements_account
    FOREIGN KEY (account_id) REFERENCES charts_of_account(account_id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- STEP 4: Verify Relationships
-- ============================================

-- Show all foreign key relationships
SELECT
    tc.table_name AS "Table",
    kcu.column_name AS "Column",
    ccu.table_name AS "References Table",
    ccu.column_name AS "References Column",
    tc.constraint_name AS "Constraint Name"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- STEP 5: Create Additional Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_disbursements_payee_id ON disbursements(payee_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_account_id ON disbursements(account_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_date ON disbursements(date);

-- ============================================
-- RELATIONSHIP SUMMARY
-- ============================================
-- 
-- payees (1) ──< (many) disbursements
--   - payees.id → disbursements.payee_id
--
-- charts_of_account (1) ──< (many) disbursements  
--   - charts_of_account.account_id → disbursements.account_id
--
-- These relationships ensure:
-- - Data integrity (can't delete payee if disbursements reference it)
-- - Easy joins for queries
-- - Proper cascading behavior

