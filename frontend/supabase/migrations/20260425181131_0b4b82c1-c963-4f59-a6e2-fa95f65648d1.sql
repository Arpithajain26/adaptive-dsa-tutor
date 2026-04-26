DROP POLICY IF EXISTS "Anyone can read sessions" ON public.dsa_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.dsa_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.dsa_sessions;
DROP POLICY IF EXISTS "Anyone can delete sessions" ON public.dsa_sessions;
-- No policies = no anon/auth access. Edge function uses service role and bypasses RLS.
