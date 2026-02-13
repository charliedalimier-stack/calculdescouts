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

// Hook for monthly TVA tracking - computes from sales/costs data
export function useMonthlyTVA(options?: { year?: number; mode?: string }) {
  const { currentProject } = useProject();
  const { mode: contextMode } = useMode();
  const { settings } = useProjectSettings();
  const year = options?.year || new Date().getFullYear();
  const mode = options?.mode || contextMode;
  const projectId = currentProject?.id;
  const isFranchise = settings?.regime_tva === 'franchise_taxe';
  const defaultTvaVente = settings?.tva_vente || 6;
  const defaultTvaAchat = settings?.tva_achat || 21;

  const { data: monthlyData = [], isLoading } = useQuery({
    queryKey: ["monthly-tva-computed", projectId, mode, year],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: products } = await supabase
        .from("products")
        .select("id, nom_produit, prix_btc, tva_taux")
        .eq("project_id", projectId)
        .eq("mode", "budget");

      if (!products || products.length === 0) return [];

      const { data: productPrices } = await supabase
        .from("product_prices")
        .select("product_id, categorie_prix, prix_ht, tva_taux")
        .in("product_id", products.map(p => p.id))
        .eq("mode", "budget");

      const priceMap: Record<string, { prix_ht: number; tva_taux: number }> = {};
      (productPrices || []).forEach(pp => {
        priceMap[`${pp.product_id}-${pp.categorie_prix}`] = { prix_ht: Number(pp.prix_ht), tva_taux: Number(pp.tva_taux) };
      });

      // Collect monthly sales
      type MSale = { product_id: string; categorie_prix: string; quantity: number; month: number };
      const monthlySales: MSale[] = [];

      if (mode === "reel") {
        const { data: reelSales } = await supabase
          .from("monthly_sales_reel")
          .select("product_id, categorie_prix, quantite, month")
          .eq("project_id", projectId)
          .eq("year", year);
        (reelSales || []).forEach(s => {
          const m = new Date(s.month).getMonth() + 1;
          const qty = Number(s.quantite || 0);
          if (qty > 0) monthlySales.push({ product_id: s.product_id, categorie_prix: s.categorie_prix || "BTC", quantity: qty, month: m });
        });
      } else {
        const { data: annualSales } = await supabase
          .from("annual_sales")
          .select("product_id, categorie_prix, quantite_annuelle")
          .eq("project_id", projectId).eq("mode", "budget").eq("year", year);
        const { data: seasonality } = await supabase
          .from("seasonality_coefficients")
          .select("*").eq("project_id", projectId).eq("mode", "budget").eq("year", year).maybeSingle();
        const getCoef = (mi: number) => {
          if (!seasonality) return 8.33 / 100;
          const key = `month_${(mi + 1).toString().padStart(2, "0")}` as keyof typeof seasonality;
          return (Number(seasonality[key]) || 8.33) / 100;
        };
        (annualSales || []).forEach(a => {
          for (let m = 0; m < 12; m++) {
            const qty = Math.round(a.quantite_annuelle * getCoef(m));
            if (qty > 0) monthlySales.push({ product_id: a.product_id, categorie_prix: a.categorie_prix, quantity: qty, month: m + 1 });
          }
        });
      }

      // Per-product unit costs
      const { data: recipes } = await supabase.from("recipes")
        .select("product_id, quantite_utilisee, ingredients(cout_unitaire, tva_taux)").eq("mode", "budget");
      const { data: pkgLinks } = await supabase.from("product_packaging")
        .select("product_id, quantite, packaging(cout_unitaire, tva_taux)").eq("mode", "budget");
      const { data: vcLinks } = await supabase.from("product_variable_costs")
        .select("product_id, quantite, variable_costs(cout_unitaire, tva_taux)").eq("mode", "budget");

      const unitTva: Record<string, number> = {};
      const unitHt: Record<string, number> = {};
      (recipes || []).forEach(r => {
        const ing = r.ingredients as any; if (!ing) return;
        const c = Number(r.quantite_utilisee) * Number(ing.cout_unitaire || 0);
        unitHt[r.product_id] = (unitHt[r.product_id] || 0) + c;
        unitTva[r.product_id] = (unitTva[r.product_id] || 0) + c * (Number(ing.tva_taux ?? defaultTvaAchat) / 100);
      });
      (pkgLinks || []).forEach(p => {
        const pkg = p.packaging as any; if (!pkg) return;
        const c = Number(p.quantite) * Number(pkg.cout_unitaire || 0);
        unitHt[p.product_id] = (unitHt[p.product_id] || 0) + c;
        unitTva[p.product_id] = (unitTva[p.product_id] || 0) + c * (Number(pkg.tva_taux ?? defaultTvaAchat) / 100);
      });
      (vcLinks || []).forEach(v => {
        const vc = v.variable_costs as any; if (!vc) return;
        const c = Number(v.quantite) * Number(vc.cout_unitaire || 0);
        unitHt[v.product_id] = (unitHt[v.product_id] || 0) + c;
        unitTva[v.product_id] = (unitTva[v.product_id] || 0) + c * (Number(vc.tva_taux ?? defaultTvaAchat) / 100);
      });

      // Expenses by month
      const { data: expenses } = await supabase.from("professional_expenses")
        .select("montant_ht, tva_taux, mois").eq("project_id", projectId).eq("mode", mode)
        .gte("mois", `${year}-01-01`).lte("mois", `${year}-12-31`);

      const productMap = new Map(products.map(p => [p.id, p]));
      const mr: Record<number, { col: number; ded: number; caHt: number; costHt: number }> = {};
      for (let m = 1; m <= 12; m++) mr[m] = { col: 0, ded: 0, caHt: 0, costHt: 0 };

      monthlySales.forEach(s => {
        const prod = productMap.get(s.product_id); if (!prod) return;
        const pi = priceMap[`${prod.id}-${s.categorie_prix}`];
        const prixHt = pi?.prix_ht ?? Number(prod.prix_btc);
        const tvaTaux = pi?.tva_taux ?? Number(prod.tva_taux) ?? defaultTvaVente;
        const caHt = s.quantity * prixHt;
        mr[s.month].col += isFranchise ? 0 : caHt * (tvaTaux / 100);
        mr[s.month].ded += isFranchise ? 0 : (unitTva[s.product_id] || 0) * s.quantity;
        mr[s.month].caHt += caHt;
        mr[s.month].costHt += (unitHt[s.product_id] || 0) * s.quantity;
      });

      (expenses || []).forEach(e => {
        const m = new Date(e.mois).getMonth() + 1;
        const ht = Number(e.montant_ht || 0);
        mr[m].ded += isFranchise ? 0 : ht * (Number(e.tva_taux ?? defaultTvaAchat) / 100);
        mr[m].costHt += ht;
      });

      return Object.entries(mr)
        .map(([m, d]) => {
          const re = d.caHt - d.costHt;
          const tn = d.col - d.ded;
          return { mois: `${year}-${m.padStart(2, "0")}-01`, tvaCollectee: d.col, tvaDeductible: d.ded, tvaNette: tn, resultatEconomique: re, resultatTresorerie: re + tn };
        })
        .filter(m => m.tvaCollectee > 0 || m.tvaDeductible > 0 || m.resultatEconomique !== 0) as MonthlyTVA[];
    },
    enabled: !!projectId,
  });

  return { monthlyData, isLoading };
}
