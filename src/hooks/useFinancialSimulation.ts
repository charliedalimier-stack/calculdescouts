import { useMemo } from 'react';
import { FinancialPlanData, FiscalParams } from './useFinancialPlan';

export interface SimulationScenario {
  label: string;
  revenu_net_cible: number | null;
  ca: number;
  achats_marchandises: number;
  charges_professionnelles: number;
  revenu_brut: number;
  cotisations_sociales: number;
  impot_total: number;
  resultat_net: number;
}

// Helper function to calculate tax by brackets (same as in useFinancialPlan)
const calculateTaxByBrackets = (baseImposable: number, brackets: { tranche_min: number; tranche_max: number | null; taux: number; ordre: number }[]): number => {
  if (baseImposable <= 0 || brackets.length === 0) return 0;
  
  let impot = 0;
  let remainingIncome = baseImposable;
  
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

function computeScenario(
  label: string,
  ca: number,
  coefficient: number,
  totalCharges: number,
  fiscalParams: FiscalParams,
  revenuNetCible: number | null = null,
): SimulationScenario {
  const achats = coefficient > 0 ? ca / coefficient : 0;
  const revenuBrut = ca - achats - totalCharges;
  const cotisations = revenuBrut > 0 ? revenuBrut * (fiscalParams.tauxCotisationsSociales / 100) : 0;
  const beneficeNetAvantImpots = revenuBrut - cotisations;

  const quotiteExemptee = fiscalParams.quotiteExempteeBase + (fiscalParams.majorationParEnfant * fiscalParams.nombreEnfantsCharge);
  const baseImposable = Math.max(0, beneficeNetAvantImpots - quotiteExemptee);
  const impotBase = calculateTaxByBrackets(baseImposable, fiscalParams.taxBrackets);
  const impotCommunal = impotBase * (fiscalParams.tauxCommunal / 100);
  const impotTotal = impotBase + impotCommunal;

  const resultatNet = beneficeNetAvantImpots - impotTotal;

  return {
    label,
    revenu_net_cible: revenuNetCible,
    ca,
    achats_marchandises: achats,
    charges_professionnelles: totalCharges,
    revenu_brut: revenuBrut,
    cotisations_sociales: cotisations,
    impot_total: impotTotal,
    resultat_net: resultatNet,
  };
}

/**
 * Binary search for the CA that yields resultat_net ≈ targetNet
 */
function findCAForTargetNet(
  targetNet: number,
  coefficient: number,
  totalCharges: number,
  fiscalParams: FiscalParams
): number {
  let low = 0;
  let high = 10_000_000; // 10M ceiling
  
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const scenario = computeScenario('', mid, coefficient, totalCharges, fiscalParams);
    
    if (Math.abs(scenario.resultat_net - targetNet) < 1) break;
    
    if (scenario.resultat_net < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return Math.round((low + high) / 2);
}

export function useFinancialSimulation(
  baseData: FinancialPlanData | undefined,
  fiscalParams: FiscalParams,
  seuilViabiliteNet: number,
  revenuIdealNet: number,
) {
  return useMemo(() => {
    if (!baseData) return { scenarios: [] as SimulationScenario[] };

    const coefficient = baseData.coefficient > 0 ? baseData.coefficient : 2.5;
    const totalCharges = baseData.charges_professionnelles.total;

    // 1. Breakeven (résultat net = 0)
    const breakevenCA = findCAForTargetNet(0, coefficient, totalCharges, fiscalParams);
    const breakeven = computeScenario('Seuil de rentabilité (équilibre)', breakevenCA, coefficient, totalCharges, fiscalParams, 0);

    const scenarios: SimulationScenario[] = [breakeven];

    // 2. Viability: find CA for target net = seuilViabiliteNet
    if (seuilViabiliteNet > 0) {
      const viabilityCA = findCAForTargetNet(seuilViabiliteNet, coefficient, totalCharges, fiscalParams);
      const viability = computeScenario('Seuil de viabilité', viabilityCA, coefficient, totalCharges, fiscalParams, seuilViabiliteNet);
      scenarios.push(viability);
    }

    // 3. Ideal: find CA for target net = revenuIdealNet
    if (revenuIdealNet > 0) {
      const idealCA = findCAForTargetNet(revenuIdealNet, coefficient, totalCharges, fiscalParams);
      const ideal = computeScenario('Revenu idéal', idealCA, coefficient, totalCharges, fiscalParams, revenuIdealNet);
      scenarios.push(ideal);
    }

    return { scenarios, breakevenCA };
  }, [baseData, fiscalParams, seuilViabiliteNet, revenuIdealNet]);
}
