import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StressTestSummary } from "@/hooks/useStressTest";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  ShieldX,
  BarChart3
} from "lucide-react";

interface ScenarioComparisonProps {
  scenarios: StressTestSummary[];
}

export function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldX className="h-3 w-3" />
            Critique
          </Badge>
        );
      case 'high':
        return (
          <Badge className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <ShieldAlert className="h-3 w-3" />
            Élevé
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Shield className="h-3 w-3" />
            Modéré
          </Badge>
        );
      default:
        return (
          <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="h-3 w-3" />
            Faible
          </Badge>
        );
    }
  };

  // Trier par niveau de risque
  const sortedScenarios = [...scenarios].sort((a, b) => {
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (riskOrder[a.risqueLevel] ?? 4) - (riskOrder[b.risqueLevel] ?? 4);
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Comparaison des scénarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scenarios.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Sélectionnez des scénarios pour les comparer
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scénario</TableHead>
                    <TableHead>Risque</TableHead>
                    <TableHead className="text-right">Besoin trésorerie</TableHead>
                    <TableHead className="text-right">Tension critique</TableHead>
                    <TableHead className="text-right">Impact CA</TableHead>
                    <TableHead className="text-right">Récupération</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScenarios.map((scenario, index) => (
                    <TableRow 
                      key={`${scenario.scenarioName}-${index}`}
                      className={
                        scenario.risqueLevel === 'critical' ? 'bg-destructive/5' :
                        scenario.risqueLevel === 'high' ? 'bg-orange-50 dark:bg-orange-950/20' :
                        undefined
                      }
                    >
                      <TableCell className="font-medium">
                        {scenario.scenarioName}
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(scenario.risqueLevel)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={scenario.besoinTresorerieMax > 0 ? 'text-destructive font-medium' : ''}>
                          {formatCurrency(scenario.besoinTresorerieMax)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {scenario.moisTensionCritique 
                          ? <span className="text-amber-600 dark:text-amber-400">Mois {scenario.moisTensionCritique}</span>
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -{formatCurrency(Math.abs(scenario.impactTotalCA))}
                      </TableCell>
                      <TableCell className="text-right">
                        {scenario.delaiRecuperationMois !== null
                          ? <span className="text-emerald-600 dark:text-emerald-400">{scenario.delaiRecuperationMois} mois</span>
                          : <span className="text-muted-foreground">N/A</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Légende */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ShieldX className="h-3 w-3 text-destructive" />
                <span>Critique : Besoin &gt; 50K€ ou tension &lt; 3 mois</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-orange-500" />
                <span>Élevé : Besoin &gt; 20K€ ou tension &lt; 5 mois</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-500" />
                <span>Modéré : Impact notable mais gérable</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Faible : Impact limité</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
