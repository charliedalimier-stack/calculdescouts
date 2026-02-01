import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Receipt, Package, Boxes, Zap, FileText, Info } from "lucide-react";
import { useAutoCashFlow, CashFlowMode } from "@/hooks/useAutoCashFlow";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";

const formatCurrency = (value: number) => {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
};

const getSoldeBadge = (solde: number) => {
  if (solde > 0) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        +{formatCurrency(solde)}
      </Badge>
    );
  } else if (solde === 0) {
    return <Badge variant="outline">0 €</Badge>;
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
      {formatCurrency(solde)}
    </Badge>
  );
};

const CashFlow = () => {
  // Period selection state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [dataMode, setDataMode] = useState<DataMode>('budget');

  // Map DataMode to CashFlowMode
  const cashFlowMode: CashFlowMode = dataMode === 'budget' ? 'budget' : 'reel';

  const { 
    monthlyData,
    summary,
    currentMonthData,
    isLoading,
    isFranchise,
  } = useAutoCashFlow({ mode: cashFlowMode, year: selectedYear });

  const handlePeriodChange = (params: { month?: number; year: number; mode: DataMode }) => {
    setSelectedYear(params.year);
    setDataMode(params.mode);
  };

  if (isLoading) {
    return (
      <AppLayout title="Cash-flow" subtitle="Suivez votre trésorerie mensuelle">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const hasData = summary.total_encaissements_ht > 0 || summary.total_decaissements_production_ht > 0;

  return (
    <AppLayout
      title="Cash-flow"
      subtitle="Suivez votre trésorerie mensuelle"
    >
      {/* Period Selector */}
      <div className="mb-6">
        <PeriodSelector
          year={selectedYear}
          mode={dataMode}
          showMonth={false}
          showMode={true}
          onChange={handlePeriodChange}
        />
      </div>

      {/* TVA Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 La TVA est un flux de trésorerie, pas un revenu.</strong> Les calculs de CA HT, marge et résultat restent inchangés. 
          {isFranchise && " (Régime franchise de taxe actif - aucune TVA n'est appliquée)"}
        </AlertDescription>
      </Alert>

      {/* Alert if negative */}
      {summary.has_negative && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Attention : trésorerie négative détectée</p>
              <p className="text-sm text-muted-foreground">
                La trésorerie devient négative à partir de {summary.first_negative_month}. 
                Revoyez vos délais de paiement ou votre plan de production.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data alert */}
      {!hasData && (
        <Card className="mb-6 border-chart-4/50 bg-chart-4/5">
          <CardContent className="flex items-center gap-4 p-4">
            <Receipt className="h-5 w-5 text-chart-4" />
            <div>
              <p className="font-medium text-chart-4">Aucune donnée pour cette période</p>
              <p className="text-sm text-muted-foreground">
                Pour voir le cash-flow automatique, ajoutez des ventes annuelles en mode {dataMode === 'budget' ? 'Budget' : 'Réel'} 
                {' '}dans le module Ventes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Row 1: Current Month HT */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Encaissements HT (mois)
                  <InfoTooltip {...DEFINITIONS.encaissements} size="sm" />
                </p>
                <p className="text-xl font-bold">{formatCurrency(currentMonthData.encaissements_ht)}</p>
                {!isFranchise && currentMonthData.tva_collectee > 0 && (
                  <p className="text-xs text-muted-foreground">+ TVA: {formatCurrency(currentMonthData.tva_collectee)}</p>
                )}
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
                <p className="text-sm text-muted-foreground">Décaissements prod. HT (mois)</p>
                <p className="text-xl font-bold">{formatCurrency(currentMonthData.decaissements_production_ht)}</p>
                {!isFranchise && currentMonthData.tva_deductible > 0 && (
                  <p className="text-xs text-muted-foreground">TVA déd.: {formatCurrency(currentMonthData.tva_deductible)}</p>
                )}
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
              <div>
                <p className="text-sm text-muted-foreground">Frais professionnels HT (mois)</p>
                <p className="text-xl font-bold">{formatCurrency(currentMonthData.frais_professionnels_ht)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Row 2: TVA + Soldes */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!isFranchise && (
          <Card className="border-chart-2/30 bg-chart-2/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <FileText className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    TVA nette (mois)
                    <InfoTooltip {...DEFINITIONS.tva_nette} size="sm" />
                  </p>
                  <p className={`text-xl font-bold ${currentMonthData.tva_nette >= 0 ? "text-destructive" : "text-primary"}`}>
                    {currentMonthData.tva_nette >= 0 ? `-${formatCurrency(currentMonthData.tva_nette)}` : `+${formatCurrency(Math.abs(currentMonthData.tva_nette))}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentMonthData.tva_nette >= 0 ? "À payer" : "À récupérer"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                currentMonthData.solde_production >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                <Wallet className={`h-5 w-5 ${currentMonthData.solde_production >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde production (HT)</p>
                <p className={`text-xl font-bold ${currentMonthData.solde_production >= 0 ? "text-primary" : "text-destructive"}`}>
                  {currentMonthData.solde_production >= 0 ? "+" : ""}{formatCurrency(currentMonthData.solde_production)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                currentMonthData.solde_apres_frais >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                <Wallet className={`h-5 w-5 ${currentMonthData.solde_apres_frais >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde après frais (HT)</p>
                <p className={`text-xl font-bold ${currentMonthData.solde_apres_frais >= 0 ? "text-primary" : "text-destructive"}`}>
                  {currentMonthData.solde_apres_frais >= 0 ? "+" : ""}{formatCurrency(currentMonthData.solde_apres_frais)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                summary.solde_final >= 0 ? "bg-accent" : "bg-destructive/10"
              }`}>
                <Wallet className={`h-5 w-5 ${summary.solde_final >= 0 ? "text-accent-foreground" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trésorerie fin d'année</p>
                <p className={`text-xl font-bold ${summary.solde_final >= 0 ? "" : "text-destructive"}`}>
                  {formatCurrency(summary.solde_final)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Annual Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">CA annuel HT</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(summary.total_encaissements_ht)}</p>
            {!isFranchise && (
              <p className="text-xs text-muted-foreground">TTC: {formatCurrency(summary.total_encaissements_ttc)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Coûts production HT</p>
            <p className="text-lg font-semibold text-destructive">{formatCurrency(summary.total_decaissements_production_ht)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Frais pro. HT</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.total_frais_professionnels_ht)}</p>
          </CardContent>
        </Card>
        {!isFranchise && (
          <Card className="border-chart-2/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">TVA nette annuelle</p>
              <p className={`text-lg font-semibold ${summary.total_tva_nette >= 0 ? "text-destructive" : "text-primary"}`}>
                {summary.total_tva_nette >= 0 ? `-${formatCurrency(summary.total_tva_nette)}` : `+${formatCurrency(Math.abs(summary.total_tva_nette))}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.total_tva_nette >= 0 ? "À payer" : "À récupérer"}
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Variation trésorerie</p>
            <p className={`text-lg font-semibold ${summary.total_variation_tresorerie >= 0 ? "text-primary" : "text-destructive"}`}>
              {summary.total_variation_tresorerie >= 0 ? "+" : ""}{formatCurrency(summary.total_variation_tresorerie)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart - Treasury Evolution */}
      {hasData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Évolution de la trésorerie cumulée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Trésorerie cumulée"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumul"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCumul)"
                    name="cumul"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart - Monthly Flows */}
      {hasData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Flux mensuels (HT)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        encaissements_ht: "Encaissements HT",
                        decaissements_production_ht: "Décaissements prod. HT",
                        frais_professionnels_ht: "Frais professionnels HT",
                        tva_nette: "TVA nette",
                      };
                      return [formatCurrency(value), labels[name] || name];
                    }}
                  />
                  <Legend 
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        encaissements_ht: "Encaissements HT",
                        decaissements_production_ht: "Décaissements prod. HT",
                        frais_professionnels_ht: "Frais professionnels HT",
                        tva_nette: "TVA nette",
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Bar dataKey="encaissements_ht" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="decaissements_production_ht" fill="hsl(var(--chart-4))" />
                  <Bar dataKey="frais_professionnels_ht" fill="hsl(var(--chart-5))" />
                  {!isFranchise && <Bar dataKey="tva_nette" fill="hsl(var(--chart-2))" />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Détail mensuel
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!hasData ? (
            <div className="py-12 text-center text-muted-foreground">
              Aucune donnée de cash-flow pour {selectedYear}. 
              Ajoutez des ventes et des coûts dans les autres modules pour voir les calculs automatiques.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <TrendingUp className="h-4 w-4" /> CA HT
                    </span>
                  </TableHead>
                  {!isFranchise && (
                    <TableHead className="text-right text-chart-2">TVA coll.</TableHead>
                  )}
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Package className="h-4 w-4" /> Matières
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Boxes className="h-4 w-4" /> Emball.
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Zap className="h-4 w-4" /> Var.
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Receipt className="h-4 w-4" /> Frais
                    </span>
                  </TableHead>
                  {!isFranchise && (
                    <>
                      <TableHead className="text-right text-chart-2">TVA déd.</TableHead>
                      <TableHead className="text-right text-chart-2">TVA nette</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Var. trés.</TableHead>
                  <TableHead className="text-right">Cumul</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.monthLabel}</TableCell>
                    <TableCell className="text-right text-primary">
                      {formatCurrency(row.encaissements_ht)}
                    </TableCell>
                    {!isFranchise && (
                      <TableCell className="text-right text-chart-2">
                        {row.tva_collectee > 0 ? formatCurrency(row.tva_collectee) : '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right text-destructive">
                      {row.achats_matieres_ht > 0 ? `-${formatCurrency(row.achats_matieres_ht)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {row.achats_emballages_ht > 0 ? `-${formatCurrency(row.achats_emballages_ht)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {row.couts_variables_ht > 0 ? `-${formatCurrency(row.couts_variables_ht)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-chart-5">
                      {row.frais_professionnels_ht > 0 ? `-${formatCurrency(row.frais_professionnels_ht)}` : '-'}
                    </TableCell>
                    {!isFranchise && (
                      <>
                        <TableCell className="text-right text-chart-2">
                          {row.tva_deductible > 0 ? formatCurrency(row.tva_deductible) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${row.tva_nette >= 0 ? "text-destructive" : "text-primary"}`}>
                          {row.tva_nette !== 0 ? (row.tva_nette >= 0 ? `-${formatCurrency(row.tva_nette)}` : `+${formatCurrency(Math.abs(row.tva_nette))}`) : '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      {getSoldeBadge(row.variation_tresorerie)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={row.cumul < 0 ? "text-destructive" : ""}>
                        {formatCurrency(row.cumul)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total annuel</TableCell>
                  <TableCell className="text-right text-primary">
                    {formatCurrency(summary.total_encaissements_ht)}
                  </TableCell>
                  {!isFranchise && (
                    <TableCell className="text-right text-chart-2">
                      {formatCurrency(summary.total_tva_collectee)}
                    </TableCell>
                  )}
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(monthlyData.reduce((sum, m) => sum + m.achats_matieres_ht, 0))}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(monthlyData.reduce((sum, m) => sum + m.achats_emballages_ht, 0))}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(monthlyData.reduce((sum, m) => sum + m.couts_variables_ht, 0))}
                  </TableCell>
                  <TableCell className="text-right text-chart-5">
                    -{formatCurrency(summary.total_frais_professionnels_ht)}
                  </TableCell>
                  {!isFranchise && (
                    <>
                      <TableCell className="text-right text-chart-2">
                        {formatCurrency(summary.total_tva_deductible)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${summary.total_tva_nette >= 0 ? "text-destructive" : "text-primary"}`}>
                        {summary.total_tva_nette >= 0 ? `-${formatCurrency(summary.total_tva_nette)}` : `+${formatCurrency(Math.abs(summary.total_tva_nette))}`}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    {getSoldeBadge(summary.total_variation_tresorerie)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={summary.solde_final < 0 ? "text-destructive" : ""}>
                      {formatCurrency(summary.solde_final)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default CashFlow;
