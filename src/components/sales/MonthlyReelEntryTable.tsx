import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Calendar, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyReelEntry, useMonthlySalesReel } from "@/hooks/useMonthlySalesReel";
import { PriceCategory } from "@/hooks/useProductPrices";

interface MonthlyReelEntryTableProps {
  year: number;
}

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

const FULL_MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const CATEGORIES: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

export function MonthlyReelEntryTable({ year }: MonthlyReelEntryTableProps) {
  const {
    entries,
    hasMonthlyData,
    isLoading,
    setMonthlySale,
    MONTH_KEYS,
  } = useMonthlySalesReel(year);

  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});

  const toggleProduct = (productId: string) => {
    const newSet = new Set(expandedProducts);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setExpandedProducts(newSet);
  };

  const getMonthStr = (monthIndex: number) => `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;

  const handleQuantityChange = (
    productId: string,
    monthIndex: number,
    category: PriceCategory,
    value: string
  ) => {
    const key = `${productId}-${monthIndex}-${category}`;
    const numValue = parseInt(value) || 0;
    setEditingValues(prev => ({ ...prev, [key]: numValue }));
  };

  const saveQuantity = async (
    productId: string,
    monthIndex: number,
    category: PriceCategory
  ) => {
    const key = `${productId}-${monthIndex}-${category}`;
    const value = editingValues[key];
    if (value === undefined) return;

    await setMonthlySale.mutateAsync({
      product_id: productId,
      month: getMonthStr(monthIndex),
      categorie_prix: category,
      quantite: value,
    });

    // Clear editing value after save
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  const getQuantity = (
    entry: MonthlyReelEntry,
    monthIndex: number,
    category: PriceCategory
  ): number => {
    const monthStr = getMonthStr(monthIndex);
    return entry.months[monthStr]?.[category]?.quantite || 0;
  };

  const getEditingValue = (
    entry: MonthlyReelEntry,
    monthIndex: number,
    category: PriceCategory
  ): number => {
    const key = `${entry.product_id}-${monthIndex}-${category}`;
    if (editingValues[key] !== undefined) {
      return editingValues[key];
    }
    return getQuantity(entry, monthIndex, category);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saisie mensuelle des ventes réelles</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saisie mensuelle des ventes réelles</CardTitle>
          <CardDescription>
            Aucun produit trouvé. Créez d'abord des produits.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Saisie mensuelle des ventes réelles
            </CardTitle>
            <CardDescription>
              Saisissez les quantités vendues mois par mois pour chaque produit et canal
            </CardDescription>
          </div>
          {hasMonthlyData && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Données mensuelles actives
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Month selector */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-medium">Mois sélectionné :</span>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FULL_MONTH_LABELS.map((label, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {label} {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products table for selected month */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Produit</TableHead>
              <TableHead className="text-center">BTC</TableHead>
              <TableHead className="text-center">BTB</TableHead>
              <TableHead className="text-center">Distributeur</TableHead>
              <TableHead className="text-right">Total Qté</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const monthStr = getMonthStr(selectedMonth);
              const monthData = entry.months[monthStr];
              const monthTotal = 
                (monthData?.BTC?.quantite || 0) +
                (monthData?.BTB?.quantite || 0) +
                (monthData?.Distributeur?.quantite || 0);

              return (
                <Collapsible key={entry.product_id} asChild>
                  <>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleProduct(entry.product_id)}
                        >
                          {expandedProducts.has(entry.product_id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{entry.product_name}</span>
                          {entry.category_name && (
                            <Badge variant="outline" className="text-xs">
                              {entry.category_name}
                            </Badge>
                          )}
                        </CollapsibleTrigger>
                      </TableCell>
                      {CATEGORIES.map((cat) => (
                        <TableCell key={cat} className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              className="w-20 text-center"
                              value={getEditingValue(entry, selectedMonth, cat)}
                              onChange={(e) =>
                                handleQuantityChange(
                                  entry.product_id,
                                  selectedMonth,
                                  cat,
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                saveQuantity(entry.product_id, selectedMonth, cat)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveQuantity(entry.product_id, selectedMonth, cat);
                                }
                              }}
                            />
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {monthTotal}
                      </TableCell>
                    </TableRow>

                    {/* Expanded: Show all months for this product */}
                    <CollapsibleContent asChild>
                      <TableRow className={cn(
                        "bg-muted/30",
                        !expandedProducts.has(entry.product_id) && "hidden"
                      )}>
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-4">
                            <p className="text-sm font-medium mb-2">
                              Détail annuel - {entry.product_name}
                            </p>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Mois</TableHead>
                                    {CATEGORIES.map((cat) => (
                                      <TableHead key={cat} className="text-center">
                                        {cat}
                                      </TableHead>
                                    ))}
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {MONTH_KEYS.map((monthNum, monthIdx) => {
                                    const mStr = getMonthStr(monthIdx);
                                    const mData = entry.months[mStr];
                                    const mTotal =
                                      (mData?.BTC?.quantite || 0) +
                                      (mData?.BTB?.quantite || 0) +
                                      (mData?.Distributeur?.quantite || 0);
                                    
                                    return (
                                      <TableRow
                                        key={monthNum}
                                        className={cn(
                                          monthIdx === selectedMonth && "bg-primary/5"
                                        )}
                                      >
                                        <TableCell className="font-medium">
                                          {FULL_MONTH_LABELS[monthIdx]}
                                        </TableCell>
                                        {CATEGORIES.map((cat) => (
                                          <TableCell key={cat} className="text-center">
                                            {monthIdx === selectedMonth ? (
                                              <Input
                                                type="number"
                                                min={0}
                                                className="w-16 text-center mx-auto"
                                                value={getEditingValue(entry, monthIdx, cat)}
                                                onChange={(e) =>
                                                  handleQuantityChange(
                                                    entry.product_id,
                                                    monthIdx,
                                                    cat,
                                                    e.target.value
                                                  )
                                                }
                                                onBlur={() =>
                                                  saveQuantity(entry.product_id, monthIdx, cat)
                                                }
                                              />
                                            ) : (
                                              <span className="text-muted-foreground">
                                                {mData?.[cat]?.quantite || 0}
                                              </span>
                                            )}
                                          </TableCell>
                                        ))}
                                        <TableCell className="text-right font-medium">
                                          {mTotal}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  {/* Totals row */}
                                  <TableRow className="bg-accent font-semibold">
                                    <TableCell>Total annuel</TableCell>
                                    {CATEGORIES.map((cat) => (
                                      <TableCell key={cat} className="text-center">
                                        {entry.totals[cat].quantite}
                                      </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                      {entry.totals.total_quantite}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              CA annuel estimé : {formatCurrency(entry.totals.total_ca)}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
