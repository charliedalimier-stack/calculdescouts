import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SensitivityResult } from '@/hooks/useSensitivityAnalysis';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface SensitivityTableProps {
  title: string;
  icon?: React.ReactNode;
  data: SensitivityResult[];
  variationType: 'cost' | 'price' | 'volume';
}

export function SensitivityTable({
  title,
  icon,
  data,
  variationType,
}: SensitivityTableProps) {
  const baseData = data.find(d => d.variation === 0);

  const getVariationIcon = (current: number, base: number | undefined, inverse: boolean = false) => {
    if (!base) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const diff = current - base;
    const isPositive = inverse ? diff < 0 : diff > 0;
    const isNegative = inverse ? diff > 0 : diff < 0;
    
    if (isPositive) return <TrendingUp className="h-4 w-4 text-primary" />;
    if (isNegative) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getRiskBadge = (margePercent: number) => {
    if (margePercent >= 30) return <Badge variant="default" className="bg-primary">Optimal</Badge>;
    if (margePercent >= 15) return <Badge variant="secondary">Acceptable</Badge>;
    if (margePercent >= 0) return <Badge variant="outline" className="border-chart-4 text-chart-4">Limite</Badge>;
    return <Badge variant="destructive">Déficit</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Variation</TableHead>
              <TableHead>Coût revient</TableHead>
              <TableHead>Marge unitaire</TableHead>
              <TableHead>Marge %</TableHead>
              <TableHead>CA (100 unités)</TableHead>
              <TableHead>Rentabilité</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow 
                key={index}
                className={row.variation === 0 ? 'bg-muted/50' : ''}
              >
                <TableCell className="font-medium">
                  <span className={
                    row.variation > 0 
                      ? 'text-destructive' 
                      : row.variation < 0 
                        ? 'text-primary' 
                        : ''
                  }>
                    {row.variation > 0 ? '+' : ''}{row.variation}%
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getVariationIcon(row.cout_revient, baseData?.cout_revient, true)}
                    {row.cout_revient.toFixed(2)} €
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getVariationIcon(row.marge, baseData?.marge)}
                    {row.marge.toFixed(2)} €
                  </div>
                </TableCell>
                <TableCell>
                  <span className={
                    row.marge_percent >= 30 
                      ? 'text-primary font-medium' 
                      : row.marge_percent < 15 
                        ? 'text-destructive font-medium' 
                        : ''
                  }>
                    {row.marge_percent.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>{row.ca.toFixed(0)} €</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getVariationIcon(row.rentabilite, baseData?.rentabilite)}
                    <span className={row.rentabilite < 0 ? 'text-destructive' : ''}>
                      {row.rentabilite.toFixed(0)} €
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getRiskBadge(row.marge_percent)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
