-- Backfill migration for environments that started with only a subset of tables.
-- Creates required control-plane tables if missing so console pages can load and create resources.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.virtual_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  vcpus INTEGER NOT NULL,
  ram_gb INTEGER NOT NULL,
  disk_gb INTEGER NOT NULL,
  os_image TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioning',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.database_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  engine TEXT NOT NULL,
  version TEXT NOT NULL,
  region TEXT NOT NULL,
  plan TEXT NOT NULL,
  storage_gb INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioning',
  connection_string TEXT,
  port INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.storage_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  storage_class TEXT NOT NULL DEFAULT 'standard',
  object_count INTEGER NOT NULL DEFAULT 0,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.storage_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID NOT NULL REFERENCES public.storage_buckets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  node_type TEXT NOT NULL,
  vcpus INTEGER NOT NULL,
  ram_gb INTEGER NOT NULL,
  disk_gb INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'deploying',
  ip_address TEXT,
  sync_status TEXT NOT NULL DEFAULT 'syncing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.vpcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  cidr_block TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.load_balancers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  lb_type TEXT NOT NULL,
  protocol TEXT NOT NULL,
  port INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioning',
  dns_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  record_type TEXT NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 300,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'africa-cloud',
  name TEXT NOT NULL,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'provisioning',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resource_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  resource_id UUID,
  resource_type TEXT,
  amount_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  usage_unit TEXT DEFAULT 'month',
  usage_quantity NUMERIC(12,4) DEFAULT 1,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lightweight user-scoped RLS so listing/creation works consistently.
ALTER TABLE public.virtual_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vpcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_balancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='virtual_machines' AND policyname='Users manage own VMs') THEN
    CREATE POLICY "Users manage own VMs" ON public.virtual_machines FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='database_instances' AND policyname='Users manage own DBs') THEN
    CREATE POLICY "Users manage own DBs" ON public.database_instances FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='storage_buckets' AND policyname='Users manage own buckets') THEN
    CREATE POLICY "Users manage own buckets" ON public.storage_buckets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='storage_objects' AND policyname='Users manage own objects') THEN
    CREATE POLICY "Users manage own objects" ON public.storage_objects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='edge_nodes' AND policyname='Users manage own edge nodes') THEN
    CREATE POLICY "Users manage own edge nodes" ON public.edge_nodes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vpcs' AND policyname='Users manage own vpcs') THEN
    CREATE POLICY "Users manage own vpcs" ON public.vpcs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='load_balancers' AND policyname='Users manage own load balancers') THEN
    CREATE POLICY "Users manage own load balancers" ON public.load_balancers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dns_records' AND policyname='Users manage own dns records') THEN
    CREATE POLICY "Users manage own dns records" ON public.dns_records FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
