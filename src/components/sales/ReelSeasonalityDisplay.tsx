import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Lock } from "lucide-react";
import { ReelSeasonalityData } from "@/hooks/useMonthlyReelEntry";

interface ReelSeasonalityDisplayProps {
  seasonality: ReelSeasonalityData[];
  totalCa: number;
  isLoading: boolean;
}

export function ReelSeasonalityDisplay({ seasonality, totalCa, isLoading }: ReelSeasonalityDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saisonnalité observée</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxPercentage = Math.max(...seasonality.map(s => s.percentage), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Saisonnalité observée
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Lecture seule
              </Badge>
            </CardTitle>
            <CardDescription>
              Répartition calculée automatiquement à partir des ventes réelles saisies
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">CA Total Réel</p>
            <p className="text-xl font-bold">
              {totalCa.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalCa === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune vente réelle saisie pour cette année.</p>
            <p className="text-sm mt-1">Saisissez des ventes mensuelles pour voir la saisonnalité observée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {seasonality.map((month) => (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{month.month_label}</span>
                  <span className="text-sm text-muted-foreground">
                    {month.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(month.percentage / maxPercentage) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {month.ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
