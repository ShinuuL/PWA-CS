-- Moods table: one mood per user per pair (upsert via unique constraint)
CREATE TABLE IF NOT EXISTS moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_type TEXT NOT NULL,
  custom_text TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pair_id, user_id)
);

-- RLS policies for moods
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Pair members can view moods
CREATE POLICY "Pair members can view moods"
ON moods FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can insert moods
CREATE POLICY "Pair members can insert moods"
ON moods FOR INSERT TO authenticated
WITH CHECK (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Pair members can update own moods
CREATE POLICY "Pair members can update own moods"
ON moods FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can delete own moods
CREATE POLICY "Pair members can delete own moods"
ON moods FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_moods_pair_user ON moods (pair_id, user_id);
CREATE INDEX IF NOT EXISTS idx_moods_pair_created ON moods (pair_id, created_at DESC);

-- RPC: get a random album photo for a given pair
CREATE OR REPLACE FUNCTION get_random_album_photo(p_pair_id UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, url, caption, created_at
  FROM album_photos
  WHERE pair_id = p_pair_id
  ORDER BY random()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_random_album_photo(UUID) TO authenticated;
