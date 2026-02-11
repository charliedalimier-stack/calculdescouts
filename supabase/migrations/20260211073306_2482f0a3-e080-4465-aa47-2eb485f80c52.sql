
-- Create a security definer function to look up a user by email for project invitations
-- This avoids exposing the profiles table while allowing email-based invitations
CREATE OR REPLACE FUNCTION public.invite_project_member(_project_id uuid, _email text, _role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user_id uuid;
  _existing_member uuid;
  _is_owner boolean;
BEGIN
  -- Check caller is owner of the project
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = _project_id AND owner_user_id = auth.uid()
  ) INTO _is_owner;
  
  IF NOT _is_owner THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seul le propriétaire peut inviter des membres');
  END IF;

  -- Look up user by email
  SELECT id INTO _target_user_id
  FROM public.profiles
  WHERE email = _email;

  IF _target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucun utilisateur trouvé avec cet email');
  END IF;

  -- Check not inviting self
  IF _target_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez pas vous inviter vous-même');
  END IF;

  -- Check if already a member
  SELECT id INTO _existing_member
  FROM public.project_members
  WHERE project_id = _project_id AND user_id = _target_user_id;

  IF _existing_member IS NOT NULL THEN
    -- Update role
    UPDATE public.project_members SET role = _role WHERE id = _existing_member;
    RETURN jsonb_build_object('success', true, 'action', 'updated');
  END IF;

  -- Insert new member
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (_project_id, _target_user_id, _role);

  RETURN jsonb_build_object('success', true, 'action', 'created');
END;
$$;
