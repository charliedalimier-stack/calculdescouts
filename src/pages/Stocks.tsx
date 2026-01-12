import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/contexts/ProjectContext";
import { useStocks, Stock } from "@/hooks/useStocks";
import { useIngredients } from "@/hooks/useIngredients";
import { usePackaging } from "@/hooks/usePackaging";
import { useProducts } from "@/hooks/useProducts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Package, History, PieChart } from "lucide-react";
import { StockSummaryCards } from "@/components/stocks/StockSummaryCards";
import { StockTable } from "@/components/stocks/StockTable";
import { StockMovementHistory } from "@/components/stocks/StockMovementHistory";
import { StockValuationChart } from "@/components/stocks/StockValuationChart";
import { AddStockDialog } from "@/components/stocks/AddStockDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stocks() {
  const { currentProject } = useProject();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    ingredientStocks,
    packagingStocks,
    productStocks,
    movements,
    summary,
    isLoading,
    addStock,
    updateStock,
    addMovement,
    deleteStock,
  } = useStocks();

  const { ingredients = [] } = useIngredients();
  const { packaging = [] } = usePackaging();
  const { products = [] } = useProducts();

  const handleAddMovement = (
    stockId: string,
    type: "entree" | "sortie",
    quantite: number,
    motif?: string
  ) => {
    addMovement.mutate({
      stock_id: stockId,
      type_mouvement: type,
      quantite,
      motif,
    });
  };

  const handleUpdate = (id: string, data: Partial<Stock>) => {
    updateStock.mutate({ id, ...data });
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce stock ?")) {
      deleteStock.mutate(id);
    }
  };

  if (!currentProject) {
    return (
      <AppLayout
        title="Gestion des stocks"
        subtitle="Valorisation et suivi des stocks"
      >
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">
            Veuillez sélectionner un projet
          </p>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout
        title="Gestion des stocks"
        subtitle="Valorisation et suivi des stocks"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Gestion des stocks"
      subtitle="Valorisation et suivi des stocks"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <StockSummaryCards summary={summary} />

        {/* Main Content */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Détail des stocks</h2>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un stock
          </Button>
        </div>

        <Tabs defaultValue="ingredients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ingredients" className="gap-2">
              <Package className="h-4 w-4" />
              Ingrédients ({ingredientStocks.length})
            </TabsTrigger>
            <TabsTrigger value="packaging" className="gap-2">
              <Package className="h-4 w-4" />
              Emballages ({packagingStocks.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produits finis ({productStocks.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="valuation" className="gap-2">
              <PieChart className="h-4 w-4" />
              Valorisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients">
            <StockTable
              stocks={ingredientStocks}
              title="Ingrédients"
              type="ingredient"
              onAddMovement={handleAddMovement}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="packaging">
            <StockTable
              stocks={packagingStocks}
              title="Emballages"
              type="packaging"
              onAddMovement={handleAddMovement}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="products">
            <StockTable
              stocks={productStocks}
              title="Produits finis"
              type="product"
              onAddMovement={handleAddMovement}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="history">
            <StockMovementHistory movements={movements} />
          </TabsContent>

          <TabsContent value="valuation">
            <div className="grid gap-6 md:grid-cols-2">
              <StockValuationChart summary={summary} />
              <Card>
                <CardHeader>
                  <CardTitle>Impact trésorerie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      Variation mensuelle
                    </span>
                    <span
                      className={`font-semibold ${
                        summary.monthlyVariation >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {summary.monthlyVariation >= 0 ? "+" : ""}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(summary.monthlyVariation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      Impact cash-flow
                    </span>
                    <span
                      className={`font-semibold ${
                        summary.cashFlowImpact >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {summary.cashFlowImpact >= 0 ? "+" : ""}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(summary.cashFlowImpact)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Valeur totale immobilisée
                    </span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(summary.totalValue)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    💡 Une augmentation des stocks représente une sortie de
                    trésorerie (argent immobilisé). Une diminution libère de la
                    trésorerie.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Stock Dialog */}
        <AddStockDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={(data) => addStock.mutate(data)}
          ingredients={ingredients}
          packaging={packaging}
          products={products}
        />
      </div>
    </AppLayout>
  );
}
