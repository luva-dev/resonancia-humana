import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Cog, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModuleAccordion } from "@/components/ModuleAccordion";
import { ResonanceModal } from "@/components/ResonanceModal";
import { supabase } from "@/integrations/supabase/client";
import { fallbackSessions, groupSessions, type CongressSession } from "@/lib/congressData";

const Index = () => {
  const [sessions, setSessions] = useState<CongressSession[]>(fallbackSessions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("congress_sessions")
        .select("id,module_id,module_title,title,speaker,summary,tags,markdown_filename,sort_order")
        .order("sort_order", { ascending: true });

      if (data?.length) setSessions(data as CongressSession[]);

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data: adminData } = await supabase.rpc("is_admin");
        setIsAdmin(Boolean(adminData));
      }
    };

    load();
  }, []);

  const modules = useMemo(() => groupSessions(sessions), [sessions]);
  const selectedSessions = useMemo(() => sessions.filter((session) => selectedIds.includes(session.id)), [sessions, selectedIds]);

  const toggleSession = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-ritual">
        <div className="absolute inset-x-0 top-0 h-px bg-accent/40" />
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 border border-accent/50 bg-primary/60" />
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

        <div className="relative z-10 mx-auto grid min-h-[78vh] max-w-6xl content-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-accent">Luz densa · escucha técnica · sentido humano</p>
            <h1 className="font-display text-5xl leading-[0.98] text-balance text-foreground md:text-7xl">
              Bitácora de Resonancia
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
              Un espacio para tejer lo que emerge entre las ponencias, tu propia pregunta y la memoria viva del congreso.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-none px-7">
                <a href="#voces"><ArrowDown className="h-4 w-4" /> Explorar voces</a>
              </Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(true)} className="h-12 rounded-none px-7">
                <Sparkles className="h-4 w-4" /> Tejer sabiduría
              </Button>
            </div>
          </div>

          <div className="grid content-end gap-4 border-l border-accent/30 pl-6">
            {[
              ["01", "Explora módulos"],
              ["02", "Selecciona voces"],
              ["03", "Escribe tu propia voz"],
              ["04", "Recibe el reporte de resonancia"],
            ].map(([number, label]) => (
              <div key={number} className="grid grid-cols-[3.5rem_1fr] items-center border-b border-border py-4">
                <span className="font-display text-3xl text-accent">{number}</span>
                <span className="text-sm uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ModuleAccordion modules={modules} selectedIds={selectedIds} onToggle={toggleSession} />

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/90 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedSessions.length} voz/voz(es) seleccionadas para el campo de escucha.
          </p>
          <Button type="button" onClick={() => setModalOpen(true)} disabled={!selectedSessions.length} className="rounded-none">
            <Sparkles className="h-4 w-4" /> Tejer Sabiduría
          </Button>
        </div>
      </div>

      <ResonanceModal open={modalOpen} onOpenChange={setModalOpen} selectedSessions={selectedSessions} />
    </main>
  );
};

export default Index;
