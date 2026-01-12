import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SensitivityResult } from '@/hooks/useSensitivityAnalysis';

interface SensitivityChartProps {
  title: string;
  icon?: React.ReactNode;
  costData: SensitivityResult[];
  priceData: SensitivityResult[];
  volumeData: SensitivityResult[];
  metric: 'marge' | 'marge_percent' | 'rentabilite' | 'ca';
  metricLabel: string;
  formatValue?: (value: number) => string;
}

export function SensitivityChart({
  title,
  icon,
  costData,
  priceData,
  volumeData,
  metric,
  metricLabel,
  formatValue = (v) => `${v.toFixed(2)} €`,
}: SensitivityChartProps) {
  // Combine data for chart
  const chartData = costData.map((_, index) => ({
    variation: `${costData[index].variation > 0 ? '+' : ''}${costData[index].variation}%`,
    variationNum: costData[index].variation,
    'Coût matières': costData[index][metric],
    'Prix de vente': priceData[index][metric],
    'Volume': volumeData[index][metric],
  }));

  // Find risk zones
  const baseValue = costData.find(d => d.variation === 0)?.[metric] || 0;
  const riskThreshold = baseValue * 0.5; // 50% du base comme seuil de risque

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="variation"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => 
                  metric === 'marge_percent' ? `${value.toFixed(0)}%` : `${(value / 1000).toFixed(0)}k€`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number, name: string) => [formatValue(value), name]}
                labelFormatter={(label) => `Variation: ${label}`}
              />
              <Legend />
              <ReferenceLine
                y={0}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                label={{ value: 'Seuil 0', fill: 'hsl(var(--destructive))', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="Coût matières"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Prix de vente"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Volume"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            <span className="text-muted-foreground">Variation coût matières</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-muted-foreground">Variation prix de vente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
            <span className="text-muted-foreground">Variation volume</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
