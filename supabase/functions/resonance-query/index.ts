import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const tokenize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\W+/).filter((word) => word.length > 3);

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
    supabase.from("transcript_chunks").select("content,session_id,token_estimate").in("session_id", sessionIds).limit(80),
  ]);

  const terms = new Set(tokenize(intention));
  const ranked = (chunks ?? [])
    .map((chunk) => ({ ...chunk, score: tokenize(chunk.content).reduce((acc, word) => acc + (terms.has(word) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const selectedContext = ranked.length
    ? ranked.map((chunk, index) => `[Fragmento ${index + 1}]\n${chunk.content}`).join("\n\n")
    : (sessions ?? []).map((session) => `[${session.speaker}] ${session.title}: ${session.summary}`).join("\n");

  const ragNotice = prompt?.rag_notice ?? "RAG Notice: respuesta generada cruzando la intención del usuario con las ponencias seleccionadas y los fragmentos disponibles.";
  const systemPrompt = `${prompt?.system_prompt ?? "Eres la Bitácora de Resonancia del congreso The Human Shift 2026."}\n\n${prompt?.style_prompt ?? "Responde con síntesis, tensiones, puentes y una pregunta final."}\n\n${ragNotice}`;
  const userPrompt = `Intención del usuario:\n${intention}\n\nVoces seleccionadas:\n${(sessions ?? []).map((s) => `- ${s.title} (${s.speaker})`).join("\n")}\n\nFragmentos disponibles:\n${selectedContext}`;

  if (!settings?.api_key || !settings?.base_url) {
    return json({ response: `Síntesis de resonancia\n\nLa arquitectura RAG está preparada, pero falta configurar la API en el módulo administrador.\n\nVoces seleccionadas:\n${(sessions ?? []).map((s) => `• ${s.title}`).join("\n")}\n\nCuando cargues las transcripciones Markdown y la API, la Bitácora cruzará tu intención con fragmentos reales.\n\n${ragNotice}` });
  }

  const aiRes = await fetch(settings.base_url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.api_key}` },
    body: JSON.stringify({ model: settings.model, temperature: settings.temperature, max_tokens: settings.max_tokens, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
  });
  const aiData = await aiRes.json().catch(() => null);
  const response = aiData?.choices?.[0]?.message?.content;
  if (!aiRes.ok || !response) return json({ error: "AI provider error", detail: aiData }, 502);
  return json({ response: `${response}\n\n${ragNotice}` });
});
