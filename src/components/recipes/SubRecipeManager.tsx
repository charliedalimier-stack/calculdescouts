import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Plus, Trash2, Link2 } from "lucide-react";
import { SubRecipe, useSubRecipes } from "@/hooks/useSubRecipes";

interface SubRecipeManagerProps {
  onSelectSubRecipe?: (subRecipe: SubRecipe) => void;
}

export function SubRecipeManager({ onSelectSubRecipe }: SubRecipeManagerProps) {
  const {
    subRecipes,
    productsWithRecipes,
    isLoading,
    convertToSubRecipe,
    updateSubRecipeCost,
    updateAllSubRecipesCosts,
    removeSubRecipe,
  } = useSubRecipes();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("kg");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const handleCreate = () => {
    if (!selectedProductId) return;
    convertToSubRecipe.mutate(
      { productId: selectedProductId, unite: selectedUnit },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setSelectedProductId("");
        },
      }
    );
  };

  // Filter products that are not already sub-recipes
  const availableProducts = productsWithRecipes.filter(
    (p) => !subRecipes.some((sr) => sr.product_id === p.id)
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sous-recettes disponibles</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateAllSubRecipesCosts.mutate()}
              disabled={updateAllSubRecipesCosts.isPending}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  updateAllSubRecipesCosts.isPending ? "animate-spin" : ""
                }`}
              />
              Recalculer tous les coûts
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer sous-recette
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : subRecipes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                Aucune sous-recette créée. Transformez un produit avec recette en
                sous-recette pour l'utiliser comme ingrédient.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Produit source</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="text-right">Coût de revient</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subRecipes.map((sr) => (
                  <TableRow key={sr.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          SR
                        </Badge>
                        {sr.nom_ingredient}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        {sr.nom_produit}
                      </div>
                    </TableCell>
                    <TableCell>{sr.unite}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(sr.cout_revient)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {onSelectSubRecipe && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectSubRecipe(sr)}
                          >
                            Utiliser
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateSubRecipeCost.mutate(sr.ingredient_id)
                          }
                          title="Recalculer le coût"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubRecipe.mutate(sr.ingredient_id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une sous-recette</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produit à transformer</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nom_produit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableProducts.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun produit disponible. Créez d'abord un produit avec une
                  recette.
                </p>
              )}
            </div>

            <div>
              <Label>Unité de mesure</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="mL">mL</SelectItem>
                  <SelectItem value="unité">unité</SelectItem>
                  <SelectItem value="pièce">pièce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">💡 Fonctionnement des sous-recettes</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Le produit devient un ingrédient utilisable</li>
                <li>• Son coût est calculé à partir de sa recette</li>
                <li>• Les modifications se propagent automatiquement</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedProductId || convertToSubRecipe.isPending}
            >
              Créer la sous-recette
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
