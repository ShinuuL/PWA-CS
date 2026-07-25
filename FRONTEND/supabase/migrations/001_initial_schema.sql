-- CoupleSpace Phase 1: Foundation & Pairing Schema

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1)
);

-- Pairs table (the core pairing record)
CREATE TABLE pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_one UUID REFERENCES auth.users NOT NULL,
  user_two UUID REFERENCES auth.users,
  invite_code TEXT UNIQUE NOT NULL,
  code_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paired_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_one UNIQUE (user_one),
  CONSTRAINT unique_user_two UNIQUE (user_two),
  CONSTRAINT no_self_pair CHECK (user_one != user_two)
);

-- RLS: Users can only see their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS: Users can see pairs they belong to
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pairs" ON pairs
  FOR SELECT USING (auth.uid() = user_one OR auth.uid() = user_two);
CREATE POLICY "Users can create invite codes" ON pairs
  FOR INSERT WITH CHECK (auth.uid() = user_one);
CREATE POLICY "Users can update own pairs" ON pairs
  FOR UPDATE USING (auth.uid() = user_one OR auth.uid() = user_two);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars');

-- Atomic invite code creation (RPC)
CREATE OR REPLACE FUNCTION create_invite_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_code TEXT;
BEGIN
  v_code := LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
  INSERT INTO pairs (user_one, invite_code, code_used)
  VALUES (p_user_id, v_code, FALSE);
  RETURN v_code;
END;
$$;

-- Atomic code consumption with pair creation (RPC)
CREATE OR REPLACE FUNCTION consume_invite_code(p_code TEXT, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_pair RECORD;
BEGIN
  SELECT * INTO v_pair FROM pairs
  WHERE invite_code = p_code AND code_used = FALSE AND user_one != p_user_id
  LIMIT 1;
  IF NOT FOUND THEN RETURN '{"error": "Invalid or expired code"}'; END IF;
  IF EXISTS (SELECT 1 FROM pairs WHERE (user_one = p_user_id OR user_two = p_user_id) AND code_used = TRUE) THEN
    RETURN '{"error": "Already paired. Unpair first."}'; END IF;
  UPDATE pairs SET user_two = p_user_id, code_used = TRUE, paired_at = NOW() WHERE id = v_pair.id;
  RETURN json_build_object('success', TRUE, 'pair_id', v_pair.id);
END;
$$;
