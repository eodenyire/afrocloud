// Africa Cloud — native Functions-as-a-Service runtime.
// Executes user-authored JavaScript inside the edge runtime with a hard
// timeout and captures logs. The code is imported as an ES module via a
// data: URL, so it runs in Deno's own isolate rather than a naive eval().
//
// Two request modes:
//   1. { action: "invoke", function_id, input }
//        -> requires JWT, must own the function, logs an invocation row.
//   2. Public HTTP invoke via GET/POST /functions/v1/fn-invoke?id=<function_id>
//        -> anonymous, still logged (owner recorded from the function row).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type FnRow = {
  id: string;
  user_id: string;
  code: string;
  timeout_ms: number;
  invocation_count: number;
};

async function loadHandler(code: string): Promise<(req: unknown) => unknown | Promise<unknown>> {
  const dataUrl = "data:application/javascript;base64," + btoa(unescape(encodeURIComponent(code)));
  const mod = await import(dataUrl);
  const handler = mod.default ?? mod.handler;
  if (typeof handler !== "function") {
    throw new Error("Function must export a default async handler");
  }
  return handler;
}

async function runWithTimeout(fn: () => Promise<unknown>, timeoutMs: number): Promise<unknown> {
  return await Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Function timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

async function executeFunction(row: FnRow, input: unknown, admin: ReturnType<typeof createClient>) {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalErr = console.error;
  const capture = (label: string) => (...args: unknown[]) => {
    logs.push(`[${label}] ${args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`);
  };
  console.log = capture("log") as typeof console.log;
  console.error = capture("err") as typeof console.error;

  const startedAt = performance.now();
  let status = "success";
  let result: unknown = null;
  let error: string | null = null;

  try {
    const handler = await loadHandler(row.code);
    result = await runWithTimeout(() => Promise.resolve(handler(input)), row.timeout_ms);
  } catch (e) {
    status = "error";
    error = (e as Error)?.message ?? String(e);
  } finally {
    console.log = originalLog;
    console.error = originalErr;
  }

  const durationMs = Math.round(performance.now() - startedAt);

  await admin.from("function_invocations").insert({
    function_id: row.id,
    user_id: row.user_id,
    status,
    duration_ms: durationMs,
    logs: logs.join("\n"),
    result: status === "success" ? (result as never) : null,
    error,
  });

  await admin
    .from("functions")
    .update({
      last_invoked_at: new Date().toISOString(),
      invocation_count: (row.invocation_count ?? 0) + 1,
      status: status === "success" ? "ready" : "errored",
    })
    .eq("id", row.id);

  return { status, duration_ms: durationMs, logs, result, error };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const publicId = url.searchParams.get("id");

    // Public HTTP invocation path
    if (publicId) {
      let input: unknown = null;
      if (req.method !== "GET") {
        try { input = await req.json(); } catch { /* empty body ok */ }
      } else {
        input = Object.fromEntries(url.searchParams.entries());
      }
      const { data: row, error } = await admin
        .from("functions")
        .select("id,user_id,code,timeout_ms,invocation_count")
        .eq("id", publicId)
        .maybeSingle();
      if (error || !row) return json(404, { error: "Function not found" });
      const out = await executeFunction(row as FnRow, input, admin);
      return json(out.status === "success" ? 200 : 500, out);
    }

    // Authenticated invoke path
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "Missing bearer token" });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json(401, { error: "Invalid token" });
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { action, function_id, input } = body ?? {};

    if (action !== "invoke") return json(400, { error: "Unknown action" });
    if (!function_id) return json(400, { error: "function_id required" });

    const { data: row, error: rowErr } = await admin
      .from("functions")
      .select("id,user_id,code,timeout_ms,invocation_count")
      .eq("id", function_id)
      .maybeSingle();
    if (rowErr || !row) return json(404, { error: "Function not found" });
    if (row.user_id !== userId) return json(403, { error: "Forbidden" });

    const out = await executeFunction(row as FnRow, input ?? null, admin);
    return json(200, out);
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
