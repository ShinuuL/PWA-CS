-- Spotify: Tables, Encryption, RLS (clean migration)
-- This replaces 20260730_create_spotify_tables.sql and fix_spotify_rls_policies.sql

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Encryption functions
CREATE OR REPLACE FUNCTION encrypt_token(p_token text, p_key text)
RETURNS text AS $$
  SELECT pgp_sym_encrypt(p_token, p_key, 'cipher-algo=aes256'::text)::text;
$$
LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_token(p_encrypted text, p_key text)
RETURNS text AS $$
  SELECT pgp_sym_decrypt(p_encrypted::bytea, p_key);
$$
LANGUAGE sql SECURITY DEFINER;

-- 3. spotify_config table
CREATE TABLE IF NOT EXISTS spotify_config(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  spotify_playlist_id TEXT NOT NULL DEFAULT '',
  playlist_name TEXT DEFAULT '',
  auto_rotate_interval INTEGER DEFAULT 3,
  is_enabled BOOLEAN DEFAULT TRUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pair_id)
);

-- 4. spotify_play_history table
CREATE TABLE IF NOT EXISTS spotify_play_history(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  track_uri TEXT NOT NULL,
  track_name TEXT,
  track_artist TEXT,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spotify_history_pair_played
  ON spotify_play_history(pair_id, played_at DESC);

-- 5. Enable RLS
ALTER TABLE spotify_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_play_history ENABLE ROW LEVEL SECURITY;

-- 6. Drop old broken policies (uses profiles.pair_id which doesn't exist)
DROP POLICY IF EXISTS "pair.spotify_config" ON spotify_config;
DROP POLICY IF EXISTS "pair.spotify_history" ON spotify_play_history;

-- 7. Create correct RLS policies using pairs table
CREATE POLICY "pair.spotify_config" ON spotify_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = spotify_config.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

CREATE POLICY "pair.spotify_history" ON spotify_play_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = spotify_play_history.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- 8. Grant permissions for Edge Functions
GRANT EXECUTE ON FUNCTION public.encrypt_token(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_token(text,text) TO service_role;

-- 9. Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
