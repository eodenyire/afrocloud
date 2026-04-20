import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cloud, Network, Plus, Trash2, RefreshCw,
  Globe, Shield, Wifi, Server, Copy, Radio,
} from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import {
  createDnsRecord,
  createLoadBalancer,
  createVpc,
  deleteDnsRecord as removeDnsRecord,
  deleteLoadBalancer as removeLoadBalancer,
  deleteVpc as removeVpc,
  listDnsRecords,
  listLoadBalancers,
  listVpcs,
} from "@/lib/controlPlane";

const REGIONS = [
  { value: "nairobi", label: "Nairobi, Kenya" },
  { value: "lagos", label: "Lagos, Nigeria" },
  { value: "cape-town", label: "Cape Town, South Africa" },
  { value: "cairo", label: "Cairo, Egypt" },
  { value: "accra", label: "Accra, Ghana" },
  { value: "kigali", label: "Kigali, Rwanda" },
];

const CIDR_BLOCKS = ["10.0.0.0/16", "10.1.0.0/16", "172.16.0.0/16", "192.168.0.0/16"];
const LB_TYPES = [
  { value: "application", label: "Application (HTTP/HTTPS)", desc: "Layer 7 routing with path-based rules" },
  { value: "network", label: "Network (TCP/UDP)", desc: "Ultra-low latency Layer 4 balancing" },
];
const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

const STATUS_COLORS: Record<string, string> = {
  available: "text-green-400 bg-green-400/10",
  active: "text-green-400 bg-green-400/10",
  provisioning: "text-primary bg-primary/10",
  deleting: "text-destructive bg-destructive/10",
};

type TabKey = "vpcs" | "load-balancers" | "dns";

type VPC = { id: string; name: string; region: string; cidr_block: string; status: string; subnet_count: number; created_at: string | null };
type LB = { id: string; name: string; region: string; lb_type: string; protocol: string; port: number; target_count: number; status: string; dns_name: string | null; created_at: string | null };
type DNS = { id: string; zone: string; record_type: string; name: string; value: string; ttl: number; status: string; created_at: string | null };

