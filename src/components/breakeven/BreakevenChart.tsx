import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { BreakevenResult } from "@/hooks/useBreakevenAnalysis";
import { TrendingUp } from "lucide-react";

interface BreakevenChartProps {
  data: BreakevenResult;
  maxVolume?: number;
}

export function BreakevenChart({ data, maxVolume }: BreakevenChartProps) {
  const max = maxVolume || Math.max(data.seuilUnites * 2, data.volumeActuel * 1.5, 100);
  const steps = 10;
  const stepSize = Math.ceil(max / steps);

  // Générer les données pour le graphique
  const chartData = Array.from({ length: steps + 1 }, (_, i) => {
    const volume = i * stepSize;
    const caTotal = volume * data.prixVenteHT;
    const coutTotal = data.coutFixeAlloue + (volume * data.coutVariable);
    const profit = caTotal - coutTotal;

    return {
      volume,
      ca: caTotal,
      couts: coutTotal,
      coutsVariables: volume * data.coutVariable,
      coutsFixed: data.coutFixeAlloue,
      profit,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Point mort - {data.productName}
          <span className="ml-2 text-xs font-normal text-muted-foreground uppercase">
            ({data.channel})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="volume"
              tickFormatter={(v) => v.toLocaleString('fr-FR')}
              label={{ value: 'Volume (unités)', position: 'insideBottom', offset: -5 }}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              className="text-xs"
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'ca' ? 'Chiffre d\'affaires' :
                name === 'couts' ? 'Coûts totaux' :
                name === 'profit' ? 'Résultat' : name
              ]}
              labelFormatter={(label) => `Volume: ${Number(label).toLocaleString('fr-FR')} unités`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            
            {/* Zone de perte (rouge) et profit (vert) */}
            <Area
              dataKey="profit"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.1}
              stroke="none"
            />
            
            {/* Ligne du CA */}
            <Line
              type="monotone"
              dataKey="ca"
              name="Chiffre d'affaires"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
            
            {/* Ligne des coûts totaux */}
            <Line
              type="monotone"
              dataKey="couts"
              name="Coûts totaux"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={false}
            />
            
            {/* Ligne de résultat */}
            <Line
              type="monotone"
              dataKey="profit"
              name="Résultat"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            
            {/* Point mort vertical */}
            {data.seuilUnites > 0 && (
              <ReferenceLine
                x={data.seuilUnites}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                label={{
                  value: `Seuil: ${data.seuilUnites.toLocaleString('fr-FR')}`,
                  position: 'top',
                  fill: 'hsl(var(--destructive))',
                  fontSize: 11,
                }}
              />
            )}
            
            {/* Volume actuel */}
            {data.volumeActuel > 0 && (
              <ReferenceLine
                x={data.volumeActuel}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                label={{
                  value: `Actuel: ${data.volumeActuel.toLocaleString('fr-FR')}`,
                  position: 'top',
                  fill: 'hsl(var(--primary))',
                  fontSize: 11,
                }}
              />
            )}
            
            {/* Ligne du zéro */}
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Légende explicative */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span>Seuil de rentabilité: {data.seuilUnites.toLocaleString('fr-FR')} unités ({formatCurrency(data.seuilCA)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span>Volume actuel: {data.volumeActuel.toLocaleString('fr-FR')} unités</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={data.isRentable ? "text-chart-2 font-medium" : "text-destructive font-medium"}>
              {data.isRentable ? "✓ Rentable" : "✗ Sous le seuil"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
