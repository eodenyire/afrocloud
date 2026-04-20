import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { Cloud, KeyRound, TerminalSquare, Code2 } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
  listSsoRequests,
} from "@/lib/controlPlane";

type ApiToken = {
  id: string;
  name: string;
  created_at: string | null;
  last_used_at: string | null;
};

type SsoRequest = {
  id: string;
  company_domain: string;
  provider: string;
  status: string;
  created_at: string | null;
};

const hashToken = async (token: string) => {
  const buffer = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const Developers = () => {
  const { user, loading } = useAuth();
  const { organization, project, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [ssoRequests, setSsoRequests] = useState<SsoRequest[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchTokens = async () => {
    if (!user) return;
    const [tokensResponse, ssoResponse] = await Promise.all([
      listApiTokens(user.id),
      listSsoRequests(user.id),
    ]);
    setTokens((tokensResponse.data as ApiToken[]) || []);
    setSsoRequests((ssoResponse.data as SsoRequest[]) || []);
  };

  useEffect(() => {
    if (user) fetchTokens();
  }, [user]);

  const handleCreateToken = async () => {
    if (!organization?.id) return;
    if (!tokenName.trim()) {
      toast.error("Token name is required");
      return;
    }
    setCreating(true);
    const rawToken = `ac_${crypto.randomUUID().replace(/-/g, "")}`;
    const tokenHash = await hashToken(rawToken);
    const { error } = await createApiToken(
      { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
      { name: tokenName.trim(), tokenHash }
    );
    if (error) toast.error("Failed to create token");
    else {
      toast.success("Token created");
      setTokenPreview(rawToken);
      setTokenName("");
      fetchTokens();
    }
    setCreating(false);
  };

  const handleRevoke = async (tokenId: string) => {
    const { error } = await revokeApiToken(tokenId);
    if (error) toast.error("Failed to revoke token");
    else {
      toast.success("Token revoked");
      fetchTokens();
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
    <ConsoleLayout title="Developers">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create API token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Token name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
              <Button onClick={handleCreateToken} disabled={creating}>
                Create Token
              </Button>
            </div>
            {tokenPreview && (
              <div className="rounded-lg border border-border bg-secondary p-3 text-xs">
                <p className="text-muted-foreground">Copy this token now. It will not be shown again.</p>
                <p className="font-mono text-foreground mt-2">{tokenPreview}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API tokens yet.</p>
            ) : (
              tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{token.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {token.created_at?.split("T")[0]}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(token.id)}>
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CLI & SDK quickstart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <TerminalSquare className="h-4 w-4 text-primary" />
              <span>CLI: acctl login --token &lt;API_TOKEN&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Code2 className="h-4 w-4 text-primary" />
              <span>SDK: import {{ AfricaCloud }} from "@africa-cloud/sdk"</span>
            </div>
            <p>
              Use the same OAuth or API token credentials across console, CLI, and SDK workflows.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise SSO requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ssoRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No SSO requests submitted.</p>
            ) : (
              ssoRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{request.company_domain}</p>
                    <p className="text-xs text-muted-foreground">{request.provider.toUpperCase()} · {request.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{request.created_at?.split("T")[0]}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ConsoleLayout>
  );
};

export default Developers;
