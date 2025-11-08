-- Add institute_id field to organizers table
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS institute_id text NOT NULL DEFAULT 'INST001';

-- Update competitions table to be events table structure
-- Add institute_id, timing, event_url, contact fields
ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS institute_id text,
ADD COLUMN IF NOT EXISTS timing text,
ADD COLUMN IF NOT EXISTS event_url text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_number text,
ADD COLUMN IF NOT EXISTS info_file_url text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Rename end_date to maintain consistency
-- (already exists, just ensure it's there)

-- Create index on institute_id for faster queries
CREATE INDEX IF NOT EXISTS idx_competitions_institute_id ON competitions(institute_id);
CREATE INDEX IF NOT EXISTS idx_organizers_institute_id ON organizers(institute_id);

-- Update existing records to have institute_id from their organizer
UPDATE competitions c
SET institute_id = o.institute_id
FROM organizers o
WHERE c.organizer_id IN (SELECT id FROM student_profiles sp WHERE sp.user_id = o.id::uuid)
AND c.institute_id IS NULL;
