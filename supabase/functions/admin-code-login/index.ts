import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i++) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const configuredCodes = [
    { id: "fernanda", value: Deno.env.get("ADMIN_CODE_FERNANDA") },
    { id: "monica", value: Deno.env.get("ADMIN_CODE_MONICA") },
    { id: "camila", value: Deno.env.get("ADMIN_CODE_CAMILA") },
    { id: "admin", value: Deno.env.get("ADMIN_CODE_ADMIN") },
  ].filter((item): item is { id: string; value: string } => Boolean(item.value));
  const email = Deno.env.get("ADMIN_AUTH_EMAIL");
  const password = Deno.env.get("ADMIN_AUTH_PASSWORD");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (configuredCodes.length !== 4 || !email || !password || !supabaseUrl || !anonKey) {
    return json({ error: "A autenticação por código ainda não foi configurada no servidor." }, 503);
  }

  let code = "";
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code.trim() : "";
  } catch {
    return json({ error: "Solicitação inválida." }, 400);
  }

  if (!code || code.length > 128) return json({ error: "Código inválido." }, 401);

  const matched = configuredCodes.find((candidate) => constantTimeEqual(code, candidate.value));
  if (!matched) return json({ error: "Código inválido." }, 401);

  // A identidade é gravada em app_metadata pelo servidor antes da emissão do JWT.
  // O trigger SQL lê essa claim assinada; o navegador não pode escolher o responsável.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) return json({ error: "Configuração de auditoria incompleta no servidor." }, 503);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return json({ error: "Não foi possível localizar a conta administrativa." }, 503);
  const account = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!account) return json({ error: "A conta administrativa configurada não foi encontrada." }, 503);
  const { error: metadataError } = await adminClient.auth.admin.updateUserById(account.id, {
    app_metadata: { ...(account.app_metadata || {}), access_code_id: matched.id },
  });
  if (metadataError) return json({ error: "Não foi possível identificar o responsável pelo acesso." }, 503);

  // As credenciais reais do usuário administrador ficam somente nos secrets do servidor.
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return json({ error: "Não foi possível iniciar a sessão administrativa. Verifique a conta configurada no servidor." }, 503);
  }

  return json({ session: data.session, actor: matched.id });
});
