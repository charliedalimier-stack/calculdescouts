import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStressTest, StressTestParams } from "@/hooks/useStressTest";
import { StressTestChart } from "@/components/stress-test/StressTestChart";
import { StressTestSummaryCard } from "@/components/stress-test/StressTestSummary";
import { ScenarioComparison } from "@/components/stress-test/ScenarioComparison";
import { ScenarioBuilder } from "@/components/stress-test/ScenarioBuilder";
import { 
  ShieldAlert, 
  Play, 
  Trash2, 
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function StressTest() {
  const { 
    cashFlowData,
    savedScenarios,
    predefinedScenarios,
    isLoading,
    calculateStressTest,
    getStressTestSummary,
    compareScenarios,
    saveScenario,
    deleteScenario,
  } = useStressTest();

  const [activeScenario, setActiveScenario] = useState<{ name: string; params: StressTestParams } | null>(null);
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);

  // Résultats du scénario actif
  const activeResults = useMemo(() => {
    if (!activeScenario) return null;
    return {
      data: calculateStressTest(activeScenario.params),
      summary: getStressTestSummary(activeScenario.params, activeScenario.name),
    };
  }, [activeScenario, calculateStressTest, getStressTestSummary]);

  // Comparaison des scénarios sélectionnés
  const comparisonData = useMemo(() => {
    const scenariosToCompare = predefinedScenarios.filter(s => selectedPredefined.includes(s.name));
    return compareScenarios(scenariosToCompare);
  }, [selectedPredefined, predefinedScenarios, compareScenarios]);

  const handleSelectPredefined = (name: string) => {
    setSelectedPredefined(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const handleRunPredefined = (scenario: { name: string; params: StressTestParams }) => {
    setActiveScenario(scenario);
  };

  const handleCustomCalculate = (params: StressTestParams) => {
    setActiveScenario({ name: 'Scénario personnalisé', params });
  };

  const handleSaveScenario = (name: string, params: StressTestParams) => {
    saveScenario.mutate({ name, params });
  };

  if (isLoading) {
    return (
      <AppLayout title="Stress Test Trésorerie">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (cashFlowData.length === 0) {
    return (
      <AppLayout title="Stress Test Trésorerie" subtitle="Simulez l'impact de scénarios de crise sur votre trésorerie">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Données insuffisantes</AlertTitle>
          <AlertDescription>
            Pour effectuer un stress test, vous devez d'abord saisir des données de cash-flow.
            Rendez-vous dans la section Cash-flow pour commencer.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Stress Test Trésorerie" subtitle="Simulez l'impact de scénarios de crise sur votre trésorerie">
      <div className="space-y-6">
        <Tabs defaultValue="predefined" className="space-y-4">
          <TabsList>
            <TabsTrigger value="predefined">Scénarios prédéfinis</TabsTrigger>
            <TabsTrigger value="custom">Scénario personnalisé</TabsTrigger>
            <TabsTrigger value="compare">Comparaison</TabsTrigger>
            <TabsTrigger value="saved">Scénarios sauvegardés ({savedScenarios.length})</TabsTrigger>
          </TabsList>

          {/* Scénarios prédéfinis */}
          <TabsContent value="predefined" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {predefinedScenarios.map((scenario) => {
                const summary = getStressTestSummary(scenario.params, scenario.name);
                const isSelected = selectedPredefined.includes(scenario.name);
                const isActive = activeScenario?.name === scenario.name;

                return (
                  <Card 
                    key={scenario.name}
                    className={`cursor-pointer transition-all ${
                      isActive ? 'ring-2 ring-primary' : 
                      isSelected ? 'ring-2 ring-chart-1' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">
                          {scenario.name}
                        </CardTitle>
                        <Badge 
                          variant={
                            summary.risqueLevel === 'critical' ? 'destructive' :
                            summary.risqueLevel === 'high' ? 'default' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {summary.risqueLevel === 'critical' ? 'Critique' :
                           summary.risqueLevel === 'high' ? 'Élevé' :
                           summary.risqueLevel === 'medium' ? 'Modéré' : 'Faible'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {scenario.params.baisseVentesPct > 0 && (
                          <div>
                            <span className="text-muted-foreground">Ventes:</span>
                            <span className="ml-1 text-destructive">-{scenario.params.baisseVentesPct}%</span>
                          </div>
                        )}
                        {scenario.params.hausseCoutMatieresPct > 0 && (
                          <div>
                            <span className="text-muted-foreground">Coûts:</span>
                            <span className="ml-1 text-amber-600">+{scenario.params.hausseCoutMatieresPct}%</span>
                          </div>
                        )}
                        {scenario.params.retardPaiementJours > 0 && (
                          <div>
                            <span className="text-muted-foreground">Retard:</span>
                            <span className="ml-1 text-orange-600">+{scenario.params.retardPaiementJours}j</span>
                          </div>
                        )}
                        {scenario.params.augmentationStockPct > 0 && (
                          <div>
                            <span className="text-muted-foreground">Stock:</span>
                            <span className="ml-1 text-purple-600">+{scenario.params.augmentationStockPct}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleRunPredefined(scenario)}
                        >
                          <Play className="h-3 w-3" />
                          Simuler
                        </Button>
                        <Button 
                          size="sm" 
                          variant={isSelected ? "default" : "ghost"}
                          onClick={() => handleSelectPredefined(scenario.name)}
                        >
                          {isSelected ? <CheckCircle className="h-4 w-4" /> : '+'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Résultats du scénario actif */}
            {activeResults && (
              <div className="space-y-4">
                <StressTestSummaryCard summary={activeResults.summary} />
                <StressTestChart 
                  data={activeResults.data} 
                  scenarioName={activeScenario?.name || ''} 
                />
              </div>
            )}
          </TabsContent>

          {/* Scénario personnalisé */}
          <TabsContent value="custom" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <ScenarioBuilder 
                onCalculate={handleCustomCalculate}
                onSave={handleSaveScenario}
                isLoading={saveScenario.isPending}
              />
              <div className="lg:col-span-2 space-y-4">
                {activeResults && (
                  <>
                    <StressTestSummaryCard summary={activeResults.summary} />
                    <StressTestChart 
                      data={activeResults.data} 
                      scenarioName={activeScenario?.name || ''} 
                    />
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Comparaison */}
          <TabsContent value="compare" className="space-y-4">
            {selectedPredefined.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Aucun scénario sélectionné</AlertTitle>
                <AlertDescription>
                  Retournez dans l'onglet "Scénarios prédéfinis" et cliquez sur le bouton "+" 
                  pour ajouter des scénarios à comparer.
                </AlertDescription>
              </Alert>
            ) : (
              <ScenarioComparison scenarios={comparisonData} />
            )}
          </TabsContent>

          {/* Scénarios sauvegardés */}
          <TabsContent value="saved" className="space-y-4">
            {savedScenarios.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Aucun scénario sauvegardé</AlertTitle>
                <AlertDescription>
                  Créez un scénario personnalisé et sauvegardez-le pour le retrouver ici.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {savedScenarios.map((scenario) => (
                  <Card key={scenario.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">
                          {scenario.nom_scenario}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteScenario.mutate(scenario.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Ventes:</span>
                          <span className="ml-1">-{scenario.baisse_ventes_pct}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coûts:</span>
                          <span className="ml-1">+{scenario.hausse_cout_matieres_pct}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Retard:</span>
                          <span className="ml-1">+{scenario.retard_paiement_jours}j</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="ml-1">+{scenario.augmentation_stock_pct}%</span>
                        </div>
                      </div>
                      {scenario.besoin_tresorerie_max && scenario.besoin_tresorerie_max > 0 && (
                        <div className="text-xs text-destructive">
                          Besoin: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(scenario.besoin_tresorerie_max)}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full gap-1"
                        onClick={() => handleRunPredefined({
                          name: scenario.nom_scenario,
                          params: {
                            baisseVentesPct: scenario.baisse_ventes_pct || 0,
                            hausseCoutMatieresPct: scenario.hausse_cout_matieres_pct || 0,
                            retardPaiementJours: scenario.retard_paiement_jours || 0,
                            augmentationStockPct: scenario.augmentation_stock_pct || 0,
                          }
                        })}
                      >
                        <Play className="h-3 w-3" />
                        Relancer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
