import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";

const ADMIN_EMAIL = "luva@equilibria.lat";
const ADMIN_PASSWORD = "Equilibria2025!";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
    return json({ error: "Invalid bootstrap credentials" }, 403);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: existingRoles, error: rolesError } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);

  if (rolesError) return json({ error: "Could not verify admin role" }, 500);

  const { data: usersData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return json({ error: "Could not inspect users" }, 500);

  const existingUser = usersData.users.find((user) => user.email?.toLowerCase() === ADMIN_EMAIL);

  if (existingRoles?.length && existingUser) {
    await admin.auth.admin.updateUserById(existingUser.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    return json({ ok: true, status: "already_prepared" });
  }

  let userId = existingUser?.id;
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) return json({ error: "Could not update admin user" }, 500);
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error || !created.user) return json({ error: "Could not create admin user" }, 500);
    userId = created.user.id;
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  if (roleError) return json({ error: "Could not assign admin role" }, 500);

  return json({ ok: true, status: "prepared" });
});
