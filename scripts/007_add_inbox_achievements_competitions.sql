-- Add achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  image_url text,
  created_at timestamp DEFAULT now()
);

-- Add projects table for user portfolio
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  banner_url text,
  link text,
  created_at timestamp DEFAULT now()
);

-- Add competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  banner_url text,
  organizer_id uuid REFERENCES student_profiles(id),
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL USING (auth.uid() IN (SELECT user_id FROM student_profiles WHERE id = user_achievements.user_id));

-- RLS Policies for user projects
CREATE POLICY "Anyone can view user projects" ON user_projects FOR SELECT USING (true);
CREATE POLICY "Users can manage own projects" ON user_projects FOR ALL USING (auth.uid() IN (SELECT user_id FROM student_profiles WHERE id = user_projects.user_id));

-- RLS Policies for competitions
CREATE POLICY "Anyone can view competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Organizers can manage competitions" ON competitions FOR ALL USING (auth.uid() IN (SELECT user_id FROM student_profiles WHERE id = competitions.organizer_id));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);
