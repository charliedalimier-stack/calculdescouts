import {
  TrendingUp,
  Package,
  Wallet,
  CircleDollarSign,
  ChefHat,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { BCGMatrix } from "@/components/dashboard/BCGMatrix";
import { ProductAlerts } from "@/components/dashboard/ProductAlerts";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useExpenses } from "@/hooks/useExpenses";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

const Index = () => {
  const { productsWithCosts, products, isLoadingWithCosts } = useProducts();
  const { salesData, totals, isLoading: isLoadingSales } = useSales();
  const { currentMonth, isLoading: isLoadingCashFlow } = useCashFlow();
  const { summary: expensesSummary, isLoading: isLoadingExpenses } = useExpenses();

  const kpiData = useMemo(() => {
    const totalCA = totals?.reel_ca || 0;
    const previousCA = totals?.objectif_ca || 0;
    const caChange = previousCA > 0 ? ((totalCA - previousCA) / previousCA) * 100 : 0;

    // Calculate weighted average margin
    const weightedMargin = productsWithCosts?.reduce((acc, p) => {
      const productSales = salesData?.find((s) => s.product_id === p.id);
      const productCA = productSales?.reel_ca || 0;
      return acc + (p.margin * productCA);
    }, 0) || 0;
    const avgMargin = totalCA > 0 ? weightedMargin / totalCA : 0;

    // Cash flow calculation (production only)
    const cashFlow = currentMonth 
      ? Number(currentMonth.encaissements) - Number(currentMonth.decaissements)
      : 0;

    // Get current month expenses
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = expensesSummary.by_month[currentMonthStr] || 0;
    
    // Calculate production costs from weighted margin
    const totalCosts = totalCA * (1 - avgMargin / 100);
    const margeBrute = totalCA - totalCosts;
    const resultatNet = margeBrute - monthlyExpenses;

    return {
      ca: totalCA,
      caChange,
      avgMargin,
      productCount: products?.length || 0,
      cashFlow,
      monthlyExpenses,
      margeBrute,
      resultatNet,
    };
  }, [productsWithCosts, salesData, totals, currentMonth, products, expensesSummary]);

  const topProducts = useMemo(() => {
    if (!productsWithCosts || !salesData) return [];

    return productsWithCosts
      .map((p) => {
        const sales = salesData.find((s) => s.product_id === p.id);
        return {
          name: p.nom_produit,
          sold: sales?.reel_qty || 0,
          revenue: sales?.reel_ca || 0,
          margin: p.margin,
        };
      })
      .filter((p) => p.sold > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [productsWithCosts, salesData]);

  const isLoading = isLoadingWithCosts || isLoadingSales || isLoadingCashFlow || isLoadingExpenses;

  // Calculate net cash flow after expenses
  const netCashFlow = kpiData.cashFlow - kpiData.monthlyExpenses;

  return (
    <AppLayout
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
    >
      {/* Alert if negative result */}
      {!isLoading && kpiData.resultatNet < 0 && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Résultat net négatif ce mois</p>
              <p className="text-sm text-muted-foreground">
                Marge brute ({kpiData.margeBrute.toLocaleString('fr-FR')} €) - Frais pro. ({kpiData.monthlyExpenses.toLocaleString('fr-FR')} €) = {kpiData.resultatNet.toLocaleString('fr-FR')} €
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Row 1 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        ) : (
          <>
            <KPICard
              title="Chiffre d'affaires"
              value={`${kpiData.ca.toLocaleString("fr-FR")} €`}
              change={`${kpiData.caChange >= 0 ? "+" : ""}${kpiData.caChange.toFixed(1)}% vs objectif`}
              changeType={kpiData.caChange >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
              tooltip="Total des ventes du mois en cours"
            />
            <KPICard
              title="Marge brute moyenne"
              value={`${kpiData.avgMargin.toFixed(1)}%`}
              change={kpiData.avgMargin >= 35 ? "Objectif atteint" : "En dessous de l'objectif"}
              changeType={kpiData.avgMargin >= 35 ? "positive" : "negative"}
              icon={CircleDollarSign}
              tooltip="Marge moyenne pondérée par le CA"
            />
            <KPICard
              title="Frais professionnels"
              value={`${kpiData.monthlyExpenses.toLocaleString("fr-FR")} €`}
              change={kpiData.ca > 0 ? `${((kpiData.monthlyExpenses / kpiData.ca) * 100).toFixed(1)}% du CA` : "Aucun CA"}
              changeType={kpiData.monthlyExpenses > kpiData.margeBrute ? "negative" : "neutral"}
              icon={Receipt}
              tooltip="Frais fixes du mois (hors production)"
            />
            <KPICard
              title="Résultat net"
              value={`${kpiData.resultatNet.toLocaleString("fr-FR")} €`}
              change={kpiData.resultatNet >= 0 ? "Rentable" : "Non rentable"}
              changeType={kpiData.resultatNet >= 0 ? "positive" : "negative"}
              icon={kpiData.resultatNet >= 0 ? TrendingUp : AlertTriangle}
              tooltip="Marge brute - Frais professionnels"
            />
          </>
        )}
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        ) : (
          <>
            <KPICard
              title="Produits actifs"
              value={kpiData.productCount.toString()}
              change={`${kpiData.productCount} produit${kpiData.productCount > 1 ? "s" : ""} en catalogue`}
              changeType="neutral"
              icon={Package}
              tooltip="Nombre de produits en vente"
            />
            <KPICard
              title="Cash-flow (production)"
              value={`${kpiData.cashFlow.toLocaleString("fr-FR")} €`}
              change={kpiData.cashFlow >= 0 ? "Positif" : "Négatif"}
              changeType={kpiData.cashFlow >= 0 ? "positive" : "negative"}
              icon={Wallet}
              tooltip="Flux de trésorerie du mois (hors frais pro.)"
            />
            <KPICard
              title="Cash-flow après frais"
              value={`${netCashFlow.toLocaleString("fr-FR")} €`}
              change={netCashFlow >= 0 ? "Trésorerie saine" : "Tension de trésorerie"}
              changeType={netCashFlow >= 0 ? "positive" : "negative"}
              icon={Wallet}
              tooltip="Cash-flow production - Frais professionnels"
            />
          </>
        )}
      </div>

      {/* Main Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <SalesChart />
        <ProductAlerts />
      </div>

      {/* Secondary Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <MarginChart />
        <CategoryPieChart />
      </div>

      {/* BCG Matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BCGMatrix />
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <ChefHat className="h-5 w-5 text-primary" />
            Produits phares du mois
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Aucune vente enregistrée
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sold} unités vendues
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {product.revenue.toLocaleString("fr-FR")} €
                    </p>
                    <p className="text-sm text-primary">
                      {product.margin.toFixed(1)}% marge
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;