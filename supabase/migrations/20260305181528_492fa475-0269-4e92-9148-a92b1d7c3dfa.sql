
-- Drop the restrictive insert policy and recreate as permissive
DROP POLICY "Public insert app_users" ON public.app_users;
CREATE POLICY "Public insert app_users" ON public.app_users FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Also fix update policy
DROP POLICY "Public update app_users" ON public.app_users;
CREATE POLICY "Public update app_users" ON public.app_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
