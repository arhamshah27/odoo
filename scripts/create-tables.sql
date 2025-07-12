-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills_offered TEXT[] DEFAULT '{}',
  skills_wanted TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'flexible',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create skill_requests table
CREATE TABLE IF NOT EXISTS skill_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  skill_offered TEXT NOT NULL,
  skill_wanted TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Skill requests policies
CREATE POLICY "Users can view requests they sent or received" ON skill_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can insert requests they send" ON skill_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests they received" ON skill_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_is_public_idx ON profiles(is_public);
CREATE INDEX IF NOT EXISTS skill_requests_from_user_id_idx ON skill_requests(from_user_id);
CREATE INDEX IF NOT EXISTS skill_requests_to_user_id_idx ON skill_requests(to_user_id);
CREATE INDEX IF NOT EXISTS skill_requests_status_idx ON skill_requests(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_requests_updated_at BEFORE UPDATE ON skill_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- This script focuses on ensuring the skill_requests table has correct foreign keys.
-- It assumes profiles table, RLS policies, and triggers for profiles are already set up.

-- Drop skill_requests table if it exists to allow recreation with new foreign keys.
-- This will delete any existing skill requests, so use with caution in production.
DROP TABLE IF EXISTS skill_requests CASCADE;

-- Create skill_requests table with foreign keys referencing profiles(user_id).
-- This is the crucial part to fix the schema cache relationship error.
CREATE TABLE skill_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  skill_offered TEXT NOT NULL,
  skill_wanted TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for skill_requests (if not already enabled)
ALTER TABLE skill_requests ENABLE ROW LEVEL SECURITY;

-- Skill requests policies: Re-create them to ensure they are correctly applied
-- after dropping and recreating the table.
DROP POLICY IF EXISTS "Users can view requests they sent or received" ON skill_requests;
CREATE POLICY "Users can view requests they sent or received" ON skill_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can insert requests they send" ON skill_requests;
CREATE POLICY "Users can insert requests they send" ON skill_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can update requests they received" ON skill_requests;
CREATE POLICY "Users can update requests they received" ON skill_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Create indexes for better performance (if not already existing)
CREATE INDEX IF NOT EXISTS skill_requests_from_user_id_idx ON skill_requests(from_user_id);
CREATE INDEX IF NOT EXISTS skill_requests_to_user_id_idx ON skill_requests(to_user_id);
CREATE INDEX IF NOT EXISTS skill_requests_status_idx ON skill_requests(status);

-- Re-create trigger for updated_at on skill_requests (if not already existing)
-- The function update_updated_at_column() should already exist from previous runs.
DROP TRIGGER IF EXISTS update_skill_requests_updated_at ON skill_requests;
CREATE TRIGGER update_skill_requests_updated_at BEFORE UPDATE ON skill_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
