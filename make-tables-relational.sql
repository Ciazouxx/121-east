-- =====================================================
-- MAKE TABLES RELATIONAL - BEGINNER FRIENDLY GUIDE
-- =====================================================
-- This script adds proper relationships between your database tables
-- without breaking your existing website functionality.
--
-- WHEN TO RUN THIS: After your website is working and you want to
-- improve database structure for better data integrity.
--
-- =====================================================

-- =====================================================
-- STEP 1: Add Foreign Key Columns (New Columns)
-- =====================================================
-- We're adding new columns that will link to other tables
-- The old text columns (created_by, submitted_by) will stay for now

-- Add user reference columns to disbursements table
ALTER TABLE disbursements 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
ADD COLUMN IF NOT EXISTS submitted_by_user_id UUID;

-- Add account reference column to disbursements
ALTER TABLE disbursements
ADD COLUMN IF NOT EXISTS chart_account_id UUID;

-- =====================================================
-- STEP 2: Create Foreign Key Constraints
-- =====================================================
-- These ensure that references between tables are always valid

-- Link disbursements to users who created them
ALTER TABLE disbursements
DROP CONSTRAINT IF EXISTS disbursements_created_by_user_fkey;

ALTER TABLE disbursements
ADD CONSTRAINT disbursements_created_by_user_fkey 
FOREIGN KEY (created_by_user_id) 
REFERENCES users(user_id) 
ON DELETE SET NULL;  -- If user is deleted, just clear the reference

-- Link disbursements to users who submitted them
ALTER TABLE disbursements
DROP CONSTRAINT IF EXISTS disbursements_submitted_by_user_fkey;

ALTER TABLE disbursements
ADD CONSTRAINT disbursements_submitted_by_user_fkey 
FOREIGN KEY (submitted_by_user_id) 
REFERENCES users(user_id) 
ON DELETE SET NULL;

-- Link disbursements to chart of accounts
ALTER TABLE disbursements
DROP CONSTRAINT IF EXISTS disbursements_chart_account_fkey;

ALTER TABLE disbursements
ADD CONSTRAINT disbursements_chart_account_fkey 
FOREIGN KEY (chart_account_id) 
REFERENCES charts_of_account(account_id) 
ON DELETE SET NULL;

-- =====================================================
-- STEP 3: Add Indexes for Better Performance
-- =====================================================
-- Indexes make searching and joining tables much faster

