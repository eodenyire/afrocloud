import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { listAuditLogs } from "@/lib/controlPlane";
import { Cloud, Search, X } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";

type AuditLog = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string | null;
  user_id: string;
  details: Record<string, unknown> | null;
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-400 bg-green-400/10",
  delete: "text-destructive bg-destructive/10",
  update: "text-primary bg-primary/10",
  read: "text-muted-foreground bg-secondary",
};

const getActionColor = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find((k) => action.includes(k));
  return ACTION_COLORS[key ?? "read"];
};

const AuditLogs = () => {
  const { user, loading } = useAuth();
  const { organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchLogs = useCallback(async () => {
    if (!organization?.id) return;
    const { data } = await listAuditLogs(organization.id);
    setLogs((data as AuditLog[]) || []);
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.id) fetchLogs();
  }, [organization?.id, fetchLogs]);

  const types = ["all", ...Array.from(new Set(logs.map((l) => l.resource_type ?? "other")))];

  const filtered = logs.filter((log) => {
    const matchesType = typeFilter === "all" || log.resource_type === typeFilter;
    const matchesSearch =
      !search.trim() ||
      log.action.includes(search.toLowerCase()) ||
      (log.resource_type ?? "").includes(search.toLowerCase()) ||
      (log.resource_id ?? "").includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <ConsoleLayout title="Audit Logs">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by action, type, or resource ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-1 text-xs rounded-full border transition-all ${
                  typeFilter === t
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events match your filters.</p>
            ) : (
              filtered.map((log) => (
                <div key={log.id} className="flex flex-wrap items-start gap-3 border border-border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      {log.resource_type && (
                        <span className="text-xs text-muted-foreground capitalize">{log.resource_type}</span>
                      )}
                    </div>
                    {log.resource_id && (
                      <p className="text-xs text-muted-foreground font-mono">{log.resource_id}</p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.entries(log.details)
                          .slice(0, 3)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{log.created_at?.split("T")[0]}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.user_id.slice(0, 8)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </ConsoleLayout>
  );
};

export default AuditLogs;
