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

export function useTVA(options?: { month?: number; year?: number; mode?: string }) {
  const { currentProject } = useProject();
  const { mode: contextMode } = useMode();
  const { settings } = useProjectSettings();
  const mode = options?.mode || contextMode;
  const month = options?.month;
  const year = options?.year || new Date().getFullYear();

  const projectId = currentProject?.id;
  const isFranchise = settings?.regime_tva === 'franchise_taxe';
  const defaultTvaVente = settings?.tva_vente || 6;
  const defaultTvaAchat = settings?.tva_achat || 21;

  // Unified query: fetch all data needed for TVA calculation
  const { data: tvaData, isLoading } = useQuery({
    queryKey: ["tva-calculation", projectId, mode, year, month],
    queryFn: async () => {
      if (!projectId) return null;

      // 1. Fetch products (always from budget - canonical catalog)
      const { data: products } = await supabase
        .from("products")
        .select("id, nom_produit, prix_btc, tva_taux, categorie_id")
        .eq("project_id", projectId)
        .eq("mode", "budget");

      if (!products || products.length === 0) return null;

      // 2. Fetch product prices (always from budget)
      const { data: productPrices } = await supabase
        .from("product_prices")
        .select("product_id, categorie_prix, prix_ht, tva_taux")
        .in("product_id", products.map(p => p.id))
        .eq("mode", "budget");

      // 3. Fetch sales based on mode
      interface SaleEntry {
        product_id: string;
        categorie_prix: string;
        quantity: number;
      }
      const sales: SaleEntry[] = [];

      if (mode === "reel") {
        let query = supabase
          .from("monthly_sales_reel")
          .select("product_id, categorie_prix, quantite, month, year")
          .eq("project_id", projectId)
          .eq("year", year);

        const { data: reelSales } = await query;

        (reelSales || []).forEach(s => {
          const sMonth = new Date(s.month).getMonth() + 1;
          if (month && sMonth !== month) return;
          const qty = Number(s.quantite || 0);
          if (qty > 0) {
            sales.push({
              product_id: s.product_id,
              categorie_prix: s.categorie_prix || "BTC",
              quantity: qty,
            });
          }
        });
      } else {
        // Budget: annual_sales + seasonality
        const { data: annualSales } = await supabase
          .from("annual_sales")
          .select("product_id, categorie_prix, quantite_annuelle")
          .eq("project_id", projectId)
          .eq("mode", "budget")
          .eq("year", year);

        const { data: seasonality } = await supabase
          .from("seasonality_coefficients")
          .select("*")
          .eq("project_id", projectId)
          .eq("mode", "budget")
          .eq("year", year)
          .maybeSingle();

        const getMonthCoef = (monthIndex: number): number => {
          if (!seasonality) return 8.33 / 100;
          const key = `month_${(monthIndex + 1).toString().padStart(2, "0")}` as keyof typeof seasonality;
          return (Number(seasonality[key]) || 8.33) / 100;
        };

        (annualSales || []).forEach(annual => {
          if (month) {
            const coef = getMonthCoef(month - 1);
            const qty = Math.round(annual.quantite_annuelle * coef);
            if (qty > 0) {
              sales.push({
                product_id: annual.product_id,
                categorie_prix: annual.categorie_prix,
                quantity: qty,
              });
            }
          } else {
            // Full year
            sales.push({
              product_id: annual.product_id,
              categorie_prix: annual.categorie_prix,
              quantity: annual.quantite_annuelle,
            });
          }
        });
      }

      // 4. Fetch recipes, packaging, variable costs for TVA déductible (always budget)
      const { data: recipes } = await supabase
        .from("recipes")
        .select("product_id, quantite_utilisee, ingredients(nom_ingredient, cout_unitaire, tva_taux)")
        .eq("mode", "budget");

      const { data: pkgLinks } = await supabase
        .from("product_packaging")
        .select("product_id, quantite, packaging(nom, cout_unitaire, tva_taux)")
        .eq("mode", "budget");

      const { data: vcLinks } = await supabase
        .from("product_variable_costs")
        .select("product_id, quantite, variable_costs(nom, cout_unitaire, tva_taux)")
        .eq("mode", "budget");

      // 5. Fetch professional expenses
      let expQuery = supabase
        .from("professional_expenses")
        .select("libelle, montant_ht, tva_taux, montant_ttc")
        .eq("project_id", projectId)
        .eq("mode", mode);

      if (month) {
        const monthStr = month.toString().padStart(2, "0");
        expQuery = expQuery.gte("mois", `${year}-${monthStr}-01`).lte("mois", `${year}-${monthStr}-31`);
      } else {
        expQuery = expQuery.gte("mois", `${year}-01-01`).lte("mois", `${year}-12-31`);
      }

      const { data: expenses } = await expQuery;

      return { products, productPrices, sales, recipes, pkgLinks, vcLinks, expenses };
    },
    enabled: !!projectId,
  });

  // Build price lookup
  const priceMap: Record<string, { prix_ht: number; tva_taux: number }> = {};
  (tvaData?.productPrices || []).forEach(pp => {
    priceMap[`${pp.product_id}-${pp.categorie_prix}`] = {
      prix_ht: Number(pp.prix_ht),
      tva_taux: Number(pp.tva_taux),
    };
  });

  // Calculate TVA collectée from sales
  const productMap = new Map((tvaData?.products || []).map(p => [p.id, p]));

  // Aggregate sales by product for detail
  const salesByProduct: Record<string, { produit: string; ca_ht: number; taux_tva: number; tva: number }> = {};

  (tvaData?.sales || []).forEach(sale => {
    const product = productMap.get(sale.product_id);
    if (!product) return;

    const priceKey = `${product.id}-${sale.categorie_prix}`;
    const priceInfo = priceMap[priceKey];
    const prixHt = priceInfo?.prix_ht ?? Number(product.prix_btc);
    const tauxTva = priceInfo?.tva_taux ?? Number(product.tva_taux) ?? defaultTvaVente;

    const caHt = sale.quantity * prixHt;
    const tvaAmount = isFranchise ? 0 : caHt * (tauxTva / 100);

    const key = product.id;
    if (!salesByProduct[key]) {
      salesByProduct[key] = { produit: product.nom_produit, ca_ht: 0, taux_tva: isFranchise ? 0 : tauxTva, tva: 0 };
    }
    salesByProduct[key].ca_ht += caHt;
    salesByProduct[key].tva += tvaAmount;
  });

  const detailCollectee = Object.values(salesByProduct);
  const tvaCollectee = isFranchise ? 0 : detailCollectee.reduce((sum, d) => sum + d.tva, 0);

  // Calculate TVA déductible from production costs proportional to sales
  const detailDeductible: TVASummary["detailDeductible"] = [];

  // Build per-product cost components
  const costsByProduct: Record<string, { items: TVASummary["detailDeductible"] }> = {};

  (tvaData?.recipes || []).forEach(r => {
    const ing = r.ingredients as any;
    if (!ing) return;
    const cost = Number(r.quantite_utilisee) * Number(ing.cout_unitaire || 0);
    const tvaTaux = Number(ing.tva_taux ?? defaultTvaAchat);
    if (!costsByProduct[r.product_id]) costsByProduct[r.product_id] = { items: [] };
    costsByProduct[r.product_id].items.push({
      type: "ingredient",
      nom: ing.nom_ingredient || "N/A",
      montant_ht: cost,
      taux_tva: tvaTaux,
      tva: cost * (tvaTaux / 100),
    });
  });

  (tvaData?.pkgLinks || []).forEach(p => {
    const pkg = p.packaging as any;
    if (!pkg) return;
    const cost = Number(p.quantite) * Number(pkg.cout_unitaire || 0);
    const tvaTaux = Number(pkg.tva_taux ?? defaultTvaAchat);
    if (!costsByProduct[p.product_id]) costsByProduct[p.product_id] = { items: [] };
    costsByProduct[p.product_id].items.push({
      type: "packaging",
      nom: pkg.nom || "N/A",
      montant_ht: cost,
      taux_tva: tvaTaux,
      tva: cost * (tvaTaux / 100),
    });
  });

  (tvaData?.vcLinks || []).forEach(v => {
    const vc = v.variable_costs as any;
    if (!vc) return;
    const cost = Number(v.quantite) * Number(vc.cout_unitaire || 0);
    const tvaTaux = Number(vc.tva_taux ?? defaultTvaAchat);
    if (!costsByProduct[v.product_id]) costsByProduct[v.product_id] = { items: [] };
    costsByProduct[v.product_id].items.push({
      type: "variable_cost",
      nom: vc.nom || "N/A",
      montant_ht: cost,
      taux_tva: tvaTaux,
      tva: cost * (tvaTaux / 100),
    });
  });

  // Multiply per-unit costs by quantities sold
  const deductibleAgg: Record<string, TVASummary["detailDeductible"][0]> = {};

  (tvaData?.sales || []).forEach(sale => {
    const costs = costsByProduct[sale.product_id];
    if (!costs) return;
    costs.items.forEach(item => {
      const key = `${item.type}-${item.nom}`;
      const montant = item.montant_ht * sale.quantity;
      const tva = isFranchise ? 0 : item.tva * sale.quantity;
      if (!deductibleAgg[key]) {
        deductibleAgg[key] = { ...item, montant_ht: 0, tva: 0, taux_tva: isFranchise ? 0 : item.taux_tva };
      }
      deductibleAgg[key].montant_ht += montant;
      deductibleAgg[key].tva += tva;
    });
  });

  // Add professional expenses TVA
  (tvaData?.expenses || []).forEach(exp => {
    const montantHt = Number(exp.montant_ht || 0);
    const tvaTaux = Number(exp.tva_taux ?? defaultTvaAchat);
    const tva = isFranchise ? 0 : montantHt * (tvaTaux / 100);
    const key = `frais-${exp.libelle}`;
    if (!deductibleAgg[key]) {
      deductibleAgg[key] = { type: "variable_cost", nom: exp.libelle, montant_ht: 0, taux_tva: isFranchise ? 0 : tvaTaux, tva: 0 };
    }
    deductibleAgg[key].montant_ht += montantHt;
    deductibleAgg[key].tva += tva;
  });

  const detailDeductibleFinal = Object.values(deductibleAgg).filter(d => d.montant_ht > 0);
  const tvaDeductible = isFranchise ? 0 : detailDeductibleFinal.reduce((sum, d) => sum + d.tva, 0);
  const tvaNette = tvaCollectee - tvaDeductible;

  const summary: TVASummary = {
    tvaCollectee,
    tvaDeductible,
    tvaNette,
    detailCollectee,
    detailDeductible: detailDeductibleFinal,
  };

  return {
    summary,
    tvaCollectee,
    tvaDeductible,
    tvaNette,
    defaultTvaVente,
    defaultTvaAchat,
    isFranchise,
    isLoading,
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
export function useMonthlyTVA(options?: { year?: number; mode?: string }) {
  const { currentProject } = useProject();
  const { settings } = useProjectSettings();

  const projectId = currentProject?.id;
  const year = options?.year;
  const mode = options?.mode;

  const { data: monthlyData = [], isLoading } = useQuery({
    queryKey: ["monthly-tva", projectId, year, mode],
    queryFn: async () => {
      if (!projectId) return [];

      // Get cash flow data with TVA
      let query = supabase
        .from("cash_flow")
        .select("*")
        .eq("project_id", projectId)
        .order("mois", { ascending: true });

      if (year) {
        query = query.gte("mois", `${year}-01-01`).lte("mois", `${year}-12-31`);
      }
      if (mode) {
        query = query.eq("mode", mode);
      }

      const { data: cashFlowData, error } = await query;

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
