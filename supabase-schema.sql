-- Supabase Database Schema for IMProject - Normalized with Proper Relationships
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS approval_workflow CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS request_payment CASCADE;
DROP TABLE IF EXISTS disbursement CASCADE;
DROP TABLE IF EXISTS charts_of_account CASCADE;
DROP TABLE IF EXISTS vendor CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS cashier CASCADE;
DROP TABLE IF EXISTS recent_activity CASCADE;
DROP TABLE IF EXISTS stats CASCADE;

-- 1. Vendor table (maps to payees)
CREATE TABLE vendor (
  vendor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_fname TEXT NOT NULL,
  vendor_lname TEXT NOT NULL,
  contact TEXT,
  tin TEXT,
  address TEXT,
  contact_person TEXT,
  account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_fname, vendor_lname)
);

-- 2. Admin table
CREATE TABLE admin (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_fname TEXT NOT NULL,
  admin_lname TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cashier table
CREATE TABLE cashier (
  cashier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_fname TEXT NOT NULL,
  cashier_lname TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Charts of Account table
CREATE TABLE charts_of_account (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number INTEGER NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('Assets', 'Liabilities', 'Revenues', 'Expenses')),
  description TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Request Payment table (payment requests - pending disbursements)
CREATE TABLE request_payment (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendor(vendor_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  description TEXT,
  reason TEXT,
  due_date DATE,
  project TEXT,
  payment_amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL,
  account_number TEXT,
  manual_account_number TEXT,
  contact TEXT,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Approval Workflow table (tracks approvals for payment requests)
CREATE TABLE approval_workflow (
  approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES request_payment(request_id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admin(admin_id) ON DELETE CASCADE,
  approval_status TEXT NOT NULL DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payment table (approved payments)
CREATE TABLE payment (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_date DATE NOT NULL,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  cashier_id UUID NOT NULL REFERENCES cashier(cashier_id) ON DELETE CASCADE,
  description TEXT,
  vendor_id UUID NOT NULL REFERENCES vendor(vendor_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  request_id UUID REFERENCES request_payment(request_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Disbursement table (links to chart of accounts)
CREATE TABLE disbursement (
  disbursement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disbursement_date DATE NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  modeOfPayment TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES charts_of_account(account_id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payment(payment_id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor(vendor_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Report table
CREATE TABLE report (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disbursement_id UUID NOT NULL REFERENCES disbursement(disbursement_id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  description TEXT,
  cashier_id UUID NOT NULL REFERENCES cashier(cashier_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Recent Activity table (for activity logs)
CREATE TABLE recent_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Stats table (for storing daily stats)
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_disbursed_today DECIMAL(10, 2) DEFAULT 0,
  pending_disbursements INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  total_requested INTEGER DEFAULT 0,
  ref_counter INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_request_payment_vendor ON request_payment(vendor_id);
CREATE INDEX IF NOT EXISTS idx_request_payment_status ON request_payment(status);
CREATE INDEX IF NOT EXISTS idx_request_payment_date ON request_payment(date);
CREATE INDEX IF NOT EXISTS idx_approval_workflow_request ON approval_workflow(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflow_admin ON approval_workflow(admin_id);
CREATE INDEX IF NOT EXISTS idx_payment_vendor ON payment(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payment_cashier ON payment(cashier_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment(payment_date);
CREATE INDEX IF NOT EXISTS idx_disbursement_account ON disbursement(account_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_payment ON disbursement(payment_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_vendor ON disbursement(vendor_id);
CREATE INDEX IF NOT EXISTS idx_report_disbursement ON report(disbursement_id);
CREATE INDEX IF NOT EXISTS idx_report_cashier ON report(cashier_id);
CREATE INDEX IF NOT EXISTS idx_charts_of_account_number ON charts_of_account(account_number);
CREATE INDEX IF NOT EXISTS idx_charts_of_account_section ON charts_of_account(section);
CREATE INDEX IF NOT EXISTS idx_recent_activity_date ON recent_activity(date DESC);
CREATE INDEX IF NOT EXISTS idx_stats_date ON stats(date);

-- Enable Row Level Security (RLS)
ALTER TABLE vendor ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts_of_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursement ENABLE ROW LEVEL SECURITY;
ALTER TABLE report ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on vendor" ON vendor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on admin" ON admin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cashier" ON cashier FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on charts_of_account" ON charts_of_account FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on request_payment" ON request_payment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on approval_workflow" ON approval_workflow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on payment" ON payment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on disbursement" ON disbursement FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on report" ON report FOR ALL USING (true) WITH CHECK (true);
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
CREATE TRIGGER update_vendor_updated_at BEFORE UPDATE ON vendor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cashier_updated_at BEFORE UPDATE ON cashier
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charts_of_account_updated_at BEFORE UPDATE ON charts_of_account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_payment_updated_at BEFORE UPDATE ON request_payment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflow_updated_at BEFORE UPDATE ON approval_workflow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON payment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disbursement_updated_at BEFORE UPDATE ON disbursement
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_updated_at BEFORE UPDATE ON report
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

-- Insert default admin (you can modify this)
INSERT INTO admin (admin_fname, admin_lname, email) VALUES
('Admin', 'User', 'admin@example.com')
ON CONFLICT DO NOTHING;

-- Insert default cashier (you can modify this)
INSERT INTO cashier (cashier_fname, cashier_lname, email) VALUES
('Cashier', 'User', 'cashier@example.com')
ON CONFLICT DO NOTHING;
