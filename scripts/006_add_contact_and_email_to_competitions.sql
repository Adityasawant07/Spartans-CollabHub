-- Add contact_number and email columns to competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS contact_number TEXT;

ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Optional: Add comment to describe the columns
COMMENT ON COLUMN competitions.contact_number IS 'Contact number for the event organizer';
COMMENT ON COLUMN competitions.email IS 'Contact email for the event organizer';
