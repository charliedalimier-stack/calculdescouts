import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Check, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceCategory } from "@/hooks/useProductPrices";
import { MonthlyReelRowData } from "@/hooks/useMonthlyReelEntry";

const MONTH_OPTIONS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

interface MonthlyReelEntryTableProps {
  entries: MonthlyReelRowData[];
  totals: {
    quantite: number;
    ca: number;
    by_channel: {
      BTC: { quantite: number; ca: number };
      BTB: { quantite: number; ca: number };
      Distributeur: { quantite: number; ca: number };
    };
  };
  isLoading: boolean;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  onUpdate: (params: {
    product_id: string;
    month: string;
    categorie_prix: PriceCategory;
    quantite: number;
    prix_ht_override?: number | null;
  }) => void;
}

const CHANNELS: PriceCategory[] = ['BTC', 'BTB', 'Distributeur'];

const getChannelColor = (channel: PriceCategory) => {
  switch (channel) {
    case 'BTC':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'BTB':
      return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    case 'Distributeur':
      return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
  }
};

export function MonthlyReelEntryTable({ 
  entries, 
  totals, 
  isLoading, 
  selectedMonth,
  onMonthChange,
  onUpdate 
}: MonthlyReelEntryTableProps) {
  const [editingCell, setEditingCell] = useState<{
    productId: string;
    channel: PriceCategory;
    field: 'quantite' | 'prix';
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (
    productId: string,
    channel: PriceCategory,
    field: 'quantite' | 'prix',
    currentValue: number
  ) => {
    setEditingCell({ productId, channel, field });
    setEditValue(currentValue.toString());
  };

  const handleSave = (entry: MonthlyReelRowData) => {
    if (!editingCell) return;

    const value = parseFloat(editValue) || 0;
    const channelData = entry.channels[editingCell.channel];

    if (editingCell.field === 'quantite') {
      onUpdate({
        product_id: editingCell.productId,
        month: entry.month,
        categorie_prix: editingCell.channel,
        quantite: value,
        prix_ht_override: channelData.prix_ht_override,
      });
    } else {
      onUpdate({
        product_id: editingCell.productId,
        month: entry.month,
        categorie_prix: editingCell.channel,
        quantite: channelData.quantite,
        prix_ht_override: value === channelData.prix_ht ? null : value,
      });
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, entry: MonthlyReelRowData) => {
    if (e.key === 'Enter') handleSave(entry);
    if (e.key === 'Escape') setEditingCell(null);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Saisie mensuelle
                <Badge variant="secondary">Réel</Badge>
              </CardTitle>
              <CardDescription>
                Aucun produit trouvé. Créez des produits pour commencer.
              </CardDescription>
            </div>
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => onMonthChange(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Saisie mensuelle
                <Badge variant="secondary">Réel</Badge>
              </CardTitle>
              <CardDescription>
                Saisissez les ventes réelles pour chaque mois. Les totaux annuels seront calculés automatiquement.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => onMonthChange(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map(m => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                {CHANNELS.map(ch => (
                  <Badge key={ch} variant="outline" className={getChannelColor(ch)}>
                    {ch}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-middle min-w-[150px]">Produit</TableHead>
                {CHANNELS.map(ch => (
                  <TableHead key={ch} colSpan={3} className="text-center border-l">
                    <Badge variant="outline" className={getChannelColor(ch)}>{ch}</Badge>
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="text-right align-middle border-l min-w-[100px]">
                  Total CA
                </TableHead>
              </TableRow>
              <TableRow>
                {CHANNELS.map(ch => (
                  <>
                    <TableHead key={`${ch}-qty`} className="text-right text-xs border-l">Qté</TableHead>
                    <TableHead key={`${ch}-prix`} className="text-right text-xs">Prix HT</TableHead>
                    <TableHead key={`${ch}-ca`} className="text-right text-xs">CA</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.product_id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{entry.product_name}</span>
                      {entry.category_name && (
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          {entry.category_name}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {CHANNELS.map(ch => {
                    const channelData = entry.channels[ch];
                    const isEditingQty = editingCell?.productId === entry.product_id &&
                      editingCell?.channel === ch && editingCell?.field === 'quantite';
                    const isEditingPrix = editingCell?.productId === entry.product_id &&
                      editingCell?.channel === ch && editingCell?.field === 'prix';
                    const effectivePrix = channelData.prix_ht_override || channelData.prix_ht;

                    return (
                      <>
                        <TableCell key={`${entry.product_id}-${ch}-qty`} className="text-right border-l">
                          {isEditingQty ? (
                            <div className="flex items-center gap-1 justify-end">
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, entry)}
                                className="h-8 w-20 text-right"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSave(entry)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingCell(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={cn(
                                    "hover:underline flex items-center gap-1 justify-end w-full",
                                    channelData.quantite === 0 && "text-muted-foreground"
                                  )}
                                  onClick={() => handleEdit(entry.product_id, ch, 'quantite', channelData.quantite)}
                                >
                                  {channelData.quantite}
                                  <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Cliquez pour modifier</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell key={`${entry.product_id}-${ch}-prix`} className="text-right">
                          {isEditingPrix ? (
                            <div className="flex items-center gap-1 justify-end">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, entry)}
                                className="h-8 w-20 text-right"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSave(entry)}>
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={cn(
                                    "hover:underline text-muted-foreground",
                                    channelData.prix_ht_override && "text-chart-4 font-medium"
                                  )}
                                  onClick={() => handleEdit(entry.product_id, ch, 'prix', effectivePrix)}
                                >
                                  {effectivePrix.toFixed(2)} €
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {channelData.prix_ht_override
                                  ? `Prix modifié (base: ${channelData.prix_ht.toFixed(2)} €)`
                                  : 'Prix depuis la tarification'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell key={`${entry.product_id}-${ch}-ca`} className="text-right font-medium">
                          {channelData.ca > 0 ? formatCurrency(channelData.ca) : '-'}
                        </TableCell>
                      </>
                    );
                  })}
                  <TableCell className="text-right font-semibold border-l">
                    {formatCurrency(entry.total_ca)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-accent/50 font-semibold">
                <TableCell>Total {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}</TableCell>
                {CHANNELS.map(ch => (
                  <>
                    <TableCell key={`total-${ch}-qty`} className="text-right border-l">
                      {totals.by_channel[ch].quantite}
                    </TableCell>
                    <TableCell key={`total-${ch}-prix`} className="text-right text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell key={`total-${ch}-ca`} className="text-right">
                      {formatCurrency(totals.by_channel[ch].ca)}
                    </TableCell>
                  </>
                ))}
                <TableCell className="text-right border-l">
                  {formatCurrency(totals.ca)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
