import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';
import { PriceCategory } from './useProductPrices';

export interface MonthlySaleReel {
  id: string;
  project_id: string;
  product_id: string;
  user_id: string;
  year: number;
  month: string;
  categorie_prix: PriceCategory;
  quantite: number;
  prix_ht_override: number | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReelEntry {
  product_id: string;
  product_name: string;
  category_name: string | null;
  months: {
    [month: string]: {
      BTC: { quantite: number; prix_ht_override: number | null };
      BTB: { quantite: number; prix_ht_override: number | null };
      Distributeur: { quantite: number; prix_ht_override: number | null };
    };
  };
  totals: {
    BTC: { quantite: number; ca: number };
    BTB: { quantite: number; ca: number };
    Distributeur: { quantite: number; ca: number };
    total_quantite: number;
    total_ca: number;
  };
}

const MONTH_KEYS = Array.from({ length: 12 }, (_, i) => 
  `${(i + 1).toString().padStart(2, '0')}`
);

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function useMonthlySalesReel(year: number) {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-sales-reel', currentProject?.id, year],
    queryFn: async () => {
      if (!currentProject?.id) return { entries: [], products: [], prices: [] };

      // Fetch products (simulation mode = canonical product list)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', 'simulation');

      if (productsError) throw productsError;
      if (!products || products.length === 0) return { entries: [], products: [], prices: [] };

      const productIds = products.map(p => p.id);

      // Fetch product prices
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', 'simulation');

      // Fetch monthly sales reel - use raw query since types may not be updated yet
      const { data: monthlySales, error: salesError } = await supabase
        .from('monthly_sales_reel' as any)
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year);

      if (salesError) {
        console.error('Error fetching monthly_sales_reel:', salesError);
      }

      const categories: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

      const getPriceForCategory = (productId: string, cat: PriceCategory): number => {
        const product = products.find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        const price = (productPrices || []).find(
          p => p.product_id === productId && p.categorie_prix === cat
        );
        if (price) return Number(price.prix_ht);
        if (cat === 'BTC') return prixBtc;
        if (cat === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85;
      };

      const entries: MonthlyReelEntry[] = products.map(product => {
        const months: MonthlyReelEntry['months'] = {};

        // Initialize all months
        MONTH_KEYS.forEach((monthNum) => {
          const monthStr = `${year}-${monthNum}-01`;
          months[monthStr] = {
            BTC: { quantite: 0, prix_ht_override: null },
            BTB: { quantite: 0, prix_ht_override: null },
            Distributeur: { quantite: 0, prix_ht_override: null },
          };
        });

        // Populate with actual data
        (monthlySales || [])
          .filter((s: any) => s.product_id === product.id)
          .forEach((sale: any) => {
            const monthKey = sale.month;
            if (months[monthKey] && months[monthKey][sale.categorie_prix as PriceCategory]) {
              months[monthKey][sale.categorie_prix as PriceCategory] = {
                quantite: sale.quantite || 0,
                prix_ht_override: sale.prix_ht_override,
              };
            }
          });

        // Calculate totals
        const totals = {
          BTC: { quantite: 0, ca: 0 },
          BTB: { quantite: 0, ca: 0 },
          Distributeur: { quantite: 0, ca: 0 },
          total_quantite: 0,
          total_ca: 0,
        };

        categories.forEach(cat => {
          const prix = getPriceForCategory(product.id, cat);
          Object.values(months).forEach(monthData => {
            const catData = monthData[cat];
            const qty = catData.quantite;
            const effectivePrice = catData.prix_ht_override || prix;
            totals[cat].quantite += qty;
            totals[cat].ca += qty * effectivePrice;
          });
          totals.total_quantite += totals[cat].quantite;
          totals.total_ca += totals[cat].ca;
        });

        return {
          product_id: product.id,
          product_name: product.nom_produit,
          category_name: (product.categories as any)?.nom_categorie || null,
          months,
          totals,
        };
      });

      return { entries, products, prices: productPrices || [] };
    },
    enabled: !!currentProject?.id,
  });

  const setMonthlySale = useMutation({
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

      // Use raw query since types may not be updated
      const { data, error } = await supabase
        .from('monthly_sales_reel' as any)
        .upsert({
          project_id: currentProject.id,
          product_id,
          user_id: user.id,
          year,
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
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-reel'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-distribution'] });
      toast.success('Vente mensuelle enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteMonthlySale = useMutation({
    mutationFn: async ({
      product_id,
      month,
      categorie_prix,
    }: {
      product_id: string;
      month: string;
      categorie_prix: PriceCategory;
    }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { error } = await supabase
        .from('monthly_sales_reel' as any)
        .delete()
        .eq('project_id', currentProject.id)
        .eq('product_id', product_id)
        .eq('year', year)
        .eq('month', month)
        .eq('categorie_prix', categorie_prix);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-reel'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-sales-distribution'] });
    },
  });

  // Check if there's any monthly data
  const hasMonthlyData = (data?.entries || []).some(entry =>
    Object.values(entry.months).some(monthData =>
      monthData.BTC.quantite > 0 ||
      monthData.BTB.quantite > 0 ||
      monthData.Distributeur.quantite > 0
    )
  );

  // Calculate overall totals
  const totals = {
    quantite: data?.entries.reduce((sum, e) => sum + e.totals.total_quantite, 0) || 0,
    ca: data?.entries.reduce((sum, e) => sum + e.totals.total_ca, 0) || 0,
  };

  return {
    entries: data?.entries || [],
    products: data?.products || [],
    prices: data?.prices || [],
    totals,
    hasMonthlyData,
    isLoading,
    setMonthlySale,
    deleteMonthlySale,
    MONTH_KEYS,
    MONTH_LABELS,
  };
}
