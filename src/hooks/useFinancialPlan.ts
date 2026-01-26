import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';

export interface TaxBracket {
  tranche_min: number;
  tranche_max: number | null;
  taux: number;
  ordre: number;
}

export interface FiscalParams {
  tauxCotisationsSociales: number;
  tauxCommunal: number;
  nombreEnfantsCharge: number;
  quotiteExempteeBase: number;
  majorationParEnfant: number;
  taxBrackets: TaxBracket[];
}

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
  revenu_brut: number;
  cotisations_sociales: number;
  benefice_net_avant_impots: number;
  // Tax calculation fields
  quotite_exemptee: number;
  base_imposable: number;
  impot_base: number;
  impot_communal: number;
  impot_total: number;
  benefice_exercice: number;
  remuneration_annuelle: number;
  remuneration_mensuelle: number;
}

export interface FinancialPlanYear {
  budget: FinancialPlanData;
  reel: FinancialPlanData;
}

// Helper function to calculate tax by brackets
const calculateTaxByBrackets = (baseImposable: number, brackets: TaxBracket[]): number => {
  if (baseImposable <= 0 || brackets.length === 0) return 0;
  
  let impot = 0;
  let remainingIncome = baseImposable;
  
  // Sort brackets by ordre
  const sortedBrackets = [...brackets].sort((a, b) => a.ordre - b.ordre);
  
  for (const bracket of sortedBrackets) {
    if (remainingIncome <= 0) break;
    
    const bracketMin = Number(bracket.tranche_min);
    const bracketMax = bracket.tranche_max !== null ? Number(bracket.tranche_max) : Infinity;
    const taux = Number(bracket.taux) / 100;
    
    const bracketWidth = bracketMax - bracketMin;
    const taxableInBracket = Math.min(remainingIncome, bracketWidth);
    
    if (taxableInBracket > 0) {
      impot += taxableInBracket * taux;
      remainingIncome -= taxableInBracket;
    }
  }
  
  return impot;
};

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
  revenu_brut: 0,
  cotisations_sociales: 0,
  benefice_net_avant_impots: 0,
  quotite_exemptee: 0,
  base_imposable: 0,
  impot_base: 0,
  impot_communal: 0,
  impot_total: 0,
  benefice_exercice: 0,
  remuneration_annuelle: 0,
  remuneration_mensuelle: 0,
});

export function useFinancialPlan(baseYear: number, fiscalParams: FiscalParams) {
  const { currentProject } = useProject();
  
  const { 
    tauxCotisationsSociales = 20.5, 
    tauxCommunal = 7.0,
    nombreEnfantsCharge = 0,
    quotiteExempteeBase = 10570,
    majorationParEnfant = 1850,
    taxBrackets = [],
  } = fiscalParams;

  return useQuery({
    queryKey: ['financial-plan', currentProject?.id, baseYear, JSON.stringify(fiscalParams)],
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
          
          // Revenu brut = Résultat indépendant (base pour les cotisations)
          const revenuBrut = resultatIndependant;
          
          // Cotisations sociales = Revenu brut × taux
          const cotisationsSociales = revenuBrut > 0 ? revenuBrut * (tauxCotisationsSociales / 100) : 0;
          
          // Bénéfice net avant impôts = Revenu brut - Cotisations sociales
          const beneficeNetAvantImpots = revenuBrut - cotisationsSociales;
          
          // TAX CALCULATION
          // Quotité exemptée = Base + (majoration × nombre enfants)
          const quotiteExemptee = quotiteExempteeBase + (majorationParEnfant * nombreEnfantsCharge);
          
          // Base imposable = Bénéfice net avant impôts - Quotité exemptée
          const baseImposable = Math.max(0, beneficeNetAvantImpots - quotiteExemptee);
          
          // Impôt de base par tranches
          const impotBase = calculateTaxByBrackets(baseImposable, taxBrackets);
          
          // Impôt communal = Impôt base × taux communal
          const impotCommunal = impotBase * (tauxCommunal / 100);
          
          // Impôt total
          const impotTotal = impotBase + impotCommunal;
          
          // Bénéfice de l'exercice = Bénéfice net avant impôts - Impôt total
          const beneficeExercice = beneficeNetAvantImpots - impotTotal;
          
          // Rémunérations
          const remunerationAnnuelle = beneficeExercice;
          const remunerationMensuelle = beneficeExercice / 12;

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
            revenu_brut: revenuBrut,
            cotisations_sociales: cotisationsSociales,
            benefice_net_avant_impots: beneficeNetAvantImpots,
            quotite_exemptee: quotiteExemptee,
            base_imposable: baseImposable,
            impot_base: impotBase,
            impot_communal: impotCommunal,
            impot_total: impotTotal,
            benefice_exercice: beneficeExercice,
            remuneration_annuelle: remunerationAnnuelle,
            remuneration_mensuelle: remunerationMensuelle,
          };

          // Assign to correct year and mode
          if (year === baseYear) {
            result.yearN[mode] = data;
          } else {
            result.yearN1[mode] = data;
          }

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
