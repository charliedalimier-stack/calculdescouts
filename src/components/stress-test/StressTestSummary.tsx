import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StressTestSummary as StressTestSummaryType } from "@/hooks/useStressTest";
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Wallet,
  ShieldAlert,
  ShieldCheck,
  Shield,
  ShieldX
} from "lucide-react";

interface StressTestSummaryProps {
  summary: StressTestSummaryType;
}

export function StressTestSummaryCard({ summary }: StressTestSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return { 
          icon: ShieldX, 
          color: 'text-destructive', 
          bg: 'bg-destructive/10',
          label: 'Critique',
          progress: 100,
          progressColor: 'bg-destructive'
        };
      case 'high':
        return { 
          icon: ShieldAlert, 
          color: 'text-orange-600 dark:text-orange-400', 
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          label: 'Élevé',
          progress: 75,
          progressColor: 'bg-orange-500'
        };
      case 'medium':
        return { 
          icon: Shield, 
          color: 'text-amber-600 dark:text-amber-400', 
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          label: 'Modéré',
          progress: 50,
          progressColor: 'bg-amber-500'
        };
      default:
        return { 
          icon: ShieldCheck, 
          color: 'text-chart-2', 
          bg: 'bg-chart-2/10',
          label: 'Faible',
          progress: 25,
          progressColor: 'bg-chart-2'
        };
    }
  };

  const riskConfig = getRiskConfig(summary.risqueLevel);
  const RiskIcon = riskConfig.icon;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Niveau de risque */}
        <Card className={riskConfig.bg}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Niveau de risque
            </CardTitle>
            <RiskIcon className={`h-5 w-5 ${riskConfig.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskConfig.color}`}>
              {riskConfig.label}
            </div>
            <Progress 
              value={riskConfig.progress} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Besoin de trésorerie max */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Besoin max trésorerie
            </CardTitle>
            <Wallet className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.besoinTresorerieMax > 0 ? 'text-destructive' : 'text-chart-2'}`}>
              {formatCurrency(summary.besoinTresorerieMax)}
            </div>
            <p className="text-xs text-muted-foreground">
              à financer en cas de crise
            </p>
          </CardContent>
        </Card>

        {/* Mois de tension critique */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tension critique
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.moisTensionCritique 
                ? `Mois ${summary.moisTensionCritique}` 
                : 'Aucune'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.moisTensionCritique 
                ? 'premier passage en négatif'
                : 'pas de passage en négatif'}
            </p>
          </CardContent>
        </Card>

        {/* Impact total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impact total CA
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{formatCurrency(Math.abs(summary.impactTotalCA))}
            </div>
            <p className="text-xs text-muted-foreground">
              perte de chiffre d'affaires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes contextuelles */}
      {summary.risqueLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Risque critique détecté</AlertTitle>
          <AlertDescription>
            Ce scénario entraînerait un besoin de financement de {formatCurrency(summary.besoinTresorerieMax)} 
            dès le mois {summary.moisTensionCritique}. Préparez un plan de financement d'urgence ou 
            constituez des réserves de trésorerie.
          </AlertDescription>
        </Alert>
      )}

      {summary.risqueLevel === 'high' && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Risque élevé</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            Ce scénario pourrait mettre votre trésorerie sous forte pression. 
            Envisagez de négocier des lignes de crédit de secours ou de réduire vos délais de paiement clients.
          </AlertDescription>
        </Alert>
      )}

      {summary.risqueLevel === 'medium' && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Risque modéré</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Ce scénario aurait un impact notable mais gérable. 
            Surveillez vos indicateurs et préparez des mesures correctives.
          </AlertDescription>
        </Alert>
      )}

      {summary.delaiRecuperationMois !== null && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-chart-2/10 p-3">
                <Clock className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm font-medium">Délai de récupération</p>
                <p className="text-2xl font-bold text-chart-2">
                  {summary.delaiRecuperationMois} mois
                </p>
                <p className="text-xs text-muted-foreground">
                  pour revenir à l'équilibre après le creux
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
