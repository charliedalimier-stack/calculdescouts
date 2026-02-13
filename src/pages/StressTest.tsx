import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinancialPlan, FiscalParams } from "@/hooks/useFinancialPlan";
import { useFinancialStressTest, StressTestParams } from "@/hooks/useFinancialStressTest";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { useTaxBrackets } from "@/hooks/useTaxBrackets";
import { useAutoCashFlow } from "@/hooks/useAutoCashFlow";
import { CashFlowStressTest } from "@/components/financial/CashFlowStressTest";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  Percent,
} from "lucide-react";

export default function StressTest() {
  const [year, setYear] = useState(2026);
  const [mode, setMode] = useState<DataMode>("budget");

  const { settings, isLoading: isLoadingSettings } = useProjectSettings();
  const { brackets, isLoading: isLoadingBrackets } = useTaxBrackets();

  const fiscalParams: FiscalParams = {
    tauxCotisationsSociales: settings?.taux_cotisations_sociales ?? 20.5,
    tauxCommunal: settings?.taux_communal ?? 7.0,
    nombreEnfantsCharge: settings?.nombre_enfants_charge ?? 0,
    quotiteExempteeBase: settings?.quotite_exemptee_base ?? 10570,
    majorationParEnfant: settings?.majoration_par_enfant ?? 1850,
    taxBrackets: brackets.map((b) => ({
      tranche_min: b.tranche_min,
      tranche_max: b.tranche_max,
      taux: b.taux,
      ordre: b.ordre,
    })),
  };

  const { data: financialPlanData, isLoading: isLoadingPlan } = useFinancialPlan(year, fiscalParams);

  // Cash flow data for stress test
  const { monthlyData: cashFlowData } = useAutoCashFlow({ mode, year });
  const baseData = financialPlanData?.yearN?.[mode];

  const [params, setParams] = useState<StressTestParams>({
    variationCA: 0,
    variationCoefficient: 0,
    variationCharges: 0,
  });

  const { results, isResultatNegatif, isTresorerieRisque, stressedData } = useFinancialStressTest(
    baseData || {
      ca_total: 0,
      achats_marchandises: 0,
      coefficient: 0,
      benefice_brut: 0,
      charges_professionnelles: { total: 0, by_category: {} },
      resultat_independant: 0,
      revenu_brut: 0,
      cotisations_sociales: 0,
      benefice_net_avant_impots: 0,
      quotite_exemptee: 0,
      base_imposable: 0,
      impot_base: 0,
      impot_communal: 0,
      impot_total: 0,
      benefice_exercice: 0,
      remuneration_annuelle: 0,
      remuneration_mensuelle: 0,
    },
    params,
    fiscalParams
  );

  // Console log for validation
  useEffect(() => {
    if (baseData) {
      console.log("[Stress Test]", {
        mode,
        year,
        caReference: baseData.ca_total,
        caStressed: stressedData.ca_total,
        resultatNet: stressedData.benefice_exercice,
      });
    }
  }, [baseData, stressedData, mode, year]);

  const handlePeriodChange = ({ year: newYear, mode: newMode }: { month?: number; year: number; mode: DataMode }) => {
    setYear(newYear);
    setMode(newMode);
  };

  const isLoading = isLoadingSettings || isLoadingBrackets || isLoadingPlan;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-BE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getEcartColor = (ecart: number, isExpense: boolean) => {
    if (isExpense) {
      return ecart < 0 ? "text-emerald-600 dark:text-emerald-400" : ecart > 0 ? "text-destructive" : "";
    }
    return ecart > 0 ? "text-emerald-600 dark:text-emerald-400" : ecart < 0 ? "text-destructive" : "";
  };

  const isExpenseIndicator = (key: string) =>
    ["achats_marchandises", "charges_professionnelles_total", "impot_total", "cotisations_sociales"].includes(key);

  if (isLoading) {
    return (
      <AppLayout title="Stress Test" subtitle="Simulation d'impact sur la rentabilité">
        <div className="space-y-6">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  const hasData = baseData && baseData.ca_total > 0;

  return (
    <AppLayout title="Stress Test" subtitle="Simulation d'impact sur la rentabilité">
      <div className="space-y-6">
        {/* Period Selector */}
        <PeriodSelector
          year={year}
          mode={mode}
          showMonth={false}
          onChange={handlePeriodChange}
        />

        {!hasData ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Données insuffisantes</AlertTitle>
            <AlertDescription>
              Aucune donnée de ventes trouvée en mode {mode === "budget" ? "Budget" : "Réel"} pour {year}.
              Saisissez d'abord vos ventes annuelles pour utiliser le stress test.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Risk alerts */}
            {(isResultatNegatif || isTresorerieRisque) && (
              <div className="space-y-2">
                {isResultatNegatif && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Résultat négatif</AlertTitle>
                    <AlertDescription>
                      Avec ces paramètres, le bénéfice net devient négatif.
                      L'activité ne serait pas rentable dans ce scénario.
                    </AlertDescription>
                  </Alert>
                )}
                {isTresorerieRisque && !isResultatNegatif && (
                  <Alert className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Risque de trésorerie</AlertTitle>
                    <AlertDescription>
                      Le résultat indépendant ou le bénéfice avant impôts est négatif.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Stress Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Hypothèses de stress
                  <Badge variant="secondary" className="ml-2">
                    {mode === "budget" ? "Budget" : "Réel"} {year}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* CA Variation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Variation du CA
                      </Label>
                      <Badge
                        variant={params.variationCA >= 0 ? "default" : "destructive"}
                        className="min-w-16 justify-center"
                      >
                        {formatPercent(params.variationCA)}
                      </Badge>
                    </div>
                    <Slider
                      value={[params.variationCA]}
                      onValueChange={([value]) => setParams((p) => ({ ...p, variationCA: value }))}
                      min={-50}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>

                  {/* Coefficient Variation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-amber-500" />
                        Variation coefficient
                      </Label>
                      <Badge
                        variant={params.variationCoefficient >= 0 ? "default" : "destructive"}
                        className="min-w-16 justify-center"
                      >
                        {formatPercent(params.variationCoefficient)}
                      </Badge>
                    </div>
                    <Slider
                      value={[params.variationCoefficient]}
                      onValueChange={([value]) => setParams((p) => ({ ...p, variationCoefficient: value }))}
                      min={-30}
                      max={30}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-30%</span>
                      <span>0%</span>
                      <span>+30%</span>
                    </div>
                  </div>

                  {/* Charges Variation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-orange-500" />
                        Variation charges
                      </Label>
                      <Badge
                        variant={params.variationCharges <= 0 ? "default" : "destructive"}
                        className="min-w-16 justify-center"
                      >
                        {formatPercent(params.variationCharges)}
                      </Badge>
                    </div>
                    <Slider
                      value={[params.variationCharges]}
                      onValueChange={([value]) => setParams((p) => ({ ...p, variationCharges: value }))}
                      min={-30}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-30%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tableau comparatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[220px]">Indicateur</TableHead>
                        <TableHead className="text-right">Référence</TableHead>
                        <TableHead className="text-right">Stress Test</TableHead>
                        <TableHead className="text-right">Écart (€)</TableHead>
                        <TableHead className="text-right">Écart (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => {
                        const isExpense = isExpenseIndicator(result.key);
                        const ecartColor = getEcartColor(result.ecartEuro, isExpense);
                        const isResultRow = [
                          "benefice_exercice",
                          "remuneration_annuelle",
                          "remuneration_mensuelle",
                        ].includes(result.key);

                        return (
                          <TableRow
                            key={result.key}
                            className={isResultRow ? "font-medium bg-muted/30" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {result.ecartEuro > 0 ? (
                                  <TrendingUp
                                    className={`h-4 w-4 ${isExpense ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
                                  />
                                ) : result.ecartEuro < 0 ? (
                                  <TrendingDown
                                    className={`h-4 w-4 ${isExpense ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                                  />
                                ) : null}
                                {result.indicateur}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(result.valeurActuelle)}
                            </TableCell>
                            <TableCell
                              className={`text-right ${result.valeurStress < 0 ? "text-destructive font-medium" : ""}`}
                            >
                              {formatCurrency(result.valeurStress)}
                            </TableCell>
                            <TableCell className={`text-right ${ecartColor}`}>
                              {result.ecartEuro >= 0 ? "+" : ""}
                              {formatCurrency(result.ecartEuro)}
                            </TableCell>
                            <TableCell className={`text-right ${ecartColor}`}>
                              {formatPercent(result.ecartPct)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Simulation basée sur {mode === "budget" ? "le Budget" : "le Réel"} {year} • Aucune donnée modifiée
                  </span>
                  {!isResultatNegatif && !isTresorerieRisque && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400">
                      Scénario viable
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Cash Flow Stress Test */}
            {cashFlowData.length > 0 && (
              <CashFlowStressTest
                baseData={cashFlowData}
                year={year}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
