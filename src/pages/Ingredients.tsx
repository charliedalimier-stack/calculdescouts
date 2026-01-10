import { useState } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react";
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

interface Ingredient {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
  supplier?: string;
  stock?: number;
}

const initialIngredients: Ingredient[] = [
  { id: "1", name: "Tomates pelées bio", pricePerUnit: 2.80, unit: "kg", supplier: "Coopérative Bio Sud", stock: 50 },
  { id: "2", name: "Fraises fraîches", pricePerUnit: 6.50, unit: "kg", supplier: "Ferme des Fruits", stock: 25 },
  { id: "3", name: "Basilic frais", pricePerUnit: 15.00, unit: "kg", supplier: "Herbes de Provence", stock: 5 },
  { id: "4", name: "Huile d'olive", pricePerUnit: 12.00, unit: "L", supplier: "Moulin du Var", stock: 20 },
  { id: "5", name: "Sucre de canne", pricePerUnit: 1.80, unit: "kg", supplier: "Sucre Bio", stock: 100 },
  { id: "6", name: "Pignons de pin", pricePerUnit: 45.00, unit: "kg", supplier: "Fruits Secs Premium", stock: 3 },
  { id: "7", name: "Ail bio", pricePerUnit: 8.00, unit: "kg", supplier: "Coopérative Bio Sud", stock: 10 },
  { id: "8", name: "Parmesan AOP", pricePerUnit: 28.00, unit: "kg", supplier: "Italia Import", stock: 8 },
];

const Ingredients = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un ingrédient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un ingrédient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="ingredientName">Nom de l'ingrédient</Label>
                <Input id="ingredientName" placeholder="Ex: Tomates pelées bio" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix unitaire (€)</Label>
                  <Input id="price" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <Input id="unit" placeholder="Ex: kg, L, pièce" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur (optionnel)</Label>
                <Input id="supplier" placeholder="Ex: Coopérative Bio Sud" />
              </div>
              <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                Ajouter l'ingrédient
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrédient</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell className="font-medium">{ingredient.name}</TableCell>
                <TableCell className="text-right">
                  {ingredient.pricePerUnit.toFixed(2)} €
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ingredient.unit}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ingredient.supplier || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {ingredient.stock !== undefined ? (
                    <span className={ingredient.stock < 10 ? "text-destructive font-medium" : ""}>
                      {ingredient.stock} {ingredient.unit}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteIngredient(ingredient.id)}
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
      </Card>
    </AppLayout>
  );
};

export default Ingredients;
