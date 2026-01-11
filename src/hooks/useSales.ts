import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface SalesTarget {
  id: string;
  product_id: string;
  mois: string;
  quantite_objectif: number;
  project_id: string;
}

export interface SalesActual {
  id: string;
  product_id: string;
  mois: string;
  quantite_reelle: number;
  project_id: string;
}

export interface SalesData {
  product_id: string;
  product_name: string;
  category_name: string | null;
  prix_btc: number;
  objectif_qty: number;
  reel_qty: number;
  objectif_ca: number;
  reel_ca: number;
  ecart_qty: number;
  ecart_ca: number;
  ecart_percent: number;
}

export function useSales(month?: string) {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();
  
  const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01';

  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['sales-data', currentProject?.id, currentMonth],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, categories(nom_categorie)')
        .eq('project_id', currentProject.id);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Fetch targets
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mois', currentMonth);

      // Fetch actuals
      const { data: actuals } = await supabase
        .from('sales_actuals')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mois', currentMonth);

      const result: SalesData[] = products.map(product => {
        const target = (targets || []).find(t => t.product_id === product.id);
        const actual = (actuals || []).find(a => a.product_id === product.id);
        
        const objectifQty = Number(target?.quantite_objectif || 0);
        const reelQty = Number(actual?.quantite_reelle || 0);
        const prixBtc = Number(product.prix_btc);
        const objectifCa = objectifQty * prixBtc;
        const reelCa = reelQty * prixBtc;
        const ecartQty = reelQty - objectifQty;
        const ecartCa = reelCa - objectifCa;
        const ecartPercent = objectifCa > 0 ? ((reelCa - objectifCa) / objectifCa) * 100 : 0;

        return {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          prix_btc: prixBtc,
          objectif_qty: objectifQty,
          reel_qty: reelQty,
          objectif_ca: objectifCa,
          reel_ca: reelCa,
          ecart_qty: ecartQty,
          ecart_ca: ecartCa,
          ecart_percent: ecartPercent,
        };
      });

      return result;
    },
    enabled: !!currentProject?.id,
  });

  const setSalesTarget = useMutation({
    mutationFn: async ({ product_id, mois, quantite_objectif }: { product_id: string; mois: string; quantite_objectif: number }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('sales_targets')
        .upsert(
          { product_id, mois, quantite_objectif, project_id: currentProject.id },
          { onConflict: 'product_id,mois' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-data', currentProject?.id] });
      toast.success('Objectif mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const setSalesActual = useMutation({
    mutationFn: async ({ product_id, mois, quantite_reelle }: { product_id: string; mois: string; quantite_reelle: number }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('sales_actuals')
        .upsert(
          { product_id, mois, quantite_reelle, project_id: currentProject.id },
          { onConflict: 'product_id,mois' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-data', currentProject?.id] });
      toast.success('Ventes réelles mises à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const objectifCa = salesData.reduce((sum, d) => sum + d.objectif_ca, 0);
  const reelCa = salesData.reduce((sum, d) => sum + d.reel_ca, 0);
  const ecartCa = salesData.reduce((sum, d) => sum + d.ecart_ca, 0);
  const ecartPercent = objectifCa > 0 ? ((reelCa - objectifCa) / objectifCa) * 100 : 0;

  const totals = {
    objectif_ca: objectifCa,
    reel_ca: reelCa,
    ecart_ca: ecartCa,
    ecart_percent: ecartPercent,
  };

  return {
    salesData,
    totals,
    isLoading,
    setSalesTarget,
    setSalesActual,
  };
}
