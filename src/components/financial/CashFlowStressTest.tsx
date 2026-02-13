import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MonthlyCashFlowData } from "@/hooks/useAutoCashFlow";
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Clock,
  BarChart3,
} from "lucide-react";

interface CashFlowStressTestProps {
  baseData: MonthlyCashFlowData[];
  year: number;
}

interface StressParams {
  baisseVentes: number; // 0 to -50
  retardPaiement: number; // 0 to 90 (jours supplémentaires)
  variationCoefficient: number; // -30 to 0
}

export function CashFlowStressTest({ baseData, year }: CashFlowStressTestProps) {
  const [params, setParams] = useState<StressParams>({
    baisseVentes: 0,
    retardPaiement: 0,
    variationCoefficient: 0,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-BE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  const stressedData = useMemo(() => {
    if (!baseData || baseData.length === 0) return [];

    // Apply stress to each month
    const salesFactor = 1 + params.baisseVentes / 100;
    const coeffFactor = 1 + params.variationCoefficient / 100;
    const delayMonths = Math.floor(params.retardPaiement / 30);

    // First pass: compute stressed encaissements with delay shift
    // Base encaissements per month (before delay stress)
    const baseEncaissements = baseData.map((m) => m.encaissements_ttc);

    // Shift encaissements by additional delay
    const shiftedEncaissements = Array(12).fill(0);
    baseEncaissements.forEach((enc, i) => {
      const targetMonth = i + delayMonths;
      if (targetMonth < 12) {
        shiftedEncaissements[targetMonth] += enc * salesFactor;
      }
      // Revenue beyond Dec is lost for this year's view
    });

    // For months before the delay kicks in, the original encaissements still flow but reduced by sales
    // Actually, let's recalculate properly:
    // - Sales decrease reduces all encaissements
    // - Payment delay shifts encaissements forward
    // - Coefficient change affects production costs (lower coefficient = higher costs relative to CA)

    let cumul = 0;
    let cumulBase = 0;

    return baseData.map((m, i) => {
      // Base cumul
      cumulBase += m.variation_tresorerie;

      // Stressed encaissements: shifted and reduced
      const stressedEncaissements = shiftedEncaissements[i];

      // Stressed decaissements: coefficient impacts cost of goods
      // Lower coefficient = more cost per unit of CA
      // Original: cost = CA / coefficient → new cost = CA * salesFactor / (coefficient * coeffFactor)
      // So cost ratio change = salesFactor / coeffFactor
      const costRatio = coeffFactor > 0 ? salesFactor / coeffFactor : salesFactor;
      const stressedDecaissementsProduction = m.decaissements_production_ttc * costRatio;

      // Frais pro stay the same (fixed costs)
      const stressedFraisPro = m.frais_professionnels_ttc;

      // TVA nette is recalculated proportionally
      const stressedTvaNette = m.tva_nette * salesFactor;

      // Investment flows unchanged
      const investFlow =
        -(m.investissements_sortie + m.investissements_tva) +
        m.financements_entree -
        m.remboursements_pret -
        m.interets_pret;

      const stressedVariation =
        stressedEncaissements -
        stressedDecaissementsProduction -
        stressedFraisPro +
        investFlow -
        stressedTvaNette;

      cumul += stressedVariation;

      return {
        mois: m.monthLabel,
        "Trésorerie base": Math.round(cumulBase),
        "Trésorerie stressée": Math.round(cumul),
      };
    });
  }, [baseData, params]);

  const hasStress =
    params.baisseVentes !== 0 ||
    params.retardPaiement !== 0 ||
    params.variationCoefficient !== 0;

  const stressedFinal = stressedData[stressedData.length - 1]?.["Trésorerie stressée"] ?? 0;
  const baseFinal = stressedData[stressedData.length - 1]?.["Trésorerie base"] ?? 0;
  const hasNegativeStress = stressedData.some((d) => d["Trésorerie stressée"] < 0);
  const firstNegativeMonth = stressedData.find((d) => d["Trésorerie stressée"] < 0)?.mois;

  const allValues = stressedData.flatMap((d) => [
    d["Trésorerie base"],
    d["Trésorerie stressée"],
  ]);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 0);
  const yDomain: [number, number] = [
    Math.floor(minValue * 1.15),
    Math.ceil(maxValue * 1.15),
  ];

  if (!baseData || baseData.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Stress test – Impact sur la trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Aucune donnée de trésorerie disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          Stress test – Impact sur la trésorerie
          <Badge variant="secondary" className="ml-2">
            {year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts */}
        {hasStress && hasNegativeStress && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Trésorerie négative détectée</AlertTitle>
            <AlertDescription>
              Avec ces paramètres, la trésorerie passe en négatif dès{" "}
              <strong>{firstNegativeMonth}</strong>. Un financement de{" "}
              <strong>
                {formatCurrency(
                  Math.abs(
                    Math.min(
                      ...stressedData.map((d) => d["Trésorerie stressée"])
                    )
                  )
                )}
              </strong>{" "}
              serait nécessaire pour couvrir le besoin.
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Baisse ventes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Baisse des ventes
              </Label>
              <Badge
                variant={params.baisseVentes === 0 ? "default" : "destructive"}
                className="min-w-16 justify-center"
              >
                {formatPercent(params.baisseVentes)}
              </Badge>
            </div>
            <Slider
              value={[params.baisseVentes]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, baisseVentes: value }))
              }
              min={-50}
              max={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-50%</span>
              <span>0%</span>
            </div>
          </div>

          {/* Retard paiement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Retard paiement clients
              </Label>
              <Badge
                variant={params.retardPaiement === 0 ? "default" : "destructive"}
                className="min-w-16 justify-center"
              >
                +{params.retardPaiement}j
              </Badge>
            </div>
            <Slider
              value={[params.retardPaiement]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, retardPaiement: value }))
              }
              min={0}
              max={90}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0j</span>
              <span>+90j</span>
            </div>
          </div>

          {/* Variation coefficient */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                Baisse du coefficient
              </Label>
              <Badge
                variant={
                  params.variationCoefficient === 0 ? "default" : "destructive"
                }
                className="min-w-16 justify-center"
              >
                {formatPercent(params.variationCoefficient)}
              </Badge>
            </div>
            <Slider
              value={[params.variationCoefficient]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, variationCoefficient: value }))
              }
              min={-30}
              max={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-30%</span>
              <span>0%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart
            data={stressedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCfBase" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorCfStress" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--destructive))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--destructive))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted))"
            />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              domain={yDomain}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name,
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="Trésorerie base"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCfBase)"
            />
            <Area
              type="monotone"
              dataKey="Trésorerie stressée"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCfStress)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              Trésorerie finale (base)
            </p>
            <p
              className={`text-lg font-semibold ${baseFinal < 0 ? "text-destructive" : ""}`}
            >
              {formatCurrency(baseFinal)}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              Trésorerie finale (stressée)
            </p>
            <p
              className={`text-lg font-semibold ${stressedFinal < 0 ? "text-destructive" : ""}`}
            >
              {formatCurrency(stressedFinal)}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Écart</p>
            <p
              className={`text-lg font-semibold ${stressedFinal - baseFinal < 0 ? "text-destructive" : ""}`}
            >
              {formatCurrency(stressedFinal - baseFinal)}
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground text-center">
          💡 Simulation basée sur le cash-flow {year} • Aucune donnée modifiée
        </div>
      </CardContent>
    </Card>
  );
}
