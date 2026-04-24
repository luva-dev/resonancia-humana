import { useEffect, useMemo, useState } from "react";
import { Database, FileText, KeyRound, LogOut, Save, Settings2, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CongressSession } from "@/lib/congressData";
import { fallbackSessions } from "@/lib/congressData";

type AiSettings = { provider: string; base_url: string; model: string; api_key: string; temperature: number; max_tokens: number; has_api_key: boolean };
type PromptSettings = { system_prompt: string; style_prompt: string; rag_notice: string };
type TranscriptStatus = { id: string; session_id: string; markdown_filename: string | null; updated_at: string; chunk_count: number };

const chunkMarkdown = (content: string) => {
  const clean = content.replace(/\r/g, "").trim();
  const size = 1800;
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += size) chunks.push(clean.slice(i, i + size));
  return chunks.filter(Boolean);
};

const AdminContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CongressSession[]>(fallbackSessions);
  const [selectedSession, setSelectedSession] = useState("");
  const [filename, setFilename] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [ai, setAi] = useState<AiSettings>({ provider: "openai-compatible", base_url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", api_key: "", temperature: 0.55, max_tokens: 1400, has_api_key: false });
  const [prompt, setPrompt] = useState<PromptSettings>({ system_prompt: "", style_prompt: "", rag_notice: "" });
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptStatus>>({});
  const [saving, setSaving] = useState(false);

  const loadTranscriptStatus = async () => {
    const [{ data: transcriptRows }, { data: chunkRows }] = await Promise.all([
      supabase.from("transcripts").select("id,session_id,markdown_filename,updated_at").eq("status", "loaded"),
      supabase.from("transcript_chunks").select("transcript_id"),
    ]);
    const counts = (chunkRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.transcript_id] = (acc[row.transcript_id] ?? 0) + 1;
      return acc;
    }, {});
    setTranscripts(Object.fromEntries((transcriptRows ?? []).map((row) => [row.session_id, { ...row, chunk_count: counts[row.id] ?? 0 }])));
  };

  useEffect(() => {
    const load = async () => {
      const [{ data: sessionData, error: sessionError }, { data: aiResponse }, { data: promptData }] = await Promise.all([
        supabase.from("congress_sessions").select("id,module_id,module_title,title,speaker,summary,tags,markdown_filename,sort_order").order("sort_order", { ascending: true }),
        supabase.functions.invoke("admin-ai-settings", { method: "GET" }),
        supabase.from("prompt_settings").select("system_prompt,style_prompt,rag_notice").maybeSingle(),
      ]);
      if (sessionData?.length) setSessions(sessionData);
      if (sessionError) toast({ title: "No se pudieron cargar las ponencias", description: "Se mostrará la lista local de respaldo.", variant: "destructive" });
      if (aiResponse?.data) setAi({ ...aiResponse.data, base_url: aiResponse.data.base_url ?? "", api_key: "", has_api_key: Boolean(aiResponse.data.has_api_key) });
      if (promptData) setPrompt(promptData);
      await loadTranscriptStatus();
    };
    load();
  }, [toast]);

  const selectedMeta = useMemo(() => sessions.find((session) => session.id === selectedSession), [sessions, selectedSession]);
  const selectedTranscript = selectedSession ? transcripts[selectedSession] : undefined;

  const handleSessionChange = (value: string) => {
    setSelectedSession(value);
    setFilename("");
    setMarkdown("");
  };

  const loadMarkdownFile = async (file?: File) => {
    if (!file) return;
    const isMarkdown = file.name.toLowerCase().endsWith(".md") || file.type === "text/markdown" || file.type === "text/plain";
    if (!isMarkdown) {
      toast({ title: "Archivo no compatible", description: "Carga únicamente archivos Markdown con extensión .md.", variant: "destructive" });
      return;
    }
    const content = await file.text();
    setFilename(file.name);
    setMarkdown(content);
    toast({ title: "Markdown listo", description: `${file.name} fue cargado para asociarlo a una ponencia.` });
  };

  const saveTranscript = async () => {
    if (!selectedSession) {
      toast({ title: "Selecciona primero una ponencia", description: "La lista desplegable define a qué ponencia se asociará el Markdown.", variant: "destructive" });
      return;
    }
    if (!filename || markdown.trim().length < 20) {
      toast({ title: "Carga un archivo Markdown", description: "Arrastra o selecciona un archivo .md antes de guardar.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const chunks = chunkMarkdown(markdown);
    const { data: transcript, error } = await supabase
      .from("transcripts")
      .upsert({ session_id: selectedSession, markdown_content: markdown, markdown_filename: filename || selectedMeta?.markdown_filename, status: "loaded", uploaded_by: userData.user?.id }, { onConflict: "session_id" })
      .select("id")
      .single();

    if (!error && transcript) {
      await supabase.from("transcript_chunks").delete().eq("transcript_id", transcript.id);
      await supabase.from("transcript_chunks").insert(chunks.map((content, index) => ({ transcript_id: transcript.id, session_id: selectedSession, chunk_index: index, content, keywords: content.toLowerCase().split(/\W+/).filter((w) => w.length > 5).slice(0, 18), token_estimate: Math.ceil(content.length / 4) })));
      toast({ title: "Transcripción cargada", description: `${chunks.length} fragmentos preparados para RAG.` });
      setMarkdown("");
      setFilename("");
      await loadTranscriptStatus();
    } else {
      toast({ title: "No se pudo guardar la transcripción", description: "Revisa que hayas seleccionado una ponencia válida y vuelve a intentarlo.", variant: "destructive" });
    }
    setSaving(false);
  };

  const saveAi = async () => {
    const { data, error } = await supabase.functions.invoke("admin-ai-settings", {
      method: "POST",
      body: { provider: ai.provider, base_url: ai.base_url, model: ai.model, api_key: ai.api_key, temperature: ai.temperature, max_tokens: ai.max_tokens },
    });
    if (!error && data?.data) setAi({ ...data.data, base_url: data.data.base_url ?? "", api_key: "", has_api_key: Boolean(data.data.has_api_key) });
    toast({ title: error ? "No se pudo guardar" : "Configuración IA guardada", description: error?.message ?? "La API queda lista para llamadas seguras desde backend.", variant: error ? "destructive" : "default" });
  };

  const savePrompt = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("prompt_settings").upsert({ ...prompt, updated_by: userData.user?.id, singleton: true }, { onConflict: "singleton" });
    toast({ title: error ? "No se pudo guardar" : "Prompt maestro guardado", description: error?.message ?? "La Bitácora usará estas instrucciones.", variant: error ? "destructive" : "default" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-ritual px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Administración discreta</p>
            <h1 className="font-display text-4xl">Bitácora de Resonancia</h1>
          </div>
          <Button type="button" variant="outline" onClick={signOut} className="rounded-none"><LogOut className="h-4 w-4" /> Salir</Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs defaultValue="transcripts" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 rounded-none border border-border bg-card p-1 sm:grid-cols-3">
            <TabsTrigger value="transcripts" className="rounded-none"><FileText className="mr-2 h-4 w-4" /> Carga Markdown</TabsTrigger>
            <TabsTrigger value="api" className="rounded-none"><KeyRound className="mr-2 h-4 w-4" /> API</TabsTrigger>
            <TabsTrigger value="prompt" className="rounded-none"><Settings2 className="mr-2 h-4 w-4" /> Prompt</TabsTrigger>
          </TabsList>

          <TabsContent value="transcripts" className="mt-6 border border-border bg-card p-6">
            <div className="mb-6 flex items-start gap-3"><Database className="mt-1 h-5 w-5 text-accent" /><div><h2 className="font-display text-3xl">Cargar transcripción por ponencia</h2><p className="text-sm text-muted-foreground">Selecciona la ponencia y arrastra su archivo .md. Se fragmentará para reducir tokens.</p></div></div>
            <div className="grid gap-5">
              <div className="grid gap-2"><Label>Ponencia</Label><Select value={selectedSession} onValueChange={handleSessionChange}><SelectTrigger className="rounded-none"><SelectValue placeholder="Selecciona una ponencia" /></SelectTrigger><SelectContent>{sessions.map((session) => { const loaded = transcripts[session.id]; return <SelectItem key={session.id} value={session.id}>{loaded ? "[Cargado]" : "[Sin MD]"} {session.speaker} · {session.title}</SelectItem>; })}</SelectContent></Select></div>
              <div className="grid gap-3 border border-border bg-background/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Ponencia seleccionada</p>
                    <p className="mt-1 font-display text-xl">{selectedMeta ? `${selectedMeta.speaker} — ${selectedMeta.title}` : "Ninguna"}</p>
                  </div>
                  <span className={`w-fit border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${selectedTranscript ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>{selectedTranscript ? "Cargado" : "Sin MD"}</span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p><span className="block text-xs uppercase tracking-[0.18em] text-accent/80">Archivo cargado</span>{selectedTranscript?.markdown_filename ?? "Ninguno"}</p>
                  <p><span className="block text-xs uppercase tracking-[0.18em] text-accent/80">Fragmentos</span>{selectedTranscript?.chunk_count ?? 0}</p>
                  <p><span className="block text-xs uppercase tracking-[0.18em] text-accent/80">Última actualización</span>{selectedTranscript ? new Date(selectedTranscript.updated_at).toLocaleString("es") : "—"}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Archivo Markdown</Label>
                <label
                  htmlFor="markdown-upload"
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => { event.preventDefault(); setIsDragging(false); loadMarkdownFile(event.dataTransfer.files?.[0]); }}
                  className={`flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 border border-dashed p-8 text-center transition-colors ${isDragging ? "border-accent bg-accent/10" : "border-border bg-background/40"}`}
                >
                  <UploadCloud className="h-10 w-10 text-accent" />
                  <div>
                    <p className="font-display text-2xl">Arrastra aquí el .md</p>
                    <p className="mt-2 text-sm text-muted-foreground">o selecciona el archivo desde tu equipo</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Archivo pendiente: {filename || "ninguno"}</span>
                </label>
                <Input id="markdown-upload" type="file" accept=".md,text/markdown,text/plain" onChange={(event) => loadMarkdownFile(event.target.files?.[0])} className="sr-only" />
              </div>
              <Button type="button" onClick={saveTranscript} disabled={saving || !selectedSession || markdown.trim().length < 20} className="rounded-none"><Save className="h-4 w-4" /> Guardar y fragmentar</Button>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-6 border border-border bg-card p-6">
            <h2 className="font-display text-3xl">Configuración de API</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="grid gap-2"><Label>Proveedor</Label><Input value={ai.provider} onChange={(e) => setAi({ ...ai, provider: e.target.value })} className="rounded-none" /></div>
              <div className="grid gap-2"><Label>Modelo</Label><Input value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} className="rounded-none" /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Endpoint base</Label><Input value={ai.base_url} onChange={(e) => setAi({ ...ai, base_url: e.target.value })} className="rounded-none" /></div>
              <div className="grid gap-2 md:col-span-2"><Label>API key</Label><Input type="password" value={ai.api_key} onChange={(e) => setAi({ ...ai, api_key: e.target.value })} className="rounded-none" /></div>
              <div className="grid gap-2"><Label>Temperatura</Label><Input type="number" step="0.05" value={ai.temperature} onChange={(e) => setAi({ ...ai, temperature: Number(e.target.value) })} className="rounded-none" /></div>
              <div className="grid gap-2"><Label>Máximo de tokens</Label><Input type="number" value={ai.max_tokens} onChange={(e) => setAi({ ...ai, max_tokens: Number(e.target.value) })} className="rounded-none" /></div>
            </div>
            <Button type="button" onClick={saveAi} className="mt-6 rounded-none"><Save className="h-4 w-4" /> Guardar API</Button>
          </TabsContent>

          <TabsContent value="prompt" className="mt-6 border border-border bg-card p-6">
            <h2 className="font-display text-3xl">Prompt maestro</h2>
            <div className="mt-6 grid gap-5">
              <div className="grid gap-2"><Label>Sistema</Label><Textarea value={prompt.system_prompt} onChange={(e) => setPrompt({ ...prompt, system_prompt: e.target.value })} className="min-h-36 rounded-none" /></div>
              <div className="grid gap-2"><Label>Estilo</Label><Textarea value={prompt.style_prompt} onChange={(e) => setPrompt({ ...prompt, style_prompt: e.target.value })} className="min-h-28 rounded-none" /></div>
              <div className="grid gap-2"><Label>RAG Notice</Label><Textarea value={prompt.rag_notice} onChange={(e) => setPrompt({ ...prompt, rag_notice: e.target.value })} className="min-h-20 rounded-none" /></div>
              <Button type="button" onClick={savePrompt} className="rounded-none"><Save className="h-4 w-4" /> Guardar prompt</Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

const Admin = () => <AdminGate><AdminContent /></AdminGate>;

export default Admin;
