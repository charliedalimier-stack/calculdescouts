import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { toast } from 'sonner';

export interface Ingredient {
  id: string;
  nom_ingredient: string;
  cout_unitaire: number;
  unite: string;
  fournisseur: string | null;
  project_id: string;
  mode: 'simulation' | 'reel';
  tva_taux: number | null;
  is_sous_recette: boolean;
  source_product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngredientInsert {
  nom_ingredient: string;
  cout_unitaire: number;
  unite: string;
  fournisseur?: string | null;
  project_id: string;
  mode?: 'simulation' | 'reel';
  tva_taux?: number | null;
  is_sous_recette?: boolean;
  source_product_id?: string | null;
}

export function useIngredients() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  const { data: ingredients = [], isLoading, error } = useQuery({
    queryKey: ['ingredients', currentProject?.id, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .order('nom_ingredient');
      
      if (error) throw error;
      return data.map(d => ({ ...d, mode: d.mode as 'simulation' | 'reel' })) as Ingredient[];
    },
    enabled: !!currentProject?.id,
  });

  const addIngredient = useMutation({
    mutationFn: async (ingredient: Omit<IngredientInsert, 'project_id' | 'mode'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, project_id: currentProject.id, mode })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', currentProject?.id, mode] });
      toast.success('Ingrédient ajouté avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout: ' + error.message);
    },
  });

  const updateIngredient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ingredient> & { id: string }) => {
      const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', currentProject?.id, mode] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs'] });
      toast.success('Ingrédient mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  const deleteIngredient = useMutation({
    mutationFn: async (id: string) => {
      // Check if ingredient is used in recipes
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id')
        .eq('ingredient_id', id)
        .limit(1);
      
      if (recipes && recipes.length > 0) {
        throw new Error('Cet ingrédient est utilisé dans une recette et ne peut pas être supprimé');
      }
      
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', currentProject?.id, mode] });
      toast.success('Ingrédient supprimé');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    ingredients,
    isLoading,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
  };
}
