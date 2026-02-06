import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';
import { PriceCategory } from './useProductPrices';

export interface SeasonalityCoefficients {
  id?: string;
  project_id: string;
  mode: string;
  year: number;
  month_01: number;
  month_02: number;
  month_03: number;
  month_04: number;
  month_05: number;
  month_06: number;
  month_07: number;
  month_08: number;
  month_09: number;
  month_10: number;
  month_11: number;
  month_12: number;
}

export interface AnnualSalesEntry {
  id?: string;
  project_id: string;
  product_id: string;
  user_id: string;
  mode: string;
  year: number;
  categorie_prix: PriceCategory;
  quantite_annuelle: number;
  prix_ht_override?: number | null;
}

export interface AnnualSalesRowData {
  product_id: string;
  product_name: string;
  category_name: string | null;
  channels: {
    BTC: { quantite_annuelle: number; prix_ht: number; prix_ht_override?: number | null; ca_annuel: number };
    BTB: { quantite_annuelle: number; prix_ht: number; prix_ht_override?: number | null; ca_annuel: number };
    Distributeur: { quantite_annuelle: number; prix_ht: number; prix_ht_override?: number | null; ca_annuel: number };
  };
  total_quantite: number;
  total_ca: number;
}

export interface MonthlyDistribution {
  month: string;
  month_label: string;
  budget_qty: number;
  reel_qty: number;
  budget_ca: number;
  reel_ca: number;
  ecart_qty: number;
  ecart_ca: number;
  ecart_percent: number;
}

export interface ChannelDistribution {
  channel: PriceCategory;
  budget_qty: number;
  reel_qty: number;
  budget_ca: number;
  reel_ca: number;
  ecart_percent: number;
}

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DEFAULT_COEFFICIENTS = {
  month_01: 8.33, month_02: 8.33, month_03: 8.33, month_04: 8.33,
  month_05: 8.33, month_06: 8.33, month_07: 8.33, month_08: 8.33,
  month_09: 8.33, month_10: 8.33, month_11: 8.33, month_12: 8.37,
};

