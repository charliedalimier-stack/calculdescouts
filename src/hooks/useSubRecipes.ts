import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useMode } from "@/contexts/ModeContext";
import { toast } from "sonner";

export interface SubRecipe {
  id: string;
  product_id: string;
  nom_produit: string;
  ingredient_id: string;
  nom_ingredient: string;
  cout_revient: number;
  unite: string;
}

// Calculate cost of a product recursively (handles nested sub-recipes)
export async function calculateProductCostRecursive(
  productId: string,
  visitedProducts: Set<string> = new Set()
): Promise<number> {
  // Prevent infinite loops
  if (visitedProducts.has(productId)) {
    console.warn(`Circular reference detected for product ${productId}`);
    return 0;
  }
  visitedProducts.add(productId);

  // Get recipe ingredients
  const { data: recipes } = await supabase
    .from("recipes")
    .select("quantite_utilisee, ingredients(id, cout_unitaire, is_sous_recette, source_product_id)")
    .eq("product_id", productId);

  let ingredientsCost = 0;
  for (const recipe of recipes || []) {
    const ingredient = recipe.ingredients as any;
    if (!ingredient) continue;

    if (ingredient.is_sous_recette && ingredient.source_product_id) {
      // This is a sub-recipe - calculate its cost recursively
      const subRecipeCost = await calculateProductCostRecursive(
        ingredient.source_product_id,
        visitedProducts
      );
      ingredientsCost += Number(recipe.quantite_utilisee) * subRecipeCost;
    } else {
      // Regular ingredient
      ingredientsCost += Number(recipe.quantite_utilisee) * Number(ingredient.cout_unitaire || 0);
    }
  }

  // Get packaging costs
  const { data: packaging } = await supabase
    .from("product_packaging")
    .select("quantite, packaging(cout_unitaire)")
    .eq("product_id", productId);

  const packagingCost = (packaging || []).reduce((sum, p) => {
    return sum + Number(p.quantite) * Number((p.packaging as any)?.cout_unitaire || 0);
  }, 0);

  // Get variable costs
  const { data: variableCosts } = await supabase
    .from("product_variable_costs")
    .select("quantite, variable_costs(cout_unitaire)")
    .eq("product_id", productId);

  const variableCost = (variableCosts || []).reduce((sum, v) => {
    return sum + Number(v.quantite) * Number((v.variable_costs as any)?.cout_unitaire || 0);
  }, 0);

  return ingredientsCost + packagingCost + variableCost;
}

export function useSubRecipes() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  const projectId = currentProject?.id;

  // Fetch all sub-recipes (ingredients linked to products)
  const { data: subRecipes = [], isLoading } = useQuery({
    queryKey: ["sub-recipes", projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("ingredients")
        .select(`
          id,
          nom_ingredient,
          cout_unitaire,
          unite,
          source_product_id,
          product:products!ingredients_source_product_id_fkey(id, nom_produit)
        `)
        .eq("project_id", projectId)
        .eq("mode", mode)
        .eq("is_sous_recette", true);

      if (error) throw error;

      return (data || []).map((ing) => ({
        id: ing.id,
        product_id: ing.source_product_id || "",
        nom_produit: (ing.product as any)?.nom_produit || "",
        ingredient_id: ing.id,
        nom_ingredient: ing.nom_ingredient,
        cout_revient: ing.cout_unitaire,
        unite: ing.unite,
      })) as SubRecipe[];
    },
    enabled: !!projectId,
  });

  // Get products that can become sub-recipes (have a recipe defined)
  const { data: productsWithRecipes = [] } = useQuery({
    queryKey: ["products-with-recipes", projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];

      // Get products with at least one recipe ingredient
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          nom_produit,
          unite_vente,
          recipes(id)
        `)
        .eq("project_id", projectId)
        .eq("mode", mode);

      if (error) throw error;

      // Filter products that have at least one recipe
      return (data || []).filter((p) => (p.recipes as any[])?.length > 0);
    },
    enabled: !!projectId,
  });

  // Convert a product to a sub-recipe
  const convertToSubRecipe = useMutation({
    mutationFn: async ({
      productId,
      unite,
    }: {
      productId: string;
      unite: string;
    }) => {
      if (!projectId) throw new Error("Aucun projet sélectionné");

      // Check if already exists
      const { data: existing } = await supabase
        .from("ingredients")
        .select("id")
        .eq("source_product_id", productId)
        .eq("is_sous_recette", true)
        .single();

      if (existing) {
        throw new Error("Ce produit est déjà une sous-recette");
      }

      // Get the product
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("nom_produit")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      // Calculate the cost recursively
      const cost = await calculateProductCostRecursive(productId);

      // Create the ingredient linked to this product
      const { data, error } = await supabase
        .from("ingredients")
        .insert({
          nom_ingredient: `[SR] ${product.nom_produit}`,
          cout_unitaire: cost,
          unite,
          project_id: projectId,
          mode,
          is_sous_recette: true,
          source_product_id: productId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast.success("Sous-recette créée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update sub-recipe cost (recalculate from source product)
  const updateSubRecipeCost = useMutation({
    mutationFn: async (ingredientId: string) => {
      // Get the ingredient with source product
      const { data: ingredient, error: ingError } = await supabase
        .from("ingredients")
        .select("source_product_id")
        .eq("id", ingredientId)
        .single();

      if (ingError) throw ingError;
      if (!ingredient.source_product_id) {
        throw new Error("Cet ingrédient n'est pas une sous-recette");
      }

      // Calculate new cost
      const newCost = await calculateProductCostRecursive(
        ingredient.source_product_id
      );

      // Update the ingredient cost
      const { data, error } = await supabase
        .from("ingredients")
        .update({ cout_unitaire: newCost })
        .eq("id", ingredientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-costs"] });
      toast.success("Coût de la sous-recette mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update all sub-recipes costs
  const updateAllSubRecipesCosts = useMutation({
    mutationFn: async () => {
      for (const subRecipe of subRecipes) {
        await updateSubRecipeCost.mutateAsync(subRecipe.ingredient_id);
      }
    },
    onSuccess: () => {
      toast.success("Tous les coûts ont été recalculés");
    },
  });

  // Remove sub-recipe (delete the linked ingredient)
  const removeSubRecipe = useMutation({
    mutationFn: async (ingredientId: string) => {
      // Check if used in any recipe
      const { data: usages } = await supabase
        .from("recipes")
        .select("id")
        .eq("ingredient_id", ingredientId);

      if (usages && usages.length > 0) {
        throw new Error(
          "Cette sous-recette est utilisée dans des recettes. Retirez-la d'abord des recettes."
        );
      }

      const { error } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", ingredientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast.success("Sous-recette supprimée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    subRecipes,
    productsWithRecipes,
    isLoading,
    convertToSubRecipe,
    updateSubRecipeCost,
    updateAllSubRecipesCosts,
    removeSubRecipe,
  };
}
