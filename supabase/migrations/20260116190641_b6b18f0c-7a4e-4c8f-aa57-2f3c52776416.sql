-- Drop the old constraint
ALTER TABLE quiz_responses DROP CONSTRAINT IF EXISTS quiz_responses_level_check;

-- Add new constraint allowing levels 1-11
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_level_check CHECK (level >= 1 AND level <= 11);