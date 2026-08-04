-- Spotify Random Picker: Database Tables and Encryption Functions
-- Phase 9, Plan 01: Infrastructure + Store + OAuth

-- Enable pgcrypto for token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encryption helper functions (using Supabase Vault or env key)
CREATE OR REPLACE FUNCTION encrypt_token(p_token text, p_key text)
RETURNS text AS $$
  SELECT pgp_sym_encrypt(p_token, p_key, 'cipher-algo=aes256')::text;
$$
LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_token(p_encrypted text, p_key text)
RETURNS text AS $$
  SELECT pgp_sym_decrypt(p_encrypted::bytea, p_key);
$$
LANGUAGE sql SECURITY DEFINER;

-- Main Spotify config table (one per couple)
CREATE TABLE spotify_config(
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

-- Play history for deduplication (avoid recent repeats)
CREATE TABLE spotify_play_history(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  track_uri TEXT NOT NULL,
  track_name TEXT,
  track_artist TEXT,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spotify_history_pair_played
  ON spotify_play_history(pair_id, played_at DESC);

-- Enable Row Level Security on both tables
ALTER TABLE spotify_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_play_history ENABLE ROW LEVEL SECURITY;

-- RLS policies: couple can only access their own data (via pairs table)
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
