
-- VPCs
CREATE TABLE public.vpcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'nairobi',
  cidr_block TEXT NOT NULL DEFAULT '10.0.0.0/16',
  status TEXT NOT NULL DEFAULT 'available',
  subnet_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.vpcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own vpcs" ON public.vpcs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vpcs" ON public.vpcs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vpcs" ON public.vpcs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vpcs" ON public.vpcs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Load Balancers
CREATE TABLE public.load_balancers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'nairobi',
  lb_type TEXT NOT NULL DEFAULT 'application',
  protocol TEXT NOT NULL DEFAULT 'HTTPS',
  port INTEGER NOT NULL DEFAULT 443,
  target_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'provisioning',
  dns_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.load_balancers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own lbs" ON public.load_balancers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lbs" ON public.load_balancers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lbs" ON public.load_balancers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own lbs" ON public.load_balancers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DNS Records
CREATE TABLE public.dns_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  zone TEXT NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'A',
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 300,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own dns" ON public.dns_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dns" ON public.dns_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dns" ON public.dns_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dns" ON public.dns_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
