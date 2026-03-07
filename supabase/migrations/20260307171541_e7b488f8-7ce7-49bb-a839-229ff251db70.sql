
-- Drop restrictive policies on couples_sessions
DROP POLICY IF EXISTS "Authenticated insert couples_sessions" ON public.couples_sessions;
DROP POLICY IF EXISTS "Authenticated read couples_sessions" ON public.couples_sessions;
DROP POLICY IF EXISTS "Authenticated update couples_sessions" ON public.couples_sessions;

-- Create permissive public policies
CREATE POLICY "Public insert couples_sessions" ON public.couples_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read couples_sessions" ON public.couples_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public update couples_sessions" ON public.couples_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Drop restrictive policies on couples_messages
DROP POLICY IF EXISTS "Authenticated insert couples_messages" ON public.couples_messages;
DROP POLICY IF EXISTS "Authenticated read couples_messages" ON public.couples_messages;

-- Create permissive public policies
CREATE POLICY "Public insert couples_messages" ON public.couples_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read couples_messages" ON public.couples_messages FOR SELECT TO anon, authenticated USING (true);
