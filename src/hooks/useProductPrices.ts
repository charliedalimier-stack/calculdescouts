import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { toast } from 'sonner';

export type PriceCategory = 'BTC' | 'BTB' | 'Distributeur';

export interface ProductPrice {
  id: string;
  product_id: string;
  categorie_prix: PriceCategory;
  prix_ht: number;
  tva_taux: number;
  mode: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithPrices {
  id: string;
  nom_produit: string;
  categorie_id: string | null;
  prix_btc: number;
  tva_taux: number | null;
  prices: {
    BTC: ProductPrice | null;
    BTB: ProductPrice | null;
    Distributeur: ProductPrice | null;
  };
}

export function useProductPrices() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  const { data: productPrices = [], isLoading } = useQuery({
    queryKey: ['product-prices', currentProject?.id, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      const { data, error } = await supabase
        .from('product_prices')
        .select(`
          *,
          products!inner(id, nom_produit, categorie_id, prix_btc, tva_taux, project_id)
        `)
        .eq('products.project_id', currentProject.id)
        .eq('mode', mode);

      if (error) throw error;
      return data as (ProductPrice & { products: any })[];
    },
    enabled: !!currentProject?.id,
  });

  const { data: productsWithPrices = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-with-prices', currentProject?.id, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, categorie_id, prix_btc, tva_taux')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      if (productsError) throw productsError;

      // Fetch prices for each product
      const { data: prices, error: pricesError } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', products?.map(p => p.id) || [])
        .eq('mode', mode);

      if (pricesError) throw pricesError;

      // Map prices to products
      return (products || []).map(product => {
        const productPrices = (prices || []).filter(p => p.product_id === product.id);
        return {
          ...product,
          prices: {
            BTC: productPrices.find(p => p.categorie_prix === 'BTC') || null,
            BTB: productPrices.find(p => p.categorie_prix === 'BTB') || null,
            Distributeur: productPrices.find(p => p.categorie_prix === 'Distributeur') || null,
          },
        } as ProductWithPrices;
      });
    },
    enabled: !!currentProject?.id,
  });

  const updatePrice = useMutation({
    mutationFn: async ({ 
      productId, 
      category, 
      prixHt 
    }: { 
      productId: string; 
      category: PriceCategory; 
      prixHt: number;
    }) => {
      // Get product TVA
      const { data: product } = await supabase
        .from('products')
        .select('tva_taux')
        .eq('id', productId)
        .single();

      const { data, error } = await supabase
        .from('product_prices')
        .upsert({
          product_id: productId,
          categorie_prix: category,
          prix_ht: prixHt,
          tva_taux: product?.tva_taux || 5.5,
          mode,
        }, {
          onConflict: 'product_id,categorie_prix,mode',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-prices'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-prices'] });
      toast.success('Prix mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du prix');
      console.error(error);
    },
  });

  const getPriceForCategory = (productId: string, category: PriceCategory): number => {
    const product = productsWithPrices.find(p => p.id === productId);
    if (!product) return 0;
    return product.prices[category]?.prix_ht || product.prix_btc;
  };

  const calculatePrixTTC = (prixHt: number, tvaTaux: number): number => {
    return prixHt * (1 + tvaTaux / 100);
  };

  return {
    productPrices,
    productsWithPrices,
    isLoading: isLoading || isLoadingProducts,
    updatePrice,
    getPriceForCategory,
    calculatePrixTTC,
  };
}
