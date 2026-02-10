import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';


export interface GlobalSynthesis {
  // Key figures
  ca_ht: number;
  ca_ttc: number;
  cout_production: number;
  marge_brute: number;
  taux_marge: number;
  tva_collectee: number;
  tva_deductible: number;
  resultat_avant_charges: number;
  cash_flow: number;
  
  // Professional expenses
  frais_professionnels: number;
  frais_tva_deductible: number;
  resultat_net: number;
  cash_flow_apres_frais: number;
  
  // By channel
  par_canal: {
    canal: string;
    ca_ht: number;
    marge: number;
    percent_ca: number;
  }[];
  
  // By category
  par_categorie: {
    category_id: string;
    category_name: string;
    ca: number;
    marge: number;
    rentabilite: number;
  }[];
  
  // Volumes
  quantite_vendue: number;
  cout_moyen_unitaire: number;
  nb_produits_actifs: number;
  
  // Previous period comparison
  previous: {
    ca_ht: number;
    marge_brute: number;
    cash_flow: number;
  } | null;
  
  // Monthly breakdown for charts
  monthly_data: {
    mois: string;
    ca_ht: number;
    marge: number;
    frais: number;
    resultat_net: number;
  }[];
  
  // Alerts
  alerts: {
    frais_vs_ca: number; // % of frais / CA
    resultat_negatif: boolean;
    cash_flow_negatif: boolean;
  };
}

interface UseGlobalSynthesisParams {
  periodType: 'month' | 'year';
  year: number;
  month?: number;
  mode?: 'budget' | 'reel';
}

/**
 * Hook to fetch global financial synthesis.
 * 
 * @param periodType - 'month' or 'year'
 * @param year - The year to analyze
 * @param month - Optional month (1-12) for monthly analysis
 * @param mode - Optional mode ('budget' | 'reel'). Defaults to 'budget'.
 */
