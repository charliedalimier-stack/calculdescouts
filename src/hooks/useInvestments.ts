import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface Investment {
  id: string;
  project_id: string;
  nom: string;
  categorie: string;
  montant_ht: number;
  tva_taux: number;
  date_achat: string;
  duree_amortissement: number;
  mode: string;
  created_at: string;
  updated_at: string;
}

export interface Financing {
  id: string;
  project_id: string;
  type_financement: string;
  montant: number;
  date_debut: string;
  duree_mois: number;
  taux_interet: number;
  mode: string;
  created_at: string;
  updated_at: string;
}

export function useInvestments(mode: string = 'budget') {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();
  const projectId = currentProject?.id;

  const investmentsQuery = useQuery({
    queryKey: ['investments', projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', mode)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!projectId,
  });

  const financingsQuery = useQuery({
    queryKey: ['financings', projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('financings')
        .select('*')
        .eq('project_id', projectId)
        .eq('mode', mode)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Financing[];
    },
    enabled: !!projectId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['investments', projectId, mode] });
    queryClient.invalidateQueries({ queryKey: ['financings', projectId, mode] });
  };

  const addInvestment = useMutation({
    mutationFn: async (inv: Omit<Investment, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
      if (!projectId) throw new Error('No project');
      const { error } = await supabase.from('investments').insert({ ...inv, project_id: projectId });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Investissement ajouté'); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Investment> & { id: string }) => {
      const { error } = await supabase.from('investments').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Investissement mis à jour'); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('investments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Investissement supprimé'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const addFinancing = useMutation({
    mutationFn: async (fin: Omit<Financing, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
      if (!projectId) throw new Error('No project');
      const { error } = await supabase.from('financings').insert({ ...fin, project_id: projectId });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Financement ajouté'); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateFinancing = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Financing> & { id: string }) => {
      const { error } = await supabase.from('financings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Financement mis à jour'); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteFinancing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Financement supprimé'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const investments = investmentsQuery.data ?? [];
  const financings = financingsQuery.data ?? [];

  const totalInvestments = investments.reduce((s, i) => s + Number(i.montant_ht), 0);
  const totalInvestmentsTTC = investments.reduce((s, i) => s + Number(i.montant_ht) * (1 + Number(i.tva_taux) / 100), 0);
  const totalFinancings = financings.reduce((s, f) => s + Number(f.montant), 0);
  const besoinFinancement = totalInvestments - totalFinancings;

  return {
    investments,
    financings,
    isLoading: investmentsQuery.isLoading || financingsQuery.isLoading,
    totalInvestments,
    totalInvestmentsTTC,
    totalFinancings,
    besoinFinancement,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addFinancing,
    updateFinancing,
    deleteFinancing,
  };
}
