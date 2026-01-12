import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockMovement } from "@/hooks/useStocks";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StockMovementHistoryProps {
  movements: StockMovement[];
}

export function StockMovementHistory({ movements }: StockMovementHistoryProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const getStockName = (movement: StockMovement): string => {
    if (!movement.stock) return "N/A";
    if (movement.stock.ingredient) return movement.stock.ingredient.nom_ingredient;
    if (movement.stock.packaging) return movement.stock.packaging.nom;
    if (movement.stock.product) return movement.stock.product.nom_produit;
    return "N/A";
  };

  if (movements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Aucun mouvement de stock</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Article</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantité</TableHead>
            <TableHead className="text-right">Coût unitaire</TableHead>
            <TableHead className="text-right">Valeur</TableHead>
            <TableHead>Motif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", {
                  locale: fr,
                })}
              </TableCell>
              <TableCell className="font-medium">
                {getStockName(movement)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    movement.type_mouvement === "entree" ? "default" : "secondary"
                  }
                >
                  {movement.type_mouvement === "entree" ? "Entrée" : "Sortie"}
                </Badge>
              </TableCell>
              <TableCell
                className={`text-right font-mono ${
                  movement.type_mouvement === "entree"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {movement.type_mouvement === "entree" ? "+" : "-"}
                {movement.quantite.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {movement.cout_unitaire
                  ? formatCurrency(movement.cout_unitaire)
                  : "-"}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {movement.cout_unitaire
                  ? formatCurrency(movement.quantite * movement.cout_unitaire)
                  : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {movement.motif || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
