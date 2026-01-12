import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MonthlyTVA } from "@/hooks/useTVA";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface TVAMonthlyChartProps {
  data: MonthlyTVA[];
}

export function TVAMonthlyChart({ data }: TVAMonthlyChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const chartData = data.map((d) => ({
    ...d,
    mois: format(parseISO(d.mois), "MMM yy", { locale: fr }),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle de la TVA</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution mensuelle de la TVA</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
              className="fill-muted-foreground"
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "tvaCollectee"
                  ? "TVA Collectée"
                  : name === "tvaDeductible"
                  ? "TVA Déductible"
                  : "TVA Nette",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend
              formatter={(value) =>
                value === "tvaCollectee"
                  ? "TVA Collectée"
                  : value === "tvaDeductible"
                  ? "TVA Déductible"
                  : "TVA Nette"
              }
            />
            <Bar
              dataKey="tvaCollectee"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="tvaDeductible"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
