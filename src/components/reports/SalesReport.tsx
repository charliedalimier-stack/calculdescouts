import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesReport } from "@/hooks/useReports";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MONTH_LABELS_FULL } from "@/lib/dateOptions";
import { TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";
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

interface SalesReportProps {
  year: number;
  mode: 'budget' | 'reel';
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
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const getEcartBadge = (ecart: number) => {
  if (ecart >= 10) return <Badge className="bg-green-100 text-green-800"><TrendingUp className="h-3 w-3 mr-1" />{formatPercent(ecart)}</Badge>;
  if (ecart >= 0) return <Badge className="bg-blue-100 text-blue-800"><Target className="h-3 w-3 mr-1" />{formatPercent(ecart)}</Badge>;
  if (ecart >= -10) return <Badge className="bg-yellow-100 text-yellow-800"><TrendingDown className="h-3 w-3 mr-1" />{formatPercent(ecart)}</Badge>;
  return <Badge variant="destructive"><TrendingDown className="h-3 w-3 mr-1" />{formatPercent(ecart)}</Badge>;
};

export function SalesReport({ year, mode }: SalesReportProps) {
  const { data: salesData, isLoading } = useSalesReport(year, mode);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  if (!salesData || salesData.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucune donnée de ventes disponible pour {year}.
          Ajoutez des objectifs et des ventes réelles pour voir le rapport.
        </AlertDescription>
      </Alert>
    );
  }

  // Aggregate by month for chart
  const monthlyData = MONTH_LABELS_FULL.map((monthName, index) => {
    const monthStr = `${year}-${(index + 1).toString().padStart(2, '0')}`;
    const monthSales = salesData?.filter(s => s.periode.startsWith(monthStr)) || [];
    
    const volume = monthSales.reduce((sum, s) => sum + s.volume, 0);
    const objectif_volume = monthSales.reduce((sum, s) => sum + s.objectif_volume, 0);
    const ca_ht = monthSales.reduce((sum, s) => sum + s.ca_ht, 0);
    const objectif_ca = monthSales.reduce((sum, s) => sum + s.objectif_ca, 0);
    
    return {
      name: monthName.substring(0, 3),
      volume,
      objectif_volume,
      ca_ht,
      objectif_ca,
      ecart_pct: objectif_ca > 0 ? ((ca_ht - objectif_ca) / objectif_ca) * 100 : 0,
    };
  });

  // Aggregate by channel
  const channelData = ['BTC', 'BTB', 'Distributeur'].map(canal => {
    const channelSales = salesData?.filter(s => s.canal === canal) || [];
    return {
      canal,
      volume: channelSales.reduce((sum, s) => sum + s.volume, 0),
      objectif_volume: channelSales.reduce((sum, s) => sum + s.objectif_volume, 0),
      ca_ht: channelSales.reduce((sum, s) => sum + s.ca_ht, 0),
      objectif_ca: channelSales.reduce((sum, s) => sum + s.objectif_ca, 0),
    };
  }).map(c => ({
    ...c,
    ecart_volume_pct: c.objectif_volume > 0 ? ((c.volume - c.objectif_volume) / c.objectif_volume) * 100 : 0,
    ecart_ca_pct: c.objectif_ca > 0 ? ((c.ca_ht - c.objectif_ca) / c.objectif_ca) * 100 : 0,
  }));

  // Totals
  const totals = {
    volume: salesData?.reduce((sum, s) => sum + s.volume, 0) || 0,
    objectif_volume: salesData?.reduce((sum, s) => sum + s.objectif_volume, 0) || 0,
    ca_ht: salesData?.reduce((sum, s) => sum + s.ca_ht, 0) || 0,
    objectif_ca: salesData?.reduce((sum, s) => sum + s.objectif_ca, 0) || 0,
  };
  const ecart_ca_global = totals.objectif_ca > 0 ? ((totals.ca_ht - totals.objectif_ca) / totals.objectif_ca) * 100 : 0;
  const ecart_vol_global = totals.objectif_volume > 0 ? ((totals.volume - totals.objectif_volume) / totals.objectif_volume) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              CA Réalisé
              <InfoTooltip {...DEFINITIONS.ca_ht} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.ca_ht)}</div>
            <p className="text-xs text-muted-foreground">Objectif: {formatCurrency(totals.objectif_ca)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Écart CA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ecart_ca_global >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatPercent(ecart_ca_global)}
            </div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totals.ca_ht - totals.objectif_ca)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Réalisé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.volume.toLocaleString('fr-FR')}</div>
            <p className="text-xs text-muted-foreground">Objectif: {totals.objectif_volume.toLocaleString('fr-FR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Écart Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ecart_vol_global >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatPercent(ecart_vol_global)}
            </div>
            <p className="text-xs text-muted-foreground">{(totals.volume - totals.objectif_volume).toLocaleString('fr-FR')} unités</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle CA vs Objectif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'ecart_pct') return [`${value.toFixed(1)}%`, 'Écart'];
                    return [formatCurrency(value), name === 'ca_ht' ? 'CA Réalisé' : 'Objectif'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="ca_ht" name="CA Réalisé" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="objectif_ca" name="Objectif" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="ecart_pct" name="Écart %" stroke="hsl(var(--chart-4))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par canal de distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Volume réalisé</TableHead>
                <TableHead className="text-right">Objectif vol.</TableHead>
                <TableHead className="text-right">Écart vol.</TableHead>
                <TableHead className="text-right">CA réalisé</TableHead>
                <TableHead className="text-right">Objectif CA</TableHead>
                <TableHead className="text-right">Écart CA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelData.map((row) => (
                <TableRow key={row.canal}>
                  <TableCell className="font-medium">{row.canal}</TableCell>
                  <TableCell className="text-right">{row.volume.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right">{row.objectif_volume.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right">{getEcartBadge(row.ecart_volume_pct)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.ca_ht)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.objectif_ca)}</TableCell>
                  <TableCell className="text-right">{getEcartBadge(row.ecart_ca_pct)}</TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{totals.volume.toLocaleString('fr-FR')}</TableCell>
                <TableCell className="text-right">{totals.objectif_volume.toLocaleString('fr-FR')}</TableCell>
                <TableCell className="text-right">{getEcartBadge(ecart_vol_global)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.ca_ht)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.objectif_ca)}</TableCell>
                <TableCell className="text-right">{getEcartBadge(ecart_ca_global)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
