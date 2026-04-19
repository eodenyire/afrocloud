import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { listAuditLogs } from "@/lib/controlPlane";
import { BookOpenCheck, ArrowLeft } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string | null;
  user_id: string;
};

const AuditLogs = () => {
  const { user, loading } = useAuth();
  const { organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchLogs = async () => {
    if (!organization?.id) return;
    const { data } = await listAuditLogs(organization.id);
    setLogs((data as AuditLog[]) || []);
  };

  useEffect(() => {
    if (organization?.id) fetchLogs();
  }, [organization?.id]);

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BookOpenCheck className="h-6 w-6 text-primary animate-pulse" />
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
            <BookOpenCheck className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Audit Logs</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.resource_type || "resource"} · {log.resource_id?.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.created_at?.split("T")[0]} · {log.user_id.slice(0, 8)}
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

export default AuditLogs;
