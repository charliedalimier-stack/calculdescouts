import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useCashFlow, CashFlowData } from './useCashFlow';
import { toast } from 'sonner';

export interface StressScenario {
  id: string;
  project_id: string;
  nom_scenario: string;
  baisse_ventes_pct: number;
  hausse_cout_matieres_pct: number;
  retard_paiement_jours: number;
  augmentation_stock_pct: number;
  cash_flow_projete: number[];
  besoin_tresorerie_max: number;
  mois_tension_critique: number | null;
  created_at: string;
}

export interface StressTestParams {
  baisseVentesPct: number;
  hausseCoutMatieresPct: number;
  retardPaiementJours: number;
  augmentationStockPct: number;
}

export interface StressTestResult {
  mois: number;
  monthLabel: string;
  cashFlowBase: number;
  cashFlowStress: number;
  cumulBase: number;
  cumulStress: number;
  ecart: number;
  ecartPct: number;
  isNegative: boolean;
  isCritical: boolean;
}

export interface StressTestSummary {
  besoinTresorerieMax: number;
  moisTensionCritique: number | null;
  impactTotalCA: number;
  impactTotalCouts: number;
  delaiRecuperationMois: number | null;
  risqueLevel: 'low' | 'medium' | 'high' | 'critical';
  scenarioName: string;
}

