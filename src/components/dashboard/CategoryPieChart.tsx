import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMonthlyDistribution } from "@/hooks/useAnnualSalesEntry";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CategoryPieChartProps {
  year: number;
  mode: 'budget' | 'reel';
}

export function CategoryPieChart({ year, mode }: CategoryPieChartProps) {
  const { byChannel, isLoading } = useMonthlyDistribution(year);

  const data = useMemo(() => {
    if (!byChannel || byChannel.length === 0) return [];

    console.log('[CategoryPieChart] byChannel data:', byChannel, 'mode:', mode);

    // Use budget or reel CA based on mode
    const channelData = byChannel.map((ch, index) => ({
      name: ch.channel,
      value: mode === 'budget' ? ch.budget_ca : ch.reel_ca,
      color: COLORS[index % COLORS.length],
    }));

    const total = channelData.reduce((sum, item) => sum + item.value, 0);

    // Convert to percentages
    return channelData
      .map(item => ({
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [byChannel, mode]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Répartition CA par canal ({mode === 'budget' ? 'Budget' : 'Réel'})
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
            Répartition CA par canal ({mode === 'budget' ? 'Budget' : 'Réel'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Aucune donnée {mode === 'budget' ? 'budget' : 'réelle'} disponible pour {year}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Répartition CA par canal ({mode === 'budget' ? 'Budget' : 'Réel'} {year})
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
                label={({ name, percent }) => `${name} ${percent}%`}
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
                formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, "CA"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
