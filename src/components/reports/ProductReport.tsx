import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductReport } from "@/hooks/useReports";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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

interface ProductReportProps {
  year: number;
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

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const getCoefficientColor = (coef: number) => {
  if (coef >= 3) return 'text-green-600';
  if (coef >= 2) return 'text-yellow-600';
  return 'text-destructive';
};

const getCoefficientBadge = (coef: number) => {
  if (coef >= 3) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
  if (coef >= 2.5) return <Badge className="bg-blue-100 text-blue-800">Bon</Badge>;
  if (coef >= 2) return <Badge className="bg-yellow-100 text-yellow-800">Correct</Badge>;
  return <Badge variant="destructive">À améliorer</Badge>;
};

export function ProductReport({ year, mode }: ProductReportProps) {
  const { data: productData, isLoading } = useProductReport(year, mode);


  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  if (!productData || productData.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucun produit disponible pour {year} en mode {mode === 'budget' ? 'Budget' : 'Réel'}.
          Ajoutez des produits dans le module Produits pour voir le rapport.
        </AlertDescription>
      </Alert>
    );
  }

  const sortedByMargin = [...(productData || [])].sort((a, b) => b.contribution_marge - a.contribution_marge);
  const sortedByCoef = [...(productData || [])].sort((a, b) => b.coefficient - a.coefficient);
  
  // Top 10 for charts
  const topContributors = sortedByMargin.slice(0, 10);
  
  // Category aggregation for pie chart
  const categoryData = productData?.reduce((acc, p) => {
    const existing = acc.find(c => c.name === p.categorie);
    if (existing) {
      existing.value += p.contribution_marge;
    } else {
      acc.push({ name: p.categorie, value: p.contribution_marge });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Summary stats
  const totalCA = productData?.reduce((sum, p) => sum + p.ca_genere, 0) || 0;
  const totalMarge = productData?.reduce((sum, p) => sum + p.contribution_marge, 0) || 0;
  const avgCoef = productData && productData.length > 0
    ? productData.reduce((sum, p) => sum + p.coefficient, 0) / productData.length
    : 0;
  const productsAboveTarget = productData?.filter(p => p.coefficient >= 3).length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nombre de produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productData?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              CA Total généré
              <InfoTooltip {...DEFINITIONS.ca_ht} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCA)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Coefficient moyen
              <InfoTooltip {...DEFINITIONS.coefficient} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCoefficientColor(avgCoef)}`}>
              {avgCoef.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Produits rentables (coef ≥ 3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productsAboveTarget} / {productData?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {productData && productData.length > 0 ? formatPercent((productsAboveTarget / productData.length) * 100) : '0%'} du catalogue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Top contributeurs à la marge
              <InfoTooltip {...DEFINITIONS.marge_brute} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topContributors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
                  <YAxis type="category" dataKey="nom_produit" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Contribution']} />
                  <Bar dataKey="contribution_marge" radius={[0, 4, 4, 0]}>
                    {topContributors.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Marge']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse détaillée des produits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Coût revient</TableHead>
                <TableHead className="text-right">Prix moyen</TableHead>
                <TableHead className="text-right">Coefficient</TableHead>
                <TableHead className="text-right">Marge unit.</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">CA généré</TableHead>
                <TableHead className="text-right">Contribution</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByMargin.map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">{product.nom_produit}</TableCell>
                  <TableCell>{product.categorie}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.cout_revient)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.prix_vente_moyen)}</TableCell>
                  <TableCell className={`text-right font-medium ${getCoefficientColor(product.coefficient)}`}>
                    {product.coefficient.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(product.marge_unitaire)}</TableCell>
                  <TableCell className="text-right">{product.volume_vendu}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.ca_genere)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(product.contribution_marge)}</TableCell>
                  <TableCell>{getCoefficientBadge(product.coefficient)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
