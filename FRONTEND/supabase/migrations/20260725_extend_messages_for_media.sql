-- Extend messages table for media support
-- Apply this migration via Supabase Dashboard SQL Editor or CLI

-- Step 1: Add media columns to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image')),
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_duration INTEGER,
  ADD COLUMN IF NOT EXISTS media_width INTEGER,
  ADD COLUMN IF NOT EXISTS media_height INTEGER;

-- Step 2: Replace content_not_empty constraint with flexible check
ALTER TABLE messages DROP CONSTRAINT IF EXISTS content_not_empty;
ALTER TABLE messages ADD CONSTRAINT content_or_media CHECK (
  char_length(content) >= 1 OR media_url IS NOT NULL
);

-- Step 3: Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-media', 'chat-media', true, 31457280, ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Step 4: RLS policies for chat-media bucket
-- Allow authenticated users to upload to their pair's folder
CREATE POLICY "Pair members can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Allow authenticated users to read their pair's media
CREATE POLICY "Pair members can read chat media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Allow authenticated users to delete their own uploaded media
CREATE POLICY "Pair members can delete their chat media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);
