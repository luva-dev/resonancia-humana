import { CheckSquare2, Download, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CongressModule } from "@/lib/congressData";

interface ModuleAccordionProps {
  modules: CongressModule[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onDownload: (sessionId: string, filename: string | null | undefined) => void;
}

/** Maps module_id to the official block label shown in the header */
const BLOCK_LABELS: Record<string, string> = {
  "modulo-0": "BLOQUE 0 — EL COACHING HOY",
  "modulo-1": "BLOQUE 1 — LIDERAZGO HUMANO",
  "modulo-2": "BLOQUE 2 — CULTURAS QUE EVOLUCIONAN",
  "modulo-3": "BLOQUE 3 — ORGANIZACIONES QUE INSPIRAN",
};

export const ModuleAccordion = ({ modules, selectedIds, onToggle, onDownload }: ModuleAccordionProps) => {
  return (
    <section id="voces" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Programa Oficial · Día 2
          </p>
          <h2 className="font-display text-3xl text-foreground md:text-5xl">
            Ponencias del Congreso
          </h2>
        </div>
      </div>

      {/* Blocks */}
      <div className="grid gap-6">
        {modules.map((module, blockIndex) => {
          const blockLabel =
            BLOCK_LABELS[module.id] ??
            `BLOQUE ${blockIndex} — ${module.title.toUpperCase()}`;

          const allSelected = module.sessions.every((s) =>
            selectedIds.includes(s.id)
          );
          const someSelected = module.sessions.some((s) =>
            selectedIds.includes(s.id)
          );

          const toggleAll = () => {
            module.sessions.forEach((s) => {
              const isSelected = selectedIds.includes(s.id);
              if (!allSelected && !isSelected) onToggle(s.id);
              if (allSelected && isSelected) onToggle(s.id);
            });
          };

          return (
            <div
              key={module.id}
              className="overflow-hidden border border-border shadow-resonance"
            >
              {/* ── Block header ── */}
              <div className="flex items-center justify-between gap-4 bg-primary px-5 py-4 md:px-8">
                <span className="font-display text-sm font-bold uppercase tracking-[0.25em] text-accent md:text-base">
                  {blockLabel}
                </span>
                {/* Select-all toggle */}
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent/70 transition-colors hover:text-accent md:text-sm"
                >
                  {allSelected ? (
                    <CheckSquare2 className="h-4 w-4" />
                  ) : someSelected ? (
                    <CheckSquare2 className="h-4 w-4 opacity-50" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {allSelected ? "Desmarcar bloque" : "Seleccionar bloque"}
                </button>
              </div>

              {/* ── Intention sub-header ── */}
              {module.intention && (
                <div className="border-b border-border bg-muted/30 px-5 py-3 md:px-8">
                  <p className="text-sm leading-6 text-muted-foreground italic md:text-base">
                    {module.intention}
                  </p>
                </div>
              )}

              {/* ── Sessions list ── */}
              <div className="divide-y divide-border bg-card/70 backdrop-blur-sm">
                {module.sessions.map((session) => {
                  const active = selectedIds.includes(session.id);
                  return (
                    <div
                      key={session.id}
                      className={`flex flex-col gap-6 px-5 py-6 transition-colors md:flex-row md:items-center md:gap-8 md:px-8 ${
                        active ? "bg-accent/5" : "hover:bg-muted/20"
                      }`}
                    >
                      {/* ── Checkbox (left) ── */}
                      <button
                        type="button"
                        onClick={() => onToggle(session.id)}
                        aria-label={`Seleccionar ponencia: ${session.title}`}
                        className={`mt-1 shrink-0 self-start transition-colors ${
                          active
                            ? "text-accent"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                        }`}
                      >
                        {active ? (
                          <CheckSquare2 className="h-6 w-6" />
                        ) : (
                          <Square className="h-6 w-6" />
                        )}
                      </button>

                      {/* ── Session info (center) ── */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onToggle(session.id)}
                      >
                        {/* Speaker name — prominent */}
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent mb-1 md:text-base">
                          {session.speaker}
                        </p>
                        {/* Talk title */}
                        <p className="text-lg font-semibold leading-tight text-foreground md:text-xl">
                          {session.title}
                        </p>
                        {/* Summary */}
                        {session.summary && (
                          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground/80 md:text-base">
                            {session.summary}
                          </p>
                        )}
                        {/* Tags */}
                        {session.tags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {session.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] uppercase tracking-widest text-accent/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── Transcript status + download (right) ── */}
                      <div className="grid w-full shrink-0 gap-2 md:w-60">
                        <span className={`border px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] ${session.transcript_loaded ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>
                          {session.transcript_loaded ? "Transcripción disponible" : "Transcripción pendiente"}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!session.transcript_loaded}
                          onClick={() =>
                            onDownload(session.id, session.transcript_filename ?? session.markdown_filename)
                          }
                          className="h-12 w-full rounded-none text-sm md:text-base"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar transcripción
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
