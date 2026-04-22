import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cloud, Server, Plus, Power, PowerOff, Trash2,
  Cpu, HardDrive, MemoryStick, Globe, Monitor, RefreshCw, Copy,
} from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import {
  createComputeInstance,
  deleteComputeInstance,
  listComputeInstances,
  updateComputeStatus,
} from "@/lib/controlPlane";
import { useResourcePoller } from "@/hooks/useResourcePoller";
import { deleteComputeFromProvider, provisionCompute, startCompute, stopCompute } from "@/lib/providerApi";

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
  tags?: Record<string, string>;
};

const getConnectivity = (vm: VM) => vm.tags?.connectivity ?? "unknown";
const getSshUser = (vm: VM) => vm.tags?.ssh_user ?? null;
const getSshPort = (vm: VM) => (vm.tags?.ssh_port ? Number(vm.tags.ssh_port) : null);
const getHost = (vm: VM) => vm.tags?.connect_host ?? vm.ip_address;
const getAuthMethod = (vm: VM) => vm.tags?.auth_method ?? null;
const getSshKeyName = (vm: VM) => vm.tags?.ssh_key_name ?? null;
const isConnectReady = (vm: VM) => {
  if (vm.status !== "running") return false;
  const host = getHost(vm);
  const user = getSshUser(vm);
  const port = getSshPort(vm);
  const auth = getAuthMethod(vm);
  if (!host || !user || !port || !auth) return false;
  if (auth === "ssh-key") return Boolean(getSshKeyName(vm));
  return true;
};

