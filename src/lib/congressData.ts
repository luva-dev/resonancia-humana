export type CongressSession = {
  id: string;
  module_id: string;
  module_title: string;
  title: string;
  speaker: string;
  summary: string;
  tags: string[];
  markdown_filename?: string | null;
  sort_order: number;
};

export type CongressModule = {
  id: string;
  title: string;
  intention: string;
  sessions: CongressSession[];
};

export const fallbackSessions: CongressSession[] = [
  {
    id: "modulo-0-apertura",
    module_id: "modulo-0",
    module_title: "Umbral del Human Shift",
    title: "Apertura: del cambio externo al giro interior",
    speaker: "The Human Shift",
    summary: "Marco inicial para comprender el congreso como una transición humana, técnica y organizacional.",
    tags: ["apertura", "sentido", "transición"],
    markdown_filename: "modulo-0-apertura.md",
    sort_order: 1,
  },
  {
    id: "modulo-1-liderazgo",
    module_id: "modulo-1",
    module_title: "Conciencia, Tecnología y Liderazgo",
    title: "Liderar en tiempos de inteligencia expandida",
    speaker: "Ponencia por definir",
    summary: "Explora cómo la IA exige una nueva madurez ética, relacional y estratégica en quienes lideran.",
    tags: ["liderazgo", "ia", "ética"],
    markdown_filename: "modulo-1-liderazgo.md",
    sort_order: 2,
  },
  {
    id: "modulo-1-organizaciones",
    module_id: "modulo-1",
    module_title: "Conciencia, Tecnología y Liderazgo",
    title: "Diseñar organizaciones que aprenden",
    speaker: "Ponencia por definir",
    summary: "Lectura sistémica de la organización como organismo vivo capaz de escuchar, adaptarse y transformarse.",
    tags: ["organización", "aprendizaje", "sistemas"],
    markdown_filename: "modulo-1-organizaciones.md",
    sort_order: 3,
  },
  {
    id: "modulo-2-vinculo",
    module_id: "modulo-2",
    module_title: "Cuerpo, Comunidad y Futuro",
    title: "La inteligencia del vínculo",
    speaker: "Ponencia por definir",
    summary: "Una mirada al vínculo como infraestructura invisible de confianza, colaboración y futuro compartido.",
    tags: ["comunidad", "vínculo", "confianza"],
    markdown_filename: "modulo-2-vinculo.md",
    sort_order: 4,
  },
  {
    id: "modulo-2-cuerpo",
    module_id: "modulo-2",
    module_title: "Cuerpo, Comunidad y Futuro",
    title: "Cuerpos presentes en sistemas digitales",
    speaker: "Ponencia por definir",
    summary: "Integra corporalidad, presencia y atención como antídotos ante la aceleración digital.",
    tags: ["cuerpo", "presencia", "digital"],
    markdown_filename: "modulo-2-cuerpo.md",
    sort_order: 5,
  },
  {
    id: "modulo-3-integracion",
    module_id: "modulo-3",
    module_title: "Integración y Resonancia",
    title: "Tejer sabiduría para actuar",
    speaker: "Ponencia por definir",
    summary: "Cierre integrador para traducir aprendizaje, resonancias y tensiones en una práctica concreta.",
    tags: ["integración", "sabiduría", "acción"],
    markdown_filename: "modulo-3-integracion.md",
    sort_order: 6,
  },
];

const intentions: Record<string, string> = {
  "modulo-0": "Abrir el campo común y nombrar el tipo de cambio que el congreso quiere sostener.",
  "modulo-1": "Relacionar inteligencia artificial, liderazgo y diseño institucional desde una ética de presencia.",
  "modulo-2": "Recordar que toda transformación tecnológica necesita cuerpo, vínculo y comunidad.",
  "modulo-3": "Convertir resonancias dispersas en comprensión accionable y preguntas de continuidad.",
};

export const groupSessions = (sessions: CongressSession[]): CongressModule[] => {
  const sorted = [...sessions].sort((a, b) => a.sort_order - b.sort_order);
  const groups = sorted.reduce<Record<string, CongressModule>>((acc, session) => {
    if (!acc[session.module_id]) {
      acc[session.module_id] = {
        id: session.module_id,
        title: session.module_title,
        intention: intentions[session.module_id] ?? "Sostener una lectura compartida del congreso.",
        sessions: [],
      };
    }
    acc[session.module_id].sessions.push(session);
    return acc;
  }, {});

  return Object.values(groups);
};
