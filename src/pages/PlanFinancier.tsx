import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet } from "lucide-react";

interface FinancialPlanRow {
  label: string;
  isHeader?: boolean;
  isBold?: boolean;
}

const financialPlanRows: FinancialPlanRow[] = [
  { label: "CA total", isBold: true },
  { label: "Achat marchandises total" },
  { label: "Coefficient (CA / Achat marchandises)", isBold: true },
  { label: "Bénéfice brut d'exploitation", isBold: true },
  { label: "Charges professionnelles", isHeader: true },
  { label: "Total charges professionnelles" },
  { label: "Résultat indépendant", isBold: true },
  { label: "Revenu brut" },
  { label: "Cotisations sociales" },
  { label: "Bénéfice net d'exploitation", isBold: true },
  { label: "Impôts" },
  { label: "Bénéfice de l'exercice", isBold: true },
  { label: "Rémunération annuelle", isBold: true },
  { label: "Rémunération mensuelle" },
];

const formatValue = (value: number | null): string => {
  if (value === null) return "–";
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCoefficient = (value: number | null): string => {
  if (value === null) return "–";
  return value.toFixed(2);
};

const PlanFinancier = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dataMode, setDataMode] = useState<DataMode>("budget");

  // Placeholder data - all zeros for now
  const getData = (rowLabel: string, _yearOffset: number, _mode: "budget" | "reel"): number | null => {
    // Return 0 for all values as placeholder
    if (rowLabel === "Charges professionnelles") return null; // Header row
    return 0;
  };

  const getDifference = (rowLabel: string, yearOffset: number): number | null => {
    if (rowLabel === "Charges professionnelles") return null;
    const budget = getData(rowLabel, yearOffset, "budget");
    const reel = getData(rowLabel, yearOffset, "reel");
    if (budget === null || reel === null) return null;
    return reel - budget;
  };

  const isCoefficient = (label: string) => label.includes("Coefficient");

  const handlePeriodChange = (params: { month?: number; year: number; mode: DataMode }) => {
    setSelectedYear(params.year);
    setDataMode(params.mode);
  };

  return (
    <AppLayout title="Plan financier" subtitle="Vision consolidée sur 2 ans avec comparaison Budget / Réel">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
          <PeriodSelector
            year={selectedYear}
            mode={dataMode}
            showMonth={false}
            onChange={handlePeriodChange}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Plan financier prévisionnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Libellé</TableHead>
                    <TableHead className="text-right bg-muted/30" colSpan={3}>
                      Année {selectedYear} (N)
                    </TableHead>
                    <TableHead className="text-right bg-muted/50" colSpan={3}>
                      Année {selectedYear + 1} (N+1)
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead className="text-right text-xs bg-muted/30">Budget</TableHead>
                    <TableHead className="text-right text-xs bg-muted/30">Réel</TableHead>
                    <TableHead className="text-right text-xs bg-muted/30">Écart</TableHead>
                    <TableHead className="text-right text-xs bg-muted/50">Budget</TableHead>
                    <TableHead className="text-right text-xs bg-muted/50">Réel</TableHead>
                    <TableHead className="text-right text-xs bg-muted/50">Écart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialPlanRows.map((row, index) => {
                    const yearNBudget = getData(row.label, 0, "budget");
                    const yearNReel = getData(row.label, 0, "reel");
                    const yearNDiff = getDifference(row.label, 0);
                    const yearN1Budget = getData(row.label, 1, "budget");
                    const yearN1Reel = getData(row.label, 1, "reel");
                    const yearN1Diff = getDifference(row.label, 1);

                    const formatFn = isCoefficient(row.label) ? formatCoefficient : formatValue;

                    if (row.isHeader) {
                      return (
                        <TableRow key={index} className="bg-muted/20">
                          <TableCell colSpan={7} className="font-semibold text-muted-foreground uppercase text-sm">
                            {row.label}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow key={index}>
                        <TableCell className={row.isBold ? "font-semibold" : ""}>
                          {row.label}
                        </TableCell>
                        <TableCell className="text-right bg-muted/10">
                          {formatFn(yearNBudget)}
                        </TableCell>
                        <TableCell className="text-right bg-muted/10">
                          {formatFn(yearNReel)}
                        </TableCell>
                        <TableCell className={`text-right bg-muted/10 ${
                          yearNDiff !== null && yearNDiff > 0 
                            ? "text-green-600" 
                            : yearNDiff !== null && yearNDiff < 0 
                              ? "text-red-600" 
                              : ""
                        }`}>
                          {yearNDiff !== null ? formatFn(yearNDiff) : "–"}
                        </TableCell>
                        <TableCell className="text-right bg-muted/20">
                          {formatFn(yearN1Budget)}
                        </TableCell>
                        <TableCell className="text-right bg-muted/20">
                          {formatFn(yearN1Reel)}
                        </TableCell>
                        <TableCell className={`text-right bg-muted/20 ${
                          yearN1Diff !== null && yearN1Diff > 0 
                            ? "text-green-600" 
                            : yearN1Diff !== null && yearN1Diff < 0 
                              ? "text-red-600" 
                              : ""
                        }`}>
                          {yearN1Diff !== null ? formatFn(yearN1Diff) : "–"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 Les données seront calculées automatiquement à partir des ventes, achats et charges professionnelles enregistrés.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PlanFinancier;
