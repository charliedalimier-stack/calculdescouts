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
} from "lucide-react";
import { useGlobalSynthesis } from "@/hooks/useGlobalSynthesis";
import { useMode } from "@/contexts/ModeContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PeriodType = 'month' | 'year';

const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => ({
    value: year.toString(),
    label: year.toString(),
  }));
};

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
  const currentDate = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

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
    { name: 'Marge', value: synthesis?.marge_brute || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Coûts', value: synthesis?.cout_production || 0, fill: 'hsl(var(--chart-4))' },
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
      subtitle={`Vue consolidée - Mode ${mode === 'simulation' ? 'Simulation' : 'Réel'}`}
    >
      {/* Period Selectors */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1">
          {mode === 'simulation' ? '🔬 Simulation' : '📊 Réel'}
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
      {synthesis && (synthesis.marge_brute < 0 || synthesis.cash_flow < 0) && (
        <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Attention :</span>
            {synthesis.marge_brute < 0 && <span>Marge négative</span>}
            {synthesis.marge_brute < 0 && synthesis.cash_flow < 0 && <span> • </span>}
            {synthesis.cash_flow < 0 && <span>Cash-flow négatif</span>}
          </div>
        </div>
      )}

      {/* Key Figures Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">Cash-flow</p>
                <p className={cn(
                  "text-xl font-bold",
                  (synthesis?.cash_flow || 0) >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(synthesis?.cash_flow || 0)}
                </p>
                {synthesis?.previous && getVariationBadge(synthesis.cash_flow, synthesis.previous.cash_flow)}
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
                <TableRow>
                  <TableCell>TVA collectée</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(synthesis?.tva_collectee || 0)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TVA déductible</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(synthesis?.tva_deductible || 0)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-accent/30">
                  <TableCell className="font-semibold">Cash-flow période</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    (synthesis?.cash_flow || 0) >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {formatCurrency(synthesis?.cash_flow || 0)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(synthesis?.cash_flow || 0, 0)}</TableCell>
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
                      name === 'ca_ht' ? 'CA HT' : 'Marge'
                    ]}
                    labelFormatter={(label) => {
                      const [, m] = label.split('-');
                      return MONTHS[parseInt(m) - 1]?.label || label;
                    }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend formatter={(value) => value === 'ca_ht' ? 'CA HT' : 'Marge'} />
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