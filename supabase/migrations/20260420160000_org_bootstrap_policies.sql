-- Allow org creators to view newly created orgs before membership exists
CREATE POLICY "Org creators can view orgs" ON public.organizations
  FOR SELECT TO authenticated USING (created_by = auth.uid());

-- Allow org creators to bootstrap their own membership
CREATE POLICY "Org creators can add self membership" ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_id AND o.created_by = auth.uid()
    )
  );

-- Allow org creators to create the initial project before membership exists
CREATE POLICY "Org creators can create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_id AND o.created_by = auth.uid()
    )
  );
