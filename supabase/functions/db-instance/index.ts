// Africa Cloud — real Postgres-backed "RDS-like" database instances.
// Each instance maps to a dedicated schema + role inside Lovable Cloud Postgres.
// Actions: provision, query, drop, info.
//
// Security model:
//   - Caller is authenticated via Supabase JWT.
//   - Ownership of the instance row is verified before every action.
//   - SQL is executed inside a transaction with:
//        SET LOCAL ROLE <per-instance role>
//        SET LOCAL search_path TO <schema>, pg_temp
//        SET LOCAL statement_timeout = '15s'
//     so the user can only touch their own schema.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Build a safe identifier suffix from a UUID.
const idSuffix = (uuid: string) => uuid.replace(/-/g, "").slice(0, 20);
const schemaFor = (uuid: string) => `db_${idSuffix(uuid)}`;
const roleFor = (uuid: string) => `dbrole_${idSuffix(uuid)}`;
// Postgres identifier quoting — backtick-free, using doubled quotes.
const qIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;

async function pgConnect(): Promise<Client> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not configured");
  const client = new Client(dbUrl);
  await client.connect();
  return client;
}

async function provision(instanceId: string) {
  const schema = schemaFor(instanceId);
  const role = roleFor(instanceId);
  const client = await pgConnect();
  try {
    // Create role (idempotent)
    await client.queryArray(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
           CREATE ROLE ${qIdent(role)} NOLOGIN;
         END IF;
       END $$;`,
    );
    await client.queryArray(`CREATE SCHEMA IF NOT EXISTS ${qIdent(schema)} AUTHORIZATION ${qIdent(role)};`);
    await client.queryArray(`GRANT USAGE, CREATE ON SCHEMA ${qIdent(schema)} TO ${qIdent(role)};`);
    // Make sure the role can NOT touch other schemas
    await client.queryArray(`REVOKE ALL ON SCHEMA public FROM ${qIdent(role)};`);
    return { schema, role };
  } finally {
    await client.end();
  }
}

async function drop(instanceId: string) {
  const schema = schemaFor(instanceId);
  const role = roleFor(instanceId);
  const client = await pgConnect();
  try {
    await client.queryArray(`DROP SCHEMA IF EXISTS ${qIdent(schema)} CASCADE;`);
    await client.queryArray(
      `DO $$ BEGIN
         IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
           DROP ROLE ${qIdent(role)};
         END IF;
       END $$;`,
    );
  } finally {
    await client.end();
  }
}

interface QueryResult {
  command: string;
  rowCount: number;
  fields: string[];
  rows: unknown[][];
  durationMs: number;
}

async function runQuery(schema: string, role: string, sql: string): Promise<QueryResult[]> {
  const client = await pgConnect();
  const results: QueryResult[] = [];
  try {
    await client.queryArray(`BEGIN`);
    await client.queryArray(`SET LOCAL ROLE ${qIdent(role)}`);
    await client.queryArray(`SET LOCAL search_path TO ${qIdent(schema)}, pg_temp`);
    await client.queryArray(`SET LOCAL statement_timeout = '15s'`);
    const started = Date.now();
    // deno-postgres' queryArray supports multi-statement when sent as a single query.
    const r = await client.queryArray(sql);
    const arr = Array.isArray(r) ? r : [r];
    for (const res of arr) {
      results.push({
        command: (res as any).command ?? "",
        rowCount: (res as any).rowCount ?? (res.rows?.length ?? 0),
        fields: ((res as any).rowDescription?.columns ?? []).map((c: any) => c.name),
        rows: (res.rows as unknown[][]) ?? [],
        durationMs: Date.now() - started,
      });
    }
    await client.queryArray(`COMMIT`);
    return results;
  } catch (e) {
    try { await client.queryArray(`ROLLBACK`); } catch { /* ignore */ }
    throw e;
  } finally {
    await client.end();
  }
}

async function tableInfo(schema: string, role: string) {
  const client = await pgConnect();
  try {
    const r = await client.queryObject<{ table_name: string; row_estimate: number }>(
      `SELECT c.relname AS table_name,
              c.reltuples::bigint AS row_estimate
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relkind IN ('r','p')
        ORDER BY c.relname`,
      [schema],
    );
    return r.rows;
  } finally {
    await client.end();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json(401, { error: "Unauthorized" });
    const userId = userRes.user.id;

    const body = await req.json();
    const { action, instance_id, sql } = body ?? {};
    if (!action || !instance_id) return json(400, { error: "action and instance_id required" });

    // Verify ownership
    const { data: inst, error: instErr } = await admin
      .from("database_instances")
      .select("*")
      .eq("id", instance_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (instErr) return json(500, { error: instErr.message });
    if (!inst) return json(404, { error: "Instance not found" });

    if (action === "provision") {
      const { schema, role } = await provision(instance_id);
      const conn = `postgresql://${role}@cloud.africloud.io/${schema}`;
      await admin
        .from("database_instances")
        .update({
          schema_name: schema,
          db_role: role,
          status: "running",
          connection_string: conn,
          updated_at: new Date().toISOString(),
        })
        .eq("id", instance_id);
      return json(200, { ok: true, schema, role, connection_string: conn });
    }

    if (action === "drop") {
      await drop(instance_id);
      return json(200, { ok: true });
    }

    if (action === "info") {
      const schema = inst.schema_name ?? schemaFor(instance_id);
      const role = inst.db_role ?? roleFor(instance_id);
      const tables = await tableInfo(schema, role);
      return json(200, { ok: true, schema, role, tables });
    }

    if (action === "query") {
      if (typeof sql !== "string" || !sql.trim()) {
        return json(400, { error: "sql required" });
      }
      if (inst.status !== "running" || !inst.schema_name || !inst.db_role) {
        return json(409, { error: "Instance not provisioned. Run provision first." });
      }
      const started = Date.now();
      try {
        const results = await runQuery(inst.schema_name, inst.db_role, sql);
        return json(200, { ok: true, results, durationMs: Date.now() - started });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return json(200, { ok: false, error: msg, durationMs: Date.now() - started });
      }
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { error: msg });
  }
});
