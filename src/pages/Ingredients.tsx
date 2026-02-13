import { useState } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ingredientSchema, getValidationError } from "@/lib/validations";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useIngredients } from "@/hooks/useIngredients";
import { useProject } from "@/contexts/ProjectContext";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Ingredients = () => {
  const { currentProject } = useProject();
  const { ingredients, isLoading, addIngredient, updateIngredient, deleteIngredient } = useIngredients();
  const { settings } = useProjectSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom_ingredient: "",
    cout_unitaire: "",
    unite: "kg",
    fournisseur: "",
    tva_taux: "",
  });

  const filteredIngredients = ingredients.filter((ing) =>
    ing.nom_ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ nom_ingredient: "", cout_unitaire: "", unite: "kg", fournisseur: "", tva_taux: "" });
    setEditingId(null);
  };

  const handleSubmit = () => {
    const tvaValue = formData.tva_taux !== "" ? parseFloat(formData.tva_taux) : (settings?.tva_achat ?? 21);
    const data = {
      nom_ingredient: formData.nom_ingredient.trim(),
      cout_unitaire: parseFloat(formData.cout_unitaire) || 0,
      unite: formData.unite.trim(),
      fournisseur: formData.fournisseur?.trim() || null,
      tva_taux: tvaValue,
    };

    const error = getValidationError(ingredientSchema, data);
    if (error) {
      toast.error(error);
      return;
    }

    if (editingId) {
      updateIngredient.mutate({ id: editingId, ...data });
    } else {
      addIngredient.mutate(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (ingredient: typeof ingredients[0]) => {
    setFormData({
      nom_ingredient: ingredient.nom_ingredient,
      cout_unitaire: ingredient.cout_unitaire.toString(),
      unite: ingredient.unite,
      fournisseur: ingredient.fournisseur || "",
      tva_taux: ingredient.tva_taux != null ? ingredient.tva_taux.toString() : "",
    });
    setEditingId(ingredient.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteIngredient.mutate(id);
  };

  if (!currentProject) {
    return (
      <AppLayout title="Ingrédients" subtitle="Sélectionnez un projet pour voir les ingrédients">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Veuillez d'abord créer ou sélectionner un projet.</p>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Ingrédients"
      subtitle="Gérez vos matières premières et leurs coûts"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un ingrédient..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un ingrédient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="ingredientName">Nom de l'ingrédient</Label>
                <Input
                  id="ingredientName"
                  placeholder="Ex: Tomates pelées bio"
                  value={formData.nom_ingredient}
                  onChange={(e) => setFormData({ ...formData, nom_ingredient: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix unitaire (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cout_unitaire}
                    onChange={(e) => setFormData({ ...formData, cout_unitaire: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <Input
                    id="unit"
                    placeholder="Ex: kg, L, pièce"
                    value={formData.unite}
                    onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur (optionnel)</Label>
                <Input
                  id="supplier"
                  placeholder="Ex: Coopérative Bio Sud"
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tvaTaux">Taux TVA (%)</Label>
                <Select
                  value={formData.tva_taux || (settings?.tva_achat ?? 21).toString()}
                  onValueChange={(value) => setFormData({ ...formData, tva_taux: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% - Exonéré</SelectItem>
                    <SelectItem value={(settings?.tva_reduit_2 ?? 6).toString()}>
                      {settings?.tva_reduit_2 ?? 6}% - Réduit (produits de base)
                    </SelectItem>
                    <SelectItem value={(settings?.tva_reduit_1 ?? 12).toString()}>
                      {settings?.tva_reduit_1 ?? 12}% - Réduit (transformés)
                    </SelectItem>
                    <SelectItem value={(settings?.tva_standard ?? 21).toString()}>
                      {settings?.tva_standard ?? 21}% - Standard
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={addIngredient.isPending || updateIngredient.isPending}
              >
                {(addIngredient.isPending || updateIngredient.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingId ? "Mettre à jour" : "Ajouter l'ingrédient"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "Aucun ingrédient trouvé" : "Aucun ingrédient. Ajoutez-en un !"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrédient</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.nom_ingredient}</TableCell>
                  <TableCell className="text-right">
                    {Number(ingredient.cout_unitaire).toFixed(2)} €
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ingredient.unite}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ingredient.fournisseur || "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(ingredient)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(ingredient.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </AppLayout>
  );
};

export default Ingredients;
