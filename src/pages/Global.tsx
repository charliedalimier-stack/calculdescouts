import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Package,
  Percent,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CalendarRange,
  Receipt,
} from "lucide-react";
import { useGlobalSynthesis } from "@/hooks/useGlobalSynthesis";
import { useMode } from "@/contexts/ModeContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getYearOptions, getCurrentYear, MONTH_LABELS_FULL } from "@/lib/dateOptions";

type PeriodType = 'month' | 'year';

const MONTHS = MONTH_LABELS_FULL.map((label, index) => ({
  value: index + 1,
  label,
}));

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (value: number) => 
  value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';

const getStatusBadge = (value: number, threshold: number = 0) => {
  if (value > threshold * 1.1) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
        <CheckCircle2 className="h-3 w-3" /> OK
      </Badge>
    );
  } else if (value >= threshold * 0.9) {
    return (
      <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1">
        <AlertCircle className="h-3 w-3" /> À surveiller
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
      <AlertTriangle className="h-3 w-3" /> Critique
    </Badge>
  );
};

const getVariationBadge = (current: number, previous: number) => {
  if (previous === 0) return null;
  
  const variation = ((current - previous) / previous) * 100;
  
  if (variation > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-primary">
        <TrendingUp className="h-3 w-3" />
        +{variation.toFixed(1)}%
      </span>
    );
  } else if (variation < 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <TrendingDown className="h-3 w-3" />
        {variation.toFixed(1)}%
      </span>
    );
  }
  return null;
};

