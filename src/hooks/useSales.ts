import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';
import { PriceCategory } from './useProductPrices';

export interface SalesTarget {
  id: string;
  product_id: string;
  mois: string;
  quantite_objectif: number;
  project_id: string;
  categorie_prix?: string;
}

export interface SalesActual {
  id: string;
  product_id: string;
  mois: string;
  quantite_reelle: number;
  project_id: string;
  categorie_prix?: string;
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
  // Breakdown by channel
  by_channel: {
    BTC: { objectif_qty: number; reel_qty: number; prix_ht: number; objectif_ca: number; reel_ca: number };
    BTB: { objectif_qty: number; reel_qty: number; prix_ht: number; objectif_ca: number; reel_ca: number };
    Distributeur: { objectif_qty: number; reel_qty: number; prix_ht: number; objectif_ca: number; reel_ca: number };
  };
}

/**
 * Hook to manage sales data.
 * 
 * @param month - Optional month in format 'YYYY-MM-01'. Defaults to current month.
 * @param mode - Optional mode ('budget' | 'reel'). Defaults to 'budget'.
 */
export function useSales(month?: string, mode: 'budget' | 'reel' = 'budget') {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();
  
  const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01';

  // Log mode usage for debugging
  console.log('[useSales] Using mode:', mode, 'month:', currentMonth, 'project:', currentProject?.id);

  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['sales-data', currentProject?.id, currentMonth, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      console.log('[useSales] Fetching sales with mode:', mode);

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Fetch product prices by channel
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', mode);

      // Fetch targets (now including category breakdown)
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mois', currentMonth)
        .eq('mode', mode);

      // Fetch actuals (now including category breakdown)
      const { data: actuals } = await supabase
        .from('sales_actuals')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mois', currentMonth);

      const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

      const result: SalesData[] = products.map(product => {
        const prixBtc = Number(product.prix_btc);
        const tvaTaux = product.tva_taux || 5.5;
        
        // Get prices for each channel
        const getPriceForCategory = (cat: PriceCategory): number => {
          const price = (productPrices || []).find(p => p.product_id === product.id && p.categorie_prix === cat);
          return price ? Number(price.prix_ht) : (cat === 'BTC' ? prixBtc : 0);
        };

        // Calculate by channel
        const by_channel = {} as SalesData['by_channel'];
        let totalObjectifQty = 0;
        let totalReelQty = 0;
        let totalObjectifCa = 0;
        let totalReelCa = 0;

        categories.forEach(cat => {
          const prix_ht = getPriceForCategory(cat);
          
          // Get targets for this category
          const categoryTargets = (targets || []).filter(
            t => t.product_id === product.id && t.categorie_prix === cat
          );
          const categoryActuals = (actuals || []).filter(
            a => a.product_id === product.id && a.categorie_prix === cat
          );
          
          const objectif_qty = categoryTargets.reduce((sum, t) => sum + Number(t.quantite_objectif || 0), 0);
          const reel_qty = categoryActuals.reduce((sum, a) => sum + Number(a.quantite_reelle || 0), 0);
          
          const objectif_ca = objectif_qty * prix_ht;
          const reel_ca = reel_qty * prix_ht;

          by_channel[cat] = { objectif_qty, reel_qty, prix_ht, objectif_ca, reel_ca };
          
          totalObjectifQty += objectif_qty;
          totalReelQty += reel_qty;
          totalObjectifCa += objectif_ca;
          totalReelCa += reel_ca;
        });

        // Fallback: if no category-specific data, use legacy non-category records
        if (totalObjectifQty === 0 && totalReelQty === 0) {
          const legacyTarget = (targets || []).find(t => t.product_id === product.id && !t.categorie_prix);
          const legacyActual = (actuals || []).find(a => a.product_id === product.id && !a.categorie_prix);
          
          if (legacyTarget || legacyActual) {
            const objQty = Number(legacyTarget?.quantite_objectif || 0);
            const realQty = Number(legacyActual?.quantite_reelle || 0);
            
            // Assume BTC price for legacy data
            totalObjectifQty = objQty;
            totalReelQty = realQty;
            totalObjectifCa = objQty * prixBtc;
            totalReelCa = realQty * prixBtc;
            
            by_channel['BTC'] = { 
              objectif_qty: objQty, 
              reel_qty: realQty, 
              prix_ht: prixBtc,
              objectif_ca: objQty * prixBtc,
              reel_ca: realQty * prixBtc
            };
          }
        }

        const ecartQty = totalReelQty - totalObjectifQty;
        const ecartCa = totalReelCa - totalObjectifCa;
        const ecartPercent = totalObjectifCa > 0 ? ((totalReelCa - totalObjectifCa) / totalObjectifCa) * 100 : 0;

        return {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          prix_btc: prixBtc,
          objectif_qty: totalObjectifQty,
          reel_qty: totalReelQty,
          objectif_ca: totalObjectifCa,
          reel_ca: totalReelCa,
          ecart_qty: ecartQty,
          ecart_ca: ecartCa,
          ecart_percent: ecartPercent,
          by_channel,
        };
      });

      console.log('[useSales] Fetched', result.length, 'products with sales data');
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
          { product_id, mois, quantite_objectif, project_id: currentProject.id, mode, categorie_prix: 'BTC' },
          { onConflict: 'project_id,product_id,mois,mode,categorie_prix' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-data', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['annual-sales-data', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-category'] });
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
          { product_id, mois, quantite_reelle, project_id: currentProject.id, mode: 'reel', categorie_prix: 'BTC' },
          { onConflict: 'project_id,product_id,mois,mode,categorie_prix' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-data', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['annual-sales-data', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-category'] });
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

