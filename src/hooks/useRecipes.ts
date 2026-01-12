import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { toast } from 'sonner';
import { calculateProductCostRecursive } from './useSubRecipes';

export interface RecipeIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantite_utilisee: number;
  ingredient_name: string;
  ingredient_unit: string;
  ingredient_cost: number;
  line_cost: number;
  is_sub_recipe: boolean;
  source_product_id: string | null;
}

export interface ProductPackagingItem {
  id: string;
  product_id: string;
  packaging_id: string;
  quantite: number;
  packaging_name: string;
  packaging_cost: number;
  line_cost: number;
}

export interface ProductVariableCost {
  id: string;
  product_id: string;
  variable_cost_id: string;
  quantite: number;
  cost_name: string;
  cost_type: string;
  cost_unit: number;
  line_cost: number;
}

// Function to sync ingredient from product recipe
async function syncRecipeIngredient(
  productId: string,
  projectId: string,
  mode: string
): Promise<void> {
  // Get the product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('nom_produit, unite_vente')
    .eq('id', productId)
    .single();

  if (productError || !product) return;

  // Calculate the cost recursively
  const cost = await calculateProductCostRecursive(productId);

  // Check if an ingredient already exists for this product
  const { data: existingIngredient } = await supabase
    .from('ingredients')
    .select('id')
    .eq('source_product_id', productId)
    .eq('is_sous_recette', true)
    .eq('mode', mode)
    .single();

  if (existingIngredient) {
    // Update existing ingredient cost
    await supabase
      .from('ingredients')
      .update({ cout_unitaire: cost })
      .eq('id', existingIngredient.id);
  } else {
    // Create new ingredient linked to this product
    await supabase
      .from('ingredients')
      .insert({
        nom_ingredient: `[SR] ${product.nom_produit}`,
        cout_unitaire: cost,
        unite: product.unite_vente,
        project_id: projectId,
        mode,
        is_sous_recette: true,
        source_product_id: productId,
      });
  }
}