export function useSeasonalityCoefficients(year: number, mode: 'budget' | 'reel') {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: coefficients, isLoading } = useQuery({
    queryKey: ['seasonality-coefficients', currentProject?.id, year, mode],
    queryFn: async () => {
      if (!currentProject?.id) return DEFAULT_COEFFICIENTS;

      const { data, error } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', mode)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          id: data.id,
          month_01: Number(data.month_01),
          month_02: Number(data.month_02),
          month_03: Number(data.month_03),
          month_04: Number(data.month_04),
          month_05: Number(data.month_05),
          month_06: Number(data.month_06),
          month_07: Number(data.month_07),
          month_08: Number(data.month_08),
          month_09: Number(data.month_09),
          month_10: Number(data.month_10),
          month_11: Number(data.month_11),
          month_12: Number(data.month_12),
        };
      }
      
      return DEFAULT_COEFFICIENTS;
    },
    enabled: !!currentProject?.id,
  });

  const updateCoefficients = useMutation({
    mutationFn: async (newCoefficients: Partial<SeasonalityCoefficients>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { data, error } = await supabase
        .from('seasonality_coefficients')
        .upsert({
          project_id: currentProject.id,
          year,
          mode,
          ...newCoefficients,
        }, {
          onConflict: 'project_id,mode,year',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasonality-coefficients'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-distribution'] });
      toast.success('Coefficients de saisonnalité mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const getCoefficientsArray = () => {
    if (!coefficients) return Array(12).fill(8.33);
    return [
      coefficients.month_01, coefficients.month_02, coefficients.month_03, coefficients.month_04,
      coefficients.month_05, coefficients.month_06, coefficients.month_07, coefficients.month_08,
      coefficients.month_09, coefficients.month_10, coefficients.month_11, coefficients.month_12,
    ];
  };

  return {
    coefficients: coefficients || DEFAULT_COEFFICIENTS,
    coefficientsArray: getCoefficientsArray(),
    isLoading,
    updateCoefficients,
  };
}

export function useAnnualSalesEntry(year: number, mode: 'budget' | 'reel') {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['annual-sales-entry', currentProject?.id, year, mode],
    queryFn: async () => {
      if (!currentProject?.id) return { entries: [], products: [] };

      // Fetch products - products use 'budget' mode as the canonical product list
      // Products are shared between budget and actual
      const productMode = 'budget';
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', productMode);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return { entries: [], products: [] };

      const productIds = products.map(p => p.id);

      // Fetch product prices - use budget mode as the base prices
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', 'budget');

      // Fetch annual sales entries
      const { data: annualSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', mode);

      const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

      const entries: AnnualSalesRowData[] = products.map(product => {
        const prixBtc = Number(product.prix_btc);

        const getPriceForCategory = (cat: PriceCategory): number => {
          const price = (productPrices || []).find(p => p.product_id === product.id && p.categorie_prix === cat);
          if (price) return Number(price.prix_ht);
          if (cat === 'BTC') return prixBtc;
          if (cat === 'BTB') return prixBtc * 0.7;
          return prixBtc * 0.7 * 0.85;
        };

        const channels = {} as AnnualSalesRowData['channels'];
        let totalQuantite = 0;
        let totalCa = 0;

        categories.forEach(cat => {
          const entry = (annualSales || []).find(
            s => s.product_id === product.id && s.categorie_prix === cat
          );
          const basePrix = getPriceForCategory(cat);
          const prixHtOverride = entry?.prix_ht_override ? Number(entry.prix_ht_override) : null;
          const prixHt = prixHtOverride || basePrix;
          const quantite = entry?.quantite_annuelle || 0;
          const ca = quantite * prixHt;

          channels[cat] = {
            quantite_annuelle: quantite,
            prix_ht: basePrix,
            prix_ht_override: prixHtOverride,
            ca_annuel: ca,
          };

          totalQuantite += quantite;
          totalCa += ca;
        });

        return {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          channels,
          total_quantite: totalQuantite,
          total_ca: totalCa,
        };
      });

      return { entries, products };
    },
    enabled: !!currentProject?.id,
  });

  const setAnnualSales = useMutation({
    mutationFn: async ({
      product_id,
      categorie_prix,
      quantite_annuelle,
      prix_ht_override,
    }: {
      product_id: string;
      categorie_prix: PriceCategory;
      quantite_annuelle: number;
      prix_ht_override?: number | null;
    }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('annual_sales')
        .upsert({
          project_id: currentProject.id,
          product_id,
          user_id: user.id,
          mode,
          year,
          categorie_prix,
          quantite_annuelle,
          prix_ht_override,
        }, {
          onConflict: 'project_id,product_id,mode,year,categorie_prix',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-sales-entry'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-distribution'] });
      toast.success('Ventes annuelles mises à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const totals = {
    quantite: data?.entries.reduce((sum, e) => sum + e.total_quantite, 0) || 0,
    ca: data?.entries.reduce((sum, e) => sum + e.total_ca, 0) || 0,
    by_channel: {
      BTC: {
        quantite: data?.entries.reduce((sum, e) => sum + e.channels.BTC.quantite_annuelle, 0) || 0,
        ca: data?.entries.reduce((sum, e) => sum + e.channels.BTC.ca_annuel, 0) || 0,
      },
      BTB: {
        quantite: data?.entries.reduce((sum, e) => sum + e.channels.BTB.quantite_annuelle, 0) || 0,
        ca: data?.entries.reduce((sum, e) => sum + e.channels.BTB.ca_annuel, 0) || 0,
      },
      Distributeur: {
        quantite: data?.entries.reduce((sum, e) => sum + e.channels.Distributeur.quantite_annuelle, 0) || 0,
        ca: data?.entries.reduce((sum, e) => sum + e.channels.Distributeur.ca_annuel, 0) || 0,
      },
    },
  };

  return {
    entries: data?.entries || [],
    products: data?.products || [],
    totals,
    isLoading,
    setAnnualSales,
  };
}

// Helper to extract coefficients array from database row
const getCoefArrayFromData = (data: any): number[] => {
  if (!data) return Array(12).fill(8.33);
  return [
    Number(data.month_01), Number(data.month_02), Number(data.month_03),
    Number(data.month_04), Number(data.month_05), Number(data.month_06),
    Number(data.month_07), Number(data.month_08), Number(data.month_09),
    Number(data.month_10), Number(data.month_11), Number(data.month_12),
  ];
};

export function useMonthlyDistribution(year: number) {
  const { currentProject } = useProject();

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-sales-distribution', currentProject?.id, year],
    queryFn: async () => {
      if (!currentProject?.id) return { monthly: [], byChannel: [] };

      console.log('[useMonthlyDistribution] Fetching data for year:', year);

      // 1. Load BUDGET coefficients
      const { data: budgetCoefData } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'budget')
        .maybeSingle();

      // Convert to array with defaults
      const budgetCoefficients = getCoefArrayFromData(budgetCoefData);

      console.log('[useMonthlyDistribution] Budget coefficients:', budgetCoefficients);

      // 2. Fetch BUDGET annual sales (mode = 'budget')
      const { data: budgetSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'budget');

      // 3. Fetch REEL monthly sales from monthly_sales_reel table
      const { data: reelMonthlySales } = await supabase
        .from('monthly_sales_reel')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year);

      console.log('[useMonthlyDistribution] Budget sales count:', budgetSales?.length || 0);
      console.log('[useMonthlyDistribution] Reel monthly sales count:', reelMonthlySales?.length || 0);

      // 4. Collect unique product IDs
      const allProductIds = [...new Set([
        ...(budgetSales || []).map(s => s.product_id),
        ...(reelMonthlySales || []).map(s => s.product_id),
      ])];

      // Guard: if no products, return empty
      if (allProductIds.length === 0) {
        return { monthly: MONTH_LABELS.map((label, i) => ({
          month: `${year}-${(i + 1).toString().padStart(2, '0')}-01`,
          month_label: label,
          budget_qty: 0,
          reel_qty: 0,
          budget_ca: 0,
          reel_ca: 0,
          ecart_qty: 0,
          ecart_ca: 0,
          ecart_percent: 0,
        })), byChannel: [] };
      }

      // Fetch products (budget mode = canonical)
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc')
        .in('id', allProductIds);

      // Fetch product prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', allProductIds)
        .eq('mode', 'budget');

      // Helper: get price for a product/category
      const getPrice = (productId: string, category: string): number => {
        const price = (prices || []).find(
          p => p.product_id === productId && p.categorie_prix === category
        );
        if (price) return Number(price.prix_ht);
        
        const product = (products || []).find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        
        if (category === 'BTC') return prixBtc;
        if (category === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85; // Distributeur
      };

      // 5. Calculate monthly distribution (totals per month)
      const monthly: MonthlyDistribution[] = [];
      
      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
        
        // ⚠️ CRITICAL: Convert percentage to decimal (÷100)
        const budgetCoef = Number(budgetCoefficients[i]) / 100;

        let budgetQty = 0;
        let reelQty = 0;
        let budgetCa = 0;
        let reelCa = 0;

        // Process BUDGET sales (annual → monthly via coefficients)
        (budgetSales || []).forEach(sale => {
          const annualQty = Number(sale.quantite_annuelle) || 0;
          const monthQty = Math.round(annualQty * budgetCoef);
          const prix = sale.prix_ht_override 
            ? Number(sale.prix_ht_override) 
            : getPrice(sale.product_id, sale.categorie_prix);
          budgetQty += monthQty;
          budgetCa += monthQty * prix;
        });

        // Process REEL sales (directly from monthly_sales_reel)
        const monthReelSales = (reelMonthlySales || []).filter(s => s.month === monthStr);
        monthReelSales.forEach(sale => {
          const qty = Number(sale.quantite) || 0;
          const prix = sale.prix_ht_override 
            ? Number(sale.prix_ht_override) 
            : getPrice(sale.product_id, sale.categorie_prix);
          reelQty += qty;
          reelCa += qty * prix;
        });

        const ecartQty = reelQty - budgetQty;
        const ecartCa = reelCa - budgetCa;
        const ecartPercent = budgetCa > 0 ? ((reelCa - budgetCa) / budgetCa) * 100 : 0;

        // Log first month only to avoid spam
        if (i === 0) {
          console.log(`[useMonthlyDistribution] Month ${i + 1} - Budget: qty=${budgetQty}, ca=${budgetCa.toFixed(2)} | Reel: qty=${reelQty}, ca=${reelCa.toFixed(2)}`);
        }

        monthly.push({
          month: monthStr,
          month_label: MONTH_LABELS[i],
          budget_qty: budgetQty,
          reel_qty: reelQty,
          budget_ca: budgetCa,
          reel_ca: reelCa,
          ecart_qty: ecartQty,
          ecart_ca: ecartCa,
          ecart_percent: ecartPercent,
        });
      }

      // 6. Calculate by channel distribution (annual totals)
      const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];
      const byChannel: ChannelDistribution[] = categories.map(cat => {
        const budgetEntries = (budgetSales || []).filter(s => s.categorie_prix === cat);
        const reelEntries = (reelMonthlySales || []).filter(s => s.categorie_prix === cat);

        const budgetQty = budgetEntries.reduce((sum, s) => sum + Number(s.quantite_annuelle), 0);
        const reelQty = reelEntries.reduce((sum, s) => sum + Number(s.quantite), 0);
        
        const budgetCa = budgetEntries.reduce((sum, s) => {
          const prix = s.prix_ht_override 
            ? Number(s.prix_ht_override) 
            : getPrice(s.product_id, cat);
          return sum + Number(s.quantite_annuelle) * prix;
        }, 0);
        
        const reelCa = reelEntries.reduce((sum, s) => {
          const prix = s.prix_ht_override 
            ? Number(s.prix_ht_override) 
            : getPrice(s.product_id, cat);
          return sum + Number(s.quantite) * prix;
        }, 0);

        const ecartPercent = budgetCa > 0 ? ((reelCa - budgetCa) / budgetCa) * 100 : 0;

        return {
          channel: cat,
          budget_qty: budgetQty,
          reel_qty: reelQty,
          budget_ca: budgetCa,
          reel_ca: reelCa,
          ecart_percent: ecartPercent,
        };
      });

      return { monthly, byChannel };
    },
    enabled: !!currentProject?.id,
  });

  const totals = {
    budget_qty: data?.monthly.reduce((sum, m) => sum + m.budget_qty, 0) || 0,
    reel_qty: data?.monthly.reduce((sum, m) => sum + m.reel_qty, 0) || 0,
    budget_ca: data?.monthly.reduce((sum, m) => sum + m.budget_ca, 0) || 0,
    reel_ca: data?.monthly.reduce((sum, m) => sum + m.reel_ca, 0) || 0,
    get ecart_ca() { return this.reel_ca - this.budget_ca; },
    get ecart_percent() { return this.budget_ca > 0 ? ((this.reel_ca - this.budget_ca) / this.budget_ca) * 100 : 0; },
  };

  // Log totals for debugging
  console.log('[useMonthlyDistribution] Totals:', {
    budget_qty: totals.budget_qty,
    reel_qty: totals.reel_qty,
    budget_ca: totals.budget_ca,
    reel_ca: totals.reel_ca,
  });

  return {
    monthly: data?.monthly || [],
    byChannel: data?.byChannel || [],
    totals,
    isLoading,
  };
}

