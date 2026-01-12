import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useMode } from "@/contexts/ModeContext";
import { useProjectSettings } from "@/hooks/useProjectSettings";

export interface TVASummary {
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
  detailCollectee: {
    produit: string;
    ca_ht: number;
    taux_tva: number;
    tva: number;
  }[];
  detailDeductible: {
    type: "ingredient" | "packaging" | "variable_cost";
    nom: string;
    montant_ht: number;
    taux_tva: number;
    tva: number;
  }[];
}

export interface MonthlyTVA {
  mois: string;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
  resultatEconomique: number;
  resultatTresorerie: number;
}

export function useTVA(month?: string) {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const { settings } = useProjectSettings();

  const projectId = currentProject?.id;

  // Fetch products with sales for TVA collectée calculation
  const { data: salesData = [] } = useQuery({
    queryKey: ["tva-sales", projectId, mode, month],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from("sales_actuals")
        .select(`
          quantite_reelle,
          mois,
          product:products(
            id,
            nom_produit,
            prix_btc,
            tva_taux
          )
        `)
        .eq("project_id", projectId);

      if (month) {
        query = query.eq("mois", month);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch ingredients with quantities used
  const { data: ingredientData = [] } = useQuery({
    queryKey: ["tva-ingredients", projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("ingredients")
        .select("id, nom_ingredient, cout_unitaire, tva_taux")
        .eq("project_id", projectId)
        .eq("mode", mode);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch packaging
  const { data: packagingData = [] } = useQuery({
    queryKey: ["tva-packaging", projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("packaging")
        .select("id, nom, cout_unitaire, tva_taux")
        .eq("project_id", projectId)
        .eq("mode", mode);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch variable costs
  const { data: variableCostData = [] } = useQuery({
    queryKey: ["tva-variable-costs", projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("variable_costs")
        .select("id, nom, cout_unitaire, tva_taux")
        .eq("project_id", projectId)
        .eq("mode", mode);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch stock movements for actual purchases (TVA deductible)
  const { data: stockMovements = [] } = useQuery({
    queryKey: ["tva-stock-movements", projectId, month],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          stock:stocks(
            type_stock,
            ingredient_id,
            packaging_id,
            ingredient:ingredients(nom_ingredient, tva_taux),
            packaging:packaging(nom, tva_taux)
          )
        `)
        .eq("project_id", projectId)
        .eq("type_mouvement", "entree");

      if (month) {
        const startDate = `${month}-01`;
        const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))
          .toISOString()
          .split("T")[0];
        query = query.gte("created_at", startDate).lt("created_at", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Calculate TVA collectée (on sales)
  const defaultTvaVente = settings?.tva_vente || 5.5;
  const detailCollectee = salesData.map((sale) => {
    const product = sale.product as { nom_produit: string; prix_btc: number; tva_taux: number | null } | null;
    if (!product) return null;

    const tauxTva = product.tva_taux ?? defaultTvaVente;
    const caHT = sale.quantite_reelle * product.prix_btc;
    const tva = caHT * (tauxTva / 100);

    return {
      produit: product.nom_produit,
      ca_ht: caHT,
      taux_tva: tauxTva,
      tva,
    };
  }).filter(Boolean) as TVASummary["detailCollectee"];

  const tvaCollectee = detailCollectee.reduce((sum, d) => sum + d.tva, 0);

  // Calculate TVA déductible (on purchases from stock entries)
  const detailDeductible: TVASummary["detailDeductible"] = [];

  stockMovements.forEach((movement) => {
    const stock = movement.stock as {
      type_stock: string;
      ingredient?: { nom_ingredient: string; tva_taux: number | null };
      packaging?: { nom: string; tva_taux: number | null };
    } | null;

    if (!stock) return;

    const montantHT = movement.quantite * (movement.cout_unitaire || 0);
    let tauxTva = settings?.tva_achat || 20;
    let nom = "N/A";
    let type: "ingredient" | "packaging" | "variable_cost" = "ingredient";

    if (stock.type_stock === "ingredient" && stock.ingredient) {
      nom = stock.ingredient.nom_ingredient;
      tauxTva = stock.ingredient.tva_taux ?? tauxTva;
      type = "ingredient";
    } else if (stock.type_stock === "packaging" && stock.packaging) {
      nom = stock.packaging.nom;
      tauxTva = stock.packaging.tva_taux ?? tauxTva;
      type = "packaging";
    }

    detailDeductible.push({
      type,
      nom,
      montant_ht: montantHT,
      taux_tva: tauxTva,
      tva: montantHT * (tauxTva / 100),
    });
  });

  const tvaDeductible = detailDeductible.reduce((sum, d) => sum + d.tva, 0);
  const tvaNette = tvaCollectee - tvaDeductible;

  const summary: TVASummary = {
    tvaCollectee,
    tvaDeductible,
    tvaNette,
    detailCollectee,
    detailDeductible,
  };

  return {
    summary,
    tvaCollectee,
    tvaDeductible,
    tvaNette,
    defaultTvaVente,
    defaultTvaAchat: settings?.tva_achat || 20,
    isLoading: false,
  };
}

// Utility functions for TVA calculations
export function calculateTTC(montantHT: number, tauxTVA: number): number {
  return montantHT * (1 + tauxTVA / 100);
}

export function calculateHT(montantTTC: number, tauxTVA: number): number {
  return montantTTC / (1 + tauxTVA / 100);
}

export function calculateTVA(montantHT: number, tauxTVA: number): number {
  return montantHT * (tauxTVA / 100);
}

// Hook for monthly TVA tracking
export function useMonthlyTVA() {
  const { currentProject } = useProject();
  const { settings } = useProjectSettings();

  const projectId = currentProject?.id;

  const { data: monthlyData = [], isLoading } = useQuery({
    queryKey: ["monthly-tva", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get cash flow data with TVA
      const { data: cashFlowData, error } = await supabase
        .from("cash_flow")
        .select("*")
        .eq("project_id", projectId)
        .order("mois", { ascending: true });

      if (error) throw error;

      return (cashFlowData || []).map((cf) => ({
        mois: cf.mois,
        tvaCollectee: cf.tva_collectee || 0,
        tvaDeductible: cf.tva_deductible || 0,
        tvaNette: (cf.tva_collectee || 0) - (cf.tva_deductible || 0),
        resultatEconomique: cf.encaissements - cf.decaissements,
        resultatTresorerie:
          cf.encaissements -
          cf.decaissements +
          ((cf.tva_collectee || 0) - (cf.tva_deductible || 0)),
      })) as MonthlyTVA[];
    },
    enabled: !!projectId,
  });

  return {
    monthlyData,
    isLoading,
  };
}
