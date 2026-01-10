import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const products = [
  { name: "Sauce tomate", rentabilite: 45, volume: 850, quadrant: "star" },
  { name: "Confiture fraise", rentabilite: 38, volume: 620, quadrant: "cashcow" },
  { name: "Pesto basilic", rentabilite: 52, volume: 420, quadrant: "dilemma" },
  { name: "Terrine porc", rentabilite: 18, volume: 280, quadrant: "dog" },
  { name: "Jus pomme", rentabilite: 35, volume: 780, quadrant: "cashcow" },
  { name: "Miel lavande", rentabilite: 48, volume: 350, quadrant: "dilemma" },
  { name: "Rillettes", rentabilite: 22, volume: 150, quadrant: "dog" },
  { name: "Sirop menthe", rentabilite: 42, volume: 520, quadrant: "star" },
];

const getQuadrantColor = (quadrant: string) => {
  switch (quadrant) {
    case "star":
      return "hsl(var(--chart-1))";
    case "cashcow":
      return "hsl(var(--chart-2))";
    case "dilemma":
      return "hsl(var(--chart-4))";
    case "dog":
      return "hsl(var(--destructive))";
    default:
      return "hsl(var(--muted))";
  }
};

export function BCGMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Matrice Produits (BCG)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="rentabilite"
                name="Rentabilité"
                unit="%"
                domain={[0, 60]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "Rentabilité (%)",
                  position: "bottom",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="volume"
                name="Volume"
                domain={[0, 1000]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "Volume ventes",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={30}
                stroke="hsl(var(--border))"
                strokeDasharray="5 5"
              />
              <ReferenceLine
                y={500}
                stroke="hsl(var(--border))"
                strokeDasharray="5 5"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number, name: string) => [
                  name === "rentabilite" ? `${value}%` : value,
                  name === "rentabilite" ? "Rentabilité" : "Volume",
                ]}
                labelFormatter={(_, payload) => payload[0]?.payload?.name || ""}
              />
              <Scatter name="Produits" data={products}>
                {products.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getQuadrantColor(entry.quadrant)}
                    r={8}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span className="text-muted-foreground">⭐ Stars - Développer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span className="text-muted-foreground">💰 Cash Cows - Maintenir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
            <span className="text-muted-foreground">❓ Dilemmes - Décider</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            <span className="text-muted-foreground">🐶 Dogs - Supprimer</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
