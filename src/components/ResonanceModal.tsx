import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { CongressSession } from "@/lib/congressData";

interface ResonanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSessions: CongressSession[];
}

const buildFallback = (intention: string, selectedSessions: CongressSession[]) => {
  const voices = selectedSessions.map((session) => `• ${session.title}`).join("\n");
  return `Síntesis de resonancia\n\nTu intención abre una lectura entre ${selectedSessions.length || 0} voz/voz(es) seleccionadas. En esta versión de arquitectura, el sistema ya está preparado para cruzar tu pregunta con los Markdown cargados desde administración.\n\nVoces en escucha:\n${voices || "• Aún no has seleccionado ponencias"}\n\nTensiones emergentes\n• Cómo convertir tecnología en presencia y no solo en eficiencia.\n• Cómo sostener el cambio sin perder cuerpo, vínculo ni criterio.\n• Cómo pasar de inspiración a práctica organizacional concreta.\n\nPregunta de integración\n¿Qué decisión pequeña, visible y sostenida podría encarnar esta resonancia en tu contexto inmediato?\n\nRAG Notice: respuesta demostrativa generada con la arquitectura preparada; cuando cargues las transcripciones, se cruzará la intención del usuario con fragmentos reales seleccionados.`;
};

export const ResonanceModal = ({ open, onOpenChange, selectedSessions }: ResonanceModalProps) => {
  const [intention, setIntention] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => intention.trim().length > 8 && selectedSessions.length > 0, [intention, selectedSessions.length]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResponse("");

    const { data, error } = await supabase.functions.invoke("resonance-query", {
      body: { intention: intention.trim(), sessionIds: selectedSessions.map((session) => session.id) },
    });

    if (error || !data?.response) {
      setResponse(buildFallback(intention, selectedSessions));
    } else {
      setResponse(data.response);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-none border-border bg-popover/95 p-0 text-popover-foreground shadow-resonance backdrop-blur-xl">
        <div className="border-b border-border bg-primary/18 p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl md:text-4xl">Portal de Articulación</DialogTitle>
            <DialogDescription className="max-w-2xl text-muted-foreground">
              Escribe tu propia voz: una pregunta, tensión o intuición. La Bitácora cruzará esa intención con las ponencias seleccionadas.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-6 p-6 md:p-8">
          <div className="grid gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Voces seleccionadas</div>
            <div className="flex flex-wrap gap-2">
              {selectedSessions.length ? selectedSessions.map((session) => (
                <span key={session.id} className="border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {session.title}
                </span>
              )) : <span className="text-sm text-muted-foreground">Selecciona al menos una ponencia.</span>}
            </div>
          </div>

          <Textarea
            value={intention}
            onChange={(event) => setIntention(event.target.value.slice(0, 1200))}
            placeholder="Escribe aquí tu pregunta o resonancia..."
            className="min-h-36 rounded-none border-border bg-background/80 text-base leading-7"
          />

          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || loading} className="h-12 rounded-none">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Tejer sabiduría
          </Button>

          {response && (
            <div className="whitespace-pre-wrap border border-accent/30 bg-accent/8 p-5 text-sm leading-7 text-foreground">
              {response}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
