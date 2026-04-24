import { CheckCircle2, Circle, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CongressModule } from "@/lib/congressData";

interface ModuleAccordionProps {
  modules: CongressModule[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const ModuleAccordion = ({ modules, selectedIds, onToggle }: ModuleAccordionProps) => {
  return (
    <section id="voces" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-accent">Mapa de ponencias</p>
          <h2 className="font-display text-3xl text-foreground md:text-5xl">Selecciona las voces que quieres cruzar</h2>
        </div>
        <div className="max-w-sm text-sm leading-6 text-muted-foreground">
          Cada selección define el campo de escucha para la Bitácora. Cuando cargues los Markdown, el sistema consultará solo los fragmentos relevantes.
        </div>
      </div>

      <div className="grid gap-4">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="overflow-hidden border border-border bg-card/70 shadow-resonance backdrop-blur-sm">
            <div className="grid gap-4 border-b border-border bg-muted/35 p-5 md:grid-cols-[auto_1fr] md:p-6">
              <div className="flex h-12 w-12 items-center justify-center border border-accent/40 bg-accent/10 text-accent">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Módulo {moduleIndex}</p>
                <h3 className="mt-1 font-display text-2xl text-foreground md:text-3xl">{module.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{module.intention}</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {module.sessions.map((session) => {
                const active = selectedIds.includes(session.id);
                return (
                  <article key={session.id} className="grid gap-4 p-5 transition-colors hover:bg-muted/20 md:grid-cols-[1fr_auto] md:p-6">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-none border border-border bg-secondary/80 text-secondary-foreground">
                          {session.speaker}
                        </Badge>
                        {session.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>
                        ))}
                      </div>
                      <h4 className="text-lg font-semibold text-foreground">{session.title}</h4>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{session.summary}</p>
                    </div>
                    <Button
                      type="button"
                      variant={active ? "default" : "outline"}
                      onClick={() => onToggle(session.id)}
                      className="w-full rounded-none md:w-44"
                    >
                      {active ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      {active ? "Seleccionada" : "Escuchar"}
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
