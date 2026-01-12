import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TVASummary } from "@/hooks/useTVA";

interface TVADetailTableProps {
  summary: TVASummary;
}

export function TVADetailTable({ summary }: TVADetailTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* TVA Collectée */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail TVA Collectée</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.detailCollectee.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune vente enregistrée
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">CA HT</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.detailCollectee.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.produit}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.ca_ht)}
                    </TableCell>
                    <TableCell className="text-right">{item.taux_tva}%</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.tva)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold" colSpan={3}>
                    Total TVA Collectée
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(summary.tvaCollectee)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* TVA Déductible */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail TVA Déductible</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.detailDeductible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun achat enregistré
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.detailDeductible.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.nom}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {item.type === "ingredient"
                        ? "Ingrédient"
                        : item.type === "packaging"
                        ? "Emballage"
                        : "Charge"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.montant_ht)}
                    </TableCell>
                    <TableCell className="text-right">{item.taux_tva}%</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(item.tva)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold" colSpan={4}>
                    Total TVA Déductible
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    {formatCurrency(summary.tvaDeductible)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
