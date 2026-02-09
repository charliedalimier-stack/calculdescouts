import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Target } from "lucide-react";
import { SimulationScenario } from "@/hooks/useFinancialSimulation";

interface FinancialSimulationTableProps {
  scenarios: SimulationScenario[];
}

const formatValue = (value: number): string => {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const rows: { key: keyof SimulationScenario; label: string; isBold?: boolean }[] = [
  { key: "revenu_net_cible", label: "Revenu net cible", isBold: true },
  { key: "ca", label: "Chiffre d'affaires nécessaire (HTVA)", isBold: true },
  { key: "achats_marchandises", label: "Achat marchandises" },
  { key: "charges_professionnelles", label: "Charges professionnelles" },
  { key: "revenu_brut", label: "Revenus professionnels bruts", isBold: true },
  { key: "cotisations_sociales", label: "Cotisations sociales" },
  { key: "impot_total", label: "Impôts" },
  { key: "resultat_net", label: "Résultat net", isBold: true },
];

export function FinancialSimulationTable({ scenarios }: FinancialSimulationTableProps) {
  if (scenarios.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Simulation des niveaux de chiffre d'affaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Libellé</TableHead>
                {scenarios.map((s, i) => (
                  <TableHead key={i} className="text-right min-w-[150px]">
                    {s.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className={row.isBold ? "font-semibold" : ""}>
                    {row.label}
                  </TableCell>
                  {scenarios.map((s, i) => {
                    const value = s[row.key] as number | null;
                    if (value === null) {
                      return (
                        <TableCell key={i} className="text-right text-muted-foreground">
                          –
                        </TableCell>
                      );
                    }
                    const isNegative = value < 0;
                    return (
                      <TableCell
                        key={i}
                        className={`text-right ${row.isBold ? "font-semibold" : ""} ${
                          row.key === "resultat_net" && isNegative ? "text-destructive" : ""
                        } ${row.key === "resultat_net" && !isNegative ? "text-green-600" : ""}`}
                      >
                        {formatValue(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          💡 Le seuil de rentabilité correspond à un résultat net = 0 €. Les scénarios Viabilité et Revenu idéal partent du revenu net cible défini dans les Paramètres et calculent le CA nécessaire par itération.
        </p>
      </CardContent>
    </Card>
  );
}
