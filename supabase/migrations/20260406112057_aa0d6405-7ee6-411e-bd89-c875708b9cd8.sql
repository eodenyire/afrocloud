
CREATE TABLE public.virtual_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'nairobi',
  machine_type TEXT NOT NULL DEFAULT 'ac-standard-1',
  vcpus INTEGER NOT NULL DEFAULT 1,
  ram_gb INTEGER NOT NULL DEFAULT 2,
  disk_gb INTEGER NOT NULL DEFAULT 50,
  os_image TEXT NOT NULL DEFAULT 'ubuntu-22.04',
  status TEXT NOT NULL DEFAULT 'provisioning',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.virtual_machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own VMs" ON public.virtual_machines
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own VMs" ON public.virtual_machines
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own VMs" ON public.virtual_machines
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own VMs" ON public.virtual_machines
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
