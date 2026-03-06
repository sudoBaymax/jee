-- Remove public UPDATE policy on app_users (updates now go through edge function with service role)
DROP POLICY "Public update app_users" ON public.app_users;