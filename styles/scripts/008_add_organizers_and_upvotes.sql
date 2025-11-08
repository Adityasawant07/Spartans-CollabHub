-- Add organizers table for institutes
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_name text NOT NULL,
  institute_code text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Add competition upvotes tracking
CREATE TABLE IF NOT EXISTS competition_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

-- Add upvotes column to competitions
ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS upvotes int DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies for organizers
CREATE POLICY "Organizers can view their own data"
  ON organizers FOR SELECT
  USING (true);

-- Policies for competition upvotes
CREATE POLICY "Users can view all upvotes"
  ON competition_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own upvotes"
  ON competition_upvotes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own upvotes"
  ON competition_upvotes FOR DELETE
  USING (true);
