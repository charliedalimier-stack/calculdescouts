import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export interface FinancialReportData {
  periode: string;
  ca_ht: number;
  cout_production: number;
  marge_brute: number;
  taux_marge: number;
  frais_fixes: number;
  resultat_net: number;
  tva_collectee: number;
  tva_deductible: number;
  tva_nette: number;
}

export interface ProductReportData {
  product_id: string;
  nom_produit: string;
  categorie: string;
  cout_revient: number;
  prix_vente_moyen: number;
  coefficient: number;
  marge_unitaire: number;
  volume_vendu: number;
  ca_genere: number;
  contribution_marge: number;
}

export interface SalesReportData {
  periode: string;
  canal: string;
  volume: number;
  ca_ht: number;
  objectif_volume: number;
  objectif_ca: number;
  ecart_volume_pct: number;
  ecart_ca_pct: number;
}

export interface StockReportData {
  type_stock: string;
  nom: string;
  quantite: number;
  cout_unitaire: number;
  valeur_stock: number;
  seuil_alerte: number;
  statut: 'ok' | 'alerte' | 'critique';
  rotation: number;
}

type ReportMode = 'budget' | 'reel';

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DEFAULT_COEFFICIENTS = [8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.37];

/**
 * Financial Report Hook
 * Uses annual_sales + seasonality_coefficients as the single source of truth
 * Same data source as useAutoCashFlow and useMonthlyDistribution
 */
export const useFinancialReport = (year: number, mode: ReportMode = 'budget') => {
  const { currentProject } = useProject();

  return useQuery({
    queryKey: ['financial-report', currentProject?.id, mode, year],
    queryFn: async (): Promise<FinancialReportData[]> => {
      if (!currentProject?.id) return [];

      // 1. Fetch seasonality coefficients for the mode
      const { data: coefData, error: coefError } = await supabase
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

      // 2. Fetch annual sales for the mode (SINGLE SOURCE OF TRUTH)
      const { data: annualSales, error: salesError } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', mode);


      // 3. Collect product IDs and fetch related data
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
          supabase.from('product_prices').select('*').in('product_id', productIds).eq('mode', 'budget'),
          supabase.from('recipes').select('*').in('product_id', productIds).eq('mode', 'budget'),
          supabase.from('product_packaging').select('*').in('product_id', productIds).eq('mode', 'budget'),
          supabase.from('product_variable_costs').select('*').in('product_id', productIds).eq('mode', 'budget'),
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

      // 4. Fetch professional expenses (now using same mode as budget = 'budget')
      const expenseMode = mode;
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
        return product?.tva_taux ?? 6;
      };

      const getProductCosts = (productId: string): { 
        matieres_ht: number; 
        emballages_ht: number; 
        variables_ht: number;
        tva_matieres: number;
        tva_emballages: number;
        tva_variables: number;
      } => {
        const productRecipes = recipes.filter(r => r.product_id === productId);
        let matieres_ht = 0;
        let tva_matieres = 0;
        productRecipes.forEach(recipe => {
          const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
          const ht = Number(recipe.quantite_utilisee) * Number(ingredient?.cout_unitaire || 0);
          const tvaTaux = ingredient?.tva_taux ?? 21;
          matieres_ht += ht;
          tva_matieres += ht * (tvaTaux / 100);
        });

        const productPacks = productPackaging.filter(pp => pp.product_id === productId);
        let emballages_ht = 0;
        let tva_emballages = 0;
        productPacks.forEach(pack => {
          const pkg = packaging.find(p => p.id === pack.packaging_id);
          const ht = Number(pack.quantite) * Number(pkg?.cout_unitaire || 0);
          const tvaTaux = pkg?.tva_taux ?? 21;
          emballages_ht += ht;
          tva_emballages += ht * (tvaTaux / 100);
        });

        const productVarCosts = productVariableCosts.filter(pvc => pvc.product_id === productId);
        let variables_ht = 0;
        let tva_variables = 0;
        productVarCosts.forEach(pvc => {
          const vc = variableCosts.find(v => v.id === pvc.variable_cost_id);
          const ht = Number(pvc.quantite) * Number(vc?.cout_unitaire || 0);
          const tvaTaux = vc?.tva_taux ?? 21;
          variables_ht += ht;
          tva_variables += ht * (tvaTaux / 100);
        });

        return { matieres_ht, emballages_ht, variables_ht, tva_matieres, tva_emballages, tva_variables };
      };

      // 5. Calculate monthly data
      const monthlyData: FinancialReportData[] = [];

      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
        const monthKey = `${year}-${(i + 1).toString().padStart(2, '0')}`;
        const coef = Number(coefficients[i]) / 100;

        let ca_ht = 0;
        let cout_production = 0;
        let tva_collectee = 0;
        let tva_deductible = 0;

        // Process annual sales with seasonality
        (annualSales || []).forEach(sale => {
          const annualQty = Number(sale.quantite_annuelle) || 0;
          const monthQty = Math.round(annualQty * coef);
          
          const prix = sale.prix_ht_override 
            ? Number(sale.prix_ht_override) 
            : getPrice(sale.product_id, sale.categorie_prix);
          
          const saleCaHt = monthQty * prix;
          ca_ht += saleCaHt;
          
          const tvaTaux = getProductTvaRate(sale.product_id);
          tva_collectee += saleCaHt * (tvaTaux / 100);

          // Production costs
          const costs = getProductCosts(sale.product_id);
          cout_production += monthQty * (costs.matieres_ht + costs.emballages_ht + costs.variables_ht);
          tva_deductible += monthQty * (costs.tva_matieres + costs.tva_emballages + costs.tva_variables);
        });

        // Professional expenses for this month
        const monthExpenses = (expenses || []).filter(e => e.mois.startsWith(monthKey));
        let frais_fixes = 0;
        monthExpenses.forEach(e => {
          const ht = Number(e.montant_ht);
          const tvaTaux = e.tva_taux ?? 21;
          frais_fixes += ht;
          tva_deductible += ht * (tvaTaux / 100);
        });

        const marge_brute = ca_ht - cout_production;
        const resultat_net = marge_brute - frais_fixes;
        const taux_marge = ca_ht > 0 ? (marge_brute / ca_ht) * 100 : 0;
        const tva_nette = tva_collectee - tva_deductible;

        monthlyData.push({
          periode: monthStr,
          ca_ht,
          cout_production,
          marge_brute,
          taux_marge,
          frais_fixes,
          resultat_net,
          tva_collectee,
          tva_deductible,
          tva_nette,
        });
      }


      return monthlyData;
    },
    enabled: !!currentProject?.id,
  });
};

