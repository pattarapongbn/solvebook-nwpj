-- ============================================================
-- Applied via Supabase MCP (2026-06-28)
-- ============================================================

-- Storage: create 'slips' bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('slips', 'slips', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "slips_upload" ON storage.objects;
DROP POLICY IF EXISTS "slips_read"   ON storage.objects;
CREATE POLICY "slips_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'slips');
CREATE POLICY "slips_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'slips');

-- Helper: SECURITY DEFINER to check is_admin without RLS recursion
CREATE OR REPLACE FUNCTION public.requesting_user_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Allow admins to read all profiles (for admin pages)
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT USING (public.requesting_user_is_admin());
