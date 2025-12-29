-- SQL script to create the 'admin' table for user accounts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the admin table to store user information
CREATE TABLE IF NOT EXISTS admin (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_fname TEXT NOT NULL,
  admin_lname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public access for registration.
-- For a real app, you'd want more restrictive policies.
CREATE POLICY "Allow public insert for registration" ON admin FOR INSERT WITH CHECK (true);

-- Allow users to read their own data (useful for 'forgot password' etc. later)
-- This requires auth.uid() which works with Supabase Auth. For now, we'll keep it simple.
-- CREATE POLICY "Allow individual read access" ON admin FOR SELECT USING (auth.uid() = admin_id);

-- For now, allow all operations to keep it simple during development.
-- You can replace the specific insert policy with this one if you prefer.
DROP POLICY IF EXISTS "Allow all operations on admin" ON admin;
CREATE POLICY "Allow all operations on admin" ON admin FOR ALL USING (true) WITH CHECK (true);