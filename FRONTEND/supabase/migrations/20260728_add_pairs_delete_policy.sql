-- Add DELETE policy for pairs table (unpair functionality)

CREATE POLICY "Users can delete own pairs" ON pairs
  FOR DELETE USING (auth.uid() = user_one OR auth.uid() = user_two);
