import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, BarChart3, Edit3, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentYear } from "@/lib/dateOptions";
import { 
  useSeasonalityCoefficients, 
  useAnnualSalesEntry, 
  useMonthlyDistribution 
} from "@/hooks/useAnnualSalesEntry";
import { AnnualEntryTable } from "@/components/sales/AnnualEntryTable";
import { SeasonalityEditor } from "@/components/sales/SeasonalityEditor";
import { MonthlyViewTable } from "@/components/sales/MonthlyViewTable";
import { ObjectivesComparisonTable } from "@/components/sales/ObjectivesComparisonTable";
import { SalesCharts } from "@/components/sales/SalesCharts";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";

type ViewMode = 'entry' | 'monthly' | 'comparison';

const Sales = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('entry');
  const [dataMode, setDataMode] = useState<DataMode>('budget');
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  // Hooks with dynamic year and mode
  const { coefficients, isLoading: loadingCoefs, updateCoefficients } = useSeasonalityCoefficients(selectedYear, dataMode);
  const { entries, totals: entryTotals, isLoading: loadingEntries, setAnnualSales } = useAnnualSalesEntry(selectedYear, dataMode);
  const { monthly, byChannel, totals: monthlyTotals, isLoading: loadingMonthly } = useMonthlyDistribution(selectedYear);

  const isLoading = loadingCoefs || loadingEntries || loadingMonthly;

  // Summary KPIs - Dynamically based on selected mode
  const budgetCa = monthlyTotals.budget_ca;
  const reelCa = monthlyTotals.reel_ca;
  
  // Primary CA depends on selected mode
  const primaryCa = dataMode === 'budget' ? budgetCa : reelCa;
  const primaryLabel = dataMode === 'budget' ? 'CA Budget' : 'CA Réel';
  
  // Variance is always: Réel - Budget
  const ecartCa = monthlyTotals.ecart_ca;
  const ecartPercent = monthlyTotals.ecart_percent;

  // Period change handler
  const handlePeriodChange = ({ year, mode }: { month?: number; year: number; mode: DataMode }) => {
    console.log('[Sales] Period changed:', { year, mode });
    setSelectedYear(year);
    setDataMode(mode);
  };

  if (isLoading && entries.length === 0) {
    return (
      <AppLayout title="Ventes" subtitle="Saisie annuelle → Lecture mensuelle">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Ventes"
      subtitle="Saisie annuelle → Lecture mensuelle"
    >
      {/* Period Selector */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <PeriodSelector
          year={selectedYear}
          mode={dataMode}
          showMonth={false}
          onChange={handlePeriodChange}
        />

        <div className="flex-1" />

        {/* View Selector */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="entry" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Saisie
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Mensuel
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objectifs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Primary CA Card - changes based on mode */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                dataMode === 'budget' ? 'bg-accent' : 'bg-primary/10'
              }`}>
                {dataMode === 'budget' ? (
                  <Target className="h-5 w-5 text-accent-foreground" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{primaryLabel} {selectedYear}</p>
                <p className="text-xl font-bold">
                  {primaryCa.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reference CA Card - shows the other mode for comparison */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                dataMode === 'budget' ? 'bg-primary/10' : 'bg-accent'
              }`}>
                {dataMode === 'budget' ? (
                  <BarChart3 className="h-5 w-5 text-primary" />
                ) : (
                  <Target className="h-5 w-5 text-accent-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dataMode === 'budget' ? 'CA Réel' : 'CA Budget'} {selectedYear}
                </p>
                <p className="text-xl font-bold">
                  {(dataMode === 'budget' ? reelCa : budgetCa).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                ecartCa >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {ecartCa >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écart CA</p>
                <p className={`text-xl font-bold ${ecartCa >= 0 ? "text-primary" : "text-destructive"}`}>
                  {ecartCa >= 0 ? "+" : ""}{ecartCa.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                ecartPercent >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {ecartPercent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className={`text-xl font-bold ${ecartPercent >= 0 ? "text-primary" : "text-destructive"}`}>
                  {ecartPercent >= 0 ? "+" : ""}{ecartPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Entry View */}
        {viewMode === 'entry' && (
          <>
            <SeasonalityEditor
              coefficients={coefficients}
              mode={dataMode}
              onUpdate={(c) => updateCoefficients.mutate(c)}
              isLoading={loadingCoefs}
            />
            <AnnualEntryTable
              entries={entries}
              totals={entryTotals}
              isLoading={loadingEntries}
              mode={dataMode}
              onUpdate={(params) => setAnnualSales.mutate(params)}
            />
          </>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && (
          <>
            <MonthlyViewTable
              monthly={monthly}
              totals={monthlyTotals}
              isLoading={loadingMonthly}
            />
            <SalesCharts monthly={monthly} byChannel={byChannel} />
          </>
        )}

        {/* Comparison View */}
        {viewMode === 'comparison' && (
          <>
            <ObjectivesComparisonTable
              monthly={monthly}
              totals={monthlyTotals}
            />
            <SalesCharts monthly={monthly} byChannel={byChannel} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Sales;
