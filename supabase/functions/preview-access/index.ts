import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const USERNAME = Deno.env.get("PREVIEW_GATE_USERNAME") ?? "";
const PASSWORD = Deno.env.get("PREVIEW_GATE_PASSWORD") ?? "";
const SESSION_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "preview-fallback-secret";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64Url = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const timingSafeEqual = (left: string, right: string) => {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.length !== rightBytes.length) return false;
  let diff = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }
  return diff === 0;
};

const sign = async (payload: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
};

const createToken = async () => {
  const payload = JSON.stringify({ gate: "equilibria-preview", exp: Date.now() + TOKEN_TTL_MS });
  const encodedPayload = toBase64Url(encoder.encode(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifyToken = async (token: string) => {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = await sign(encodedPayload);
  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload)));
    return payload?.gate === "equilibria-preview" && typeof payload?.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
};

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!USERNAME || !PASSWORD) {
    return json({ error: "Preview gate secrets not configured" }, 503);
  }

  const body = await parseBody(req);
  if (!body || typeof body.action !== "string") {
    return json({ error: "Invalid request body" }, 400);
  }

  if (body.action === "login") {
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password || username.length > 80 || password.length > 200) {
      return json({ authorized: false, error: "Invalid credentials format" }, 400);
    }

    const authorized = timingSafeEqual(username, USERNAME) && timingSafeEqual(password, PASSWORD);
    if (!authorized) return json({ authorized: false }, 403);

    return json({ authorized: true, token: await createToken() });
  }

  if (body.action === "verify") {
    const token = typeof body.token === "string" ? body.token : "";
    if (!token || token.length > 1000) return json({ authorized: false }, 400);
    return json({ authorized: await verifyToken(token) });
  }

  return json({ error: "Unsupported action" }, 400);
});