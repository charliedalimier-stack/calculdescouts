import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Scale,
} from "lucide-react";
import { useBudgetVsReel } from "@/hooks/useBudgetVsReel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getYearOptions, getCurrentYear, MONTH_LABELS_FULL } from "@/lib/dateOptions";

type PeriodType = 'month' | 'year';

const MONTHS = MONTH_LABELS_FULL.map((label, index) => ({
  value: index + 1,
  label,
}));

const formatCurrency = (value: number) => 
  value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';

const formatPercent = (value: number | null) => {
  if (value === null) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const getEcartColor = (ecart: number, isExpense: boolean = false) => {
  // For expenses, positive ecart (higher costs) is bad
  // For revenue/margin, positive ecart is good
  if (isExpense) {
    if (ecart > 0) return 'text-destructive';
    if (ecart < 0) return 'text-primary';
  } else {
    if (ecart > 0) return 'text-primary';
    if (ecart < 0) return 'text-destructive';
  }
  return 'text-muted-foreground';
};

const getEcartIcon = (ecart: number, isExpense: boolean = false) => {
  if (Math.abs(ecart) < 0.01) return <Minus className="h-4 w-4" />;
  if (isExpense) {
    return ecart > 0 
      ? <ArrowUpRight className="h-4 w-4" />
      : <ArrowDownRight className="h-4 w-4" />;
  }
  return ecart > 0 
    ? <ArrowUpRight className="h-4 w-4" />
    : <ArrowDownRight className="h-4 w-4" />;
};

const BudgetVsReel = () => {
  const currentDate = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>('year');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [activeTab, setActiveTab] = useState('summary');

  const { data, isLoading } = useBudgetVsReel({
    periodType,
    year: selectedYear,
    month: periodType === 'month' ? selectedMonth : undefined,
  });

  const yearOptions = getYearOptions();

  const periodLabel = periodType === 'month' 
    ? `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
    : `Année ${selectedYear}`;

  // Chart data for monthly comparison
  const monthlyChartData = useMemo(() => {
    if (!data?.monthly_comparison) return [];
    return data.monthly_comparison.map(m => ({
      mois: m.mois.slice(5, 7), // Extract month number
      'Budget CA': m.budget_ca,
      'Réel CA': m.reel_ca,
      'Budget Marge': m.budget_marge,
      'Réel Marge': m.reel_marge,
    }));
  }, [data]);

  // Chart data for category comparison
  const categoryChartData = useMemo(() => {
    if (!data?.par_categorie) return [];
    return data.par_categorie.map(cat => ({
      name: cat.category_name.length > 15 
        ? cat.category_name.slice(0, 15) + '...' 
        : cat.category_name,
      Budget: cat.budget_ca,
      Réel: cat.reel_ca,
      ecart: cat.ecart,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <AppLayout title="Budget vs Réel" subtitle="Analyse des écarts">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
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
      title="Budget vs Réel"
      subtitle="Comparaison des prévisions et des résultats réels"
    >
      {/* Period Selectors */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1 gap-2">
          <Scale className="h-4 w-4" />
          Analyse comparative
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

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Synthèse</TabsTrigger>
          <TabsTrigger value="products">Par produit</TabsTrigger>
          <TabsTrigger value="categories">Par catégorie</TabsTrigger>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.indicators.map((indicator, index) => {
              const isExpense = indicator.indicator === 'Frais professionnels' || indicator.indicator === 'Coût de production';
              
              return (
                <Card key={indicator.indicator}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {indicator.indicator}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(indicator.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Réel</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(indicator.reel)}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        getEcartColor(indicator.ecart, isExpense)
                      )}>
                        {getEcartIcon(indicator.ecart, isExpense)}
                        <span>
                          {formatCurrency(indicator.ecart)} ({formatPercent(indicator.ecartPercent)})
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Tableau récapitulatif - {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicateur</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Réel</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead className="text-right">Écart (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.indicators.map((indicator) => {
                    const isExpense = indicator.indicator === 'Frais professionnels' || indicator.indicator === 'Coût de production';
                    
                    return (
                      <TableRow key={indicator.indicator}>
                        <TableCell className="font-medium">{indicator.indicator}</TableCell>
                        <TableCell className="text-right">{formatCurrency(indicator.budget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(indicator.reel)}</TableCell>
                        <TableCell className={cn("text-right", getEcartColor(indicator.ecart, isExpense))}>
                          {formatCurrency(indicator.ecart)}
                        </TableCell>
                        <TableCell className={cn("text-right", getEcartColor(indicator.ecart, isExpense))}>
                          {formatPercent(indicator.ecartPercent)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Category Bar Chart */}
          {categoryChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Budget vs Réel par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                      <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Budget" fill="hsl(var(--chart-4))" name="Budget" />
                      <Bar dataKey="Réel" fill="hsl(var(--primary))" name="Réel" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Analyse par produit - {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Qté Budget</TableHead>
                    <TableHead className="text-right">Qté Réel</TableHead>
                    <TableHead className="text-right">Écart Qté</TableHead>
                    <TableHead className="text-right">CA Budget</TableHead>
                    <TableHead className="text-right">CA Réel</TableHead>
                    <TableHead className="text-right">Écart CA</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.par_produit.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell className="text-right">{product.budget_qty}</TableCell>
                      <TableCell className="text-right">{product.reel_qty}</TableCell>
                      <TableCell className={cn("text-right", getEcartColor(product.ecart_qty))}>
                        {product.ecart_qty > 0 ? '+' : ''}{product.ecart_qty}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.budget_ca)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.reel_ca)}</TableCell>
                      <TableCell className={cn("text-right", getEcartColor(product.ecart_ca))}>
                        {formatCurrency(product.ecart_ca)}
                      </TableCell>
                      <TableCell className={cn("text-right", getEcartColor(product.ecart_percent || 0))}>
                        {formatPercent(product.ecart_percent)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.par_produit || data.par_produit.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Aucune donnée disponible pour cette période
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Analyse par catégorie - {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">CA Budget</TableHead>
                    <TableHead className="text-right">CA Réel</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead className="text-right">Écart (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.par_categorie.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(category.budget_ca)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(category.reel_ca)}</TableCell>
                      <TableCell className={cn("text-right", getEcartColor(category.ecart))}>
                        {formatCurrency(category.ecart)}
                      </TableCell>
                      <TableCell className={cn("text-right", getEcartColor(category.ecart))}>
                        {formatPercent(category.ecart_percent)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.par_categorie || data.par_categorie.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune donnée disponible pour cette période
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution">
          <div className="space-y-6">
            {/* Monthly CA Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Évolution mensuelle du CA - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mois" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Budget CA" fill="hsl(var(--chart-4))" name="Budget CA" />
                      <Bar dataKey="Réel CA" fill="hsl(var(--primary))" name="Réel CA" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Margin Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Évolution mensuelle de la marge - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mois" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" />
                      <Bar dataKey="Budget Marge" fill="hsl(var(--chart-2))" name="Budget Marge" />
                      <Bar dataKey="Réel Marge" fill="hsl(var(--chart-1))" name="Réel Marge" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Detail Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Détail mensuel - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">Budget CA</TableHead>
                      <TableHead className="text-right">Réel CA</TableHead>
                      <TableHead className="text-right">Écart CA</TableHead>
                      <TableHead className="text-right">Budget Marge</TableHead>
                      <TableHead className="text-right">Réel Marge</TableHead>
                      <TableHead className="text-right">Écart Marge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.monthly_comparison.map((month) => {
                      const ecartCa = month.reel_ca - month.budget_ca;
                      const ecartMarge = month.reel_marge - month.budget_marge;
                      const monthLabel = MONTHS.find(m => m.value === parseInt(month.mois.slice(5, 7)))?.label || month.mois;
                      
                      return (
                        <TableRow key={month.mois}>
                          <TableCell className="font-medium">{monthLabel}</TableCell>
                          <TableCell className="text-right">{formatCurrency(month.budget_ca)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(month.reel_ca)}</TableCell>
                          <TableCell className={cn("text-right", getEcartColor(ecartCa))}>
                            {formatCurrency(ecartCa)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(month.budget_marge)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(month.reel_marge)}</TableCell>
                          <TableCell className={cn("text-right", getEcartColor(ecartMarge))}>
                            {formatCurrency(ecartMarge)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!data?.monthly_comparison || data.monthly_comparison.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucune donnée disponible pour cette période
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default BudgetVsReel;
