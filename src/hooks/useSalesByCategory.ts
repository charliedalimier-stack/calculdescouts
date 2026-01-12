import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { toast } from 'sonner';
import { PriceCategory } from './useProductPrices';

export interface SaleByCategory {
  id: string;
  product_id: string;
  categorie_prix: PriceCategory;
  quantite: number;
  mois: string;
  project_id: string;
  mode: string;
}

export interface ProductSalesData {
  product_id: string;
  nom_produit: string;
  prices: {
    BTC: { prix_ht: number; tva_taux: number } | null;
    BTB: { prix_ht: number; tva_taux: number } | null;
    Distributeur: { prix_ht: number; tva_taux: number } | null;
  };
  sales: {
    BTC: { target: number; actual: number };
    BTB: { target: number; actual: number };
    Distributeur: { target: number; actual: number };
  };
  totals: {
    target_qty: number;
    actual_qty: number;
    target_ca: number;
    actual_ca: number;
  };
}

export function useSalesByCategory(month?: string) {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01';

  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['sales-by-category', currentProject?.id, mode, currentMonth],
    queryFn: async (): Promise<ProductSalesData[]> => {
      if (!currentProject?.id) return [];

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Fetch prices
      const { data: prices, error: pricesError } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', products.map(p => p.id))
        .eq('mode', mode);

      if (pricesError) throw pricesError;

      // Fetch targets
      const { data: targets, error: targetsError } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mois', currentMonth)
        .eq('mode', mode);

      if (targetsError) throw targetsError;

      // Fetch actuals
      const { data: actuals, error: actualsError } = await supabase
        .from('sales_actuals')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mois', currentMonth);

      if (actualsError) throw actualsError;

      // Map data
      return products.map(product => {
        const productPrices = (prices || []).filter(p => p.product_id === product.id);
        const productTargets = (targets || []).filter(t => t.product_id === product.id);
        const productActuals = (actuals || []).filter(a => a.product_id === product.id);

        const getPriceData = (cat: PriceCategory) => {
          const price = productPrices.find(p => p.categorie_prix === cat);
          return price ? { prix_ht: price.prix_ht, tva_taux: price.tva_taux } : null;
        };

        const getSalesData = (cat: PriceCategory) => {
          const target = productTargets.find(t => t.categorie_prix === cat);
          const actual = productActuals.find(a => a.categorie_prix === cat);
          return {
            target: target?.quantite_objectif || 0,
            actual: actual?.quantite_reelle || 0,
          };
        };

        const pricesData = {
          BTC: getPriceData('BTC') || { prix_ht: product.prix_btc, tva_taux: product.tva_taux || 5.5 },
          BTB: getPriceData('BTB'),
          Distributeur: getPriceData('Distributeur'),
        };

        const salesByCategory = {
          BTC: getSalesData('BTC'),
          BTB: getSalesData('BTB'),
          Distributeur: getSalesData('Distributeur'),
        };

        // Calculate totals
        const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];
        let target_qty = 0, actual_qty = 0, target_ca = 0, actual_ca = 0;

        categories.forEach(cat => {
          const price = pricesData[cat]?.prix_ht || 0;
          const sales = salesByCategory[cat];
          target_qty += sales.target;
          actual_qty += sales.actual;
          target_ca += sales.target * price;
          actual_ca += sales.actual * price;
        });

        return {
          product_id: product.id,
          nom_produit: product.nom_produit,
          prices: pricesData,
          sales: salesByCategory,
          totals: { target_qty, actual_qty, target_ca, actual_ca },
        };
      });
    },
    enabled: !!currentProject?.id,
  });

  const setSalesTarget = useMutation({
    mutationFn: async ({
      productId,
      category,
      quantity,
    }: {
      productId: string;
      category: PriceCategory;
      quantity: number;
    }) => {
      if (!currentProject?.id) throw new Error('No project selected');

      const { data, error } = await supabase
        .from('sales_targets')
        .upsert({
          project_id: currentProject.id,
          product_id: productId,
          categorie_prix: category,
          quantite_objectif: quantity,
          mois: currentMonth,
          mode,
        }, {
          onConflict: 'project_id,product_id,mois,mode,categorie_prix',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Objectif mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });

  const setSalesActual = useMutation({
    mutationFn: async ({
      productId,
      category,
      quantity,
    }: {
      productId: string;
      category: PriceCategory;
      quantity: number;
    }) => {
      if (!currentProject?.id) throw new Error('No project selected');

      const { data, error } = await supabase
        .from('sales_actuals')
        .upsert({
          project_id: currentProject.id,
          product_id: productId,
          categorie_prix: category,
          quantite_reelle: quantity,
          mois: currentMonth,
          mode: 'reel',
        }, {
          onConflict: 'project_id,product_id,mois,mode,categorie_prix',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Vente enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    },
  });

  // Calculate totals across all products
  const totals = salesData.reduce(
    (acc, product) => ({
      target_qty: acc.target_qty + product.totals.target_qty,
      actual_qty: acc.actual_qty + product.totals.actual_qty,
      target_ca: acc.target_ca + product.totals.target_ca,
      actual_ca: acc.actual_ca + product.totals.actual_ca,
    }),
    { target_qty: 0, actual_qty: 0, target_ca: 0, actual_ca: 0 }
  );

  return {
    salesData,
    totals,
    isLoading,
    setSalesTarget,
    setSalesActual,
  };
}
