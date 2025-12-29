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

-- Atomic reference generator RPC (returns reference and the new counter)
CREATE OR REPLACE FUNCTION public.get_next_reference(_date date)
RETURNS TABLE(reference text, ref_counter integer) LANGUAGE plpgsql AS $$
DECLARE
  n integer;
  ref_text text;
BEGIN
  -- Try to update an existing row first; if none exists, insert one.
  LOOP
    -- Attempt to increment existing row
    UPDATE public.stats
    SET ref_counter = ref_counter + 1
    WHERE date = _date
    RETURNING ref_counter INTO n;

    IF FOUND THEN
      ref_text := format('DISB-%s-%s', to_char(_date, 'YYYYMMDD'), lpad(n::text,5,'0'));
      RAISE NOTICE 'get_next_reference: updated existing row. ref=% n=%', ref_text, n;
      RETURN NEXT ref_text, n;
      RETURN;
    END IF;

    -- No existing row: try to insert. Handle concurrent inserts via unique_violation.
    BEGIN
      INSERT INTO public.stats(date, ref_counter, total_requested) VALUES (_date, 1, 0);
      n := 1;
      ref_text := format('DISB-%s-%s', to_char(_date, 'YYYYMMDD'), lpad(n::text,5,'0'));
      RAISE NOTICE 'get_next_reference: inserted new row. ref=% n=%', ref_text, n;
      RETURN NEXT ref_text, n;
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      -- Another session inserted the row concurrently; loop and try update again
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- NOTE: Run the function in Supabase SQL editor to register the RPC. You can call it from the client as:
--   const { data, error } = await supabase.rpc('get_next_reference', { _date: '2025-12-29' })
-- and it will return an array like [{ reference: 'DISB-20251229-00001', ref_counter: 1 }]

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

