-- Fix Spotify RLS policies: profiles.pair_id does not exist
-- Rewrite to use pairs table for authorization

-- Drop broken policies
DROP POLICY IF EXISTS "pair.spotify_config" ON spotify_config;
DROP POLICY IF EXISTS "pair.spotify_history" ON spotify_play_history;

-- Recorrect policies using pairs table
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
