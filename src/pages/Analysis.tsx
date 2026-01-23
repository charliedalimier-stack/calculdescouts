import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductSalesAnalysis } from "@/hooks/useAnnualSalesEntry";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";
import { getCurrentYear } from "@/lib/dateOptions";

// Convert DataMode to product/sales mode
const mapDataModeToProductMode = (mode: DataMode): 'simulation' | 'reel' => {
  return mode === 'budget' ? 'simulation' : 'reel';
};

const Analysis = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [dataMode, setDataMode] = useState<DataMode>('budget');

  // Convert DataMode to the mode expected by hooks
  const productMode = mapDataModeToProductMode(dataMode);

  // Log current mode for debugging
  console.log('[Analysis] Current dataMode:', dataMode, '-> productMode:', productMode);

  const handlePeriodChange = ({ year, mode }: { month?: number; year: number; mode: DataMode }) => {
    console.log('[Analysis] Period changed:', { year, mode });
    setSelectedYear(year);
    setDataMode(mode);
  };

  const { productsWithCosts, isLoadingWithCosts } = useProducts(productMode);
  const { productSales, isLoading: isLoadingSales } = useProductSalesAnalysis(selectedYear);
  const { settings, isLoading: isLoadingSettings } = useProjectSettings();

  // Get coefficient thresholds from settings (single source of truth)
  const coefficientCible = settings?.coefficient_cible ?? 2.5;
  const coefficientMin = settings?.coefficient_min ?? 2.0;

  // Pareto analysis - calculate CA by product using annual sales data
  const paretoData = useMemo(() => {
    if (!productsWithCosts || !productSales || productSales.length === 0) return [];

    console.log('[Analysis] Pareto - productSales:', productSales.length, 'mode:', dataMode);

    const productCA: Record<string, { name: string; ca: number }> = {};

    // Use budget or reel CA based on selected mode
    productSales.forEach((sale) => {
      const product = productsWithCosts.find((p) => p.id === sale.product_id);
      if (product) {
        const ca = dataMode === 'budget' ? sale.budget_ca : sale.reel_ca;
        if (!productCA[product.id]) {
          productCA[product.id] = { name: product.nom_produit, ca: 0 };
        }
        productCA[product.id].ca += ca;
      }
    });

    // Sort by CA descending
    const sorted = Object.values(productCA)
      .filter(p => p.ca > 0) // Only include products with sales
      .sort((a, b) => b.ca - a.ca);
    
    const total = sorted.reduce((sum, p) => sum + p.ca, 0);

    // Calculate cumulative percent
    let cumul = 0;
    return sorted.map((p) => {
      cumul += p.ca;
      return {
        name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
        ca: Math.round(p.ca),
        cumulPercent: total > 0 ? Math.round((cumul / total) * 100) : 0,
      };
    }).slice(0, 8);
  }, [productsWithCosts, productSales, dataMode]);

  // Coefficient dispersion data - using settings thresholds
  const coefficientData = useMemo(() => {
    if (!productsWithCosts) return [];

    return productsWithCosts
      .filter((p) => p.coefficient > 0)
      .map((p) => ({
        name: p.nom_produit.length > 12 ? p.nom_produit.substring(0, 12) + "..." : p.nom_produit,
        fullName: p.nom_produit,
        coefficient: Number(p.coefficient.toFixed(2)),
        target: coefficientCible,
      }))
      .sort((a, b) => b.coefficient - a.coefficient)
      .slice(0, 8);
  }, [productsWithCosts, coefficientCible]);

  // Find key products for 80% CA threshold
  const keyProductsCount = useMemo(() => {
    const threshold = paretoData.findIndex((p) => p.cumulPercent >= 80);
    return threshold >= 0 ? threshold + 1 : paretoData.length;
  }, [paretoData]);

  const paretoThresholdPercent = useMemo(() => {
    if (paretoData.length === 0) return 0;
    const keyProducts = paretoData.slice(0, keyProductsCount);
    return keyProducts.length > 0 ? keyProducts[keyProducts.length - 1]?.cumulPercent || 0 : 0;
  }, [paretoData, keyProductsCount]);

  // Insights generation - using settings thresholds
  const insights = useMemo(() => {
    if (!productsWithCosts) return [];

    const result = [];

    // Find products with low coefficient (using settings threshold)
    const lowCoefProducts = productsWithCosts
      .filter((p) => p.coefficient > 0 && p.coefficient < coefficientMin)
      .map((p) => p.nom_produit);

    if (lowCoefProducts.length > 0) {
      result.push({
        type: "error",
        title: lowCoefProducts.slice(0, 2).join(" & "),
        message: `Coefficient inférieur à ${coefficientMin}x. Augmentez le prix de vente ou réduisez les coûts de production.`,
      });
    }

    // Concentration warning
    if (keyProductsCount > 0 && keyProductsCount <= paretoData.length / 2) {
      result.push({
        type: "warning",
        title: "Concentration du CA",
        message: `${keyProductsCount} produit${keyProductsCount > 1 ? "s" : ""} représente${keyProductsCount > 1 ? "nt" : ""} ${paretoThresholdPercent}% du CA. Risque de dépendance - diversifiez votre gamme.`,
      });
    }

    // Find best performing product
    const bestProduct = productsWithCosts.reduce((best, p) => {
      if (p.coefficient > (best?.coefficient || 0)) return p;
      return best;
    }, null as typeof productsWithCosts[0] | null);

    if (bestProduct && bestProduct.coefficient >= coefficientCible) {
      result.push({
        type: "success",
        title: bestProduct.nom_produit,
        message: `Meilleur coefficient (${bestProduct.coefficient.toFixed(2)}x). Produit à développer - considérez des déclinaisons.`,
      });
    }

    return result;
  }, [productsWithCosts, keyProductsCount, paretoThresholdPercent, paretoData.length, coefficientMin, coefficientCible]);

  const isLoading = isLoadingWithCosts || isLoadingSales || isLoadingSettings;

  return (
    <AppLayout
      title="Analyses"
      subtitle="Visualisations avancées pour la prise de décision"
    >
      {/* Period Selector */}
      <div className="mb-6">
        <PeriodSelector
          year={selectedYear}
          mode={dataMode}
          showMonth={false}
          onChange={handlePeriodChange}
        />
      </div>

      {/* Pareto Analysis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analyse de Pareto (80/20)
            {paretoData.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {paretoThresholdPercent}% du CA généré par {keyProductsCount} produit{keyProductsCount > 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : paretoData.length === 0 ? (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              Aucune donnée de ventes disponible
            </div>
          ) : (
            <>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "ca" ? `${value.toLocaleString()} €` : `${value}%`,
                        name === "ca" ? "CA" : "% cumulé",
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="ca" radius={[4, 4, 0, 0]}>
                      {paretoData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.cumulPercent <= 80 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"}
                        />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulPercent"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
                  <span className="text-muted-foreground">Produits clés (80% du CA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-5))" }} />
                  <span className="text-muted-foreground">Produits secondaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
                  <span className="text-muted-foreground">% cumulé</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Coefficient Dispersion */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Dispersion des coefficients
            <InfoTooltip
              title={DEFINITIONS.coefficient.title}
              formula={DEFINITIONS.coefficient.formula}
              description={DEFINITIONS.coefficient.description}
              interpretation={DEFINITIONS.coefficient.interpretation}
            />
            <Badge variant="outline" className="ml-auto text-xs">
              Cible: {coefficientCible}x | Min: {coefficientMin}x
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : coefficientData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Aucun produit avec des données de coefficient
            </div>
          ) : (
            <>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coefficientData} layout="vertical" margin={{ left: 100, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      domain={[0, Math.max(3, coefficientCible + 0.5)]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                      width={100}
                    />
                    <ReferenceLine x={coefficientCible} stroke="hsl(var(--chart-1))" strokeDasharray="5 5" label={{ value: 'Cible', fill: 'hsl(var(--chart-1))', fontSize: 10 }} />
                    <ReferenceLine x={coefficientMin} stroke="hsl(var(--chart-4))" strokeDasharray="5 5" label={{ value: 'Min', fill: 'hsl(var(--chart-4))', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}x`, "Coefficient"]}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName || payload[0]?.payload?.name || ""}
                    />
                    <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                      {coefficientData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.coefficient >= coefficientCible
                              ? "hsl(var(--chart-1))"
                              : entry.coefficient >= coefficientMin
                              ? "hsl(var(--chart-4))"
                              : "hsl(var(--destructive))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
                  <span className="text-muted-foreground">Optimal (≥{coefficientCible}x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
                  <span className="text-muted-foreground">Acceptable ({coefficientMin}-{coefficientCible}x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
                  <span className="text-muted-foreground">Insuffisant (&lt;{coefficientMin}x)</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Margin and Category Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarginChart mode={productMode} />
        <CategoryPieChart year={selectedYear} mode={dataMode} />
      </div>

      {/* Insights */}
      {!isLoading && insights.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-primary" />
              Points d'attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    insight.type === "error"
                      ? "border-destructive/20 bg-destructive/5"
                      : insight.type === "warning"
                      ? "border-chart-4/20 bg-chart-4/5"
                      : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <h4 className="font-semibold text-foreground">{insight.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Analysis;