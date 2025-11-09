-- This script cleans up test data but keeps events
-- Delete all messages
DELETE FROM messages;

-- Delete all community messages
DELETE FROM community_messages;

-- Delete all group messages and group chats
DELETE FROM group_messages;
DELETE FROM group_chats;

-- Delete all projects (tasks)
DELETE FROM projects;

-- Keep events intact - do NOT delete
-- SELECT COUNT(*) FROM events; -- Check that events remain
