-- Create album_photos table for shared couple photo album
CREATE TABLE IF NOT EXISTS album_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT DEFAULT '',
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for album_photos
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- Pair members can view album photos
CREATE POLICY "Pair members can view album photos"
ON album_photos FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can insert album photos (must match their own user_id)
CREATE POLICY "Pair members can insert album photos"
ON album_photos FOR INSERT TO authenticated
WITH CHECK (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Pair members can delete their own album photos
CREATE POLICY "Pair members can delete their own album photos"
ON album_photos FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Index for efficient chronological queries
CREATE INDEX IF NOT EXISTS idx_album_photos_pair_created ON album_photos (pair_id, created_at DESC);

-- Create album-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('album-photos', 'album-photos', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Pair members can upload album photos
CREATE POLICY "Pair members can upload album photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'album-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Storage RLS: Pair members can read album photos
CREATE POLICY "Pair members can read album photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'album-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Storage RLS: Pair members can delete their album photos
CREATE POLICY "Pair members can delete their album photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'album-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);
