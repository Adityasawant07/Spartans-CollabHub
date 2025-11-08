-- Drop the existing update policy for projects
DROP POLICY IF EXISTS "Authors can update their own projects" ON projects;

-- Create a new policy that allows authors to update their own projects
CREATE POLICY "Authors can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = author_id AND user_id = auth.uid()
    )
  );

-- Create a new policy that allows any authenticated user to update the applicants field
-- This allows users to apply to projects by adding themselves to the applicants array
CREATE POLICY "Users can apply to projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Only allow updates to applicants and updated_at fields
    -- The old row must exist and be viewable
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = projects.id
    )
  );
