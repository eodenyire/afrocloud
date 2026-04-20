import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { listCostRecords } from "@/lib/controlPlane";
import { Cloud, Receipt, TrendingUp } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";

type CostRecord = {
  id: string;
  resource_type: string | null;
  amount_usd: number;
  usage_unit: string;
  usage_quantity: number;
  created_at: string | null;
};

const RESOURCE_COLORS: Record<string, string> = {
  compute: "text-blue-400",
  database: "text-purple-400",
  storage: "text-yellow-400",
  edge: "text-green-400",
  network: "text-cyan-400",
  "load-balancer": "text-orange-400",
  dns: "text-pink-400",
};

const Billing = () => {
  const { user, loading } = useAuth();
  const { organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [records, setRecords] = useState<CostRecord[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchCosts = useCallback(async () => {
    if (!organization?.id) return;
    const { data } = await listCostRecords(organization.id);
    setRecords((data as CostRecord[]) || []);
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.id) fetchCosts();
  }, [organization?.id, fetchCosts]);

  const total = useMemo(() => records.reduce((sum, r) => sum + (r.amount_usd || 0), 0), [records]);

  // Breakdown by resource type
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      const k = r.resource_type ?? "other";
      map[k] = (map[k] ?? 0) + r.amount_usd;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [records]);

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <ConsoleLayout title="Billing">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Month-to-date spend</p>
                  <p className="text-2xl font-heading font-bold text-foreground">${total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Billable resources</p>
                  <p className="text-2xl font-heading font-bold text-foreground">{records.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg. cost / resource</p>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    ${records.length ? (total / records.length).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost by type */}
        {breakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cost by resource type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {breakdown.map(([type, amount]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-24 capitalize ${RESOURCE_COLORS[type] ?? "text-muted-foreground"}`}>
                    {type}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (amount / total) * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground w-16 text-right">${amount.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cost records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cost records yet.</p>
            ) : (
              records.map((record) => (
                <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{record.resource_type || "resource"}</p>
                    <p className="text-xs text-muted-foreground">{record.created_at?.split("T")[0]}</p>
                  </div>
                  <div className="text-sm text-foreground">
                    <span className="text-primary font-semibold">${record.amount_usd.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">{record.usage_quantity} {record.usage_unit}</span>
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

export default Billing;