/**
 * Hook for annual sales view.
 * 
 * @param year - The year to fetch sales for.
 * @param mode - Optional mode ('budget' | 'reel'). Defaults to 'budget'.
 */
export function useAnnualSales(year: number, mode: 'budget' | 'reel' = 'budget') {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    return `${year}-${m}-01`;
  });

  console.log('[useAnnualSales] Using mode:', mode, 'year:', year);

  const { data: annualData = [], isLoading } = useQuery({
    queryKey: ['annual-sales-data', currentProject?.id, year, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Fetch product prices by channel
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', mode);

      // Fetch all targets for the year
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .gte('mois', `${year}-01-01`)
        .lte('mois', `${year}-12-31`);

      // Fetch all actuals for the year
      const { data: actuals } = await supabase
        .from('sales_actuals')
        .select('*')
        .eq('project_id', currentProject.id)
        .gte('mois', `${year}-01-01`)
        .lte('mois', `${year}-12-31`);

      const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

      const result: AnnualSalesRow[] = products.map(product => {
        const prixBtc = Number(product.prix_btc);
        
        // Get prices for each channel
        const getPriceForCategory = (cat: PriceCategory): number => {
          const price = (productPrices || []).find(p => p.product_id === product.id && p.categorie_prix === cat);
          return price ? Number(price.prix_ht) : (cat === 'BTC' ? prixBtc : 0);
        };

        const monthsData: { [month: string]: { objectif: number; reel: number } } = {};
        
        let totalObjectif = 0;
        let totalReel = 0;
        let totalCaObjectif = 0;
        let totalCaReel = 0;

        months.forEach(month => {
          let monthObjectif = 0;
          let monthReel = 0;
          let monthCaObjectif = 0;
          let monthCaReel = 0;

          // Calculate for each channel
          categories.forEach(cat => {
            const prix_ht = getPriceForCategory(cat);
            
            const categoryTargets = (targets || []).filter(
              t => t.product_id === product.id && t.mois === month && t.categorie_prix === cat
            );
            const categoryActuals = (actuals || []).filter(
              a => a.product_id === product.id && a.mois === month && a.categorie_prix === cat
            );
            
            const objQty = categoryTargets.reduce((sum, t) => sum + Number(t.quantite_objectif || 0), 0);
            const realQty = categoryActuals.reduce((sum, a) => sum + Number(a.quantite_reelle || 0), 0);
            
            monthObjectif += objQty;
            monthReel += realQty;
            monthCaObjectif += objQty * prix_ht;
            monthCaReel += realQty * prix_ht;
          });

          // Fallback: if no category-specific data, check for legacy records
          if (monthObjectif === 0 && monthReel === 0) {
            const legacyTarget = (targets || []).find(t => t.product_id === product.id && t.mois === month && !t.categorie_prix);
            const legacyActual = (actuals || []).find(a => a.product_id === product.id && a.mois === month && !a.categorie_prix);
            
            if (legacyTarget || legacyActual) {
              monthObjectif = Number(legacyTarget?.quantite_objectif || 0);
              monthReel = Number(legacyActual?.quantite_reelle || 0);
              monthCaObjectif = monthObjectif * prixBtc;
              monthCaReel = monthReel * prixBtc;
            }
          }
          
          monthsData[month] = { objectif: monthObjectif, reel: monthReel };
          totalObjectif += monthObjectif;
          totalReel += monthReel;
          totalCaObjectif += monthCaObjectif;
          totalCaReel += monthCaReel;
        });

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
    mutationFn: async ({ product_id, mois, field, value, categorie_prix = 'BTC' }: { product_id: string; mois: string; field: 'objectif' | 'reel'; value: number; categorie_prix?: PriceCategory }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      if (field === 'objectif') {
        const { data, error } = await supabase
          .from('sales_targets')
          .upsert(
            { product_id, mois, quantite_objectif: value, project_id: currentProject.id, mode, categorie_prix },
            { onConflict: 'project_id,product_id,mois,mode,categorie_prix' }
          )
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sales_actuals')
          .upsert(
            { product_id, mois, quantite_reelle: value, project_id: currentProject.id, mode: 'reel', categorie_prix },
            { onConflict: 'project_id,product_id,mois,mode,categorie_prix' }
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
      queryClient.invalidateQueries({ queryKey: ['sales-by-category'] });
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
