-- Server-side push notification trigger for chat messages
-- Replaces client-side Realtime listener which fails on mobile background
-- Uses pg_net to call send-chat-push edge function (no vault dependency)

-- 1. Function that triggers push via pg_net
CREATE OR REPLACE FUNCTION public.send_chat_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_message_text TEXT;
BEGIN
  -- Get recipient (the partner, not the sender)
  SELECT
    CASE
      WHEN p.user_one = NEW.sender_id THEN p.user_two
      ELSE p.user_one
    END INTO v_recipient_id
  FROM pairs p
  WHERE p.id = NEW.pair_id AND p.code_used = TRUE;

  IF v_recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender's display name
  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  v_sender_name := COALESCE(v_sender_name, 'Partner');

  -- Get message text (truncated to 50 chars)
  v_message_text := LEFT(COALESCE(NEW.content, 'New message'), 50);

  -- Call send-chat-push edge function via pg_net
  PERFORM net.http_post(
    url := 'https://mjoczzhxaqhkkmujchzm.supabase.co/functions/v1/send-chat-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb2N6emh4YXFoa2ttdWpjaHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MzIzMTcsImV4cCI6MjEwMDUwODMxN30.1OepFffbOScPL5E_f6yiS64SSSPigBQNQFJKYuc5-H0'
    ),
    body := jsonb_build_object(
      'recipient_id', v_recipient_id,
      'sender_name', v_sender_name,
      'message_text', v_message_text
    )
  );

  RETURN NEW;
END;
$$;

-- 2. Create trigger on messages table
DROP TRIGGER IF EXISTS on_message_send_push ON messages;
CREATE TRIGGER on_message_send_push
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_chat_push_notification();
