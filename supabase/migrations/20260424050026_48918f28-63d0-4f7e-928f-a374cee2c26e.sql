DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transcripts_session_id_key'
  ) THEN
    ALTER TABLE public.transcripts
      ADD CONSTRAINT transcripts_session_id_key UNIQUE (session_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transcripts_session_id_fkey'
  ) THEN
    ALTER TABLE public.transcripts
      ADD CONSTRAINT transcripts_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES public.congress_sessions(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transcript_chunks_session_id_fkey'
  ) THEN
    ALTER TABLE public.transcript_chunks
      ADD CONSTRAINT transcript_chunks_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES public.congress_sessions(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transcript_chunks_transcript_id_fkey'
  ) THEN
    ALTER TABLE public.transcript_chunks
      ADD CONSTRAINT transcript_chunks_transcript_id_fkey
      FOREIGN KEY (transcript_id)
      REFERENCES public.transcripts(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transcript_chunks_transcript_id_chunk_index_key'
  ) THEN
    ALTER TABLE public.transcript_chunks
      ADD CONSTRAINT transcript_chunks_transcript_id_chunk_index_key UNIQUE (transcript_id, chunk_index);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON public.transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_session_id ON public.transcript_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_transcript_id ON public.transcript_chunks(transcript_id);

DROP POLICY IF EXISTS "Public can view loaded transcripts" ON public.transcripts;
CREATE POLICY "Public can view loaded transcripts"
ON public.transcripts
FOR SELECT
TO anon, authenticated
USING (status = 'loaded'::public.transcript_status);