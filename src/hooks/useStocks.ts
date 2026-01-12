import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useMode } from "@/contexts/ModeContext";
import { useToast } from "@/hooks/use-toast";

export interface Stock {
  id: string;
  project_id: string;
  type_stock: string;
  ingredient_id: string | null;
  packaging_id: string | null;
  product_id: string | null;
  quantite: number;
  cout_unitaire: number;
  valeur_totale: number | null;
  seuil_alerte: number | null;
  mode: string;
  created_at: string;
  updated_at: string;
  // Joined data
  ingredient?: { nom_ingredient: string; unite: string } | null;
  packaging?: { nom: string; unite: string } | null;
  product?: { nom_produit: string; unite_vente: string } | null;
}

export interface StockMovement {
  id: string;
  stock_id: string;
  project_id: string;
  type_mouvement: string;
  quantite: number;
  cout_unitaire: number | null;
  motif: string | null;
  reference_id: string | null;
  created_at: string;
  stock?: Stock;
}

export interface StockInsert {
  type_stock: string;
  ingredient_id?: string | null;
  packaging_id?: string | null;
  product_id?: string | null;
  quantite: number;
  cout_unitaire: number;
  seuil_alerte?: number | null;
}

export interface StockSummary {
  totalIngredients: number;
  totalPackaging: number;
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  monthlyVariation: number;
  cashFlowImpact: number;
}

