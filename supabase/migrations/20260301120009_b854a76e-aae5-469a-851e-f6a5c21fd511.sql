CREATE TABLE public.tamagotchi_emotion (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  emotion TEXT NOT NULL DEFAULT 'frown',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed with default
INSERT INTO public.tamagotchi_emotion (id, emotion) VALUES (1, 'frown');

-- No RLS needed - this is a simple public state store
ALTER TABLE public.tamagotchi_emotion DISABLE ROW LEVEL SECURITY;