export function useGlobalSynthesis({ periodType, year, month, mode = 'budget' }: UseGlobalSynthesisParams) {
  const { currentProject } = useProject();


  return useQuery({
    queryKey: ['global-synthesis', currentProject?.id, mode, periodType, year, month],
    queryFn: async (): Promise<GlobalSynthesis> => {
      if (!currentProject?.id) {
        return getEmptySynthesis();
      }

      const projectId = currentProject.id;
      
      
      // Build date range based on period type
      let startDate: string;
      let endDate: string;
      let prevStartDate: string;
      let prevEndDate: string;
      
      if (periodType === 'month' && month) {
        const monthStr = month.toString().padStart(2, '0');
        startDate = `${year}-${monthStr}-01`;
        endDate = `${year}-${monthStr}-31`;
        
        // Previous month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthStr = prevMonth.toString().padStart(2, '0');
        prevStartDate = `${prevYear}-${prevMonthStr}-01`;
        prevEndDate = `${prevYear}-${prevMonthStr}-31`;
      } else {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        prevStartDate = `${year - 1}-01-01`;
        prevEndDate = `${year - 1}-12-31`;
      }

      // Fetch products with categories
      // Products are always stored in 'budget' mode (canonical catalog)
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categorie_id, categories(id, nom_categorie)')
        .eq('project_id', projectId)
        .eq('mode', 'budget');

      if (!products || products.length === 0) {
        // Even with no products, we might have expenses
        const { data: expensesData } = await supabase
          .from('professional_expenses')
          .select('*')
          .eq('project_id', projectId)
          .eq('mode', mode)
          .gte('mois', startDate)
          .lte('mois', endDate);

        const fraisPro = (expensesData || []).reduce((sum, e) => sum + Number(e.montant_ht), 0);
        const fraisTva = (expensesData || []).reduce((sum, e) => sum + (Number(e.montant_ttc) - Number(e.montant_ht)), 0);

        return {
          ...getEmptySynthesis(),
          frais_professionnels: fraisPro,
          frais_tva_deductible: fraisTva,
          resultat_net: -fraisPro,
          cash_flow_apres_frais: -fraisPro - fraisTva,
          alerts: {
            frais_vs_ca: 0,
            resultat_negatif: fraisPro > 0,
            cash_flow_negatif: fraisPro > 0,
          },
        };
      }

      // Fetch project settings for TVA rates
      const { data: settings } = await supabase
        .from('project_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const tvaVente = settings?.tva_vente || 5.5;
      const tvaAchat = settings?.tva_achat || 20;

      // Fetch sales data - STRICT mode separation
      interface SaleEntry {
        product_id: string;
        categorie_prix: string;
        quantity: number;
        mois: string;
      }
      
      const sales: SaleEntry[] = [];
      
      if (mode === 'reel') {
        // REEL mode: fetch directly from monthly_sales_reel
        const { data: reelSales } = await supabase
          .from('monthly_sales_reel')
          .select('product_id, categorie_prix, quantite, month, year')
          .eq('project_id', projectId)
          .eq('year', year);

        if (reelSales && reelSales.length > 0) {
          reelSales.forEach(s => {
            const sMonth = new Date(s.month).getMonth() + 1;
            // Filter by period
            if (periodType === 'month' && month && sMonth !== month) return;
            
            const qty = Number(s.quantite || 0);
            if (qty > 0) {
              sales.push({
                product_id: s.product_id,
                categorie_prix: s.categorie_prix || 'BTC',
                quantity: qty,
                mois: s.month,
              });
            }
          });
        }

        console.log("[Dashboard]", {
          mode,
          year,
          totalSales: sales.reduce((s, e) => s + e.quantity, 0),
          sourceCount: sales.length,
          source: 'monthly_sales_reel',
        });
      } else {
        // BUDGET mode: fetch from annual_sales + apply seasonality
        const { data: annualSales } = await supabase
          .from('annual_sales')
          .select('*, products(nom_produit, prix_btc)')
          .eq('project_id', projectId)
          .eq('mode', 'budget')
          .eq('year', year);

        // Fetch seasonality coefficients for monthly distribution
        const { data: seasonality } = await supabase
          .from('seasonality_coefficients')
          .select('*')
          .eq('project_id', projectId)
          .eq('mode', 'budget')
          .eq('year', year)
          .maybeSingle();

        const getMonthCoef = (monthIndex: number): number => {
          if (!seasonality) return 8.33 / 100;
          const key = `month_${(monthIndex + 1).toString().padStart(2, '0')}` as keyof typeof seasonality;
          return (Number(seasonality[key]) || 8.33) / 100;
        };

        if (annualSales && annualSales.length > 0) {
          annualSales.forEach(annual => {
            if (periodType === 'month' && month) {
              const coef = getMonthCoef(month - 1);
              const qty = Math.round(annual.quantite_annuelle * coef);
              if (qty > 0) {
                sales.push({
                  product_id: annual.product_id,
                  categorie_prix: annual.categorie_prix,
                  quantity: qty,
                  mois: startDate,
                });
              }
            } else {
              for (let m = 0; m < 12; m++) {
                const coef = getMonthCoef(m);
                const qty = Math.round(annual.quantite_annuelle * coef);
                if (qty > 0) {
                  const monthStr = `${year}-${(m + 1).toString().padStart(2, '0')}-01`;
                  sales.push({
                    product_id: annual.product_id,
                    categorie_prix: annual.categorie_prix,
                    quantity: qty,
                    mois: monthStr,
                  });
                }
              }
            }
          });
        }

        console.log("[Dashboard]", {
          mode,
          year,
          totalSales: sales.reduce((s, e) => s + e.quantity, 0),
          sourceCount: sales.length,
          source: 'annual_sales',
        });
      }

      // Fetch product prices by category (always from budget - canonical prices)
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', products.map(p => p.id))
        .eq('mode', 'budget');

      // Fetch previous period sales for comparison (same mode-specific logic)
      const prevYear = periodType === 'year' ? year - 1 : (month === 1 ? year - 1 : year);
      const prevSales: SaleEntry[] = [];

      if (mode === 'reel') {
        // Previous reel from monthly_sales_reel
        const { data: prevReelSales } = await supabase
          .from('monthly_sales_reel')
          .select('product_id, categorie_prix, quantite, month, year')
          .eq('project_id', projectId)
          .eq('year', prevYear);

        (prevReelSales || []).forEach(s => {
          const sMonth = new Date(s.month).getMonth() + 1;
          if (periodType === 'month') {
            const prevMonth = month === 1 ? 12 : (month || 1) - 1;
            if (sMonth !== prevMonth) return;
          }
          const qty = Number(s.quantite || 0);
          if (qty > 0) {
            prevSales.push({
              product_id: s.product_id,
              categorie_prix: s.categorie_prix || 'BTC',
              quantity: qty,
              mois: s.month,
            });
          }
        });
      } else {
        // Previous budget from annual_sales + seasonality
        const { data: prevAnnualSales } = await supabase
          .from('annual_sales')
          .select('*, products(nom_produit, prix_btc)')
          .eq('project_id', projectId)
          .eq('mode', 'budget')
          .eq('year', prevYear);

        const { data: prevSeasonality } = await supabase
          .from('seasonality_coefficients')
          .select('*')
          .eq('project_id', projectId)
          .eq('mode', 'budget')
          .eq('year', prevYear)
          .maybeSingle();

        const getPrevMonthCoef = (monthIndex: number): number => {
          if (!prevSeasonality) return 8.33 / 100;
          const key = `month_${(monthIndex + 1).toString().padStart(2, '0')}` as keyof typeof prevSeasonality;
          return (Number(prevSeasonality[key]) || 8.33) / 100;
        };

        if (prevAnnualSales && prevAnnualSales.length > 0) {
          prevAnnualSales.forEach(annual => {
            if (periodType === 'month') {
              const prevMonth = month === 1 ? 12 : (month || 1) - 1;
              const coef = getPrevMonthCoef(prevMonth - 1);
              const qty = Math.round(annual.quantite_annuelle * coef);
              if (qty > 0) {
                prevSales.push({
                  product_id: annual.product_id,
                  categorie_prix: annual.categorie_prix,
                  quantity: qty,
                  mois: prevStartDate,
                });
              }
            } else {
              for (let m = 0; m < 12; m++) {
                const coef = getPrevMonthCoef(m);
                const qty = Math.round(annual.quantite_annuelle * coef);
                if (qty > 0) {
                  const monthStr = `${prevYear}-${(m + 1).toString().padStart(2, '0')}-01`;
                  prevSales.push({
                    product_id: annual.product_id,
                    categorie_prix: annual.categorie_prix,
                    quantity: qty,
                    mois: monthStr,
                  });
                }
              }
            }
          });
        }
      }

      // Fetch professional expenses
      const { data: expensesData } = await supabase
        .from('professional_expenses')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', mode)
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch recipes for cost calculation (always from budget - canonical product data)
      const { data: recipes } = await supabase
        .from('recipes')
        .select('product_id, quantite_utilisee, ingredients(cout_unitaire, tva_taux)')
        .eq('mode', 'budget');

      // Fetch packaging (always from budget)
      const { data: packaging } = await supabase
        .from('product_packaging')
        .select('product_id, quantite, packaging(cout_unitaire, tva_taux)')
        .eq('mode', 'budget');

      // Fetch variable costs (always from budget)
      const { data: variableCosts } = await supabase
        .from('product_variable_costs')
        .select('product_id, quantite, variable_costs(cout_unitaire, tva_taux)')
        .eq('mode', 'budget');

      // Calculate product costs
      const productCosts: { [productId: string]: { cost: number; tvaDed: number } } = {};
      
      products.forEach(product => {
        let totalCost = 0;
        let totalTvaDed = 0;

        // Ingredients
        const productRecipes = (recipes || []).filter(r => r.product_id === product.id);
        productRecipes.forEach(r => {
          const ing = r.ingredients as any;
          const cost = Number(r.quantite_utilisee) * Number(ing?.cout_unitaire || 0);
          const tvaTaux = Number(ing?.tva_taux || tvaAchat);
          totalCost += cost;
          totalTvaDed += cost * (tvaTaux / 100);
        });

        // Packaging
        const productPkg = (packaging || []).filter(p => p.product_id === product.id);
        productPkg.forEach(p => {
          const pkg = p.packaging as any;
          const cost = Number(p.quantite) * Number(pkg?.cout_unitaire || 0);
          const tvaTaux = Number(pkg?.tva_taux || tvaAchat);
          totalCost += cost;
          totalTvaDed += cost * (tvaTaux / 100);
        });

        // Variable costs
        const productVarCosts = (variableCosts || []).filter(v => v.product_id === product.id);
        productVarCosts.forEach(v => {
          const vc = v.variable_costs as any;
          const cost = Number(v.quantite) * Number(vc?.cout_unitaire || 0);
          const tvaTaux = Number(vc?.tva_taux || tvaAchat);
          totalCost += cost;
          totalTvaDed += cost * (tvaTaux / 100);
        });

        productCosts[product.id] = { cost: totalCost, tvaDed: totalTvaDed };
      });

      // Build price lookup by product and category
      const priceMap: { [key: string]: number } = {};
      (productPrices || []).forEach(pp => {
        const key = `${pp.product_id}-${pp.categorie_prix}`;
        priceMap[key] = Number(pp.prix_ht);
      });

      // Aggregate current period data
      let totalCaHt = 0;
      let totalTvaCollectee = 0;
      let totalCoutProduction = 0;
      let totalTvaDeductible = 0;
      let totalQuantite = 0;
      const categoryData: { [catId: string]: { name: string; ca: number; marge: number; cout: number } } = {};
      const canalData: { [canal: string]: { ca: number; marge: number } } = { 
        'BTC': { ca: 0, marge: 0 },
        'BTB': { ca: 0, marge: 0 },
        'Distributeur': { ca: 0, marge: 0 },
      };

      (sales || []).forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) return;

        const qty = sale.quantity;
        if (qty === 0) return;

        // Get price for the sales channel (categorie_prix)
        const categoriePrix = sale.categorie_prix || 'BTC';
        const priceKey = `${product.id}-${categoriePrix}`;
        const prixHt = priceMap[priceKey] || Number(product.prix_btc);
        
        const tvaTaux = Number(product.tva_taux || tvaVente);
        const caHt = qty * prixHt;
        const tvaCollectee = caHt * (tvaTaux / 100);
        
        const costs = productCosts[product.id] || { cost: 0, tvaDed: 0 };
        const coutTotal = qty * costs.cost;
        const tvaDeductible = qty * costs.tvaDed;
        const marge = caHt - coutTotal;

        totalCaHt += caHt;
        totalTvaCollectee += tvaCollectee;
        totalCoutProduction += coutTotal;
        totalTvaDeductible += tvaDeductible;
        totalQuantite += qty;

        // By product category
        const catId = product.categorie_id || 'sans-categorie';
        const catName = (product.categories as any)?.nom_categorie || 'Sans catégorie';
        if (!categoryData[catId]) {
          categoryData[catId] = { name: catName, ca: 0, marge: 0, cout: 0 };
        }
        categoryData[catId].ca += caHt;
        categoryData[catId].marge += marge;
        categoryData[catId].cout += coutTotal;

        // By sales channel (BTC, BTB, Distributeur)
        if (!canalData[categoriePrix]) {
          canalData[categoriePrix] = { ca: 0, marge: 0 };
        }
        canalData[categoriePrix].ca += caHt;
        canalData[categoriePrix].marge += marge;
      });

      // Calculate professional expenses
      const fraisPro = (expensesData || []).reduce((sum, e) => sum + Number(e.montant_ht), 0);
      const fraisTva = (expensesData || []).reduce((sum, e) => sum + (Number(e.montant_ttc) - Number(e.montant_ht)), 0);

      // Calculate expenses by month for chart
      const expensesByMonth: { [m: string]: number } = {};
      (expensesData || []).forEach(e => {
        const mois = e.mois?.slice(0, 7) || '';
        expensesByMonth[mois] = (expensesByMonth[mois] || 0) + Number(e.montant_ht);
      });

      // Previous period data
      let prevCaHt = 0;
      let prevMarge = 0;
      let prevCashFlow = 0;

      (prevSales || []).forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) return;

        const qty = sale.quantity;
        const priceKey = `${product.id}-${sale.categorie_prix}`;
        const prixHt = priceMap[priceKey] || Number(product.prix_btc);
        const caHt = qty * prixHt;
        const costs = productCosts[product.id] || { cost: 0, tvaDed: 0 };
        const coutTotal = qty * costs.cost;
        const tvaCollectee = caHt * (Number(product.tva_taux || tvaVente) / 100);
        const tvaDeductible = qty * costs.tvaDed;

        prevCaHt += caHt;
        prevMarge += caHt - coutTotal;
        prevCashFlow += caHt + tvaCollectee - coutTotal - tvaDeductible;
      });

      // Monthly breakdown
      const monthlyMap: { [m: string]: { ca: number; marge: number; frais: number } } = {};
      
      (sales || []).forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) return;

        const qty = sale.quantity;
        const priceKey = `${product.id}-${sale.categorie_prix}`;
        const prixHt = priceMap[priceKey] || Number(product.prix_btc);
        const caHt = qty * prixHt;
        const costs = productCosts[product.id] || { cost: 0, tvaDed: 0 };
        const marge = caHt - (qty * costs.cost);

        const mois = sale.mois?.slice(0, 7) || '';
        if (!monthlyMap[mois]) {
          monthlyMap[mois] = { ca: 0, marge: 0, frais: 0 };
        }
        monthlyMap[mois].ca += caHt;
        monthlyMap[mois].marge += marge;
      });

      // Add expenses to monthly map
      Object.entries(expensesByMonth).forEach(([mois, frais]) => {
        if (!monthlyMap[mois]) {
          monthlyMap[mois] = { ca: 0, marge: 0, frais: 0 };
        }
        monthlyMap[mois].frais = frais;
      });

      // Calculate results
      const margeBrute = totalCaHt - totalCoutProduction;
      const tauxMarge = totalCaHt > 0 ? (margeBrute / totalCaHt) * 100 : 0;
      const resultatAvantCharges = margeBrute;
      const resultatNet = margeBrute - fraisPro;
      const cashFlow = totalCaHt + totalTvaCollectee - totalCoutProduction - totalTvaDeductible;
      const cashFlowApresFrais = cashFlow - fraisPro - fraisTva;
      const caTtc = totalCaHt + totalTvaCollectee;

      // Format monthly data
      const monthlyData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mois, data]) => ({
          mois,
          ca_ht: data.ca,
          marge: data.marge,
          frais: data.frais,
          resultat_net: data.marge - data.frais,
        }));

      // Format canal data
      const parCanal = Object.entries(canalData)
        .filter(([_, data]) => data.ca > 0)
        .map(([canal, data]) => ({
          canal,
          ca_ht: data.ca,
          marge: data.marge,
          percent_ca: totalCaHt > 0 ? (data.ca / totalCaHt) * 100 : 0,
        }));

      // Format category data
      const parCategorie = Object.entries(categoryData)
        .filter(([_, data]) => data.ca > 0)
        .map(([category_id, data]) => ({
          category_id,
          category_name: data.name,
          ca: data.ca,
          marge: data.marge,
          rentabilite: data.ca > 0 ? (data.marge / data.ca) * 100 : 0,
        }))
        .sort((a, b) => b.ca - a.ca);

      

      return {
        ca_ht: totalCaHt,
        ca_ttc: caTtc,
        cout_production: totalCoutProduction,
        marge_brute: margeBrute,
        taux_marge: tauxMarge,
        tva_collectee: totalTvaCollectee,
        tva_deductible: totalTvaDeductible,
        resultat_avant_charges: resultatAvantCharges,
        cash_flow: cashFlow,
        frais_professionnels: fraisPro,
        frais_tva_deductible: fraisTva,
        resultat_net: resultatNet,
        cash_flow_apres_frais: cashFlowApresFrais,
        par_canal: parCanal,
        par_categorie: parCategorie,
        quantite_vendue: totalQuantite,
        cout_moyen_unitaire: totalQuantite > 0 ? totalCoutProduction / totalQuantite : 0,
        nb_produits_actifs: products.length,
        previous: prevCaHt > 0 || prevMarge > 0 ? {
          ca_ht: prevCaHt,
          marge_brute: prevMarge,
          cash_flow: prevCashFlow,
        } : null,
        monthly_data: monthlyData,
        alerts: {
          frais_vs_ca: totalCaHt > 0 ? (fraisPro / totalCaHt) * 100 : 0,
          resultat_negatif: resultatNet < 0,
          cash_flow_negatif: cashFlowApresFrais < 0,
        },
      };
    },
    enabled: !!currentProject?.id,
  });
}

function getEmptySynthesis(): GlobalSynthesis {
  return {
    ca_ht: 0,
    ca_ttc: 0,
    cout_production: 0,
    marge_brute: 0,
    taux_marge: 0,
    tva_collectee: 0,
    tva_deductible: 0,
    resultat_avant_charges: 0,
    cash_flow: 0,
    frais_professionnels: 0,
    frais_tva_deductible: 0,
    resultat_net: 0,
    cash_flow_apres_frais: 0,
    par_canal: [],
    par_categorie: [],
    quantite_vendue: 0,
    cout_moyen_unitaire: 0,
    nb_produits_actifs: 0,
    previous: null,
    monthly_data: [],
    alerts: {
      frais_vs_ca: 0,
      resultat_negatif: false,
      cash_flow_negatif: false,
    },
  };
}