export function useStocks() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectId = currentProject?.id;

  // Fetch all stocks with joined data
  const { data: stocks = [], isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks", projectId, mode],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("stocks")
        .select(`
          *,
          ingredient:ingredients(nom_ingredient, unite),
          packaging:packaging(nom, unite),
          product:products(nom_produit, unite_vente)
        `)
        .eq("project_id", projectId)
        .eq("mode", mode);

      if (error) throw error;
      return data as Stock[];
    },
    enabled: !!projectId,
  });

  // Fetch stock movements for history
  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ["stock-movements", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("stock_movements")
        .select(`
          *,
          stock:stocks(
            *,
            ingredient:ingredients(nom_ingredient),
            packaging:packaging(nom),
            product:products(nom_produit)
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!projectId,
  });

  // Calculate stock summary
  const summary: StockSummary = stocks.reduce(
    (acc, stock) => {
      const value = stock.quantite * stock.cout_unitaire;

      if (stock.type_stock === "ingredient") {
        acc.totalIngredients += value;
      } else if (stock.type_stock === "packaging") {
        acc.totalPackaging += value;
      } else if (stock.type_stock === "product") {
        acc.totalProducts += value;
      }

      acc.totalValue += value;

      if (stock.seuil_alerte && stock.quantite <= stock.seuil_alerte) {
        acc.lowStockCount++;
      }

      return acc;
    },
    {
      totalIngredients: 0,
      totalPackaging: 0,
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      monthlyVariation: 0,
      cashFlowImpact: 0,
    }
  );

  // Calculate monthly variation from movements
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyMovements = movements.filter(
    (m) => new Date(m.created_at) >= startOfMonth
  );

  summary.monthlyVariation = monthlyMovements.reduce((acc, m) => {
    const value = m.quantite * (m.cout_unitaire || 0);
    return m.type_mouvement === "entree" ? acc + value : acc - value;
  }, 0);

  // Cash flow impact = negative of stock increase (money tied up in stock)
  summary.cashFlowImpact = -summary.monthlyVariation;

  // Group stocks by type
  const ingredientStocks = stocks.filter((s) => s.type_stock === "ingredient");
  const packagingStocks = stocks.filter((s) => s.type_stock === "packaging");
  const productStocks = stocks.filter((s) => s.type_stock === "product");

  // Add stock
  const addStock = useMutation({
    mutationFn: async (stock: StockInsert) => {
      if (!projectId) throw new Error("Aucun projet sélectionné");

      const { data, error } = await supabase
        .from("stocks")
        .insert({
          ...stock,
          project_id: projectId,
          mode,
          valeur_totale: stock.quantite * stock.cout_unitaire,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      toast({ title: "Stock ajouté avec succès" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update stock
  const updateStock = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Stock> & { id: string }) => {
      const { data, error } = await supabase
        .from("stocks")
        .update({
          ...updates,
          valeur_totale:
            updates.quantite !== undefined && updates.cout_unitaire !== undefined
              ? updates.quantite * updates.cout_unitaire
              : undefined,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      toast({ title: "Stock mis à jour" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add stock movement (entry or exit)
  const addMovement = useMutation({
    mutationFn: async ({
      stock_id,
      type_mouvement,
      quantite,
      cout_unitaire,
      motif,
      reference_id,
    }: {
      stock_id: string;
      type_mouvement: "entree" | "sortie";
      quantite: number;
      cout_unitaire?: number;
      motif?: string;
      reference_id?: string;
    }) => {
      if (!projectId) throw new Error("Aucun projet sélectionné");

      // Get current stock
      const { data: currentStock, error: stockError } = await supabase
        .from("stocks")
        .select("*")
        .eq("id", stock_id)
        .single();

      if (stockError) throw stockError;

      // Calculate new quantity
      const newQuantite =
        type_mouvement === "entree"
          ? currentStock.quantite + quantite
          : currentStock.quantite - quantite;

      if (newQuantite < 0) {
        throw new Error("Stock insuffisant");
      }

      // Update stock quantity
      const { error: updateError } = await supabase
        .from("stocks")
        .update({
          quantite: newQuantite,
          valeur_totale: newQuantite * currentStock.cout_unitaire,
        })
        .eq("id", stock_id);

      if (updateError) throw updateError;

      // Record movement
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          stock_id,
          project_id: projectId,
          type_mouvement,
          quantite,
          cout_unitaire: cout_unitaire || currentStock.cout_unitaire,
          motif,
          reference_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({
        title:
          variables.type_mouvement === "entree"
            ? "Entrée de stock enregistrée"
            : "Sortie de stock enregistrée",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Decrement stock based on sales
  const decrementFromSale = useMutation({
    mutationFn: async ({
      product_id,
      quantite_vendue,
    }: {
      product_id: string;
      quantite_vendue: number;
    }) => {
      if (!projectId) throw new Error("Aucun projet sélectionné");

      // Find product stock
      const productStock = stocks.find(
        (s) => s.type_stock === "product" && s.product_id === product_id
      );

      if (productStock) {
        // Decrement product stock
        await addMovement.mutateAsync({
          stock_id: productStock.id,
          type_mouvement: "sortie",
          quantite: quantite_vendue,
          motif: "Vente",
        });
      }

      // Get recipe ingredients for this product
      const { data: recipe, error } = await supabase
        .from("recipes")
        .select("ingredient_id, quantite_utilisee")
        .eq("product_id", product_id)
        .eq("mode", mode);

      if (error) throw error;

      // Decrement ingredient stocks
      for (const item of recipe || []) {
        const ingredientStock = stocks.find(
          (s) =>
            s.type_stock === "ingredient" &&
            s.ingredient_id === item.ingredient_id
        );

        if (ingredientStock) {
          const quantiteToDecrement = item.quantite_utilisee * quantite_vendue;
          await addMovement.mutateAsync({
            stock_id: ingredientStock.id,
            type_mouvement: "sortie",
            quantite: quantiteToDecrement,
            motif: "Consommation production",
            reference_id: product_id,
          });
        }
      }

      // Get packaging for this product
      const { data: packaging, error: packError } = await supabase
        .from("product_packaging")
        .select("packaging_id, quantite")
        .eq("product_id", product_id)
        .eq("mode", mode);

      if (packError) throw packError;

      // Decrement packaging stocks
      for (const item of packaging || []) {
        const packagingStock = stocks.find(
          (s) =>
            s.type_stock === "packaging" && s.packaging_id === item.packaging_id
        );

        if (packagingStock) {
          const quantiteToDecrement = item.quantite * quantite_vendue;
          await addMovement.mutateAsync({
            stock_id: packagingStock.id,
            type_mouvement: "sortie",
            quantite: quantiteToDecrement,
            motif: "Consommation emballage",
            reference_id: product_id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });

  // Delete stock
  const deleteStock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      toast({ title: "Stock supprimé" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    stocks,
    ingredientStocks,
    packagingStocks,
    productStocks,
    movements,
    summary,
    isLoading: stocksLoading || movementsLoading,
    addStock,
    updateStock,
    addMovement,
    decrementFromSale,
    deleteStock,
  };
}
