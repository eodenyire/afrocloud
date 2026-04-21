import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getComputeStatus, getDatabaseStatus } from "@/lib/providerApi";

const POLL_INTERVAL_MS = 12000;

/**
 * Syncs resource status against the configured provider control-plane.
 * No local status simulation is performed.
 */
export const useResourcePoller = (userId: string | undefined, onRefresh: () => void) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncCompute = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("virtual_machines")
      .select("id, status, ip_address, tags")
      .eq("user_id", userId)
      .not("tags", "is", null);

    await Promise.all((data ?? []).map(async (vm) => {
      const providerId = (vm.tags as Record<string, unknown> | null)?.provider_id as string | undefined;
      if (!providerId) return;
      try {
        const provider = await getComputeStatus(providerId);
        if (provider.status !== vm.status || (provider.public_ip ?? provider.private_ip ?? null) !== vm.ip_address) {
          await supabase
            .from("virtual_machines")
            .update({
              status: provider.status,
              ip_address: provider.public_ip ?? provider.private_ip ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", vm.id);
        }
      } catch {
        // Keep local status untouched if provider lookup fails.
      }
    }));
  }, [userId]);

  const syncDatabases = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("database_instances")
      .select("id, status, connection_string, tags")
      .eq("user_id", userId)
      .not("tags", "is", null);

    await Promise.all((data ?? []).map(async (db) => {
      const providerId = (db.tags as Record<string, unknown> | null)?.provider_id as string | undefined;
      if (!providerId) return;
      try {
        const provider = await getDatabaseStatus(providerId);
        if (provider.status !== db.status || provider.connection_string !== db.connection_string) {
          await supabase
            .from("database_instances")
            .update({
              status: provider.status,
              connection_string: provider.connection_string,
              port: provider.port,
              updated_at: new Date().toISOString(),
            })
            .eq("id", db.id);
        }
      } catch {
        // Keep local status untouched if provider lookup fails.
      }
    }));
  }, [userId]);

  const syncResources = useCallback(async () => {
    await Promise.all([syncCompute(), syncDatabases()]);
    onRefresh();
  }, [onRefresh, syncCompute, syncDatabases]);

  useEffect(() => {
    if (!userId) return;

    syncResources();
    timerRef.current = setInterval(syncResources, POLL_INTERVAL_MS);

    const channel = supabase.channel(`resource-updates-${userId}`);
    ["virtual_machines", "database_instances", "storage_buckets", "edge_nodes", "vpcs"].forEach((table) => {
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` } as never,
        () => {
          syncResources();
          onRefresh();
        }
      );
    });

    channel.subscribe();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [onRefresh, syncResources, userId]);
};
