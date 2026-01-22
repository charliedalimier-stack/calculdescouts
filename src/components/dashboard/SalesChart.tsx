import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMonthlyDistribution } from "@/hooks/useAnnualSalesEntry";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface SalesChartProps {
  year: number;
}

export function SalesChart({ year }: SalesChartProps) {
  const { monthly, isLoading } = useMonthlyDistribution(year);

  const chartData = useMemo(() => {
    if (!monthly || monthly.length === 0) return [];

    console.log('[SalesChart] Monthly data:', monthly);

    return monthly.map((m) => ({
      month: m.month_label.substring(0, 3),
      budget: Math.round(m.budget_ca),
      reel: Math.round(m.reel_ca),
    }));
  }, [monthly]);

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Évolution CA : Budget vs Réel ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some((d) => d.budget > 0 || d.reel > 0);

  if (!hasData) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Évolution CA : Budget vs Réel ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Aucune donnée de ventes disponible pour {year}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Évolution CA : Budget vs Réel ({year})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k€` : `${value}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value?.toLocaleString('fr-FR') || "-"} €`, ""]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="budget"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBudget)"
                name="Budget"
              />
              <Area
                type="monotone"
                dataKey="reel"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReel)"
                name="Réel"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span className="text-muted-foreground">Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
            <span className="text-muted-foreground">Réel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
