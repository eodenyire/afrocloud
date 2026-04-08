import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Cloud, Server, Database, HardDrive, Globe, Shield,
  BarChart3, Settings, LogOut, Plus, Activity, Users,
  Network, Cpu, ChevronRight,
} from "lucide-react";

const SERVICE_DEFS = [
  { icon: Server, name: "Compute", description: "Virtual machines & containers", table: "virtual_machines" as const },
  { icon: Database, name: "Databases", description: "Managed PostgreSQL, Redis, MongoDB", table: "database_instances" as const },
  { icon: HardDrive, name: "Storage", description: "Object & block storage", table: "storage_buckets" as const },
  { icon: Globe, name: "Edge Nodes", description: "Distributed edge computing", table: "edge_nodes" as const },
  { icon: Network, name: "Networking", description: "VPC, load balancers, DNS", table: "vpcs" as const },
  { icon: Shield, name: "Security", description: "IAM, firewalls, encryption", table: null },
];

const quickActions = [
  { icon: Server, label: "Launch VM", href: "#" },
  { icon: Database, label: "Create Database", href: "#" },
  { icon: Globe, label: "Deploy Edge Node", href: "#" },
  { icon: Network, label: "Set Up VPC", href: "#" },
];

type Counts = Record<string, number>;

const Console = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .single();
      if (!data?.onboarded) {
        navigate("/onboarding");
      } else {
        setHasOrg(true);
      }
    };
    checkOnboarding();
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const tables = ["virtual_machines", "database_instances", "storage_buckets", "edge_nodes", "vpcs"] as const;
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t).select("id", { count: "exact", head: true })
        )
      );
      const newCounts: Counts = {};
      tables.forEach((t, i) => {
        newCounts[t] = results[i].count ?? 0;
      });
      setCounts(newCounts);
    };
    fetchCounts();
  }, [user]);

  if (loading || !user || !hasOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Cloud className="h-6 w-6 text-primary animate-pulse-glow" />
          <span className="text-foreground font-heading">Loading console...</span>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Cloud className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">The Africa Cloud</span>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">Console</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{displayName}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
            Welcome back, <span className="text-gradient-gold">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">Manage your African cloud infrastructure</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Cpu, label: "Active Instances", value: String(Object.values(counts).reduce((a, b) => a + b, 0)) },
            { icon: Activity, label: "Uptime", value: "99.9%" },
            { icon: Users, label: "Team Members", value: "1" },
            { icon: BarChart3, label: "Monthly Cost", value: "$0.00" },
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:bg-secondary transition-all group"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">{action.label}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Cloud Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_DEFS.map((service) => {
              const count = service.table ? (counts[service.table] ?? 0) : 0;
              return (
                <div
                  key={service.name}
                  onClick={() => {
                    if (service.name === "Compute") navigate("/console/compute");
                    else if (service.name === "Databases") navigate("/console/databases");
                    else if (service.name === "Storage") navigate("/console/storage");
                    else if (service.name === "Edge Nodes") navigate("/console/edge-nodes");
                    else if (service.name === "Networking") navigate("/console/networking");
                  }}
                  className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <service.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${count > 0 ? "text-primary bg-primary/10 font-semibold" : "text-muted-foreground bg-secondary"}`}>
                      {count} active
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;