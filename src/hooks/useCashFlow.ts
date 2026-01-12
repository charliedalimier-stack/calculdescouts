import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface CashFlowEntry {
  id: string;
  project_id: string;
  mois: string;
  encaissements: number;
  decaissements: number;
  delai_paiement_jours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlowData {
  month: string;
  monthLabel: string;
  encaissements: number;
  decaissements: number;
  solde: number;
  cumul: number;
}

export function useCashFlow() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: cashFlowEntries = [], isLoading } = useQuery({
    queryKey: ['cash-flow', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('mois', { ascending: true });
      
      if (error) throw error;
      return data as CashFlowEntry[];
    },
    enabled: !!currentProject?.id,
  });

  // Transform entries into chart-ready data with cumulative calculation
  const cashFlowData: CashFlowData[] = cashFlowEntries.reduce((acc: CashFlowData[], entry, index) => {
    const encaissements = Number(entry.encaissements);
    const decaissements = Number(entry.decaissements);
    const solde = encaissements - decaissements;
    const previousCumul = index > 0 ? acc[index - 1].cumul : 0;
    
    const date = new Date(entry.mois);
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });

    acc.push({
      month: entry.mois,
      monthLabel,
      encaissements,
      decaissements,
      solde,
      cumul: previousCumul + solde,
    });

    return acc;
  }, []);

  const currentMonth = cashFlowData[cashFlowData.length - 1] || {
    encaissements: 0,
    decaissements: 0,
    solde: 0,
    cumul: 0,
  };

  const hasNegativeCashFlow = cashFlowData.some(d => d.cumul < 0);

  const addCashFlowEntry = useMutation({
    mutationFn: async (entry: Omit<CashFlowEntry, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');
      
      const { data, error } = await supabase
        .from('cash_flow')
        .insert({ ...entry, project_id: currentProject.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow', currentProject?.id] });
      toast.success('Entrée cash-flow ajoutée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const updateCashFlowEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CashFlowEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('cash_flow')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow', currentProject?.id] });
      toast.success('Entrée mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteCashFlowEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_flow')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow', currentProject?.id] });
      toast.success('Entrée supprimée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    cashFlowEntries,
    cashFlowData,
    currentMonth,
    hasNegativeCashFlow,
    isLoading,
    addCashFlowEntry,
    updateCashFlowEntry,
    deleteCashFlowEntry,
  };
}
