-- Create institute IDs table for verification
CREATE TABLE IF NOT EXISTS institute_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_name text NOT NULL,
  institute_code text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Update organizers table to reference institute_ids
ALTER TABLE organizers
DROP COLUMN IF EXISTS institute_name,
ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES institute_ids(id);

-- Insert some sample institute codes (for testing)
INSERT INTO institute_ids (institute_name, institute_code) VALUES
  ('MIT', 'MIT2025'),
  ('Stanford University', 'STAN2025'),
  ('Harvard University', 'HARV2025'),
  ('UC Berkeley', 'UCB2025')
ON CONFLICT (institute_code) DO NOTHING;

-- Enable RLS
ALTER TABLE institute_ids ENABLE ROW LEVEL SECURITY;

-- Policies for institute_ids (public read for verification)
CREATE POLICY "Anyone can view institute codes"
  ON institute_ids FOR SELECT
  USING (true);