const Global = () => {
  const { mode } = useMode();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data: synthesis, isLoading } = useGlobalSynthesis({
    periodType,
    year: selectedYear,
    month: periodType === 'month' ? selectedMonth : undefined,
  });

  const yearOptions = getYearOptions();

  const periodLabel = periodType === 'month' 
    ? `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
    : `Année ${selectedYear}`;

  // Prepare chart data
  const barChartData = [
    { name: 'CA HT', value: synthesis?.ca_ht || 0, fill: 'hsl(var(--primary))' },
    { name: 'Marge brute', value: synthesis?.marge_brute || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Coûts prod.', value: synthesis?.cout_production || 0, fill: 'hsl(var(--chart-4))' },
    { name: 'Frais pro.', value: synthesis?.frais_professionnels || 0, fill: 'hsl(var(--chart-5))' },
    { name: 'Résultat net', value: synthesis?.resultat_net || 0, fill: synthesis?.resultat_net && synthesis.resultat_net >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))' },
  ];

  const pieChartData = synthesis?.par_categorie.map((cat, i) => ({
    name: cat.category_name,
    value: cat.ca,
    fill: COLORS[i % COLORS.length],
  })) || [];

  if (isLoading) {
    return (
      <AppLayout title="Synthèse Globale" subtitle="Vue consolidée de la performance">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Synthèse Globale"
      subtitle={`Vue consolidée - Mode ${mode === 'simulation' ? 'Budget' : 'Réel'}`}
    >
      {/* Period Selectors */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1">
          {mode === 'simulation' ? '📊 Budget' : '✅ Réel'}
        </Badge>

        <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
          <TabsList>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mois
            </TabsTrigger>
            <TabsTrigger value="year" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Année
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {periodType === 'month' && (
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Alert Banner */}
      {synthesis && (synthesis.alerts.resultat_negatif || synthesis.alerts.cash_flow_negatif || synthesis.alerts.frais_vs_ca > 30) && (
        <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive flex-wrap">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Attention :</span>
            {synthesis.alerts.resultat_negatif && <span>Résultat net négatif</span>}
            {synthesis.alerts.resultat_negatif && synthesis.alerts.cash_flow_negatif && <span> • </span>}
            {synthesis.alerts.cash_flow_negatif && <span>Cash-flow après frais négatif</span>}
            {(synthesis.alerts.resultat_negatif || synthesis.alerts.cash_flow_negatif) && synthesis.alerts.frais_vs_ca > 30 && <span> • </span>}
            {synthesis.alerts.frais_vs_ca > 30 && <span>Frais &gt; 30% du CA ({synthesis.alerts.frais_vs_ca.toFixed(1)}%)</span>}
          </div>
        </div>
      )}

      {/* Key Figures Cards - Row 1 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">CA HT</p>
                <p className="text-xl font-bold">{formatCurrency(synthesis?.ca_ht || 0)}</p>
                {synthesis?.previous && getVariationBadge(synthesis.ca_ht, synthesis.previous.ca_ht)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                (synthesis?.marge_brute || 0) >= 0 ? "bg-primary/10" : "bg-destructive/10"
              )}>
                {(synthesis?.marge_brute || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Marge brute</p>
                <p className={cn(
                  "text-xl font-bold",
                  (synthesis?.marge_brute || 0) >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(synthesis?.marge_brute || 0)}
                </p>
                {synthesis?.previous && getVariationBadge(synthesis.marge_brute, synthesis.previous.marge_brute)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
                <Receipt className="h-5 w-5 text-chart-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Frais professionnels</p>
                <p className="text-xl font-bold">{formatCurrency(synthesis?.frais_professionnels || 0)}</p>
                {synthesis?.alerts.frais_vs_ca > 0 && (
                  <span className="text-xs text-muted-foreground">{synthesis.alerts.frais_vs_ca.toFixed(1)}% du CA</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                (synthesis?.resultat_net || 0) >= 0 ? "bg-primary/10" : "bg-destructive/10"
              )}>
                {(synthesis?.resultat_net || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Résultat net</p>
                <p className={cn(
                  "text-xl font-bold",
                  (synthesis?.resultat_net || 0) >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(synthesis?.resultat_net || 0)}
                </p>
                {getStatusBadge(synthesis?.resultat_net || 0, 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Figures Cards - Row 2 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Percent className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Taux de marge</p>
                <p className="text-xl font-bold">{(synthesis?.taux_marge || 0).toFixed(1)}%</p>
                {getStatusBadge(synthesis?.taux_marge || 0, 30)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                (synthesis?.cash_flow || 0) >= 0 ? "bg-primary/10" : "bg-destructive/10"
              )}>
                {(synthesis?.cash_flow || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Cash-flow (prod.)</p>
                <p className={cn(
                  "text-xl font-bold",
                  (synthesis?.cash_flow || 0) >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(synthesis?.cash_flow || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                (synthesis?.cash_flow_apres_frais || 0) >= 0 ? "bg-primary/10" : "bg-destructive/10"
              )}>
                {(synthesis?.cash_flow_apres_frais || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Cash-flow après frais</p>
                <p className={cn(
                  "text-xl font-bold",
                  (synthesis?.cash_flow_apres_frais || 0) >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(synthesis?.cash_flow_apres_frais || 0)}
                </p>
                {getStatusBadge(synthesis?.cash_flow_apres_frais || 0, 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Package className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Produits actifs</p>
                <p className="text-xl font-bold">{synthesis?.nb_produits_actifs || 0}</p>
                <span className="text-xs text-muted-foreground">{synthesis?.quantite_vendue || 0} unités vendues</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Key Figures Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Chiffres clés - {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicateur</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Chiffre d'affaires HT</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(synthesis?.ca_ht || 0)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(synthesis?.ca_ht || 0, 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Chiffre d'affaires TTC</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(synthesis?.ca_ttc || 0)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Coûts de production</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(synthesis?.cout_production || 0)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-accent/30">
                  <TableCell className="font-semibold">Marge brute</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    (synthesis?.marge_brute || 0) >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {formatCurrency(synthesis?.marge_brute || 0)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(synthesis?.marge_brute || 0, 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Taux de marge</TableCell>
                  <TableCell className="text-right font-medium">{(synthesis?.taux_marge || 0).toFixed(1)}%</TableCell>
                  <TableCell className="text-center">{getStatusBadge(synthesis?.taux_marge || 0, 30)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 border-border">
                  <TableCell className="text-chart-5 font-medium">Frais professionnels</TableCell>
                  <TableCell className="text-right text-chart-5">{formatCurrency(synthesis?.frais_professionnels || 0)}</TableCell>
                  <TableCell className="text-center">
                    {synthesis?.alerts.frais_vs_ca > 30 ? (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">{synthesis.alerts.frais_vs_ca.toFixed(0)}% du CA</Badge>
                    ) : synthesis?.alerts.frais_vs_ca > 20 ? (
                      <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">{synthesis.alerts.frais_vs_ca.toFixed(0)}% du CA</Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-accent/50">
                  <TableCell className="font-bold">Résultat net</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold text-lg",
                    (synthesis?.resultat_net || 0) >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {formatCurrency(synthesis?.resultat_net || 0)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(synthesis?.resultat_net || 0, 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TVA collectée</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(synthesis?.tva_collectee || 0)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TVA déductible (prod. + frais)</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(synthesis?.tva_deductible || 0)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cash-flow production</TableCell>
                  <TableCell className={cn(
                    "text-right",
                    (synthesis?.cash_flow || 0) >= 0 ? "" : "text-destructive"
                  )}>
                    {formatCurrency(synthesis?.cash_flow || 0)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-accent/30">
                  <TableCell className="font-semibold">Cash-flow après frais</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    (synthesis?.cash_flow_apres_frais || 0) >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {formatCurrency(synthesis?.cash_flow_apres_frais || 0)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(synthesis?.cash_flow_apres_frais || 0, 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bar Chart: CA vs Marge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">CA, Marge et Coûts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                <YAxis type="category" dataKey="name" width={60} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Category Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {(synthesis?.par_categorie.length || 0) === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Aucune donnée de vente
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-right">Rentabilité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {synthesis?.par_categorie.map((cat) => (
                    <TableRow key={cat.category_id}>
                      <TableCell className="font-medium">{cat.category_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cat.ca)}</TableCell>
                      <TableCell className={cn(
                        "text-right",
                        cat.marge >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {formatCurrency(cat.marge)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={cat.rentabilite >= 30 ? "default" : cat.rentabilite >= 15 ? "secondary" : "destructive"}>
                          {cat.rentabilite.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart: CA by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Répartition du CA par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Volumes & Production */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Volumes & Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-accent/30">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{synthesis?.quantite_vendue || 0}</p>
                <p className="text-sm text-muted-foreground">Quantité vendue</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/30">
                <Euro className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{formatCurrency(synthesis?.cout_moyen_unitaire || 0)}</p>
                <p className="text-sm text-muted-foreground">Coût moyen unitaire</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/30">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{synthesis?.nb_produits_actifs || 0}</p>
                <p className="text-sm text-muted-foreground">Produits actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Evolution (only for year view) */}
        {periodType === 'year' && (synthesis?.monthly_data.length || 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Évolution mensuelle {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={synthesis?.monthly_data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mois" 
                    tickFormatter={(v) => {
                      const [, m] = v.split('-');
                      return MONTHS[parseInt(m) - 1]?.label.slice(0, 3) || m;
                    }}
                  />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'ca_ht' ? 'CA HT' : name === 'marge' ? 'Marge brute' : name === 'frais' ? 'Frais pro.' : 'Résultat net'
                    ]}
                    labelFormatter={(label) => {
                      const [, m] = label.split('-');
                      return MONTHS[parseInt(m) - 1]?.label || label;
                    }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend formatter={(value) => value === 'ca_ht' ? 'CA HT' : value === 'marge' ? 'Marge brute' : value === 'frais' ? 'Frais pro.' : 'Résultat net'} />
                  <Line 
                    type="monotone" 
                    dataKey="ca_ht" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="marge" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="frais" 
                    stroke="hsl(var(--chart-5))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-5))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resultat_net" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Global;