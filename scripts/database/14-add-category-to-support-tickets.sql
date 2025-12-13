-- Migration: Add category column to support_tickets and is_admin to users
-- This fixes the SQLITE_ERROR: table support_tickets has no column named category

-- Add category column to support_tickets if it doesn't exist
ALTER TABLE support_tickets ADD COLUMN category VARCHAR(100);

-- Add is_admin column to users if it doesn't exist
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;

-- Update admin user to have is_admin flag
UPDATE users SET is_admin = 1 WHERE email = 'cgarcia@pioix.edu.ar' OR role = 'admin';

-- Log completion
SELECT 'Migration 14: Added category column to support_tickets and is_admin to users' AS status;
