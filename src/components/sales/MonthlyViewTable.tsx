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
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyDistribution } from "@/hooks/useAnnualSalesEntry";

interface MonthlyViewTableProps {
  monthly: MonthlyDistribution[];
  totals: {
    budget_qty: number;
    reel_qty: number;
    budget_ca: number;
    reel_ca: number;
    ecart_ca: number;
    ecart_percent: number;
  };
  isLoading: boolean;
}

export function MonthlyViewTable({ monthly, totals, isLoading }: MonthlyViewTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
  };

  const getEcartBadge = (ecart: number) => {
    if (ecart > 5) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{ecart.toFixed(1)}%
        </Badge>
      );
    } else if (ecart >= -5) {
      return (
        <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
          <Minus className="h-3 w-3 mr-1" />
          {ecart.toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
        <TrendingDown className="h-3 w-3 mr-1" />
        {ecart.toFixed(1)}%
      </Badge>
    );
  };

  const getRowColor = (ecart: number) => {
    if (ecart > 5) return 'bg-primary/5';
    if (ecart < -10) return 'bg-destructive/5';
    return '';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventes mensuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventes mensuelles calculées</CardTitle>
        <CardDescription>
          Répartition automatique à partir des totaux annuels et des coefficients de saisonnalité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead className="text-right">Qté Budget</TableHead>
              <TableHead className="text-right">Qté Réel</TableHead>
              <TableHead className="text-right">CA Budget</TableHead>
              <TableHead className="text-right">CA Réel</TableHead>
              <TableHead className="text-right">Écart CA</TableHead>
              <TableHead className="text-center">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthly.map((row) => (
              <TableRow key={row.month} className={getRowColor(row.ecart_percent)}>
                <TableCell className="font-medium">{row.month_label}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.budget_qty}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.reel_qty}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(row.budget_ca)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.reel_ca)}
                </TableCell>
                <TableCell className={cn(
                  "text-right",
                  row.ecart_ca >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {row.ecart_ca >= 0 ? "+" : ""}{formatCurrency(row.ecart_ca)}
                </TableCell>
                <TableCell className="text-center">
                  {row.budget_ca > 0 ? getEcartBadge(row.ecart_percent) : '-'}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-accent font-semibold border-t-2">
              <TableCell>Total Annuel</TableCell>
              <TableCell className="text-right">{totals.budget_qty}</TableCell>
              <TableCell className="text-right">{totals.reel_qty}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.budget_ca)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.reel_ca)}</TableCell>
              <TableCell className={cn(
                "text-right",
                totals.ecart_ca >= 0 ? "text-primary" : "text-destructive"
              )}>
                {totals.ecart_ca >= 0 ? "+" : ""}{formatCurrency(totals.ecart_ca)}
              </TableCell>
              <TableCell className="text-center">
                {totals.budget_ca > 0 ? getEcartBadge(totals.ecart_percent) : '-'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
