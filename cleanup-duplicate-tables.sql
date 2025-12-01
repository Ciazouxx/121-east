-- Cleanup Script: Remove Duplicate/Unused Tables
-- Since you're using the OLD schema (payees, disbursements)
-- We'll remove the NEW normalized tables that aren't being used

-- WARNING: This will DELETE data in these tables!
-- Make sure you don't need any data from these tables before running
-- BACKUP YOUR DATA FIRST if needed!

-- ============================================
-- TABLES TO KEEP (Currently in use):
-- ============================================
-- ✅ payees - Used for vendor/payee information
-- ✅ disbursements - Used for payment requests
-- ✅ chart_of_accounts - Old COA table (if exists)
-- ✅ charts_of_account - New COA table (used in approveDisbursement)
-- ✅ recent_activity - Activity logs
-- ✅ stats - Daily statistics

-- ============================================
-- TABLES TO REMOVE (Not being used):
-- ============================================
-- ❌ vendor - Duplicate of payees (new normalized version)
-- ❌ request_payment - Duplicate of disbursements (new normalized version)
-- ❌ payment - Not used (new schema)
-- ❌ approval_workflow - Not used (new schema)
-- ❌ disbursement - Not used (new schema, singular)
-- ❌ report - Not used (new schema)
-- ❌ admin - Not used (new schema)
-- ❌ cashier - Not used (new schema)

-- Drop unused normalized tables
DROP TABLE IF EXISTS vendor CASCADE;
DROP TABLE IF EXISTS request_payment CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS approval_workflow CASCADE;
DROP TABLE IF EXISTS disbursement CASCADE;
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS cashier CASCADE;

-- Drop old chart_of_accounts (not being used - code uses charts_of_account)
DROP TABLE IF EXISTS chart_of_accounts CASCADE;

-- After cleanup, you should have:
-- ✅ payees
-- ✅ disbursements
-- ✅ charts_of_account (or chart_of_accounts - whichever you're using)
-- ✅ recent_activity
-- ✅ stats
