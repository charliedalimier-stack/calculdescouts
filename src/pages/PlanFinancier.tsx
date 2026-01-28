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
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useFinancialPlan, FinancialPlanData, FiscalParams } from "@/hooks/useFinancialPlan";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { useTaxBrackets } from "@/hooks/useTaxBrackets";
import { EXPENSE_CATEGORIES } from "@/hooks/useExpenses";
import { FinancialStressTest } from "@/components/financial/FinancialStressTest";

interface FinancialPlanRow {
  key: string;
  label: string;
  isHeader?: boolean;
  isBold?: boolean;
  isExpenseCategory?: boolean;
  isMuted?: boolean;
}

const getFinancialPlanRows = (chargeCategories: string[]): FinancialPlanRow[] => {
  const baseRows: FinancialPlanRow[] = [
    { key: "ca_total", label: "CA total", isBold: true },
    { key: "achats_marchandises", label: "Achat marchandises total" },
    { key: "coefficient", label: "Coefficient (CA / Achat marchandises)", isBold: true },
    { key: "benefice_brut", label: "Bénéfice brut d'exploitation", isBold: true },
    { key: "charges_header", label: "Charges professionnelles", isHeader: true },
  ];

  // Add expense categories dynamically
  chargeCategories.forEach(cat => {
    const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === cat)?.label || cat;
    baseRows.push({ 
      key: `charge_${cat}`, 
      label: `  ${categoryLabel}`,
      isExpenseCategory: true 
    });
  });

  baseRows.push(
    { key: "total_charges", label: "Total charges professionnelles", isBold: true, isMuted: true },
    { key: "revenu_brut", label: "Revenu brut", isBold: true },
    { key: "cotisations_sociales", label: "Cotisations sociales" },
    { key: "benefice_net", label: "Bénéfice net avant impôts", isBold: true },
    { key: "impots_header", label: "Calcul de l'impôt", isHeader: true },
    { key: "quotite_exemptee", label: "  Quotité exemptée" },
    { key: "base_imposable", label: "  Base imposable" },
    { key: "impot_base", label: "  Impôt de base (par tranches)" },
    { key: "impot_communal", label: "  Additionnel communal" },
    { key: "impot_total", label: "Impôt total", isBold: true },
    { key: "benefice_exercice", label: "Bénéfice de l'exercice", isBold: true },
    { key: "remuneration_annuelle", label: "Rémunération annuelle", isBold: true },
    { key: "remuneration_mensuelle", label: "Rémunération mensuelle" },
  );

  return baseRows;
};

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

const getRowValue = (
  key: string,
  data: FinancialPlanData
): number | null => {
  switch (key) {
    case "ca_total":
      return data.ca_total;
    case "achats_marchandises":
      return data.achats_marchandises;
    case "coefficient":
      return data.coefficient;
    case "benefice_brut":
      return data.benefice_brut;
    case "total_charges":
      return data.charges_professionnelles.total;
    case "resultat_independant":
      return data.resultat_independant;
    case "revenu_brut":
      return data.revenu_brut;
    case "cotisations_sociales":
      return data.cotisations_sociales;
    case "benefice_net":
      return data.benefice_net_avant_impots;
    case "quotite_exemptee":
      return data.quotite_exemptee;
    case "base_imposable":
      return data.base_imposable;
    case "impot_base":
      return data.impot_base;
    case "impot_communal":
      return data.impot_communal;
    case "impot_total":
      return data.impot_total;
    case "benefice_exercice":
      return data.benefice_exercice;
    case "remuneration_annuelle":
      return data.remuneration_annuelle;
    case "remuneration_mensuelle":
      return data.remuneration_mensuelle;
    default:
      // Check if it's an expense category
      if (key.startsWith("charge_")) {
        const cat = key.replace("charge_", "");
        return data.charges_professionnelles.by_category[cat] || 0;
      }
      return null;
  }
};

