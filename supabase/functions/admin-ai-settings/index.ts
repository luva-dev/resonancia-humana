import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const normalizeSettings = (row: Record<string, unknown> | null) => ({
  provider: row?.provider ?? "openai-compatible",
  base_url: row?.base_url ?? "",
  model: row?.model ?? "gpt-4o-mini",
  temperature: row?.temperature ?? 0.55,
  max_tokens: row?.max_tokens ?? 1400,
  has_api_key: Boolean(row?.api_key),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return json({ error: "Admin required" }, 403);
  if (req.method === "GET") {
    const { data } = await supabase.from("ai_settings").select("provider,base_url,model,api_key,temperature,max_tokens").maybeSingle();
    return json({ data: normalizeSettings(data) });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => null);
  const apiKey = typeof body?.api_key === "string" ? body.api_key.trim() : "";
  const payload: Record<string, unknown> = {
    provider: typeof body?.provider === "string" ? body.provider.trim().slice(0, 80) : "openai-compatible",
    base_url: typeof body?.base_url === "string" ? body.base_url.trim().slice(0, 500) : null,
    model: typeof body?.model === "string" ? body.model.trim().slice(0, 120) : "gpt-4o-mini",
    temperature: Number.isFinite(Number(body?.temperature)) ? Number(body.temperature) : 0.55,
    max_tokens: Number.isFinite(Number(body?.max_tokens)) ? Math.max(1, Math.floor(Number(body.max_tokens))) : 1400,
    singleton: true,
  };
  if (apiKey) payload.api_key = apiKey;

  const { data, error } = await supabase.from("ai_settings").upsert(payload, { onConflict: "singleton" }).select("provider,base_url,model,api_key,temperature,max_tokens").single();
  if (error) return json({ error: "Could not save AI settings" }, 500);
  return json({ data: normalizeSettings(data) });
});
