-- Create users table (handled by Supabase Auth)
-- auth.users is automatically created by Supabase

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  college TEXT,
  branch TEXT,
  year INTEGER,
  skills TEXT[],
  interests TEXT[],
  bio TEXT,
  github TEXT,
  linkedin TEXT,
  portfolio TEXT,
  past_projects JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  privacy_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[],
  required_skills TEXT[],
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'In Progress')),
  author_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  team JSONB DEFAULT '[]'::jsonb,
  applicants JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_skills ON student_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_student_profiles_interests ON student_profiles USING GIN(interests);

CREATE INDEX IF NOT EXISTS idx_projects_author_id ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_required_skills ON projects USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Enable Row Level Security
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "Users can view all profiles"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = author_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = author_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = author_id AND user_id = auth.uid()
    )
  );
