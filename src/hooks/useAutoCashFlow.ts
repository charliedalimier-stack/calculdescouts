import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';

export type CashFlowMode = 'budget' | 'reel';

export interface MonthlyCashFlowData {
  month: string;
  monthLabel: string;
  // Encaissements (Revenue)
  encaissements: number;
  // Décaissements production
  achats_matieres: number;
  achats_emballages: number;
  couts_variables: number;
  decaissements_production: number;
  // Frais professionnels
  frais_professionnels: number;
  // Soldes calculés
  solde_production: number;
  solde_apres_frais: number;
  variation_nette: number;
  // Cumul
  cumul: number;
}

interface UseAutoCashFlowOptions {
  mode: CashFlowMode;
  year: number;
}

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DEFAULT_COEFFICIENTS = Array(12).fill(8.33);
DEFAULT_COEFFICIENTS[11] = 8.37; // December

export function useAutoCashFlow({ mode, year }: UseAutoCashFlowOptions) {
  const { currentProject } = useProject();

  const { data, isLoading, error } = useQuery({
    queryKey: ['auto-cash-flow', currentProject?.id, mode, year],
    queryFn: async (): Promise<MonthlyCashFlowData[]> => {
      if (!currentProject?.id) return [];

      // 1. Fetch seasonality coefficients for the mode
      const { data: coefData } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', mode)
        .maybeSingle();

      const coefficients = coefData
        ? [
            Number(coefData.month_01), Number(coefData.month_02), Number(coefData.month_03),
            Number(coefData.month_04), Number(coefData.month_05), Number(coefData.month_06),
            Number(coefData.month_07), Number(coefData.month_08), Number(coefData.month_09),
            Number(coefData.month_10), Number(coefData.month_11), Number(coefData.month_12),
          ]
        : DEFAULT_COEFFICIENTS;

      // 2. Fetch annual sales for the mode
      const { data: annualSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', mode);

      // 3. Fetch products and prices
      const productIds = [...new Set((annualSales || []).map(s => s.product_id))];
      
      let products: any[] = [];
      let productPrices: any[] = [];
      let recipes: any[] = [];
      let productPackaging: any[] = [];
      let productVariableCosts: any[] = [];
      let ingredients: any[] = [];
      let packaging: any[] = [];
      let variableCosts: any[] = [];

      if (productIds.length > 0) {
        const [productsRes, pricesRes, recipesRes, packagingRes, variableCostsRes] = await Promise.all([
          supabase.from('products').select('*').in('id', productIds),
          supabase.from('product_prices').select('*').in('product_id', productIds).eq('mode', 'simulation'),
          supabase.from('recipes').select('*').in('product_id', productIds).eq('mode', 'simulation'),
          supabase.from('product_packaging').select('*').in('product_id', productIds).eq('mode', 'simulation'),
          supabase.from('product_variable_costs').select('*').in('product_id', productIds).eq('mode', 'simulation'),
        ]);

        products = productsRes.data || [];
        productPrices = pricesRes.data || [];
        recipes = recipesRes.data || [];
        productPackaging = packagingRes.data || [];
        productVariableCosts = variableCostsRes.data || [];

        // Fetch ingredient/packaging/variable cost details
        const ingredientIds = [...new Set(recipes.map(r => r.ingredient_id))];
        const packagingIds = [...new Set(productPackaging.map(pp => pp.packaging_id))];
        const variableCostIds = [...new Set(productVariableCosts.map(pvc => pvc.variable_cost_id))];

        const [ingredientsRes, packagingDetailsRes, variableCostsDetailsRes] = await Promise.all([
          ingredientIds.length > 0 
            ? supabase.from('ingredients').select('*').in('id', ingredientIds) 
            : Promise.resolve({ data: [] }),
          packagingIds.length > 0 
            ? supabase.from('packaging').select('*').in('id', packagingIds) 
            : Promise.resolve({ data: [] }),
          variableCostIds.length > 0 
            ? supabase.from('variable_costs').select('*').in('id', variableCostIds) 
            : Promise.resolve({ data: [] }),
        ]);

        ingredients = ingredientsRes.data || [];
        packaging = packagingDetailsRes.data || [];
        variableCosts = variableCostsDetailsRes.data || [];
      }

      // 4. Fetch monthly real sales (for mode = 'reel')
      let monthlySalesReel: any[] = [];
      if (mode === 'reel') {
        const { data: reelData } = await supabase
          .from('monthly_sales_reel')
          .select('*')
          .eq('project_id', currentProject.id)
          .eq('year', year);
        monthlySalesReel = reelData || [];
      }

      // 5. Fetch professional expenses
      const expenseMode = mode === 'budget' ? 'simulation' : 'reel';
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      
      const { data: expenses } = await supabase
        .from('professional_expenses')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', expenseMode)
        .gte('mois', startOfYear)
        .lte('mois', endOfYear);

      // Helper functions
      const getPrice = (productId: string, category: string): number => {
        const price = productPrices.find(
          p => p.product_id === productId && p.categorie_prix === category
        );
        if (price) return Number(price.prix_ht);
        
        const product = products.find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        
        if (category === 'BTC') return prixBtc;
        if (category === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85;
      };

      const getProductCosts = (productId: string): { matieres: number; emballages: number; variables: number } => {
        // Raw materials cost
        const productRecipes = recipes.filter(r => r.product_id === productId);
        const matieres = productRecipes.reduce((sum, recipe) => {
          const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
          return sum + (Number(recipe.quantite_utilisee) * Number(ingredient?.cout_unitaire || 0));
        }, 0);

        // Packaging cost
        const productPacks = productPackaging.filter(pp => pp.product_id === productId);
        const emballages = productPacks.reduce((sum, pack) => {
          const pkg = packaging.find(p => p.id === pack.packaging_id);
          return sum + (Number(pack.quantite) * Number(pkg?.cout_unitaire || 0));
        }, 0);

        // Variable costs
        const productVarCosts = productVariableCosts.filter(pvc => pvc.product_id === productId);
        const variables = productVarCosts.reduce((sum, pvc) => {
          const vc = variableCosts.find(v => v.id === pvc.variable_cost_id);
          return sum + (Number(pvc.quantite) * Number(vc?.cout_unitaire || 0));
        }, 0);

        return { matieres, emballages, variables };
      };

      // 6. Calculate monthly data
      const monthlyData: MonthlyCashFlowData[] = [];
      let cumul = 0;

      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
        const monthKey = `${year}-${(i + 1).toString().padStart(2, '0')}`;
        const coef = Number(coefficients[i]) / 100;

        let encaissements = 0;
        let achats_matieres = 0;
        let achats_emballages = 0;
        let couts_variables = 0;

        if (mode === 'reel') {
          // For real mode: use monthly_sales_reel if available
          const monthReel = monthlySalesReel.filter(s => s.month === monthStr);
          
          if (monthReel.length > 0) {
            // Use actual monthly data
            monthReel.forEach(sale => {
              const qty = Number(sale.quantite) || 0;
              const prix = sale.prix_ht_override 
                ? Number(sale.prix_ht_override) 
                : getPrice(sale.product_id, sale.categorie_prix);
              encaissements += qty * prix;

              const costs = getProductCosts(sale.product_id);
              achats_matieres += qty * costs.matieres;
              achats_emballages += qty * costs.emballages;
              couts_variables += qty * costs.variables;
            });
          } else {
            // Fallback to annual_sales with seasonality
            (annualSales || []).forEach(sale => {
              const annualQty = Number(sale.quantite_annuelle) || 0;
              const monthQty = Math.round(annualQty * coef);
              const prix = sale.prix_ht_override 
                ? Number(sale.prix_ht_override) 
                : getPrice(sale.product_id, sale.categorie_prix);
              encaissements += monthQty * prix;

              const costs = getProductCosts(sale.product_id);
              achats_matieres += monthQty * costs.matieres;
              achats_emballages += monthQty * costs.emballages;
              couts_variables += monthQty * costs.variables;
            });
          }
        } else {
          // Budget mode: always use annual_sales with seasonality
          (annualSales || []).forEach(sale => {
            const annualQty = Number(sale.quantite_annuelle) || 0;
            const monthQty = Math.round(annualQty * coef);
            const prix = sale.prix_ht_override 
              ? Number(sale.prix_ht_override) 
              : getPrice(sale.product_id, sale.categorie_prix);
            encaissements += monthQty * prix;

            const costs = getProductCosts(sale.product_id);
            achats_matieres += monthQty * costs.matieres;
            achats_emballages += monthQty * costs.emballages;
            couts_variables += monthQty * costs.variables;
          });
        }

        // Professional expenses for this month
        const frais_professionnels = (expenses || [])
          .filter(e => e.mois.startsWith(monthKey))
          .reduce((sum, e) => sum + Number(e.montant_ht), 0);

        // Calculate totals
        const decaissements_production = achats_matieres + achats_emballages + couts_variables;
        const solde_production = encaissements - decaissements_production;
        const solde_apres_frais = solde_production - frais_professionnels;
        const variation_nette = solde_apres_frais;

        cumul += variation_nette;

        monthlyData.push({
          month: monthStr,
          monthLabel: MONTH_LABELS[i],
          encaissements,
          achats_matieres,
          achats_emballages,
          couts_variables,
          decaissements_production,
          frais_professionnels,
          solde_production,
          solde_apres_frais,
          variation_nette,
          cumul,
        });
      }

      return monthlyData;
    },
    enabled: !!currentProject?.id,
  });

  // Calculate summary from data
  const summary = {
    total_encaissements: data?.reduce((sum, m) => sum + m.encaissements, 0) || 0,
    total_decaissements_production: data?.reduce((sum, m) => sum + m.decaissements_production, 0) || 0,
    total_frais_professionnels: data?.reduce((sum, m) => sum + m.frais_professionnels, 0) || 0,
    total_variation_nette: data?.reduce((sum, m) => sum + m.variation_nette, 0) || 0,
    solde_final: data?.[data.length - 1]?.cumul || 0,
    has_negative: data?.some(m => m.cumul < 0) || false,
    first_negative_month: data?.find(m => m.cumul < 0)?.monthLabel || null,
  };

  // Get current month data
  const currentMonthIndex = new Date().getMonth();
  const currentMonthData = data?.[currentMonthIndex] || {
    encaissements: 0,
    decaissements_production: 0,
    frais_professionnels: 0,
    solde_production: 0,
    solde_apres_frais: 0,
    cumul: 0,
  };

  return {
    monthlyData: data || [],
    summary,
    currentMonthData,
    isLoading,
    error,
  };
}
