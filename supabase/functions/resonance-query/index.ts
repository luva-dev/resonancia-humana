import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const tokenize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\W+/).filter((word) => word.length > 3);

const LOVABLE_CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

const buildChatUrl = (baseUrl: string) => {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  if (/\/openai$/i.test(trimmed)) return `${trimmed}/chat/completions`;
  return trimmed;
};

const cleanAiResponse = (value: string) => value
  .replace(/\n{0,2}(?:MANDATO DE VERDAD|RAG Notice|Aviso RAG)[\s\S]*$/i, "")
  .split("\n")
  .filter((line) => !/^\s*(?:-{3,}|\*{3,}|_{3,}|\/{3,}|={3,})\s*$/.test(line))
  .join("\n")
  .trim();

const isLegacyGeminiModel = (model = "") => /(^models\/|gemini-1\.5-pro)/i.test(model.trim());

const normalizeModel = (model: string | null | undefined, targetUrl: string) => {
  const raw = (model ?? "").trim();
  if (!raw || isLegacyGeminiModel(raw)) return targetUrl.includes("ai.gateway.lovable.dev") ? DEFAULT_MODEL : "gemini-2.5-flash";
  if (targetUrl.includes("ai.gateway.lovable.dev") && raw.startsWith("gemini-")) return `google/${raw}`;
  return raw;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => null);
  const intention = typeof body?.intention === "string" ? body.intention.trim().slice(0, 1200) : "";
  const sessionIds = Array.isArray(body?.sessionIds) ? body.sessionIds.filter((id: unknown) => typeof id === "string").slice(0, 12) : [];
  if (intention.length < 8 || !sessionIds.length) return json({ error: "Intención y sesiones requeridas" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const [{ data: settings }, { data: prompt }, { data: sessions }, { data: chunks }] = await Promise.all([
    supabase.from("ai_settings").select("provider,base_url,model,api_key,temperature,max_tokens").maybeSingle(),
    supabase.from("prompt_settings").select("system_prompt,style_prompt,rag_notice").maybeSingle(),
    supabase.from("congress_sessions").select("id,title,speaker,summary").in("id", sessionIds),
    supabase.from("transcript_chunks").select("content,session_id,token_estimate").in("session_id", sessionIds).limit(120),
  ]);

  const terms = new Set(tokenize(intention));
  const ranked = (chunks ?? [])
    .map((chunk) => ({ ...chunk, score: tokenize(chunk.content).reduce((acc, word) => acc + (terms.has(word) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const sessionById = new Map((sessions ?? []).map((session) => [session.id, session]));
  const selectedContext = ranked.length
    ? ranked.map((chunk, index) => {
        const session = sessionById.get(chunk.session_id);
        return `[Fragmento ${index + 1} · ${session?.speaker ?? "Ponente"} · ${session?.title ?? "Ponencia seleccionada"}]\n${chunk.content}`;
      }).join("\n\n")
    : (sessions ?? []).map((session) => `[${session.speaker}] ${session.title}: ${session.summary}`).join("\n");

  const ragNotice = prompt?.rag_notice ?? "RAG Notice: respuesta generada cruzando la intención del usuario con las ponencias seleccionadas y los fragmentos disponibles.";
  const systemPrompt = `${prompt?.system_prompt ?? "Eres la Bitácora de Resonancia del congreso The Human Shift 2026."}\n\n${prompt?.style_prompt ?? "Responde con síntesis, tensiones, puentes y una pregunta final."}\n\n${ragNotice}`;
  const userPrompt = `Intención del usuario:\n${intention}\n\nVoces seleccionadas:\n${(sessions ?? []).map((s) => `- ${s.title} (${s.speaker})`).join("\n")}\n\nFragmentos disponibles:\n${selectedContext}`;

  const shouldUseLovable = Boolean(Deno.env.get("LOVABLE_API_KEY")) && (!settings?.base_url || settings.base_url.includes("ai.gateway.lovable.dev") || isLegacyGeminiModel(settings.model));
  const targetUrl = shouldUseLovable ? LOVABLE_CHAT_URL : buildChatUrl(settings?.base_url ?? "");
  const apiKey = shouldUseLovable ? Deno.env.get("LOVABLE_API_KEY") : settings?.api_key;
  const model = normalizeModel(settings?.model, targetUrl);

  if (!apiKey || !targetUrl) return json({ error: "AI settings not configured" }, 503);
  if (!chunks?.length) return json({ error: "No transcript context found for selected sessions" }, 404);

  const aiRes = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: settings?.temperature ?? 0.55, max_tokens: settings?.max_tokens ?? 1400, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
  });
  const aiData = await aiRes.json().catch(() => null);
  const response = aiData?.choices?.[0]?.message?.content;
  if (!aiRes.ok || !response) return json({ error: "AI provider error", detail: aiData }, aiRes.status === 402 || aiRes.status === 429 ? aiRes.status : 502);
  return json({ response: cleanAiResponse(response) });
});
