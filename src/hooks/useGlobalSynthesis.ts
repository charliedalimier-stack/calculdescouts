import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';

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
  }[];
}

interface UseGlobalSynthesisParams {
  periodType: 'month' | 'year';
  year: number;
  month?: number;
}

export function useGlobalSynthesis({ periodType, year, month }: UseGlobalSynthesisParams) {
  const { currentProject } = useProject();
  const { mode } = useMode();

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
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, tva_taux, categorie_id, categories(id, nom_categorie)')
        .eq('project_id', projectId)
        .eq('mode', mode);

      if (!products || products.length === 0) {
        return getEmptySynthesis();
      }

      // Fetch project settings for TVA rates
      const { data: settings } = await supabase
        .from('project_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const tvaVente = settings?.tva_vente || 5.5;
      const tvaAchat = settings?.tva_achat || 20;

      // Fetch sales data (actuals for réel mode, targets for simulation)
      const salesTable = mode === 'reel' ? 'sales_actuals' : 'sales_targets';
      const qtyField = mode === 'reel' ? 'quantite_reelle' : 'quantite_objectif';
      
      const { data: sales } = await supabase
        .from(salesTable)
        .select('*')
        .eq('project_id', projectId)
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch previous period sales
      const { data: prevSales } = await supabase
        .from(salesTable)
        .select('*')
        .eq('project_id', projectId)
        .gte('mois', prevStartDate)
        .lte('mois', prevEndDate);

      // Fetch recipes for cost calculation
      const { data: recipes } = await supabase
        .from('recipes')
        .select('product_id, quantite_utilisee, ingredients(cout_unitaire, tva_taux)')
        .eq('mode', mode);

      // Fetch packaging
      const { data: packaging } = await supabase
        .from('product_packaging')
        .select('product_id, quantite, packaging(cout_unitaire, tva_taux)')
        .eq('mode', mode);

      // Fetch variable costs
      const { data: variableCosts } = await supabase
        .from('product_variable_costs')
        .select('product_id, quantite, variable_costs(cout_unitaire, tva_taux)')
        .eq('mode', mode);

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

      // Aggregate current period data
      let totalCaHt = 0;
      let totalTvaCollectee = 0;
      let totalCoutProduction = 0;
      let totalTvaDeductible = 0;
      let totalQuantite = 0;
      const categoryData: { [catId: string]: { name: string; ca: number; marge: number; cout: number } } = {};
      const canalData: { [canal: string]: { ca: number; marge: number } } = { 'BTC': { ca: 0, marge: 0 } };

      (sales || []).forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) return;

        const qty = Number((sale as any)[qtyField] || 0);
        if (qty === 0) return;

        const prixHt = Number(product.prix_btc);
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

        // By category
        const catId = product.categorie_id || 'sans-categorie';
        const catName = (product.categories as any)?.nom_categorie || 'Sans catégorie';
        if (!categoryData[catId]) {
          categoryData[catId] = { name: catName, ca: 0, marge: 0, cout: 0 };
        }
        categoryData[catId].ca += caHt;
        categoryData[catId].marge += marge;
        categoryData[catId].cout += coutTotal;

        // By canal (default BTC)
        canalData['BTC'].ca += caHt;
        canalData['BTC'].marge += marge;
      });

      // Previous period data
      let prevCaHt = 0;
      let prevMarge = 0;
      let prevCashFlow = 0;

      (prevSales || []).forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) return;

        const qty = Number((sale as any)[qtyField] || 0);
        const prixHt = Number(product.prix_btc);
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
      const monthlyMap: { [m: string]: { ca: number; marge: number } } = {};
      
      (sales || []).forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (!product) return;

        const qty = Number((sale as any)[qtyField] || 0);
        const prixHt = Number(product.prix_btc);
        const caHt = qty * prixHt;
        const costs = productCosts[product.id] || { cost: 0, tvaDed: 0 };
        const marge = caHt - (qty * costs.cost);

        const mois = (sale as any).mois?.slice(0, 7) || '';
        if (!monthlyMap[mois]) {
          monthlyMap[mois] = { ca: 0, marge: 0 };
        }
        monthlyMap[mois].ca += caHt;
        monthlyMap[mois].marge += marge;
      });

      const monthlyData = Object.entries(monthlyMap)
        .map(([mois, data]) => ({ mois, ca_ht: data.ca, marge: data.marge }))
        .sort((a, b) => a.mois.localeCompare(b.mois));

      // Build result
      const margeBrute = totalCaHt - totalCoutProduction;
      const tauxMarge = totalCaHt > 0 ? (margeBrute / totalCaHt) * 100 : 0;
      const cashFlow = totalCaHt + totalTvaCollectee - totalCoutProduction - totalTvaDeductible;
      const prevCashFlowValue = prevCaHt > 0 ? prevCashFlow : 0;

      const parCategorie = Object.entries(categoryData).map(([id, data]) => ({
        category_id: id,
        category_name: data.name,
        ca: data.ca,
        marge: data.marge,
        rentabilite: data.ca > 0 ? (data.marge / data.ca) * 100 : 0,
      }));

      const parCanal = Object.entries(canalData).map(([canal, data]) => ({
        canal,
        ca_ht: data.ca,
        marge: data.marge,
        percent_ca: totalCaHt > 0 ? (data.ca / totalCaHt) * 100 : 0,
      }));

      const coutMoyenUnitaire = totalQuantite > 0 ? totalCoutProduction / totalQuantite : 0;
      const nbProduitsActifs = new Set((sales || []).map(s => s.product_id)).size;

      return {
        ca_ht: totalCaHt,
        ca_ttc: totalCaHt + totalTvaCollectee,
        cout_production: totalCoutProduction,
        marge_brute: margeBrute,
        taux_marge: tauxMarge,
        tva_collectee: totalTvaCollectee,
        tva_deductible: totalTvaDeductible,
        resultat_avant_charges: margeBrute,
        cash_flow: cashFlow,
        par_canal: parCanal,
        par_categorie: parCategorie,
        quantite_vendue: totalQuantite,
        cout_moyen_unitaire: coutMoyenUnitaire,
        nb_produits_actifs: nbProduitsActifs,
        previous: prevCaHt > 0 ? {
          ca_ht: prevCaHt,
          marge_brute: prevMarge,
          cash_flow: prevCashFlowValue,
        } : null,
        monthly_data: monthlyData,
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
    par_canal: [],
    par_categorie: [],
    quantite_vendue: 0,
    cout_moyen_unitaire: 0,
    nb_produits_actifs: 0,
    previous: null,
    monthly_data: [],
  };
}