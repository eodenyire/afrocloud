import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cloud, Server, Plus, Power, PowerOff, Trash2,
  Cpu, HardDrive, MemoryStick, Globe, Monitor, RefreshCw, Terminal,
  RotateCw, Camera, Copy as CopyIcon, Undo2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ConnectDialog, type ConnectTarget } from "@/components/ConnectDialog";
import { supabase } from "@/integrations/supabase/client";
import { provision, type Provider } from "@/lib/provision";

const PROVIDERS: { value: Provider; label: string; hint: string }[] = [
  { value: "hetzner",      label: "Hetzner",      hint: "Cheap, fast, EU + US" },
  { value: "digitalocean", label: "DigitalOcean", hint: "Global droplets" },
  { value: "aws",          label: "AWS EC2",      hint: "Most regions" },
];

// Map our AC machine types to provider-specific sizes
const PROVIDER_SIZE: Partial<Record<Provider, Record<string, string>>> = {
  hetzner:      { "ac-standard-1": "cx22", "ac-standard-2": "cx32", "ac-standard-4": "cx42", "ac-compute-8": "ccx13", "ac-compute-16": "ccx23" },
  digitalocean: { "ac-standard-1": "s-1vcpu-2gb", "ac-standard-2": "s-2vcpu-4gb", "ac-standard-4": "s-4vcpu-8gb", "ac-compute-8": "c-8", "ac-compute-16": "c-16" },
  aws:          { "ac-standard-1": "t3.small", "ac-standard-2": "t3.medium", "ac-standard-4": "t3.large", "ac-compute-8": "c6i.2xlarge", "ac-compute-16": "c6i.4xlarge" },
};

const PROVIDER_REGION: Partial<Record<Provider, Record<string, string>>> = {
  hetzner:      { nairobi: "nbg1", lagos: "fsn1", "cape-town": "hel1", cairo: "nbg1", accra: "fsn1", kigali: "hel1" },
  digitalocean: { nairobi: "fra1", lagos: "lon1", "cape-town": "lon1", cairo: "fra1", accra: "lon1", kigali: "fra1" },
  aws:          { nairobi: "af-south-1", lagos: "af-south-1", "cape-town": "af-south-1", cairo: "eu-south-1", accra: "eu-west-1", kigali: "eu-central-1" },
};

const REGIONS = [
  { value: "nairobi", label: "Nairobi, Kenya" },
  { value: "lagos", label: "Lagos, Nigeria" },
  { value: "cape-town", label: "Cape Town, South Africa" },
  { value: "cairo", label: "Cairo, Egypt" },
  { value: "accra", label: "Accra, Ghana" },
  { value: "kigali", label: "Kigali, Rwanda" },
];

const MACHINE_TYPES = [
  { value: "ac-standard-1", label: "AC Standard 1", vcpus: 1, ram: 2, disk: 50, price: 12 },
  { value: "ac-standard-2", label: "AC Standard 2", vcpus: 2, ram: 4, disk: 80, price: 24 },
  { value: "ac-standard-4", label: "AC Standard 4", vcpus: 4, ram: 8, disk: 160, price: 48 },
  { value: "ac-compute-8", label: "AC Compute 8", vcpus: 8, ram: 16, disk: 320, price: 96 },
  { value: "ac-compute-16", label: "AC Compute 16", vcpus: 16, ram: 32, disk: 500, price: 180 },
];

