-- CoupleSpace Phase 2: Real-Time Chat Schema

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID REFERENCES pairs(id) NOT NULL,
  sender_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  reply_to UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_for_everyone BOOLEAN DEFAULT FALSE,
  CONSTRAINT content_not_empty CHECK (char_length(content) >= 1)
);

CREATE INDEX idx_messages_pair_created ON messages(pair_id, created_at);

-- Reactions table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_reaction UNIQUE (message_id, user_id, emoji)
);

-- Typing status table
CREATE TABLE typing_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID REFERENCES pairs(id) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_typing UNIQUE (pair_id, user_id)
);

-- RLS: Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = messages.pair_id
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = messages.pair_id
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS: Reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can view reactions" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN pairs ON pairs.id = messages.pair_id
      WHERE messages.id = reactions.message_id
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert own reactions" ON reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM messages
      JOIN pairs ON pairs.id = messages.pair_id
      WHERE messages.id = reactions.message_id
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (user_id = auth.uid());

-- RLS: Typing status
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can view typing status" ON typing_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = typing_status.pair_id
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

CREATE POLICY "Users can update own typing status" ON typing_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own typing status" ON typing_status
  FOR UPDATE USING (user_id = auth.uid());

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;

-- RPC: Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_pair_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE pair_id = p_pair_id
  AND sender_id != p_user_id
  AND read_at IS NULL;
END;
$$;
