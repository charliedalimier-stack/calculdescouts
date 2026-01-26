import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface TaxBracket {
  id: string;
  project_id: string;
  tranche_min: number;
  tranche_max: number | null;
  taux: number;
  ordre: number;
  created_at: string;
  updated_at: string;
}

// Belgian default tax brackets for 2026
export const DEFAULT_TAX_BRACKETS = [
  { tranche_min: 0, tranche_max: 15820, taux: 25, ordre: 1 },
  { tranche_min: 15820, tranche_max: 27920, taux: 40, ordre: 2 },
  { tranche_min: 27920, tranche_max: 48320, taux: 45, ordre: 3 },
  { tranche_min: 48320, tranche_max: null, taux: 50, ordre: 4 },
];

export function useTaxBrackets() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();

  const { data: brackets, isLoading } = useQuery({
    queryKey: ['tax-brackets', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      const { data, error } = await supabase
        .from('tax_brackets')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('ordre', { ascending: true });

      if (error) throw error;

      // If no brackets exist, create defaults
      if (!data || data.length === 0) {
        const defaultBrackets = DEFAULT_TAX_BRACKETS.map(b => ({
          ...b,
          project_id: currentProject.id,
        }));

        const { data: newBrackets, error: insertError } = await supabase
          .from('tax_brackets')
          .insert(defaultBrackets)
          .select();

        if (insertError) throw insertError;
        return (newBrackets as TaxBracket[]) || [];
      }

      return data as TaxBracket[];
    },
    enabled: !!currentProject?.id,
  });

  const updateBracket = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaxBracket> & { id: string }) => {
      const { data, error } = await supabase
        .from('tax_brackets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-brackets', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['financial-plan'] });
      toast.success('Tranche mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const addBracket = useMutation({
    mutationFn: async (bracket: Omit<TaxBracket, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { data, error } = await supabase
        .from('tax_brackets')
        .insert({ ...bracket, project_id: currentProject.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-brackets', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['financial-plan'] });
      toast.success('Tranche ajoutée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteBracket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_brackets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-brackets', currentProject?.id] });
      queryClient.invalidateQueries({ queryKey: ['financial-plan'] });
      toast.success('Tranche supprimée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Calculate tax based on taxable income
  const calculateTax = (baseImposable: number): { impotBrut: number; details: { tranche: string; montant: number; taux: number }[] } => {
    if (baseImposable <= 0 || !brackets || brackets.length === 0) {
      return { impotBrut: 0, details: [] };
    }

    let impotBrut = 0;
    const details: { tranche: string; montant: number; taux: number }[] = [];
    let remainingIncome = baseImposable;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const bracketMin = Number(bracket.tranche_min);
      const bracketMax = bracket.tranche_max !== null ? Number(bracket.tranche_max) : Infinity;
      const taux = Number(bracket.taux) / 100;

      const taxableInBracket = Math.min(remainingIncome, bracketMax - bracketMin);
      
      if (taxableInBracket > 0) {
        const taxForBracket = taxableInBracket * taux;
        impotBrut += taxForBracket;
        
        details.push({
          tranche: bracket.tranche_max !== null 
            ? `${bracketMin.toLocaleString('fr-BE')} - ${bracketMax.toLocaleString('fr-BE')} €`
            : `> ${bracketMin.toLocaleString('fr-BE')} €`,
          montant: taxForBracket,
          taux: Number(bracket.taux),
        });

        remainingIncome -= taxableInBracket;
      }
    }

    return { impotBrut, details };
  };

  return {
    brackets: brackets || [],
    isLoading,
    updateBracket,
    addBracket,
    deleteBracket,
    calculateTax,
  };
}
