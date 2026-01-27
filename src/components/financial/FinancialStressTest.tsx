import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinancialPlanData, FiscalParams } from "@/hooks/useFinancialPlan";
import { useFinancialStressTest, StressTestParams } from "@/hooks/useFinancialStressTest";
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  Percent
} from "lucide-react";

interface FinancialStressTestProps {
  baseData: FinancialPlanData;
  fiscalParams: FiscalParams;
  year: number;
}

export function FinancialStressTest({ baseData, fiscalParams, year }: FinancialStressTestProps) {
  const [params, setParams] = useState<StressTestParams>({
    variationCA: 0,
    variationCoefficient: 0,
    variationCharges: 0,
  });

  const { results, isResultatNegatif, isTresorerieRisque } = useFinancialStressTest(
    baseData,
    params,
    fiscalParams
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getEcartColor = (ecart: number, isExpense: boolean) => {
    // For expenses (achats, charges, impots), negative is good
    // For revenue/profit indicators, positive is good
    if (isExpense) {
      return ecart < 0 ? 'text-green-600' : ecart > 0 ? 'text-destructive' : '';
    }
    return ecart > 0 ? 'text-green-600' : ecart < 0 ? 'text-destructive' : '';
  };

  const isExpenseIndicator = (key: string) => {
    return ['achats_marchandises', 'charges_professionnelles_total', 'impot_total', 'cotisations_sociales'].includes(key);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Stress test – Analyse de sensibilité
          <Badge variant="secondary" className="ml-2">
            Budget {year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts */}
        {(isResultatNegatif || isTresorerieRisque) && (
          <div className="space-y-2">
            {isResultatNegatif && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Résultat négatif</AlertTitle>
                <AlertDescription>
                  Avec ces paramètres de stress, le bénéfice net devient négatif. 
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
                  La trésorerie pourrait être sous tension.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Controls */}
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
              onValueChange={([value]) => setParams(p => ({ ...p, variationCA: value }))}
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
              onValueChange={([value]) => setParams(p => ({ ...p, variationCoefficient: value }))}
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
              onValueChange={([value]) => setParams(p => ({ ...p, variationCharges: value }))}
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

        {/* Results Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Indicateur</TableHead>
                <TableHead className="text-right">Valeur actuelle</TableHead>
                <TableHead className="text-right">Valeur stressée</TableHead>
                <TableHead className="text-right">Écart (€)</TableHead>
                <TableHead className="text-right">Écart (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const isExpense = isExpenseIndicator(result.key);
                const ecartColor = getEcartColor(result.ecartEuro, isExpense);
                const isResultRow = ['benefice_exercice', 'remuneration_annuelle', 'remuneration_mensuelle'].includes(result.key);
                
                return (
                  <TableRow 
                    key={result.key}
                    className={isResultRow ? 'font-medium bg-muted/30' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {result.ecartEuro > 0 ? (
                          <TrendingUp className={`h-4 w-4 ${isExpense ? 'text-destructive' : 'text-green-600'}`} />
                        ) : result.ecartEuro < 0 ? (
                          <TrendingDown className={`h-4 w-4 ${isExpense ? 'text-green-600' : 'text-destructive'}`} />
                        ) : null}
                        {result.indicateur}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(result.valeurActuelle)}
                    </TableCell>
                    <TableCell className={`text-right ${result.valeurStress < 0 ? 'text-destructive font-medium' : ''}`}>
                      {formatCurrency(result.valeurStress)}
                    </TableCell>
                    <TableCell className={`text-right ${ecartColor}`}>
                      {result.ecartEuro >= 0 ? '+' : ''}{formatCurrency(result.ecartEuro)}
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

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Simulation basée sur le Budget {year} • Aucune donnée modifiée
          </span>
          {!isResultatNegatif && !isTresorerieRisque && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Scénario viable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
