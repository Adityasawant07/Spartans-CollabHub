-- Create competitions table for events
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timing TEXT,
  event_url TEXT,
  contact_number TEXT,
  banner_url TEXT,
  info_file_url TEXT,
  institute_id TEXT,
  organizer_id TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_competitions_start_date ON competitions(start_date);
CREATE INDEX IF NOT EXISTS idx_competitions_end_date ON competitions(end_date);
CREATE INDEX IF NOT EXISTS idx_competitions_institute_id ON competitions(institute_id);

-- Enable Row Level Security
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitions
CREATE POLICY "Anyone can view competitions"
  ON competitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create competitions"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitions"
  ON competitions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete competitions"
  ON competitions FOR DELETE
  TO authenticated
  USING (true);
