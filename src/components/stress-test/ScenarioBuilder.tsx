import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StressTestParams } from "@/hooks/useStressTest";
import { 
  Settings2, 
  TrendingDown, 
  Clock, 
  Package,
  DollarSign,
  Save,
  RotateCcw
} from "lucide-react";

interface ScenarioBuilderProps {
  onCalculate: (params: StressTestParams) => void;
  onSave: (name: string, params: StressTestParams) => void;
  isLoading?: boolean;
}

const defaultParams: StressTestParams = {
  baisseVentesPct: 0,
  hausseCoutMatieresPct: 0,
  retardPaiementJours: 0,
  augmentationStockPct: 0,
};

export function ScenarioBuilder({ onCalculate, onSave, isLoading }: ScenarioBuilderProps) {
  const [scenarioName, setScenarioName] = useState('Mon scénario personnalisé');
  const [params, setParams] = useState<StressTestParams>(defaultParams);

  const handleParamChange = (key: keyof StressTestParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onCalculate(newParams);
  };

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    onSave(scenarioName, params);
  };

  const handleReset = () => {
    setParams(defaultParams);
    onCalculate(defaultParams);
  };

  const hasChanges = Object.values(params).some(v => v !== 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-primary" />
          Configurer un scénario de stress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nom du scénario */}
        <div className="space-y-2">
          <Label htmlFor="scenario-name">Nom du scénario</Label>
          <Input
            id="scenario-name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Ex: Crise économique 2024"
          />
        </div>

        {/* Baisse des ventes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Baisse des ventes
            </Label>
            <span className="text-sm font-medium text-destructive">
              -{params.baisseVentesPct}%
            </span>
          </div>
          <Slider
            value={[params.baisseVentesPct]}
            onValueChange={([value]) => handleParamChange('baisseVentesPct', value)}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>-25%</span>
            <span>-50%</span>
          </div>
        </div>

        {/* Hausse des coûts matières */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Hausse coûts matières
            </Label>
            <span className="text-sm font-medium text-amber-600">
              +{params.hausseCoutMatieresPct}%
            </span>
          </div>
          <Slider
            value={[params.hausseCoutMatieresPct]}
            onValueChange={([value]) => handleParamChange('hausseCoutMatieresPct', value)}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>+25%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Retard de paiement */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Retard paiement clients
            </Label>
            <span className="text-sm font-medium text-orange-600">
              +{params.retardPaiementJours} jours
            </span>
          </div>
          <Slider
            value={[params.retardPaiementJours]}
            onValueChange={([value]) => handleParamChange('retardPaiementJours', value)}
            max={90}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0j</span>
            <span>45j</span>
            <span>90j</span>
          </div>
        </div>

        {/* Augmentation stock */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              Augmentation du stock
            </Label>
            <span className="text-sm font-medium text-purple-600">
              +{params.augmentationStockPct}%
            </span>
          </div>
          <Slider
            value={[params.augmentationStockPct]}
            onValueChange={([value]) => handleParamChange('augmentationStockPct', value)}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>+50%</span>
            <span>+100%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !scenarioName.trim()}
            className="flex-1 gap-2"
          >
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
          {hasChanges && (
            <Button 
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