/**
 * Product Report Hook
 * Uses annual_sales as the single source of truth for volumes
 */
export const useProductReport = (year: number, mode: ReportMode = 'budget') => {
  const { currentProject } = useProject();

  return useQuery({
    queryKey: ['product-report', currentProject?.id, mode, year],
    queryFn: async (): Promise<ProductReportData[]> => {
      if (!currentProject?.id) return [];

      // Fetch annual sales for the mode (SINGLE SOURCE OF TRUTH)
      const { data: annualSales, error: salesError } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', mode);


      // Collect product IDs from sales
      const productIdsFromSales = [...new Set((annualSales || []).map(s => s.product_id))];
      

      // Also fetch all products to show products without sales
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', 'budget');


      const products = allProducts || [];
      const productIds = products.map(p => p.id);

      if (productIds.length === 0) return [];

      // Fetch all related data
      const [pricesRes, recipesRes, packagingRes, variableCostsRes] = await Promise.all([
        supabase.from('product_prices').select('*').in('product_id', productIds).eq('mode', 'budget'),
        supabase.from('recipes').select('*, ingredients(*)').in('product_id', productIds).eq('mode', 'budget'),
        supabase.from('product_packaging').select('*, packaging(*)').in('product_id', productIds).eq('mode', 'budget'),
        supabase.from('product_variable_costs').select('*, variable_costs(*)').in('product_id', productIds).eq('mode', 'budget'),
      ]);

      const prices = pricesRes.data || [];
      const recipes = recipesRes.data || [];
      const productPackaging = packagingRes.data || [];
      const variableCosts = variableCostsRes.data || [];

      const productData: ProductReportData[] = [];
      let totalMarge = 0;

      products.forEach(product => {
        // Calculate production cost
        const productRecipes = recipes.filter(r => r.product_id === product.id);
        const productPkg = productPackaging.filter(p => p.product_id === product.id);
        const productVC = variableCosts.filter(vc => vc.product_id === product.id);

        let cout_revient = 0;
        productRecipes.forEach(r => {
          cout_revient += (r.ingredients?.cout_unitaire || 0) * r.quantite_utilisee;
        });
        productPkg.forEach(p => {
          cout_revient += (p.packaging?.cout_unitaire || 0) * p.quantite;
        });
        productVC.forEach(vc => {
          cout_revient += (vc.variable_costs?.cout_unitaire || 0) * vc.quantite;
        });

        // Calculate average selling price and volume from annual_sales
        const productSales = (annualSales || []).filter(s => s.product_id === product.id);
        const productPrices = prices.filter(p => p.product_id === product.id);
        
        let totalVolume = 0;
        let weightedPriceSum = 0;
        
        productSales.forEach(sale => {
          const qty = Number(sale.quantite_annuelle) || 0;
          const price = productPrices.find(p => p.categorie_prix === sale.categorie_prix);
          const prixHt = sale.prix_ht_override 
            ? Number(sale.prix_ht_override) 
            : (price?.prix_ht || product.prix_btc);
          
          totalVolume += qty;
          weightedPriceSum += qty * prixHt;
        });

        const volume_vendu = totalVolume;
        const prix_vente_moyen = volume_vendu > 0 
          ? weightedPriceSum / volume_vendu 
          : (productPrices.length > 0 
              ? productPrices.reduce((sum, p) => sum + p.prix_ht, 0) / productPrices.length 
              : product.prix_btc);

        const marge_unitaire = prix_vente_moyen - cout_revient;
        const coefficient = cout_revient > 0 ? prix_vente_moyen / cout_revient : 0;
        const ca_genere = prix_vente_moyen * volume_vendu;
        const contribution_marge = marge_unitaire * volume_vendu;

        totalMarge += contribution_marge;

        productData.push({
          product_id: product.id,
          nom_produit: product.nom_produit,
          categorie: product.categories?.nom_categorie || 'Non catégorisé',
          cout_revient,
          prix_vente_moyen,
          coefficient,
          marge_unitaire,
          volume_vendu,
          ca_genere,
          contribution_marge,
        });
      });


      return productData;
    },
    enabled: !!currentProject?.id,
  });
};

