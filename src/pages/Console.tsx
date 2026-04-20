import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import {
  Server, Database, HardDrive, Globe, Shield,
  BarChart3, Plus, Activity, Users,
  Network, Cpu, ChevronRight, BookOpen, FileCode, Receipt, KeyRound,
  Cloud,
} from "lucide-react";
import { useResourcePoller } from "@/hooks/useResourcePoller";

const SERVICE_DEFS = [
  { icon: Server, name: "Compute", href: "/console/compute", description: "Virtual machines & containers", table: "virtual_machines" as const },
  { icon: Database, name: "Databases", href: "/console/databases", description: "Managed PostgreSQL, Redis, MongoDB", table: "database_instances" as const },
  { icon: HardDrive, name: "Storage", href: "/console/storage", description: "Object & block storage", table: "storage_buckets" as const },
  { icon: Globe, name: "Edge Nodes", href: "/console/edge-nodes", description: "Distributed edge computing", table: "edge_nodes" as const },
  { icon: Network, name: "Networking", href: "/console/networking", description: "VPC, load balancers, DNS", table: "vpcs" as const },
  { icon: Shield, name: "Identity & Access", href: "/console/iam", description: "RBAC, SSO, MFA, tokens", table: null },
  { icon: Receipt, name: "Billing", href: "/console/billing", description: "Cost tracking & usage", table: null },
  { icon: BookOpen, name: "Audit Logs", href: "/console/audit", description: "Compliance & activity trails", table: null },
  { icon: FileCode, name: "IaC Studio", href: "/console/iac", description: "Templates, plans, policy checks", table: null },
  { icon: KeyRound, name: "Developer Tools", href: "/console/developers", description: "CLI, SDKs, API tokens", table: null },
  { icon: BarChart3, name: "Observability", href: "/console/observability", description: "Metrics, logs, and health status", table: null },
];

const quickActions = [
  { icon: Server, label: "Launch VM", href: "/console/compute" },
  { icon: Database, label: "Create Database", href: "/console/databases" },
  { icon: Globe, label: "Deploy Edge Node", href: "/console/edge-nodes" },
  { icon: Network, label: "Set Up VPC", href: "/console/networking" },
  { icon: FileCode, label: "Run IaC Plan", href: "/console/iac" },
  { icon: KeyRound, label: "Create API Token", href: "/console/developers" },
];

type Counts = Record<string, number>;

const Console = () => {
  const { user, loading } = useAuth();
  const { profile, organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<Counts>({});
  const [memberCount, setMemberCount] = useState(1);
  const [monthlyCost, setMonthlyCost] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || workspaceLoading) return;
    if (!profile?.onboarded) {
      navigate("/onboarding");
    } else {
      setHasOrg(true);
    }
  }, [user, profile, workspaceLoading, navigate]);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    const tables = ["virtual_machines", "database_instances", "storage_buckets", "edge_nodes", "vpcs"] as const;
    const results = await Promise.all(
      tables.map((t) => supabase.from(t).select("id", { count: "exact", head: true }))
    );
    const newCounts: Counts = {};
    tables.forEach((t, i) => { newCounts[t] = results[i].count ?? 0; });
    setCounts(newCounts);
  }, [user]);

  const fetchLiveStats = useCallback(async () => {
    if (!organization?.id) return;
    const [memberships, costs] = await Promise.all([
      supabase.from("memberships").select("id", { count: "exact", head: true }).eq("org_id", organization.id),
      supabase.from("cost_records").select("amount_usd").eq("org_id", organization.id),
    ]);
    setMemberCount(memberships.count ?? 1);
    const total = (costs.data ?? []).reduce((sum, row) => sum + (row.amount_usd ?? 0), 0);
    setMonthlyCost(total);
  }, [organization?.id]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchLiveStats(); }, [fetchLiveStats]);

  // Real-time + provisioning simulation
  useResourcePoller(user?.id, fetchCounts);

  if (loading || workspaceLoading || !user || !hasOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Cloud className="h-6 w-6 text-primary animate-pulse" />
          <span className="text-foreground font-heading">Loading console...</span>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const orgName = organization?.name || profile?.org_name || "Your Organization";
  const totalResources = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <ConsoleLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
            Welcome back, <span className="text-gradient-gold">{displayName}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {orgName} · {profile?.region ?? "Africa"} · {profile?.plan ?? "starter"} plan
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Cpu, label: "Active Resources", value: String(totalResources) },
            { icon: Activity, label: "Platform Uptime", value: "99.9%" },
            { icon: Users, label: "Team Members", value: String(memberCount) },
            { icon: BarChart3, label: "Monthly Cost", value: `$${monthlyCost.toFixed(2)}` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-base font-heading font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:bg-secondary transition-all group"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs text-foreground text-center leading-tight">{action.label}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground mb-4">Cloud Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_DEFS.map((service) => {
              const count = service.table ? (counts[service.table] ?? 0) : null;
              return (
                <div
                  key={service.name}
                  onClick={() => navigate(service.href)}
                  className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <service.icon className="h-5 w-5 text-primary" />
                    </div>
                    {count !== null && (
                      <span className={`text-xs px-2 py-1 rounded-full ${count > 0 ? "text-primary bg-primary/10 font-semibold" : "text-muted-foreground bg-secondary"}`}>
                        {count} active
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-1 text-sm">{service.name}</h3>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ConsoleLayout>
  );
};

export default Console;
