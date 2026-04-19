import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Cloud, ArrowRight, Eye, EyeOff, Github, Chrome, Apple, Building2 } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoDomain, setSsoDomain] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleOAuth = async (provider: "github" | "google" | "apple" | "azure") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/console` },
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSsoRequest = async () => {
    if (!ssoDomain.trim()) {
      toast({ title: "Missing domain", description: "Enter your corporate domain to continue." });
      return;
    }
    setSsoLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Sign in required",
        description: "Sign in first, then submit your enterprise SSO request.",
        variant: "destructive",
      });
      setSsoLoading(false);
      return;
    }
    const { error } = await supabase.from("sso_requests").insert({
      user_id: session.user.id,
      company_domain: ssoDomain.trim().toLowerCase(),
      provider: "saml",
    });
    if (error) {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "SSO request sent", description: "We will contact your admin with setup steps." });
      setSsoDomain("");
    }
    setSsoLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/console");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 bg-grid">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold text-foreground">
              The Africa Cloud
            </span>
          </div>
          <p className="text-muted-foreground">
            {isSignUp
              ? "Create your account to get started"
              : "Sign in to your console"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-border bg-card p-8 glow-amber">
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2" onClick={() => handleOAuth("github")} disabled={loading}>
              <Github className="h-4 w-4" /> GitHub
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleOAuth("google")} disabled={loading}>
              <Chrome className="h-4 w-4" /> Google
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleOAuth("apple")} disabled={loading}>
              <Apple className="h-4 w-4" /> Apple
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleOAuth("azure")} disabled={loading}>
              <Building2 className="h-4 w-4" /> Microsoft
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-secondary/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Enterprise SSO (SAML/OIDC)
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Submit your corporate domain to enable SSO for your organization.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="company.com"
                value={ssoDomain}
                onChange={(e) => setSsoDomain(e.target.value)}
                className="bg-background border-border"
              />
              <Button onClick={handleSsoRequest} disabled={ssoLoading}>
                {ssoLoading ? "Sending..." : "Request"}
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to The Africa Cloud Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
