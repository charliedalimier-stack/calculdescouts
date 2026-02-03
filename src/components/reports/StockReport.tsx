import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStockReport } from "@/hooks/useReports";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle, Package, Apple, Box, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface StockReportProps {
  mode: 'budget' | 'reel';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusBadge = (statut: 'ok' | 'alerte' | 'critique') => {
  switch (statut) {
    case 'ok':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />OK</Badge>;
    case 'alerte':
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Alerte</Badge>;
    case 'critique':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Critique</Badge>;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ingredient':
      return <Apple className="h-4 w-4" />;
    case 'emballage':
      return <Box className="h-4 w-4" />;
    case 'produit_fini':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'ingredient':
      return 'Ingrédient';
    case 'emballage':
      return 'Emballage';
    case 'produit_fini':
      return 'Produit fini';
    case 'sous_recette':
      return 'Sous-recette';
    default:
      return type;
  }
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

export function StockReport({ mode }: StockReportProps) {
  const { data: stockData, isLoading } = useStockReport(mode);

  // DEBUG: Log parameters and data
  console.log('[StockReport] mode:', mode, 'dataCount:', stockData?.length);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  if (!stockData || stockData.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucun stock disponible. Ajoutez des stocks dans le module Stocks pour voir le rapport.
        </AlertDescription>
      </Alert>
    );
  }

  // Summary stats
  const totalValeur = stockData?.reduce((sum, s) => sum + s.valeur_stock, 0) || 0;
  const alertCount = stockData?.filter(s => s.statut === 'alerte').length || 0;
  const criticalCount = stockData?.filter(s => s.statut === 'critique').length || 0;
  const okCount = stockData?.filter(s => s.statut === 'ok').length || 0;

  // Type breakdown for pie chart
  const typeData = ['ingredient', 'emballage', 'produit_fini', 'sous_recette'].map(type => {
    const items = stockData?.filter(s => s.type_stock === type) || [];
    return {
      name: getTypeLabel(type),
      value: items.reduce((sum, s) => sum + s.valeur_stock, 0),
      count: items.length,
    };
  }).filter(t => t.count > 0);

  // Top 10 by value for bar chart
  const topByValue = [...(stockData || [])]
    .sort((a, b) => b.valeur_stock - a.valeur_stock)
    .slice(0, 10);

  // Items needing attention
  const alertItems = stockData?.filter(s => s.statut !== 'ok').sort((a, b) => {
    if (a.statut === 'critique' && b.statut !== 'critique') return -1;
    if (a.statut !== 'critique' && b.statut === 'critique') return 1;
    return 0;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Valeur totale du stock
              <InfoTooltip {...DEFINITIONS.stock_valeur} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValeur)}</div>
            <p className="text-xs text-muted-foreground">{stockData?.length || 0} références</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Stock OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{okCount}</div>
            <p className="text-xs text-muted-foreground">références en stock suffisant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertCount}</div>
            <p className="text-xs text-muted-foreground">références sous seuil d'alerte</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">références en rupture</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Breakdown by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valeur']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 par valeur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByValue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}€`} />
                  <YAxis type="category" dataKey="nom" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valeur stock']} />
                  <Bar dataKey="valeur_stock" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Items */}
      {alertItems.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Éléments nécessitant une action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Seuil alerte</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type_stock)}
                        {getTypeLabel(item.type_stock)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.nom}</TableCell>
                    <TableCell className="text-right">{item.quantite}</TableCell>
                    <TableCell className="text-right">{item.seuil_alerte}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valeur_stock)}</TableCell>
                    <TableCell>{getStatusBadge(item.statut)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Full Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire complet</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Coût unit.</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead className="text-right">Seuil alerte</TableHead>
                <TableHead className="text-right">Rotation</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type_stock)}
                      {getTypeLabel(item.type_stock)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.nom}</TableCell>
                  <TableCell className="text-right">{item.quantite}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.cout_unitaire)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.valeur_stock)}</TableCell>
                  <TableCell className="text-right">{item.seuil_alerte}</TableCell>
                  <TableCell className="text-right">{item.rotation.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(item.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
