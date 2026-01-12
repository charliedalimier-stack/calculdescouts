import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { StressTestResult } from "@/hooks/useStressTest";
import { TrendingDown } from "lucide-react";

interface StressTestChartProps {
  data: StressTestResult[];
  scenarioName: string;
}

export function StressTestChart({ data, scenarioName }: StressTestChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Préparer les données pour le graphique
  const chartData = data.map(d => ({
    mois: d.monthLabel,
    'Scénario base': d.cumulBase,
    'Scénario stress': d.cumulStress,
    'Écart': d.ecart,
  }));

  const minValue = Math.min(...data.map(d => Math.min(d.cumulBase, d.cumulStress)));
  const maxValue = Math.max(...data.map(d => Math.max(d.cumulBase, d.cumulStress)));
  const yDomain = [Math.min(minValue * 1.1, 0), maxValue * 1.1];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="h-4 w-4 text-destructive" />
          Projection de trésorerie - {scenarioName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="mois" 
              className="text-xs"
            />
            <YAxis 
              tickFormatter={(v) => formatCurrency(v)}
              domain={yDomain}
              className="text-xs"
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            
            {/* Ligne de référence à zéro */}
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              label={{
                value: 'Équilibre',
                position: 'insideBottomRight',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10,
              }}
            />
            
            {/* Zone de danger */}
            <Area
              type="monotone"
              dataKey="Scénario base"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBase)"
            />
            <Area
              type="monotone"
              dataKey="Scénario stress"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStress)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Légende des zones */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Trésorerie de base</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Trésorerie sous stress</span>
          </div>
          {data.some(d => d.isNegative) && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-destructive">
                ⚠️ Passage en négatif détecté
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
