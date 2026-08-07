-- Create bug_reports table for user bug submissions
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pair_id UUID REFERENCES pairs(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bug reports
CREATE POLICY "Users can insert own bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own bug reports
CREATE POLICY "Users can read own bug reports"
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);
