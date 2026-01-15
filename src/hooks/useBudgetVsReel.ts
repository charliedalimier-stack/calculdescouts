import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';

// Default seasonality coefficients (equal distribution)
const DEFAULT_COEFFICIENTS = [8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.37];

export interface BudgetVsReelIndicator {
  indicator: string;
  budget: number;
  reel: number;
  ecart: number;
  ecartPercent: number | null;
}

export interface BudgetVsReelData {
  indicators: BudgetVsReelIndicator[];
  par_produit: {
    product_id: string;
    product_name: string;
    budget_qty: number;
    reel_qty: number;
    budget_ca: number;
    reel_ca: number;
    ecart_qty: number;
    ecart_ca: number;
    ecart_percent: number | null;
  }[];
  par_categorie: {
    category_id: string;
    category_name: string;
    budget_ca: number;
    reel_ca: number;
    ecart: number;
    ecart_percent: number | null;
  }[];
  monthly_comparison: {
    mois: string;
    budget_ca: number;
    reel_ca: number;
    budget_marge: number;
    reel_marge: number;
  }[];
}

interface UseBudgetVsReelParams {
  periodType: 'month' | 'year';
  year: number;
  month?: number;
}

export function useBudgetVsReel({ periodType, year, month }: UseBudgetVsReelParams) {
  const { currentProject } = useProject();

  return useQuery({
    queryKey: ['budget-vs-reel', currentProject?.id, periodType, year, month],
    queryFn: async (): Promise<BudgetVsReelData> => {
      if (!currentProject?.id) {
        return getEmptyData();
      }

      const projectId = currentProject.id;
      
      // Build date range
      let startDate: string;
      let endDate: string;
      
      if (periodType === 'month' && month) {
        const monthStr = month.toString().padStart(2, '0');
        startDate = `${year}-${monthStr}-01`;
        endDate = `${year}-${monthStr}-31`;
      } else {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      }

      // Fetch products with categories
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categorie_id, categories(id, nom_categorie)')
        .eq('project_id', projectId);

      if (!products || products.length === 0) {
        return getEmptyData();
      }

      // Fetch project settings
      const { data: settings } = await supabase
        .from('project_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const tvaVente = settings?.tva_vente || 5.5;
      const tvaAchat = settings?.tva_achat || 20;

      // Fetch annual sales for budget and reel modes
      const { data: budgetAnnualSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', 'budget')
        .eq('year', year);

      const { data: reelAnnualSales } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', 'reel')
        .eq('year', year);

      // Fetch seasonality coefficients
      const { data: budgetSeasonality } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', 'budget')
        .eq('year', year)
        .maybeSingle();

      const { data: reelSeasonality } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', 'reel')
        .eq('year', year)
        .maybeSingle();

      // Helper to get coefficient for a month
      const getCoef = (seasonality: typeof budgetSeasonality, monthIndex: number): number => {
        if (!seasonality) return DEFAULT_COEFFICIENTS[monthIndex] / 100;
        const key = `month_${(monthIndex + 1).toString().padStart(2, '0')}` as keyof typeof seasonality;
        return (Number(seasonality[key]) || DEFAULT_COEFFICIENTS[monthIndex]) / 100;
      };

      // Convert annual sales to monthly entries for comparison
      interface SaleEntry {
        product_id: string;
        categorie_prix: string;
        quantity: number;
        mois: string;
      }

      const convertAnnualToMonthly = (
        annualSales: typeof budgetAnnualSales,
        seasonality: typeof budgetSeasonality
      ): SaleEntry[] => {
        const entries: SaleEntry[] = [];
        (annualSales || []).forEach(annual => {
          if (periodType === 'month' && month) {
            const coef = getCoef(seasonality, month - 1);
            const qty = Math.round(annual.quantite_annuelle * coef);
            if (qty > 0) {
              entries.push({
                product_id: annual.product_id,
                categorie_prix: annual.categorie_prix,
                quantity: qty,
                mois: startDate,
              });
            }
          } else {
            for (let m = 0; m < 12; m++) {
              const coef = getCoef(seasonality, m);
              const qty = Math.round(annual.quantite_annuelle * coef);
              if (qty > 0) {
                const monthStr = `${year}-${(m + 1).toString().padStart(2, '0')}-01`;
                entries.push({
                  product_id: annual.product_id,
                  categorie_prix: annual.categorie_prix,
                  quantity: qty,
                  mois: monthStr,
                });
              }
            }
          }
        });
        return entries;
      };

      let budgetSales = convertAnnualToMonthly(budgetAnnualSales, budgetSeasonality);
      let reelSales = convertAnnualToMonthly(reelAnnualSales, reelSeasonality);

      // Fallback to old system if no annual sales data
      if (budgetSales.length === 0) {
        const { data: oldBudgetSales } = await supabase
          .from('sales_targets')
          .select('*, categorie_prix')
          .eq('project_id', projectId)
          .eq('mode', 'simulation')
          .gte('mois', startDate)
          .lte('mois', endDate);

        (oldBudgetSales || []).forEach(s => {
          budgetSales.push({
            product_id: s.product_id,
            categorie_prix: s.categorie_prix || 'BTC',
            quantity: Number(s.quantite_objectif || 0),
            mois: s.mois,
          });
        });
      }

      if (reelSales.length === 0) {
        const { data: oldReelSales } = await supabase
          .from('sales_actuals')
          .select('*, categorie_prix')
          .eq('project_id', projectId)
          .eq('mode', 'reel')
          .gte('mois', startDate)
          .lte('mois', endDate);

        (oldReelSales || []).forEach(s => {
          reelSales.push({
            product_id: s.product_id,
            categorie_prix: s.categorie_prix || 'BTC',
            quantity: Number(s.quantite_reelle || 0),
            mois: s.mois,
          });
        });
      }

      // Fetch product prices for both modes
      const { data: budgetPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', products.map(p => p.id))
        .eq('mode', 'budget');

      const { data: reelPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', products.map(p => p.id))
        .eq('mode', 'reel');

      // Fetch professional expenses for both modes
      const { data: budgetExpenses } = await supabase
        .from('professional_expenses')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', 'budget')
        .gte('mois', startDate)
        .lte('mois', endDate);

      const { data: reelExpenses } = await supabase
        .from('professional_expenses')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', 'reel')
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch recipes for cost calculation
      const { data: recipes } = await supabase
        .from('recipes')
        .select('product_id, quantite_utilisee, ingredients(cout_unitaire, tva_taux), mode');

      const { data: packaging } = await supabase
        .from('product_packaging')
        .select('product_id, quantite, packaging(cout_unitaire, tva_taux), mode');

      const { data: variableCosts } = await supabase
        .from('product_variable_costs')
        .select('product_id, quantite, variable_costs(cout_unitaire, tva_taux), mode');

      // Calculate product costs for each mode
      const calculateProductCosts = (mode: string) => {
        const costs: { [productId: string]: { cost: number; tvaDed: number } } = {};
        
        products.forEach(product => {
          let totalCost = 0;
          let totalTvaDed = 0;

          // Ingredients
          const productRecipes = (recipes || []).filter(r => r.product_id === product.id && r.mode === mode);
          productRecipes.forEach(r => {
            const ing = r.ingredients as any;
            const cost = Number(r.quantite_utilisee) * Number(ing?.cout_unitaire || 0);
            const tvaTaux = Number(ing?.tva_taux || tvaAchat);
            totalCost += cost;
            totalTvaDed += cost * (tvaTaux / 100);
          });

          // Packaging
          const productPkg = (packaging || []).filter(p => p.product_id === product.id && p.mode === mode);
          productPkg.forEach(p => {
            const pkg = p.packaging as any;
            const cost = Number(p.quantite) * Number(pkg?.cout_unitaire || 0);
            const tvaTaux = Number(pkg?.tva_taux || tvaAchat);
            totalCost += cost;
            totalTvaDed += cost * (tvaTaux / 100);
          });

          // Variable costs
          const productVarCosts = (variableCosts || []).filter(v => v.product_id === product.id && v.mode === mode);
          productVarCosts.forEach(v => {
            const vc = v.variable_costs as any;
            const cost = Number(v.quantite) * Number(vc?.cout_unitaire || 0);
            const tvaTaux = Number(vc?.tva_taux || tvaAchat);
            totalCost += cost;
            totalTvaDed += cost * (tvaTaux / 100);
          });

          costs[product.id] = { cost: totalCost, tvaDed: totalTvaDed };
        });

        return costs;
      };

      const budgetCosts = calculateProductCosts('budget');
      const reelCosts = calculateProductCosts('reel');

      // Build price lookup
      const buildPriceMap = (prices: any[]) => {
        const map: { [key: string]: number } = {};
        (prices || []).forEach(pp => {
          const key = `${pp.product_id}-${pp.categorie_prix}`;
          map[key] = Number(pp.prix_ht);
        });
        return map;
      };

      const budgetPriceMap = buildPriceMap(budgetPrices || []);
      const reelPriceMap = buildPriceMap(reelPrices || []);

      // Aggregate data - updated to work with SaleEntry format
      const aggregateData = (
        sales: SaleEntry[],
        priceMap: { [key: string]: number },
        costs: { [productId: string]: { cost: number; tvaDed: number } }
      ) => {
        let totalCaHt = 0;
        let totalCoutProduction = 0;
        let totalTvaCollectee = 0;
        let totalTvaDeductible = 0;
        let totalQuantite = 0;
        
        const byProduct: { [id: string]: { qty: number; ca: number; marge: number } } = {};
        const byCategory: { [id: string]: { name: string; ca: number; marge: number } } = {};
        const byMonth: { [m: string]: { ca: number; marge: number } } = {};

        sales.forEach(sale => {
          const product = products.find(p => p.id === sale.product_id);
          if (!product) return;

          const qty = sale.quantity;
          if (qty === 0) return;

          const categoriePrix = sale.categorie_prix || 'BTC';
          const priceKey = `${product.id}-${categoriePrix}`;
          const prixHt = priceMap[priceKey] || Number(product.prix_btc);
          
          const tvaTaux = Number(product.tva_taux || tvaVente);
          const caHt = qty * prixHt;
          const tvaCollectee = caHt * (tvaTaux / 100);
          
          const productCost = costs[product.id] || { cost: 0, tvaDed: 0 };
          const coutTotal = qty * productCost.cost;
          const tvaDeductible = qty * productCost.tvaDed;
          const marge = caHt - coutTotal;

          totalCaHt += caHt;
          totalCoutProduction += coutTotal;
          totalTvaCollectee += tvaCollectee;
          totalTvaDeductible += tvaDeductible;
          totalQuantite += qty;

          // By product
          if (!byProduct[product.id]) {
            byProduct[product.id] = { qty: 0, ca: 0, marge: 0 };
          }
          byProduct[product.id].qty += qty;
          byProduct[product.id].ca += caHt;
          byProduct[product.id].marge += marge;

          // By category
          const catId = product.categorie_id || 'sans-categorie';
          const catName = (product.categories as any)?.nom_categorie || 'Sans catégorie';
          if (!byCategory[catId]) {
            byCategory[catId] = { name: catName, ca: 0, marge: 0 };
          }
          byCategory[catId].ca += caHt;
          byCategory[catId].marge += marge;

          // By month
          const mois = sale.mois?.slice(0, 7) || '';
          if (!byMonth[mois]) {
            byMonth[mois] = { ca: 0, marge: 0 };
          }
          byMonth[mois].ca += caHt;
          byMonth[mois].marge += marge;
        });

        return {
          totalCaHt,
          totalCoutProduction,
          totalTvaCollectee,
          totalTvaDeductible,
          totalQuantite,
          margeBrute: totalCaHt - totalCoutProduction,
          cashFlow: totalCaHt + totalTvaCollectee - totalCoutProduction - totalTvaDeductible,
          byProduct,
          byCategory,
          byMonth,
        };
      };

      const budget = aggregateData(budgetSales, budgetPriceMap, budgetCosts);
      const reel = aggregateData(reelSales, reelPriceMap, reelCosts);

      // Calculate expenses
      const budgetFrais = (budgetExpenses || []).reduce((sum, e) => sum + Number(e.montant_ht), 0);
      const reelFrais = (reelExpenses || []).reduce((sum, e) => sum + Number(e.montant_ht), 0);

      // Calculate indicators
      const calculateEcart = (budget: number, reel: number): { ecart: number; percent: number | null } => {
        const ecart = reel - budget;
        const percent = budget !== 0 ? (ecart / budget) * 100 : null;
        return { ecart, percent };
      };

      const indicators: BudgetVsReelIndicator[] = [
        {
          indicator: 'CA HT',
          budget: budget.totalCaHt,
          reel: reel.totalCaHt,
          ...(() => {
            const e = calculateEcart(budget.totalCaHt, reel.totalCaHt);
            return { ecart: e.ecart, ecartPercent: e.percent };
          })(),
        },
        {
          indicator: 'Coût de production',
          budget: budget.totalCoutProduction,
          reel: reel.totalCoutProduction,
          ...(() => {
            const e = calculateEcart(budget.totalCoutProduction, reel.totalCoutProduction);
            return { ecart: e.ecart, ecartPercent: e.percent };
          })(),
        },
        {
          indicator: 'Marge brute',
          budget: budget.margeBrute,
          reel: reel.margeBrute,
          ...(() => {
            const e = calculateEcart(budget.margeBrute, reel.margeBrute);
            return { ecart: e.ecart, ecartPercent: e.percent };
          })(),
        },
        {
          indicator: 'Frais professionnels',
          budget: budgetFrais,
          reel: reelFrais,
          ...(() => {
            const e = calculateEcart(budgetFrais, reelFrais);
            return { ecart: e.ecart, ecartPercent: e.percent };
          })(),
        },
        {
          indicator: 'Résultat net',
          budget: budget.margeBrute - budgetFrais,
          reel: reel.margeBrute - reelFrais,
          ...(() => {
            const e = calculateEcart(budget.margeBrute - budgetFrais, reel.margeBrute - reelFrais);
            return { ecart: e.ecart, ecartPercent: e.percent };
          })(),
        },
        {
          indicator: 'Cash-flow',
          budget: budget.cashFlow - budgetFrais,
          reel: reel.cashFlow - reelFrais,
          ...(() => {
            const e = calculateEcart(budget.cashFlow - budgetFrais, reel.cashFlow - reelFrais);
            return { ecart: e.ecart, ecartPercent: e.percent };
          })(),
        },
      ];

      // Par produit
      const allProductIds = new Set([
        ...Object.keys(budget.byProduct),
        ...Object.keys(reel.byProduct),
      ]);

      const parProduit = Array.from(allProductIds).map(productId => {
        const product = products.find(p => p.id === productId);
        const budgetData = budget.byProduct[productId] || { qty: 0, ca: 0 };
        const reelData = reel.byProduct[productId] || { qty: 0, ca: 0 };
        const ecartCa = calculateEcart(budgetData.ca, reelData.ca);

        return {
          product_id: productId,
          product_name: product?.nom_produit || 'Inconnu',
          budget_qty: budgetData.qty,
          reel_qty: reelData.qty,
          budget_ca: budgetData.ca,
          reel_ca: reelData.ca,
          ecart_qty: reelData.qty - budgetData.qty,
          ecart_ca: ecartCa.ecart,
          ecart_percent: ecartCa.percent,
        };
      }).sort((a, b) => Math.abs(b.ecart_ca) - Math.abs(a.ecart_ca));

      // Par catégorie
      const allCategoryIds = new Set([
        ...Object.keys(budget.byCategory),
        ...Object.keys(reel.byCategory),
      ]);

      const parCategorie = Array.from(allCategoryIds).map(catId => {
        const budgetData = budget.byCategory[catId] || { name: 'Sans catégorie', ca: 0 };
        const reelData = reel.byCategory[catId] || { name: budgetData.name, ca: 0 };
        const ecartCa = calculateEcart(budgetData.ca, reelData.ca);

        return {
          category_id: catId,
          category_name: budgetData.name,
          budget_ca: budgetData.ca,
          reel_ca: reelData.ca,
          ecart: ecartCa.ecart,
          ecart_percent: ecartCa.percent,
        };
      }).sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));

      // Monthly comparison
      const allMonths = new Set([
        ...Object.keys(budget.byMonth),
        ...Object.keys(reel.byMonth),
      ]);

      const monthlyComparison = Array.from(allMonths).map(mois => {
        const budgetData = budget.byMonth[mois] || { ca: 0, marge: 0 };
        const reelData = reel.byMonth[mois] || { ca: 0, marge: 0 };

        return {
          mois,
          budget_ca: budgetData.ca,
          reel_ca: reelData.ca,
          budget_marge: budgetData.marge,
          reel_marge: reelData.marge,
        };
      }).sort((a, b) => a.mois.localeCompare(b.mois));

      return {
        indicators,
        par_produit: parProduit,
        par_categorie: parCategorie,
        monthly_comparison: monthlyComparison,
      };
    },
    enabled: !!currentProject?.id,
  });
}

function getEmptyData(): BudgetVsReelData {
  return {
    indicators: [],
    par_produit: [],
    par_categorie: [],
    monthly_comparison: [],
  };
}
