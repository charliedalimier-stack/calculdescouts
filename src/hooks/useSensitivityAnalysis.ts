import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useProducts, ProductWithCosts } from './useProducts';
import { useCategories } from './useCategories';
import { toast } from 'sonner';
import { useMemo } from 'react';

export interface SensitivityScenario {
  id: string;
  project_id: string;
  product_id: string | null;
  category_id: string | null;
  nom_scenario: string;
  variation_cout_matieres: number;
  variation_prix_vente: number;
  variation_volume: number;
  impact_cout_revient: number | null;
  impact_marge: number | null;
  impact_rentabilite: number | null;
  impact_cash_flow: number | null;
  created_at: string;
}

export interface SensitivityResult {
  variation: number;
  cout_revient: number;
  marge: number;
  marge_percent: number;
  rentabilite: number;
  ca: number;
}

export interface SensitivityAnalysisData {
  product: ProductWithCosts;
  base: SensitivityResult;
  costVariations: SensitivityResult[];
  priceVariations: SensitivityResult[];
  volumeVariations: SensitivityResult[];
}

export function useSensitivityAnalysis() {
  const { currentProject } = useProject();
  const { productsWithCosts, isLoadingWithCosts } = useProducts();
  const { categories } = useCategories();
  const queryClient = useQueryClient();

  // Fetch saved scenarios
  const { data: scenarios = [], isLoading: isLoadingScenarios } = useQuery({
    queryKey: ['sensitivity-scenarios', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('sensitivity_scenarios')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SensitivityScenario[];
    },
    enabled: !!currentProject?.id,
  });

  // Calculate sensitivity for a product
  const calculateSensitivity = (
    product: ProductWithCosts,
    variationType: 'cost' | 'price' | 'volume',
    variationPercent: number,
    baseVolume: number = 100
  ): SensitivityResult => {
    let coutRevient = product.cost_total;
    let prixVente = product.prix_btc;
    let volume = baseVolume;

    switch (variationType) {
      case 'cost':
        coutRevient = product.cost_total * (1 + variationPercent / 100);
        break;
      case 'price':
        prixVente = product.prix_btc * (1 + variationPercent / 100);
        break;
      case 'volume':
        volume = baseVolume * (1 + variationPercent / 100);
        break;
    }

    const marge = prixVente - coutRevient;
    const margePercent = prixVente > 0 ? (marge / prixVente) * 100 : 0;
    const ca = prixVente * volume;
    const rentabilite = marge * volume;

    return {
      variation: variationPercent,
      cout_revient: coutRevient,
      marge,
      marge_percent: margePercent,
      rentabilite,
      ca,
    };
  };

  // Generate full sensitivity analysis for a product
  const getProductSensitivity = (
    productId: string,
    baseVolume: number = 100
  ): SensitivityAnalysisData | null => {
    const product = productsWithCosts.find(p => p.id === productId);
    if (!product) return null;

    const variations = [-30, -20, -10, 0, 10, 20, 30];

    const base = calculateSensitivity(product, 'cost', 0, baseVolume);
    
    const costVariations = variations.map(v => 
      calculateSensitivity(product, 'cost', v, baseVolume)
    );
    
    const priceVariations = variations.map(v => 
      calculateSensitivity(product, 'price', v, baseVolume)
    );
    
    const volumeVariations = variations.map(v => 
      calculateSensitivity(product, 'volume', v, baseVolume)
    );

    return {
      product,
      base,
      costVariations,
      priceVariations,
      volumeVariations,
    };
  };

  // Calculate category sensitivity
  const getCategorySensitivity = (
    categoryId: string,
    baseVolume: number = 100
  ) => {
    const categoryProducts = productsWithCosts.filter(
      p => p.categorie_id === categoryId
    );

    if (categoryProducts.length === 0) return null;

    const variations = [-30, -20, -10, 0, 10, 20, 30];

    // Aggregate calculations
    const aggregateSensitivity = (
      variationType: 'cost' | 'price' | 'volume',
      variationPercent: number
    ): SensitivityResult => {
      let totalCoutRevient = 0;
      let totalMarge = 0;
      let totalCA = 0;
      let totalRentabilite = 0;

      categoryProducts.forEach(product => {
        const result = calculateSensitivity(
          product,
          variationType,
          variationPercent,
          baseVolume
        );
        totalCoutRevient += result.cout_revient;
        totalMarge += result.marge;
        totalCA += result.ca;
        totalRentabilite += result.rentabilite;
      });

      const avgMargePercent = totalCA > 0 
        ? (totalMarge * categoryProducts.length / totalCA) * 100 
        : 0;

      return {
        variation: variationPercent,
        cout_revient: totalCoutRevient / categoryProducts.length,
        marge: totalMarge / categoryProducts.length,
        marge_percent: avgMargePercent,
        rentabilite: totalRentabilite,
        ca: totalCA,
      };
    };

    return {
      categoryProducts,
      costVariations: variations.map(v => aggregateSensitivity('cost', v)),
      priceVariations: variations.map(v => aggregateSensitivity('price', v)),
      volumeVariations: variations.map(v => aggregateSensitivity('volume', v)),
    };
  };

  // Save scenario
  const saveScenario = useMutation({
    mutationFn: async (scenario: Omit<SensitivityScenario, 'id' | 'created_at' | 'project_id'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('sensitivity_scenarios')
        .insert({
          ...scenario,
          project_id: currentProject.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitivity-scenarios', currentProject?.id] });
      toast.success('Scénario sauvegardé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Delete scenario
  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sensitivity_scenarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitivity-scenarios', currentProject?.id] });
      toast.success('Scénario supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    scenarios,
    productsWithCosts,
    categories,
    isLoading: isLoadingScenarios || isLoadingWithCosts,
    getProductSensitivity,
    getCategorySensitivity,
    calculateSensitivity,
    saveScenario,
    deleteScenario,
  };
}
