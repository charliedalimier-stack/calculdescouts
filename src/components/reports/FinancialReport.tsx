import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialReport } from "@/hooks/useReports";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";
import { MONTH_LABELS_FULL } from "@/lib/dateOptions";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface FinancialReportProps {
  year: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const TrendIcon = ({ value }: { value: number }) => {
  if (value > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (value < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function FinancialReport({ year }: FinancialReportProps) {
  const { data: financialData, isLoading } = useFinancialReport(year);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  const chartData = financialData?.map((d, index) => ({
    name: MONTH_LABELS_FULL[index]?.substring(0, 3) || '',
    ca_ht: d.ca_ht,
    cout_production: d.cout_production,
    marge_brute: d.marge_brute,
    resultat_net: d.resultat_net,
    taux_marge: d.taux_marge,
  })) || [];

  // Calculate totals
  const totals = financialData?.reduce((acc, d) => ({
    ca_ht: acc.ca_ht + d.ca_ht,
    cout_production: acc.cout_production + d.cout_production,
    marge_brute: acc.marge_brute + d.marge_brute,
    frais_fixes: acc.frais_fixes + d.frais_fixes,
    resultat_net: acc.resultat_net + d.resultat_net,
    tva_collectee: acc.tva_collectee + d.tva_collectee,
    tva_deductible: acc.tva_deductible + d.tva_deductible,
    tva_nette: acc.tva_nette + d.tva_nette,
  }), {
    ca_ht: 0,
    cout_production: 0,
    marge_brute: 0,
    frais_fixes: 0,
    resultat_net: 0,
    tva_collectee: 0,
    tva_deductible: 0,
    tva_nette: 0,
  });

  const tauxMargeGlobal = totals && totals.ca_ht > 0 ? (totals.marge_brute / totals.ca_ht) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              CA HT Annuel
              <InfoTooltip {...DEFINITIONS.ca_ht} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals?.ca_ht || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Marge Brute
              <InfoTooltip {...DEFINITIONS.marge_brute} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals?.marge_brute || 0)}</div>
            <p className="text-xs text-muted-foreground">Taux: {formatPercent(tauxMargeGlobal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Résultat Net
              <InfoTooltip {...DEFINITIONS.resultat_net} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totals?.resultat_net || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(totals?.resultat_net || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              TVA Nette
              <InfoTooltip {...DEFINITIONS.tva_nette} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals?.tva_nette || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'taux_marge') return [`${value.toFixed(1)}%`, 'Taux marge'];
                    return [formatCurrency(value), name === 'ca_ht' ? 'CA HT' : name === 'marge_brute' ? 'Marge' : 'Résultat'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="ca_ht" name="CA HT" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="marge_brute" name="Marge" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="taux_marge" name="Taux marge" stroke="hsl(var(--chart-4))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">CA HT</TableHead>
                <TableHead className="text-right">Coût prod.</TableHead>
                <TableHead className="text-right">Marge brute</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Frais fixes</TableHead>
                <TableHead className="text-right">Résultat</TableHead>
                <TableHead className="text-right">TVA nette</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialData?.map((row, index) => (
                <TableRow key={row.periode}>
                  <TableCell className="font-medium">{MONTH_LABELS_FULL[index]}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.ca_ht)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.cout_production)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.marge_brute)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {formatPercent(row.taux_marge)}
                      <TrendIcon value={row.taux_marge - 30} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(row.frais_fixes)}</TableCell>
                  <TableCell className={`text-right font-medium ${row.resultat_net < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(row.resultat_net)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(row.tva_nette)}</TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{formatCurrency(totals?.ca_ht || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals?.cout_production || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals?.marge_brute || 0)}</TableCell>
                <TableCell className="text-right">{formatPercent(tauxMargeGlobal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals?.frais_fixes || 0)}</TableCell>
                <TableCell className={`text-right ${(totals?.resultat_net || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(totals?.resultat_net || 0)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(totals?.tva_nette || 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
