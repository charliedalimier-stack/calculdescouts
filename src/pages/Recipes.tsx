import { useState } from "react";
import { ChefHat, Calculator, Package, Apple, Trash2, Link2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useRecipes } from "@/hooks/useRecipes";
import { useProducts } from "@/hooks/useProducts";
import { useIngredients } from "@/hooks/useIngredients";
import { usePackaging } from "@/hooks/usePackaging";
import { SubRecipeManager } from "@/components/recipes/SubRecipeManager";

const getMarginColor = (margin: number) => {
  if (margin >= 50) return "bg-primary";
  if (margin >= 35) return "bg-chart-4";
  return "bg-destructive";
};

const Recipes = () => {
  const { productsWithCosts, isLoading: isLoadingProducts } = useProducts();
  const { ingredients } = useIngredients();
  const { packaging } = usePackaging();
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [isAddPackagingOpen, setIsAddPackagingOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ product_id: '', ingredient_id: '', quantite_utilisee: 0 });
  const [newPackaging, setNewPackaging] = useState({ product_id: '', packaging_id: '', quantite: 1 });

  // Use the hook for the selected product
  const { 
    recipeIngredients,
    productPackaging: productPackagingItems,
    isLoading: isLoadingRecipes, 
    addRecipeIngredient, 
    removeRecipeIngredient,
    addProductPackaging,
    removeProductPackaging,
  } = useRecipes(selectedProductId || undefined);

  const isLoading = isLoadingProducts;
  const selectedProduct = productsWithCosts.find(p => p.id === selectedProductId);

  const handleAddRecipe = () => {
    if (!newRecipe.product_id || !newRecipe.ingredient_id) return;
    
    addRecipeIngredient.mutate({
      product_id: newRecipe.product_id,
      ingredient_id: newRecipe.ingredient_id,
      quantite_utilisee: newRecipe.quantite_utilisee,
    }, {
      onSuccess: () => {
        setIsAddRecipeOpen(false);
        setNewRecipe({ product_id: '', ingredient_id: '', quantite_utilisee: 0 });
      },
    });
  };

  const handleAddPackaging = () => {
    if (!newPackaging.product_id || !newPackaging.packaging_id) return;
    
    addProductPackaging.mutate({
      product_id: newPackaging.product_id,
      packaging_id: newPackaging.packaging_id,
      quantite: newPackaging.quantite,
    }, {
      onSuccess: () => {
        setIsAddPackagingOpen(false);
        setNewPackaging({ product_id: '', packaging_id: '', quantite: 1 });
      },
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="Recettes" subtitle="Gérez vos recettes et calculez les coûts de production">
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Recettes & Sous-recettes"
      subtitle="Gérez vos recettes, sous-recettes et calculez les coûts de production"
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {productsWithCosts.length} produit{productsWithCosts.length > 1 ? "s" : ""} configuré{productsWithCosts.length > 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <Dialog open={isAddRecipeOpen} onOpenChange={setIsAddRecipeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Apple className="mr-2 h-4 w-4" />
                Ajouter ingrédient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un ingrédient à une recette</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Produit</Label>
                  <Select 
                    value={newRecipe.product_id} 
                    onValueChange={(v) => setNewRecipe({ ...newRecipe, product_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsWithCosts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nom_produit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ingrédient</Label>
                  <Select 
                    value={newRecipe.ingredient_id} 
                    onValueChange={(v) => setNewRecipe({ ...newRecipe, ingredient_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un ingrédient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map(i => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nom_ingredient} ({i.cout_unitaire.toFixed(2)} €/{i.unite})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantité utilisée</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRecipe.quantite_utilisee}
                    onChange={(e) => setNewRecipe({ ...newRecipe, quantite_utilisee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button className="w-full" onClick={handleAddRecipe} disabled={addRecipeIngredient.isPending}>
                  {addRecipeIngredient.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddPackagingOpen} onOpenChange={setIsAddPackagingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Ajouter emballage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un emballage à un produit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Produit</Label>
                  <Select 
                    value={newPackaging.product_id} 
                    onValueChange={(v) => setNewPackaging({ ...newPackaging, product_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsWithCosts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nom_produit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Emballage</Label>
                  <Select 
                    value={newPackaging.packaging_id} 
                    onValueChange={(v) => setNewPackaging({ ...newPackaging, packaging_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un emballage" />
                    </SelectTrigger>
                    <SelectContent>
                      {packaging.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom} ({p.cout_unitaire.toFixed(2)} €/{p.unite})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    value={newPackaging.quantite}
                    onChange={(e) => setNewPackaging({ ...newPackaging, quantite: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <Button className="w-full" onClick={handleAddPackaging} disabled={addProductPackaging.isPending}>
                  {addProductPackaging.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {productsWithCosts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Aucun produit trouvé. Créez des produits pour configurer leurs recettes.
        </div>
      ) : (
        <>
          {/* Product Cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            {productsWithCosts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedProductId === product.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedProductId(product.id === selectedProductId ? null : product.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <ChefHat className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{product.nom_produit}</CardTitle>
                        {product.category_name && (
                          <Badge variant="outline" className="mt-1">{product.category_name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{product.margin.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">marge brute</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Rentabilité</span>
                      <span className="font-medium">{product.margin.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(product.margin, 100)} className={getMarginColor(product.margin)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calculator className="h-4 w-4" />
                        <span>Coût total</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold">{product.cost_total.toFixed(2)} €</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calculator className="h-4 w-4" />
                        <span>Prix BTC</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold">{product.prix_btc.toFixed(2)} €</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Coef: {product.coefficient.toFixed(2)}x</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recipe Detail */}
          {selectedProduct && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ChefHat className="h-5 w-5 text-primary" />
                  Détail: {selectedProduct.nom_produit}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Ingredients */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 font-semibold">
                      <Apple className="h-4 w-4 text-primary" />
                      Ingrédients ({selectedProduct.cost_ingredients.toFixed(2)} €)
                    </h4>
                    {recipeIngredients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun ingrédient ajouté</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingrédient</TableHead>
                            <TableHead className="text-right">Qté</TableHead>
                            <TableHead className="text-right">Coût</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipeIngredients.map((recipe) => (
                            <TableRow key={recipe.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {recipe.is_sub_recipe && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Link2 className="mr-1 h-3 w-3" />
                                      SR
                                    </Badge>
                                  )}
                                  {recipe.ingredient_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {recipe.quantite_utilisee} {recipe.ingredient_unit}
                              </TableCell>
                              <TableCell className="text-right">{recipe.line_cost.toFixed(2)} €</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRecipeIngredient.mutate(recipe.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Packaging */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 font-semibold">
                      <Package className="h-4 w-4 text-primary" />
                      Emballages ({selectedProduct.cost_packaging.toFixed(2)} €)
                    </h4>
                    {productPackagingItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun emballage ajouté</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Emballage</TableHead>
                            <TableHead className="text-right">Qté</TableHead>
                            <TableHead className="text-right">Coût</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productPackagingItems.map((pp) => (
                            <TableRow key={pp.id}>
                              <TableCell>{pp.packaging_name}</TableCell>
                              <TableCell className="text-right">{pp.quantite}</TableCell>
                              <TableCell className="text-right">{pp.line_cost.toFixed(2)} €</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeProductPackaging.mutate(pp.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="mt-6 rounded-lg border border-border bg-accent/50 p-4">
                  <h4 className="mb-4 font-semibold">Récapitulatif des coûts</h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingrédients</p>
                      <p className="text-lg font-semibold">{selectedProduct.cost_ingredients.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Emballages</p>
                      <p className="text-lg font-semibold">{selectedProduct.cost_packaging.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Charges variables</p>
                      <p className="text-lg font-semibold">{selectedProduct.cost_variable.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coût total</p>
                      <p className="text-lg font-semibold">{selectedProduct.cost_total.toFixed(2)} €</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-sm text-muted-foreground">Prix BTC</p>
                      <p className="text-xl font-bold">{selectedProduct.prix_btc.toFixed(2)} €</p>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-sm text-muted-foreground">Coefficient</p>
                      <p className="text-xl font-bold">{selectedProduct.coefficient.toFixed(2)}x</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-sm text-muted-foreground">Marge brute</p>
                      <p className="text-xl font-bold text-primary">{selectedProduct.margin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-recipes Manager */}
          <div className="mt-8">
            <SubRecipeManager />
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Recipes;
