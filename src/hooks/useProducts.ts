import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  nom_produit: string;
  categorie_id: string | null;
  unite_vente: string;
  prix_btc: number;
  project_id: string;
  mode: 'simulation' | 'reel';
  tva_taux: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCosts extends Product {
  category_name: string | null;
  cost_ingredients: number;
  cost_packaging: number;
  cost_variable: number;
  cost_total: number;
  prix_btb: number;
  prix_distributor: number;
  margin: number;
  coefficient: number;
}

export interface ProductInsert {
  nom_produit: string;
  categorie_id?: string | null;
  unite_vente: string;
  prix_btc: number;
  project_id: string;
  mode?: 'simulation' | 'reel';
  tva_taux?: number | null;
}

export function useProducts() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', currentProject?.id, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .order('nom_produit');
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentProject?.id,
  });

  // Products with calculated costs
  const { data: productsWithCosts = [], isLoading: isLoadingCosts } = useQuery({
    queryKey: ['products-with-costs', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      // Fetch products with category
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .order('nom_produit');
      
      if (productsError) throw productsError;
      if (!productsData || productsData.length === 0) return [];

      const productIds = productsData.map(p => p.id);

      // Fetch all recipe costs
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('product_id, quantite_utilisee, ingredients(cout_unitaire)')
        .in('product_id', productIds);

      // Fetch all packaging costs
      const { data: packagingData } = await supabase
        .from('product_packaging')
        .select('product_id, quantite, packaging(cout_unitaire)')
        .in('product_id', productIds);

      // Fetch all variable costs
      const { data: variableData } = await supabase
        .from('product_variable_costs')
        .select('product_id, quantite, variable_costs(cout_unitaire)')
        .in('product_id', productIds);

      // Calculate costs per product
      const result: ProductWithCosts[] = productsData.map(product => {
        // Calculate ingredient costs
        const ingredientCost = (recipesData || [])
          .filter(r => r.product_id === product.id)
          .reduce((sum, r) => {
            const unitCost = (r.ingredients as any)?.cout_unitaire || 0;
            return sum + (Number(r.quantite_utilisee) * Number(unitCost));
          }, 0);

        // Calculate packaging costs
        const packagingCost = (packagingData || [])
          .filter(p => p.product_id === product.id)
          .reduce((sum, p) => {
            const unitCost = (p.packaging as any)?.cout_unitaire || 0;
            return sum + (Number(p.quantite) * Number(unitCost));
          }, 0);

        // Calculate variable costs
        const variableCost = (variableData || [])
          .filter(v => v.product_id === product.id)
          .reduce((sum, v) => {
            const unitCost = (v.variable_costs as any)?.cout_unitaire || 0;
            return sum + (Number(v.quantite) * Number(unitCost));
          }, 0);

        const costTotal = ingredientCost + packagingCost + variableCost;
        const prixBtc = Number(product.prix_btc);
        const prixBtb = prixBtc * 0.70; // 30% margin for BTB
        const prixDistributor = prixBtb * 0.85; // 15% margin for distributor
        const margin = prixBtc > 0 ? ((prixBtc - costTotal) / prixBtc) * 100 : 0;
        const coefficient = costTotal > 0 ? prixBtc / costTotal : 0;

        return {
          ...product,
          mode: product.mode as 'simulation' | 'reel',
          category_name: (product.categories as any)?.nom_categorie || null,
          cost_ingredients: ingredientCost,
          cost_packaging: packagingCost,
          cost_variable: variableCost,
          cost_total: costTotal,
          prix_btb: prixBtb,
          prix_distributor: prixDistributor,
          margin,
          coefficient,
        };
      });

      return result;
    },
    enabled: !!currentProject?.id,
  });

  const addProduct = useMutation({
    mutationFn: async (product: Omit<ProductInsert, 'project_id' | 'mode'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, project_id: currentProject.id, mode })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentProject?.id, mode] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id, mode] });
      toast.success('Produit ajouté avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout: ' + error.message);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentProject?.id, mode] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id, mode] });
      toast.success('Produit mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentProject?.id, mode] });
      queryClient.invalidateQueries({ queryKey: ['products-with-costs', currentProject?.id, mode] });
      toast.success('Produit supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    products,
    productsWithCosts,
    isLoading,
    isLoadingWithCosts: isLoadingCosts,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
