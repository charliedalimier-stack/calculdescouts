import { useState } from "react";
import { Plus, ChefHat, Calculator, Clock, Package, Apple } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface RecipePackaging {
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface Recipe {
  id: string;
  productName: string;
  category: string;
  batchSize: number;
  batchUnit: string;
  ingredients: RecipeIngredient[];
  packaging: RecipePackaging[];
  productionTime: number; // minutes
  laborCostPerHour: number;
  energyCost: number;
  otherCosts: number;
  totalIngredientsCost: number;
  totalPackagingCost: number;
  totalProductionCost: number;
  unitCost: number;
  sellingPrice: number;
  margin: number;
}

const mockRecipes: Recipe[] = [
  {
    id: "1",
    productName: "Sauce tomate bio",
    category: "Sauces",
    batchSize: 20,
    batchUnit: "pots",
    ingredients: [
      { name: "Tomates pelées bio", quantity: 5, unit: "kg", unitCost: 2.80, totalCost: 14.00 },
      { name: "Huile d'olive", quantity: 0.5, unit: "L", unitCost: 12.00, totalCost: 6.00 },
      { name: "Ail bio", quantity: 0.1, unit: "kg", unitCost: 8.00, totalCost: 0.80 },
      { name: "Basilic frais", quantity: 0.05, unit: "kg", unitCost: 15.00, totalCost: 0.75 },
    ],
    packaging: [
      { name: "Pot verre 250g", quantity: 20, unitCost: 0.45, totalCost: 9.00 },
      { name: "Couvercle métal", quantity: 20, unitCost: 0.12, totalCost: 2.40 },
      { name: "Étiquette", quantity: 20, unitCost: 0.08, totalCost: 1.60 },
    ],
    productionTime: 90,
    laborCostPerHour: 15,
    energyCost: 3.50,
    otherCosts: 2.00,
    totalIngredientsCost: 21.55,
    totalPackagingCost: 13.00,
    totalProductionCost: 48.55,
    unitCost: 2.43,
    sellingPrice: 5.50,
    margin: 55.8,
  },
  {
    id: "2",
    productName: "Pesto basilic",
    category: "Sauces",
    batchSize: 15,
    batchUnit: "pots",
    ingredients: [
      { name: "Basilic frais", quantity: 0.3, unit: "kg", unitCost: 15.00, totalCost: 4.50 },
      { name: "Pignons de pin", quantity: 0.15, unit: "kg", unitCost: 45.00, totalCost: 6.75 },
      { name: "Parmesan AOP", quantity: 0.2, unit: "kg", unitCost: 28.00, totalCost: 5.60 },
      { name: "Huile d'olive", quantity: 0.4, unit: "L", unitCost: 12.00, totalCost: 4.80 },
      { name: "Ail bio", quantity: 0.05, unit: "kg", unitCost: 8.00, totalCost: 0.40 },
    ],
    packaging: [
      { name: "Pot verre 180g", quantity: 15, unitCost: 0.38, totalCost: 5.70 },
      { name: "Couvercle métal", quantity: 15, unitCost: 0.12, totalCost: 1.80 },
      { name: "Étiquette", quantity: 15, unitCost: 0.08, totalCost: 1.20 },
    ],
    productionTime: 60,
    laborCostPerHour: 15,
    energyCost: 2.00,
    otherCosts: 1.00,
    totalIngredientsCost: 22.05,
    totalPackagingCost: 8.70,
    totalProductionCost: 48.75,
    unitCost: 3.25,
    sellingPrice: 7.50,
    margin: 56.7,
  },
];

const getMarginColor = (margin: number) => {
  if (margin >= 50) return "bg-primary";
  if (margin >= 35) return "bg-chart-4";
  return "bg-destructive";
};

const Recipes = () => {
  const [recipes] = useState<Recipe[]>(mockRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AppLayout
      title="Recettes"
      subtitle="Gérez vos recettes et calculez les coûts de production"
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recipes.length} recette{recipes.length > 1 ? "s" : ""} configurée{recipes.length > 1 ? "s" : ""}
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle recette
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle recette</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Produit associé</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sauce">Sauce tomate bio</SelectItem>
                      <SelectItem value="confiture">Confiture de fraise</SelectItem>
                      <SelectItem value="pesto">Pesto basilic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taille du lot</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="20" className="flex-1" />
                    <Input placeholder="pots" className="w-24" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Après création, vous pourrez ajouter les ingrédients, emballages et coûts de production.
              </p>
              <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                Créer la recette
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recipe Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {recipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setSelectedRecipe(recipe)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <ChefHat className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{recipe.productName}</CardTitle>
                    <Badge variant="outline" className="mt-1">{recipe.category}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{recipe.margin.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">marge brute</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Rentabilité</span>
                  <span className="font-medium">{recipe.margin.toFixed(1)}%</span>
                </div>
                <Progress value={recipe.margin} className={getMarginColor(recipe.margin)} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calculator className="h-4 w-4" />
                    <span>Coût unitaire</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold">{recipe.unitCost.toFixed(2)} €</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Temps prod.</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold">{recipe.productionTime} min</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Apple className="h-3 w-3" />
                  {recipe.ingredients.length} ingrédients
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {recipe.packaging.length} emballages
                </span>
                <span>Lot: {recipe.batchSize} {recipe.batchUnit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Detail Dialog */}
      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <ChefHat className="h-5 w-5 text-primary" />
                {selectedRecipe.productName}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 pt-4 lg:grid-cols-2">
              {/* Ingredients */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Apple className="h-4 w-4 text-primary" />
                  Ingrédients
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrédient</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Coût</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecipe.ingredients.map((ing, index) => (
                      <TableRow key={index}>
                        <TableCell>{ing.name}</TableCell>
                        <TableCell className="text-right">
                          {ing.quantity} {ing.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {ing.totalCost.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total ingrédients</TableCell>
                      <TableCell className="text-right">
                        {selectedRecipe.totalIngredientsCost.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Packaging */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  Emballages
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emballage</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Coût</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecipe.packaging.map((pack, index) => (
                      <TableRow key={index}>
                        <TableCell>{pack.name}</TableCell>
                        <TableCell className="text-right">{pack.quantity}</TableCell>
                        <TableCell className="text-right">
                          {pack.totalCost.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total emballages</TableCell>
                      <TableCell className="text-right">
                        {selectedRecipe.totalPackagingCost.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="mt-6 rounded-lg border border-border bg-accent/50 p-4">
              <h4 className="mb-4 font-semibold">Récapitulatif des coûts (lot de {selectedRecipe.batchSize} {selectedRecipe.batchUnit})</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Matières premières</p>
                  <p className="text-lg font-semibold">{selectedRecipe.totalIngredientsCost.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emballages</p>
                  <p className="text-lg font-semibold">{selectedRecipe.totalPackagingCost.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Main d'œuvre</p>
                  <p className="text-lg font-semibold">
                    {((selectedRecipe.productionTime / 60) * selectedRecipe.laborCostPerHour).toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Autres coûts</p>
                  <p className="text-lg font-semibold">
                    {(selectedRecipe.energyCost + selectedRecipe.otherCosts).toFixed(2)} €
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <div className="rounded-lg bg-background p-3">
                  <p className="text-sm text-muted-foreground">Coût total lot</p>
                  <p className="text-xl font-bold">{selectedRecipe.totalProductionCost.toFixed(2)} €</p>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <p className="text-sm text-muted-foreground">Coût unitaire</p>
                  <p className="text-xl font-bold">{selectedRecipe.unitCost.toFixed(2)} €</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-sm text-muted-foreground">Marge brute</p>
                  <p className="text-xl font-bold text-primary">{selectedRecipe.margin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

export default Recipes;
