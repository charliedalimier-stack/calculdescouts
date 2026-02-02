import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectSettings } from '@/hooks/useProjectSettings';

export type CashFlowMode = 'budget' | 'reel';

export interface MonthlyCashFlowData {
  month: string;
  monthLabel: string;
  // CA HT recognized at sale date (for reference - not cash)
  ca_ht_periode: number;
  // Encaissements by channel (after payment delay)
  encaissements_btc: number;
  encaissements_btb: number;
  encaissements_distributeur: number;
  // Encaissements (Revenue HT after payment delay)
  encaissements_ht: number;
  // TVA
  tva_collectee: number;
  encaissements_ttc: number;
  // Décaissements production HT
  achats_matieres_ht: number;
  achats_emballages_ht: number;
  couts_variables_ht: number;
  decaissements_production_ht: number;
  // TVA déductible
  tva_deductible_matieres: number;
  tva_deductible_emballages: number;
  tva_deductible_variables: number;
  tva_deductible_frais: number;
  tva_deductible: number;
  decaissements_production_ttc: number;
  // Frais professionnels
  frais_professionnels_ht: number;
  frais_professionnels_ttc: number;
  // TVA nette
  tva_nette: number;
  // Soldes calculés (HT - pour analyse économique)
  solde_production: number;
  solde_apres_frais: number;
  // Variation trésorerie (inclut TVA)
  variation_tresorerie: number;
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

// Helper to calculate target month index based on delay
function getTargetMonthIndex(saleMonthIndex: number, delayDays: number): number {
  // Each month = 30 days for simplicity
  const delayMonths = Math.floor(delayDays / 30);
  return saleMonthIndex + delayMonths;
}

export function useAutoCashFlow({ mode, year }: UseAutoCashFlowOptions) {
  const { currentProject } = useProject();
  const { settings } = useProjectSettings();

  const { data, isLoading, error } = useQuery({
    queryKey: ['auto-cash-flow', currentProject?.id, mode, year, settings?.regime_tva, settings?.delai_paiement_btc, settings?.delai_paiement_btb, settings?.delai_paiement_distributeur],
    queryFn: async (): Promise<MonthlyCashFlowData[]> => {
      if (!currentProject?.id) return [];

      // Check if franchise regime (no VAT)
      const isFranchise = settings?.regime_tva === 'franchise_taxe';
      const defaultTvaVente = settings?.tva_vente || 6;
      const defaultTvaAchat = settings?.tva_achat || 21;
      
      // Payment delays per channel
      const delayBtc = (settings as any)?.delai_paiement_btc ?? 0;
      const delayBtb = (settings as any)?.delai_paiement_btb ?? 30;
      const delayDistributeur = (settings as any)?.delai_paiement_distributeur ?? 30;

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

      // 3. Fetch products and prices with TVA rates
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

        // Fetch ingredient/packaging/variable cost details with TVA rates
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

      // 5. Fetch professional expenses with TVA
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

      const getProductTvaRate = (productId: string): number => {
        const product = products.find(p => p.id === productId);
        return product?.tva_taux ?? defaultTvaVente;
      };

      const getDelayForChannel = (channel: string): number => {
        if (channel === 'BTC') return delayBtc;
        if (channel === 'BTB') return delayBtb;
        return delayDistributeur;
      };

      const getProductCosts = (productId: string): { 
        matieres_ht: number; 
        emballages_ht: number; 
        variables_ht: number;
        tva_matieres: number;
        tva_emballages: number;
        tva_variables: number;
      } => {
        // Raw materials cost with TVA
        const productRecipes = recipes.filter(r => r.product_id === productId);
        let matieres_ht = 0;
        let tva_matieres = 0;
        productRecipes.forEach(recipe => {
          const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
          const ht = Number(recipe.quantite_utilisee) * Number(ingredient?.cout_unitaire || 0);
          const tvaTaux = ingredient?.tva_taux ?? defaultTvaAchat;
          matieres_ht += ht;
          tva_matieres += isFranchise ? 0 : ht * (tvaTaux / 100);
        });

        // Packaging cost with TVA
        const productPacks = productPackaging.filter(pp => pp.product_id === productId);
        let emballages_ht = 0;
        let tva_emballages = 0;
        productPacks.forEach(pack => {
          const pkg = packaging.find(p => p.id === pack.packaging_id);
          const ht = Number(pack.quantite) * Number(pkg?.cout_unitaire || 0);
          const tvaTaux = pkg?.tva_taux ?? defaultTvaAchat;
          emballages_ht += ht;
          tva_emballages += isFranchise ? 0 : ht * (tvaTaux / 100);
        });

        // Variable costs with TVA
        const productVarCosts = productVariableCosts.filter(pvc => pvc.product_id === productId);
        let variables_ht = 0;
        let tva_variables = 0;
        productVarCosts.forEach(pvc => {
          const vc = variableCosts.find(v => v.id === pvc.variable_cost_id);
          const ht = Number(pvc.quantite) * Number(vc?.cout_unitaire || 0);
          const tvaTaux = vc?.tva_taux ?? defaultTvaAchat;
          variables_ht += ht;
          tva_variables += isFranchise ? 0 : ht * (tvaTaux / 100);
        });

        return { matieres_ht, emballages_ht, variables_ht, tva_matieres, tva_emballages, tva_variables };
      };

      // 6. Initialize monthly data structures
      // We need 24 months to handle year-end delays (current year + next year spillover)
      const encaissementsByMonth: Array<{
        btc_ht: number;
        btb_ht: number;
        distributeur_ht: number;
        btc_tva: number;
        btb_tva: number;
        distributeur_tva: number;
      }> = Array(24).fill(null).map(() => ({
        btc_ht: 0, btb_ht: 0, distributeur_ht: 0,
        btc_tva: 0, btb_tva: 0, distributeur_tva: 0,
      }));

      const caByMonth: number[] = Array(12).fill(0);
      const costsByMonth: Array<{
        achats_matieres_ht: number;
        achats_emballages_ht: number;
        couts_variables_ht: number;
        tva_deductible_matieres: number;
        tva_deductible_emballages: number;
        tva_deductible_variables: number;
      }> = Array(12).fill(null).map(() => ({
        achats_matieres_ht: 0, achats_emballages_ht: 0, couts_variables_ht: 0,
        tva_deductible_matieres: 0, tva_deductible_emballages: 0, tva_deductible_variables: 0,
      }));

      // Process sales by month
      const processSale = (
        saleMonthIndex: number,
        productId: string, 
        qty: number, 
        prixOverride: number | null, 
        categorie: string
      ) => {
        const prix = prixOverride ? Number(prixOverride) : getPrice(productId, categorie);
        const ca_ht = qty * prix;
        const tvaTaux = getProductTvaRate(productId);
        const tva = isFranchise ? 0 : ca_ht * (tvaTaux / 100);

        // CA is recognized at sale date
        caByMonth[saleMonthIndex] += ca_ht;

        // Encaissements are received after delay
        const delay = getDelayForChannel(categorie);
        const targetMonthIndex = getTargetMonthIndex(saleMonthIndex, delay);
        
        // Only count if within our 24-month window
        if (targetMonthIndex < 24) {
          if (categorie === 'BTC') {
            encaissementsByMonth[targetMonthIndex].btc_ht += ca_ht;
            encaissementsByMonth[targetMonthIndex].btc_tva += tva;
          } else if (categorie === 'BTB') {
            encaissementsByMonth[targetMonthIndex].btb_ht += ca_ht;
            encaissementsByMonth[targetMonthIndex].btb_tva += tva;
          } else {
            encaissementsByMonth[targetMonthIndex].distributeur_ht += ca_ht;
            encaissementsByMonth[targetMonthIndex].distributeur_tva += tva;
          }
        }

        // Production costs are incurred at sale date (we produce when we sell)
        const costs = getProductCosts(productId);
        costsByMonth[saleMonthIndex].achats_matieres_ht += qty * costs.matieres_ht;
        costsByMonth[saleMonthIndex].achats_emballages_ht += qty * costs.emballages_ht;
        costsByMonth[saleMonthIndex].couts_variables_ht += qty * costs.variables_ht;
        costsByMonth[saleMonthIndex].tva_deductible_matieres += qty * costs.tva_matieres;
        costsByMonth[saleMonthIndex].tva_deductible_emballages += qty * costs.tva_emballages;
        costsByMonth[saleMonthIndex].tva_deductible_variables += qty * costs.tva_variables;
      };

      // Process all sales
      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
        const coef = Number(coefficients[i]) / 100;

        if (mode === 'reel') {
          // For real mode: use monthly_sales_reel if available
          const monthReel = monthlySalesReel.filter(s => s.month === monthStr);
          
          if (monthReel.length > 0) {
            monthReel.forEach(sale => {
              const qty = Number(sale.quantite) || 0;
              processSale(i, sale.product_id, qty, sale.prix_ht_override, sale.categorie_prix);
            });
          } else {
            // Fallback to annual_sales with seasonality
            (annualSales || []).forEach(sale => {
              const annualQty = Number(sale.quantite_annuelle) || 0;
              const monthQty = Math.round(annualQty * coef);
              processSale(i, sale.product_id, monthQty, sale.prix_ht_override, sale.categorie_prix);
            });
          }
        } else {
          // Budget mode: always use annual_sales with seasonality
          (annualSales || []).forEach(sale => {
            const annualQty = Number(sale.quantite_annuelle) || 0;
            const monthQty = Math.round(annualQty * coef);
            processSale(i, sale.product_id, monthQty, sale.prix_ht_override, sale.categorie_prix);
          });
        }
      }

      // 7. Calculate monthly data with cumulative
      const monthlyData: MonthlyCashFlowData[] = [];
      let cumul = 0;

      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
        const monthKey = `${year}-${(i + 1).toString().padStart(2, '0')}`;

        // Encaissements for this month (includes delayed payments)
        const enc = encaissementsByMonth[i];
        const encaissements_btc = enc.btc_ht;
        const encaissements_btb = enc.btb_ht;
        const encaissements_distributeur = enc.distributeur_ht;
        const encaissements_ht = encaissements_btc + encaissements_btb + encaissements_distributeur;
        const tva_collectee = enc.btc_tva + enc.btb_tva + enc.distributeur_tva;

        // CA recognized this period (for reference)
        const ca_ht_periode = caByMonth[i];

        // Production costs for this month
        const costs = costsByMonth[i];
        const achats_matieres_ht = costs.achats_matieres_ht;
        const achats_emballages_ht = costs.achats_emballages_ht;
        const couts_variables_ht = costs.couts_variables_ht;
        const tva_deductible_matieres = costs.tva_deductible_matieres;
        const tva_deductible_emballages = costs.tva_deductible_emballages;
        const tva_deductible_variables = costs.tva_deductible_variables;

        // Professional expenses for this month with TVA
        const monthExpenses = (expenses || []).filter(e => e.mois.startsWith(monthKey));
        let frais_professionnels_ht = 0;
        let tva_deductible_frais = 0;
        monthExpenses.forEach(e => {
          const ht = Number(e.montant_ht);
          const tvaTaux = e.tva_taux ?? defaultTvaAchat;
          frais_professionnels_ht += ht;
          tva_deductible_frais += isFranchise ? 0 : ht * (tvaTaux / 100);
        });

        // Calculate totals
        const decaissements_production_ht = achats_matieres_ht + achats_emballages_ht + couts_variables_ht;
        const tva_deductible = tva_deductible_matieres + tva_deductible_emballages + tva_deductible_variables + tva_deductible_frais;
        
        // TVA
        const encaissements_ttc = encaissements_ht + tva_collectee;
        const decaissements_production_ttc = decaissements_production_ht + (tva_deductible_matieres + tva_deductible_emballages + tva_deductible_variables);
        const frais_professionnels_ttc = frais_professionnels_ht + tva_deductible_frais;
        const tva_nette = tva_collectee - tva_deductible;

        // Soldes économiques (HT) - based on encaissements (cash), not CA
        const solde_production = encaissements_ht - decaissements_production_ht;
        const solde_apres_frais = solde_production - frais_professionnels_ht;

        // Variation trésorerie (TTC - inclut la TVA)
        const variation_tresorerie = encaissements_ttc - decaissements_production_ttc - frais_professionnels_ttc - tva_nette;

        cumul += variation_tresorerie;

        monthlyData.push({
          month: monthStr,
          monthLabel: MONTH_LABELS[i],
          ca_ht_periode,
          encaissements_btc,
          encaissements_btb,
          encaissements_distributeur,
          encaissements_ht,
          tva_collectee,
          encaissements_ttc,
          achats_matieres_ht,
          achats_emballages_ht,
          couts_variables_ht,
          decaissements_production_ht,
          tva_deductible_matieres,
          tva_deductible_emballages,
          tva_deductible_variables,
          tva_deductible_frais,
          tva_deductible,
          decaissements_production_ttc,
          frais_professionnels_ht,
          frais_professionnels_ttc,
          tva_nette,
          solde_production,
          solde_apres_frais,
          variation_tresorerie,
          cumul,
        });
      }

      return monthlyData;
    },
    enabled: !!currentProject?.id,
  });

  // Calculate summary from data
  const summary = {
    total_ca_ht: data?.reduce((sum, m) => sum + m.ca_ht_periode, 0) || 0,
    total_encaissements_ht: data?.reduce((sum, m) => sum + m.encaissements_ht, 0) || 0,
    total_encaissements_btc: data?.reduce((sum, m) => sum + m.encaissements_btc, 0) || 0,
    total_encaissements_btb: data?.reduce((sum, m) => sum + m.encaissements_btb, 0) || 0,
    total_encaissements_distributeur: data?.reduce((sum, m) => sum + m.encaissements_distributeur, 0) || 0,
    total_tva_collectee: data?.reduce((sum, m) => sum + m.tva_collectee, 0) || 0,
    total_encaissements_ttc: data?.reduce((sum, m) => sum + m.encaissements_ttc, 0) || 0,
    total_decaissements_production_ht: data?.reduce((sum, m) => sum + m.decaissements_production_ht, 0) || 0,
    total_tva_deductible: data?.reduce((sum, m) => sum + m.tva_deductible, 0) || 0,
    total_frais_professionnels_ht: data?.reduce((sum, m) => sum + m.frais_professionnels_ht, 0) || 0,
    total_tva_nette: data?.reduce((sum, m) => sum + m.tva_nette, 0) || 0,
    total_variation_tresorerie: data?.reduce((sum, m) => sum + m.variation_tresorerie, 0) || 0,
    solde_final: data?.[data.length - 1]?.cumul || 0,
    has_negative: data?.some(m => m.cumul < 0) || false,
    first_negative_month: data?.find(m => m.cumul < 0)?.monthLabel || null,
  };

  // Get current month data
  const currentMonthIndex = new Date().getMonth();
  const currentMonthData = data?.[currentMonthIndex] || {
    ca_ht_periode: 0,
    encaissements_btc: 0,
    encaissements_btb: 0,
    encaissements_distributeur: 0,
    encaissements_ht: 0,
    tva_collectee: 0,
    encaissements_ttc: 0,
    decaissements_production_ht: 0,
    tva_deductible: 0,
    frais_professionnels_ht: 0,
    tva_nette: 0,
    solde_production: 0,
    solde_apres_frais: 0,
    variation_tresorerie: 0,
    cumul: 0,
  };

  // Check if franchise regime
  const isFranchise = settings?.regime_tva === 'franchise_taxe';

  // Payment delays info
  const paymentDelays = {
    btc: (settings as any)?.delai_paiement_btc ?? 0,
    btb: (settings as any)?.delai_paiement_btb ?? 30,
    distributeur: (settings as any)?.delai_paiement_distributeur ?? 30,
  };

  return {
    monthlyData: data || [],
    summary,
    currentMonthData,
    isLoading,
    error,
    isFranchise,
    paymentDelays,
  };
}
