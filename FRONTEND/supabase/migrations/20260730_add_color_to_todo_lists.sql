-- Phase 8: Add color column to todo_lists for list personalization (D-07, D-19)

ALTER TABLE todo_lists ADD COLUMN color TEXT DEFAULT '#B87CFF';

COMMENT ON COLUMN todo_lists.color IS 'Hex color for list accent (D-07, D-19)';
