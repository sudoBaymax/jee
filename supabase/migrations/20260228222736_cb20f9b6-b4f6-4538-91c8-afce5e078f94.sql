
-- Couples counseling sessions
CREATE TABLE public.couples_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,
  person1_name TEXT NOT NULL DEFAULT 'Person 1',
  person1_attachment TEXT NOT NULL DEFAULT 'unknown',
  person2_name TEXT,
  person2_attachment TEXT,
  situation TEXT,
  ai_mode TEXT NOT NULL DEFAULT 'after_both' CHECK (ai_mode IN ('on_request', 'after_both')),
  person1_spoke BOOLEAN NOT NULL DEFAULT false,
  person2_spoke BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages in couples sessions
CREATE TABLE public.couples_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.couples_sessions(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('person1', 'person2', 'therapist')),
  sender_name TEXT NOT NULL DEFAULT 'Unknown',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples_messages;

-- RLS: public access since no auth
ALTER TABLE public.couples_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read couples_sessions" ON public.couples_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert couples_sessions" ON public.couples_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update couples_sessions" ON public.couples_sessions FOR UPDATE USING (true);

CREATE POLICY "Public read couples_messages" ON public.couples_messages FOR SELECT USING (true);
CREATE POLICY "Public insert couples_messages" ON public.couples_messages FOR INSERT WITH CHECK (true);
