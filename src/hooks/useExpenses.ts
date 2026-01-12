import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { toast } from 'sonner';

export interface ProfessionalExpense {
  id: string;
  project_id: string;
  mois: string;
  categorie_frais: string;
  libelle: string;
  montant_ht: number;
  tva_taux: number | null;
  montant_ttc: number;
  mode: 'simulation' | 'reel';
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  mois: string;
  categorie_frais: string;
  libelle: string;
  montant_ht: number;
  tva_taux?: number | null;
}

export interface ExpenseSummary {
  total_ht: number;
  total_ttc: number;
  tva_deductible: number;
  by_category: { [key: string]: number };
  by_month: { [key: string]: number };
}

export const EXPENSE_CATEGORIES = [
  { value: 'loyer', label: 'Loyer' },
  { value: 'assurances', label: 'Assurances' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'telecom', label: 'Télécom' },
  { value: 'transport', label: 'Transport' },
  { value: 'energie', label: 'Énergie' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'formation', label: 'Formation' },
  { value: 'autres', label: 'Autres' },
];

export function useExpenses() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const queryClient = useQueryClient();

  // Fetch all expenses for current project and mode
  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['professional-expenses', currentProject?.id, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];

      const { data, error } = await supabase
        .from('professional_expenses')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .order('mois', { ascending: false });

      if (error) throw error;
      return data as ProfessionalExpense[];
    },
    enabled: !!currentProject?.id,
  });

  // Calculate summary
  const summary: ExpenseSummary = expenses.reduce(
    (acc, expense) => {
      const monthKey = expense.mois.substring(0, 7); // YYYY-MM
      const ht = Number(expense.montant_ht);
      const ttc = Number(expense.montant_ttc);
      const tva = ttc - ht;

      acc.total_ht += ht;
      acc.total_ttc += ttc;
      acc.tva_deductible += tva;
      acc.by_category[expense.categorie_frais] = (acc.by_category[expense.categorie_frais] || 0) + ht;
      acc.by_month[monthKey] = (acc.by_month[monthKey] || 0) + ht;

      return acc;
    },
    { total_ht: 0, total_ttc: 0, tva_deductible: 0, by_category: {}, by_month: {} } as ExpenseSummary
  );

  // Get expenses for a specific month
  const getExpensesByMonth = (month: string) => {
    return expenses.filter((e) => e.mois.startsWith(month));
  };

  // Get expenses for a specific year
  const getExpensesByYear = (year: number) => {
    return expenses.filter((e) => e.mois.startsWith(year.toString()));
  };

  // Calculate monthly total for a specific month
  const getMonthlyTotal = (month: string): number => {
    return getExpensesByMonth(month).reduce((sum, e) => sum + Number(e.montant_ht), 0);
  };

  // Calculate annual total for a specific year
  const getAnnualTotal = (year: number): number => {
    return getExpensesByYear(year).reduce((sum, e) => sum + Number(e.montant_ht), 0);
  };

  // Add expense
  const addExpense = useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { data, error } = await supabase
        .from('professional_expenses')
        .insert({
          ...expense,
          project_id: currentProject.id,
          mode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-expenses', currentProject?.id, mode] });
      toast.success('Frais ajouté avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout: ' + error.message);
    },
  });

  // Update expense
  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProfessionalExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from('professional_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-expenses', currentProject?.id, mode] });
      toast.success('Frais mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Delete expense
  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-expenses', currentProject?.id, mode] });
      toast.success('Frais supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Duplicate month expenses to another month
  const duplicateMonth = useMutation({
    mutationFn: async ({ sourceMonth, targetMonth }: { sourceMonth: string; targetMonth: string }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const sourceExpenses = getExpensesByMonth(sourceMonth);
      
      const newExpenses = sourceExpenses.map((e) => ({
        project_id: currentProject.id,
        mois: targetMonth + '-01',
        categorie_frais: e.categorie_frais,
        libelle: e.libelle,
        montant_ht: e.montant_ht,
        tva_taux: e.tva_taux,
        mode,
      }));

      if (newExpenses.length === 0) {
        throw new Error('Aucun frais à dupliquer pour ce mois');
      }

      const { error } = await supabase
        .from('professional_expenses')
        .insert(newExpenses);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-expenses', currentProject?.id, mode] });
      toast.success('Frais dupliqués avec succès');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    expenses,
    summary,
    isLoading,
    error,
    getExpensesByMonth,
    getExpensesByYear,
    getMonthlyTotal,
    getAnnualTotal,
    addExpense,
    updateExpense,
    deleteExpense,
    duplicateMonth,
  };
}
