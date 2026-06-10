ALTER TABLE public.database_instances
  ADD COLUMN IF NOT EXISTS schema_name TEXT,
  ADD COLUMN IF NOT EXISTS db_role TEXT;