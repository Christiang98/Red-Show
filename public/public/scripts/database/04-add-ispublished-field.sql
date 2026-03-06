-- Migration: Add isPublished field to owner_profiles and artist_profiles
-- This allows users to control whether their profile appears in public searches

-- Add isPublished to owner_profiles
ALTER TABLE owner_profiles ADD COLUMN is_published BOOLEAN DEFAULT 0;

-- Add isPublished to artist_profiles  
ALTER TABLE artist_profiles ADD COLUMN is_published BOOLEAN DEFAULT 0;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_owner_profiles_published ON owner_profiles(is_published);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_published ON artist_profiles(is_published);

-- Log completion
SELECT 'Migration 04: isPublished fields added successfully' AS status;
