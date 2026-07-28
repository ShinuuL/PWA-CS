-- Fix: Add ON DELETE CASCADE to foreign keys that reference pairs
-- This allows unpair to work by cascading deletes to messages and typing_status

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_pair_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_pair_id_fkey FOREIGN KEY (pair_id) REFERENCES pairs(id) ON DELETE CASCADE;

ALTER TABLE typing_status DROP CONSTRAINT IF EXISTS typing_status_pair_id_fkey;
ALTER TABLE typing_status ADD CONSTRAINT typing_status_pair_id_fkey FOREIGN KEY (pair_id) REFERENCES pairs(id) ON DELETE CASCADE;
