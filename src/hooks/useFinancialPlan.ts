import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';

export interface FinancialPlanData {
  ca_total: number;
  achats_marchandises: number;
  coefficient: number;
  benefice_brut: number;
  charges_professionnelles: {
    total: number;
    by_category: { [key: string]: number };
  };
  resultat_independant: number;
}

export interface FinancialPlanYear {
  budget: FinancialPlanData;
  reel: FinancialPlanData;
}

const getEmptyData = (): FinancialPlanData => ({
  ca_total: 0,
  achats_marchandises: 0,
  coefficient: 0,
  benefice_brut: 0,
  charges_professionnelles: {
    total: 0,
    by_category: {},
  },
  resultat_independant: 0,
});

export function useFinancialPlan(baseYear: number) {
  const { currentProject } = useProject();

  return useQuery({
    queryKey: ['financial-plan', currentProject?.id, baseYear],
    queryFn: async () => {
      if (!currentProject?.id) {
        return {
          yearN: { budget: getEmptyData(), reel: getEmptyData() },
          yearN1: { budget: getEmptyData(), reel: getEmptyData() },
        };
      }

      const years = [baseYear, baseYear + 1];
      const modes = ['budget', 'reel'] as const;
      
      const result: { yearN: FinancialPlanYear; yearN1: FinancialPlanYear } = {
        yearN: { budget: getEmptyData(), reel: getEmptyData() },
        yearN1: { budget: getEmptyData(), reel: getEmptyData() },
      };

      // Fetch products for cost calculation
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc')
        .eq('project_id', currentProject.id)
        .eq('mode', 'simulation');

      const productIds = (products || []).map(p => p.id);

      // Fetch product prices
      const { data: productPrices } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('mode', 'simulation');

      // Fetch recipes (ingredient costs)
      const { data: recipes } = await supabase
        .from('recipes')
        .select('product_id, quantite_utilisee, ingredients(cout_unitaire)')
        .in('product_id', productIds)
        .eq('mode', 'simulation');

      // Fetch packaging costs
      const { data: packaging } = await supabase
        .from('product_packaging')
        .select('product_id, quantite, packaging(cout_unitaire)')
        .in('product_id', productIds)
        .eq('mode', 'simulation');

      // Fetch variable costs
      const { data: variableCosts } = await supabase
        .from('product_variable_costs')
        .select('product_id, quantite, variable_costs(cout_unitaire)')
        .in('product_id', productIds)
        .eq('mode', 'simulation');

      // Calculate production cost per product
      const getProductCost = (productId: string): number => {
        let cost = 0;
        
        // Ingredients cost
        (recipes || [])
          .filter(r => r.product_id === productId)
          .forEach(r => {
            const ingredientCost = (r.ingredients as any)?.cout_unitaire || 0;
            cost += Number(r.quantite_utilisee) * Number(ingredientCost);
          });

        // Packaging cost
        (packaging || [])
          .filter(p => p.product_id === productId)
          .forEach(p => {
            const packCost = (p.packaging as any)?.cout_unitaire || 0;
            cost += Number(p.quantite) * Number(packCost);
          });

        // Variable costs
        (variableCosts || [])
          .filter(v => v.product_id === productId)
          .forEach(v => {
            const varCost = (v.variable_costs as any)?.cout_unitaire || 0;
            cost += Number(v.quantite) * Number(varCost);
          });

        return cost;
      };

      // Helper to get price for a product/category
      const getPrice = (productId: string, category: string): number => {
        const price = (productPrices || []).find(
          p => p.product_id === productId && p.categorie_prix === category
        );
        if (price) return Number(price.prix_ht);
        
        const product = (products || []).find(p => p.id === productId);
        const prixBtc = Number(product?.prix_btc || 0);
        
        if (category === 'BTC') return prixBtc;
        if (category === 'BTB') return prixBtc * 0.7;
        return prixBtc * 0.7 * 0.85; // Distributeur
      };

      for (const year of years) {
        for (const mode of modes) {
          // Fetch annual sales for this year/mode
          const { data: annualSales } = await supabase
            .from('annual_sales')
            .select('*')
            .eq('project_id', currentProject.id)
            .eq('year', year)
            .eq('mode', mode);

          // Calculate CA total and Achats marchandises
          let caTotal = 0;
          let achatsMarchandises = 0;

          (annualSales || []).forEach(sale => {
            const qty = Number(sale.quantite_annuelle) || 0;
            const prix = sale.prix_ht_override 
              ? Number(sale.prix_ht_override) 
              : getPrice(sale.product_id, sale.categorie_prix);
            const productCost = getProductCost(sale.product_id);
            
            caTotal += qty * prix;
            achatsMarchandises += qty * productCost;
          });

          // Fetch professional expenses for this year/mode
          const dbMode = mode === 'budget' ? 'simulation' : 'reel';
          const yearStart = `${year}-01-01`;
          const yearEnd = `${year}-12-31`;
          
          const { data: expenses } = await supabase
            .from('professional_expenses')
            .select('*')
            .eq('project_id', currentProject.id)
            .eq('mode', dbMode)
            .gte('mois', yearStart)
            .lte('mois', yearEnd);

          // Calculate expenses by category
          const chargesByCategory: { [key: string]: number } = {};
          let totalCharges = 0;

          (expenses || []).forEach(expense => {
            const montantHt = Number(expense.montant_ht) || 0;
            chargesByCategory[expense.categorie_frais] = 
              (chargesByCategory[expense.categorie_frais] || 0) + montantHt;
            totalCharges += montantHt;
          });

          // Calculate derived values
          const coefficient = achatsMarchandises > 0 ? caTotal / achatsMarchandises : 0;
          const beneficeBrut = caTotal - achatsMarchandises;
          const resultatIndependant = beneficeBrut - totalCharges;

          const data: FinancialPlanData = {
            ca_total: caTotal,
            achats_marchandises: achatsMarchandises,
            coefficient,
            benefice_brut: beneficeBrut,
            charges_professionnelles: {
              total: totalCharges,
              by_category: chargesByCategory,
            },
            resultat_independant: resultatIndependant,
          };

          // Assign to correct year and mode
          if (year === baseYear) {
            result.yearN[mode] = data;
          } else {
            result.yearN1[mode] = data;
          }
        }
      }

      return result;
    },
    enabled: !!currentProject?.id,
  });
}
