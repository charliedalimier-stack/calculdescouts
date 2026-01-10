import { AppLayout } from "@/components/layout/AppLayout";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
} from "recharts";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";

// Pareto data (80/20 analysis)
const paretoData = [
  { name: "Sauce tomate", ca: 2450, cumulPercent: 23 },
  { name: "Jus pomme", ca: 1600, cumulPercent: 38 },
  { name: "Pesto basilic", ca: 1872, cumulPercent: 56 },
  { name: "Confiture fraise", ca: 1800, cumulPercent: 73 },
  { name: "Sirop menthe", ca: 1040, cumulPercent: 83 },
  { name: "Miel lavande", ca: 700, cumulPercent: 90 },
  { name: "Terrine porc", ca: 576, cumulPercent: 95 },
  { name: "Rillettes", ca: 450, cumulPercent: 100 },
];

// Coefficient dispersion data
const coefficientData = [
  { name: "Sauce tomate", coefficient: 2.26, target: 2.0 },
  { name: "Confiture fraise", coefficient: 2.21, target: 2.0 },
  { name: "Pesto basilic", coefficient: 2.31, target: 2.0 },
  { name: "Terrine porc", coefficient: 1.39, target: 2.0 },
  { name: "Jus pomme", coefficient: 2.00, target: 2.0 },
  { name: "Miel lavande", coefficient: 2.15, target: 2.0 },
  { name: "Rillettes", coefficient: 1.55, target: 2.0 },
  { name: "Sirop menthe", coefficient: 2.10, target: 2.0 },
];

const Analysis = () => {
  return (
    <AppLayout
      title="Analyses"
      subtitle="Visualisations avancées pour la prise de décision"
    >
      {/* Pareto Analysis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analyse de Pareto (80/20)
            <Badge variant="outline" className="ml-2">
              83% du CA généré par 5 produits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${value}€`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "ca" ? `${value.toLocaleString()} €` : `${value}%`,
                    name === "ca" ? "CA" : "% cumulé",
                  ]}
                />
                <Bar yAxisId="left" dataKey="ca" radius={[4, 4, 0, 0]}>
                  {paretoData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.cumulPercent <= 80 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulPercent"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
              <span className="text-muted-foreground">Produits clés (80% du CA)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-5))" }} />
              <span className="text-muted-foreground">Produits secondaires</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
              <span className="text-muted-foreground">% cumulé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coefficient Dispersion */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Dispersion des coefficients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coefficientData} layout="vertical" margin={{ left: 100, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  domain={[0, 3]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}x`, "Coefficient"]}
                />
                <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                  {coefficientData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.coefficient >= 2.0
                          ? "hsl(var(--chart-1))"
                          : entry.coefficient >= 1.7
                          ? "hsl(var(--chart-4))"
                          : "hsl(var(--destructive))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
              <span className="text-muted-foreground">Optimal (≥2.0x)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
              <span className="text-muted-foreground">Acceptable (1.7-2.0x)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
              <span className="text-muted-foreground">Insuffisant (&lt;1.7x)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin and Category Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarginChart />
        <CategoryPieChart />
      </div>

      {/* Insights */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-primary" />
            Points d'attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h4 className="font-semibold text-foreground">Terrine porc & Rillettes</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Coefficient inférieur à 1.6x. Augmentez le prix de vente ou réduisez les coûts de production.
              </p>
            </div>
            <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
              <h4 className="font-semibold text-foreground">Concentration du CA</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                5 produits représentent 83% du CA. Risque de dépendance - diversifiez votre gamme.
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-semibold text-foreground">Pesto basilic</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Meilleur coefficient (2.31x). Produit à développer - considérez des déclinaisons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Analysis;
