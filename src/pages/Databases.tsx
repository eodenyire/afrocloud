import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cloud, Database, ArrowLeft, Plus, Power, PowerOff, Trash2,
  Globe, RefreshCw, HardDrive, Plug,
} from "lucide-react";
import {
  createDatabaseInstance,
  deleteDatabaseInstance,
  listDatabaseInstances,
  updateDatabaseStatus,
} from "@/lib/controlPlane";

const REGIONS = [
  { value: "nairobi", label: "Nairobi, Kenya" },
  { value: "lagos", label: "Lagos, Nigeria" },
  { value: "cape-town", label: "Cape Town, South Africa" },
  { value: "cairo", label: "Cairo, Egypt" },
  { value: "accra", label: "Accra, Ghana" },
  { value: "kigali", label: "Kigali, Rwanda" },
];

const ENGINES = [
  { value: "postgresql", label: "PostgreSQL", icon: "🐘", versions: ["16", "15", "14"], defaultPort: 5432 },
  { value: "redis", label: "Redis", icon: "🔴", versions: ["7.2", "7.0", "6.2"], defaultPort: 6379 },
  { value: "mongodb", label: "MongoDB", icon: "🍃", versions: ["7.0", "6.0", "5.0"], defaultPort: 27017 },
];

const PLANS = [
  { value: "db-starter", label: "Starter", storage: 10, price: 10, description: "1 vCPU · 1 GB RAM" },
  { value: "db-standard-1", label: "Standard", storage: 20, price: 25, description: "2 vCPU · 4 GB RAM" },
  { value: "db-standard-2", label: "Standard Plus", storage: 50, price: 50, description: "4 vCPU · 8 GB RAM" },
  { value: "db-performance", label: "Performance", storage: 100, price: 100, description: "8 vCPU · 16 GB RAM" },
];

const STATUS_COLORS: Record<string, string> = {
  running: "text-green-400 bg-green-400/10",
  stopped: "text-muted-foreground bg-muted",
  provisioning: "text-primary bg-primary/10",
};

type DBInstance = {
  id: string;
  name: string;
  engine: string;
  version: string;
  region: string;
  plan: string;
  storage_gb: number;
  status: string;
  connection_string: string | null;
  port: number | null;
  created_at: string | null;
};

const Databases = () => {
  const { user, loading } = useAuth();
  const { organization, project, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [instances, setInstances] = useState<DBInstance[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [engine, setEngine] = useState("postgresql");
  const [version, setVersion] = useState("16");
  const [region, setRegion] = useState("nairobi");
  const [plan, setPlan] = useState("db-standard-1");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchInstances = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await listDatabaseInstances(user.id);
    if (error) toast.error("Failed to load databases");
    else setInstances(data || []);
    setFetching(false);
  };

  useEffect(() => {
    if (user) fetchInstances();
  }, [user]);

  const selectedEngine = ENGINES.find((e) => e.value === engine)!;
  const selectedPlan = PLANS.find((p) => p.value === plan)!;

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Database name is required"); return; }
    if (!organization?.id) { toast.error("Organization context missing"); return; }
    setCreating(true);
    const eng = ENGINES.find((e) => e.value === engine)!;
    const pl = PLANS.find((p) => p.value === plan)!;
    const host = `${name.trim().toLowerCase().replace(/\s+/g, "-")}.${region}.africloud.io`;
    const connStr = engine === "postgresql"
      ? `postgresql://admin:****@${host}:${eng.defaultPort}/main`
      : engine === "mongodb"
        ? `mongodb://admin:****@${host}:${eng.defaultPort}/main`
        : `redis://default:****@${host}:${eng.defaultPort}`;

    try {
      await createDatabaseInstance(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        {
          name: name.trim(),
          engine,
          version,
          region,
          plan,
          storage_gb: pl.storage,
          status: "provisioning",
          connection_string: connStr,
          port: eng.defaultPort,
          price: pl.price,
        }
      );
      toast.success("Database is provisioning…");
      setShowCreate(false);
      setName("");
      setTimeout(() => fetchInstances(), 3000);
      fetchInstances();
    } catch {
      toast.error("Failed to create database");
    }
    setCreating(false);
  };

  const toggleInstance = async (db: DBInstance) => {
    const newStatus = db.status === "running" ? "stopped" : "running";
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      await updateDatabaseStatus(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        db.id,
        newStatus
      );
      toast.success(newStatus === "running" ? "Starting…" : "Stopping…");
      fetchInstances();
    } catch {
      toast.error("Action failed");
    }
  };

  const deleteInstance = async (db: DBInstance) => {
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      await deleteDatabaseInstance(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        db.id
      );
      toast.success("Database deleted");
      fetchInstances();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
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
            <Database className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Managed Databases</span>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Database
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {showCreate && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> New Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Database Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-production-db"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Engine */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Engine</label>
                <div className="grid grid-cols-3 gap-2">
                  {ENGINES.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => { setEngine(e.value); setVersion(e.versions[0]); }}
                      className={`rounded-lg border p-4 text-center text-sm transition-all ${
                        engine === e.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{e.icon}</span>
                      <span className="font-medium">{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Version */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Version</label>
                <div className="flex gap-2">
                  {selectedEngine.versions.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVersion(v)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                        version === v
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      v{v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  <Globe className="h-3.5 w-3.5 inline mr-1" /> Region
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {REGIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRegion(r.value)}
                      className={`rounded-lg border p-3 text-left text-sm transition-all ${
                        region === r.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  <HardDrive className="h-3.5 w-3.5 inline mr-1" /> Plan
                </label>
                <div className="space-y-2">
                  {PLANS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlan(p.value)}
                      className={`w-full rounded-lg border p-3 flex items-center justify-between text-sm transition-all ${
                        plan === p.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <div>
                        <span className="font-medium">{p.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.description}</span>
                      </div>
                      <span className="flex items-center gap-4 text-xs">
                        <span>{p.storage} GB</span>
                        <span className="text-primary font-semibold">${p.price}/mo</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Estimated cost: <span className="text-primary font-bold">${selectedPlan.price}/mo</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Create Database"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instance List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">Your Databases</h2>
            <Button variant="ghost" size="sm" onClick={fetchInstances}>
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {instances.length === 0 && !fetching ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-heading font-semibold text-foreground mb-2">No databases yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Create your first managed database to get started.</p>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Create Database
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {instances.map((db) => {
                const eng = ENGINES.find((e) => e.value === db.engine);
                return (
                  <Card key={db.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-xl">
                            {eng?.icon || "🗄️"}
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-foreground">{db.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{eng?.label} v{db.version}</span>
                              <span>•</span>
                              <span>{REGIONS.find((r) => r.value === db.region)?.label || db.region}</span>
                              <span>•</span>
                              <span>{db.storage_gb} GB</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {db.connection_string && (
                            <button
                              onClick={() => { navigator.clipboard.writeText(db.connection_string!); toast.success("Connection string copied"); }}
                              className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded hover:bg-secondary/80 transition-colors flex items-center gap-1"
                            >
                              <Plug className="h-3 w-3" /> Connect
                            </button>
                          )}
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[db.status] || "text-muted-foreground bg-muted"}`}>
                            {db.status}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => toggleInstance(db)} disabled={db.status === "provisioning"}>
                            {db.status === "running" ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-400" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteInstance(db)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Databases;
