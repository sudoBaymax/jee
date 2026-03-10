
-- Create a security definer function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = (
      SELECT email FROM auth.users WHERE id = _user_id
    )
  )
$$;

-- Drop the recursive policy on admin_users
DROP POLICY IF EXISTS "Admin read admin_users" ON public.admin_users;

-- Recreate using the security definer function
CREATE POLICY "Admin read admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix the app_users SELECT policy too
DROP POLICY IF EXISTS "Admin read app_users" ON public.app_users;

CREATE POLICY "Admin read app_users"
ON public.app_users
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
