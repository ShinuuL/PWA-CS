-- Phase 7: pg_cron job for sending due reminders
-- REMN-07, D-06, D-07

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create cron job that runs every minute to find and send due reminders
-- Uses EXISTS (not NOT EXISTS) to match reminders with active push subscriptions
SELECT cron.schedule(
  'send-due-reminders',        -- job name
  '* * * * *',                 -- every minute
  $$
    SELECT net.http_post(
      url := (SELECT vault.secret('project_url')) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT vault.secret('publishable_key'))
      ),
      body := jsonb_build_object(
        'reminder_id', sr.id,
        'pair_id', sr.pair_id,
        'title', sr.title,
        'created_by', sr.created_by
      )
    )
    FROM shared_reminders sr
    WHERE sr.reminder_at <= NOW()
      AND sr.completed_at IS NULL
      AND sr.status = 'pending'
      AND EXISTS (
        SELECT 1 FROM push_subscriptions ps
        WHERE ps.pair_id = sr.pair_id
      )
  $$
);
