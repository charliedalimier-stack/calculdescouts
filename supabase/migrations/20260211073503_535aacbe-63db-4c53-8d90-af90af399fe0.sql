
-- Allow users to view profiles of people who share a project with them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view accessible profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.project_members pm
    JOIN public.projects p ON p.id = pm.project_id
    WHERE pm.user_id = profiles.id
    AND (p.owner_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = pm.project_id AND pm2.user_id = auth.uid()
    ))
  )
);
