CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.transcript_status AS ENUM ('pending', 'loaded', 'updated');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE POLICY "Admins can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.congress_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL,
  module_title text NOT NULL,
  title text NOT NULL,
  speaker text NOT NULL,
  summary text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  markdown_filename text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.congress_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view congress sessions"
ON public.congress_sessions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage congress sessions"
ON public.congress_sessions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.congress_sessions(id) ON DELETE CASCADE,
  markdown_content text NOT NULL DEFAULT '',
  markdown_filename text,
  status public.transcript_status NOT NULL DEFAULT 'pending',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transcripts"
ON public.transcripts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.transcript_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.congress_sessions(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  token_estimate integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transcript_id, chunk_index)
);

ALTER TABLE public.transcript_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transcript chunks"
ON public.transcript_chunks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'openai-compatible',
  base_url text,
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  api_key text,
  temperature numeric(3,2) NOT NULL DEFAULT 0.55 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens integer NOT NULL DEFAULT 1400 CHECK (max_tokens BETWEEN 200 AND 8000),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  singleton boolean NOT NULL DEFAULT true UNIQUE
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI settings"
ON public.ai_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.prompt_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL,
  style_prompt text NOT NULL,
  rag_notice text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  singleton boolean NOT NULL DEFAULT true UNIQUE
);

ALTER TABLE public.prompt_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prompt settings"
ON public.prompt_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_congress_sessions_updated_at
BEFORE UPDATE ON public.congress_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at
BEFORE UPDATE ON public.transcripts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_settings_updated_at
BEFORE UPDATE ON public.prompt_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.assign_initial_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'luva@equilibria.lat' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_initial_admin_role();

CREATE INDEX idx_congress_sessions_module ON public.congress_sessions(module_id, sort_order);
CREATE INDEX idx_transcripts_session ON public.transcripts(session_id);
CREATE INDEX idx_chunks_session ON public.transcript_chunks(session_id);
CREATE INDEX idx_chunks_keywords ON public.transcript_chunks USING gin(keywords);

INSERT INTO public.congress_sessions (module_id, module_title, title, speaker, summary, tags, markdown_filename, sort_order) VALUES
('modulo-0', 'Umbral del Human Shift', 'Apertura: del cambio externo al giro interior', 'The Human Shift', 'Marco inicial para comprender el congreso como una transición humana, técnica y organizacional.', ARRAY['apertura','sentido','transición'], 'modulo-0-apertura.md', 1),
('modulo-1', 'Conciencia, Tecnología y Liderazgo', 'Liderar en tiempos de inteligencia expandida', 'Ponencia por definir', 'Explora cómo la IA exige una nueva madurez ética, relacional y estratégica en quienes lideran.', ARRAY['liderazgo','ia','ética'], 'modulo-1-liderazgo.md', 2),
('modulo-1', 'Conciencia, Tecnología y Liderazgo', 'Diseñar organizaciones que aprenden', 'Ponencia por definir', 'Lectura sistémica de la organización como organismo vivo capaz de escuchar, adaptarse y transformarse.', ARRAY['organización','aprendizaje','sistemas'], 'modulo-1-organizaciones.md', 3),
('modulo-2', 'Cuerpo, Comunidad y Futuro', 'La inteligencia del vínculo', 'Ponencia por definir', 'Una mirada al vínculo como infraestructura invisible de confianza, colaboración y futuro compartido.', ARRAY['comunidad','vínculo','confianza'], 'modulo-2-vinculo.md', 4),
('modulo-2', 'Cuerpo, Comunidad y Futuro', 'Cuerpos presentes en sistemas digitales', 'Ponencia por definir', 'Integra corporalidad, presencia y atención como antídotos ante la aceleración digital.', ARRAY['cuerpo','presencia','digital'], 'modulo-2-cuerpo.md', 5),
('modulo-3', 'Integración y Resonancia', 'Tejer sabiduría para actuar', 'Ponencia por definir', 'Cierre integrador para traducir aprendizaje, resonancias y tensiones en una práctica concreta.', ARRAY['integración','sabiduría','acción'], 'modulo-3-integracion.md', 6);

INSERT INTO public.ai_settings (provider, base_url, model, temperature, max_tokens)
VALUES ('openai-compatible', 'https://api.openai.com/v1/chat/completions', 'gpt-4o-mini', 0.55, 1400);

INSERT INTO public.prompt_settings (system_prompt, style_prompt, rag_notice)
VALUES (
'Eres la Bitácora de Resonancia del congreso The Human Shift 2026. Responde desde una voz sobria, humana, reflexiva y práctica. No inventes contenido. Cruza la intención del usuario únicamente con los fragmentos seleccionados de las ponencias disponibles.',
'Entrega una síntesis clara, tensiones emergentes, puentes entre voces y una pregunta final de integración. Mantén un lenguaje cálido, preciso y no grandilocuente.',
'RAG Notice: esta respuesta se generó cruzando la intención del usuario únicamente con las ponencias seleccionadas y los fragmentos disponibles en la Bitácora.'
);