import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { TrendingUp, TrendingDown, Target, BarChart3, Loader2 } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";

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

const Sales = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const { salesData, totals, isLoading, setSalesTarget, setSalesActual } = useSales(selectedMonth);
  const [editingCell, setEditingCell] = useState<{ productId: string; field: 'objectif' | 'reel' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const monthOptions = getMonthOptions();

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

  if (isLoading) {
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
      {/* Month Selector */}
      <div className="mb-6 flex items-center gap-4">
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
                <p className="text-sm text-muted-foreground">CA Objectif</p>
                <p className="text-xl font-bold">{totals.objectif_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
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
                <p className="text-sm text-muted-foreground">CA Réel</p>
                <p className="text-xl font-bold">{totals.reel_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totals.ecart_ca >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {totals.ecart_ca >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écart CA</p>
                <p className={`text-xl font-bold ${totals.ecart_ca >= 0 ? "text-primary" : "text-destructive"}`}>
                  {totals.ecart_ca >= 0 ? "+" : ""}{totals.ecart_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totals.ecart_percent >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {totals.ecart_percent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className={`text-xl font-bold ${totals.ecart_percent >= 0 ? "text-primary" : "text-destructive"}`}>
                  {totals.ecart_percent >= 0 ? "+" : ""}{totals.ecart_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
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
    </AppLayout>
  );
};

export default Sales;
