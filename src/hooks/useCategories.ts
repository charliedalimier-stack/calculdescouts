import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface Category {
  id: string;
  nom_categorie: string;
  project_id: string;
  created_at: string;
}

export function useCategories() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('nom_categorie');
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentProject?.id,
  });

  const addCategory = useMutation({
    mutationFn: async (nom_categorie: string) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('categories')
        .insert({ nom_categorie, project_id: currentProject.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', currentProject?.id] });
      toast.success('Catégorie ajoutée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', currentProject?.id] });
      toast.success('Catégorie supprimée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    categories,
    isLoading,
    error,
    addCategory,
    deleteCategory,
  };
}
