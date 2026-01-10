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

const data = [
  { name: "Sauce tomate", margin: 45, category: "Sauces" },
  { name: "Confiture fraise", margin: 38, category: "Confitures" },
  { name: "Pesto basilic", margin: 52, category: "Sauces" },
  { name: "Terrine porc", margin: 28, category: "Terrines" },
  { name: "Jus pomme", margin: 35, category: "Boissons" },
  { name: "Miel lavande", margin: 48, category: "Miels" },
  { name: "Rillettes", margin: 22, category: "Terrines" },
  { name: "Sirop menthe", margin: 42, category: "Boissons" },
];

const getBarColor = (margin: number) => {
  if (margin >= 40) return "hsl(var(--chart-1))";
  if (margin >= 30) return "hsl(var(--chart-4))";
  return "hsl(var(--destructive))";
};

export function MarginChart() {
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
                domain={[0, 60]}
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