const PlanFinancier = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dataMode, setDataMode] = useState<DataMode>("budget");
  
  const { settings } = useProjectSettings();
  const { brackets } = useTaxBrackets();
  
  // Build fiscal params from settings
  const fiscalParams: FiscalParams = {
    tauxCotisationsSociales: settings?.taux_cotisations_sociales ?? 20.5,
    tauxCommunal: settings?.taux_communal ?? 7.0,
    nombreEnfantsCharge: settings?.nombre_enfants_charge ?? 0,
    quotiteExempteeBase: settings?.quotite_exemptee_base ?? 10570,
    majorationParEnfant: settings?.majoration_par_enfant ?? 1850,
    taxBrackets: brackets.map(b => ({
      tranche_min: b.tranche_min,
      tranche_max: b.tranche_max,
      taux: b.taux,
      ordre: b.ordre,
    })),
  };

  const { data: planData, isLoading } = useFinancialPlan(selectedYear, fiscalParams);

  const handlePeriodChange = (params: { month?: number; year: number; mode: DataMode }) => {
    setSelectedYear(params.year);
    setDataMode(params.mode);
  };

  // Collect all unique expense categories from both years
  const allCategories = new Set<string>();
  if (planData) {
    Object.keys(planData.yearN.budget.charges_professionnelles.by_category).forEach(c => allCategories.add(c));
    Object.keys(planData.yearN.reel.charges_professionnelles.by_category).forEach(c => allCategories.add(c));
    Object.keys(planData.yearN1.budget.charges_professionnelles.by_category).forEach(c => allCategories.add(c));
    Object.keys(planData.yearN1.reel.charges_professionnelles.by_category).forEach(c => allCategories.add(c));
  }

  const financialPlanRows = getFinancialPlanRows(Array.from(allCategories));

  const isCoefficient = (key: string) => key === "coefficient";

  const getDifference = (budget: number | null, reel: number | null): number | null => {
    if (budget === null || reel === null) return null;
    return reel - budget;
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

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
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
                      if (row.isHeader) {
                        return (
                          <TableRow key={index} className="bg-muted/20">
                            <TableCell colSpan={7} className="font-semibold text-muted-foreground uppercase text-sm">
                              {row.label}
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const yearNBudget = planData ? getRowValue(row.key, planData.yearN.budget) : 0;
                      const yearNReel = planData ? getRowValue(row.key, planData.yearN.reel) : 0;
                      const yearNDiff = getDifference(yearNBudget, yearNReel);
                      
                      const yearN1Budget = planData ? getRowValue(row.key, planData.yearN1.budget) : 0;
                      const yearN1Reel = planData ? getRowValue(row.key, planData.yearN1.reel) : 0;
                      const yearN1Diff = getDifference(yearN1Budget, yearN1Reel);

                      const formatFn = isCoefficient(row.key) ? formatCoefficient : formatValue;

                      // For differences, positive is good for revenue items, bad for cost items
                      const isRevenueItem = ["ca_total", "benefice_brut", "resultat_independant", "benefice_net", "benefice_exercice", "remuneration_annuelle", "remuneration_mensuelle", "revenu_brut"].includes(row.key);
                      
                      const getDiffColor = (diff: number | null) => {
                        if (diff === null || diff === 0) return "";
                        if (isRevenueItem) {
                          return diff > 0 ? "text-green-600" : "text-red-600";
                        } else {
                          // For costs, higher real = worse
                          return diff < 0 ? "text-green-600" : "text-red-600";
                        }
                      };

                      return (
                        <TableRow key={index} className={`${row.isExpenseCategory ? "text-muted-foreground" : ""} ${row.isMuted ? "bg-muted/30 text-muted-foreground" : ""}`}>
                          <TableCell className={row.isBold ? "font-semibold" : ""}>
                            {row.label}
                          </TableCell>
                          <TableCell className="text-right bg-muted/10">
                            {formatFn(yearNBudget)}
                          </TableCell>
                          <TableCell className="text-right bg-muted/10">
                            {formatFn(yearNReel)}
                          </TableCell>
                          <TableCell className={`text-right bg-muted/10 ${getDiffColor(yearNDiff)}`}>
                            {yearNDiff !== null ? formatFn(yearNDiff) : "–"}
                          </TableCell>
                          <TableCell className="text-right bg-muted/20">
                            {formatFn(yearN1Budget)}
                          </TableCell>
                          <TableCell className="text-right bg-muted/20">
                            {formatFn(yearN1Reel)}
                          </TableCell>
                          <TableCell className={`text-right bg-muted/20 ${getDiffColor(yearN1Diff)}`}>
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
        )}

        {/* Stress Test Section */}
        {planData && (
          <FinancialStressTest
            baseData={planData.yearN.budget}
            fiscalParams={fiscalParams}
            year={selectedYear}
          />
        )}

        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 Les données sont calculées automatiquement à partir des ventes, achats et charges professionnelles enregistrés.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PlanFinancier;
