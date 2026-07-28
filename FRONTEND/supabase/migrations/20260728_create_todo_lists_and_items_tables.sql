-- Phase 6: Todo Lists and Todo Items tables (enables Phase 8 to-do feature)
-- INFRA-04, D-15

CREATE TABLE todo_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE todo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  assigned_to TEXT CHECK (assigned_to IN ('me', 'partner')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- Todo Lists: Pair members can view (D-12: trust-based)
CREATE POLICY "Pair members can view todo lists" ON todo_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = todo_lists.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Lists: Pair members can insert
CREATE POLICY "Pair members can insert todo lists" ON todo_lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = todo_lists.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Lists: Pair members can update
CREATE POLICY "Pair members can update todo lists" ON todo_lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = todo_lists.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Lists: Pair members can delete
CREATE POLICY "Pair members can delete todo lists" ON todo_lists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.id = todo_lists.pair_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Items: Pair members can view (via list join)
CREATE POLICY "Pair members can view todo items" ON todo_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM todo_lists
      JOIN pairs ON pairs.id = todo_lists.pair_id
      WHERE todo_lists.id = todo_items.list_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Items: Pair members can insert
CREATE POLICY "Pair members can insert todo items" ON todo_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM todo_lists
      JOIN pairs ON pairs.id = todo_lists.pair_id
      WHERE todo_lists.id = todo_items.list_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Items: Pair members can update
CREATE POLICY "Pair members can update todo items" ON todo_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM todo_lists
      JOIN pairs ON pairs.id = todo_lists.pair_id
      WHERE todo_lists.id = todo_items.list_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );

-- Todo Items: Pair members can delete
CREATE POLICY "Pair members can delete todo items" ON todo_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM todo_lists
      JOIN pairs ON pairs.id = todo_lists.pair_id
      WHERE todo_lists.id = todo_items.list_id
      AND pairs.code_used = TRUE
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );
