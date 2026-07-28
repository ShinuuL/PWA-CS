-- Fix CR-02: mark_messages_read auth check
CREATE OR REPLACE FUNCTION mark_messages_read(p_pair_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller belongs to this pair
  IF NOT EXISTS (
    SELECT 1 FROM pairs
    WHERE id = p_pair_id
    AND (user_one = auth.uid() OR user_two = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE messages
  SET read_at = NOW()
  WHERE pair_id = p_pair_id
  AND sender_id != p_user_id
  AND read_at IS NULL;
END;
$$;

-- Fix CR-01: Allow reading partner's profile
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policy: users can see their own AND their partner's profile
CREATE POLICY "Users can view own and partner profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM pairs
      WHERE pairs.code_used = TRUE
      AND (
        (pairs.user_one = auth.uid() AND pairs.user_two = id)
        OR
        (pairs.user_two = auth.uid() AND pairs.user_one = id)
      )
    )
  );
