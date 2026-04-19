import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { listCostRecords } from "@/lib/controlPlane";
import { Receipt, ArrowLeft } from "lucide-react";

type CostRecord = {
  id: string;
  resource_type: string | null;
  amount_usd: number;
  usage_unit: string;
  usage_quantity: number;
  created_at: string | null;
};

const Billing = () => {
  const { user, loading } = useAuth();
  const { organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [records, setRecords] = useState<CostRecord[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchCosts = async () => {
    if (!organization?.id) return;
    const { data } = await listCostRecords(organization.id);
    setRecords((data as CostRecord[]) || []);
  };

  useEffect(() => {
    if (organization?.id) fetchCosts();
  }, [organization?.id]);

  const total = useMemo(() => records.reduce((sum, record) => sum + (record.amount_usd || 0), 0), [records]);

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Receipt className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/console")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Receipt className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Billing & Usage</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Month-to-date spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground">${total.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Aggregated from control-plane cost records.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent cost records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cost records yet.</p>
            ) : (
              records.map((record) => (
                <div key={record.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{record.resource_type || "resource"}</p>
                    <p className="text-xs text-muted-foreground">{record.created_at?.split("T")[0]}</p>
                  </div>
                  <div className="text-sm text-foreground">
                    ${record.amount_usd.toFixed(2)} · {record.usage_quantity} {record.usage_unit}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
