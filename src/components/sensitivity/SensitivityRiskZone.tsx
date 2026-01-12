import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { SensitivityResult } from '@/hooks/useSensitivityAnalysis';
import { useMemo } from 'react';

interface SensitivityRiskZoneProps {
  productName: string;
  costData: SensitivityResult[];
  priceData: SensitivityResult[];
  volumeData: SensitivityResult[];
}

export function SensitivityRiskZone({
  productName,
  costData,
  priceData,
  volumeData,
}: SensitivityRiskZoneProps) {
  // Calculate risk thresholds
  const riskAnalysis = useMemo(() => {
    const baseMargin = costData.find(d => d.variation === 0)?.marge_percent || 0;
    
    // Find when margin goes negative for cost increase
    const costBreakpoint = costData.find(d => d.variation > 0 && d.marge <= 0);
    const maxCostIncrease = costBreakpoint 
      ? costBreakpoint.variation - 10 
      : costData[costData.length - 1]?.variation || 30;

    // Find when margin goes negative for price decrease
    const priceBreakpoint = priceData.find(d => d.variation < 0 && d.marge <= 0);
    const maxPriceDecrease = priceBreakpoint 
      ? Math.abs(priceBreakpoint.variation) - 10 
      : Math.abs(priceData[0]?.variation || -30);

    // Calculate resilience score (0-100)
    const costResilience = Math.min(100, (maxCostIncrease / 30) * 100);
    const priceResilience = Math.min(100, (maxPriceDecrease / 30) * 100);
    const marginResilience = Math.min(100, (baseMargin / 50) * 100);
    
    const overallResilience = (costResilience + priceResilience + marginResilience) / 3;

    return {
      baseMargin,
      maxCostIncrease,
      maxPriceDecrease,
      costResilience,
      priceResilience,
      marginResilience,
      overallResilience,
    };
  }, [costData, priceData]);

  const getResilienceColor = (value: number) => {
    if (value >= 70) return 'text-primary';
    if (value >= 40) return 'text-chart-4';
    return 'text-destructive';
  };

  const getResilienceIcon = (value: number) => {
    if (value >= 70) return <CheckCircle className="h-5 w-5 text-primary" />;
    if (value >= 40) return <AlertTriangle className="h-5 w-5 text-chart-4" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  const getProgressColor = (value: number) => {
    if (value >= 70) return 'bg-primary';
    if (value >= 40) return 'bg-chart-4';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="h-5 w-5 text-primary" />
          Zones de risque - {productName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall resilience score */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score de résilience global</span>
            <div className="flex items-center gap-2">
              {getResilienceIcon(riskAnalysis.overallResilience)}
              <span className={`text-2xl font-bold ${getResilienceColor(riskAnalysis.overallResilience)}`}>
                {riskAnalysis.overallResilience.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className={`h-full transition-all ${getProgressColor(riskAnalysis.overallResilience)}`}
              style={{ width: `${riskAnalysis.overallResilience}%` }}
            />
          </div>
        </div>

        {/* Individual risk factors */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Cost resilience */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              {getResilienceIcon(riskAnalysis.costResilience)}
              <span className="text-sm font-medium">Résistance coûts</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Peut absorber jusqu'à <span className="font-bold text-foreground">+{riskAnalysis.maxCostIncrease}%</span> de hausse des coûts
            </p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all ${getProgressColor(riskAnalysis.costResilience)}`}
                style={{ width: `${riskAnalysis.costResilience}%` }}
              />
            </div>
          </div>

          {/* Price resilience */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              {getResilienceIcon(riskAnalysis.priceResilience)}
              <span className="text-sm font-medium">Résistance prix</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Peut absorber jusqu'à <span className="font-bold text-foreground">-{riskAnalysis.maxPriceDecrease}%</span> de baisse de prix
            </p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all ${getProgressColor(riskAnalysis.priceResilience)}`}
                style={{ width: `${riskAnalysis.priceResilience}%` }}
              />
            </div>
          </div>

          {/* Margin buffer */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              {getResilienceIcon(riskAnalysis.marginResilience)}
              <span className="text-sm font-medium">Coussin de marge</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Marge actuelle: <span className="font-bold text-foreground">{riskAnalysis.baseMargin.toFixed(1)}%</span>
            </p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all ${getProgressColor(riskAnalysis.marginResilience)}`}
                style={{ width: `${riskAnalysis.marginResilience}%` }}
              />
            </div>
          </div>
        </div>

        {/* Risk alerts */}
        {riskAnalysis.overallResilience < 50 && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Produit fragile économiquement</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ce produit présente une faible résilience aux variations de marché. 
                  Considérez une révision des prix ou une optimisation des coûts.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