-- Index on disbursements for user lookups
CREATE INDEX IF NOT EXISTS idx_disbursements_created_by_user 
ON disbursements(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_disbursements_submitted_by_user 
ON disbursements(submitted_by_user_id);

-- Index on disbursements for account lookups
CREATE INDEX IF NOT EXISTS idx_disbursements_chart_account 
ON disbursements(chart_account_id);

-- Index on disbursements for payee lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_disbursements_payee 
ON disbursements(payee_id);

-- Index on disbursements for status filtering
CREATE INDEX IF NOT EXISTS idx_disbursements_status 
ON disbursements(status);

-- Index on disbursements for date range queries
CREATE INDEX IF NOT EXISTS idx_disbursements_date 
ON disbursements(date);

-- Index on payees for name searches
CREATE INDEX IF NOT EXISTS idx_payees_name 
ON payees(name);

-- Index on users for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- =====================================================
-- STEP 4: Add Helpful Database Views (Optional)
-- =====================================================
-- Views make complex queries easier - like pre-built reports

-- View: Complete disbursement information with all related data
CREATE OR REPLACE VIEW disbursements_full_view AS
SELECT 
  d.id,
  d.reference,
  d.name AS payee_name,
  d.amount,
  d.method,
  d.status,
  d.date,
  d.reason,
  d.contact,
  d.account_number,
  d.manual_account_number,
  -- Payee information
  p.tin AS payee_tin,
  p.address AS payee_address,
  p.account AS payee_account,
  -- User who created
  d.created_by AS created_by_username,
  u1.first_name || ' ' || u1.last_name AS created_by_fullname,
  u1.email AS created_by_email,
  -- User who submitted
  d.submitted_by AS submitted_by_username,
  u2.first_name || ' ' || u2.last_name AS submitted_by_fullname,
  u2.email AS submitted_by_email,
  -- Chart of account information
  c.account_name,
  c.account_number AS chart_account_number,
  c.section AS account_section,
  -- Timestamps
  d.created_at,
  d.updated_at
FROM disbursements d
LEFT JOIN payees p ON d.payee_id = p.id
LEFT JOIN users u1 ON d.created_by_user_id = u1.user_id
LEFT JOIN users u2 ON d.submitted_by_user_id = u2.user_id
LEFT JOIN charts_of_account c ON d.chart_account_id = c.account_id;

-- View: User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.user_id,
  u.first_name || ' ' || u.last_name AS full_name,
  u.email,
  u.role,
  COUNT(DISTINCT d.id) AS total_disbursements_created,
  COALESCE(SUM(d.amount), 0) AS total_amount_disbursed,
  COUNT(DISTINCT CASE WHEN d.status = 'Pending' THEN d.id END) AS pending_count,
  COUNT(DISTINCT CASE WHEN d.status = 'Approved' THEN d.id END) AS approved_count,
  COUNT(DISTINCT CASE WHEN d.status = 'Failed' THEN d.id END) AS failed_count,
  MAX(d.created_at) AS last_disbursement_date
FROM users u
LEFT JOIN disbursements d ON d.created_by_user_id = u.user_id
GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.role;

-- View: Payee summary
CREATE OR REPLACE VIEW payee_summary AS
SELECT 
  p.id,
  p.name,
  p.contact,
  p.tin,
  p.address,
  COUNT(d.id) AS total_disbursements,
  COALESCE(SUM(d.amount), 0) AS total_amount_received,
  COUNT(CASE WHEN d.status = 'Pending' THEN 1 END) AS pending_disbursements,
  COUNT(CASE WHEN d.status = 'Approved' THEN 1 END) AS approved_disbursements,
  MAX(d.date) AS last_disbursement_date
FROM payees p
LEFT JOIN disbursements d ON d.payee_id = p.id
GROUP BY p.id, p.name, p.contact, p.tin, p.address;

-- =====================================================
-- STEP 5: Create Update Trigger for Timestamps
-- =====================================================
-- Automatically update 'updated_at' whenever a row changes

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payees_updated_at ON payees;
CREATE TRIGGER update_payees_updated_at
  BEFORE UPDATE ON payees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_disbursements_updated_at ON disbursements;
CREATE TRIGGER update_disbursements_updated_at
  BEFORE UPDATE ON disbursements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_charts_of_account_updated_at ON charts_of_account;
CREATE TRIGGER update_charts_of_account_updated_at
  BEFORE UPDATE ON charts_of_account
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: Add Helpful Comments to Tables
-- =====================================================
-- Documentation right in the database

COMMENT ON TABLE users IS 'User accounts with authentication and role-based access';
COMMENT ON TABLE payees IS 'Companies or individuals who receive disbursements';
COMMENT ON TABLE disbursements IS 'Payment requests with approval workflow';
COMMENT ON TABLE charts_of_account IS 'Accounting chart of accounts for categorization';
COMMENT ON TABLE stats IS 'Daily statistics and counters';
COMMENT ON TABLE recent_activity IS 'Activity log for dashboard display';

-- Column comments
COMMENT ON COLUMN disbursements.created_by_user_id IS 'Foreign key to users table - who created this disbursement';
COMMENT ON COLUMN disbursements.submitted_by_user_id IS 'Foreign key to users table - who submitted this disbursement';
COMMENT ON COLUMN disbursements.chart_account_id IS 'Foreign key to charts_of_account - accounting category';
COMMENT ON COLUMN disbursements.payee_id IS 'Foreign key to payees table - who receives the payment';

-- =====================================================
-- STEP 7: Refresh Schema Cache
-- =====================================================
-- Tell Supabase/PostgREST to reload the schema

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- ✅ MIGRATION COMPLETE!
-- =====================================================
-- Your database now has proper relationships between tables.
-- The website will continue working as before.
--
-- NEXT STEPS (Optional - for future development):
-- 1. Update your website code to use the new UUID columns
-- 2. Migrate existing text data to the new foreign key columns
-- 3. Eventually remove the old text columns (created_by, submitted_by)
--
-- TO CHECK IF IT WORKED:
-- Run these queries in your Supabase SQL Editor:
--
-- 1. Check foreign keys:
--    SELECT * FROM information_schema.table_constraints 
--    WHERE constraint_type = 'FOREIGN KEY' 
--    AND table_name IN ('disbursements', 'payees', 'users');
--
-- 2. Check indexes:
--    SELECT * FROM pg_indexes 
--    WHERE tablename IN ('disbursements', 'payees', 'users', 'charts_of_account');
--
-- 3. Test the views:
--    SELECT * FROM disbursements_full_view LIMIT 5;
--    SELECT * FROM user_activity_summary;
--    SELECT * FROM payee_summary;
--
-- =====================================================