const Compute = () => {
  const { user, loading } = useAuth();
  const { organization, project, loading: workspaceLoading } = useWorkspace();
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
  const realProvisioningEnabled = Boolean(import.meta.env.VITE_PROVIDER_API_BASE_URL);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchVMs = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await listComputeInstances(user.id);
    if (error) {
      toast.error("Failed to load instances");
    } else {
      setVms(data || []);
    }
    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchVMs();
  }, [user, fetchVMs]);

  useResourcePoller(user?.id, fetchVMs);

  const selectedMachine = MACHINE_TYPES.find((m) => m.value === machineType)!;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Instance name is required");
      return;
    }
    if (!organization?.id) {
      toast.error("Organization context missing");
      return;
    }
    setCreating(true);
    const machine = MACHINE_TYPES.find((m) => m.value === machineType)!;

    try {
      const providerVm = await provisionCompute({
        name: name.trim(),
        region,
        machine_type: machineType,
        os_image: osImage,
      });

      const connectionTags: Record<string, string> = { provider_id: providerVm.provider_id };
      if (providerVm.access?.ssh_user) connectionTags.ssh_user = providerVm.access.ssh_user;
      if (providerVm.access?.ssh_port) connectionTags.ssh_port = String(providerVm.access.ssh_port);
      if (providerVm.access?.connectivity) connectionTags.connectivity = providerVm.access.connectivity;
      if (providerVm.access?.auth_method) connectionTags.auth_method = providerVm.access.auth_method;
      if (providerVm.access?.ssh_key_name) connectionTags.ssh_key_name = providerVm.access.ssh_key_name;
      if (providerVm.access?.host) connectionTags.connect_host = providerVm.access.host;
      if (!connectionTags.connect_host && providerVm.public_ip) connectionTags.connect_host = providerVm.public_ip;
      if (!connectionTags.connect_host && providerVm.private_ip) connectionTags.connect_host = providerVm.private_ip;

      await createComputeInstance(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        {
          name: name.trim(),
          region,
          machine_type: machineType,
          vcpus: machine.vcpus,
          ram_gb: machine.ram,
          disk_gb: machine.disk,
          os_image: osImage,
          status: providerVm.status || "provisioning",
          ip_address: providerVm.public_ip ?? providerVm.private_ip ?? null,
          tags: connectionTags,
          price: machine.price,
        }
      );
      toast.success("Instance request sent to provider");
      setShowCreate(false);
      setName("");
      fetchVMs();
    } catch {
      toast.error("Failed to create instance");
    }
    setCreating(false);
  };

  const toggleVM = async (vm: VM) => {
    const newStatus = vm.status === "running" ? "stopped" : "running";
    const providerId = (vm as VM & { tags?: Record<string, string> }).tags?.provider_id;
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      if (!providerId) throw new Error("Missing provider identifier");

      const providerState = vm.status === "running" ? await stopCompute(providerId) : await startCompute(providerId);

      await updateComputeStatus(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        vm.id,
        providerState.status || newStatus
      );
      toast.success(newStatus === "running" ? "Instance starting…" : "Instance stopping…");
      fetchVMs();
    } catch {
      toast.error("Action failed");
    }
  };

  const deleteVM = async (vm: VM) => {
    const providerId = (vm as VM & { tags?: Record<string, string> }).tags?.provider_id;
    try {
      if (!organization?.id) throw new Error("Organization context missing");
      if (providerId) await deleteComputeFromProvider(providerId);
      await deleteComputeInstance(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        vm.id
      );
      toast.success("Instance terminated");
      fetchVMs();
    } catch {
      toast.error("Failed to terminate");
    }
  };

  const copySshCommand = async (vm: VM) => {
    const host = getHost(vm);
    const user = getSshUser(vm);
    const port = getSshPort(vm);
    const authMethod = getAuthMethod(vm);
    if (!host) {
      toast.error("No host available for this instance yet");
      return;
    }
    if (!user || !port || !authMethod) {
      toast.error("Connection details are still pending from the provider");
      return;
    }
    if (authMethod === "password") {
      const command = `ssh -p ${port} ${user}@${host}`;
      await navigator.clipboard.writeText(command);
      toast.success("SSH command copied");
      return;
    }
    const keyName = getSshKeyName(vm);
    if (!keyName) {
      toast.error("SSH key name is pending from the provider");
      return;
    }
    const command = `ssh -i ~/.ssh/${keyName} -p ${port} ${user}@${host}`;
    await navigator.clipboard.writeText(command);
    toast.success("SSH command copied");
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
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="gap-2"
          disabled={!realProvisioningEnabled}
          title={
            realProvisioningEnabled
              ? "Launch Instance"
              : "Set VITE_PROVIDER_API_BASE_URL to enable real provisioning"
          }
        >
          <Plus className="h-4 w-4" /> Launch Instance
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!realProvisioningEnabled && (
          <Card className="mb-6 border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="py-4 text-sm">
              <p className="text-foreground font-medium">Real provisioning is not enabled.</p>
              <p className="text-muted-foreground mt-1">
                Set <code>VITE_PROVIDER_API_BASE_URL</code> and configure a provider token in Developers to create
                and connect to real instances.
              </p>
            </CardContent>
          </Card>
        )}
        {/* Create Instance Panel */}
        {showCreate && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> New Virtual Machine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <Button
                  onClick={() => setShowCreate(true)}
                  className="gap-2"
                  disabled={!realProvisioningEnabled}
                  title={
                    realProvisioningEnabled
                      ? "Launch Instance"
                      : "Set VITE_PROVIDER_API_BASE_URL to enable real provisioning"
                  }
                >
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
                        {getHost(vm) && (
                          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                            {getHost(vm)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded capitalize">
                          {getConnectivity(vm)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded capitalize ${
                            isConnectReady(vm)
                              ? "text-green-400 bg-green-400/10"
                              : "text-muted-foreground bg-muted"
                          }`}
                        >
                          {isConnectReady(vm) ? "connect-ready" : "connect-pending"}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[vm.status] || "text-muted-foreground bg-muted"}`}>
                          {vm.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copySshCommand(vm)}
                          disabled={!isConnectReady(vm)}
                          title="Copy SSH command"
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
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
                        <Button variant="ghost" size="icon" onClick={() => deleteVM(vm)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="rounded border border-border bg-secondary px-2.5 py-2">
                        <span className="text-muted-foreground">Host</span>
                        <p className="font-mono text-foreground mt-0.5">{getHost(vm) ?? "Pending..."}</p>
                      </div>
                      <div className="rounded border border-border bg-secondary px-2.5 py-2">
                        <span className="text-muted-foreground">SSH User</span>
                        <p className="font-mono text-foreground mt-0.5">{getSshUser(vm) ?? "Pending from provider..."}</p>
                      </div>
                      <div className="rounded border border-border bg-secondary px-2.5 py-2">
                        <span className="text-muted-foreground">Port</span>
                        <p className="font-mono text-foreground mt-0.5">{getSshPort(vm) ?? "Pending from provider..."}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="rounded border border-border bg-secondary px-2.5 py-2">
                        <span className="text-muted-foreground">Auth Method</span>
                        <p className="font-mono text-foreground mt-0.5">{getAuthMethod(vm) ?? "Pending from provider..."}</p>
                      </div>
                      <div className="rounded border border-border bg-secondary px-2.5 py-2">
                        <span className="text-muted-foreground">Credentials</span>
                        <p className="text-foreground mt-0.5">
                          {getAuthMethod(vm) === "password"
                            ? "Password managed by provider (not stored in console)"
                            : getSshKeyName(vm)
                              ? `Use SSH key ~/.ssh/${getSshKeyName(vm)}`
                              : "SSH key name pending from provider"}
                        </p>
                      </div>
                    </div>
                    {getConnectivity(vm) !== "public" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Install your mesh client and join the org network before connecting.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ConsoleLayout>
  );
};

export default Compute;
