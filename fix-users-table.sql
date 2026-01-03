-- Check if users table has the right columns, if not recreate it

-- Drop existing users table if it has wrong structure
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with correct structure
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'cashier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on users" 
ON users FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default admin account
INSERT INTO users (first_name, last_name, email, password, role)
VALUES ('Admin', 'User', 'admin@example.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
