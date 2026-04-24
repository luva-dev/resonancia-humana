export type CongressSession = {
  id: string;
  module_id: string;
  module_title: string;
  title: string;
  speaker: string;
  summary: string;
  tags: string[];
  markdown_filename?: string | null;
  transcript_filename?: string | null;
  transcript_updated_at?: string | null;
  transcript_chunk_count?: number;
  transcript_loaded?: boolean;
  sort_order: number;
};

export type CongressModule = {
  id: string;
  title: string;
  intention: string;
  sessions: CongressSession[];
};

export const fallbackSessions: CongressSession[] = [

  // ── BLOQUE 0 — EL COACHING HOY ───────────────────────────────────────────────
  {
    id: "11111111-1111-4111-8111-111111111111",
    module_id: "modulo-0",
    module_title: "El coaching hoy: Miradas, desafíos y futuro",
    title: "El coaching hoy: evolución y escenarios futuros",
    speaker: "Omar Osses",
    summary: "Una mirada panorámica a la evolución del coaching y los escenarios que marcarán su práctica en los próximos años.",
    tags: ["coaching", "evolución", "futuro"],
    markdown_filename: "El-coaching-hoy-evoluci-n-y-futuro.md",
    sort_order: 1,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    module_id: "modulo-0",
    module_title: "El coaching hoy: Miradas, desafíos y futuro",
    title: "Ser, conciencia y transformación",
    speaker: "Pedro Makabe",
    summary: "Exploración profunda del ser como punto de partida para la conciencia y la transformación personal y organizacional.",
    tags: ["ser", "conciencia", "transformación"],
    markdown_filename: "-Ser-conciencia-y-transformaci-n.md",
    sort_order: 2,
  },

  // ── BLOQUE 1 — LIDERAZGO HUMANO ─────────────────────────────────────────────
  {
    id: "33333333-3333-4333-8333-333333333333",
    module_id: "modulo-1",
    module_title: "Personas que influyen: El liderazgo humano que transforma culturas",
    title: "El liderazgo empieza por dentro",
    speaker: "Sandra Rozo",
    summary: "Reflexión sobre el origen interno del liderazgo genuino y cómo la conciencia de uno mismo determina la calidad de la influencia.",
    tags: ["liderazgo", "influencia", "interior"],
    markdown_filename: "El-liderazgo-empieza-por-dentro.md",
    sort_order: 3,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    module_id: "modulo-1",
    module_title: "Personas que influyen: El liderazgo humano que transforma culturas",
    title: "Competencias humanas para liderar en la complejidad",
    speaker: "María Victoria García",
    summary: "Análisis de las competencias humanas esenciales para navegar y liderar con efectividad en entornos complejos e impredecibles.",
    tags: ["complejidad", "competencias", "liderazgo"],
    markdown_filename: "Competencias-humanas-para-la-complejidad.md",
    sort_order: 4,
  },

  // ── BLOQUE 2 — CULTURAS QUE EVOLUCIONAN ─────────────────────────────────────
  {
    id: "55555555-5555-4555-8555-555555555555",
    module_id: "modulo-2",
    module_title: "Culturas que evolucionan: Sentido, tecnología y capacidad colectiva",
    title: "Culturas con sentido",
    speaker: "Minerva Gebran",
    summary: "Las culturas organizacionales con propósito como ventaja estratégica, motor de evolución humana y sostenibilidad a largo plazo.",
    tags: ["cultura", "sentido", "estrategia"],
    markdown_filename: "Culturas-con-sentido-como-ventaja-estrat-gica.md",
    sort_order: 5,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    module_id: "modulo-2",
    module_title: "Culturas que evolucionan: Sentido, tecnología y capacidad colectiva",
    title: "Tecnología e inteligencia artificial: el desafío humano",
    speaker: "Juan Vera",
    summary: "Exploración del impacto de la IA y la tecnología en el desarrollo humano y cómo enfrentar este desafío desde una perspectiva organizacional.",
    tags: ["tecnología", "ia", "humanidad"],
    markdown_filename: "IA-aliada-o-competidora-del-desarrollo-humano.md",
    sort_order: 6,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    module_id: "modulo-2",
    module_title: "Culturas que evolucionan: Sentido, tecnología y capacidad colectiva",
    title: "Mindfulness que mueve organizaciones",
    speaker: "Violeta Hoshi",
    summary: "Cómo el mindfulness nutre culturas corporativas más colaborativas, presentes y resilientes ante el cambio.",
    tags: ["mindfulness", "colaboración", "cultura"],
    markdown_filename: "Mindfulness-y-cultura-corporativa.md",
    sort_order: 7,
  },

  // ── BLOQUE 3 — ORGANIZACIONES QUE INSPIRAN ──────────────────────────────────
  {
    id: "88888888-8888-4888-8888-888888888888",
    module_id: "modulo-3",
    module_title: "Organizaciones que inspiran",
    title: "El cuerpo en las organizaciones",
    speaker: "Emmanuel Pérez",
    summary: "El rol del cuerpo como vehículo de presencia y coherencia dentro de las organizaciones y su impacto en la acción colectiva.",
    tags: ["cuerpo", "presencia", "organizaciones"],
    markdown_filename: "Movilizan-personas-no-solo-gestionan-recursos.md",
    sort_order: 8,
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    module_id: "modulo-3",
    module_title: "Organizaciones que inspiran",
    title: "Innovación y agilidad cultural",
    speaker: "Erika Salazar",
    summary: "Estrategias para cultivar innovación y agilidad cultural como respuesta adaptativa ante la disrupción constante del entorno.",
    tags: ["innovación", "agilidad", "disrupción"],
    markdown_filename: "Cultura-de-agilidad-e-innovaci-n.md",
    sort_order: 9,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    module_id: "modulo-3",
    module_title: "Organizaciones que inspiran",
    title: "Cómo manifestar metas y hacer realidad los sueños",
    speaker: "Enrique Horna",
    summary: "Sesión orientada a integrar aprendizajes del congreso en metas concretas y un diseño intencional del futuro personal y organizacional.",
    tags: ["metas", "futuro", "diseño"],
    markdown_filename: "Apr-23-04-52-PM.md",
    sort_order: 10,
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    module_id: "modulo-3",
    module_title: "Organizaciones que inspiran",
    title: "Conversatorio integrador",
    speaker: "Mijail León (mod.) · Leyla Chihuan · Jossy Cárdenas · Patricia Oliveros · Luis Sánchez",
    summary: "Diálogo colectivo sobre el compromiso institucional con el aprendizaje continuo como respuesta a la transformación acelerada del mundo.",
    tags: ["conversatorio", "panel", "integración"],
    markdown_filename: "El-aprendizaje-como-responsabilidad-institucional.md",
    sort_order: 11,
  },
];

const intentions: Record<string, string> = {
  "modulo-0": "Abrir el campo común explorando la evolución del coaching y sus desafíos actuales desde múltiples miradas.",
  "modulo-1": "Comprender el liderazgo como un acto que nace desde adentro y transforma culturas humanas.",
  "modulo-2": "Explorar cómo las culturas organizacionales evolucionan a través del sentido, la tecnología y la capacidad colectiva.",
  "modulo-3": "Aprender de organizaciones que movilizan personas, innovan y hacen del aprendizaje una responsabilidad institucional.",
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
