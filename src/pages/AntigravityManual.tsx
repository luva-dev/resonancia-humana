import { ArrowLeft, BrainCircuit, Database, FileText, KeyRound, LockKeyhole, Network } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    icon: Network,
    title: "1. Propósito general",
    body: "La plataforma crea una Bitácora de Resonancia para Human Shift: el público selecciona ponencias, escribe una intención y recibe una síntesis IA basada solo en fragmentos relevantes de las transcripciones cargadas por administración.",
  },
  {
    icon: LockKeyhole,
    title: "2. Separación público / administración",
    body: "La experiencia pública no muestra API keys, prompts maestros, transcripciones completas ni módulos técnicos. La administración vive en una ruta protegida, accesible para el rol admin validado en backend.",
  },
  {
    icon: Database,
    title: "3. Arquitectura de datos",
    body: "congress_sessions contiene el mapa del congreso; transcripts guarda el Markdown completo por ponencia; transcript_chunks guarda fragmentos procesados; ai_settings almacena proveedor, endpoint, modelo y parámetros; prompt_settings define la voz de la Bitácora; user_roles separa permisos de usuarios.",
  },
  {
    icon: FileText,
    title: "4. Flujo de carga de MD",
    body: "El administrador elige una ponencia, pega o carga su transcripción Markdown y el backend la divide en fragmentos. Cada fragmento queda asociado a la sesión original para permitir recuperación contextual sin enviar todo el documento.",
  },
  {
    icon: BrainCircuit,
    title: "5. Lógica RAG liviana",
    body: "Cuando el usuario consulta, la función segura recibe intención y sesiones seleccionadas, tokeniza la intención, ordena chunks por coincidencias relevantes y construye un prompt compacto con 5 a 10 fragmentos antes de llamar a la IA.",
  },
  {
    icon: KeyRound,
    title: "6. Configuración de IA",
    body: "El costo de IA se deriva a la API configurada por el administrador. La API key nunca viaja al frontend público: se guarda y se usa únicamente desde funciones seguras de backend.",
  },
];

const dataModel = [
  ["user_roles", "Define roles seguros por user_id. No se guardan permisos en perfiles ni en localStorage."],
  ["congress_sessions", "Catálogo público de módulos, ponencias, ponentes, resúmenes, tags y orden."],
  ["transcripts", "Transcripción Markdown completa por sesión; solo administradores pueden gestionarla."],
  ["transcript_chunks", "Fragmentos buscables para reducir tokens y sostener el RAG liviano."],
  ["ai_settings", "Proveedor, endpoint, modelo, temperatura, tokens máximos y API key administrativa."],
  ["prompt_settings", "Prompt maestro, estilo de respuesta y aviso RAG visible al final de la respuesta."],
];

const AntigravityManual = () => {
  return (
    <main className="min-h-screen bg-ritual text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-8 md:px-8 md:py-12">
        <header className="flex flex-col gap-7 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent">Manual técnico sencillo</p>
            <h1 className="font-display text-4xl leading-tight md:text-6xl">Guía para Antigravity</h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
              Resumen de la lógica usada para crear la experiencia Human Shift, su panel administrador y la arquitectura de datos para consultas IA con bajo consumo de tokens.
            </p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver a la experiencia
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="border border-border bg-card/82 p-5 shadow-resonance backdrop-blur-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center border border-accent/35 bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-2xl leading-tight">{section.title}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{section.body}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="border border-border bg-panel p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Flujo de consulta</p>
            <h2 className="mt-3 font-display text-3xl">Cómo responde la Bitácora</h2>
            <ol className="mt-6 grid gap-4 text-sm leading-7 text-muted-foreground">
              <li>1. El visitante selecciona voces o ponencias desde la experiencia pública.</li>
              <li>2. Escribe su intención en el Portal de Articulación.</li>
              <li>3. El backend busca solo chunks vinculados a esas sesiones.</li>
              <li>4. Se calculan coincidencias semánticas simples por palabras relevantes.</li>
              <li>5. Se arma un prompt con intención, voces seleccionadas, prompt maestro y fragmentos.</li>
              <li>6. La IA responde con síntesis, tensiones, puentes y pregunta final.</li>
            </ol>
          </article>

          <article className="border border-border bg-card/82 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Modelo de datos</p>
            <h2 className="mt-3 font-display text-3xl">Tablas principales</h2>
            <div className="mt-6 grid gap-3">
              {dataModel.map(([name, description]) => (
                <div key={name} className="grid gap-2 border-l-2 border-accent/55 bg-muted/45 p-4 md:grid-cols-[180px_1fr]">
                  <strong className="font-mono text-sm text-foreground">{name}</strong>
                  <span className="text-sm leading-6 text-muted-foreground">{description}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="border border-primary/45 bg-primary/18 p-6 md:p-8">
          <h2 className="font-display text-3xl">Reglas clave para mantener la arquitectura</h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-muted-foreground md:grid-cols-2">
            <p>No exponer transcripciones completas, API keys ni prompts maestros en la interfaz pública.</p>
            <p>Validar el rol admin desde backend y conservar roles en tabla separada.</p>
            <p>No enviar todos los MD a la IA; recuperar y enviar solo fragmentos relevantes.</p>
            <p>Mantener la experiencia visual sobria: carbón, rojo institucional, acento dorado y lenguaje reflexivo.</p>
          </div>
        </section>
      </section>
    </main>
  );
};

export default AntigravityManual;