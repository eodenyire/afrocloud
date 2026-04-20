-- Atomic onboarding bootstrap for first-time users.
-- Uses SECURITY DEFINER so auth users can initialize org/project/membership/profile in one call.

CREATE OR REPLACE FUNCTION public.bootstrap_organization(
  p_org_name TEXT,
  p_region TEXT,
  p_plan TEXT DEFAULT 'starter'
)
RETURNS TABLE (org_id UUID, project_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_project_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF COALESCE(BTRIM(p_org_name), '') = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  INSERT INTO public.organizations (name, region, plan, created_by)
  VALUES (BTRIM(p_org_name), p_region, COALESCE(NULLIF(BTRIM(p_plan), ''), 'starter'), v_user_id)
  RETURNING id INTO v_org_id;

  INSERT INTO public.projects (org_id, name, environment)
  VALUES (v_org_id, CONCAT(BTRIM(p_org_name), ' Core'), 'production')
  RETURNING id INTO v_project_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = v_org_id AND m.user_id = v_user_id
  ) THEN
    INSERT INTO public.memberships (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
  END IF;

  INSERT INTO public.roles (org_id, name, description, permissions)
  SELECT v_org_id, r.name, r.description, r.permissions
  FROM (
    VALUES
      ('Owner'::TEXT, 'Full administrative access'::TEXT, '["*"]'::JSONB),
      ('Admin'::TEXT, 'Manage resources and members'::TEXT, '["resource.*", "iam.*"]'::JSONB),
      ('Developer'::TEXT, 'Provision and manage resources'::TEXT, '["resource.read", "resource.write"]'::JSONB),
      ('Viewer'::TEXT, 'Read-only access'::TEXT, '["resource.read", "audit.read"]'::JSONB)
  ) AS r(name, description, permissions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.roles existing
    WHERE existing.org_id = v_org_id AND existing.name = r.name
  );

  UPDATE public.profiles
  SET
    org_name = BTRIM(p_org_name),
    region = p_region,
    plan = COALESCE(NULLIF(BTRIM(p_plan), ''), 'starter'),
    onboarded = TRUE,
    org_id = v_org_id,
    project_id = v_project_id,
    role = 'owner',
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN QUERY SELECT v_org_id, v_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_organization(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_organization(TEXT, TEXT, TEXT) TO authenticated;
