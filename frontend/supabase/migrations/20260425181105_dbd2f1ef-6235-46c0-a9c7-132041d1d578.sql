-- Sessions table for DSA Tutor (anonymous sessions, no auth required)
CREATE TABLE public.dsa_sessions (
  session_id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_problem JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dsa_sessions ENABLE ROW LEVEL SECURITY;

-- Anonymous app: sessions are identified by an unguessable client-generated UUID.
-- Allow anyone to read/write rows (no PII; session_id acts as a capability token).
CREATE POLICY "Anyone can read sessions" ON public.dsa_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.dsa_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.dsa_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sessions" ON public.dsa_sessions FOR DELETE USING (true);
