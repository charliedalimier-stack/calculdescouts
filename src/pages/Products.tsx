import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useProject } from "@/contexts/ProjectContext";

const getMarginBadge = (margin: number) => {
  if (margin >= 40) {
    return <Badge className="bg-primary/10 text-primary border-primary/20">{margin.toFixed(1)}%</Badge>;
  } else if (margin >= 30) {
    return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">{margin.toFixed(1)}%</Badge>;
  }
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{margin.toFixed(1)}%</Badge>;
};

const Products = () => {
  const { currentProject } = useProject();
  const { productsWithCosts, isLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, addCategory } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom_produit: "",
    categorie_id: "",
    unite_vente: "pièce",
    prix_btc: "",
  });
  const [newCategory, setNewCategory] = useState("");

  const filteredProducts = productsWithCosts.filter((product) => {
    const matchesSearch = product.nom_produit
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || selectedCategory === "all" || product.categorie_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({ nom_produit: "", categorie_id: "", unite_vente: "pièce", prix_btc: "" });
    setEditingId(null);
    setNewCategory("");
  };

  const handleSubmit = () => {
    if (!formData.nom_produit.trim()) return;

    const data = {
      nom_produit: formData.nom_produit,
      categorie_id: formData.categorie_id || null,
      unite_vente: formData.unite_vente,
      prix_btc: parseFloat(formData.prix_btc) || 0,
    };

    if (editingId) {
      updateProduct.mutate({ id: editingId, ...data });
    } else {
      addProduct.mutate(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (product: typeof productsWithCosts[0]) => {
    setFormData({
      nom_produit: product.nom_produit,
      categorie_id: product.categorie_id || "",
      unite_vente: product.unite_vente,
      prix_btc: product.prix_btc.toString(),
    });
    setEditingId(product.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory.mutate(newCategory.trim());
      setNewCategory("");
    }
  };

  if (!currentProject) {
    return (
      <AppLayout title="Produits" subtitle="Sélectionnez un projet pour voir les produits">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Veuillez d'abord créer ou sélectionner un projet.</p>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Produits"
      subtitle="Gérez votre catalogue de produits finis"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nom_categorie}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit</Label>
                <Input
                  id="productName"
                  placeholder="Ex: Sauce tomate bio"
                  value={formData.nom_produit}
                  onChange={(e) => setFormData({ ...formData, nom_produit: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.categorie_id}
                    onValueChange={(value) => setFormData({ ...formData, categorie_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nom_categorie}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nouvelle catégorie"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={handleAddCategory}>
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité de vente</Label>
                  <Input
                    id="unit"
                    placeholder="Ex: pot 250g"
                    value={formData.unite_vente}
                    onChange={(e) => setFormData({ ...formData, unite_vente: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceBTC">Prix BTC (€)</Label>
                <Input
                  id="priceBTC"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.prix_btc}
                  onChange={(e) => setFormData({ ...formData, prix_btc: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Les prix BTB (×0.70) et Distributeur (×0.85 du BTB) sont calculés automatiquement.
              </p>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={addProduct.isPending || updateProduct.isPending}
              >
                {(addProduct.isPending || updateProduct.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingId ? "Mettre à jour" : "Ajouter le produit"}
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
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "Aucun produit trouvé" : "Aucun produit. Ajoutez-en un !"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Prix BTC</TableHead>
                <TableHead className="text-right">Prix BTB</TableHead>
                <TableHead className="text-right">Prix Distrib.</TableHead>
                <TableHead className="text-right">Coût revient</TableHead>
                <TableHead className="text-center">Marge</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nom_produit}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category_name || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.unite_vente}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(product.prix_btc).toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.prix_btb.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.prix_distributor.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right">
                    {product.cost_total.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-center">
                    {getMarginBadge(product.margin)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
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

export default Products;