export function useStressTest() {
  const { currentProject } = useProject();
  const { cashFlowData, isLoading: isLoadingCashFlow } = useCashFlow();
  const queryClient = useQueryClient();

  // Récupérer les scénarios sauvegardés
  const { data: savedScenarios = [], isLoading: isLoadingScenarios } = useQuery({
    queryKey: ['stress-scenarios', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('cashflow_stress_tests')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StressScenario[];
    },
    enabled: !!currentProject?.id,
  });

  // Scénarios prédéfinis
  const predefinedScenarios: { name: string; params: StressTestParams }[] = [
    {
      name: 'Retard paiement clients (30j)',
      params: { baisseVentesPct: 0, hausseCoutMatieresPct: 0, retardPaiementJours: 30, augmentationStockPct: 0 },
    },
    {
      name: 'Retard paiement clients (60j)',
      params: { baisseVentesPct: 0, hausseCoutMatieresPct: 0, retardPaiementJours: 60, augmentationStockPct: 0 },
    },
    {
      name: 'Baisse ventes -20%',
      params: { baisseVentesPct: 20, hausseCoutMatieresPct: 0, retardPaiementJours: 0, augmentationStockPct: 0 },
    },
    {
      name: 'Baisse ventes -30%',
      params: { baisseVentesPct: 30, hausseCoutMatieresPct: 0, retardPaiementJours: 0, augmentationStockPct: 0 },
    },
    {
      name: 'Hausse coûts +15%',
      params: { baisseVentesPct: 0, hausseCoutMatieresPct: 15, retardPaiementJours: 0, augmentationStockPct: 0 },
    },
    {
      name: 'Hausse coûts +25%',
      params: { baisseVentesPct: 0, hausseCoutMatieresPct: 25, retardPaiementJours: 0, augmentationStockPct: 0 },
    },
    {
      name: 'Accumulation stock +50%',
      params: { baisseVentesPct: 0, hausseCoutMatieresPct: 0, retardPaiementJours: 0, augmentationStockPct: 50 },
    },
    {
      name: 'Scénario crise modérée',
      params: { baisseVentesPct: 15, hausseCoutMatieresPct: 10, retardPaiementJours: 15, augmentationStockPct: 20 },
    },
    {
      name: 'Scénario crise sévère',
      params: { baisseVentesPct: 30, hausseCoutMatieresPct: 20, retardPaiementJours: 45, augmentationStockPct: 40 },
    },
  ];

  // Calculer l'impact d'un stress test
  const calculateStressTest = (params: StressTestParams): StressTestResult[] => {
    if (cashFlowData.length === 0) return [];

    const results: StressTestResult[] = [];
    let cumulBase = 0;
    let cumulStress = 0;
    let retardBuffer: number[] = []; // Buffer pour simuler les retards de paiement

    cashFlowData.forEach((entry, index) => {
      // Impact sur les encaissements
      let encaissementsStress = entry.encaissements;
      
      // Baisse des ventes
      encaissementsStress = encaissementsStress * (1 - params.baisseVentesPct / 100);
      
      // Retard de paiement : décaler les encaissements
      if (params.retardPaiementJours > 0) {
        const monthsDelay = Math.ceil(params.retardPaiementJours / 30);
        retardBuffer.push(encaissementsStress);
        
        if (index >= monthsDelay) {
          encaissementsStress = retardBuffer[index - monthsDelay] || 0;
        } else {
          encaissementsStress = 0; // Pas d'encaissement pendant les premiers mois
        }
      }

      // Impact sur les décaissements
      let decaissementsStress = entry.decaissements;
      
      // Hausse des coûts matières (supposons 60% des décaissements sont des matières)
      const coutsMatieres = decaissementsStress * 0.6;
      const autresCouts = decaissementsStress * 0.4;
      decaissementsStress = autresCouts + coutsMatieres * (1 + params.hausseCoutMatieresPct / 100);
      
      // Augmentation du stock (impact sur le BFR)
      if (params.augmentationStockPct > 0) {
        const impactStock = coutsMatieres * (params.augmentationStockPct / 100);
        decaissementsStress += impactStock;
      }

      const cashFlowBase = entry.encaissements - entry.decaissements;
      const cashFlowStress = encaissementsStress - decaissementsStress;
      
      cumulBase += cashFlowBase;
      cumulStress += cashFlowStress;

      const ecart = cashFlowStress - cashFlowBase;
      const ecartPct = cashFlowBase !== 0 ? (ecart / Math.abs(cashFlowBase)) * 100 : 0;

      results.push({
        mois: index + 1,
        monthLabel: entry.monthLabel,
        cashFlowBase,
        cashFlowStress,
        cumulBase,
        cumulStress,
        ecart,
        ecartPct,
        isNegative: cumulStress < 0,
        isCritical: cumulStress < -10000, // Seuil critique arbitraire
      });
    });

    return results;
  };

  // Calculer le résumé d'un stress test
  const getStressTestSummary = (params: StressTestParams, scenarioName: string): StressTestSummary => {
    const results = calculateStressTest(params);
    
    if (results.length === 0) {
      return {
        besoinTresorerieMax: 0,
        moisTensionCritique: null,
        impactTotalCA: 0,
        impactTotalCouts: 0,
        delaiRecuperationMois: null,
        risqueLevel: 'low',
        scenarioName,
      };
    }

    // Besoin max de trésorerie (point le plus bas)
    const minCumul = Math.min(...results.map(r => r.cumulStress));
    const besoinTresorerieMax = minCumul < 0 ? Math.abs(minCumul) : 0;

    // Mois de tension critique (premier mois négatif)
    const premierMoisNegatif = results.find(r => r.cumulStress < 0);
    const moisTensionCritique = premierMoisNegatif ? premierMoisNegatif.mois : null;

    // Impact total CA
    const impactTotalCA = results.reduce((sum, r) => sum + (r.cashFlowBase - r.cashFlowStress), 0);
    
    // Impact total sur les coûts
    const impactTotalCouts = cashFlowData.reduce((sum, entry) => {
      const coutsMatieres = entry.decaissements * 0.6;
      return sum + (coutsMatieres * params.hausseCoutMatieresPct / 100);
    }, 0);

    // Délai de récupération (retour au positif après passage en négatif)
    let delaiRecuperationMois: number | null = null;
    if (moisTensionCritique) {
      const recuperation = results.find((r, i) => i >= moisTensionCritique - 1 && r.cumulStress >= 0);
      if (recuperation) {
        delaiRecuperationMois = recuperation.mois - moisTensionCritique;
      }
    }

    // Niveau de risque
    let risqueLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (besoinTresorerieMax > 50000 || moisTensionCritique !== null && moisTensionCritique <= 2) {
      risqueLevel = 'critical';
    } else if (besoinTresorerieMax > 20000 || moisTensionCritique !== null && moisTensionCritique <= 4) {
      risqueLevel = 'high';
    } else if (besoinTresorerieMax > 5000 || moisTensionCritique !== null) {
      risqueLevel = 'medium';
    }

    return {
      besoinTresorerieMax,
      moisTensionCritique,
      impactTotalCA,
      impactTotalCouts,
      delaiRecuperationMois,
      risqueLevel,
      scenarioName,
    };
  };

  // Comparer plusieurs scénarios
  const compareScenarios = (scenarioParams: { name: string; params: StressTestParams }[]): StressTestSummary[] => {
    return scenarioParams.map(({ name, params }) => getStressTestSummary(params, name));
  };

  // Sauvegarder un scénario
  const saveScenario = useMutation({
    mutationFn: async ({ name, params }: { name: string; params: StressTestParams }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const results = calculateStressTest(params);
      const summary = getStressTestSummary(params, name);
      const cashFlowProjecte = results.map(r => r.cumulStress);

      const { data, error } = await supabase
        .from('cashflow_stress_tests')
        .insert({
          project_id: currentProject.id,
          nom_scenario: name,
          baisse_ventes_pct: params.baisseVentesPct,
          hausse_cout_matieres_pct: params.hausseCoutMatieresPct,
          retard_paiement_jours: params.retardPaiementJours,
          augmentation_stock_pct: params.augmentationStockPct,
          cash_flow_projete: cashFlowProjecte,
          besoin_tresorerie_max: summary.besoinTresorerieMax,
          mois_tension_critique: summary.moisTensionCritique,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stress-scenarios', currentProject?.id] });
      toast.success('Scénario sauvegardé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Supprimer un scénario
  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cashflow_stress_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stress-scenarios', currentProject?.id] });
      toast.success('Scénario supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    cashFlowData,
    savedScenarios,
    predefinedScenarios,
    isLoading: isLoadingCashFlow || isLoadingScenarios,
    calculateStressTest,
    getStressTestSummary,
    compareScenarios,
    saveScenario,
    deleteScenario,
  };
}
