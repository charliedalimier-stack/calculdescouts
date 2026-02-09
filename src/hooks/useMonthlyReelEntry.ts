import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';
import { PriceCategory } from './useProductPrices';

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export interface MonthlyReelEntry {
  id?: string;
  project_id: string;
  product_id: string;
  user_id: string;
  year: number;
  month: string; // format: YYYY-MM-01
  categorie_prix: PriceCategory;
  quantite: number;
  prix_ht_override?: number | null;
}

export interface MonthlyReelRowData {
  product_id: string;
  product_name: string;
  category_name: string | null;
  month: string;
  month_label: string;
  channels: {
    BTC: { quantite: number; prix_ht: number; prix_ht_override?: number | null; ca: number };
    BTB: { quantite: number; prix_ht: number; prix_ht_override?: number | null; ca: number };
    Distributeur: { quantite: number; prix_ht: number; prix_ht_override?: number | null; ca: number };
  };
  total_quantite: number;
  total_ca: number;
}

export interface ProductMonthlyReelData {
  product_id: string;
  product_name: string;
  category_name: string | null;
  months: {
    [month: string]: {
      channels: {
        BTC: { quantite: number; prix_ht: number; prix_ht_override?: number | null; ca: number };
        BTB: { quantite: number; prix_ht: number; prix_ht_override?: number | null; ca: number };
        Distributeur: { quantite: number; prix_ht: number; prix_ht_override?: number | null; ca: number };
      };
      total_quantite: number;
      total_ca: number;
    };
  };
  total_annuel_quantite: number;
  total_annuel_ca: number;
}

export interface ReelSeasonalityData {
  month_label: string;
  month: string;
  ca: number;
  percentage: number;
}

/**
 * Hook for monthly REEL sales entry.
 * In REEL mode, sales are entered month by month (not annually).
 */
