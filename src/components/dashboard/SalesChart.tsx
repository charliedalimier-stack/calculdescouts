import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/contexts/ProjectContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export function SalesChart() {
  const { currentProject } = useProject();

  const { data: salesTargets, isLoading: isLoadingTargets } = useQuery({
    queryKey: ["sales-targets-chart", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      const { data, error } = await supabase
        .from("sales_targets")
        .select("mois, quantite_objectif, product_id")
        .eq("project_id", currentProject.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentProject?.id,
  });

  const { data: salesActuals, isLoading: isLoadingActuals } = useQuery({
    queryKey: ["sales-actuals-chart", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      const { data, error } = await supabase
        .from("sales_actuals")
        .select("mois, quantite_reelle, product_id")
        .eq("project_id", currentProject.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentProject?.id,
  });

  const { data: products } = useQuery({
    queryKey: ["products-chart", currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, prix_btc")
        .eq("project_id", currentProject.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentProject?.id,
  });

  const chartData = useMemo(() => {
    // Generate last 8 months
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(startOfMonth(date), "yyyy-MM-dd");
      const monthLabel = format(date, "MMM", { locale: fr });
      months.push({ key: monthKey, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
    }

    // Create a map of product prices
    const priceMap: Record<string, number> = {};
    products?.forEach((p) => {
      priceMap[p.id] = p.prix_btc;
    });

    // Aggregate targets and actuals by month
    const targetsByMonth: Record<string, number> = {};
    const actualsByMonth: Record<string, number> = {};

    salesTargets?.forEach((t) => {
      const monthKey = format(new Date(t.mois), "yyyy-MM-dd");
      const price = priceMap[t.product_id] || 0;
      targetsByMonth[monthKey] = (targetsByMonth[monthKey] || 0) + t.quantite_objectif * price;
    });

    salesActuals?.forEach((a) => {
      const monthKey = format(new Date(a.mois), "yyyy-MM-dd");
      const price = priceMap[a.product_id] || 0;
      actualsByMonth[monthKey] = (actualsByMonth[monthKey] || 0) + a.quantite_reelle * price;
    });

    return months.map((m) => ({
      month: m.label,
      previsionnel: Math.round(targetsByMonth[m.key] || 0),
      reel: actualsByMonth[m.key] ? Math.round(actualsByMonth[m.key]) : null,
    }));
  }, [salesTargets, salesActuals, products]);

  const isLoading = isLoadingTargets || isLoadingActuals;

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Évolution CA : Prévisionnel vs Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some((d) => d.previsionnel > 0 || (d.reel && d.reel > 0));

  if (!hasData) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Évolution CA : Prévisionnel vs Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Aucune donnée de ventes disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Évolution CA : Prévisionnel vs Réel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value: number | null) => [`${value?.toLocaleString() || "-"} €`, ""]}
              />
              <Area
                type="monotone"
                dataKey="previsionnel"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrev)"
                name="Prévisionnel"
              />
              <Area
                type="monotone"
                dataKey="reel"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReel)"
                name="Réel"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span className="text-muted-foreground">Prévisionnel</span>
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
