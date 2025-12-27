-- Migration: Add auth_user_id and household_income_value columns to user_profiles
-- Run this SQL in your Supabase SQL Editor

-- Add auth_user_id column to link profiles to Supabase Auth users
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add numeric household_income_value for matching calculations
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS household_income_value REAL;

-- Create index on auth_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- Add unique constraint to ensure one profile per auth user
ALTER TABLE user_profiles 
ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);

-- Update existing rows: Convert bracket labels to RM values
UPDATE user_profiles 
SET household_income_value = CASE 
    WHEN household_income = 'B40' THEN 5250
    WHEN household_income = 'M40' THEN 10959
    WHEN household_income = 'T20' THEN 50000
    ELSE NULL
END
WHERE household_income_value IS NULL;

-- Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- RLS Policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

-- RLS Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- RLS Policy: Users can only delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE
    USING (auth.uid() = auth_user_id);

-- RLS Policy: Service role can access all profiles (for admin operations)
CREATE POLICY "Service role full access" ON user_profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Note: After running this migration, you need to:
-- 1. Enable Email/Password authentication in Supabase Dashboard > Authentication > Providers
-- 2. Update your frontend to use Supabase Auth client for signup/login
-- 3. Update backend endpoints to validate JWT tokens and extract auth_user_id
