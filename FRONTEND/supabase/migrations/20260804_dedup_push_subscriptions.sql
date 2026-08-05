-- Deduplicate push_subscriptions: keep only the most recent per user
-- and add a unique constraint to prevent future duplicates.

-- 1. Remove stale subscriptions (keep the latest per user_id)
DELETE FROM push_subscriptions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM push_subscriptions
  ORDER BY user_id, created_at DESC
);

-- 2. Add unique constraint on user_id (one active push subscription per user)
ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_unique UNIQUE (user_id);
