import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesByCategory, ProductSalesData } from "@/hooks/useSalesByCategory";
import { PriceCategory } from "@/hooks/useProductPrices";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface SalesByCategoryTableProps {
  month: string;
}

const CATEGORIES: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

const getCategoryColor = (category: PriceCategory) => {
  switch (category) {
    case 'BTC':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'BTB':
      return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    case 'Distributeur':
      return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
    default:
      return '';
  }
};

export function SalesByCategoryTable({ month }: SalesByCategoryTableProps) {
  const { salesData, totals, isLoading, setSalesTarget, setSalesActual } = useSalesByCategory(month);
  const [editingCell, setEditingCell] = useState<{
    productId: string;
    category: PriceCategory;
    field: 'target' | 'actual';
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (
    productId: string,
    category: PriceCategory,
    field: 'target' | 'actual',
    currentValue: number
  ) => {
    setEditingCell({ productId, category, field });
    setEditValue(currentValue.toString());
  };

  const handleSave = () => {
    if (!editingCell) return;

    const value = parseFloat(editValue) || 0;

    if (editingCell.field === 'target') {
      setSalesTarget.mutate({
        productId: editingCell.productId,
        category: editingCell.category,
        quantity: value,
      });
    } else {
      setSalesActual.mutate({
        productId: editingCell.productId,
        category: editingCell.category,
        quantity: value,
      });
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditingCell(null);
  };

  const renderEditableCell = (
    product: ProductSalesData,
    category: PriceCategory,
    field: 'target' | 'actual',
    value: number
  ) => {
    const isEditing =
      editingCell?.productId === product.product_id &&
      editingCell?.category === category &&
      editingCell?.field === field;

    if (isEditing) {
      return (
        <Input
          type="number"
          min="0"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 w-16 text-right"
          autoFocus
        />
      );
    }

    return (
      <button
        className={`hover:underline ${field === 'actual' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
        onClick={() => handleEdit(product.product_id, category, field, value)}
      >
        {value}
      </button>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ventes par catégorie de prix</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (salesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ventes par catégorie de prix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            Aucun produit trouvé. Créez des produits pour commencer le suivi des ventes.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Ventes par catégorie de prix</CardTitle>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <Badge key={cat} className={getCategoryColor(cat)} variant="outline">
                {cat}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-middle">Produit</TableHead>
                {CATEGORIES.map((cat) => (
                  <TableHead key={cat} colSpan={4} className="text-center border-l">
                    <Badge className={getCategoryColor(cat)} variant="outline">
                      {cat}
                    </Badge>
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="text-right align-middle border-l">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 justify-end">
                      Total CA
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>CA total toutes catégories</TooltipContent>
                  </Tooltip>
                </TableHead>
              </TableRow>
              <TableRow>
                {CATEGORIES.map((cat) => (
                  <>
                    <TableHead key={`${cat}-prix`} className="text-right text-xs border-l">Prix HT</TableHead>
                    <TableHead key={`${cat}-obj`} className="text-right text-xs">Obj.</TableHead>
                    <TableHead key={`${cat}-reel`} className="text-right text-xs">Réel</TableHead>
                    <TableHead key={`${cat}-ca`} className="text-right text-xs">CA</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">{product.nom_produit}</TableCell>
                  {CATEGORIES.map((cat) => {
                    const price = product.prices[cat];
                    const sales = product.sales[cat];
                    const ca = (price?.prix_ht || 0) * sales.actual;

                    return (
                      <>
                        <TableCell key={`${product.product_id}-${cat}-prix`} className="text-right text-muted-foreground border-l">
                          {price ? `${price.prix_ht.toFixed(2)} €` : '-'}
                        </TableCell>
                        <TableCell key={`${product.product_id}-${cat}-obj`} className="text-right">
                          {renderEditableCell(product, cat, 'target', sales.target)}
                        </TableCell>
                        <TableCell key={`${product.product_id}-${cat}-reel`} className="text-right">
                          {renderEditableCell(product, cat, 'actual', sales.actual)}
                        </TableCell>
                        <TableCell key={`${product.product_id}-${cat}-ca`} className="text-right font-medium">
                          {ca > 0 ? `${ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €` : '-'}
                        </TableCell>
                      </>
                    );
                  })}
                  <TableCell className="text-right font-semibold border-l">
                    {product.totals.actual_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-accent/50 font-semibold">
                <TableCell>Total</TableCell>
                {CATEGORIES.map((cat) => {
                  const catTotals = salesData.reduce(
                    (acc, p) => {
                      const price = p.prices[cat]?.prix_ht || 0;
                      return {
                        target: acc.target + p.sales[cat].target,
                        actual: acc.actual + p.sales[cat].actual,
                        ca: acc.ca + p.sales[cat].actual * price,
                      };
                    },
                    { target: 0, actual: 0, ca: 0 }
                  );

                  return (
                    <>
                      <TableCell key={`total-${cat}-prix`} className="border-l">-</TableCell>
                      <TableCell key={`total-${cat}-obj`} className="text-right">{catTotals.target}</TableCell>
                      <TableCell key={`total-${cat}-reel`} className="text-right">{catTotals.actual}</TableCell>
                      <TableCell key={`total-${cat}-ca`} className="text-right">
                        {catTotals.ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </TableCell>
                    </>
                  );
                })}
                <TableCell className="text-right border-l">
                  {totals.actual_ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
