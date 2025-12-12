-- Migration: Add missing fields to artist_profiles and owner_profiles
-- This ensures all form fields are properly stored in the database

-- Add missing fields to artist_profiles
ALTER TABLE artist_profiles ADD COLUMN stage_name VARCHAR(255);
ALTER TABLE artist_profiles ADD COLUMN other_category VARCHAR(255);
ALTER TABLE artist_profiles ADD COLUMN service_type VARCHAR(255);
ALTER TABLE artist_profiles ADD COLUMN price_range VARCHAR(100);
ALTER TABLE artist_profiles ADD COLUMN bio TEXT;
ALTER TABLE artist_profiles ADD COLUMN experience_years INTEGER DEFAULT 0;
ALTER TABLE artist_profiles ADD COLUMN neighborhood VARCHAR(255);
ALTER TABLE artist_profiles ADD COLUMN availability TEXT;

-- Add missing fields to owner_profiles
ALTER TABLE owner_profiles ADD COLUMN other_business_type VARCHAR(255);
ALTER TABLE owner_profiles ADD COLUMN city VARCHAR(255);
ALTER TABLE owner_profiles ADD COLUMN neighborhood VARCHAR(255);
ALTER TABLE owner_profiles ADD COLUMN business_hours_data TEXT;
ALTER TABLE owner_profiles ADD COLUMN services TEXT;

-- Log completion
SELECT 'Migration 05: Missing profile fields added successfully' AS status;
