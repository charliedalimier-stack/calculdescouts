import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, RotateCcw, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonalityCoeffs {
  month_01: number;
  month_02: number;
  month_03: number;
  month_04: number;
  month_05: number;
  month_06: number;
  month_07: number;
  month_08: number;
  month_09: number;
  month_10: number;
  month_11: number;
  month_12: number;
}

interface SeasonalityEditorProps {
  coefficients: SeasonalityCoeffs;
  mode: 'budget' | 'reel';
  onUpdate: (coefficients: Partial<SeasonalityCoeffs>) => void;
  isLoading?: boolean;
}

const MONTHS = [
  { key: 'month_01', label: 'Jan' },
  { key: 'month_02', label: 'Fév' },
  { key: 'month_03', label: 'Mar' },
  { key: 'month_04', label: 'Avr' },
  { key: 'month_05', label: 'Mai' },
  { key: 'month_06', label: 'Jun' },
  { key: 'month_07', label: 'Jul' },
  { key: 'month_08', label: 'Aoû' },
  { key: 'month_09', label: 'Sep' },
  { key: 'month_10', label: 'Oct' },
  { key: 'month_11', label: 'Nov' },
  { key: 'month_12', label: 'Déc' },
] as const;

export function SeasonalityEditor({ coefficients, mode, onUpdate, isLoading }: SeasonalityEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localCoefficients, setLocalCoefficients] = useState(coefficients);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalCoefficients(coefficients);
    setHasChanges(false);
  }, [coefficients]);

  const total = MONTHS.reduce((sum, m) => sum + (localCoefficients[m.key] || 0), 0);
  const isValid = Math.abs(total - 100) < 0.1;

  const handleChange = (key: keyof typeof coefficients, value: number) => {
    setLocalCoefficients(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSliderChange = (key: keyof typeof coefficients, values: number[]) => {
    handleChange(key, values[0]);
  };

  const handleSave = () => {
    if (isValid) {
      onUpdate(localCoefficients);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    const defaultValue = 8.33;
    const newCoefficients = MONTHS.reduce((acc, m, i) => {
      acc[m.key] = i === 11 ? 8.37 : defaultValue;
      return acc;
    }, {} as typeof coefficients);
    setLocalCoefficients(newCoefficients);
    setHasChanges(true);
  };

  const getBarHeight = (value: number) => {
    const maxHeight = 60;
    const minHeight = 10;
    const maxValue = Math.max(...Object.values(localCoefficients));
    return Math.max(minHeight, (value / maxValue) * maxHeight);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Coefficients de saisonnalité</CardTitle>
                  <CardDescription>
                    Répartition mensuelle des ventes annuelles ({mode === 'budget' ? 'Budget' : 'Réel'})
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isValid ? "default" : "destructive"}>
                  Total: {total.toFixed(1)}%
                </Badge>
                <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Visual bar chart */}
            <div className="flex items-end justify-between h-20 gap-1 px-2">
              {MONTHS.map((m) => {
                const value = localCoefficients[m.key] || 0;
                return (
                  <div key={m.key} className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        value > 10 ? "bg-primary" : value > 6 ? "bg-primary/70" : "bg-primary/40"
                      )}
                      style={{ height: getBarHeight(value) }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">{m.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {MONTHS.map((m) => (
                <div key={m.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{m.label}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={localCoefficients[m.key]}
                      onChange={(e) => handleChange(m.key, parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-right text-xs"
                    />
                  </div>
                  <Slider
                    value={[localCoefficients[m.key]]}
                    onValueChange={(v) => handleSliderChange(m.key, v)}
                    max={25}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {!isValid && (
                  <span className="text-sm text-destructive">
                    Le total doit être égal à 100%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Répartition égale
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || !isValid || isLoading}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
