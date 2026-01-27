import { useMemo } from 'react';
import { FinancialPlanData, FiscalParams } from './useFinancialPlan';

export interface StressTestParams {
  variationCA: number; // -50 to +50
  variationCoefficient: number; // -30 to +30
  variationCharges: number; // -30 to +50
}

export interface StressTestResult {
  indicateur: string;
  key: string;
  valeurActuelle: number;
  valeurStress: number;
  ecartEuro: number;
  ecartPct: number;
}

export interface StressTestSummary {
  results: StressTestResult[];
  isResultatNegatif: boolean;
  isTresorerieRisque: boolean;
  stressedData: FinancialPlanData;
}

// Helper to calculate tax based on brackets (reused from useFinancialPlan logic)
function calculateTaxFromBrackets(
  baseImposable: number,
  taxBrackets: Array<{ tranche_min: number; tranche_max: number | null; taux: number }>
): number {
  if (baseImposable <= 0) return 0;
  
  let totalTax = 0;
  let remainingIncome = baseImposable;

  const sortedBrackets = [...taxBrackets].sort((a, b) => a.tranche_min - b.tranche_min);

  for (const bracket of sortedBrackets) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.tranche_min;
    const bracketMax = bracket.tranche_max ?? Infinity;
    const bracketSize = bracketMax - bracketMin;

    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    totalTax += taxableInBracket * (bracket.taux / 100);
    remainingIncome -= taxableInBracket;
  }

  return totalTax;
}

export function useFinancialStressTest(
  baseData: FinancialPlanData,
  params: StressTestParams,
  fiscalParams: FiscalParams
): StressTestSummary {
  const stressedData = useMemo((): FinancialPlanData => {
    // Apply stress variations
    const caStress = baseData.ca_total * (1 + params.variationCA / 100);
    
    // Calculate original coefficient (CA / achats)
    const originalCoefficient = baseData.achats_marchandises > 0 
      ? baseData.ca_total / baseData.achats_marchandises 
      : 2.5;
    
    // Apply coefficient variation to get new achats
    const newCoefficient = originalCoefficient * (1 + params.variationCoefficient / 100);
    const achatsStress = newCoefficient > 0 ? caStress / newCoefficient : 0;
    
    // Apply charges variation
    const chargesStress = baseData.charges_professionnelles.total * (1 + params.variationCharges / 100);
    
    // Recalculate downstream values
    const coefficientStress = achatsStress > 0 ? caStress / achatsStress : 0;
    const beneficeBrutStress = caStress - achatsStress;
    const resultatIndependantStress = beneficeBrutStress - chargesStress;
    
    // Cotisations sociales
    const revenuBrutStress = resultatIndependantStress;
    const cotisationsSocialesStress = Math.max(0, revenuBrutStress * (fiscalParams.tauxCotisationsSociales / 100));
    const beneficeNetAvantImpotsStress = revenuBrutStress - cotisationsSocialesStress;
    
    // Impôts
    const quotiteExemptee = fiscalParams.quotiteExempteeBase + 
      (fiscalParams.majorationParEnfant * fiscalParams.nombreEnfantsCharge);
    const baseImposableStress = Math.max(0, beneficeNetAvantImpotsStress - quotiteExemptee);
    const impotBaseStress = calculateTaxFromBrackets(baseImposableStress, fiscalParams.taxBrackets);
    const impotCommunalStress = impotBaseStress * (fiscalParams.tauxCommunal / 100);
    const impotTotalStress = impotBaseStress + impotCommunalStress;
    
    // Bénéfice final
    const beneficeExerciceStress = beneficeNetAvantImpotsStress - impotTotalStress;
    const remunerationAnnuelleStress = Math.max(0, beneficeExerciceStress);
    const remunerationMensuelleStress = remunerationAnnuelleStress / 12;

    // Scale charges by category proportionally
    const chargesParCategorie: { [key: string]: number } = {};
    Object.entries(baseData.charges_professionnelles.by_category).forEach(([cat, val]) => {
      chargesParCategorie[cat] = val * (1 + params.variationCharges / 100);
    });

    return {
      ca_total: caStress,
      achats_marchandises: achatsStress,
      coefficient: coefficientStress,
      benefice_brut: beneficeBrutStress,
      charges_professionnelles: {
        total: chargesStress,
        by_category: chargesParCategorie,
      },
      resultat_independant: resultatIndependantStress,
      revenu_brut: revenuBrutStress,
      cotisations_sociales: cotisationsSocialesStress,
      benefice_net_avant_impots: beneficeNetAvantImpotsStress,
      quotite_exemptee: quotiteExemptee,
      base_imposable: baseImposableStress,
      impot_base: impotBaseStress,
      impot_communal: impotCommunalStress,
      impot_total: impotTotalStress,
      benefice_exercice: beneficeExerciceStress,
      remuneration_annuelle: remunerationAnnuelleStress,
      remuneration_mensuelle: remunerationMensuelleStress,
    };
  }, [baseData, params, fiscalParams]);

  const results = useMemo((): StressTestResult[] => {
    const indicators: Array<{ label: string; key: string }> = [
      { label: 'Chiffre d\'affaires', key: 'ca_total' },
      { label: 'Achats marchandises', key: 'achats_marchandises' },
      { label: 'Charges professionnelles', key: 'charges_professionnelles_total' },
      { label: 'Résultat indépendant', key: 'resultat_independant' },
      { label: 'Impôts', key: 'impot_total' },
      { label: 'Bénéfice net', key: 'benefice_exercice' },
      { label: 'Rémunération annuelle', key: 'remuneration_annuelle' },
      { label: 'Rémunération mensuelle', key: 'remuneration_mensuelle' },
    ];

    const getValue = (data: FinancialPlanData, key: string): number => {
      if (key === 'charges_professionnelles_total') {
        return data.charges_professionnelles.total;
      }
      return (data as any)[key] ?? 0;
    };

    return indicators.map(({ label, key }) => {
      const valeurActuelle = getValue(baseData, key);
      const valeurStress = getValue(stressedData, key);
      const ecartEuro = valeurStress - valeurActuelle;
      const ecartPct = valeurActuelle !== 0 ? (ecartEuro / Math.abs(valeurActuelle)) * 100 : 0;

      return {
        indicateur: label,
        key,
        valeurActuelle,
        valeurStress,
        ecartEuro,
        ecartPct,
      };
    });
  }, [baseData, stressedData]);

  const isResultatNegatif = stressedData.benefice_exercice < 0;
  const isTresorerieRisque = stressedData.resultat_independant < 0 || stressedData.benefice_net_avant_impots < 0;

  return {
    results,
    isResultatNegatif,
    isTresorerieRisque,
    stressedData,
  };
}
