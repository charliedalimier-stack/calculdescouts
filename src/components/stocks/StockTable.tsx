import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Pencil, Trash2 } from "lucide-react";
import { Stock } from "@/hooks/useStocks";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StockMovementDialog } from "./StockMovementDialog";

interface StockTableProps {
  stocks: Stock[];
  title: string;
  type: "ingredient" | "packaging" | "product";
  onAddMovement: (
    stockId: string,
    type: "entree" | "sortie",
    quantite: number,
    motif?: string
  ) => void;
  onUpdate: (id: string, data: Partial<Stock>) => void;
  onDelete: (id: string) => void;
}

export function StockTable({
  stocks,
  title,
  type,
  onAddMovement,
  onUpdate,
  onDelete,
}: StockTableProps) {
  const [movementDialog, setMovementDialog] = useState<{
    open: boolean;
    stock: Stock | null;
    type: "entree" | "sortie";
  }>({ open: false, stock: null, type: "entree" });

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    stock: Stock | null;
  }>({ open: false, stock: null });
  const [editData, setEditData] = useState({
    quantite: 0,
    cout_unitaire: 0,
    seuil_alerte: 0,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const getStockName = (stock: Stock): string => {
    if (stock.ingredient) return stock.ingredient.nom_ingredient;
    if (stock.packaging) return stock.packaging.nom;
    if (stock.product) return stock.product.nom_produit;
    return "N/A";
  };

  const getStockUnit = (stock: Stock): string => {
    if (stock.ingredient) return stock.ingredient.unite;
    if (stock.packaging) return stock.packaging.unite;
    if (stock.product) return stock.product.unite_vente;
    return "unité";
  };

  const getStockStatus = (stock: Stock) => {
    if (stock.quantite <= 0) return "rupture";
    if (stock.seuil_alerte && stock.quantite <= stock.seuil_alerte) return "alerte";
    return "normal";
  };

  const handleMovementSubmit = (data: { quantite: number; motif: string }) => {
    if (!movementDialog.stock) return;
    onAddMovement(movementDialog.stock.id, movementDialog.type, data.quantite, data.motif);
    setMovementDialog({ open: false, stock: null, type: "entree" });
  };

  const handleEditSubmit = () => {
    if (!editDialog.stock) return;
    onUpdate(editDialog.stock.id, editData);
    setEditDialog({ open: false, stock: null });
  };

  const openEditDialog = (stock: Stock) => {
    setEditData({
      quantite: stock.quantite,
      cout_unitaire: stock.cout_unitaire,
      seuil_alerte: stock.seuil_alerte || 0,
    });
    setEditDialog({ open: true, stock });
  };

  const openMovementDialog = (stock: Stock, type: "entree" | "sortie") => {
    setMovementDialog({ open: true, stock, type });
  };

  if (stocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Aucun stock de {title.toLowerCase()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Cliquez sur "Ajouter un stock" pour créer un stock initial
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead className="text-right">Coût unitaire</TableHead>
              <TableHead className="text-right">Valeur</TableHead>
              <TableHead className="text-right">Seuil alerte</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const status = getStockStatus(stock);
              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    {getStockName(stock)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {stock.quantite.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStockUnit(stock)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stock.cout_unitaire)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(stock.quantite * stock.cout_unitaire)}
                  </TableCell>
                  <TableCell className="text-right">
                    {stock.seuil_alerte ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        status === "rupture"
                          ? "destructive"
                          : status === "alerte"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {status === "rupture"
                        ? "Rupture"
                        : status === "alerte"
                        ? "Alerte"
                        : "OK"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openMovementDialog(stock, "entree")}
                        title="Entrée de stock"
                      >
                        <Plus className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openMovementDialog(stock, "sortie")}
                        title="Sortie de stock"
                      >
                        <Minus className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(stock)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(stock.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Movement Dialog */}
      {movementDialog.stock && (
        <StockMovementDialog
          open={movementDialog.open}
          onOpenChange={(open) => !open && setMovementDialog({ open: false, stock: null, type: "entree" })}
          type={movementDialog.type}
          stockName={getStockName(movementDialog.stock)}
          stockUnit={getStockUnit(movementDialog.stock)}
          onSubmit={handleMovementSubmit}
        />
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.quantite}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    quantite: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Coût unitaire (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.cout_unitaire}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    cout_unitaire: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Seuil d'alerte</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.seuil_alerte}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    seuil_alerte: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, stock: null })}
            >
              Annuler
            </Button>
            <Button onClick={handleEditSubmit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
