import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreakevenResult, Channel } from "@/hooks/useBreakevenAnalysis";
import { Target, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";

interface BreakevenTableProps {
  data: BreakevenResult[];
  showChannel?: boolean;
}

export function BreakevenTable({ data, showChannel = true }: BreakevenTableProps) {
  const formatCurrency = (value: number) => {
    if (value < 0) return "N/A";
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value < 0) return "N/A";
    return value.toLocaleString('fr-FR');
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChannelLabel = (channel: Channel) => {
    switch (channel) {
      case 'btc': return 'BTC';
      case 'btb': return 'BTB';
      case 'distributeur': return 'Distrib.';
    }
  };

  const getStatusBadge = (result: BreakevenResult) => {
    if (result.seuilUnites < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Non viable
        </Badge>
      );
    }
    if (result.isRentable) {
      if (result.margeSecurite > 30) {
        return (
          <Badge className="gap-1 bg-chart-2 text-chart-2-foreground">
            <CheckCircle className="h-3 w-3" />
            Sécurisé
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Rentable
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Sous seuil
      </Badge>
    );
  };

  const getMargeIcon = (marge: number) => {
    if (marge > 20) return <TrendingUp className="h-4 w-4 text-chart-2" />;
    if (marge > 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  // Grouper par produit si showChannel
  const groupedData = showChannel
    ? data
    : data.filter((item, index, self) => 
        self.findIndex(t => t.productId === item.productId) === index
      );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Seuils de rentabilité par produit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                {showChannel && <TableHead>Canal</TableHead>}
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Coût unitaire</TableHead>
                <TableHead className="text-right">Contribution</TableHead>
                <TableHead className="text-right">Seuil (unités)</TableHead>
                <TableHead className="text-right">Seuil (€)</TableHead>
                <TableHead className="text-right">Volume actuel</TableHead>
                <TableHead className="text-right">Marge sécurité</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedData.map((result, index) => (
                <TableRow 
                  key={`${result.productId}-${result.channel}-${index}`}
                  className={!result.isRentable ? "bg-destructive/5" : undefined}
                >
                  <TableCell className="font-medium">
                    <div>
                      {result.productName}
                      {result.categoryName && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({result.categoryName})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {showChannel && (
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getChannelLabel(result.channel)}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {formatCurrency(result.prixVenteHT)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(result.coutVariable)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {formatCurrency(result.contributionUnitaire)}
                      <span className="text-xs text-muted-foreground">
                        ({result.tauxContribution.toFixed(0)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(result.seuilUnites)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(result.seuilCA)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(result.volumeActuel)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getMargeIcon(result.margeSecurite)}
                      <span className={
                        result.margeSecurite > 20 ? "text-chart-2" :
                        result.margeSecurite > 0 ? "text-foreground" :
                        "text-destructive"
                      }>
                        {formatPercent(result.margeSecurite)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(result)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {groupedData.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            Aucun produit à afficher
          </div>
        )}
      </CardContent>
    </Card>
  );
}
