-- Control plane core schema: orgs/projects/IAM/resources/audit/billing/IaC

-- Organizations & projects
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  plan TEXT DEFAULT 'starter',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scope_type TEXT NOT NULL DEFAULT 'org',
  scope_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.role_bindings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = check_org_id AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = check_org_id AND m.user_id = auth.uid() AND m.role = 'owner'
  );
$$;

CREATE POLICY "Org members can view orgs" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "Users can create orgs" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Org owners can update orgs" ON public.organizations
  FOR UPDATE TO authenticated USING (public.is_org_owner(id)) WITH CHECK (public.is_org_owner(id));
CREATE POLICY "Org owners can delete orgs" ON public.organizations
  FOR DELETE TO authenticated USING (public.is_org_owner(id));

CREATE POLICY "Org members can view memberships" ON public.memberships
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org owners can manage memberships" ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can update memberships" ON public.memberships
  FOR UPDATE TO authenticated USING (public.is_org_owner(org_id)) WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can delete memberships" ON public.memberships
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

CREATE POLICY "Org members can view projects" ON public.projects
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org members can create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org owners can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (public.is_org_owner(org_id)) WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can delete projects" ON public.projects
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

CREATE POLICY "Org members can view roles" ON public.roles
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org owners can manage roles" ON public.roles
  FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can update roles" ON public.roles
  FOR UPDATE TO authenticated USING (public.is_org_owner(org_id)) WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can delete roles" ON public.roles
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

CREATE POLICY "Org members can view role bindings" ON public.role_bindings
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org owners can manage role bindings" ON public.role_bindings
  FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can update role bindings" ON public.role_bindings
  FOR UPDATE TO authenticated USING (public.is_org_owner(org_id)) WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can delete role bindings" ON public.role_bindings
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

-- Provider accounts
CREATE TABLE public.provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  account_id TEXT,
  credentials_ref TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view provider accounts" ON public.provider_accounts
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org owners can manage provider accounts" ON public.provider_accounts
  FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can update provider accounts" ON public.provider_accounts
  FOR UPDATE TO authenticated USING (public.is_org_owner(org_id)) WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can delete provider accounts" ON public.provider_accounts
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

-- Unified resource registry
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  name TEXT NOT NULL,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'provisioning',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.resource_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_key TEXT NOT NULL,
  tag_value TEXT NOT NULL
);

ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.resource_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  message TEXT
);

ALTER TABLE public.resource_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view resources" ON public.resources
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org members can create resources" ON public.resources
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org members can update resources" ON public.resources
  FOR UPDATE TO authenticated USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org owners can delete resources" ON public.resources
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

CREATE POLICY "Org members can view resource tags" ON public.resource_tags
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can manage resource tags" ON public.resource_tags
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can update resource tags" ON public.resource_tags
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can delete resource tags" ON public.resource_tags
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );

CREATE POLICY "Org members can view resource operations" ON public.resource_operations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can create resource operations" ON public.resource_operations
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can update resource operations" ON public.resource_operations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND public.is_org_member(r.org_id))
  );

-- Audit logs & cost tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  resource_id UUID,
  resource_type TEXT,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  usage_unit TEXT NOT NULL DEFAULT 'month',
  usage_quantity NUMERIC NOT NULL DEFAULT 1,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cost_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  quota_limit INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org members can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());

CREATE POLICY "Org members can view cost records" ON public.cost_records
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org members can insert cost records" ON public.cost_records
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Org members can view quotas" ON public.quotas
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org owners can manage quotas" ON public.quotas
  FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can update quotas" ON public.quotas
  FOR UPDATE TO authenticated USING (public.is_org_owner(org_id)) WITH CHECK (public.is_org_owner(org_id));
CREATE POLICY "Org owners can delete quotas" ON public.quotas
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

-- IaC / AI templates & runs
CREATE TABLE public.iac_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ac-dsl',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.iac_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.iac_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.iac_templates(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  triggered_by UUID NOT NULL,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_violations JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.iac_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.iac_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.iac_runs(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.iac_run_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view iac templates" ON public.iac_templates
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage iac templates" ON public.iac_templates
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org members can update iac templates" ON public.iac_templates
  FOR UPDATE TO authenticated USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org owners can delete iac templates" ON public.iac_templates
  FOR DELETE TO authenticated USING (public.is_org_owner(org_id));

CREATE POLICY "Org members can view iac runs" ON public.iac_runs
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "Org members can create iac runs" ON public.iac_runs
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(org_id) AND triggered_by = auth.uid());
CREATE POLICY "Org members can update iac runs" ON public.iac_runs
  FOR UPDATE TO authenticated USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Org members can view iac run steps" ON public.iac_run_steps
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.iac_runs r WHERE r.id = run_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can manage iac run steps" ON public.iac_run_steps
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.iac_runs r WHERE r.id = run_id AND public.is_org_member(r.org_id))
  );
CREATE POLICY "Org members can update iac run steps" ON public.iac_run_steps
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.iac_runs r WHERE r.id = run_id AND public.is_org_member(r.org_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.iac_runs r WHERE r.id = run_id AND public.is_org_member(r.org_id))
  );

-- API tokens for CLI/SDK
CREATE TABLE public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api tokens" ON public.api_tokens
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own api tokens" ON public.api_tokens
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own api tokens" ON public.api_tokens
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own api tokens" ON public.api_tokens
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SSO requests for enterprise IdP onboarding
CREATE TABLE public.sso_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  company_domain TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'saml',
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sso_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sso requests" ON public.sso_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own sso requests" ON public.sso_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Extend profiles for org/project context + MFA flag
ALTER TABLE public.profiles
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN role TEXT DEFAULT 'owner',
  ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;

-- Extend resource tables with org/project/provider context
ALTER TABLE public.virtual_machines
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.database_instances
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.storage_buckets
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.edge_nodes
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.vpcs
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.load_balancers
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.dns_records
  ADD COLUMN org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN project_id UUID REFERENCES public.projects(id),
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'africa-cloud',
  ADD COLUMN tags JSONB NOT NULL DEFAULT '{}'::jsonb;
