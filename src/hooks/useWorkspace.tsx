import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type WorkspaceProfile = {
  org_id: string | null;
  project_id: string | null;
  org_name: string | null;
  plan: string | null;
  region: string | null;
  onboarded: boolean | null;
  role: string | null;
  mfa_enabled: boolean | null;
};

type Organization = {
  id: string;
  name: string;
  region: string | null;
  plan: string | null;
};

type Project = {
  id: string;
  name: string;
  environment: string;
  org_id: string;
};

export const useWorkspace = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setOrganization(null);
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("org_id, project_id, org_name, plan, region, onboarded, role, mfa_enabled")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setProfile(null);
      setOrganization(null);
      setProject(null);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    if (profileData?.org_id) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, region, plan")
        .eq("id", profileData.org_id)
        .single();
      setOrganization(
        orgData ?? {
          id: profileData.org_id,
          name: profileData.org_name ?? "Your Organization",
          region: profileData.region,
          plan: profileData.plan,
        }
      );
    } else {
      setOrganization(null);
    }

    if (profileData?.project_id) {
      const { data: projectData } = await supabase
        .from("projects")
        .select("id, name, environment, org_id")
        .eq("id", profileData.project_id)
        .single();
      setProject(
        projectData ?? {
          id: profileData.project_id,
          name: `${profileData.org_name ?? "Organization"} Core`,
          environment: "production",
          org_id: profileData.org_id ?? "",
        }
      );
    } else {
      setProject(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchWorkspace();
  }, [authLoading, fetchWorkspace]);

  return {
    profile,
    organization,
    project,
    loading: authLoading || loading,
    refresh: fetchWorkspace,
  };
};
