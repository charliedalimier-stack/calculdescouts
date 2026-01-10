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

const data = [
  { month: "Jan", previsionnel: 4200, reel: 3800 },
  { month: "Fév", previsionnel: 4500, reel: 4200 },
  { month: "Mar", previsionnel: 5000, reel: 5400 },
  { month: "Avr", previsionnel: 5500, reel: 5100 },
  { month: "Mai", previsionnel: 6000, reel: 6200 },
  { month: "Juin", previsionnel: 7000, reel: 6800 },
  { month: "Juil", previsionnel: 7500, reel: null },
  { month: "Août", previsionnel: 6500, reel: null },
];

export function SalesChart() {
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
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                tickFormatter={(value) => `${value / 1000}k€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value?.toLocaleString() || "-"} €`, ""]}
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
