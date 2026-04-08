import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cloud, Globe, ArrowLeft, Plus, Power, PowerOff, Trash2,
  Cpu, HardDrive, RefreshCw, Wifi, WifiOff, Activity,
  Radio, Signal,
} from "lucide-react";

const REGIONS = [
  { value: "nairobi", label: "Nairobi, Kenya", flag: "🇰🇪" },
  { value: "lagos", label: "Lagos, Nigeria", flag: "🇳🇬" },
  { value: "cape-town", label: "Cape Town, South Africa", flag: "🇿🇦" },
  { value: "cairo", label: "Cairo, Egypt", flag: "🇪🇬" },
  { value: "accra", label: "Accra, Ghana", flag: "🇬🇭" },
  { value: "kigali", label: "Kigali, Rwanda", flag: "🇷🇼" },
  { value: "dar-es-salaam", label: "Dar es Salaam, Tanzania", flag: "🇹🇿" },
  { value: "addis-ababa", label: "Addis Ababa, Ethiopia", flag: "🇪🇹" },
];

const NODE_TYPES = [
  { value: "ac-edge-1", label: "Edge Lite", vcpus: 2, ram: 4, disk: 100, price: 29, desc: "Low-latency caching & APIs" },
  { value: "ac-edge-2", label: "Edge Standard", vcpus: 4, ram: 8, disk: 250, price: 59, desc: "Full compute at the edge" },
  { value: "ac-edge-4", label: "Edge Pro", vcpus: 8, ram: 16, disk: 500, price: 119, desc: "AI inference & heavy workloads" },
  { value: "ac-edge-gpu", label: "Edge GPU", vcpus: 8, ram: 32, disk: 1000, price: 249, desc: "GPU-accelerated edge computing" },
];

const STATUS_COLORS: Record<string, string> = {
  running: "text-green-400 bg-green-400/10",
  stopped: "text-muted-foreground bg-muted",
  deploying: "text-primary bg-primary/10",
  degraded: "text-yellow-400 bg-yellow-400/10",
};

const SYNC_COLORS: Record<string, string> = {
  synced: "text-green-400",
  syncing: "text-primary animate-pulse",
  offline: "text-destructive",
};

type EdgeNode = {
  id: string;
  name: string;
  region: string;
  node_type: string;
  vcpus: number;
  ram_gb: number;
  disk_gb: number;
  status: string;
  ip_address: string | null;
  sync_status: string;
  last_sync_at: string | null;
  workloads: number;
  created_at: string | null;
};

const EdgeNodes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("nairobi");
  const [nodeType, setNodeType] = useState("ac-edge-1");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchNodes = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("edge_nodes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load edge nodes");
    else setNodes(data || []);
    setFetching(false);
  };

  useEffect(() => {
    if (user) fetchNodes();
  }, [user]);

  const selectedNode = NODE_TYPES.find((n) => n.value === nodeType)!;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Node name is required");
      return;
    }
    setCreating(true);
    const nt = NODE_TYPES.find((n) => n.value === nodeType)!;
    const fakeIp = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    const { error } = await supabase.from("edge_nodes").insert({
      user_id: user!.id,
      name: name.trim(),
      region,
      node_type: nodeType,
      vcpus: nt.vcpus,
      ram_gb: nt.ram,
      disk_gb: nt.disk,
      status: "deploying",
      ip_address: fakeIp,
      sync_status: "syncing",
    });

    if (error) {
      toast.error("Failed to deploy edge node");
    } else {
      toast.success("Edge node deploying…");
      setShowCreate(false);
      setName("");
      setTimeout(() => fetchNodes(), 3000);
      fetchNodes();
    }
    setCreating(false);
  };

  const toggleNode = async (node: EdgeNode) => {
    const newStatus = node.status === "running" ? "stopped" : "running";
    const newSync = newStatus === "running" ? "synced" : "offline";
    const { error } = await supabase
      .from("edge_nodes")
      .update({ status: newStatus, sync_status: newSync, updated_at: new Date().toISOString() })
      .eq("id", node.id);
    if (error) toast.error("Action failed");
    else {
      toast.success(newStatus === "running" ? "Node starting…" : "Node stopping…");
      fetchNodes();
    }
  };

  const deleteNode = async (node: EdgeNode) => {
    const { error } = await supabase.from("edge_nodes").delete().eq("id", node.id);
    if (error) toast.error("Failed to remove node");
    else {
      toast.success("Edge node removed");
      fetchNodes();
    }
  };

  if (loading || !user) {
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
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Edge Nodes</span>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Deploy Node
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Radio, label: "Total Nodes", value: nodes.length.toString() },
            { icon: Signal, label: "Online", value: nodes.filter((n) => n.status === "running").length.toString() },
            { icon: Activity, label: "Workloads", value: nodes.reduce((s, n) => s + n.workloads, 0).toString() },
            { icon: Wifi, label: "Synced", value: nodes.filter((n) => n.sync_status === "synced").length.toString() },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create Panel */}
        {showCreate && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Deploy Edge Node
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Node Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="edge-nairobi-01"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  <Globe className="h-3.5 w-3.5 inline mr-1" /> Edge Region
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                      <span className="mr-1">{r.flag}</span> {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  <Cpu className="h-3.5 w-3.5 inline mr-1" /> Node Type
                </label>
                <div className="space-y-2">
                  {NODE_TYPES.map((n) => (
                    <button
                      key={n.value}
                      onClick={() => setNodeType(n.value)}
                      className={`w-full rounded-lg border p-3 flex items-center justify-between text-sm transition-all ${
                        nodeType === n.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <div className="text-left">
                        <span className="font-medium">{n.label}</span>
                        <span className="block text-xs text-muted-foreground">{n.desc}</span>
                      </div>
                      <span className="flex items-center gap-4 text-xs shrink-0">
                        <span>{n.vcpus} vCPU</span>
                        <span>{n.ram} GB</span>
                        <span>{n.disk} GB</span>
                        <span className="text-primary font-semibold">${n.price}/mo</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Estimated cost: <span className="text-primary font-bold">${selectedNode.price}/mo</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Deploy Node"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Node List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">Your Edge Nodes</h2>
            <Button variant="ghost" size="sm" onClick={fetchNodes}>
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {nodes.length === 0 && !fetching ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-heading font-semibold text-foreground mb-2">No edge nodes yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Deploy your first edge node to bring compute closer to your users across Africa.</p>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Deploy Node
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {nodes.map((node) => {
                const regionInfo = REGIONS.find((r) => r.value === node.region);
                return (
                  <Card key={node.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Globe className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-foreground">{node.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{regionInfo?.flag} {regionInfo?.label || node.region}</span>
                              <span>•</span>
                              <span>{node.vcpus} vCPU / {node.ram_gb} GB</span>
                              <span>•</span>
                              <span>{node.workloads} workloads</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Sync status */}
                          <span className={`flex items-center gap-1 text-xs ${SYNC_COLORS[node.sync_status] || "text-muted-foreground"}`}>
                            {node.sync_status === "synced" ? <Wifi className="h-3 w-3" /> : node.sync_status === "syncing" ? <RefreshCw className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {node.sync_status}
                          </span>

                          {node.ip_address && (
                            <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {node.ip_address}
                            </span>
                          )}
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[node.status] || "text-muted-foreground bg-muted"}`}>
                            {node.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleNode(node)}
                            disabled={node.status === "deploying"}
                          >
                            {node.status === "running" ? (
                              <PowerOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Power className="h-4 w-4 text-green-400" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteNode(node)}>
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

export default EdgeNodes;
