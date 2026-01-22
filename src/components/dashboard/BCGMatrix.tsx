import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useMonthlyDistribution } from "@/hooks/useAnnualSalesEntry";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const getQuadrantColor = (quadrant: string) => {
  switch (quadrant) {
    case "star":
      return "hsl(var(--chart-1))";
    case "cashcow":
      return "hsl(var(--chart-2))";
    case "dilemma":
      return "hsl(var(--chart-4))";
    case "dog":
      return "hsl(var(--destructive))";
    default:
      return "hsl(var(--muted))";
  }
};

const getQuadrant = (margin: number, volume: number, avgMargin: number, avgVolume: number) => {
  if (margin >= avgMargin && volume >= avgVolume) return "star";
  if (margin >= avgMargin && volume < avgVolume) return "dilemma";
  if (margin < avgMargin && volume >= avgVolume) return "cashcow";
  return "dog";
};

interface BCGMatrixProps {
  year?: number;
  mode?: 'simulation' | 'reel';
}

export function BCGMatrix({ year = new Date().getFullYear(), mode = 'simulation' }: BCGMatrixProps) {
  const { productsWithCosts, isLoadingWithCosts } = useProducts(mode);
  const { totals, isLoading: isLoadingDistribution } = useMonthlyDistribution(year);

  console.log('[BCGMatrix] year:', year, 'mode:', mode);

  // For BCG, we use total volumes from monthly distribution
  const totalVolume = mode === 'simulation' ? totals.budget_qty : totals.reel_qty;

  const { products, avgMargin, avgVolume, maxMargin, maxVolume } = useMemo(() => {
    if (!productsWithCosts) return { products: [], avgMargin: 30, avgVolume: 500, maxMargin: 60, maxVolume: 1000 };

    // Use product margin directly and assign equal volume share for now
    // In a real implementation, we'd have per-product volumes
    const volumePerProduct = productsWithCosts.length > 0 ? totalVolume / productsWithCosts.length : 0;

    const productData = productsWithCosts
      .filter((p) => p.margin !== null && p.margin !== undefined)
      .map((p) => ({
        id: p.id,
        name: p.nom_produit,
        rentabilite: Number((p.margin || 0).toFixed(1)),
        volume: Math.round(volumePerProduct),
        quadrant: "",
      }));

    if (productData.length === 0) {
      return { products: [], avgMargin: 30, avgVolume: 500, maxMargin: 60, maxVolume: 1000 };
    }

    const totalMargin = productData.reduce((sum, p) => sum + p.rentabilite, 0);
    const totalVol = productData.reduce((sum, p) => sum + p.volume, 0);
    const avgM = totalMargin / productData.length;
    const avgV = totalVol / productData.length;
    const maxM = Math.max(...productData.map((p) => p.rentabilite), 60);
    const maxV = Math.max(...productData.map((p) => p.volume), 100);

    const productsWithQuadrants = productData.map((p) => ({
      ...p,
      quadrant: getQuadrant(p.rentabilite, p.volume, avgM, avgV),
    }));

    return {
      products: productsWithQuadrants,
      avgMargin: avgM,
      avgVolume: avgV,
      maxMargin: maxM,
      maxVolume: maxV,
    };
  }, [productsWithCosts, totalVolume]);

  if (isLoadingWithCosts || isLoadingDistribution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Matrice Produits (BCG)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Matrice Produits (BCG)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            Aucun produit avec des données de marge
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Matrice Produits (BCG) - {mode === 'simulation' ? 'Budget' : 'Réel'} {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="rentabilite"
                name="Rentabilité"
                unit="%"
                domain={[0, Math.ceil(maxMargin / 10) * 10]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "Rentabilité (%)",
                  position: "bottom",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="volume"
                name="Volume"
                domain={[0, Math.ceil(maxVolume / 100) * 100 || 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "Volume ventes",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={avgMargin}
                stroke="hsl(var(--border))"
                strokeDasharray="5 5"
              />
              <ReferenceLine
                y={avgVolume}
                stroke="hsl(var(--border))"
                strokeDasharray="5 5"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number, name: string) => [
                  name === "rentabilite" ? `${value}%` : value,
                  name === "rentabilite" ? "Rentabilité" : "Volume",
                ]}
                labelFormatter={(_, payload) => payload[0]?.payload?.name || ""}
              />
              <Scatter name="Produits" data={products}>
                {products.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getQuadrantColor(entry.quadrant)}
                    r={8}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span className="text-muted-foreground">⭐ Stars - Développer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span className="text-muted-foreground">💰 Cash Cows - Maintenir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
            <span className="text-muted-foreground">❓ Dilemmes - Décider</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            <span className="text-muted-foreground">🐶 Dogs - Supprimer</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
