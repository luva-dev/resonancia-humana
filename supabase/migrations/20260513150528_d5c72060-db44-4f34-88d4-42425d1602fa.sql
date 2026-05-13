ALTER TABLE public.congress_sessions ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

UPDATE public.congress_sessions SET is_hidden = true WHERE speaker ILIKE '%Enrique Horna%';

DROP POLICY IF EXISTS "Public can view congress sessions" ON public.congress_sessions;

CREATE POLICY "Public can view visible congress sessions"
ON public.congress_sessions
FOR SELECT
TO anon, authenticated
USING (is_hidden = false);