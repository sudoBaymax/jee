-- Replace public SELECT/INSERT/UPDATE on couples_sessions with authenticated-only
DROP POLICY "Public read couples_sessions" ON public.couples_sessions;
DROP POLICY "Public insert couples_sessions" ON public.couples_sessions;
DROP POLICY "Public update couples_sessions" ON public.couples_sessions;

CREATE POLICY "Authenticated read couples_sessions"
  ON public.couples_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert couples_sessions"
  ON public.couples_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update couples_sessions"
  ON public.couples_sessions FOR UPDATE
  TO authenticated
  USING (true);

-- Replace public SELECT/INSERT on couples_messages with authenticated-only
DROP POLICY "Public read couples_messages" ON public.couples_messages;
DROP POLICY "Public insert couples_messages" ON public.couples_messages;

CREATE POLICY "Authenticated read couples_messages"
  ON public.couples_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert couples_messages"
  ON public.couples_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);