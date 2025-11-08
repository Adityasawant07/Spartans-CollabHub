-- Add phone number field to student_profiles
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add constraint to validate phone number format (10 digits)
ALTER TABLE student_profiles
ADD CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^[0-9]{10}$');

-- Create messages table for direct messaging
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE (id = sender_id OR id = recipient_id) AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = sender_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE id = recipient_id AND user_id = auth.uid()
    )
  );
