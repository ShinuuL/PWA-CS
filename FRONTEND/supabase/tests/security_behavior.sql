-- Run with psql -v ON_ERROR_STOP=1 after migrations, as database owner.
-- No pgTAP dependency; every failed assertion aborts, fixtures always roll back.
BEGIN;
CREATE FUNCTION pg_temp.assert_true(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %', label; END IF; END;
$$;
CREATE FUNCTION pg_temp.denied(statement text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN insufficient_privilege THEN RETURN; END;
  RAISE EXCEPTION 'ASSERTION FAILED: operation was allowed: %', label;
END;
$$;
INSERT INTO auth.users(id) VALUES
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002'),
 ('10000000-0000-0000-0000-000000000003'),
 ('10000000-0000-0000-0000-000000000004');
SET LOCAL ROLE anon;
SELECT pg_temp.denied($q$SELECT public.create_invite_code('10000000-0000-0000-0000-000000000001')$q$, 'anonymous create');
SELECT pg_temp.denied($q$SELECT public.consume_invite_code('111111', '10000000-0000-0000-0000-000000000001')$q$, 'anonymous consume');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT pg_temp.denied($q$SELECT public.create_invite_code('10000000-0000-0000-0000-000000000002')$q$, 'spoof create identity');
SELECT pg_temp.denied($q$SELECT public.consume_invite_code('111111', '10000000-0000-0000-0000-000000000002')$q$, 'spoof consume identity');
SELECT public.create_invite_code('10000000-0000-0000-0000-000000000001') AS invite \gset
SELECT pg_temp.assert_true(public.create_invite_code('10000000-0000-0000-0000-000000000001') = :'invite', 'reuse pending invite');
SELECT pg_temp.assert_true(public.consume_invite_code(:'invite', '10000000-0000-0000-0000-000000000001')->>'error' IS NOT NULL, 'self pairing rejected');
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT public.create_invite_code('10000000-0000-0000-0000-000000000002');
SELECT pg_temp.assert_true((public.consume_invite_code(:'invite', '10000000-0000-0000-0000-000000000002')->>'success')::boolean, 'legitimate consume');
SELECT id AS pair_id FROM public.pairs WHERE invite_code = :'invite' \gset
SELECT pg_temp.assert_true((SELECT count(*) = 1 FROM public.pairs), 'unused consumer invite removed');
SELECT pg_temp.denied($q$INSERT INTO public.pairs(user_one,user_two,invite_code,code_used) VALUES ('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','999991',true)$q$, 'direct pair insertion');
SELECT pg_temp.denied($q$UPDATE public.pairs SET user_two='10000000-0000-0000-0000-000000000003'$q$, 'member replacement');
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
SELECT pg_temp.assert_true(public.consume_invite_code(:'invite', '10000000-0000-0000-0000-000000000003')->>'error' IS NOT NULL, 'consumed code replay');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.pairs), 'other user cannot read pair');
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT pg_temp.denied(format('INSERT INTO public.push_subscriptions(user_id,pair_id,endpoint,p256dh,auth) VALUES (%L,%L,%L,%L,%L)', '10000000-0000-0000-0000-000000000002', :'pair_id', 'https://attacker.invalid', 'key', 'auth'), 'spoof push owner');
INSERT INTO public.push_subscriptions(user_id,pair_id,endpoint,p256dh,auth)
 VALUES ('10000000-0000-0000-0000-000000000001', :'pair_id', 'https://own.invalid', 'key', 'auth');
INSERT INTO public.push_subscriptions(user_id,pair_id,endpoint,p256dh,auth)
 VALUES ('10000000-0000-0000-0000-000000000001', :'pair_id', 'https://updated.invalid', 'key2', 'auth2')
 ON CONFLICT (user_id) DO UPDATE SET endpoint = excluded.endpoint;
SELECT pg_temp.assert_true((SELECT endpoint = 'https://updated.invalid' FROM public.push_subscriptions), 'own push upsert');
SELECT pg_temp.denied($q$UPDATE public.push_subscriptions SET user_id='10000000-0000-0000-0000-000000000002'$q$, 'push reassignment');
INSERT INTO storage.objects(bucket_id,name) VALUES ('chat-media', :'pair_id' || '/valid.jpg'), ('album-photos', :'pair_id' || '/valid.jpg');
SELECT pg_temp.assert_true((SELECT count(*) = 2 FROM storage.objects), 'member media visible');
SELECT pg_temp.denied($q$INSERT INTO storage.objects(bucket_id,name) VALUES ('chat-media','invalid-uuid/file.jpg')$q$, 'invalid path rejected without UUID cast');
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)', 'chat-media', :'pair_id' || '/../file.jpg'), 'traversal path denied');
SELECT pg_temp.denied(format('SELECT public.mark_messages_read(%L,%L)', :'pair_id', '10000000-0000-0000-0000-000000000002'), 'read receipt identity spoof');
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.push_subscriptions), 'partner cannot read push keys');
SELECT pg_temp.assert_true((SELECT count(*) = 2 FROM storage.objects), 'partner media visible');
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM storage.objects), 'outsider media hidden');
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)', 'album-photos', :'pair_id' || '/intruder.jpg'), 'outsider upload denied');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM storage.objects), 'anonymous media hidden');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM storage.buckets WHERE id IN ('chat-media','album-photos') AND public), 'media buckets private');
SELECT pg_temp.denied('SELECT public.dispatch_due_reminders()', 'anonymous internal dispatcher');
SET LOCAL ROLE authenticated;
SELECT pg_temp.denied('SELECT public.dispatch_due_reminders()', 'authenticated internal dispatcher');
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
DELETE FROM public.pairs WHERE id = :'pair_id';
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM public.pairs), 'existing unlink semantics preserved');
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM storage.objects), 'unlinked media inaccessible');
RESET ROLE;
ROLLBACK;
SELECT 'security_behavior: all assertions passed' AS result;
