import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { FileCode, ArrowLeft, PlayCircle } from "lucide-react";
import {
  createIacRun,
  createIacRunStep,
  createIacTemplate,
  listIacRuns,
  listIacTemplates,
} from "@/lib/controlPlane";

type Template = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  template: string;
};

type Run = {
  id: string;
  status: string;
  created_at: string | null;
};

const IaC = () => {
  const { user, loading } = useAuth();
  const { organization, project, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateBody, setTemplateBody] = useState("service compute {\n  name = \"web-api\"\n  size = \"ac-standard-2\"\n}\n");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchIac = async () => {
    if (!organization?.id) return;
    const [templateResponse, runResponse] = await Promise.all([
      listIacTemplates(organization.id),
      listIacRuns(organization.id),
    ]);
    setTemplates((templateResponse.data as Template[]) || []);
    setRuns((runResponse.data as Run[]) || []);
  };

  useEffect(() => {
    if (organization?.id) fetchIac();
  }, [organization?.id]);

  const handleCreateTemplate = async () => {
    if (!organization?.id) return;
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    const { error } = await createIacTemplate(
      { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
      {
        name: name.trim(),
        description: description.trim(),
        template: templateBody.trim(),
        language: "ac-dsl",
      }
    );
    if (error) toast.error("Failed to save template");
    else {
      toast.success("Template saved");
      setName("");
      setDescription("");
      fetchIac();
    }
    setSaving(false);
  };

  const handleRun = async (template: Template) => {
    if (!organization?.id) return;
    const { data, error } = await createIacRun(
      { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
      {
        templateId: template.id,
        plan: { summary: "Provisioning compute + storage", resources: ["compute", "storage"] },
        policyViolations: [],
      }
    );
    if (error || !data?.[0]) {
      toast.error("Failed to start run");
      return;
    }
    const runId = data[0].id;
    await createIacRunStep(runId, 1, "plan", "completed", { message: "Plan generated" });
    await createIacRunStep(runId, 2, "apply", "running", { message: "Applying changes" });
    toast.success("Run started");
    fetchIac();
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FileCode className="h-6 w-6 text-primary animate-pulse" />
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
            <FileCode className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">IaC Studio</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create IaC Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <textarea
              value={templateBody}
              onChange={(e) => setTemplateBody(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <Button onClick={handleCreateTemplate} disabled={saving}>
              Save Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates yet.</p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description || "No description"}</p>
                  </div>
                  <Button size="sm" onClick={() => handleRun(template)} className="gap-2">
                    <PlayCircle className="h-4 w-4" /> Run Plan
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{run.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{run.created_at?.split("T")[0]}</p>
                  </div>
                  <span className="text-xs rounded-full bg-secondary px-2 py-1 text-muted-foreground">{run.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IaC;
