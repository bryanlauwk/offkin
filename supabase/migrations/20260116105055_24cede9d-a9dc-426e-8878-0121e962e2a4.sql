-- Create table for storing quiz responses
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 7),
  choice TEXT NOT NULL CHECK (choice IN ('now', 'later')),
  session_id UUID NOT NULL,
  wait_time_seconds INTEGER, -- For level 7, how long they waited
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster aggregation queries
CREATE INDEX idx_quiz_responses_level_choice ON public.quiz_responses(level, choice);
CREATE INDEX idx_quiz_responses_session ON public.quiz_responses(session_id);

-- Enable Row Level Security
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert responses (anonymous quiz)
CREATE POLICY "Anyone can submit responses"
ON public.quiz_responses
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read aggregate data (for stats display)
CREATE POLICY "Anyone can read responses for stats"
ON public.quiz_responses
FOR SELECT
USING (true);

-- Enable realtime for live stats updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;