export function useRecipes(productId?: string) {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  // Fetch recipe ingredients for a product (including sub-recipe info)
  const { data: recipeIngredients = [], isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['recipe-ingredients', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*, ingredients(nom_ingredient, unite, cout_unitaire, is_sous_recette, source_product_id)')
        .eq('product_id', productId);
      
      if (error) throw error;
      
      return data.map(r => ({
        id: r.id,
        product_id: r.product_id,
        ingredient_id: r.ingredient_id,
        quantite_utilisee: Number(r.quantite_utilisee),
        ingredient_name: (r.ingredients as any)?.nom_ingredient || '',
        ingredient_unit: (r.ingredients as any)?.unite || '',
        ingredient_cost: Number((r.ingredients as any)?.cout_unitaire || 0),
        line_cost: Number(r.quantite_utilisee) * Number((r.ingredients as any)?.cout_unitaire || 0),
        is_sub_recipe: (r.ingredients as any)?.is_sous_recette || false,
        source_product_id: (r.ingredients as any)?.source_product_id || null,
      })) as RecipeIngredient[];
    },
    enabled: !!productId,
  });

  // Fetch packaging for a product
  const { data: productPackaging = [], isLoading: isLoadingPackaging } = useQuery({
    queryKey: ['product-packaging', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_packaging')
        .select('*, packaging(nom, cout_unitaire)')
        .eq('product_id', productId);
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        product_id: p.product_id,
        packaging_id: p.packaging_id,
        quantite: Number(p.quantite),
        packaging_name: (p.packaging as any)?.nom || '',
        packaging_cost: Number((p.packaging as any)?.cout_unitaire || 0),
        line_cost: Number(p.quantite) * Number((p.packaging as any)?.cout_unitaire || 0),
      })) as ProductPackagingItem[];
    },
    enabled: !!productId,
  });

  // Fetch variable costs for a product
  const { data: productVariableCosts = [], isLoading: isLoadingVariableCosts } = useQuery({
    queryKey: ['product-variable-costs', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_variable_costs')
        .select('*, variable_costs(nom, type_cout, cout_unitaire)')
        .eq('product_id', productId);
      
      if (error) throw error;
      
      return data.map(v => ({
        id: v.id,
        product_id: v.product_id,
        variable_cost_id: v.variable_cost_id,
        quantite: Number(v.quantite),
        cost_name: (v.variable_costs as any)?.nom || '',
        cost_type: (v.variable_costs as any)?.type_cout || '',
        cost_unit: Number((v.variable_costs as any)?.cout_unitaire || 0),
        line_cost: Number(v.quantite) * Number((v.variable_costs as any)?.cout_unitaire || 0),
      })) as ProductVariableCost[];
    },
    enabled: !!productId,
  });

  // Add ingredient to recipe (auto-creates/updates sub-recipe ingredient)
  const addRecipeIngredient = useMutation({
    mutationFn: async ({ product_id, ingredient_id, quantite_utilisee }: { product_id: string; ingredient_id: string; quantite_utilisee: number }) => {
      const { data, error } = await supabase
        .from('recipes')
        .insert({ product_id, ingredient_id, quantite_utilisee })
        .select()
        .single();
      
      if (error) throw error;

      // Auto-sync the product as a sub-recipe ingredient
      if (currentProject?.id) {
        await syncRecipeIngredient(product_id, currentProject.id, mode);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ingredients', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['sub-recipes', currentProject?.id, mode] });
      queryClient.invalidateQueries({ queryKey: ['ingredients', currentProject?.id, mode] });
      toast.success('Ingrédient ajouté à la recette');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Remove ingredient from recipe (updates sub-recipe cost or removes if no recipe left)
  const removeRecipeIngredient = useMutation({
    mutationFn: async (id: string) => {
      // Get the recipe to know the product_id before deleting
      const { data: recipe } = await supabase
        .from('recipes')
        .select('product_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      // Check if this product still has any recipe entries
      if (recipe?.product_id) {
        const { data: remainingRecipes } = await supabase
          .from('recipes')
          .select('id')
          .eq('product_id', recipe.product_id);

        if (!remainingRecipes || remainingRecipes.length === 0) {
          // No more recipe entries - remove the sub-recipe ingredient
          await supabase
            .from('ingredients')
            .delete()
            .eq('source_product_id', recipe.product_id)
            .eq('is_sous_recette', true);
        } else {
          // Still has recipe entries - update the cost
          if (currentProject?.id) {
            await syncRecipeIngredient(recipe.product_id, currentProject.id, mode);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ingredients', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['sub-recipes', currentProject?.id, mode] });
      queryClient.invalidateQueries({ queryKey: ['ingredients', currentProject?.id, mode] });
      toast.success('Ingrédient retiré de la recette');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Add packaging to product
  const addProductPackaging = useMutation({
    mutationFn: async ({ product_id, packaging_id, quantite }: { product_id: string; packaging_id: string; quantite: number }) => {
      const { data, error } = await supabase
        .from('product_packaging')
        .insert({ product_id, packaging_id, quantite })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-packaging', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id] });
      toast.success('Emballage ajouté');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Remove packaging from product
  const removeProductPackaging = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_packaging')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-packaging', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id] });
      toast.success('Emballage retiré');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Add variable cost to product
  const addProductVariableCost = useMutation({
    mutationFn: async ({ product_id, variable_cost_id, quantite }: { product_id: string; variable_cost_id: string; quantite: number }) => {
      const { data, error } = await supabase
        .from('product_variable_costs')
        .insert({ product_id, variable_cost_id, quantite })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variable-costs', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id] });
      toast.success('Coût variable ajouté');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Remove variable cost from product
  const removeProductVariableCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variable_costs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variable-costs', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id] });
      toast.success('Coût variable retiré');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const totalIngredientsCost = recipeIngredients.reduce((sum, r) => sum + r.line_cost, 0);
  const totalPackagingCost = productPackaging.reduce((sum, p) => sum + p.line_cost, 0);
  const totalVariableCost = productVariableCosts.reduce((sum, v) => sum + v.line_cost, 0);
  const totalCost = totalIngredientsCost + totalPackagingCost + totalVariableCost;

  return {
    recipeIngredients,
    productPackaging,
    productVariableCosts,
    totalIngredientsCost,
    totalPackagingCost,
    totalVariableCost,
    totalCost,
    isLoading: isLoadingIngredients || isLoadingPackaging || isLoadingVariableCosts,
    addRecipeIngredient,
    removeRecipeIngredient,
    addProductPackaging,
    removeProductPackaging,
    addProductVariableCost,
    removeProductVariableCost,
  };
}
