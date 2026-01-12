import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ProjectInsert {
  nom_projet: string;
  description?: string | null;
}

export function useProjects() {
  const { projects, isLoading, refetchProjects, setCurrentProject } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addProject = useMutation({
    mutationFn: async (project: ProjectInsert) => {
      if (!user) throw new Error('Utilisateur non connecté');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          owner_user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      setCurrentProject(data);
      toast.success('Projet créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nom_projet?: string; description?: string | null }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      toast.success('Projet mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      toast.success('Projet supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const duplicateProject = useMutation({
    mutationFn: async (sourceId: string) => {
      if (!user) throw new Error('Utilisateur non connecté');
      
      const source = projects.find(p => p.id === sourceId);
      if (!source) throw new Error('Projet source non trouvé');

      // Create new project with owner
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          nom_projet: `${source.nom_projet} (copie)`,
          description: source.description,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Copy categories
      const { data: categories } = await supabase
        .from('categories')
        .select('nom_categorie')
        .eq('project_id', sourceId);

      if (categories && categories.length > 0) {
        await supabase.from('categories').insert(
          categories.map(c => ({ ...c, project_id: newProject.id }))
        );
      }

      // Copy ingredients
      const { data: ingredients } = await supabase
        .from('ingredients')
        .select('nom_ingredient, cout_unitaire, unite, fournisseur, tva_taux')
        .eq('project_id', sourceId);

      if (ingredients && ingredients.length > 0) {
        await supabase.from('ingredients').insert(
          ingredients.map(i => ({ ...i, project_id: newProject.id }))
        );
      }

      // Copy packaging
      const { data: packaging } = await supabase
        .from('packaging')
        .select('nom, cout_unitaire, unite, type_emballage, tva_taux')
        .eq('project_id', sourceId);

      if (packaging && packaging.length > 0) {
        await supabase.from('packaging').insert(
          packaging.map(p => ({ ...p, project_id: newProject.id }))
        );
      }

      // Copy project settings
      const { data: settings } = await supabase
        .from('project_settings')
        .select('*')
        .eq('project_id', sourceId)
        .single();

      if (settings) {
        const { id, project_id, created_at, updated_at, ...settingsData } = settings;
        await supabase.from('project_settings').insert({
          ...settingsData,
          project_id: newProject.id,
        });
      }

      return newProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      setCurrentProject(data);
      toast.success('Projet dupliqué avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la duplication: ' + error.message);
    },
  });

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    duplicateProject,
  };
}
