-- Enable RLS on tamagotchi_emotion
ALTER TABLE public.tamagotchi_emotion ENABLE ROW LEVEL SECURITY;

-- Allow public read (this is a shared UI state, not sensitive)
CREATE POLICY "Public read tamagotchi_emotion"
  ON public.tamagotchi_emotion
  FOR SELECT
  USING (true);

-- Allow public update (the app updates emotion state without auth)
CREATE POLICY "Public update tamagotchi_emotion"
  ON public.tamagotchi_emotion
  FOR UPDATE
  USING (true)
  WITH CHECK (true);