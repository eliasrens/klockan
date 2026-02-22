-- ============================================
-- KLOCKSPLET - Supabase Database Schema
-- ============================================

-- Skapa profiler-tabell (för användarinformation)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Profiler: alla kan läsa, endast ägare kan modifiera
CREATE POLICY "Alla kan läsa profiler" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Användare kan lägga till egen profil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Användare kan uppdatera egen profil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Spelstatistik: alla kan läsa, endast ägare kan modifiera
CREATE POLICY "Alla kan läsa statistik" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "Användare kan lägga till statistik" ON public.player_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan uppdatera statistik" ON public.player_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- === FUNKTION FÖR ATT SKAPA PROFIL ===
-- Denna funktion körs när en ny användare registrerar sig

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vänta tills metadata finns
  IF NEW.raw_user_meta_data IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Skapa profil
  INSERT INTO public.profiles (id, name, class)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonym'),
    COALESCE(NEW.raw_user_meta_data->>'class', '3A')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initiera statistik för alla spellägen
  INSERT INTO public.player_stats (user_id, mode, score, level, max_streak, games_played)
  VALUES (NEW.id, 'enkel', 0, 1, 0, 0)
  ON CONFLICT (user_id, mode) DO NOTHING;
  
  INSERT INTO public.player_stats (user_id, mode, score, level, max_streak, games_played)
  VALUES (NEW.id, 'tid', 0, 1, 0, 0)
  ON CONFLICT (user_id, mode) DO NOTHING;
  
  INSERT INTO public.player_stats (user_id, mode, score, level, max_streak, games_played)
  VALUES (NEW.id, 'problem', 0, 1, 0, 0)
  ON CONFLICT (user_id, mode) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ge tillgång till funktionen
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.player_stats TO anon, authenticated;