/**
 * Sales Report Hook
 * Uses annual_sales + seasonality for both budget and reel
 * Budget = annual_sales mode='budget' with budget seasonality
 * Reel = annual_sales mode='reel' with reel seasonality
 */
export const useSalesReport = (year: number, mode: ReportMode = 'budget') => {
  const { currentProject } = useProject();

  return useQuery({
    queryKey: ['sales-report', currentProject?.id, mode, year],
    queryFn: async (): Promise<SalesReportData[]> => {
      if (!currentProject?.id) return [];

      // Fetch BUDGET coefficients
      const { data: budgetCoefData, error: budgetCoefError } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'budget')
        .maybeSingle();

      

      // Fetch REEL coefficients
      const { data: reelCoefData, error: reelCoefError } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'reel')
        .maybeSingle();

      

      const budgetCoefficients = budgetCoefData
        ? [
            Number(budgetCoefData.month_01), Number(budgetCoefData.month_02), Number(budgetCoefData.month_03),
            Number(budgetCoefData.month_04), Number(budgetCoefData.month_05), Number(budgetCoefData.month_06),
            Number(budgetCoefData.month_07), Number(budgetCoefData.month_08), Number(budgetCoefData.month_09),
            Number(budgetCoefData.month_10), Number(budgetCoefData.month_11), Number(budgetCoefData.month_12),
          ]
        : DEFAULT_COEFFICIENTS;

      const reelCoefficients = reelCoefData
        ? [
            Number(reelCoefData.month_01), Number(reelCoefData.month_02), Number(reelCoefData.month_03),
            Number(reelCoefData.month_04), Number(reelCoefData.month_05), Number(reelCoefData.month_06),
            Number(reelCoefData.month_07), Number(reelCoefData.month_08), Number(reelCoefData.month_09),
            Number(reelCoefData.month_10), Number(reelCoefData.month_11), Number(reelCoefData.month_12),
          ]
        : DEFAULT_COEFFICIENTS;

      // Fetch BUDGET annual sales
      const { data: budgetSales, error: budgetSalesError } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'budget');


      // Fetch REEL annual sales
      const { data: reelSales, error: reelSalesError } = await supabase
        .from('annual_sales')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('year', year)
        .eq('mode', 'reel');


      // Collect product IDs
      const allProductIds = [...new Set([
        ...(budgetSales || []).map(s => s.product_id),
        ...(reelSales || []).map(s => s.product_id),
      ])];

      

      if (allProductIds.length === 0) return [];

      // Fetch products and prices
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc')
        .in('id', allProductIds);

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
        return prixBtc * 0.7 * 0.85;
      };

      // Generate sales data by month and channel
      const salesData: SalesReportData[] = [];
      const canaux = ['BTC', 'BTB', 'Distributeur'];

      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}-01`;
        const budgetCoef = Number(budgetCoefficients[i]) / 100;
        const reelCoef = Number(reelCoefficients[i]) / 100;

        canaux.forEach(canal => {
          let objectif_volume = 0;
          let objectif_ca = 0;
          let volume = 0;
          let ca_ht = 0;

          // Budget data (objectifs)
          (budgetSales || []).filter(s => s.categorie_prix === canal).forEach(sale => {
            const annualQty = Number(sale.quantite_annuelle) || 0;
            const monthQty = Math.round(annualQty * budgetCoef);
            const prix = sale.prix_ht_override 
              ? Number(sale.prix_ht_override) 
              : getPrice(sale.product_id, canal);
            
            objectif_volume += monthQty;
            objectif_ca += monthQty * prix;
          });

          // Reel data
          (reelSales || []).filter(s => s.categorie_prix === canal).forEach(sale => {
            const annualQty = Number(sale.quantite_annuelle) || 0;
            const monthQty = Math.round(annualQty * reelCoef);
            const prix = sale.prix_ht_override 
              ? Number(sale.prix_ht_override) 
              : getPrice(sale.product_id, canal);
            
            volume += monthQty;
            ca_ht += monthQty * prix;
          });

          // Only add if there's any data
          if (objectif_volume > 0 || volume > 0) {
            salesData.push({
              periode: monthStr,
              canal,
              volume,
              ca_ht,
              objectif_volume,
              objectif_ca,
              ecart_volume_pct: objectif_volume > 0 ? ((volume - objectif_volume) / objectif_volume) * 100 : 0,
              ecart_ca_pct: objectif_ca > 0 ? ((ca_ht - objectif_ca) / objectif_ca) * 100 : 0,
            });
          }
        });
      }


      return salesData;
    },
    enabled: !!currentProject?.id,
  });
};

/**
 * Stock Report Hook
 */
export const useStockReport = (mode: ReportMode = 'budget') => {
  const { currentProject } = useProject();

  return useQuery({
    queryKey: ['stock-report', currentProject?.id, mode],
    queryFn: async (): Promise<StockReportData[]> => {
      if (!currentProject?.id) return [];


      const { data: stocks } = await supabase
        .from('stocks')
        .select('*, ingredients(*), packaging(*), products(*)')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      

      // Fetch movements for rotation calculation
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('project_id', currentProject.id);

      return (stocks || []).map(stock => {
        const valeur_stock = stock.quantite * stock.cout_unitaire;
        const seuil = stock.seuil_alerte || 10;
        
        let statut: 'ok' | 'alerte' | 'critique' = 'ok';
        if (stock.quantite <= 0) {
          statut = 'critique';
        } else if (stock.quantite <= seuil) {
          statut = 'alerte';
        }

        // Calculate rotation (sorties over 30 days / average stock)
        const stockMovements = movements?.filter(m => m.stock_id === stock.id) || [];
        const sorties = stockMovements
          .filter(m => m.type_mouvement === 'sortie')
          .reduce((sum, m) => sum + m.quantite, 0);
        const rotation = stock.quantite > 0 ? sorties / stock.quantite : 0;

        let nom = '';
        if (stock.type_stock === 'ingredient' && stock.ingredients) {
          nom = stock.ingredients.nom_ingredient;
        } else if ((stock.type_stock === 'emballage' || stock.type_stock === 'packaging') && stock.packaging) {
          nom = stock.packaging.nom;
        } else if (stock.type_stock === 'produit_fini' && stock.products) {
          nom = stock.products.nom_produit;
        }

        return {
          type_stock: stock.type_stock,
          nom,
          quantite: stock.quantite,
          cout_unitaire: stock.cout_unitaire,
          valeur_stock,
          seuil_alerte: seuil,
          statut,
          rotation,
        };
      });
    },
    enabled: !!currentProject?.id,
  });
};