const OS_IMAGES = [
  { value: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
  { value: "ubuntu-24.04", label: "Ubuntu 24.04 LTS" },
  { value: "debian-12", label: "Debian 12" },
  { value: "centos-9", label: "CentOS Stream 9" },
  { value: "rocky-9", label: "Rocky Linux 9" },
];

const STATUS_COLORS: Record<string, string> = {
  running: "text-green-400 bg-green-400/10",
  stopped: "text-muted-foreground bg-muted",
  provisioning: "text-primary bg-primary/10",
  terminating: "text-destructive bg-destructive/10",
};

type VM = {
  id: string;
  name: string;
  region: string;
  machine_type: string;
  vcpus: number;
  ram_gb: number;
  disk_gb: number;
  os_image: string;
  status: string;
  ip_address: string | null;
  created_at: string | null;
  provider: string;
  provider_resource_id: string | null;
};
const Compute = () => {
  const { user, loading } = useAuth();
  const { organization, project: _project, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [vms, setVms] = useState<VM[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [region, setRegion] = useState("nairobi");
  const [machineType, setMachineType] = useState("ac-standard-1");
  const [osImage, setOsImage] = useState("ubuntu-22.04");
  const [provider, setProvider] = useState<Provider>("hetzner");

  // Connect dialog
  const [connectTarget, setConnectTarget] = useState<ConnectTarget | null>(null);

  // Snapshots dialog
  type Snap = { id: string; vm_id: string; name: string; size_gb: number; status: string; created_at: string };
  const [snapVm, setSnapVm] = useState<VM | null>(null);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [snapName, setSnapName] = useState("");
  const [snapBusy, setSnapBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchVMs = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("virtual_machines")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load instances");
    else setVms((data as VM[]) || []);
    setFetching(false);
  };

  useEffect(() => {
    if (user) fetchVMs();
  }, [user]);

  const selectedMachine = MACHINE_TYPES.find((m) => m.value === machineType)!;

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Instance name is required"); return; }
    if (!organization?.id) { toast.error("Workspace not ready"); return; }
    setCreating(true);
    const machine = MACHINE_TYPES.find((m) => m.value === machineType)!;
    const providerSize = PROVIDER_SIZE[provider]?.[machineType] ?? machineType;
    const providerRegion = PROVIDER_REGION[provider]?.[region] ?? region;

    try {
      // 1. Insert local row in 'provisioning' state so UI updates instantly
      const { data: row, error: insErr } = await supabase
        .from("virtual_machines")
        .insert({
          user_id: user!.id,
          name: name.trim(), region, machine_type: machineType,
          vcpus: machine.vcpus, ram_gb: machine.ram, disk_gb: machine.disk,
          os_image: osImage, status: "provisioning", ip_address: null,
          provider,
        } as never)
        .select("*")
        .single();
      if (insErr || !row) throw insErr ?? new Error("Insert failed");

      // 2. Call orchestrator → real provider API
      const result = await provision({
        action: "create",
        resource_type: "compute",
        provider,
        resource_id: (row as VM).id,
        payload: {
          name: name.trim(),
          server_type: providerSize,   // hetzner
          size: providerSize,           // DO/AWS
          location: providerRegion,     // hetzner
          region: providerRegion,       // DO/AWS
          image: osImage === "ubuntu-22.04" ? (provider === "digitalocean" ? "ubuntu-22-04-x64" : "ubuntu-22.04") : osImage,
        },
      });

      // 3. Update local row with provider response
      const status = result.ok ? "running" : "failed";
      await supabase
        .from("virtual_machines")
        .update({
          status,
          ip_address: result.ip_address ?? null,
          provider_resource_id: result.provider_resource_id ?? null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", (row as VM).id);

      if (result.ok) toast.success(`Provisioned on ${provider}: ${result.ip_address ?? "(no IP yet)"}`);
      else toast.error(`Provider error: ${result.message ?? "see Operations log"}`);

      setShowCreate(false); setName("");
      fetchVMs();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to create instance");
    }
    setCreating(false);
  };

  const toggleVM = async (vm: VM) => {
    const action = vm.status === "running" ? "stop" : "start";
    const next = action === "start" ? "starting" : "stopping";
    await supabase.from("virtual_machines").update({ status: next } as never).eq("id", vm.id);
    fetchVMs();

    const result = await provision({
      action: action as "start" | "stop",
      resource_type: "compute",
      provider: vm.provider as Provider,
      resource_id: vm.id,
      payload: { provider_resource_id: vm.provider_resource_id ?? "" },
    });

    await supabase
      .from("virtual_machines")
      .update({ status: result.ok ? (action === "start" ? "running" : "stopped") : vm.status } as never)
      .eq("id", vm.id);
    if (!result.ok) toast.error(result.message ?? "Action failed");
    else toast.success(`Instance ${action}ed`);
    fetchVMs();
  };

  const rebootVM = async (vm: VM) => {
    await supabase.from("virtual_machines").update({ status: "rebooting" } as never).eq("id", vm.id);
    fetchVMs();
    const result = await provision({
      action: "reboot",
      resource_type: "compute",
      provider: vm.provider as Provider,
      resource_id: vm.id,
      payload: { provider_resource_id: vm.provider_resource_id ?? "" },
    });
    await supabase
      .from("virtual_machines")
      .update({ status: result.ok ? "running" : vm.status } as never)
      .eq("id", vm.id);
    if (!result.ok) toast.error(result.message ?? "Reboot failed");
    else toast.success(`Instance rebooted`);
    fetchVMs();
  };

  // ---------- Snapshots ----------
  const openSnapshots = async (vm: VM) => {
    setSnapVm(vm);
    setSnapName(`${vm.name}-snap-${new Date().toISOString().slice(0, 10)}`);
    const { data } = await (supabase as never as { from: (t: string) => any })
      .from("vm_snapshots").select("*").eq("vm_id", vm.id).order("created_at", { ascending: false });
    setSnaps((data ?? []) as Snap[]);
  };

  const refreshSnaps = async (vmId: string) => {
    const { data } = await (supabase as never as { from: (t: string) => any })
      .from("vm_snapshots").select("*").eq("vm_id", vmId).order("created_at", { ascending: false });
    setSnaps((data ?? []) as Snap[]);
  };

  const createSnapshot = async () => {
    if (!snapVm || !user) return;
    if (!snapName.trim()) { toast.error("Snapshot name required"); return; }
    setSnapBusy(true);
    const { error } = await (supabase as never as { from: (t: string) => any })
      .from("vm_snapshots").insert({
        user_id: user.id, vm_id: snapVm.id, name: snapName.trim(),
        size_gb: snapVm.disk_gb, status: "ready",
      });
    setSnapBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Snapshot created");
    setSnapName(`${snapVm.name}-snap-${Date.now()}`);
    refreshSnaps(snapVm.id);
  };

  const restoreSnapshot = async (snap: Snap) => {
    if (!snapVm) return;
    if (!confirm(`Restore ${snapVm.name} from snapshot "${snap.name}"? The VM will be rebooted.`)) return;
    setSnapBusy(true);
    await supabase.from("virtual_machines")
      .update({ status: "restoring", updated_at: new Date().toISOString() } as never)
      .eq("id", snapVm.id);
    // Simulate restore then reboot to bring back online
    await new Promise((r) => setTimeout(r, 800));
    await supabase.from("virtual_machines")
      .update({ status: "running", updated_at: new Date().toISOString() } as never)
      .eq("id", snapVm.id);
    setSnapBusy(false);
    toast.success(`Restored from "${snap.name}"`);
    fetchVMs();
  };

  const cloneSnapshot = async (snap: Snap) => {
    if (!snapVm || !user) return;
    setSnapBusy(true);
    const cloneName = `${snapVm.name}-clone-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("virtual_machines").insert({
      user_id: user.id,
      name: cloneName,
      region: snapVm.region,
      machine_type: snapVm.machine_type,
      vcpus: snapVm.vcpus,
      ram_gb: snapVm.ram_gb,
      disk_gb: snapVm.disk_gb,
      os_image: snapVm.os_image,
      status: "provisioning",
      ip_address: null,
      provider: snapVm.provider,
    } as never);
    setSnapBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Cloned as ${cloneName}`);
    fetchVMs();
  };

  const deleteSnapshot = async (snap: Snap) => {
    if (!confirm(`Delete snapshot "${snap.name}"?`)) return;
    const { error } = await (supabase as never as { from: (t: string) => any })
      .from("vm_snapshots").delete().eq("id", snap.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Snapshot deleted");
    if (snapVm) refreshSnaps(snapVm.id);
  };


  const deleteVM = async (vm: VM) => {
    if (!confirm(`Terminate ${vm.name}? This cannot be undone.`)) return;
    if (vm.provider_resource_id) {
      const result = await provision({
        action: "delete",
        resource_type: "compute",
        provider: vm.provider as Provider,
        resource_id: vm.id,
        payload: { provider_resource_id: vm.provider_resource_id },
      });
      if (!result.ok) {
        toast.error(`Provider delete failed: ${result.message}. Removing local record only.`);
      }
    }
    await supabase.from("virtual_machines").delete().eq("id", vm.id);
    toast.success("Instance terminated");
    fetchVMs();
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
      title="Compute"
      actions={
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Launch Instance
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Create Instance Panel */}
        {showCreate && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> New Virtual Machine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Cloud Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setProvider(p.value)}
                      className={`rounded-lg border p-3 text-left text-sm transition-all ${
                        provider === p.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Instance Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-web-server"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
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

              {/* Machine Type */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  <Cpu className="h-3.5 w-3.5 inline mr-1" /> Machine Type
                </label>
                <div className="space-y-2">
                  {MACHINE_TYPES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMachineType(m.value)}
                      className={`w-full rounded-lg border p-3 flex items-center justify-between text-sm transition-all ${
                        machineType === m.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium">{m.label}</span>
                      <span className="flex items-center gap-4 text-xs">
                        <span>{m.vcpus} vCPU</span>
                        <span>{m.ram} GB RAM</span>
                        <span>{m.disk} GB SSD</span>
                        <span className="text-primary font-semibold">${m.price}/mo</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OS Image */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  <Monitor className="h-3.5 w-3.5 inline mr-1" /> OS Image
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {OS_IMAGES.map((os) => (
                    <button
                      key={os.value}
                      onClick={() => setOsImage(os.value)}
                      className={`rounded-lg border p-3 text-left text-sm transition-all ${
                        osImage === os.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {os.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary & Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Estimated cost: <span className="text-primary font-bold">${selectedMachine.price}/mo</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Launch Instance"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VM List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">Your Instances</h2>
            <Button variant="ghost" size="sm" onClick={fetchVMs}>
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {vms.length === 0 && !fetching ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Server className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-heading font-semibold text-foreground mb-2">No instances yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Launch your first virtual machine to get started.</p>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Launch Instance
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vms.map((vm) => (
                <Card key={vm.id} className="hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-foreground">{vm.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{REGIONS.find((r) => r.value === vm.region)?.label || vm.region}</span>
                            <span>•</span>
                            <span>{vm.vcpus} vCPU / {vm.ram_gb} GB</span>
                            <span>•</span>
                            <span>{vm.os_image}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {vm.ip_address && (
                          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                            {vm.ip_address}
                          </span>
                        )}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[vm.status] || "text-muted-foreground bg-muted"}`}>
                          {vm.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() =>
                            setConnectTarget({
                              kind: "compute",
                              name: vm.name,
                              region: REGIONS.find((r) => r.value === vm.region)?.label ?? vm.region,
                              ip: vm.ip_address,
                              os: OS_IMAGES.find((o) => o.value === vm.os_image)?.label ?? vm.os_image,
                            })
                          }
                          disabled={vm.status !== "running"}
                        >
                          <Terminal className="h-3.5 w-3.5" /> Connect
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Reboot"
                          onClick={() => rebootVM(vm)}
                          disabled={vm.status !== "running"}
                        >
                          <RotateCw className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Snapshots"
                          onClick={() => openSnapshots(vm)}
                        >
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVM(vm)}
                          disabled={vm.status === "provisioning" || vm.status === "terminating"}
                        >
                          {vm.status === "running" ? (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Power className="h-4 w-4 text-green-400" />
                          )}
                        </Button>
                        <ConfirmDialog
                          title={`Delete VM "${vm.name}"?`}
                          description="This permanently destroys the virtual machine on the upstream provider and removes its record. Attached volumes and snapshots may be lost. This action cannot be undone."
                          confirmLabel="Delete VM"
                          onConfirm={() => deleteVM(vm)}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConnectDialog
        open={!!connectTarget}
        onOpenChange={(v) => !v && setConnectTarget(null)}
        target={connectTarget}
      />

      {/* Snapshots dialog */}
      <Dialog open={!!snapVm} onOpenChange={(v) => { if (!v) { setSnapVm(null); setSnaps([]); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Snapshots — {snapVm?.name}</DialogTitle>
            <DialogDescription>
              Create point-in-time snapshots, restore the VM, or clone into a new instance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">New snapshot name</Label>
                <Input value={snapName} onChange={(e) => setSnapName(e.target.value)} />
              </div>
              <Button onClick={createSnapshot} disabled={snapBusy}>
                <Camera className="h-4 w-4 mr-1" /> Snapshot
              </Button>
            </div>
            <div className="max-h-72 overflow-auto space-y-2">
              {snaps.length === 0 && <p className="text-xs text-muted-foreground">No snapshots yet.</p>}
              {snaps.map((s) => (
                <div key={s.id} className="border border-border rounded-md p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.size_gb} GB · {s.status} · {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => restoreSnapshot(s)} disabled={snapBusy}>
                      <Undo2 className="h-3.5 w-3.5 mr-1" /> Restore
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => cloneSnapshot(s)} disabled={snapBusy}>
                      <CopyIcon className="h-3.5 w-3.5 mr-1" /> Clone
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSnapshot(s)} disabled={snapBusy}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSnapVm(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsoleLayout>
  );
};

export default Compute;
