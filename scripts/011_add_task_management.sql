-- Add new columns to projects table for task management
ALTER TABLE projects ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 5;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS accepted_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create applications table for separate application tracking
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_task_id ON applications(task_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON projects(difficulty);

-- Enable RLS on applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Anyone can view applications"
  ON applications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = applicant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Task creators and applicants can update applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      JOIN projects p ON p.author_id = sp.id
      WHERE sp.user_id = auth.uid() AND p.id = task_id
    )
    OR
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = applicant_id AND user_id = auth.uid()
    )
  );
