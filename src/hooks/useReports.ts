import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useMode } from "@/contexts/ModeContext";

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

export const useFinancialReport = (year: number) => {
  const { currentProject } = useProject();
  const { mode } = useMode();

  return useQuery({
    queryKey: ['financial-report', currentProject?.id, mode, year],
    queryFn: async (): Promise<FinancialReportData[]> => {
      if (!currentProject?.id) return [];

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      // Fetch sales data
      const salesTable = mode === 'reel' ? 'sales_actuals' : 'sales_targets';
      const quantityField = mode === 'reel' ? 'quantite_reelle' : 'quantite_objectif';
      
      const { data: sales } = await supabase
        .from(salesTable)
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .eq('mode', mode);

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('professional_expenses')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch recipes for cost calculation
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*, ingredients(*)')
        .eq('mode', mode);

      // Fetch packaging
      const { data: productPackaging } = await supabase
        .from('product_packaging')
        .select('*, packaging(*)')
        .eq('mode', mode);

      // Calculate monthly data
      const monthlyData: FinancialReportData[] = [];
      
      for (let month = 1; month <= 12; month++) {
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        const monthStart = `${monthStr}-01`;
        
        const monthSales = sales?.filter(s => s.mois.startsWith(monthStr)) || [];
        const monthExpenses = expenses?.filter(e => e.mois.startsWith(monthStr)) || [];

        let ca_ht = 0;
        let cout_production = 0;
        let tva_collectee = 0;
        let tva_deductible = 0;

        monthSales.forEach(sale => {
          const price = prices?.find(p => 
            p.product_id === sale.product_id && 
            p.categorie_prix === sale.categorie_prix
          );
          const quantity = sale[quantityField] || 0;
          const prixHt = price?.prix_ht || 0;
          const tvaTaux = price?.tva_taux || 5.5;

          ca_ht += prixHt * quantity;
          tva_collectee += prixHt * quantity * (tvaTaux / 100);

          // Calculate production cost
          const productRecipes = recipes?.filter(r => r.product_id === sale.product_id) || [];
          const productPkg = productPackaging?.filter(p => p.product_id === sale.product_id) || [];
          
          let unitCost = 0;
          productRecipes.forEach(r => {
            unitCost += (r.ingredients?.cout_unitaire || 0) * r.quantite_utilisee;
            tva_deductible += (r.ingredients?.cout_unitaire || 0) * r.quantite_utilisee * ((r.ingredients?.tva_taux || 5.5) / 100) * quantity;
          });
          productPkg.forEach(p => {
            unitCost += (p.packaging?.cout_unitaire || 0) * p.quantite;
            tva_deductible += (p.packaging?.cout_unitaire || 0) * p.quantite * ((p.packaging?.tva_taux || 20) / 100) * quantity;
          });
          
          cout_production += unitCost * quantity;
        });

        const frais_fixes = monthExpenses.reduce((sum, e) => sum + (e.montant_ht || 0), 0);
        tva_deductible += monthExpenses.reduce((sum, e) => sum + (e.montant_ht * ((e.tva_taux || 20) / 100)), 0);

        const marge_brute = ca_ht - cout_production;
        const resultat_net = marge_brute - frais_fixes;

        monthlyData.push({
          periode: monthStart,
          ca_ht,
          cout_production,
          marge_brute,
          taux_marge: ca_ht > 0 ? (marge_brute / ca_ht) * 100 : 0,
          frais_fixes,
          resultat_net,
          tva_collectee,
          tva_deductible,
          tva_nette: tva_collectee - tva_deductible,
        });
      }

      return monthlyData;
    },
    enabled: !!currentProject?.id,
  });
};

