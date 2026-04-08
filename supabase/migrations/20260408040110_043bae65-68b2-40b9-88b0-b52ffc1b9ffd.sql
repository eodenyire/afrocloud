
CREATE TABLE public.edge_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'nairobi',
  node_type TEXT NOT NULL DEFAULT 'ac-edge-1',
  vcpus INTEGER NOT NULL DEFAULT 2,
  ram_gb INTEGER NOT NULL DEFAULT 4,
  disk_gb INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'deploying',
  ip_address TEXT,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  workloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.edge_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own edge nodes" ON public.edge_nodes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own edge nodes" ON public.edge_nodes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own edge nodes" ON public.edge_nodes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own edge nodes" ON public.edge_nodes FOR DELETE TO authenticated USING (auth.uid() = user_id);
