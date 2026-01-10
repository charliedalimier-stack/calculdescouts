import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";

const cashFlowData = [
  { month: "Jan", encaissements: 5200, decaissements: 4800, solde: 400, cumul: 400 },
  { month: "Fév", encaissements: 5800, decaissements: 5200, solde: 600, cumul: 1000 },
  { month: "Mar", encaissements: 6500, decaissements: 5800, solde: 700, cumul: 1700 },
  { month: "Avr", encaissements: 5100, decaissements: 6200, solde: -1100, cumul: 600 },
  { month: "Mai", encaissements: 7200, decaissements: 5500, solde: 1700, cumul: 2300 },
  { month: "Juin", encaissements: 7800, decaissements: 6000, solde: 1800, cumul: 4100 },
];

const detailData = [
  {
    month: "Janvier",
    ventesBTC: 3200,
    ventesBTB: 2000,
    totalEncaissements: 5200,
    matieres: 2100,
    emballages: 800,
    mainOeuvre: 1200,
    energie: 400,
    autres: 300,
    totalDecaissements: 4800,
    solde: 400,
  },
  {
    month: "Février",
    ventesBTC: 3500,
    ventesBTB: 2300,
    totalEncaissements: 5800,
    matieres: 2300,
    emballages: 900,
    mainOeuvre: 1200,
    energie: 450,
    autres: 350,
    totalDecaissements: 5200,
    solde: 600,
  },
  {
    month: "Mars",
    ventesBTC: 4000,
    ventesBTB: 2500,
    totalEncaissements: 6500,
    matieres: 2600,
    emballages: 1000,
    mainOeuvre: 1400,
    energie: 480,
    autres: 320,
    totalDecaissements: 5800,
    solde: 700,
  },
];

const getSoldeBadge = (solde: number) => {
  if (solde > 0) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        +{solde.toLocaleString()} €
      </Badge>
    );
  } else if (solde === 0) {
    return <Badge variant="outline">0 €</Badge>;
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
      {solde.toLocaleString()} €
    </Badge>
  );
};

const CashFlow = () => {
  const currentMonth = cashFlowData[cashFlowData.length - 1];
  const hasNegativeCashFlow = cashFlowData.some((d) => d.cumul < 0);

  return (
    <AppLayout
      title="Cash-flow"
      subtitle="Suivez votre trésorerie mensuelle"
    >
      {/* Alert if negative */}
      {hasNegativeCashFlow && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Attention : trésorerie négative détectée</p>
              <p className="text-sm text-muted-foreground">
                Certains mois présentent un solde cumulé négatif. Revoyez vos délais de paiement ou votre plan de production.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encaissements</p>
                <p className="text-xl font-bold">{currentMonth.encaissements.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Décaissements</p>
                <p className="text-xl font-bold">{currentMonth.decaissements.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                currentMonth.solde >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                <Wallet className={`h-5 w-5 ${currentMonth.solde >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde du mois</p>
                <p className={`text-xl font-bold ${currentMonth.solde >= 0 ? "text-primary" : "text-destructive"}`}>
                  {currentMonth.solde >= 0 ? "+" : ""}{currentMonth.solde.toLocaleString()} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Wallet className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trésorerie cumulée</p>
                <p className="text-xl font-bold">{currentMonth.cumul.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Évolution de la trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} €`,
                    name === "cumul" ? "Trésorerie cumulée" : name === "encaissements" ? "Encaissements" : "Décaissements",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="cumul"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCumul)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            Détail mensuel
            <Badge variant="outline" className="ml-2">
              <Info className="mr-1 h-3 w-3" />
              Premier trimestre 2026
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Ventes BTC</TableHead>
                <TableHead className="text-right">Ventes BTB</TableHead>
                <TableHead className="text-right">Total encaiss.</TableHead>
                <TableHead className="text-right">Matières</TableHead>
                <TableHead className="text-right">Emballages</TableHead>
                <TableHead className="text-right">Main d'œuvre</TableHead>
                <TableHead className="text-right">Total décaiss.</TableHead>
                <TableHead className="text-center">Solde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">{row.ventesBTC.toLocaleString()} €</TableCell>
                  <TableCell className="text-right">{row.ventesBTB.toLocaleString()} €</TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {row.totalEncaissements.toLocaleString()} €
                  </TableCell>
                  <TableCell className="text-right">{row.matieres.toLocaleString()} €</TableCell>
                  <TableCell className="text-right">{row.emballages.toLocaleString()} €</TableCell>
                  <TableCell className="text-right">{row.mainOeuvre.toLocaleString()} €</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {row.totalDecaissements.toLocaleString()} €
                  </TableCell>
                  <TableCell className="text-center">{getSoldeBadge(row.solde)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default CashFlow;
