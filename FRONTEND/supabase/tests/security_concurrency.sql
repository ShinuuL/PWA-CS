-- Isolated database only: dblink creates independent transactions against itself.
CREATE EXTENSION IF NOT EXISTS dblink;
INSERT INTO auth.users(id) VALUES
 ('20000000-0000-0000-0000-000000000001'),
 ('20000000-0000-0000-0000-000000000002'),
 ('20000000-0000-0000-0000-000000000003'),
 ('20000000-0000-0000-0000-000000000004');
INSERT INTO public.pairs(user_one,invite_code) VALUES
 ('20000000-0000-0000-0000-000000000001','race01'),
 ('20000000-0000-0000-0000-000000000004','race02');
CREATE FUNCTION public.test_consume(code text, caller uuid) RETURNS json LANGUAGE plpgsql AS $$
DECLARE result json;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', caller::text, true);
  result := public.consume_invite_code(code, caller);
  PERFORM pg_sleep(0.3);
  RETURN result;
END;
$$;
SELECT dblink_connect('race_a', 'dbname=' || current_database());
SELECT dblink_connect('race_b', 'dbname=' || current_database());
SELECT dblink_exec('race_a', 'SET ROLE authenticated');
SELECT dblink_exec('race_b', 'SET ROLE authenticated');
SELECT dblink_send_query('race_a', $$SELECT public.test_consume('race01','20000000-0000-0000-0000-000000000002')$$);
SELECT dblink_send_query('race_b', $$SELECT public.test_consume('race01','20000000-0000-0000-0000-000000000003')$$);
CREATE TEMP TABLE race_results(result json);
INSERT INTO race_results SELECT result FROM dblink_get_result('race_a') AS t(result json);
INSERT INTO race_results SELECT result FROM dblink_get_result('race_b') AS t(result json);
DO $$ BEGIN
 IF (SELECT count(*) FROM race_results WHERE (result->>'success')::boolean) <> 1 THEN
   RAISE EXCEPTION 'Same invite race must have exactly one winner'; END IF;
 IF (SELECT count(*) FROM public.pairs WHERE invite_code = 'race01' AND code_used AND user_two IS NOT NULL) <> 1 THEN
   RAISE EXCEPTION 'Same invite race corrupted pair'; END IF;
END $$;
SELECT dblink_disconnect('race_a');
SELECT dblink_disconnect('race_b');
-- Competing different codes for the same consumer must also have one winner.
DELETE FROM public.pairs WHERE invite_code = 'race01';
INSERT INTO public.pairs(user_one,invite_code) VALUES ('20000000-0000-0000-0000-000000000001','race01');
TRUNCATE race_results;
SELECT dblink_connect('race_a', 'dbname=' || current_database());
SELECT dblink_connect('race_b', 'dbname=' || current_database());
SELECT dblink_exec('race_a', 'SET ROLE authenticated');
SELECT dblink_exec('race_b', 'SET ROLE authenticated');
SELECT dblink_send_query('race_a', $$SELECT public.test_consume('race01','20000000-0000-0000-0000-000000000002')$$);
SELECT dblink_send_query('race_b', $$SELECT public.test_consume('race02','20000000-0000-0000-0000-000000000002')$$);
INSERT INTO race_results SELECT result FROM dblink_get_result('race_a') AS t(result json);
INSERT INTO race_results SELECT result FROM dblink_get_result('race_b') AS t(result json);
DO $$ BEGIN
 IF (SELECT count(*) FROM race_results WHERE (result->>'success')::boolean) <> 1 THEN
   RAISE EXCEPTION 'Same consumer race must have exactly one winner'; END IF;
END $$;
SELECT dblink_disconnect('race_a');
SELECT dblink_disconnect('race_b');
DROP FUNCTION public.test_consume(text,uuid);
DELETE FROM public.pairs WHERE invite_code IN ('race01','race02');
DELETE FROM public.profiles WHERE id::text LIKE '20000000-%';
DELETE FROM auth.users WHERE id::text LIKE '20000000-%';
SELECT 'security_concurrency: both races passed' AS result;
