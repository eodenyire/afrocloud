import { supabase } from "@/integrations/supabase/client";

export type SqlResult = {
  command: string;
  rowCount: number;
  fields: string[];
  rows: unknown[][];
  durationMs: number;
};

export type QueryResponse =
  | { ok: true; results: SqlResult[]; durationMs: number }
  | { ok: false; error: string; durationMs: number };

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("db-instance", { body });
  if (error) throw error;
  return data as any;
};

export const provisionDatabase = (instanceId: string) =>
  invoke({ action: "provision", instance_id: instanceId });

export const dropDatabase = (instanceId: string) =>
  invoke({ action: "drop", instance_id: instanceId });

export const databaseInfo = (instanceId: string) =>
  invoke({ action: "info", instance_id: instanceId }) as Promise<{
    ok: boolean;
    schema: string;
    role: string;
    tables: { table_name: string; row_estimate: number }[];
  }>;

export const runDatabaseQuery = (instanceId: string, sql: string): Promise<QueryResponse> =>
  invoke({ action: "query", instance_id: instanceId, sql });
