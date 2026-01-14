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
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyDistribution } from "@/hooks/useAnnualSalesEntry";

interface ObjectivesComparisonTableProps {
  monthly: MonthlyDistribution[];
  totals: {
    budget_ca: number;
    reel_ca: number;
    ecart_ca: number;
    ecart_percent: number;
  };
}

export function ObjectivesComparisonTable({ monthly, totals }: ObjectivesComparisonTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
  };

  const getStatusIcon = (ecart: number) => {
    if (ecart >= 0) {
      return <CheckCircle className="h-4 w-4 text-primary" />;
    } else if (ecart >= -10) {
      return <AlertTriangle className="h-4 w-4 text-chart-4" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (ecart: number) => {
    if (ecart >= 0) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          Objectif atteint
        </Badge>
      );
    } else if (ecart >= -10) {
      return (
        <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
          Léger écart
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
        Écart significatif
      </Badge>
    );
  };

  const getRowBackground = (ecart: number) => {
    if (ecart >= 0) return 'bg-primary/5';
    if (ecart >= -10) return 'bg-chart-4/5';
    return 'bg-destructive/5';
  };

  // Summary statistics
  const achievedCount = monthly.filter(m => m.ecart_percent >= 0 && m.budget_ca > 0).length;
  const warningCount = monthly.filter(m => m.ecart_percent < 0 && m.ecart_percent >= -10 && m.budget_ca > 0).length;
  const criticalCount = monthly.filter(m => m.ecart_percent < -10 && m.budget_ca > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comparaison avec objectifs</CardTitle>
            <CardDescription>
              Suivi mensuel de l'atteinte des objectifs de chiffre d'affaires
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <CheckCircle className="h-3 w-3 mr-1" />
              {achievedCount} atteints
            </Badge>
            <Badge variant="outline" className="bg-chart-4/10 text-chart-4">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warningCount} vigilance
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              <XCircle className="h-3 w-3 mr-1" />
              {criticalCount} critiques
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead className="text-right">Objectif CA</TableHead>
              <TableHead className="text-right">CA Réel</TableHead>
              <TableHead className="text-right">Écart</TableHead>
              <TableHead className="text-center">%</TableHead>
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthly.map((row) => (
              <TableRow key={row.month} className={row.budget_ca > 0 ? getRowBackground(row.ecart_percent) : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {row.budget_ca > 0 && getStatusIcon(row.ecart_percent)}
                    {row.month_label}
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.budget_ca > 0 ? formatCurrency(row.budget_ca) : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.reel_ca > 0 ? formatCurrency(row.reel_ca) : '-'}
                </TableCell>
                <TableCell className={cn(
                  "text-right",
                  row.ecart_ca >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {row.budget_ca > 0 ? (
                    <>
                      {row.ecart_ca >= 0 ? "+" : ""}{formatCurrency(row.ecart_ca)}
                    </>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {row.budget_ca > 0 ? (
                    <span className={cn(
                      "font-medium",
                      row.ecart_percent >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {row.ecart_percent >= 0 ? "+" : ""}{row.ecart_percent.toFixed(1)}%
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {row.budget_ca > 0 ? getStatusBadge(row.ecart_percent) : '-'}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow className="bg-accent font-semibold border-t-2">
              <TableCell>
                <div className="flex items-center gap-2">
                  {totals.budget_ca > 0 && getStatusIcon(totals.ecart_percent)}
                  Total Annuel
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.budget_ca)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.reel_ca)}
              </TableCell>
              <TableCell className={cn(
                "text-right",
                totals.ecart_ca >= 0 ? "text-primary" : "text-destructive"
              )}>
                {totals.ecart_ca >= 0 ? "+" : ""}{formatCurrency(totals.ecart_ca)}
              </TableCell>
              <TableCell className="text-center">
                <span className={cn(
                  "font-medium",
                  totals.ecart_percent >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {totals.ecart_percent >= 0 ? "+" : ""}{totals.ecart_percent.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-center">
                {totals.budget_ca > 0 && getStatusBadge(totals.ecart_percent)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
