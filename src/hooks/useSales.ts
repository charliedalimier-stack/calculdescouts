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

export interface AnnualSalesRow {
  product_id: string;
  product_name: string;
  category_name: string | null;
  prix_btc: number;
  months: {
    [month: string]: {
      objectif: number;
      reel: number;
    };
  };
  total_objectif: number;
  total_reel: number;
  total_ca_objectif: number;
  total_ca_reel: number;
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
      queryClient.invalidateQueries({ queryKey: ['annual-sales-data', currentProject?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['annual-sales-data', currentProject?.id] });
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

// Hook for annual sales view
export function useAnnualSales(year: number) {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    return `${year}-${m}-01`;
  });

  const { data: annualData = [], isLoading } = useQuery({
    queryKey: ['annual-sales-data', currentProject?.id, year],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, categories(nom_categorie)')
        .eq('project_id', currentProject.id);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Fetch all targets for the year
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('project_id', currentProject.id)
        .gte('mois', `${year}-01-01`)
        .lte('mois', `${year}-12-31`);

      // Fetch all actuals for the year
      const { data: actuals } = await supabase
        .from('sales_actuals')
        .select('*')
        .eq('project_id', currentProject.id)
        .gte('mois', `${year}-01-01`)
        .lte('mois', `${year}-12-31`);

      const result: AnnualSalesRow[] = products.map(product => {
        const prixBtc = Number(product.prix_btc);
        const monthsData: { [month: string]: { objectif: number; reel: number } } = {};
        
        let totalObjectif = 0;
        let totalReel = 0;

        months.forEach(month => {
          const target = (targets || []).find(t => t.product_id === product.id && t.mois === month);
          const actual = (actuals || []).find(a => a.product_id === product.id && a.mois === month);
          
          const objectif = Number(target?.quantite_objectif || 0);
          const reel = Number(actual?.quantite_reelle || 0);
          
          monthsData[month] = { objectif, reel };
          totalObjectif += objectif;
          totalReel += reel;
        });

        const totalCaObjectif = totalObjectif * prixBtc;
        const totalCaReel = totalReel * prixBtc;
        const ecartPercent = totalCaObjectif > 0 
          ? ((totalCaReel - totalCaObjectif) / totalCaObjectif) * 100 
          : 0;

        return {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          prix_btc: prixBtc,
          months: monthsData,
          total_objectif: totalObjectif,
          total_reel: totalReel,
          total_ca_objectif: totalCaObjectif,
          total_ca_reel: totalCaReel,
          ecart_percent: ecartPercent,
        };
      });

      return result;
    },
    enabled: !!currentProject?.id,
  });

  const setSalesValue = useMutation({
    mutationFn: async ({ product_id, mois, field, value }: { product_id: string; mois: string; field: 'objectif' | 'reel'; value: number }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      if (field === 'objectif') {
        const { data, error } = await supabase
          .from('sales_targets')
          .upsert(
            { product_id, mois, quantite_objectif: value, project_id: currentProject.id },
            { onConflict: 'product_id,mois' }
          )
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sales_actuals')
          .upsert(
            { product_id, mois, quantite_reelle: value, project_id: currentProject.id },
            { onConflict: 'product_id,mois' }
          )
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-sales-data', currentProject?.id, year] });
      queryClient.invalidateQueries({ queryKey: ['sales-data', currentProject?.id] });
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Calculate annual totals
  const annualTotals = {
    objectif_qty: annualData.reduce((sum, row) => sum + row.total_objectif, 0),
    reel_qty: annualData.reduce((sum, row) => sum + row.total_reel, 0),
    objectif_ca: annualData.reduce((sum, row) => sum + row.total_ca_objectif, 0),
    reel_ca: annualData.reduce((sum, row) => sum + row.total_ca_reel, 0),
    get ecart_ca() { return this.reel_ca - this.objectif_ca; },
    get ecart_percent() { return this.objectif_ca > 0 ? ((this.reel_ca - this.objectif_ca) / this.objectif_ca) * 100 : 0; },
  };

  return {
    annualData,
    annualTotals,
    isLoading,
    setSalesValue,
  };
}
