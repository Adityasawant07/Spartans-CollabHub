-- Function to safely increment competition upvotes
CREATE OR REPLACE FUNCTION increment_competition_upvotes(competition_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE competitions
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = competition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely decrement competition upvotes
CREATE OR REPLACE FUNCTION decrement_competition_upvotes(competition_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE competitions
  SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0)
  WHERE id = competition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
