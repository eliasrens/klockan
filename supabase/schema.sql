-- ============================================
-- KLOCKSPLET - Supabase Database Schema
-- ============================================

-- Skapa profiler-tabell (name + class som primary key)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, class)
);

-- Skapa spelstatistik-tabell
DROP TABLE IF EXISTS public.player_stats CASCADE;
CREATE TABLE public.player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  max_streak INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mode)
);

-- Aktivera Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- === POLICIES ===
-- Eftersom vi inte använder Supabase Auth kan vi inte använda auth.uid()
-- Vi använder istället öppen åtkomst för enkelhet

-- Profiler: alla kan läsa och skriva
CREATE POLICY "Alla kan göra allt med profiler" ON public.profiles
  FOR ALL USING (true);

-- Spelstatistik: alla kan läsa och skriva
CREATE POLICY "Alla kan göra allt med statistik" ON public.player_stats
  FOR ALL USING (true);

-- Ge tillgång
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.player_stats TO anon, authenticated;
