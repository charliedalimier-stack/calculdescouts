import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Target, BarChart3, Calendar, CalendarRange, Tags } from "lucide-react";
import { useSales, useAnnualSales } from "@/hooks/useSales";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import { AnnualSalesTable } from "@/components/sales/AnnualSalesTable";
import { SalesByCategoryTable } from "@/components/sales/SalesByCategoryTable";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = 'monthly' | 'annual' | 'category';

const getEcartBadge = (ecart: number) => {
  if (ecart > 0) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        +{ecart.toFixed(1)}%
      </Badge>
    );
  } else if (ecart >= -5) {
    return (
      <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
        {ecart.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
      {ecart.toFixed(1)}%
    </Badge>
  );
};

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = date.toISOString().slice(0, 7) + '-01';
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1].map(year => ({
    value: year.toString(),
    label: year.toString(),
  }));
};

const Sales = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const { salesData, totals, isLoading, setSalesTarget, setSalesActual } = useSales(selectedMonth);
  const { annualData, annualTotals, isLoading: isLoadingAnnual, setSalesValue } = useAnnualSales(selectedYear);
  const { totals: categoryTotals, isLoading: isLoadingCategory } = useSalesByCategory(selectedMonth);
  
  const [editingCell, setEditingCell] = useState<{ productId: string; field: 'objectif' | 'reel' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  const handleEdit = (productId: string, field: 'objectif' | 'reel', currentValue: number) => {
    setEditingCell({ productId, field });
    setEditValue(currentValue.toString());
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    const value = parseFloat(editValue) || 0;
    
    if (editingCell.field === 'objectif') {
      setSalesTarget.mutate({
        product_id: editingCell.productId,
        mois: selectedMonth,
        quantite_objectif: value,
      });
    } else {
      setSalesActual.mutate({
        product_id: editingCell.productId,
        mois: selectedMonth,
        quantite_reelle: value,
      });
    }
    
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditingCell(null);
  };

  const handleAnnualCellChange = (productId: string, month: string, field: 'objectif' | 'reel', value: number) => {
    setSalesValue.mutate({ product_id: productId, mois: month, field, value });
  };

  // Determine which totals to display based on view mode
  const displayTotals = viewMode === 'annual' 
    ? annualTotals 
    : viewMode === 'category' 
      ? { 
          objectif_ca: categoryTotals.target_ca, 
          reel_ca: categoryTotals.actual_ca, 
          ecart_ca: categoryTotals.actual_ca - categoryTotals.target_ca,
          ecart_percent: categoryTotals.target_ca > 0 
            ? ((categoryTotals.actual_ca - categoryTotals.target_ca) / categoryTotals.target_ca) * 100 
            : 0,
        }
      : totals;
  const currentIsLoading = viewMode === 'monthly' ? isLoading : viewMode === 'annual' ? isLoadingAnnual : isLoadingCategory;

  if (currentIsLoading) {
    return (
      <AppLayout title="Suivi des ventes" subtitle="Comparez vos objectifs aux résultats réels">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  return (
    <AppLayout
      title="Suivi des ventes"
      subtitle="Comparez vos objectifs aux résultats réels"
    >
      {/* View Toggle & Period Selector */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mensuelle
            </TabsTrigger>
            <TabsTrigger value="category" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Par canal
            </TabsTrigger>
            <TabsTrigger value="annual" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Annuelle
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {(viewMode === 'monthly' || viewMode === 'category') && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {viewMode === 'annual' && (
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Target className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  CA Objectif {viewMode === 'annual' ? selectedYear : ''}
                </p>
                <p className="text-xl font-bold">
                  {displayTotals.objectif_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  CA Réel {viewMode === 'annual' ? selectedYear : ''}
                </p>
                <p className="text-xl font-bold">
                  {displayTotals.reel_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                displayTotals.ecart_ca >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {displayTotals.ecart_ca >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écart CA</p>
                <p className={`text-xl font-bold ${displayTotals.ecart_ca >= 0 ? "text-primary" : "text-destructive"}`}>
                  {displayTotals.ecart_ca >= 0 ? "+" : ""}{displayTotals.ecart_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                displayTotals.ecart_percent >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {displayTotals.ecart_percent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className={`text-xl font-bold ${displayTotals.ecart_percent >= 0 ? "text-primary" : "text-destructive"}`}>
                  {displayTotals.ecart_percent >= 0 ? "+" : ""}{displayTotals.ecart_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Détail par produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Aucun produit trouvé. Créez des produits pour commencer le suivi des ventes.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Obj. Qté</TableHead>
                    <TableHead className="text-right">Réel Qté</TableHead>
                    <TableHead className="text-right">Obj. CA</TableHead>
                    <TableHead className="text-right">Réel CA</TableHead>
                    <TableHead className="text-right">Écart CA</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((row) => (
                    <TableRow key={row.product_id}>
                      <TableCell className="font-medium">{row.product_name}</TableCell>
                      <TableCell>
                        {row.category_name ? (
                          <Badge variant="outline">{row.category_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingCell?.productId === row.product_id && editingCell.field === 'objectif' ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-20 h-8"
                            autoFocus
                          />
                        ) : (
                          <button
                            className="text-muted-foreground hover:text-foreground hover:underline"
                            onClick={() => handleEdit(row.product_id, 'objectif', row.objectif_qty)}
                          >
                            {row.objectif_qty}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingCell?.productId === row.product_id && editingCell.field === 'reel' ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-20 h-8"
                            autoFocus
                          />
                        ) : (
                          <button
                            className="hover:text-primary hover:underline"
                            onClick={() => handleEdit(row.product_id, 'reel', row.reel_qty)}
                          >
                            {row.reel_qty}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.objectif_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.reel_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </TableCell>
                      <TableCell className={`text-right ${row.ecart_ca >= 0 ? "text-primary" : "text-destructive"}`}>
                        {row.ecart_ca >= 0 ? "+" : ""}{row.ecart_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </TableCell>
                      <TableCell className="text-center">
                        {getEcartBadge(row.ecart_percent)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-accent/50 font-semibold">
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right">
                      {totals.objectif_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell className="text-right">
                      {totals.reel_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell className={`text-right ${totals.ecart_ca >= 0 ? "text-primary" : "text-destructive"}`}>
                      {totals.ecart_ca >= 0 ? "+" : ""}{totals.ecart_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell className="text-center">
                      {getEcartBadge(totals.ecart_percent)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category View */}
      {viewMode === 'category' && (
        <SalesByCategoryTable month={selectedMonth} />
      )}

      {/* Annual View */}
      {viewMode === 'annual' && (
        <AnnualSalesTable
          year={selectedYear}
          data={annualData}
          onCellChange={handleAnnualCellChange}
          isLoading={isLoadingAnnual}
        />
      )}
    </AppLayout>
  );
};

export default Sales;
