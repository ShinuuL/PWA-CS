-- SEC-01/02/08: pairing is a server-controlled, serialized state transition.
-- Direct DELETE remains available through the existing unlink policy.
BEGIN;
DROP POLICY IF EXISTS "Users can create invite codes" ON public.pairs;
DROP POLICY IF EXISTS "Users can update own pairs" ON public.pairs;
REVOKE INSERT, UPDATE ON public.pairs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_invite_code(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_code text; v_attempt integer;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  -- A shared transaction lock also closes cross-slot races (owner vs consumer).
  PERFORM pg_catalog.pg_advisory_xact_lock(20260908, 1);
  IF EXISTS (SELECT 1 FROM public.pairs WHERE
      (user_one = p_user_id OR user_two = p_user_id) AND code_used) THEN
    RAISE EXCEPTION 'Already paired. Unpair first.' USING ERRCODE = '23505';
  END IF;
  SELECT invite_code INTO v_code FROM public.pairs
    WHERE user_one = p_user_id AND NOT code_used;
  IF FOUND THEN RETURN v_code; END IF;
  FOR v_attempt IN 1..20 LOOP
    v_code := lpad(floor(random() * 1000000)::text, 6, '0');
    BEGIN
      INSERT INTO public.pairs(user_one, invite_code, code_used)
      VALUES (p_user_id, v_code, false);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- Retry a colliding six-digit code, with a bounded number of attempts.
    END;
  END LOOP;
  RAISE EXCEPTION 'Unable to allocate invite code';
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_invite_code(p_code text, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_pair public.pairs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(20260908, 1);
  SELECT * INTO v_pair FROM public.pairs
    WHERE invite_code = p_code AND NOT code_used AND user_two IS NULL
      AND user_one <> p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Invalid or expired code'); END IF;
  IF EXISTS (SELECT 1 FROM public.pairs WHERE code_used AND
      (user_one IN (p_user_id, v_pair.user_one) OR user_two IN (p_user_id, v_pair.user_one))) THEN
    RETURN json_build_object('error', 'Already paired. Unpair first.');
  END IF;
  -- Remove only the consumer's unused invite; never move existing pair history.
  DELETE FROM public.pairs WHERE user_one = p_user_id AND NOT code_used AND user_two IS NULL;
  UPDATE public.pairs SET user_two = p_user_id, code_used = true, paired_at = now()
    WHERE id = v_pair.id AND NOT code_used AND user_two IS NULL;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Invalid or expired code'); END IF;
  RETURN json_build_object('success', true, 'pair_id', v_pair.id);
END;
$$;
REVOKE ALL ON FUNCTION public.create_invite_code(uuid), public.consume_invite_code(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_invite_code(uuid), public.consume_invite_code(text, uuid) TO authenticated;

-- SEC-04: a subscription belongs to the caller, even when using upsert.
DROP POLICY IF EXISTS "Pair members can view push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Pair members can insert push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Pair members can delete push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscription" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.pairs p WHERE p.id = pair_id AND p.code_used
      AND (p.user_one = (SELECT auth.uid()) OR p.user_two = (SELECT auth.uid()))))
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.pairs p WHERE p.id = pair_id AND p.code_used
      AND (p.user_one = (SELECT auth.uid()) OR p.user_two = (SELECT auth.uid()))));

-- SEC-03: restrictive policy also prevents unrelated permissive policies from
-- granting access to these buckets. Compare UUID text: malformed paths never cast.
UPDATE storage.buckets SET public = false WHERE id IN ('chat-media', 'album-photos');
CREATE POLICY "Private couple media boundary" ON storage.objects
  AS RESTRICTIVE FOR ALL TO public
  USING (bucket_id NOT IN ('chat-media', 'album-photos') OR (
    auth.uid() IS NOT NULL AND name !~ '(^|/)\.{1,2}(/|$)' AND name !~ '//'
    AND EXISTS (SELECT 1 FROM public.pairs p
      WHERE p.id::text = (storage.foldername(name))[1] AND p.code_used
        AND (p.user_one = (SELECT auth.uid()) OR p.user_two = (SELECT auth.uid())))))
  WITH CHECK (bucket_id NOT IN ('chat-media', 'album-photos') OR (
    auth.uid() IS NOT NULL AND name !~ '(^|/)\.{1,2}(/|$)' AND name !~ '//'
    AND EXISTS (SELECT 1 FROM public.pairs p
      WHERE p.id::text = (storage.foldername(name))[1] AND p.code_used
        AND (p.user_one = (SELECT auth.uid()) OR p.user_two = (SELECT auth.uid())))));
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_pair_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() OR NOT EXISTS (
    SELECT 1 FROM public.pairs WHERE id = p_pair_id AND code_used
      AND (user_one = auth.uid() OR user_two = auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.messages SET read_at = now()
    WHERE pair_id = p_pair_id AND sender_id <> auth.uid() AND read_at IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_messages_read(uuid, uuid), public.get_random_album_photo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid, uuid), public.get_random_album_photo(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- SEC-06: provision Vault project_url and push_internal_secret before enabling
-- delivery; set the same secret as PUSH_INTERNAL_SECRET in both Edge Functions.
CREATE OR REPLACE FUNCTION public.send_chat_push_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_url text; v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'push_internal_secret';
  IF nullif(v_url, '') IS NULL OR nullif(v_secret, '') IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/send-chat-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
    body := jsonb_build_object('message_id', NEW.id));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.send_chat_push_notification() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.dispatch_due_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_url text; v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'push_internal_secret';
  IF nullif(v_url, '') IS NULL OR nullif(v_secret, '') IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shared_reminders
    WHERE reminder_at <= now() AND completed_at IS NULL AND status = 'pending') THEN RETURN; END IF;
  PERFORM net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
    body := jsonb_build_object('reminder_id', sr.id))
  FROM public.shared_reminders sr
  WHERE sr.reminder_at <= now() AND sr.completed_at IS NULL AND sr.status = 'pending';
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_due_reminders() FROM PUBLIC, anon, authenticated;
-- The legacy migration already creates this job. Remove it before replacing
-- its payload so applying this migration to an existing project is safe.
DO $$
BEGIN
  PERFORM cron.unschedule('send-due-reminders');
EXCEPTION WHEN OTHERS THEN
  -- Keep applying when the legacy job is absent (fresh/test databases).
  NULL;
END;
$$;
SELECT cron.schedule('send-due-reminders', '* * * * *', 'SELECT public.dispatch_due_reminders()');
COMMIT;
