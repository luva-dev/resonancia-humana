import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Cog, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AccessGate } from "@/components/AccessGate";
import { Textarea } from "@/components/ui/textarea";
import { ModuleAccordion } from "@/components/ModuleAccordion";
import { ResonanceModal } from "@/components/ResonanceModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fallbackSessions, groupSessions, type CongressSession } from "@/lib/congressData";

const Index = () => {
  const { toast } = useToast();
  const legalNotice = "AVISO LEGAL Y DE PRIVACIDAD: Esta landing page es una herramienta demostrativa creada por Equilibria para amplificar los mensajes del evento. La propiedad intelectual y los derechos de todo el contenido aquí presentado pertenecen exclusivamente a ACOPP y a los ponentes respectivos. Prohibida su distribución o uso comercial sin autorización expresa. Esta versión es temporal y de acceso restringido.";
  const [sessions, setSessions] = useState<CongressSession[]>(fallbackSessions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [showSelectedDetail, setShowSelectedDetail] = useState(false);
  const [intention, setIntention] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: sessionRows }, { data: transcriptRows }] = await Promise.all([
        supabase
        .from("congress_sessions")
        .select("id,module_id,module_title,title,speaker,summary,tags,markdown_filename,sort_order")
        .order("sort_order", { ascending: true }),
        supabase
          .from("transcripts")
          .select("session_id,markdown_filename,updated_at")
          .eq("status", "loaded"),
      ]);
      const transcriptBySession = Object.fromEntries((transcriptRows ?? []).map((row) => [row.session_id, row]));
      if (sessionRows?.length) {
        setSessions(sessionRows.map((session) => ({
          ...session,
          transcript_filename: transcriptBySession[session.id]?.markdown_filename ?? null,
          transcript_updated_at: transcriptBySession[session.id]?.updated_at ?? null,
          transcript_loaded: Boolean(transcriptBySession[session.id]),
        })));
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data: adminData } = await supabase.rpc("is_admin");
        setIsAdmin(Boolean(adminData));
      }
    };
    load();
  }, []);

  // Close FAB panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    if (fabOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [fabOpen]);

  const modules = useMemo(() => groupSessions(sessions), [sessions]);
  const selectedSessions = useMemo(
    () => sessions.filter((s) => selectedIds.includes(s.id)),
    [sessions, selectedIds]
  );
  const selectedGroups = useMemo(() => {
    const grouped = new Map<string, CongressSession[]>();
    selectedSessions.forEach((session) => {
      const moduleTitle = session.module_title || "Ponencias seleccionadas";
      grouped.set(moduleTitle, [...(grouped.get(moduleTitle) ?? []), session]);
    });
    return Array.from(grouped.entries()).map(([moduleTitle, items]) => ({ moduleTitle, items }));
  }, [selectedSessions]);

  const toggleSession = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleDownload = async (sessionId: string, filename: string | null | undefined) => {
    const { data, error } = await supabase
      .from("transcripts")
      .select("markdown_content, markdown_filename")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error || !data?.markdown_content) {
      toast({
        title: "Transcripción no disponible",
        description: "El administrador aún no ha cargado esta ponencia.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([data.markdown_content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = data.markdown_filename || filename || "transcripcion.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleTejer = () => {
    setFabOpen(false);
    setModalOpen(true);
  };

  return (
    <AccessGate legalNotice={legalNotice}>
    <main className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-[70] border-b border-accent/25 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-[0.24em] text-accent">Aviso</span>
          <p className="text-sm leading-6 text-foreground/90 md:text-[15px] md:leading-7">{legalNotice}</p>
        </div>
      </div>

      <section className="relative overflow-hidden bg-ritual">
        <div className="absolute inset-x-0 top-0 h-px bg-accent/40" />
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-accent/50 bg-primary/60 font-display text-lg text-accent">E</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">The Human Shift 2026</p>
              <p className="text-sm text-muted-foreground">Bitácora de Resonancia</p>
            </div>
          </div>
          <Link
            to={isAdmin ? "/admin" : "/auth"}
            className="flex h-10 w-10 items-center justify-center border border-border bg-background/25 text-muted-foreground transition-colors hover:text-accent"
            aria-label="Administración"
          >
            <Cog className="h-4 w-4" />
          </Link>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[78vh] max-w-6xl content-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl flex flex-col justify-center">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.4em] text-accent">Congreso Human Shift 2026 · Bitácora con IA</p>
            <h1 className="font-display text-6xl leading-[1] text-balance text-foreground md:text-8xl">
              Bitácora de Resonancia
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-muted-foreground md:text-2xl">
              Explora las voces del congreso, descarga sus transcripciones o utiliza nuestra Inteligencia Artificial para tejer una síntesis de sabiduría personalizada.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="h-14 rounded-none px-10 text-lg">
                <a href="#voces"><ArrowDown className="mr-2 h-5 w-5" /> Explorar ponencias</a>
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6 border-l border-accent/30 pl-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-accent mb-2">Manual de Uso</p>
            {[
              ["01", "Explora los bloques temáticos del programa"],
              ["02", "SELECCIONA LAS PONENCIAS QUE DESEAS CRUZAR"],
              ["03", "LA IA TEJERÁ SABIDURÍA BASADA EN TU INTENCIÓN"],
              ["04", "PUEDES ELEGIR BLOQUES DE PONENCIAS SI LO DESEAS"],
            ].map(([number, label]) => (
              <div key={number} className="grid grid-cols-[4rem_1fr] items-center border-b border-border py-5 group transition-colors hover:border-accent/50">
                <span className="font-display text-4xl text-accent/80 group-hover:text-accent transition-colors">{number}</span>
                <span className="text-lg font-medium uppercase tracking-[0.12em] text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
              </div>
            ))}
            <div className="mt-4 p-4 border border-accent/20 bg-accent/5">
              <p className="text-sm leading-6 text-muted-foreground italic">
                Usa el botón flotante <span className="text-accent not-italic font-bold">✦ Tejer sabiduría</span> en la esquina inferior derecha para activar el motor de IA una vez seleccionadas tus ponencias.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ModuleAccordion
        modules={modules}
        selectedIds={selectedIds}
        onToggle={toggleSession}
        onDownload={handleDownload}
      />

      {/* ── Floating Action Button + Panel ── */}
      <div ref={fabRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Floating panel — shown when fabOpen */}
        {fabOpen && (
          <div className="w-80 border border-border bg-background shadow-resonance backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Tejer sabiduría</span>
              </div>
              <button
                type="button"
                onClick={() => setFabOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel body */}
            <div className="grid gap-3 p-4">
              {/* Selected count */}
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${selectedSessions.length > 0 ? "text-accent" : "text-muted-foreground"}`}>
                {selectedSessions.length === 0
                  ? "Selecciona al menos una ponencia"
                  : `${selectedSessions.length} ponencia${selectedSessions.length > 1 ? "s" : ""} seleccionada${selectedSessions.length > 1 ? "s" : ""}`}
              </p>

              {/* Selected session chips */}
              {selectedSessions.length > 0 && (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between border border-border bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {selectedGroups.length} bloque{selectedGroups.length > 1 ? "s" : ""} temático{selectedGroups.length > 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSelectedDetail((value) => !value)}
                      className="text-xs font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:text-foreground"
                    >
                      {showSelectedDetail ? "Ocultar detalle" : "Ver detalle"}
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto pr-1">
                    <div className="grid gap-3">
                      {selectedGroups.map((group) => (
                        <div key={group.moduleTitle} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                            {group.moduleTitle}
                          </p>
                          {showSelectedDetail ? (
                            <div className="grid gap-2">
                              {group.items.map((session) => (
                                <div key={session.id} className="grid gap-0.5">
                                  <span className="text-sm font-medium leading-5 text-foreground">{session.speaker}</span>
                                  <span className="text-xs leading-4 text-muted-foreground">{session.title}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm leading-6 text-foreground">
                              {group.items.map((session) => session.speaker).join(" · ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Intention textarea */}
              <div className="grid gap-1">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">¿Qué quieres integrar?</span>
                  <span className={`text-xs tabular-nums ${intention.length >= 190 ? "text-destructive" : "text-muted-foreground"}`}>
                    {intention.length}/200
                  </span>
                </div>
                <Textarea
                  value={intention}
                  onChange={(e) => setIntention(e.target.value.slice(0, 200))}
                  placeholder="Escribe tu pregunta o intención..."
                  className="min-h-[80px] resize-none rounded-none border-border bg-muted/30 text-sm leading-5"
                  rows={3}
                />
              </div>

              {/* CTA */}
              <Button
                type="button"
                onClick={handleTejer}
                disabled={!selectedSessions.length || intention.trim().length < 5}
                className="w-full rounded-none"
              >
                <Sparkles className="h-4 w-4" /> Tejer sabiduría
              </Button>
            </div>
          </div>
        )}

        {/* FAB trigger button */}
        <button
          type="button"
          id="fab-tejer"
          onClick={() => setFabOpen((v) => !v)}
          className={`flex items-center gap-2 border px-4 py-3 text-sm font-semibold uppercase tracking-widest shadow-resonance transition-all duration-200 backdrop-blur-sm
            ${selectedSessions.length > 0
              ? "border-accent bg-primary text-accent hover:bg-primary/80"
              : "border-border bg-background/80 text-muted-foreground hover:text-accent"
            }`}
        >
          <Sparkles className="h-4 w-4" />
          {selectedSessions.length > 0 ? `${selectedSessions.length} listas · Tejer` : "Tejer sabiduría"}
        </button>
      </div>

      <ResonanceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedSessions={selectedSessions}
        initialIntention={intention}
      />
    </main>
    </AccessGate>
  );
};

export default Index;
