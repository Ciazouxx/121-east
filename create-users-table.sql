-- SQL script to create the 'users' table for user accounts with roles
-- Only one admin account should exist, all others are default users

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table to store user information with roles
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'cashier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Insert the default admin user (change password as needed)
INSERT INTO users (first_name, last_name, email, password, role)
VALUES ('Admin', 'User', 'admin@example.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
