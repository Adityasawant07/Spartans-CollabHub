-- Add banner_url field to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT;
