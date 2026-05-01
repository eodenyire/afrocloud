import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { Cloud, Settings as SettingsIcon, User, Building2, Shield, Plus, Trash2 } from "lucide-react";
import { createSsoRequest, listSsoRequests } from "@/lib/controlPlane";

type ProviderAccount = {
  id: string;
  provider: string;
  alias: string | null;
  status: string;
  created_at: string | null;
};

type SsoRequest = {
  id: string;
  company_domain: string;
  provider: string;
  status: string;
  created_at: string | null;
};

const Settings = () => {
  const { user, loading } = useAuth();
  const { organization, profile, project, loading: workspaceLoading, refresh } = useWorkspace();
  const navigate = useNavigate();

  // Profile
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Org
  const [orgName, setOrgName] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Provider accounts
  const [providers, setProviders] = useState<ProviderAccount[]>([]);
  const [providerType, setProviderType] = useState("aws");
  const [providerAlias, setProviderAlias] = useState("");
  const [addingProvider, setAddingProvider] = useState(false);

  // SSO
  const [ssoRequests, setSsoRequests] = useState<SsoRequest[]>([]);
  const [ssoDomain, setSsoDomain] = useState("");
  const [ssoProvider, setSsoProvider] = useState("saml");
  const [submittingSso, setSubmittingSso] = useState(false);

  // MFA
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [togglingMfa, setTogglingMfa] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) setFullName(user.user_metadata?.full_name ?? "");
    if (organization) setOrgName(organization.name);
    if (profile) setMfaEnabled((profile as { mfa_enabled?: boolean }).mfa_enabled ?? false);
  }, [user, organization, profile]);

  const fetchProviders = useCallback(async () => {
    if (!organization?.id) return;
    const { data } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (col: string, val: string) => { order: (c: string, o: { ascending: boolean }) => Promise<{ data: unknown[] | null }> } } } })
      .from("provider_accounts")
      .select("*")
      .eq("org_id", organization.id)
      .order("created_at", { ascending: false });
    setProviders(((data as unknown) as ProviderAccount[]) ?? []);
  }, [organization?.id]);

  const fetchSso = useCallback(async () => {
    if (!user) return;
    const { data } = await listSsoRequests(user.id);
    setSsoRequests((data as SsoRequest[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchProviders();
    fetchSso();
  }, [fetchProviders, fetchSso]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated");
    setSavingProfile(false);
  };

  const handleSaveOrg = async () => {
    if (!organization?.id) return;
    setSavingOrg(true);
    const { error } = await (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } } })
      .from("organizations")
      .update({ name: orgName.trim() })
      .eq("id", organization.id);
    if (error) toast.error("Failed to update organization");
    else {
      toast.success("Organization updated");
      refresh();
    }
    setSavingOrg(false);
  };

  const handleAddProvider = async () => {
    if (!organization?.id || !providerAlias.trim()) {
      toast.error("Alias is required");
      return;
    }
    setAddingProvider(true);
    const { error } = await (supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<{ error: Error | null }> } })
      .from("provider_accounts")
      .insert({
        org_id: organization.id,
        project_id: project?.id ?? null,
        provider: providerType,
        alias: providerAlias.trim(),
        status: "pending",
        credentials: {},
      });
    if (error) toast.error("Failed to add provider account");
    else {
      toast.success("Provider account registered (credentials required)");
      setProviderAlias("");
      fetchProviders();
    }
    setAddingProvider(false);
  };

  const handleDeleteProvider = async (id: string) => {
    const { error } = await (supabase as unknown as { from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } } })
      .from("provider_accounts")
      .delete()
      .eq("id", id);
    if (error) toast.error("Failed to remove provider");
    else {
      toast.success("Provider removed");
      fetchProviders();
    }
  };

  const handleSsoRequest = async () => {
    if (!user || !organization?.id) return;
    if (!ssoDomain.trim()) { toast.error("Corporate domain required"); return; }
    setSubmittingSso(true);
    const { error } = await createSsoRequest(
      { userId: user.id, orgId: organization.id, projectId: project?.id ?? null },
      { companyDomain: ssoDomain.trim().toLowerCase(), provider: ssoProvider }
    );
    if (error) toast.error("Failed to submit SSO request");
    else {
      toast.success("SSO request submitted");
      setSsoDomain("");
      fetchSso();
    }
    setSubmittingSso(false);
  };

  const handleToggleMfa = async () => {
    if (!user) return;
    setTogglingMfa(true);
    const newValue = !mfaEnabled;
    const { error } = await supabase
      .from("profiles")
      .update({ mfa_enabled: newValue })
      .eq("id", user.id);
    if (error) toast.error("Failed to update MFA setting");
    else {
      toast.success(newValue ? "MFA enabled" : "MFA disabled");
      setMfaEnabled(newValue);
    }
    setTogglingMfa(false);
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  const PROVIDER_OPTIONS = ["aws", "azure", "gcp", "oracle", "africa-cloud"];

  return (
    <ConsoleLayout title="Settings">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email ?? ""} disabled className="mt-1 opacity-60" />
            </div>
            <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={handleSaveOrg} disabled={savingOrg}>
              Save Organization
            </Button>
          </CardContent>
        </Card>

        {/* MFA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Multi-factor authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
            </div>
            <Button
              size="sm"
              variant={mfaEnabled ? "destructive" : "default"}
              onClick={handleToggleMfa}
              disabled={togglingMfa}
            >
              {mfaEnabled ? "Disable MFA" : "Enable MFA"}
            </Button>
          </CardContent>
        </Card>

        {/* Provider Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-primary" /> Provider Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Register cloud provider credentials to enable multi-cloud provisioning through the control plane.
            </p>
            <div className="flex flex-wrap gap-3">
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
              <Input
                placeholder="Account alias (e.g. prod-aws)"
                value={providerAlias}
                onChange={(e) => setProviderAlias(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddProvider} disabled={addingProvider} className="gap-2">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {providers.length > 0 && (
              <div className="space-y-2">
                {providers.map((pa) => (
                  <div key={pa.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{pa.alias ?? pa.provider}</p>
                      <p className="text-xs text-muted-foreground">{pa.provider.toUpperCase()} · {pa.status}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProvider(pa.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enterprise SSO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <SettingsIcon className="h-4 w-4 text-primary" /> Enterprise SSO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Request SAML/OIDC SSO setup for your corporate domain.
            </p>
            <div className="flex flex-wrap gap-3">
              <select
                value={ssoProvider}
                onChange={(e) => setSsoProvider(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="saml">SAML 2.0</option>
                <option value="oidc">OIDC</option>
              </select>
              <Input
                placeholder="company.com"
                value={ssoDomain}
                onChange={(e) => setSsoDomain(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSsoRequest} disabled={submittingSso}>
                Submit
              </Button>
            </div>
            {ssoRequests.length > 0 && (
              <div className="space-y-2">
                {ssoRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{req.company_domain}</p>
                      <p className="text-xs text-muted-foreground">{req.provider.toUpperCase()} · {req.status}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{req.created_at?.split("T")[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </ConsoleLayout>
  );
};

export default Settings;
