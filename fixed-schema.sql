-- Fixed Supabase Database Schema for IMProject
-- This schema matches what your code expects: payees, disbursements, charts_of_account, etc.
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS recent_activity CASCADE;
DROP TABLE IF EXISTS stats CASCADE;
DROP TABLE IF EXISTS disbursements CASCADE;
DROP TABLE IF EXISTS payees CASCADE;
DROP TABLE IF EXISTS charts_of_account CASCADE;

-- 1. Payees table (vendor information)
CREATE TABLE payees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  contact TEXT,
  tin TEXT,
  address TEXT,
  contact_person TEXT,
  account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chart of Accounts table
CREATE TABLE charts_of_account (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('Assets', 'Liabilities', 'Revenues', 'Expenses')),
  payee_name TEXT,
  description TEXT,
  balance DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Disbursements table
CREATE TABLE disbursements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payee_id UUID REFERENCES payees(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  account_number TEXT,
  manual_account_number TEXT,
  contact TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recent Activity table (for activity logs)
CREATE TABLE recent_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Stats table (for storing daily stats)
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_disbursed_today DECIMAL(15, 2) DEFAULT 0,
  pending_disbursements INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  total_requested INTEGER DEFAULT 0,
  ref_counter INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payees_name ON payees(name);
CREATE INDEX IF NOT EXISTS idx_disbursements_payee ON disbursements(payee_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_date ON disbursements(date);
CREATE INDEX IF NOT EXISTS idx_disbursements_reference ON disbursements(reference);
CREATE INDEX IF NOT EXISTS idx_charts_of_account_number ON charts_of_account(account_number);
CREATE INDEX IF NOT EXISTS idx_charts_of_account_section ON charts_of_account(section);
CREATE INDEX IF NOT EXISTS idx_charts_of_account_payee ON charts_of_account(payee_name);
CREATE INDEX IF NOT EXISTS idx_recent_activity_date ON recent_activity(date DESC);
CREATE INDEX IF NOT EXISTS idx_stats_date ON stats(date);

-- Enable Row Level Security (RLS)
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts_of_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on payees" ON payees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on disbursements" ON disbursements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on charts_of_account" ON charts_of_account FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on recent_activity" ON recent_activity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stats" ON stats FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_payees_updated_at BEFORE UPDATE ON payees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disbursements_updated_at BEFORE UPDATE ON disbursements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charts_of_account_updated_at BEFORE UPDATE ON charts_of_account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default chart of accounts
INSERT INTO charts_of_account (account_number, account_name, section, description, balance) VALUES
(1001, 'Cash on Hand', 'Assets', 'Cash on Hand', 0),
(1002, 'Cash In Bank', 'Assets', 'Cash In Bank', 0),
(1003, 'Online Payment Account', 'Assets', 'Online Payment Account', 0),
(1004, 'Checks on Hand', 'Assets', 'Checks on Hand', 0),
(2001, 'Accounts Payable', 'Liabilities', 'Accounts Payable', 0),
(3001, 'Services', 'Revenues', 'Services', 0),
(4001, 'Materials', 'Expenses', 'Materials', 0),
(4002, 'Labor', 'Expenses', 'Labor', 0),
(4003, 'Rent', 'Expenses', 'Rent', 0),
(4004, 'Miscellaneous', 'Expenses', 'Miscellaneous', 0)
ON CONFLICT DO NOTHING;
