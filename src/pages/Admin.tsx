import { useEffect, useMemo, useState } from "react";
import { Database, FileText, KeyRound, LogOut, Save, Settings2 } from "lucide-react";
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

type AiSettings = { provider: string; base_url: string; model: string; api_key: string; temperature: number; max_tokens: number };
type PromptSettings = { system_prompt: string; style_prompt: string; rag_notice: string };

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
  const [ai, setAi] = useState<AiSettings>({ provider: "openai-compatible", base_url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", api_key: "", temperature: 0.55, max_tokens: 1400 });
  const [prompt, setPrompt] = useState<PromptSettings>({ system_prompt: "", style_prompt: "", rag_notice: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Sessions are managed in code — use fallbackSessions, not DB.
      const [{ data: aiData }, { data: promptData }] = await Promise.all([
        supabase.from("ai_settings").select("provider,base_url,model,api_key,temperature,max_tokens").maybeSingle(),
        supabase.from("prompt_settings").select("system_prompt,style_prompt,rag_notice").maybeSingle(),
      ]);
      if (aiData) setAi({ ...aiData, base_url: aiData.base_url ?? "", api_key: aiData.api_key ?? "" });
      if (promptData) setPrompt(promptData);
    };
    load();
  }, []);

  const selectedMeta = useMemo(() => sessions.find((session) => session.id === selectedSession), [sessions, selectedSession]);

  const saveTranscript = async () => {
    if (!selectedSession || markdown.trim().length < 20) return;
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
    } else {
      toast({ title: "No se pudo guardar", description: error?.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const saveAi = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("ai_settings").upsert({ ...ai, updated_by: userData.user?.id, singleton: true }, { onConflict: "singleton" });
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
            <div className="mb-6 flex items-start gap-3"><Database className="mt-1 h-5 w-5 text-accent" /><div><h2 className="font-display text-3xl">Cargar transcripción por ponencia</h2><p className="text-sm text-muted-foreground">Pega el contenido Markdown cuando tengas los archivos. Se fragmentará para reducir tokens.</p></div></div>
            <div className="grid gap-5">
              <div className="grid gap-2"><Label>Ponencia</Label><Select value={selectedSession} onValueChange={setSelectedSession}><SelectTrigger className="rounded-none"><SelectValue placeholder="Selecciona una ponencia" /></SelectTrigger><SelectContent>{sessions.map((session) => <SelectItem key={session.id} value={session.id}>{session.module_title} · {session.title}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Nombre de archivo</Label><Input value={filename} onChange={(event) => setFilename(event.target.value)} placeholder={selectedMeta?.markdown_filename ?? "transcripcion.md"} className="rounded-none" /></div>
              <div className="grid gap-2"><Label>Contenido Markdown</Label><Textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} className="min-h-72 rounded-none font-mono text-sm" placeholder="# Título\n\nPega aquí la transcripción..." /></div>
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
