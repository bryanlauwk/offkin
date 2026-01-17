-- Add new columns for Prisoner's Dilemma mechanics
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS opponent_choice text;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS outcome text;

-- Drop old choice constraint 
ALTER TABLE quiz_responses DROP CONSTRAINT IF EXISTS quiz_responses_choice_check;

-- Add new constraint for cooperate/defect choices
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_choice_check 
  CHECK (choice IN ('cooperate', 'defect'));

-- Update level constraint for 10 levels
ALTER TABLE quiz_responses DROP CONSTRAINT IF EXISTS quiz_responses_level_check;
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_level_check 
  CHECK (level >= 1 AND level <= 10);