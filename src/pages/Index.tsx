import {
  TrendingUp,
  Package,
  Wallet,
  CircleDollarSign,
  ChefHat,
  Receipt,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { BCGMatrix } from "@/components/dashboard/BCGMatrix";
import { ProductAlerts } from "@/components/dashboard/ProductAlerts";
import { useProducts } from "@/hooks/useProducts";
import { useGlobalSynthesis } from "@/hooks/useGlobalSynthesis";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const Index = () => {
  const currentDate = new Date();
  const [periodType, setPeriodType] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { products, isLoadingWithCosts } = useProducts();
  const { data: synthesisData, isLoading: isLoadingSynthesis } = useGlobalSynthesis({
    periodType,
    year: selectedYear,
    month: periodType === 'month' ? selectedMonth : undefined,
  });

  // Default synthesis if no data
  const synthesis = useMemo(() => synthesisData || {
    ca_ht: 0,
    ca_ttc: 0,
    cout_production: 0,
    marge_brute: 0,
    taux_marge: 0,
    resultat_net: 0,
    cash_flow: 0,
    cash_flow_apres_frais: 0,
    frais_professionnels: 0,
    quantite_vendue: 0,
    par_categorie: [],
    previous: null,
    alerts: { resultat_negatif: false, cash_flow_negatif: false, frais_vs_ca: 0 },
  }, [synthesisData]);

  // Generate years list (current year and 2 previous)
  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const topCategories = useMemo(() => {
    if (!synthesis.par_categorie) return [];

    return synthesis.par_categorie
      .slice(0, 4)
      .map((cat) => ({
        name: cat.category_name,
        revenue: cat.ca,
        margin: cat.rentabilite,
        count: 1,
      }));
  }, [synthesis]);

  const isLoading = isLoadingWithCosts || isLoadingSynthesis;

  // Period label for display
  const periodLabel = periodType === 'month' 
    ? `${MONTHS[selectedMonth - 1]?.label} ${selectedYear}`
    : `Année ${selectedYear}`;
  
  // Variation vs previous period
  const variationCA = synthesis.previous 
    ? ((synthesis.ca_ht - synthesis.previous.ca_ht) / synthesis.previous.ca_ht) * 100 
    : 0;

  return (
    <AppLayout
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
    >
      {/* Period Selector */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Période :</span>
          </div>
          <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as 'month' | 'year')}>
            <TabsList>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="year">Année</TabsTrigger>
            </TabsList>
          </Tabs>
          {periodType === 'month' && (
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">{periodLabel}</span>
        </CardContent>
      </Card>

      {/* Alert if negative result */}
      {!isLoading && synthesis.resultat_net < 0 && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Résultat net négatif {periodType === 'month' ? 'ce mois' : 'cette année'}</p>
              <p className="text-sm text-muted-foreground">
                Marge brute ({synthesis.marge_brute.toLocaleString('fr-FR')} €) - Frais ({synthesis.frais_professionnels.toLocaleString('fr-FR')} €) = {synthesis.resultat_net.toLocaleString('fr-FR')} €
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Row 1 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        ) : (
          <>
            <KPICard
              title="Chiffre d'affaires HT"
              value={`${synthesis.ca_ht.toLocaleString("fr-FR")} €`}
              change={variationCA !== 0 
                ? `${variationCA >= 0 ? "+" : ""}${variationCA.toFixed(1)}% vs période préc.`
                : "Première période"}
              changeType={variationCA >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
              tooltip={`Total des ventes HT - ${periodLabel}`}
            />
            <KPICard
              title="Marge brute"
              value={`${synthesis.taux_marge.toFixed(1)}%`}
              change={synthesis.taux_marge >= 35 ? "Objectif atteint" : "En dessous de l'objectif"}
              changeType={synthesis.taux_marge >= 35 ? "positive" : "negative"}
              icon={CircleDollarSign}
              tooltip="Marge brute en pourcentage du CA"
            />
            <KPICard
              title="Frais professionnels"
              value={`${synthesis.frais_professionnels.toLocaleString("fr-FR")} €`}
              change={synthesis.ca_ht > 0 ? `${((synthesis.frais_professionnels / synthesis.ca_ht) * 100).toFixed(1)}% du CA` : "Aucun CA"}
              changeType={synthesis.frais_professionnels > synthesis.marge_brute ? "negative" : "neutral"}
              icon={Receipt}
              tooltip="Frais fixes de la période"
            />
            <KPICard
              title="Résultat net"
              value={`${synthesis.resultat_net.toLocaleString("fr-FR")} €`}
              change={synthesis.resultat_net >= 0 ? "Rentable" : "Non rentable"}
              changeType={synthesis.resultat_net >= 0 ? "positive" : "negative"}
              icon={synthesis.resultat_net >= 0 ? TrendingUp : AlertTriangle}
              tooltip="Marge brute - Frais professionnels"
            />
          </>
        )}
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        ) : (
          <>
            <KPICard
              title="Produits actifs"
              value={(products?.length || 0).toString()}
              change={`${products?.length || 0} produit${(products?.length || 0) > 1 ? "s" : ""} en catalogue`}
              changeType="neutral"
              icon={Package}
              tooltip="Nombre de produits en vente"
            />
            <KPICard
              title="Volumes vendus"
              value={synthesis.quantite_vendue.toLocaleString("fr-FR")}
              change={`${synthesis.quantite_vendue} unités vendues`}
              changeType="neutral"
              icon={Package}
              tooltip="Nombre total d'unités vendues"
            />
            <KPICard
              title="Cash-flow"
              value={`${synthesis.cash_flow_apres_frais.toLocaleString("fr-FR")} €`}
              change={synthesis.cash_flow_apres_frais >= 0 ? "Trésorerie positive" : "Tension de trésorerie"}
              changeType={synthesis.cash_flow_apres_frais >= 0 ? "positive" : "negative"}
              icon={Wallet}
              tooltip="Flux de trésorerie de la période"
            />
            <KPICard
              title="CA TTC"
              value={`${synthesis.ca_ttc.toLocaleString("fr-FR")} €`}
              change={`TVA: ${(synthesis.ca_ttc - synthesis.ca_ht).toLocaleString("fr-FR")} €`}
              changeType="neutral"
              icon={TrendingUp}
              tooltip="Chiffre d'affaires toutes taxes comprises"
            />
          </>
        )}
      </div>

      {/* Main Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <SalesChart />
        <ProductAlerts />
      </div>

      {/* Secondary Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <MarginChart />
        <CategoryPieChart />
      </div>

      {/* BCG Matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BCGMatrix />
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <ChefHat className="h-5 w-5 text-primary" />
            Top catégories - {periodLabel}
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
            </div>
          ) : topCategories.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Aucune vente enregistrée
            </div>
          ) : (
            <div className="space-y-4">
              {topCategories.map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{cat.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {cat.revenue.toLocaleString("fr-FR")} €
                    </p>
                    <p className="text-sm text-primary">
                      {cat.margin.toFixed(1)}% marge
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;