export function useMonthlyReelEntry(year: number, selectedMonth?: number) {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-reel-entry', currentProject?.id, year, selectedMonth],
    queryFn: async () => {
      if (!currentProject?.id) return { entries: [], products: [], byProduct: [] };

      

      // Fetch products (budget mode = canonical)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', 'budget');

      if (productsError) throw productsError;
      if (!products || products.length === 0) return { entries: [], products: [], byProduct: [] };

      const productIds = products.map(p => p.id);

      // Fetch product prices (budget mode as base)
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', 'budget');

      // Fetch monthly reel sales for the year
      const { data: monthlySales } = await supabase
        .from('monthly_sales_reel')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year);

      const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

      const getPriceForCategory = (productId: string, cat: PriceCategory): number => {
        const price = (productPrices || []).find(p => p.product_id === productId && p.categorie_prix === cat);
        if (price) return Number(price.prix_ht);
        const product = products.find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        if (cat === 'BTC') return prixBtc;
        if (cat === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85;
      };

      // Build entries by product with all months
      const byProduct: ProductMonthlyReelData[] = products.map(product => {
        const months: ProductMonthlyReelData['months'] = {};
        let totalAnnuelQuantite = 0;
        let totalAnnuelCa = 0;

        for (let i = 0; i < 12; i++) {
          const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
          const channels = {} as ProductMonthlyReelData['months'][string]['channels'];
          let monthTotalQty = 0;
          let monthTotalCa = 0;

          categories.forEach(cat => {
            const entry = (monthlySales || []).find(
              s => s.product_id === product.id && s.month === monthStr && s.categorie_prix === cat
            );
            const basePrix = getPriceForCategory(product.id, cat);
            const prixHtOverride = entry?.prix_ht_override ? Number(entry.prix_ht_override) : null;
            const prixHt = prixHtOverride || basePrix;
            const quantite = Number(entry?.quantite || 0);
            const ca = quantite * prixHt;

            channels[cat] = {
              quantite,
              prix_ht: basePrix,
              prix_ht_override: prixHtOverride,
              ca,
            };

            monthTotalQty += quantite;
            monthTotalCa += ca;
          });

          months[monthStr] = {
            channels,
            total_quantite: monthTotalQty,
            total_ca: monthTotalCa,
          };

          totalAnnuelQuantite += monthTotalQty;
          totalAnnuelCa += monthTotalCa;
        }

        return {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          months,
          total_annuel_quantite: totalAnnuelQuantite,
          total_annuel_ca: totalAnnuelCa,
        };
      });

      // Build flat entries for the selected month (if provided)
      const entries: MonthlyReelRowData[] = [];
      if (selectedMonth !== undefined) {
        const monthStr = `${year}-${selectedMonth.toString().padStart(2, '0')}-01`;
        
        products.forEach(product => {
          const channels = {} as MonthlyReelRowData['channels'];
          let totalQty = 0;
          let totalCa = 0;

          categories.forEach(cat => {
            const entry = (monthlySales || []).find(
              s => s.product_id === product.id && s.month === monthStr && s.categorie_prix === cat
            );
            const basePrix = getPriceForCategory(product.id, cat);
            const prixHtOverride = entry?.prix_ht_override ? Number(entry.prix_ht_override) : null;
            const prixHt = prixHtOverride || basePrix;
            const quantite = Number(entry?.quantite || 0);
            const ca = quantite * prixHt;

            channels[cat] = {
              quantite,
              prix_ht: basePrix,
              prix_ht_override: prixHtOverride,
              ca,
            };

            totalQty += quantite;
            totalCa += ca;
          });

          entries.push({
            product_id: product.id,
            product_name: product.nom_produit,
            category_name: (product.categories as any)?.nom_categorie || null,
            month: monthStr,
            month_label: MONTH_LABELS[selectedMonth - 1],
            channels,
            total_quantite: totalQty,
            total_ca: totalCa,
          });
        });
      }

      return { entries, products, byProduct };
    },
    enabled: !!currentProject?.id,
  });

  const setMonthlySales = useMutation({
    mutationFn: async ({
      product_id,
      month,
      categorie_prix,
      quantite,
      prix_ht_override,
    }: {
      product_id: string;
      month: string;
      categorie_prix: PriceCategory;
      quantite: number;
      prix_ht_override?: number | null;
    }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Parse month to get year
      const monthYear = parseInt(month.substring(0, 4));

      const { data, error } = await supabase
        .from('monthly_sales_reel')
        .upsert({
          project_id: currentProject.id,
          product_id,
          user_id: user.id,
          year: monthYear,
          month,
          categorie_prix,
          quantite,
          prix_ht_override,
        }, {
          onConflict: 'project_id,product_id,year,month,categorie_prix',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-reel-entry'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['reel-annual-totals'] });
      toast.success('Ventes réelles mises à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Calculate totals for selected month
  const monthlyTotals = {
    quantite: data?.entries.reduce((sum, e) => sum + e.total_quantite, 0) || 0,
    ca: data?.entries.reduce((sum, e) => sum + e.total_ca, 0) || 0,
    by_channel: {
      BTC: {
        quantite: data?.entries.reduce((sum, e) => sum + e.channels.BTC.quantite, 0) || 0,
        ca: data?.entries.reduce((sum, e) => sum + e.channels.BTC.ca, 0) || 0,
      },
      BTB: {
        quantite: data?.entries.reduce((sum, e) => sum + e.channels.BTB.quantite, 0) || 0,
        ca: data?.entries.reduce((sum, e) => sum + e.channels.BTB.ca, 0) || 0,
      },
      Distributeur: {
        quantite: data?.entries.reduce((sum, e) => sum + e.channels.Distributeur.quantite, 0) || 0,
        ca: data?.entries.reduce((sum, e) => sum + e.channels.Distributeur.ca, 0) || 0,
      },
    },
  };

  // Calculate annual totals
  const annualTotals = {
    quantite: data?.byProduct.reduce((sum, p) => sum + p.total_annuel_quantite, 0) || 0,
    ca: data?.byProduct.reduce((sum, p) => sum + p.total_annuel_ca, 0) || 0,
  };

  return {
    entries: data?.entries || [],
    byProduct: data?.byProduct || [],
    products: data?.products || [],
    monthlyTotals,
    annualTotals,
    isLoading,
    setMonthlySales,
  };
}

/**
 * Hook to calculate real seasonality from monthly_sales_reel.
 * Returns the observed seasonality percentages (read-only).
 */
export function useReelSeasonality(year: number) {
  const { currentProject } = useProject();

  const { data, isLoading } = useQuery({
    queryKey: ['reel-seasonality', currentProject?.id, year],
    queryFn: async () => {
      if (!currentProject?.id) return { seasonality: [], totalCa: 0 };

      

      // Fetch products for price lookup
      const { data: products } = await supabase
        .from('products')
        .select('id, prix_btc')
        .eq('project_id', currentProject.id)
        .eq('mode', 'budget');

      const productIds = (products || []).map(p => p.id);

      // Fetch product prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', 'budget');

      // Fetch monthly reel sales
      const { data: monthlySales } = await supabase
        .from('monthly_sales_reel')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year);

      // Helper to get price
      const getPrice = (productId: string, category: string): number => {
        const price = (prices || []).find(
          p => p.product_id === productId && p.categorie_prix === category
        );
        if (price) return Number(price.prix_ht);
        const product = (products || []).find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        if (category === 'BTC') return prixBtc;
        if (category === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85;
      };

      // Calculate CA per month
      const monthCa: number[] = Array(12).fill(0);
      let totalCa = 0;

      (monthlySales || []).forEach(sale => {
        const monthIndex = parseInt(sale.month.substring(5, 7)) - 1;
        const quantite = Number(sale.quantite || 0);
        const prix = sale.prix_ht_override 
          ? Number(sale.prix_ht_override) 
          : getPrice(sale.product_id, sale.categorie_prix);
        const ca = quantite * prix;
        monthCa[monthIndex] += ca;
        totalCa += ca;
      });

      // Calculate percentages
      const seasonality: ReelSeasonalityData[] = MONTH_LABELS.map((label, i) => ({
        month_label: label,
        month: `${year}-${(i + 1).toString().padStart(2, '0')}-01`,
        ca: monthCa[i],
        percentage: totalCa > 0 ? (monthCa[i] / totalCa) * 100 : 0,
      }));

      return { seasonality, totalCa };
    },
    enabled: !!currentProject?.id,
  });

  return {
    seasonality: data?.seasonality || [],
    totalCa: data?.totalCa || 0,
    isLoading,
  };
}

/**
 * Hook to get annual totals from monthly_sales_reel.
 * Used to compare with Budget annual sales.
 */
export function useReelAnnualTotals(year: number) {
  const { currentProject } = useProject();

  const { data, isLoading } = useQuery({
    queryKey: ['reel-annual-totals', currentProject?.id, year],
    queryFn: async () => {
      if (!currentProject?.id) return { totalQty: 0, totalCa: 0, byChannel: [] };

      // Fetch products for price lookup
      const { data: products } = await supabase
        .from('products')
        .select('id, prix_btc')
        .eq('project_id', currentProject.id)
        .eq('mode', 'budget');

      const productIds = (products || []).map(p => p.id);

      // Fetch product prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', 'budget');

      // Fetch monthly reel sales
      const { data: monthlySales } = await supabase
        .from('monthly_sales_reel')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year);

      // Helper to get price
      const getPrice = (productId: string, category: string): number => {
        const price = (prices || []).find(
          p => p.product_id === productId && p.categorie_prix === category
        );
        if (price) return Number(price.prix_ht);
        const product = (products || []).find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        if (category === 'BTC') return prixBtc;
        if (category === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85;
      };

      let totalQty = 0;
      let totalCa = 0;
      const channelTotals: Record<string, { qty: number; ca: number }> = {
        BTC: { qty: 0, ca: 0 },
        BTB: { qty: 0, ca: 0 },
        Distributeur: { qty: 0, ca: 0 },
      };

      (monthlySales || []).forEach(sale => {
        const quantite = Number(sale.quantite || 0);
        const prix = sale.prix_ht_override 
          ? Number(sale.prix_ht_override) 
          : getPrice(sale.product_id, sale.categorie_prix);
        const ca = quantite * prix;
        
        totalQty += quantite;
        totalCa += ca;
        
        if (channelTotals[sale.categorie_prix]) {
          channelTotals[sale.categorie_prix].qty += quantite;
          channelTotals[sale.categorie_prix].ca += ca;
        }
      });

      const byChannel = Object.entries(channelTotals).map(([channel, data]) => ({
        channel: channel as PriceCategory,
        qty: data.qty,
        ca: data.ca,
      }));

      return { totalQty, totalCa, byChannel };
    },
    enabled: !!currentProject?.id,
  });

  return {
    totalQty: data?.totalQty || 0,
    totalCa: data?.totalCa || 0,
    byChannel: data?.byChannel || [],
    isLoading,
  };
}
