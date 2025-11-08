-- Add project_applications table for tracking applicants with approval status
CREATE TABLE IF NOT EXISTS project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, applicant_id)
);

-- Add badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  skill_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_badges table for tracking badges earned by users
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Add project_badges table for tracking badges earned through projects
CREATE TABLE IF NOT EXISTS project_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, badge_id)
);

-- Add skill_points column to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS skill_points INTEGER DEFAULT 0;

-- Add resources column to projects for storing project resources
ALTER TABLE projects ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;

-- Add category column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;

-- Insert default badges
INSERT INTO badges (name, description, icon, skill_points) VALUES
  ('Team Player', 'Collaborated on 5 projects', '👥', 10),
  ('Code Master', 'Completed 10 coding projects', '💻', 20),
  ('Quick Starter', 'Started first project within 24 hours', '🚀', 5),
  ('Mentor', 'Helped 3 team members', '🎓', 15),
  ('Innovator', 'Created unique project solution', '💡', 25)
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant_id ON project_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_project_badges_project_id ON project_badges(project_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_skill_points ON student_profiles(skill_points DESC);

-- Enable RLS
ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_applications
CREATE POLICY "Anyone can view applications"
  ON project_applications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own applications"
  ON project_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = applicant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update applications"
  ON project_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN student_profiles sp ON p.author_id = sp.id
      WHERE p.id = project_id AND sp.user_id = auth.uid()
    )
  );

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Anyone can view user badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can be awarded badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for project_badges
CREATE POLICY "Anyone can view project badges"
  ON project_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project owners can add badges"
  ON project_badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN student_profiles sp ON p.author_id = sp.id
      WHERE p.id = project_id AND sp.user_id = auth.uid()
    )
  );