// Interface for product-level sales analysis
export interface ProductSalesAnalysis {
  product_id: string;
  product_name: string;
  category_name: string | null;
  budget_qty: number;
  reel_qty: number;
  budget_ca: number;
  reel_ca: number;
}

/**
 * Hook for product-level sales analysis (for Pareto, BCG, etc.)
 * Returns sales data aggregated by product for the specified year.
 */
export function useProductSalesAnalysis(year: number) {
  const { currentProject } = useProject();

  const { data, isLoading } = useQuery({
    queryKey: ['product-sales-analysis', currentProject?.id, year],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      console.log('[useProductSalesAnalysis] Fetching product sales for year:', year);

      // Fetch BUDGET annual sales
      const { data: budgetSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'budget');

      // Fetch REEL annual sales
      const { data: reelSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'reel');

      // Collect unique product IDs
      const allProductIds = [...new Set([
        ...(budgetSales || []).map(s => s.product_id),
        ...(reelSales || []).map(s => s.product_id),
      ])];

      if (allProductIds.length === 0) {
        console.log('[useProductSalesAnalysis] No sales data found');
        return [];
      }

      // Fetch products with categories
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, categories(nom_categorie)')
        .in('id', allProductIds);

      // Fetch product prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', allProductIds)
        .eq('mode', 'budget');

      // Helper: get price for a product/category
      const getPrice = (productId: string, category: string): number => {
        const price = (prices || []).find(
          p => p.product_id === productId && p.categorie_prix === category
        );
        if (price) return Number(price.prix_ht);
        
        const product = (products || []).find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        
        if (category === 'BTC') return prixBtc;
        if (category === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85; // Distributeur
      };

      // Aggregate by product
      const productMap = new Map<string, ProductSalesAnalysis>();

      // Initialize with all products
      (products || []).forEach(product => {
        productMap.set(product.id, {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          budget_qty: 0,
          reel_qty: 0,
          budget_ca: 0,
          reel_ca: 0,
        });
      });

      // Add budget sales
      (budgetSales || []).forEach(sale => {
        const existing = productMap.get(sale.product_id);
        if (existing) {
          const qty = Number(sale.quantite_annuelle) || 0;
          const prix = sale.prix_ht_override 
            ? Number(sale.prix_ht_override) 
            : getPrice(sale.product_id, sale.categorie_prix);
          existing.budget_qty += qty;
          existing.budget_ca += qty * prix;
        }
      });

      // Add reel sales
      (reelSales || []).forEach(sale => {
        const existing = productMap.get(sale.product_id);
        if (existing) {
          const qty = Number(sale.quantite_annuelle) || 0;
          const prix = sale.prix_ht_override 
            ? Number(sale.prix_ht_override) 
            : getPrice(sale.product_id, sale.categorie_prix);
          existing.reel_qty += qty;
          existing.reel_ca += qty * prix;
        }
      });

      const result = Array.from(productMap.values());
      console.log('[useProductSalesAnalysis] Found', result.length, 'products with sales');
      return result;
    },
    enabled: !!currentProject?.id,
  });

  return {
    productSales: data || [],
    isLoading,
  };
}
