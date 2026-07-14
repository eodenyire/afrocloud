
-- Shared updated_at helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ functions ============
CREATE TABLE public.functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  runtime TEXT NOT NULL DEFAULT 'js',
  code TEXT NOT NULL DEFAULT 'export default async (req) => ({ hello: "africa" });',
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  memory_mb INTEGER NOT NULL DEFAULT 128,
  status TEXT NOT NULL DEFAULT 'ready',
  last_invoked_at TIMESTAMPTZ,
  invocation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.functions TO authenticated;
GRANT ALL ON public.functions TO service_role;
ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own functions all" ON public.functions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ function_invocations ============
CREATE TABLE public.function_invocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_id UUID NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  logs TEXT,
  result JSONB,
  error TEXT,
  invoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.function_invocations TO authenticated;
GRANT ALL ON public.function_invocations TO service_role;
ALTER TABLE public.function_invocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invocations all" ON public.function_invocations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_function_invocations_function_id ON public.function_invocations(function_id, invoked_at DESC);

-- ============ vm_snapshots ============
CREATE TABLE public.vm_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vm_id UUID NOT NULL REFERENCES public.virtual_machines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_gb INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'creating',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vm_snapshots TO authenticated;
GRANT ALL ON public.vm_snapshots TO service_role;
ALTER TABLE public.vm_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots all" ON public.vm_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ dns_records public read for resolver ============
GRANT SELECT ON public.dns_records TO anon;
DROP POLICY IF EXISTS "dns public read" ON public.dns_records;
CREATE POLICY "dns public read" ON public.dns_records
  FOR SELECT TO anon USING (true);

-- ============ updated_at triggers ============
CREATE TRIGGER update_functions_updated_at
  BEFORE UPDATE ON public.functions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vm_snapshots_updated_at
  BEFORE UPDATE ON public.vm_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
