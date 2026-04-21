import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const PROVISIONING_DELAY_MS = 4000;

/**
 * Polls virtual_machines, database_instances, storage_buckets, edge_nodes, vpcs
 * and transitions any "provisioning" / "deploying" resources to "running" /
 * "available" after a short delay, mimicking async provisioning completion.
 *
 * Also subscribes to Supabase Realtime so the parent can refresh UI on change.
 */
export const useResourcePoller = (userId: string | undefined, onRefresh: () => void) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const simulateProvisioning = useCallback(async () => {
    if (!userId) return;

    const tables = [
      { table: "virtual_machines", field: "provisioning", next: "running" },
      { table: "database_instances", field: "provisioning", next: "running" },
      { table: "edge_nodes", field: "deploying", next: "running" },
      { table: "vpcs", field: "provisioning", next: "available" },
      { table: "load_balancers", field: "provisioning", next: "active" },
      { table: "storage_buckets", field: "provisioning", next: "active" },
    ] as const;

    const updates = tables.map(({ table, field, next }) =>
      supabase
        .from(table)
        .update({ status: next, updated_at: new Date().toISOString() } as never)
        .eq("user_id", userId)
        .eq("status", field)
    );

    await Promise.all(updates);
    onRefresh();
  }, [userId, onRefresh]);

  useEffect(() => {
    if (!userId) return;

    // Simulate async provisioning completion on a cadence.
    simulateProvisioning();
    timerRef.current = setInterval(simulateProvisioning, PROVISIONING_DELAY_MS);

    // Realtime channel – react to any row changes from this user
    const channel = supabase.channel(`resource-updates-${userId}`);

    const tables = [
      "virtual_machines",
      "database_instances",
      "storage_buckets",
      "edge_nodes",
      "vpcs",
    ] as const;

    tables.forEach((table) => {
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` } as never,
        () => {
          // React quickly when a resource changes while still keeping interval safety net.
          simulateProvisioning();
          onRefresh();
        }
      );
    });

    channel.subscribe();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId, simulateProvisioning, onRefresh]);
};
