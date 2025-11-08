-- Add institute_ids table for organizer verification
CREATE TABLE IF NOT EXISTS institute_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_name text NOT NULL,
  institute_code text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Add some example institute codes
INSERT INTO institute_ids (institute_name, institute_code) VALUES
  ('Goa College of Engineering', 'GCE2024'),
  ('IIT Bombay', 'IITB2024'),
  ('NIT Goa', 'NITGOA2024')
ON CONFLICT (institute_code) DO NOTHING;

-- Add function to auto-delete old messages (24 hours)
CREATE OR REPLACE FUNCTION delete_old_messages() RETURNS void AS $$
BEGIN
  -- Delete community messages older than 24 hours
  DELETE FROM community_messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete direct messages older than 24 hours
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on institute_ids
ALTER TABLE institute_ids ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read institute codes (for verification)
CREATE POLICY "Anyone can view institute codes"
  ON institute_ids FOR SELECT
  USING (true);