-- Additional defaults from src/chartOfAccounts.js (Expense accounts)
INSERT INTO charts_of_account (account_number, account_name, section, description, balance) VALUES
(501, 'Amortization expense', 'Expenses', 'Amortization expense', 0),
(502, 'Depletion expense', 'Expenses', 'Depletion expense', 0),
(503, 'Depreciation expense-Automobiles', 'Expenses', 'Depreciation expense-Automobiles', 0),
(504, 'Depreciation expense-Building', 'Expenses', 'Depreciation expense-Building', 0),
(505, 'Depreciation expense-Furniture', 'Expenses', 'Depreciation expense-Furniture', 0),
(506, 'Depreciation expense-Land improvements', 'Expenses', 'Depreciation expense-Land improvements', 0),
(507, 'Depreciation expense-Library', 'Expenses', 'Depreciation expense-Library', 0),
(508, 'Depreciation expense-Machinery', 'Expenses', 'Depreciation expense-Machinery', 0),
(509, 'Depreciation expense-Mineral deposit', 'Expenses', 'Depreciation expense-Mineral deposit', 0),
(510, 'Depreciation expense-Office equipment', 'Expenses', 'Depreciation expense-Office equipment', 0),
(511, 'Depreciation expense-Trucks', 'Expenses', 'Depreciation expense-Trucks', 0),
(520, 'Office salaries expense', 'Expenses', 'Office salaries expense', 0),
(521, 'Sales salaries expense', 'Expenses', 'Sales salaries expense', 0),
(522, 'Salaries expense', 'Expenses', 'Salaries expense', 0),
(523, '"Blank" wages expense', 'Expenses', '"Blank" wages expense', 0),
(524, 'Employees'' benefits expense', 'Expenses', 'Employees'' benefits expense', 0),
(525, 'Payroll taxes expense', 'Expenses', 'Payroll taxes expense', 0),
(530, 'Cash over and Short', 'Expenses', 'Cash over and Short', 0),
(531, 'Discounts lost', 'Expenses', 'Discounts lost', 0),
(532, 'Factoring fee expense', 'Expenses', 'Factoring fee expense', 0),
(533, 'Interest expense', 'Expenses', 'Interest expense', 0),
(535, 'Insurance expense-Delivery equipment', 'Expenses', 'Insurance expense-Delivery equipment', 0),
(536, 'Insurance expense-Office equipment', 'Expenses', 'Insurance expense-Office equipment', 0),
(540, 'Rent expense', 'Expenses', 'Rent expense', 0),
(541, 'Rent expense-Office space', 'Expenses', 'Rent expense-Office space', 0),
(542, 'Rent expense-Selling space', 'Expenses', 'Rent expense-Selling space', 0),
(543, 'Press rental expense', 'Expenses', 'Press rental expense', 0),
(544, 'Truck rental expense', 'Expenses', 'Truck rental expense', 0),
(545, '"Blank" rental expense', 'Expenses', '"Blank" rental expense', 0),
(550, 'Office supplies expense', 'Expenses', 'Office supplies expense', 0),
(551, 'Store supplies expense', 'Expenses', 'Store supplies expense', 0),
(552, '"Blank" supplies expense', 'Expenses', '"Blank" supplies expense', 0),
(555, 'Advertising expense', 'Expenses', 'Advertising expense', 0),
(556, 'Bad debts expense', 'Expenses', 'Bad debts expense', 0),
(557, 'Blueprinting expense', 'Expenses', 'Blueprinting expense', 0),
(558, 'Boat expense', 'Expenses', 'Boat expense', 0),
(559, 'Collection expense', 'Expenses', 'Collection expense', 0),
(561, 'Concessions expense', 'Expenses', 'Concessions expense', 0),
(562, 'Credit card expense', 'Expenses', 'Credit card expense', 0),
(563, 'Delivery expense', 'Expenses', 'Delivery expense', 0),
(564, 'Dumping expense', 'Expenses', 'Dumping expense', 0),
(566, 'Equipment expense', 'Expenses', 'Equipment expense', 0),
(567, 'Food and drinks expense', 'Expenses', 'Food and drinks expense', 0),
(568, 'Gas and oil expense', 'Expenses', 'Gas and oil expense', 0),
(571, 'General and administrative expense', 'Expenses', 'General and administrative expense', 0),
(572, 'Janitorial expense', 'Expenses', 'Janitorial expense', 0),
(573, 'Legal fees expense', 'Expenses', 'Legal fees expense', 0),
(574, 'Mileage expense', 'Expenses', 'Mileage expense', 0),
(576, 'Miscellaneous expense', 'Expenses', 'Miscellaneous expense', 0),
(577, 'Mower and tool expense', 'Expenses', 'Mower and tool expense', 0),
(578, 'Operating expense', 'Expenses', 'Operating expense', 0),
(579, 'Organization expense', 'Expenses', 'Organization expense', 0),
(580, 'Permits expense', 'Expenses', 'Permits expense', 0),
(581, 'Postage expense', 'Expenses', 'Postage expense', 0),
(582, 'Property taxes expense', 'Expenses', 'Property taxes expense', 0),
(583, 'Repairs expense', 'Expenses', 'Repairs expense', 0),
(584, 'Selling expense', 'Expenses', 'Selling expense', 0),
(585, 'Telephone expense', 'Expenses', 'Telephone expense', 0),
(587, 'Travel and entertainment expense', 'Expenses', 'Travel and entertainment expense', 0),
(590, 'Utilities expense', 'Expenses', 'Utilities expense', 0),
(591, 'Warranty expense', 'Expenses', 'Warranty expense', 0),
(595, 'Income taxes expense', 'Expenses', 'Income taxes expense', 0)
ON CONFLICT DO NOTHING;

-- Insert default admin (you can modify this)
INSERT INTO admin (admin_fname, admin_lname, email) VALUES
('Admin', 'User', 'admin@example.com')
ON CONFLICT DO NOTHING;

-- Insert default cashier (you can modify this)
INSERT INTO cashier (cashier_fname, cashier_lname, email) VALUES
('Cashier', 'User', 'cashier@example.com')
ON CONFLICT DO NOTHING;
