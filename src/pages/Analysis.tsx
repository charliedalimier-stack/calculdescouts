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
} from "recharts";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const Analysis = () => {
  const { productsWithCosts, isLoadingWithCosts } = useProducts();
  const { salesData, isLoading: isLoadingSales } = useSales();

  // Pareto analysis - calculate CA by product
  const paretoData = useMemo(() => {
    if (!productsWithCosts || !salesData) return [];

    const productCA: Record<string, { name: string; ca: number }> = {};

    salesData.forEach((sale) => {
      const product = productsWithCosts.find((p) => p.id === sale.product_id);
      if (product) {
        if (!productCA[product.id]) {
          productCA[product.id] = { name: product.nom_produit, ca: 0 };
        }
        productCA[product.id].ca += sale.reel_ca;
      }
    });

    // Sort by CA descending
    const sorted = Object.values(productCA).sort((a, b) => b.ca - a.ca);
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
  }, [productsWithCosts, salesData]);

  // Coefficient dispersion data
  const coefficientData = useMemo(() => {
    if (!productsWithCosts) return [];

    return productsWithCosts
      .filter((p) => p.coefficient > 0)
      .map((p) => ({
        name: p.nom_produit.length > 12 ? p.nom_produit.substring(0, 12) + "..." : p.nom_produit,
        coefficient: Number(p.coefficient.toFixed(2)),
        target: 2.0,
      }))
      .sort((a, b) => b.coefficient - a.coefficient)
      .slice(0, 8);
  }, [productsWithCosts]);

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

  // Insights generation
  const insights = useMemo(() => {
    if (!productsWithCosts) return [];

    const result = [];

    // Find products with low coefficient
    const lowCoefProducts = productsWithCosts
      .filter((p) => p.coefficient > 0 && p.coefficient < 1.7)
      .map((p) => p.nom_produit);

    if (lowCoefProducts.length > 0) {
      result.push({
        type: "error",
        title: lowCoefProducts.slice(0, 2).join(" & "),
        message: "Coefficient inférieur à 1.7x. Augmentez le prix de vente ou réduisez les coûts de production.",
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

    if (bestProduct && bestProduct.coefficient >= 2.0) {
      result.push({
        type: "success",
        title: bestProduct.nom_produit,
        message: `Meilleur coefficient (${bestProduct.coefficient.toFixed(2)}x). Produit à développer - considérez des déclinaisons.`,
      });
    }

    return result;
  }, [productsWithCosts, keyProductsCount, paretoThresholdPercent, paretoData.length]);

  const isLoading = isLoadingWithCosts || isLoadingSales;

  return (
    <AppLayout
      title="Analyses"
      subtitle="Visualisations avancées pour la prise de décision"
    >
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
                      domain={[0, 3]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}x`, "Coefficient"]}
                    />
                    <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                      {coefficientData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.coefficient >= 2.0
                              ? "hsl(var(--chart-1))"
                              : entry.coefficient >= 1.7
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
                  <span className="text-muted-foreground">Optimal (≥2.0x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
                  <span className="text-muted-foreground">Acceptable (1.7-2.0x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
                  <span className="text-muted-foreground">Insuffisant (&lt;1.7x)</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Margin and Category Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarginChart />
        <CategoryPieChart />
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