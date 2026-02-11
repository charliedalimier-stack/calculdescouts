import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
  display_name?: string;
}

export function useProjectMembers() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', currentProject.id);

      if (error) throw error;

      // Fetch profile info for each member
      const memberIds = data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', memberIds);

      return data.map((m: any) => {
        const profile = profiles?.find((p: any) => p.id === m.user_id);
        return {
          ...m,
          email: profile?.email,
          display_name: profile?.display_name,
        } as ProjectMember;
      });
    },
    enabled: !!currentProject?.id,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { data, error } = await supabase.rpc('invite_project_member', {
        _project_id: currentProject.id,
        _email: email,
        _role: role,
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', currentProject?.id] });
      toast.success(data.action === 'updated' ? 'Rôle mis à jour' : 'Membre invité avec succès');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', currentProject?.id] });
      toast.success('Membre retiré du projet');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const isOwner = currentProject?.owner_user_id === user?.id;

  return {
    members,
    isLoading,
    inviteMember,
    removeMember,
    isOwner,
    memberCount: members.length,
  };
}
