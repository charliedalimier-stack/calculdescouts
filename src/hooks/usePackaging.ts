import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface Packaging {
  id: string;
  nom: string;
  cout_unitaire: number;
  unite: string;
  type_emballage: string | null;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface PackagingInsert {
  nom: string;
  cout_unitaire: number;
  unite: string;
  type_emballage?: string | null;
  project_id: string;
}

export function usePackaging() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: packaging = [], isLoading, error } = useQuery({
    queryKey: ['packaging', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('packaging')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('nom');
      
      if (error) throw error;
      return data as Packaging[];
    },
    enabled: !!currentProject?.id,
  });

  const addPackaging = useMutation({
    mutationFn: async (item: Omit<PackagingInsert, 'project_id'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('packaging')
        .insert({ ...item, project_id: currentProject.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging', currentProject?.id] });
      toast.success('Emballage ajouté avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout: ' + error.message);
    },
  });

  const updatePackaging = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Packaging> & { id: string }) => {
      const { data, error } = await supabase
        .from('packaging')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs'] });
      toast.success('Emballage mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  const deletePackaging = useMutation({
    mutationFn: async (id: string) => {
      // Check if packaging is used
      const { data: usages } = await supabase
        .from('product_packaging')
        .select('id')
        .eq('packaging_id', id)
        .limit(1);
      
      if (usages && usages.length > 0) {
        throw new Error('Cet emballage est utilisé dans un produit et ne peut pas être supprimé');
      }
      
      const { error } = await supabase
        .from('packaging')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging', currentProject?.id] });
      toast.success('Emballage supprimé');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    packaging,
    isLoading,
    error,
    addPackaging,
    updatePackaging,
    deletePackaging,
  };
}
