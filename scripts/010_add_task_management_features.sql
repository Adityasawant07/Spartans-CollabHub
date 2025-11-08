-- Add team_size, difficulty, accepted_count, and is_active fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS accepted_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for active tasks
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);

-- Create group_chats table for team communication
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  members UUID[] NOT NULL,
  created_by UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_chats_task_id ON group_chats(task_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_chat_id ON group_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- Enable RLS
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_chats
CREATE POLICY "Members can view their group chats"
  ON group_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = ANY(group_chats.members) AND user_id = auth.uid()
    )
  );

CREATE POLICY "Task creators can create group chats"
  ON group_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = created_by AND user_id = auth.uid()
    )
  );

-- RLS Policies for group_messages
CREATE POLICY "Members can view group messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN student_profiles sp ON sp.id = ANY(gc.members)
      WHERE gc.id = group_messages.group_chat_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN student_profiles sp ON sp.id = ANY(gc.members)
      WHERE gc.id = group_messages.group_chat_id AND sp.user_id = auth.uid() AND sp.id = sender_id
    )
  );
