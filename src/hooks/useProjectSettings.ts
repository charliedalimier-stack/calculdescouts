import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

const defaultSettings: Omit<ProjectSettings, 'id' | 'project_id' | 'created_at' | 'updated_at'> = {
  coefficient_min: 2.0,
  coefficient_cible: 2.5,
  marge_min: 30,
  marge_cible: 40,
  marge_btb: 30,
  marge_distributeur: 15,
  tva_vente: 5.5,
  tva_achat: 20,
  seuil_stock_alerte: 10,
  delai_paiement_client: 30,
  delai_paiement_fournisseur: 30,
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
    const tva = tauxTVA ?? settings?.tva_vente ?? 5.5;
    return prixHT * (1 + tva / 100);
  };

  const calculateHT = (prixTTC: number, tauxTVA?: number) => {
    const tva = tauxTVA ?? settings?.tva_vente ?? 5.5;
    return prixTTC / (1 + tva / 100);
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
  };
}
