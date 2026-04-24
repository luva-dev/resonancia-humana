import { useMemo, useState } from "react";
import { AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat, Packer, PageNumber, Paragraph, ShadingType, TextRun } from "docx";
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
const REPORT_TEXT = "1F1C18";
const REPORT_MUTED = "4A433D";
const REPORT_PAPER = "F8F1E7";
const REPORT_PANEL = "EFE4D4";
const REPORT_ACCENT = "7A4E3A";

const cleanReportMarkdown = (value: string) => value
  .replace(/\n{0,2}(?:MANDATO DE VERDAD|RAG Notice|Aviso RAG)[\s\S]*$/i, "")
  .split("\n")
  .map((line) => line.trimEnd())
  .filter((line) => !/^\s*(?:-{3,}|\*{3,}|_{3,}|\/{3,}|={3,})\s*$/.test(line))
  .join("\n")
  .trim();

const inlineMarkdownToRuns = (text: string, size = 24, boldBase = false) => {
  const runs: TextRun[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > cursor) runs.push(new TextRun({ text: text.slice(cursor, match.index), size, color: REPORT_TEXT, font: "Georgia", bold: boldBase }));
    const token = match[0];
    const isStrong = token.startsWith("**");
    runs.push(new TextRun({ text: token.replace(/^\*\*?|\*\*?$/g, ""), size, color: REPORT_TEXT, font: "Georgia", bold: boldBase || isStrong, italics: !isStrong }));
    cursor = match.index! + token.length;
  }
  if (cursor < text.length) runs.push(new TextRun({ text: text.slice(cursor), size, color: REPORT_TEXT, font: "Georgia", bold: boldBase }));
  return runs.length ? runs : [new TextRun({ text, size, color: REPORT_TEXT, font: "Georgia", bold: boldBase })];
};

const markdownToDocxParagraphs = (markdown: string) => cleanReportMarkdown(markdown).split("\n").reduce<Paragraph[]>((items, rawLine) => {
  const line = rawLine.trim();
  if (!line) return items;
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  const bullet = line.match(/^[-*]\s+(.+)$/);
  const number = line.match(/^\d+[.)]\s+(.+)$/);
  if (heading) {
    items.push(new Paragraph({ heading: heading[1].length === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2, children: inlineMarkdownToRuns(heading[2], heading[1].length === 1 ? 32 : 28, true) }));
  } else if (bullet) {
    items.push(new Paragraph({ numbering: { reference: "report-bullets", level: 0 }, spacing: { after: 90 }, children: inlineMarkdownToRuns(bullet[1], 23) }));
  } else if (number) {
    items.push(new Paragraph({ numbering: { reference: "report-numbers", level: 0 }, spacing: { after: 90 }, children: inlineMarkdownToRuns(number[1], 23) }));
  } else {
    items.push(new Paragraph({ spacing: { after: 180 }, children: inlineMarkdownToRuns(line, 23) }));
  }
  return items;
}, []);

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
    const reportBody = markdownToDocxParagraphs(response);

    const doc = new Document({
      background: { color: REPORT_PAPER },
      numbering: {
        config: [
          { reference: "report-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
          { reference: "report-numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ],
      },
      styles: {
        default: { document: { run: { font: "Georgia", size: 23, color: REPORT_TEXT }, paragraph: { spacing: { line: 320 } } } },
        paragraphStyles: [
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: "Georgia", color: REPORT_TEXT }, paragraph: { spacing: { before: 300, after: 180 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: REPORT_ACCENT, space: 6 } } } },
          { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Georgia", color: REPORT_TEXT }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
        ],
      },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, right: 1260, bottom: 1200, left: 1260 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8C7B4", space: 4 } }, children: [new TextRun({ text: "The Human Shift · Bitácora de Resonancia", size: 18, color: REPORT_MUTED, font: "Georgia" })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Página ", size: 18, color: REPORT_MUTED, font: "Georgia" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: REPORT_MUTED, font: "Georgia" })] })] }) },
        children: [
          new Paragraph({ shading: { fill: REPORT_PANEL, type: ShadingType.CLEAR }, spacing: { before: 120, after: 80 }, children: [new TextRun({ text: "Bitácora de Resonancia", size: 42, bold: true, color: REPORT_TEXT, font: "Georgia" })] }),
          new Paragraph({ shading: { fill: REPORT_PANEL, type: ShadingType.CLEAR }, spacing: { after: 260 }, children: [new TextRun({ text: "Informe ejecutivo de síntesis", size: 24, color: REPORT_MUTED, font: "Georgia" })] }),
          new Paragraph({ children: [new TextRun({ text: `Fecha: ${new Date().toLocaleDateString("es-ES")}`, size: 21, color: REPORT_MUTED, font: "Georgia" })] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Intención del usuario")] }),
          new Paragraph({ shading: { fill: "FBF7F0", type: ShadingType.CLEAR }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: REPORT_ACCENT, space: 8 } }, spacing: { before: 80, after: 220 }, children: inlineMarkdownToRuns(intention.trim(), 23) }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Ponencias seleccionadas")] }),
          ...selectedSessions.map((session) => new Paragraph({ numbering: { reference: "report-bullets", level: 0 }, children: [new TextRun({ text: `${session.speaker} — ${session.title}`, size: 22, color: REPORT_TEXT, font: "Georgia" })] })),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Síntesis ejecutiva")] }),
          ...reportBody,
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Nota metodológica")] }),
          new Paragraph({ shading: { fill: "FBF7F0", type: ShadingType.CLEAR }, spacing: { before: 80, after: 100 }, children: [new TextRun({ text: "Síntesis generada a partir de la intención del usuario y las ponencias seleccionadas disponibles en la Bitácora.", size: 21, color: REPORT_MUTED, font: "Georgia" })] }),
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
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Voces seleccionadas</div>
              {selectedSessions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedSessions.length} ponencia{selectedSessions.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {selectedSessions.length ? (
              <div className="max-h-56 overflow-y-auto pr-1">
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedSessions.map((session) => (
                    <div key={session.id} className="border border-border bg-muted/35 p-3">
                      <p className="text-sm font-semibold leading-5 text-foreground">{session.speaker}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{session.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Selecciona al menos una ponencia.</span>
            )}
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
