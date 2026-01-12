import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function CategoryPieChart() {
  const { productsWithCosts, isLoadingWithCosts } = useProducts();
  const { salesData, isLoading: isLoadingSales } = useSales();

  const data = useMemo(() => {
    if (!productsWithCosts || !salesData) return [];

    // Calculate CA by category from sales data
    const categoryCA: Record<string, number> = {};
    
    salesData.forEach((sale) => {
      const product = productsWithCosts.find((p) => p.id === sale.product_id);
      if (product) {
        const categoryName = product.category_name || "Sans catégorie";
        categoryCA[categoryName] = (categoryCA[categoryName] || 0) + sale.reel_ca;
      }
    });

    // If no sales data, use product count by category as fallback
    if (Object.keys(categoryCA).length === 0) {
      productsWithCosts.forEach((product) => {
        const categoryName = product.category_name || "Sans catégorie";
        categoryCA[categoryName] = (categoryCA[categoryName] || 0) + 1;
      });
    }

    const total = Object.values(categoryCA).reduce((sum, val) => sum + val, 0);

    return Object.entries(categoryCA)
      .map(([name, value], index) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [productsWithCosts, salesData]);

  if (isLoadingWithCosts || isLoadingSales) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Répartition CA par catégorie
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
            Répartition CA par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Aucune donnée de catégorie disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Répartition CA par catégorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value}%`, "Part CA"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
