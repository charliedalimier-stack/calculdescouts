import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type VATRegime = 'assujetti_normal' | 'franchise_taxe';

export interface ProjectSettings {
  id: string;
  project_id: string;
  coefficient_min: number;
  coefficient_cible: number;
  marge_min: number;
  marge_cible: number;
  marge_btb: number;
  marge_distributeur: number;
  tva_vente: number;
  tva_achat: number;
  seuil_stock_alerte: number;
  delai_paiement_client: number;
  delai_paiement_fournisseur: number;
  // Belgian VAT fields
  pays: string;
  regime_tva: VATRegime;
  tva_standard: number;
  tva_reduit_1: number;
  tva_reduit_2: number;
  // Social contributions
  taux_cotisations_sociales: number;
  created_at: string;
  updated_at: string;
}

// Belgian VAT rates
export const BELGIAN_VAT_RATES = {
  standard: 21,
  reduced1: 12, // Certain processed food
  reduced2: 6,  // Basic food products
} as const;

const defaultSettings: Omit<ProjectSettings, 'id' | 'project_id' | 'created_at' | 'updated_at'> = {
  coefficient_min: 2.0,
  coefficient_cible: 2.5,
  marge_min: 30,
  marge_cible: 40,
  marge_btb: 30,
  marge_distributeur: 15,
  tva_vente: 6,      // Belgian reduced rate for food
  tva_achat: 21,     // Belgian standard rate
  seuil_stock_alerte: 10,
  delai_paiement_client: 30,
  delai_paiement_fournisseur: 30,
  // Belgian VAT defaults
  pays: 'Belgique',
  regime_tva: 'assujetti_normal',
  tva_standard: 21,
  tva_reduit_1: 12,
  tva_reduit_2: 6,
  // Social contributions
  taux_cotisations_sociales: 20.5,
};

export function useProjectSettings() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['project-settings', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return null;

      const { data, error } = await supabase
        .from('project_settings')
        .select('*')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('project_settings')
          .insert({ ...defaultSettings, project_id: currentProject.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as ProjectSettings;
      }

      return data as ProjectSettings;
    },
    enabled: !!currentProject?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<ProjectSettings, 'id' | 'project_id' | 'created_at' | 'updated_at'>>) => {
      if (!settings?.id) throw new Error('Aucun paramètre à mettre à jour');

      const { data, error } = await supabase
        .from('project_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-settings', currentProject?.id] });
      toast.success('Paramètres mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Computed values based on settings
  const getMarginStatus = (margin: number) => {
    if (!settings) return 'ok';
    if (margin >= settings.marge_cible) return 'ok';
    if (margin >= settings.marge_min) return 'a_optimiser';
    return 'non_viable';
  };

  const getCoefficientStatus = (coefficient: number) => {
    if (!settings) return 'ok';
    if (coefficient >= settings.coefficient_cible) return 'ok';
    if (coefficient >= settings.coefficient_min) return 'a_optimiser';
    return 'non_viable';
  };

  const calculatePrixBtb = (prixBtc: number) => {
    if (!settings) return prixBtc * 0.7;
    return prixBtc * (1 - settings.marge_btb / 100);
  };

  const calculatePrixDistributeur = (prixBtb: number) => {
    if (!settings) return prixBtb * 0.85;
    return prixBtb * (1 - settings.marge_distributeur / 100);
  };

  const calculateTTC = (prixHT: number, tauxTVA?: number) => {
    // If franchise_taxe regime, no VAT is applied
    if (settings?.regime_tva === 'franchise_taxe') {
      return prixHT;
    }
    const tva = tauxTVA ?? settings?.tva_vente ?? 6;
    return prixHT * (1 + tva / 100);
  };

  const calculateHT = (prixTTC: number, tauxTVA?: number) => {
    // If franchise_taxe regime, no VAT is applied
    if (settings?.regime_tva === 'franchise_taxe') {
      return prixTTC;
    }
    const tva = tauxTVA ?? settings?.tva_vente ?? 6;
    return prixTTC / (1 + tva / 100);
  };

  // Check if VAT applies (based on regime)
  const isVATApplicable = () => {
    return settings?.regime_tva !== 'franchise_taxe';
  };

  // Get available VAT rates for Belgium
  const getAvailableVATRates = () => {
    if (!settings) return [6, 12, 21];
    return [
      settings.tva_reduit_2, // 6%
      settings.tva_reduit_1, // 12%
      settings.tva_standard, // 21%
    ];
  };

  return {
    settings: settings || defaultSettings as any,
    isLoading,
    updateSettings,
    getMarginStatus,
    getCoefficientStatus,
    calculatePrixBtb,
    calculatePrixDistributeur,
    calculateTTC,
    calculateHT,
    isVATApplicable,
    getAvailableVATRates,
    BELGIAN_VAT_RATES,
  };
}
