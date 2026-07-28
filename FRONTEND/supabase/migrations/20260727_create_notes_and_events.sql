-- Create shared_notes table for couple collaboration
CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for shared_notes
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;

-- Pair members can view notes
CREATE POLICY "Pair members can view notes"
ON shared_notes FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can insert notes (must match their own user_id)
CREATE POLICY "Pair members can insert notes"
ON shared_notes FOR INSERT TO authenticated
WITH CHECK (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Pair members can update any note (D-07: true collaboration)
CREATE POLICY "Pair members can update notes"
ON shared_notes FOR UPDATE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can delete any note
CREATE POLICY "Pair members can delete notes"
ON shared_notes FOR DELETE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Index for efficient chronological queries
CREATE INDEX IF NOT EXISTS idx_shared_notes_pair_created ON shared_notes (pair_id, created_at DESC);

-- Create agenda_events table for shared calendar events
CREATE TABLE IF NOT EXISTS agenda_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'Outro',
  reminder TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for agenda_events
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

-- Pair members can view events
CREATE POLICY "Pair members can view events"
ON agenda_events FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can insert events (must match their own user_id)
CREATE POLICY "Pair members can insert events"
ON agenda_events FOR INSERT TO authenticated
WITH CHECK (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Pair members can update any event
CREATE POLICY "Pair members can update events"
ON agenda_events FOR UPDATE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can delete any event
CREATE POLICY "Pair members can delete events"
ON agenda_events FOR DELETE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_agenda_events_pair_date ON agenda_events (pair_id, event_date ASC);
