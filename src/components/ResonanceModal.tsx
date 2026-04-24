import { useMemo, useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { Download, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { CongressSession } from "@/lib/congressData";

interface ResonanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSessions: CongressSession[];
  initialIntention?: string;
}

const ERROR_MESSAGE = "Hubo una desconexión temporal al consultar la bitácora. Por favor, inténtalo de nuevo.";

export const ResonanceModal = ({ open, onOpenChange, selectedSessions, initialIntention = "" }: ResonanceModalProps) => {
  const [intention, setIntention] = useState(initialIntention);
  const [response, setResponse] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync if the parent updates the initial intention (user typed in sticky bar)
  useMemo(() => { setIntention(initialIntention); }, [initialIntention]);

  const canSubmit = useMemo(() => intention.trim().length >= 5 && selectedSessions.length > 0, [intention, selectedSessions.length]);

  const downloadWord = async () => {
    if (!response) return;

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Arial", size: 24 } } },
        paragraphStyles: [
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
          { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 } },
        ],
      },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Bitácora de Resonancia")] }),
          new Paragraph({ children: [new TextRun(`Fecha: ${new Date().toLocaleDateString("es-ES")}`)] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Intención")] }),
          new Paragraph({ children: [new TextRun(intention.trim())] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Ponencias seleccionadas")] }),
          ...selectedSessions.map((session) => new Paragraph({ children: [new TextRun(`${session.speaker} — ${session.title}`)] })),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Respuesta generada")] }),
          ...response.split("\n").filter((line) => line.trim().length > 0).map((line) => new Paragraph({ children: [new TextRun(line)] })),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Aviso RAG")] }),
          new Paragraph({ children: [new TextRun("Respuesta generada a partir de la intención del usuario y las ponencias seleccionadas disponibles en la Bitácora.")] }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bitacora-resonancia-${new Date().toISOString().slice(0, 10)}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResponse("");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("resonance-query", {
        body: { intention: intention.trim(), sessionIds: selectedSessions.map((session) => session.id) },
      });

      if (error || !data?.response) {
        setErrorMessage(ERROR_MESSAGE);
      } else {
        setResponse(data.response);
      }
    } catch {
      setErrorMessage(ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
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

          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tu intención o pregunta de cruce</span>
              <span className={`text-xs tabular-nums ${intention.length >= 190 ? "text-destructive" : "text-muted-foreground"}`}>
                {intention.length}/200
              </span>
            </div>
            <Textarea
              value={intention}
              onChange={(event) => setIntention(event.target.value.slice(0, 200))}
              placeholder="¿Qué quieres explorar, comparar o integrar entre estas ponencias?"
              className="min-h-28 rounded-none border-border bg-background/80 text-base leading-7"
            />
          </div>

          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || loading} className="h-12 rounded-none">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Tejer sabiduría
          </Button>

          {loading && (
            <div className="flex items-center gap-3 border border-accent/30 bg-accent/8 p-5 text-sm leading-7 text-muted-foreground">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" />
              <span>Tejiendo saberes. Por favor, mantén la presencia unos segundos...</span>
            </div>
          )}

          {errorMessage && (
            <div className="border border-destructive/40 bg-destructive/10 p-5 text-sm leading-7 text-foreground">
              {errorMessage}
            </div>
          )}

          {response && (
            <div className="grid gap-3">
              <div className="border border-accent/30 bg-accent/8 p-5 text-sm leading-7 text-foreground">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="mb-4 font-display text-3xl leading-tight text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-3 mt-6 font-display text-2xl leading-tight text-foreground">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold text-accent">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6">{children}</ol>,
                    strong: ({ children }) => <strong className="font-semibold text-accent">{children}</strong>,
                    em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
              <Button type="button" variant="outline" onClick={downloadWord} className="justify-self-start rounded-none">
                <Download className="h-4 w-4" /> Descargar Word
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
