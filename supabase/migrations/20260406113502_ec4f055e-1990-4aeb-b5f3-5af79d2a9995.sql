
CREATE TABLE public.database_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  engine TEXT NOT NULL DEFAULT 'postgresql',
  version TEXT NOT NULL DEFAULT '16',
  region TEXT NOT NULL DEFAULT 'nairobi',
  plan TEXT NOT NULL DEFAULT 'db-standard-1',
  storage_gb INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'provisioning',
  connection_string TEXT,
  port INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.database_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own databases" ON public.database_instances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own databases" ON public.database_instances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own databases" ON public.database_instances FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own databases" ON public.database_instances FOR DELETE TO authenticated USING (auth.uid() = user_id);
