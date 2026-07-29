-- Phase 7: Add status column to shared_reminders + push_subscriptions table
-- REMN-07, D-05, D-07

-- 1. Add status column to shared_reminders (tracks push delivery state)
ALTER TABLE shared_reminders
ADD COLUMN status TEXT DEFAULT 'pending'
CHECK (status IN ('pending', 'sent', 'failed', 'pending_send'));

-- 2. Create push_subscriptions table (D-05)
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Pair members can view push subscriptions (SELECT)
CREATE POLICY "Pair members can view push subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = push_subscriptions.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Pair members can insert push subscriptions (INSERT)
CREATE POLICY "Pair members can insert push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = push_subscriptions.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Pair members can delete push subscriptions (DELETE) — needed for 410 cleanup
CREATE POLICY "Pair members can delete push subscriptions" ON push_subscriptions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = push_subscriptions.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- 3. Indexes
-- Index on push_subscriptions(endpoint) for lookup during 410 cleanup
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Index on shared_reminders(pair_id, status, reminder_at) for pg_cron query performance
CREATE INDEX idx_shared_reminders_pair_status_at ON shared_reminders(pair_id, status, reminder_at);
