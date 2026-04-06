import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Cloud, Building2, Globe, Server, ArrowRight, ArrowLeft,
  CheckCircle2, MapPin,
} from "lucide-react";

const regions = [
  { id: "nairobi", name: "Nairobi", country: "Kenya", flag: "🇰🇪" },
  { id: "lagos", name: "Lagos", country: "Nigeria", flag: "🇳🇬" },
  { id: "cape-town", name: "Cape Town", country: "South Africa", flag: "🇿🇦" },
  { id: "cairo", name: "Cairo", country: "Egypt", flag: "🇪🇬" },
  { id: "accra", name: "Accra", country: "Ghana", flag: "🇬🇭" },
  { id: "kigali", name: "Kigali", country: "Rwanda", flag: "🇷🇼" },
];

const plans = [
  { id: "starter", name: "Starter", price: "Free", features: ["1 VM", "5GB Storage", "1 Edge Node", "Community Support"] },
  { id: "pro", name: "Pro", price: "$49/mo", features: ["10 VMs", "100GB Storage", "5 Edge Nodes", "Priority Support"] },
  { id: "enterprise", name: "Enterprise", price: "Custom", features: ["Unlimited VMs", "Unlimited Storage", "Unlimited Edge Nodes", "Dedicated Support"] },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("starter");

  const steps = [
    { title: "Create Organization", icon: Building2 },
    { title: "Select Region", icon: MapPin },
    { title: "Choose Plan", icon: Server },
    { title: "You're All Set", icon: CheckCircle2 },
  ];

  const canProceed = () => {
    if (step === 0) return orgName.trim().length > 0;
    if (step === 1) return selectedRegion.length > 0;
    if (step === 2) return selectedPlan.length > 0;
    return true;
  };

  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        org_name: orgName,
        region: selectedRegion,
        plan: selectedPlan,
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile. Please try again.");
      setSaving(false);
      return;
    }
    navigate("/console");
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <span className="font-heading font-bold text-foreground">The Africa Cloud</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s.title} className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="rounded-xl border border-border bg-card p-8">
            {/* Step 0: Organization */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Building2 className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h2 className="text-2xl font-heading font-bold text-foreground">Create Your Organization</h2>
                  <p className="text-muted-foreground mt-1">This will be your workspace on The Africa Cloud</p>
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g. Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Region */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h2 className="text-2xl font-heading font-bold text-foreground">Select Your Primary Region</h2>
                  <p className="text-muted-foreground mt-1">Choose the data center closest to your users</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedRegion === region.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/40"
                      }`}
                    >
                      <span className="text-2xl">{region.flag}</span>
                      <p className="font-heading font-semibold text-foreground mt-2">{region.name}</p>
                      <p className="text-xs text-muted-foreground">{region.country}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Plan */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Server className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h2 className="text-2xl font-heading font-bold text-foreground">Choose Your Plan</h2>
                  <p className="text-muted-foreground mt-1">Start free, scale when ready</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-5 rounded-lg border text-left transition-all ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/40"
                      }`}
                    >
                      <p className="font-heading font-bold text-foreground text-lg">{plan.name}</p>
                      <p className="text-primary font-semibold text-xl mt-1">{plan.price}</p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center space-y-4 py-6">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground">You're All Set!</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Your organization <span className="text-foreground font-semibold">{orgName}</span> is ready.
                  Let's launch your first resource on The Africa Cloud.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-primary text-primary-foreground"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving} className="bg-primary text-primary-foreground">
                  {saving ? "Saving..." : "Launch Console"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;