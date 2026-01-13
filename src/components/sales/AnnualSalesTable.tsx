import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnnualSalesRow } from "@/hooks/useSales";

interface Props {
  year: number;
  data: AnnualSalesRow[];
  onCellChange: (productId: string, month: string, field: 'objectif' | 'reel', value: number) => void;
  isLoading?: boolean;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function AnnualSalesTable({ year, data, onCellChange, isLoading }: Props) {
  const [editingCell, setEditingCell] = useState<{ productId: string; month: string; field: 'objectif' | 'reel' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = (i + 1).toString().padStart(2, '0');
      return `${year}-${m}-01`;
    });
  }, [year]);

  const handleCellClick = (productId: string, month: string, field: 'objectif' | 'reel', currentValue: number) => {
    setEditingCell({ productId, month, field });
    setEditValue(currentValue.toString());
  };

  const handleSave = useCallback(() => {
    if (!editingCell) return;
    
    const value = parseFloat(editValue) || 0;
    
    if (value < 0) {
      return; // Prevent negative values
    }
    
    const key = `${editingCell.productId}-${editingCell.month}-${editingCell.field}`;
    setPendingChanges(prev => new Set(prev).add(key));
    
    onCellChange(editingCell.productId, editingCell.month, editingCell.field, value);
    setEditingCell(null);
    
    // Remove from pending after a short delay
    setTimeout(() => {
      setPendingChanges(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 500);
  }, [editingCell, editValue, onCellChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditingCell(null);
    }
    // Tab navigation
    if (e.key === 'Tab' && editingCell) {
      e.preventDefault();
      handleSave();
      // Move to next cell logic could be added here
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent, productId: string, startMonthIndex: number, field: 'objectif' | 'reel') => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const values = pasteData.split(/[\t\n]/).map(v => parseFloat(v.trim()) || 0);
    
    values.forEach((value, index) => {
      const monthIndex = startMonthIndex + index;
      if (monthIndex < 12 && value >= 0) {
        const month = months[monthIndex];
        onCellChange(productId, month, field, value);
      }
    });
    
    setEditingCell(null);
  }, [months, onCellChange]);

  const getCellBackground = (value: number, isObjectif: boolean, ecart?: number) => {
    if (value === 0) return 'bg-muted/30';
    if (!isObjectif && ecart !== undefined) {
      if (ecart > 0) return 'bg-primary/10';
      if (ecart < -10) return 'bg-destructive/10';
      if (ecart < 0) return 'bg-chart-4/10';
    }
    return '';
  };

  const totals = useMemo(() => {
    const monthTotals = months.map((month, i) => {
      const objectif = data.reduce((sum, row) => sum + (row.months[month]?.objectif || 0), 0);
      const reel = data.reduce((sum, row) => sum + (row.months[month]?.reel || 0), 0);
      return { objectif, reel };
    });
    
    const grandTotalObjectif = data.reduce((sum, row) => sum + row.total_objectif, 0);
    const grandTotalReel = data.reduce((sum, row) => sum + row.total_reel, 0);
    const grandTotalCaObjectif = data.reduce((sum, row) => sum + row.total_ca_objectif, 0);
    const grandTotalCaReel = data.reduce((sum, row) => sum + row.total_ca_reel, 0);
    const grandEcart = grandTotalCaObjectif > 0 
      ? ((grandTotalCaReel - grandTotalCaObjectif) / grandTotalCaObjectif) * 100 
      : 0;
    
    return {
      months: monthTotals,
      grandTotalObjectif,
      grandTotalReel,
      grandTotalCaObjectif,
      grandTotalCaReel,
      grandEcart,
    };
  }, [data, months]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Vue annuelle {year} - Quantités
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-accent" />
                <span className="text-muted-foreground">Objectif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary/20" />
                <span className="text-muted-foreground">Réel</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-background min-w-[180px]">Produit</TableHead>
                    <TableHead className="min-w-[80px] text-center">Type</TableHead>
                    {MONTH_LABELS.map((label, i) => (
                      <TableHead key={i} className="min-w-[70px] text-center text-xs">
                        {label}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[80px] text-center font-semibold">Total</TableHead>
                    <TableHead className="min-w-[100px] text-center font-semibold">CA</TableHead>
                    <TableHead className="min-w-[80px] text-center">Écart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {data.map((row) => (
                        <>
                          {/* Objectif Row */}
                          <TableRow key={`${row.product_id}-obj`} className="bg-accent/30">
                            <TableCell 
                              className="sticky left-0 z-10 bg-accent/30 font-medium"
                              rowSpan={2}
                            >
                              <div className="flex flex-col">
                                <span>{row.product_name}</span>
                                {row.category_name && (
                                  <Badge variant="outline" className="text-xs mt-1 w-fit">
                                    {row.category_name}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">Obj</Badge>
                            </TableCell>
                            {months.map((month, i) => {
                              const value = row.months[month]?.objectif || 0;
                              const isEditing = editingCell?.productId === row.product_id && 
                                               editingCell?.month === month && 
                                               editingCell?.field === 'objectif';
                              const key = `${row.product_id}-${month}-objectif`;
                              const isPending = pendingChanges.has(key);
                              
                              return (
                                <TableCell 
                                  key={month} 
                                  className={cn(
                                    "text-center p-1",
                                    getCellBackground(value, true),
                                    isPending && "opacity-50"
                                  )}
                                >
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={handleSave}
                                      onKeyDown={handleKeyDown}
                                      onPaste={(e) => handlePaste(e, row.product_id, i, 'objectif')}
                                      className="w-14 h-7 text-center text-xs p-1"
                                      autoFocus
                                    />
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className={cn(
                                            "w-full h-7 text-xs rounded hover:bg-accent transition-colors",
                                            value === 0 && "text-muted-foreground"
                                          )}
                                          onClick={() => handleCellClick(row.product_id, month, 'objectif', value)}
                                        >
                                          {value}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Objectif {MONTH_LABELS[i]} : {value} unités</p>
                                        <p className="text-muted-foreground">Cliquez pour modifier</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold bg-accent/50">
                              {row.total_objectif}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {row.total_ca_objectif.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                            </TableCell>
                            <TableCell rowSpan={2} className="text-center align-middle">
                              {row.ecart_percent !== 0 ? (
                                <div className={cn(
                                  "flex items-center justify-center gap-1",
                                  row.ecart_percent > 0 ? "text-primary" : "text-destructive"
                                )}>
                                  {row.ecart_percent > 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {row.ecart_percent > 0 ? "+" : ""}{row.ecart_percent.toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                          
                          {/* Réel Row */}
                          <TableRow key={`${row.product_id}-reel`}>
                            <TableCell className="text-center">
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Réel</Badge>
                            </TableCell>
                            {months.map((month, i) => {
                              const objectif = row.months[month]?.objectif || 0;
                              const value = row.months[month]?.reel || 0;
                              const ecart = objectif > 0 ? ((value - objectif) / objectif) * 100 : 0;
                              const isEditing = editingCell?.productId === row.product_id && 
                                               editingCell?.month === month && 
                                               editingCell?.field === 'reel';
                              const key = `${row.product_id}-${month}-reel`;
                              const isPending = pendingChanges.has(key);
                              const hasWarning = value < 0 || (objectif > 0 && value === 0);
                              
                              return (
                                <TableCell 
                                  key={month} 
                                  className={cn(
                                    "text-center p-1",
                                    getCellBackground(value, false, ecart),
                                    isPending && "opacity-50"
                                  )}
                                >
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={handleSave}
                                      onKeyDown={handleKeyDown}
                                      onPaste={(e) => handlePaste(e, row.product_id, i, 'reel')}
                                      className="w-14 h-7 text-center text-xs p-1"
                                      autoFocus
                                    />
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className={cn(
                                            "w-full h-7 text-xs rounded hover:bg-primary/10 transition-colors relative",
                                            value === 0 && "text-muted-foreground"
                                          )}
                                          onClick={() => handleCellClick(row.product_id, month, 'reel', value)}
                                        >
                                          {value}
                                          {hasWarning && objectif > 0 && (
                                            <AlertCircle className="h-3 w-3 text-chart-4 absolute -top-1 -right-1" />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Réel {MONTH_LABELS[i]} : {value} unités</p>
                                        {objectif > 0 && (
                                          <p className={ecart >= 0 ? "text-primary" : "text-destructive"}>
                                            Écart : {ecart >= 0 ? "+" : ""}{ecart.toFixed(1)}%
                                          </p>
                                        )}
                                        <p className="text-muted-foreground">Cliquez pour modifier</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold bg-primary/10">
                              {row.total_reel}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {row.total_ca_reel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                            </TableCell>
                          </TableRow>
                        </>
                      ))}
                      
                      {/* Totals */}
                      <TableRow className="bg-accent font-semibold border-t-2">
                        <TableCell className="sticky left-0 z-10 bg-accent" rowSpan={2}>
                          Total
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">Obj</Badge>
                        </TableCell>
                        {totals.months.map((m, i) => (
                          <TableCell key={i} className="text-center text-sm">
                            {m.objectif}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          {totals.grandTotalObjectif}
                        </TableCell>
                        <TableCell className="text-center">
                          {totals.grandTotalCaObjectif.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                        </TableCell>
                        <TableCell rowSpan={2} className="text-center align-middle">
                          <div className={cn(
                            "flex items-center justify-center gap-1",
                            totals.grandEcart >= 0 ? "text-primary" : "text-destructive"
                          )}>
                            {totals.grandEcart >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-bold">
                              {totals.grandEcart >= 0 ? "+" : ""}{totals.grandEcart.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-accent font-semibold">
                        <TableCell className="text-center">
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Réel</Badge>
                        </TableCell>
                        {totals.months.map((m, i) => (
                          <TableCell key={i} className="text-center text-sm">
                            {m.reel}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          {totals.grandTotalReel}
                        </TableCell>
                        <TableCell className="text-center">
                          {totals.grandTotalCaReel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}