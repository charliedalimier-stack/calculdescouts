import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface VariableCost {
  id: string;
  type_cout: string;
  nom: string;
  cout_unitaire: number;
  unite: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface VariableCostInsert {
  type_cout: string;
  nom: string;
  cout_unitaire: number;
  unite: string;
  project_id: string;
}

export function useVariableCosts() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: variableCosts = [], isLoading, error } = useQuery({
    queryKey: ['variable-costs', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('variable_costs')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('type_cout, nom');
      
      if (error) throw error;
      return data as VariableCost[];
    },
    enabled: !!currentProject?.id,
  });

  const addVariableCost = useMutation({
    mutationFn: async (cost: Omit<VariableCostInsert, 'project_id'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('variable_costs')
        .insert({ ...cost, project_id: currentProject.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-costs', currentProject?.id] });
      toast.success('Coût variable ajouté');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const updateVariableCost = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VariableCost> & { id: string }) => {
      const { data, error } = await supabase
        .from('variable_costs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-costs', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs'] });
      toast.success('Coût variable mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteVariableCost = useMutation({
    mutationFn: async (id: string) => {
      // Check if cost is used
      const { data: usages } = await supabase
        .from('product_variable_costs')
        .select('id')
        .eq('variable_cost_id', id)
        .limit(1);
      
      if (usages && usages.length > 0) {
        throw new Error('Ce coût est utilisé dans un produit et ne peut pas être supprimé');
      }
      
      const { error } = await supabase
        .from('variable_costs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-costs', currentProject?.id] });
      toast.success('Coût variable supprimé');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    variableCosts,
    isLoading,
    error,
    addVariableCost,
    updateVariableCost,
    deleteVariableCost,
  };
}
