-- Uses only bootstrap's net.http_post recorder; never makes an HTTP request.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('30000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000002');
INSERT INTO public.pairs(id,user_one,user_two,invite_code,code_used) VALUES
 ('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002','dispatch',true);
INSERT INTO public.messages(pair_id,sender_id,content) VALUES
 ('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','No secret yet');
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM net.test_requests) THEN
  RAISE EXCEPTION 'Missing internal secret must fail closed'; END IF;
END $$;
INSERT INTO vault.decrypted_secrets VALUES
 ('project_url','https://test.invalid'), ('push_internal_secret','test-internal-secret');
INSERT INTO public.messages(id,pair_id,sender_id,content) VALUES
 ('30000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000001','Text must not be sent in the trigger');
DO $$ BEGIN
 IF (SELECT count(*) FROM net.test_requests WHERE
   url = 'https://test.invalid/functions/v1/send-chat-push'
   AND headers->>'x-internal-secret' = 'test-internal-secret'
   AND NOT headers ? 'Authorization'
   AND body = '{"message_id":"30000000-0000-0000-0000-000000000004"}'::jsonb) <> 1 THEN
  RAISE EXCEPTION 'Chat trigger contract mismatch'; END IF;
END $$;
TRUNCATE net.test_requests;
INSERT INTO public.shared_reminders(id,pair_id,title,reminder_at,created_by,status) VALUES
 ('30000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000003','Due',now()-interval '1 minute','30000000-0000-0000-0000-000000000001','pending'),
 ('30000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000003','Future',now()+interval '1 day','30000000-0000-0000-0000-000000000001','pending'),
 ('30000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000003','Sent',now()-interval '1 day','30000000-0000-0000-0000-000000000001','sent');
SELECT public.dispatch_due_reminders();
DO $$ BEGIN
 IF (SELECT count(*) FROM net.test_requests) <> 1 OR NOT EXISTS (
  SELECT 1 FROM net.test_requests WHERE url = 'https://test.invalid/functions/v1/send-push-notification'
  AND headers->>'x-internal-secret' = 'test-internal-secret'
  AND body = '{"reminder_id":"30000000-0000-0000-0000-000000000005"}'::jsonb) THEN
  RAISE EXCEPTION 'Reminder dispatcher must send only the due record id'; END IF;
 IF NOT EXISTS (SELECT 1 FROM cron.test_jobs WHERE name = 'send-due-reminders'
   AND command = 'SELECT public.dispatch_due_reminders()') THEN
  RAISE EXCEPTION 'Cron contract mismatch'; END IF;
END $$;
ROLLBACK;
SELECT 'security_dispatch: all assertions passed' AS result;
