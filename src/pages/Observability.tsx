import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { Cloud, RefreshCw, Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useResourcePoller } from "@/hooks/useResourcePoller";

type Resource = {
  id: string;
  name: string;
  resource_type: string;
  provider: string;
  region: string | null;
  status: string;
  updated_at: string | null;
};

type Operation = {
  id: string;
  operation_type: string;
  status: string;
  created_at: string | null;
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  running: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  active: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  available: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  provisioning: <Clock className="h-4 w-4 text-primary" />,
  deploying: <Clock className="h-4 w-4 text-primary" />,
  queued: <Clock className="h-4 w-4 text-primary" />,
  stopped: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  failed: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const STATUS_COLORS: Record<string, string> = {
  running: "text-green-400 bg-green-400/10",
  active: "text-green-400 bg-green-400/10",
  available: "text-green-400 bg-green-400/10",
  provisioning: "text-primary bg-primary/10",
  deploying: "text-primary bg-primary/10",
  stopped: "text-muted-foreground bg-secondary",
  failed: "text-destructive bg-destructive/10",
};

const Observability = () => {
  const { user, loading } = useAuth();
  const { organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchData = useCallback(async () => {
    if (!organization?.id) return;
    setFetching(true);
    const [resResult, opsResult] = await Promise.all([
      supabase
        .from("resources")
        .select("*")
        .eq("org_id", organization.id)
        .order("updated_at", { ascending: false })
        .limit(50),
      supabase
        .from("resource_operations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    setResources((resResult.data as Resource[]) ?? []);
    setOperations((opsResult.data as Operation[]) ?? []);
    setFetching(false);
  }, [organization?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useResourcePoller(user?.id, fetchData);

  const TYPES = ["all", "compute", "database", "storage", "edge", "network", "load-balancer", "dns"];
  const filtered = filter === "all" ? resources : resources.filter((r) => r.resource_type === filter);

  const healthSummary = {
    healthy: resources.filter((r) => ["running", "active", "available"].includes(r.status)).length,
    degraded: resources.filter((r) => ["provisioning", "deploying"].includes(r.status)).length,
    failed: resources.filter((r) => r.status === "failed").length,
    total: resources.length,
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <ConsoleLayout
      title="Observability"
      actions={
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={fetching} className="gap-2">
          <RefreshCw className={`h-3 w-3 ${fetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Health Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Resources", value: healthSummary.total, color: "text-foreground" },
            { label: "Healthy", value: healthSummary.healthy, color: "text-green-400" },
            { label: "Provisioning", value: healthSummary.degraded, color: "text-primary" },
            { label: "Failed", value: healthSummary.failed, color: "text-destructive" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Resource health grid */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-primary" /> Resource Health
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-2 py-1 text-xs rounded-full border transition-all ${
                      filter === t
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources found.</p>
            ) : (
              filtered.map((res) => (
                <div key={res.id} className="flex flex-wrap items-center gap-3 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {STATUS_ICONS[res.status] ?? <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{res.name}</p>
                      <p className="text-xs text-muted-foreground">{res.resource_type} · {res.provider} · {res.region ?? "global"}</p>
                    </div>
                  </div>
                  <span
                    className={`ml-auto text-xs px-2 py-1 rounded-full ${STATUS_COLORS[res.status] ?? "text-muted-foreground bg-secondary"}`}
                  >
                    {res.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {res.updated_at?.split("T")[0]}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" /> Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {operations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No operations yet.</p>
            ) : (
              operations.map((op) => (
                <div key={op.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{op.operation_type}</p>
                    <p className="text-xs text-muted-foreground">{op.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[op.status] ?? "text-muted-foreground bg-secondary"}`}>
                      {op.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{op.created_at?.split("T")[0]}</span>
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

export default Observability;
