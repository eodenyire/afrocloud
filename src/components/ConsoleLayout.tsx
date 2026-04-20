import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  Cloud, Server, Database, HardDrive, Globe, Shield,
  BarChart3, LogOut, Network, FileCode, Receipt, KeyRound,
  BookOpenCheck, Settings, Activity, ChevronLeft, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: Activity, label: "Overview", href: "/console" },
  { icon: Server, label: "Compute", href: "/console/compute" },
  { icon: Database, label: "Databases", href: "/console/databases" },
  { icon: HardDrive, label: "Storage", href: "/console/storage" },
  { icon: Globe, label: "Edge Nodes", href: "/console/edge-nodes" },
  { icon: Network, label: "Networking", href: "/console/networking" },
  { icon: Shield, label: "IAM", href: "/console/iam" },
  { icon: FileCode, label: "IaC Studio", href: "/console/iac" },
  { icon: KeyRound, label: "Developers", href: "/console/developers" },
  { icon: Receipt, label: "Billing", href: "/console/billing" },
  { icon: BookOpenCheck, label: "Audit Logs", href: "/console/audit" },
  { icon: BarChart3, label: "Observability", href: "/console/observability" },
  { icon: Settings, label: "Settings", href: "/console/settings" },
];

type ConsoleLayoutProps = {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
};

export const ConsoleLayout = ({ children, title, actions }: ConsoleLayoutProps) => {
  const { user, signOut } = useAuth();
  const { organization, profile } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const orgName = organization?.name || profile?.org_name || "—";

  const currentItem = NAV_ITEMS.find((item) =>
    item.href === "/console"
      ? location.pathname === "/console"
      : location.pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-56 bg-card border-r border-border z-40 flex flex-col transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <button onClick={() => navigate("/console")} className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-sm text-foreground">Africa Cloud</span>
          </button>
          <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org badge */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <p className="text-xs text-muted-foreground truncate">{orgName}</p>
          <p className="text-xs text-primary/80 truncate">{profile?.plan ?? "starter"} plan</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/console"
                ? location.pathname === "/console"
                : location.pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all
                  ${active
                    ? "text-primary bg-primary/10 font-medium border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start gap-2 px-0 text-xs text-muted-foreground" onClick={signOut}>
            <LogOut className="h-3 w-3" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
          <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          {title ? (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/console")} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h1 className="font-heading font-semibold text-foreground text-sm">{currentItem?.label ?? title}</h1>
            </div>
          ) : (
            <span className="font-heading font-bold text-sm text-foreground hidden md:block">Console</span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {actions}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