export const useProductReport = () => {
  const { currentProject } = useProject();
  const { mode } = useMode();

  return useQuery({
    queryKey: ['product-report', currentProject?.id, mode],
    queryFn: async (): Promise<ProductReportData[]> => {
      if (!currentProject?.id) return [];

      // Fetch products with categories
      const { data: products } = await supabase
        .from('products')
        .select('*, categories(nom_categorie)')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      // Fetch all prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .eq('mode', mode);

      // Fetch recipes
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*, ingredients(*)')
        .eq('mode', mode);

      // Fetch packaging
      const { data: productPackaging } = await supabase
        .from('product_packaging')
        .select('*, packaging(*)')
        .eq('mode', mode);

      // Fetch variable costs
      const { data: variableCosts } = await supabase
        .from('product_variable_costs')
        .select('*, variable_costs(*)')
        .eq('mode', mode);

      // Fetch sales
      const salesTable = mode === 'reel' ? 'sales_actuals' : 'sales_targets';
      const { data: sales } = await supabase
        .from(salesTable)
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode);

      const productData: ProductReportData[] = [];
      let totalMarge = 0;

      products?.forEach(product => {
        // Calculate production cost
        const productRecipes = recipes?.filter(r => r.product_id === product.id) || [];
        const productPkg = productPackaging?.filter(p => p.product_id === product.id) || [];
        const productVC = variableCosts?.filter(vc => vc.product_id === product.id) || [];

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

        // Calculate average selling price
        const productPrices = prices?.filter(p => p.product_id === product.id) || [];
        const prix_vente_moyen = productPrices.length > 0
          ? productPrices.reduce((sum, p) => sum + p.prix_ht, 0) / productPrices.length
          : product.prix_btc;

        // Calculate sales volume
        const quantityField = mode === 'reel' ? 'quantite_reelle' : 'quantite_objectif';
        const productSales = sales?.filter(s => s.product_id === product.id) || [];
        const volume_vendu = productSales.reduce((sum, s) => sum + (s[quantityField] || 0), 0);

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

      // Calculate contribution percentage
      return productData.map(p => ({
        ...p,
        contribution_marge_pct: totalMarge > 0 ? (p.contribution_marge / totalMarge) * 100 : 0,
      }));
    },
    enabled: !!currentProject?.id,
  });
};

export const useSalesReport = (year: number) => {
  const { currentProject } = useProject();
  const { mode } = useMode();

  return useQuery({
    queryKey: ['sales-report', currentProject?.id, mode, year],
    queryFn: async (): Promise<SalesReportData[]> => {
      if (!currentProject?.id) return [];

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Fetch targets
      const { data: targets } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch actuals
      const { data: actuals } = await supabase
        .from('sales_actuals')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .gte('mois', startDate)
        .lte('mois', endDate);

      // Fetch prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .eq('mode', mode);

      const salesData: SalesReportData[] = [];
      const canaux = ['BTC', 'BTB', 'Distributeur'];

      for (let month = 1; month <= 12; month++) {
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

        canaux.forEach(canal => {
          const monthTargets = targets?.filter(t => 
            t.mois.startsWith(monthStr) && t.categorie_prix === canal
          ) || [];
          const monthActuals = actuals?.filter(a => 
            a.mois.startsWith(monthStr) && a.categorie_prix === canal
          ) || [];

          let objectif_volume = 0;
          let objectif_ca = 0;
          let volume = 0;
          let ca_ht = 0;

          monthTargets.forEach(t => {
            objectif_volume += t.quantite_objectif || 0;
            const price = prices?.find(p => p.product_id === t.product_id && p.categorie_prix === canal);
            objectif_ca += (t.quantite_objectif || 0) * (price?.prix_ht || 0);
          });

          monthActuals.forEach(a => {
            volume += a.quantite_reelle || 0;
            const price = prices?.find(p => p.product_id === a.product_id && p.categorie_prix === canal);
            ca_ht += (a.quantite_reelle || 0) * (price?.prix_ht || 0);
          });

          if (objectif_volume > 0 || volume > 0) {
            salesData.push({
              periode: `${monthStr}-01`,
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

export const useStockReport = () => {
  const { currentProject } = useProject();
  const { mode } = useMode();

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
        } else if (stock.type_stock === 'emballage' && stock.packaging) {
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
