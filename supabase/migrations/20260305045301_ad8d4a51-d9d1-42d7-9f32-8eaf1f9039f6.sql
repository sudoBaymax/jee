
-- Table to store user info + results (no conversation data for privacy)
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  attachment_lean TEXT,
  attachment_scores JSONB,
  conflict_grade TEXT,
  conflict_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin users table (authorized emails for Google sign-in)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for app_users: only admins can read, anyone can insert
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Anyone can insert into app_users (public form)
CREATE POLICY "Public insert app_users" ON public.app_users FOR INSERT WITH CHECK (true);

-- Only authenticated admin users can read app_users
CREATE POLICY "Admin read app_users" ON public.app_users FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Only authenticated admin users can read admin_users
CREATE POLICY "Admin read admin_users" ON public.admin_users FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow update on app_users for public (to add conflict score later)
CREATE POLICY "Public update app_users" ON public.app_users FOR UPDATE USING (true) WITH CHECK (true);
