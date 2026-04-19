import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Console from "./pages/Console.tsx";
import Compute from "./pages/Compute.tsx";
import Databases from "./pages/Databases.tsx";
import StoragePage from "./pages/Storage.tsx";
import EdgeNodes from "./pages/EdgeNodes.tsx";
import Networking from "./pages/Networking.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import IAM from "./pages/IAM.tsx";
import Billing from "./pages/Billing.tsx";
import AuditLogs from "./pages/AuditLogs.tsx";
import IaC from "./pages/IaC.tsx";
import Developers from "./pages/Developers.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/console" element={<Console />} />
            <Route path="/console/compute" element={<Compute />} />
            <Route path="/console/databases" element={<Databases />} />
            <Route path="/console/storage" element={<StoragePage />} />
            <Route path="/console/edge-nodes" element={<EdgeNodes />} />
            <Route path="/console/networking" element={<Networking />} />
            <Route path="/console/iam" element={<IAM />} />
            <Route path="/console/billing" element={<Billing />} />
            <Route path="/console/audit" element={<AuditLogs />} />
            <Route path="/console/iac" element={<IaC />} />
            <Route path="/console/developers" element={<Developers />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