const Networking = () => {
  const { user, loading } = useAuth();
  const { organization, project, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("vpcs");
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Data
  const [vpcs, setVpcs] = useState<VPC[]>([]);
  const [lbs, setLbs] = useState<LB[]>([]);
  const [dns, setDns] = useState<DNS[]>([]);

  // VPC form
  const [vpcName, setVpcName] = useState("");
  const [vpcRegion, setVpcRegion] = useState("nairobi");
  const [vpcCidr, setVpcCidr] = useState("10.0.0.0/16");

  // LB form
  const [lbName, setLbName] = useState("");
  const [lbRegion, setLbRegion] = useState("nairobi");
  const [lbType, setLbType] = useState("application");
  const [lbPort, setLbPort] = useState(443);

  // DNS form
  const [dnsZone, setDnsZone] = useState("");
  const [dnsType, setDnsType] = useState("A");
  const [dnsName, setDnsName] = useState("");
  const [dnsValue, setDnsValue] = useState("");
  const [dnsTtl, setDnsTtl] = useState(300);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchAll = async () => {
    if (!user) return;
    setFetching(true);
    const [v, l, d] = await Promise.all([
      listVpcs(user.id),
      listLoadBalancers(user.id),
      listDnsRecords(user.id),
    ]);
    setVpcs(v.data || []);
    setLbs(l.data || []);
    setDns(d.data || []);
    setFetching(false);
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const resetForms = () => {
    setVpcName(""); setLbName(""); setDnsZone(""); setDnsName(""); setDnsValue("");
    setShowCreate(false);
  };

  const handleCreateVpc = async () => {
    if (!vpcName.trim()) { toast.error("VPC name is required"); return; }
    if (!organization?.id) { toast.error("Organization context missing"); return; }
    setCreating(true);
    try {
      await createVpc(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        { name: vpcName.trim(), region: vpcRegion, cidr_block: vpcCidr, status: "available", price: 8 }
      );
      toast.success("VPC created");
      resetForms();
      fetchAll();
    } catch {
      toast.error("Failed to create VPC");
    }
    setCreating(false);
  };

  const handleCreateLb = async () => {
    if (!lbName.trim()) { toast.error("Name is required"); return; }
    if (!organization?.id) { toast.error("Organization context missing"); return; }
    setCreating(true);
    const fakeDns = `${lbName.trim().toLowerCase()}-${Math.random().toString(36).slice(2, 8)}.ac-lb.africa`;
    try {
      await createLoadBalancer(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        {
          name: lbName.trim(),
          region: lbRegion,
          lb_type: lbType,
          protocol: lbType === "application" ? "HTTPS" : "TCP",
          port: lbPort,
          dns_name: fakeDns,
          status: "provisioning",
          price: 15,
        }
      );
      toast.success("Load balancer provisioning…");
      resetForms();
      fetchAll();
    } catch {
      toast.error("Failed to create load balancer");
    }
    setCreating(false);
  };

  const handleCreateDns = async () => {
    if (!dnsZone.trim() || !dnsName.trim() || !dnsValue.trim()) { toast.error("All fields required"); return; }
    if (!organization?.id) { toast.error("Organization context missing"); return; }
    setCreating(true);
    try {
      await createDnsRecord(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        {
          zone: dnsZone.trim(),
          record_type: dnsType,
          name: dnsName.trim(),
          value: dnsValue.trim(),
          ttl: dnsTtl,
          status: "active",
        }
      );
      toast.success("DNS record created");
      resetForms();
      fetchAll();
    } catch {
      toast.error("Failed to create DNS record");
    }
    setCreating(false);
  };

  const deleteVpc = async (id: string) => {
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      await removeVpc({ userId: user!.id, orgId: organization.id, projectId: project?.id ?? null }, id);
      toast.success("VPC deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };
  const deleteLb = async (id: string) => {
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      await removeLoadBalancer({ userId: user!.id, orgId: organization.id, projectId: project?.id ?? null }, id);
      toast.success("Load balancer deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };
  const deleteDns = async (id: string) => {
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      await removeDnsRecord({ userId: user!.id, orgId: organization.id, projectId: project?.id ?? null }, id);
      toast.success("DNS record deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  const TABS: { key: TabKey; label: string; icon: typeof Network; count: number }[] = [
    { key: "vpcs", label: "VPCs", icon: Shield, count: vpcs.length },
    { key: "load-balancers", label: "Load Balancers", icon: Server, count: lbs.length },
    { key: "dns", label: "DNS Records", icon: Globe, count: dns.length },
  ];

  const createLabel = tab === "vpcs" ? "Create VPC" : tab === "load-balancers" ? "Create Load Balancer" : "Add DNS Record";

  return (
    <ConsoleLayout
      title="Networking"
      actions={
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {createLabel}
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowCreate(false); }}
              className={`rounded-lg border p-4 flex items-center gap-4 transition-all text-left ${
                tab === t.key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="text-xl font-heading font-bold text-foreground">{t.count}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Create Panels */}
        {showCreate && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> {createLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tab === "vpcs" && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">VPC Name</label>
                    <input value={vpcName} onChange={(e) => setVpcName(e.target.value)} placeholder="my-vpc"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Region</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {REGIONS.map((r) => (
                        <button key={r.value} onClick={() => setVpcRegion(r.value)}
                          className={`rounded-lg border p-3 text-left text-sm transition-all ${vpcRegion === r.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">CIDR Block</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {CIDR_BLOCKS.map((c) => (
                        <button key={c} onClick={() => setVpcCidr(c)}
                          className={`rounded-lg border p-3 text-sm font-mono transition-all ${vpcCidr === c ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={resetForms}>Cancel</Button>
                    <Button onClick={handleCreateVpc} disabled={creating}>
                      {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Create VPC"}
                    </Button>
                  </div>
                </>
              )}

              {tab === "load-balancers" && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Name</label>
                    <input value={lbName} onChange={(e) => setLbName(e.target.value)} placeholder="my-load-balancer"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Region</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {REGIONS.map((r) => (
                        <button key={r.value} onClick={() => setLbRegion(r.value)}
                          className={`rounded-lg border p-3 text-left text-sm transition-all ${lbRegion === r.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Type</label>
                    <div className="space-y-2">
                      {LB_TYPES.map((t) => (
                        <button key={t.value} onClick={() => setLbType(t.value)}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${lbType === t.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                          <span className="font-medium">{t.label}</span>
                          <span className="block text-xs text-muted-foreground">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Port</label>
                    <input type="number" value={lbPort} onChange={(e) => setLbPort(Number(e.target.value))} min={1} max={65535}
                      className="w-32 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={resetForms}>Cancel</Button>
                    <Button onClick={handleCreateLb} disabled={creating}>
                      {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Create Load Balancer"}
                    </Button>
                  </div>
                </>
              )}

              {tab === "dns" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Zone (Domain)</label>
                      <input value={dnsZone} onChange={(e) => setDnsZone(e.target.value)} placeholder="example.africa"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Record Type</label>
                      <div className="flex flex-wrap gap-2">
                        {RECORD_TYPES.map((rt) => (
                          <button key={rt} onClick={() => setDnsType(rt)}
                            className={`rounded-lg border px-3 py-2 text-sm font-mono transition-all ${dnsType === rt ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                            {rt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Name</label>
                      <input value={dnsName} onChange={(e) => setDnsName(e.target.value)} placeholder="www"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Value</label>
                      <input value={dnsValue} onChange={(e) => setDnsValue(e.target.value)} placeholder="10.0.1.1"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">TTL (seconds)</label>
                    <input type="number" value={dnsTtl} onChange={(e) => setDnsTtl(Number(e.target.value))} min={60}
                      className="w-32 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={resetForms}>Cancel</Button>
                    <Button onClick={handleCreateDns} disabled={creating}>
                      {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Add Record"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              {tab === "vpcs" ? "Virtual Private Clouds" : tab === "load-balancers" ? "Load Balancers" : "DNS Records"}
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchAll}>
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* VPCs */}
          {tab === "vpcs" && (
            vpcs.length === 0 && !fetching ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-foreground mb-2">No VPCs yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Create a Virtual Private Cloud to isolate your resources.</p>
                  <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Create VPC</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {vpcs.map((vpc) => (
                  <Card key={vpc.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-foreground">{vpc.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{REGIONS.find((r) => r.value === vpc.region)?.label || vpc.region}</span>
                              <span>•</span>
                              <span className="font-mono">{vpc.cidr_block}</span>
                              <span>•</span>
                              <span>{vpc.subnet_count} subnets</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[vpc.status] || "text-muted-foreground bg-muted"}`}>{vpc.status}</span>
                          <Button variant="ghost" size="icon" onClick={() => deleteVpc(vpc.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {/* Load Balancers */}
          {tab === "load-balancers" && (
            lbs.length === 0 && !fetching ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Server className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-foreground mb-2">No load balancers yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Create a load balancer to distribute traffic across your instances.</p>
                  <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Load Balancer</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {lbs.map((lb) => (
                  <Card key={lb.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Server className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-foreground">{lb.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{REGIONS.find((r) => r.value === lb.region)?.label || lb.region}</span>
                              <span>•</span>
                              <span className="capitalize">{lb.lb_type}</span>
                              <span>•</span>
                              <span>{lb.protocol}:{lb.port}</span>
                              <span>•</span>
                              <span>{lb.target_count} targets</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {lb.dns_name && (
                            <button onClick={() => copyText(lb.dns_name!)} className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded hover:text-foreground transition-colors">
                              {lb.dns_name} <Copy className="h-3 w-3" />
                            </button>
                          )}
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[lb.status] || "text-muted-foreground bg-muted"}`}>{lb.status}</span>
                          <Button variant="ghost" size="icon" onClick={() => deleteLb(lb.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {/* DNS Records */}
          {tab === "dns" && (
            dns.length === 0 && !fetching ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-foreground mb-2">No DNS records yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Add DNS records to manage your domain routing.</p>
                  <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Add DNS Record</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {dns.map((rec) => (
                  <Card key={rec.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Globe className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-foreground">
                              <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-2">{rec.record_type}</span>
                              {rec.name}.{rec.zone}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono">{rec.value}</span>
                              <span>•</span>
                              <span>TTL {rec.ttl}s</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[rec.status] || "text-muted-foreground bg-muted"}`}>{rec.status}</span>
                          <Button variant="ghost" size="icon" onClick={() => deleteDns(rec.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </ConsoleLayout>
  );
};

export default Networking;
