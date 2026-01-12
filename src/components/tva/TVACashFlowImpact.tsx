import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthlyTVA } from "@/hooks/useTVA";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface TVACashFlowImpactProps {
  data: MonthlyTVA[];
}

export function TVACashFlowImpact({ data }: TVACashFlowImpactProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact TVA sur la Trésorerie</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  const totals = data.reduce(
    (acc, d) => ({
      tvaCollectee: acc.tvaCollectee + d.tvaCollectee,
      tvaDeductible: acc.tvaDeductible + d.tvaDeductible,
      tvaNette: acc.tvaNette + d.tvaNette,
      resultatEconomique: acc.resultatEconomique + d.resultatEconomique,
      resultatTresorerie: acc.resultatTresorerie + d.resultatTresorerie,
    }),
    {
      tvaCollectee: 0,
      tvaDeductible: 0,
      tvaNette: 0,
      resultatEconomique: 0,
      resultatTresorerie: 0,
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultat Économique vs Trésorerie</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead className="text-right">TVA Collectée</TableHead>
              <TableHead className="text-right">TVA Déductible</TableHead>
              <TableHead className="text-right">TVA Nette</TableHead>
              <TableHead className="text-right">Résultat Économique</TableHead>
              <TableHead className="text-right">Résultat Trésorerie</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.mois}>
                <TableCell className="font-medium">
                  {format(parseISO(row.mois), "MMMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(row.tvaCollectee)}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {formatCurrency(row.tvaDeductible)}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    row.tvaNette >= 0 ? "text-amber-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(row.tvaNette)}
                </TableCell>
                <TableCell
                  className={`text-right ${
                    row.resultatEconomique >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(row.resultatEconomique)}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    row.resultatTresorerie >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(row.resultatTresorerie)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.tvaNette >= 0 ? "secondary" : "default"
                    }
                  >
                    {row.tvaNette >= 0 ? "À reverser" : "Crédit"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrency(totals.tvaCollectee)}
              </TableCell>
              <TableCell className="text-right text-blue-600">
                {formatCurrency(totals.tvaDeductible)}
              </TableCell>
              <TableCell
                className={`text-right ${
                  totals.tvaNette >= 0 ? "text-amber-600" : "text-green-600"
                }`}
              >
                {formatCurrency(totals.tvaNette)}
              </TableCell>
              <TableCell
                className={`text-right ${
                  totals.resultatEconomique >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totals.resultatEconomique)}
              </TableCell>
              <TableCell
                className={`text-right ${
                  totals.resultatTresorerie >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totals.resultatTresorerie)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>

        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
          <h4 className="font-semibold mb-2">💡 Comprendre la différence</h4>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>
              <strong>Résultat économique :</strong> Encaissements - Décaissements
              (hors TVA)
            </p>
            <p>
              <strong>Résultat trésorerie :</strong> Résultat économique + Impact
              TVA (inclut les flux de TVA réels)
            </p>
            <p className="mt-2">
              La TVA collectée augmente temporairement la trésorerie mais doit être
              reversée. La TVA déductible représente un décaissement initial mais
              est récupérable.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
