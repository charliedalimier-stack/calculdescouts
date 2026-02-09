import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

const getBarColor = (margin: number) => {
  if (margin >= 40) return "hsl(var(--chart-1))";
  if (margin >= 30) return "hsl(var(--chart-4))";
  return "hsl(var(--destructive))";
};

interface MarginChartProps {
  mode?: 'budget' | 'reel';
}

export function MarginChart({ mode = 'budget' }: MarginChartProps) {
  const { productsWithCosts, isLoadingWithCosts } = useProducts(mode);

  

  const data = productsWithCosts
    ?.filter((p) => p.margin !== null && p.margin !== undefined)
    .map((p) => ({
      name: p.nom_produit.length > 15 ? p.nom_produit.substring(0, 15) + "..." : p.nom_produit,
      margin: Number((p.margin || 0).toFixed(1)),
      category: p.category_name || "Sans catégorie",
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 8) || [];

  if (isLoadingWithCosts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Marge brute par produit (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Marge brute par produit (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
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
          Marge brute par produit (%)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}%`, "Marge"]}
              />
              <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.margin)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span className="text-muted-foreground">Rentable (≥40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
            <span className="text-muted-foreground">Limite (30-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            <span className="text-muted-foreground">À revoir (&lt;30%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
