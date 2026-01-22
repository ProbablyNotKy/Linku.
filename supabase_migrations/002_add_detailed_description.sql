-- Migration: Add detailed_description column to scholarships table
-- Run this SQL in your Supabase SQL Editor

-- Add detailed_description column for rich text/markdown content
ALTER TABLE scholarships 
ADD COLUMN IF NOT EXISTS detailed_description TEXT;

-- Add comment explaining the column purpose
COMMENT ON COLUMN scholarships.detailed_description IS 'Rich text/markdown description for detailed scholarship information';
