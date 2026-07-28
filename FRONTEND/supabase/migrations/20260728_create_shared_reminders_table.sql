-- Phase 6: Shared Reminders table (enables Phase 7 reminders feature)
-- INFRA-03, D-14

CREATE TABLE shared_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reminder_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_reminders ENABLE ROW LEVEL SECURITY;

-- Pair members can view shared reminders (D-12: trust-based, full visibility)
CREATE POLICY "Pair members can view shared reminders" ON shared_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = shared_reminders.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Pair members can insert shared reminders
CREATE POLICY "Pair members can insert shared reminders" ON shared_reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = shared_reminders.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Pair members can update shared reminders
CREATE POLICY "Pair members can update shared reminders" ON shared_reminders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = shared_reminders.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Pair members can delete shared reminders
CREATE POLICY "Pair members can delete shared reminders" ON shared_reminders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = shared_reminders.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );
