import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from "lucide-react";
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

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  priceBTC: number;
  priceBTB: number;
  priceDistributor: number;
  costPrice: number;
  margin: number;
}

const categories = ["Sauces", "Confitures", "Terrines", "Boissons", "Miels"];

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Sauce tomate bio",
    category: "Sauces",
    unit: "pot 250g",
    priceBTC: 5.50,
    priceBTB: 4.23,
    priceDistributor: 3.60,
    costPrice: 2.42,
    margin: 45,
  },
  {
    id: "2",
    name: "Confiture de fraise",
    category: "Confitures",
    unit: "pot 350g",
    priceBTC: 6.00,
    priceBTB: 4.62,
    priceDistributor: 3.92,
    costPrice: 2.72,
    margin: 38,
  },
  {
    id: "3",
    name: "Pesto basilic",
    category: "Sauces",
    unit: "pot 180g",
    priceBTC: 7.50,
    priceBTB: 5.77,
    priceDistributor: 4.90,
    costPrice: 2.88,
    margin: 52,
  },
  {
    id: "4",
    name: "Terrine de porc",
    category: "Terrines",
    unit: "pot 200g",
    priceBTC: 8.00,
    priceBTB: 6.15,
    priceDistributor: 5.23,
    costPrice: 5.76,
    margin: 18,
  },
  {
    id: "5",
    name: "Jus de pomme",
    category: "Boissons",
    unit: "bouteille 75cl",
    priceBTC: 4.50,
    priceBTB: 3.46,
    priceDistributor: 2.94,
    costPrice: 2.25,
    margin: 35,
  },
];

const getMarginBadge = (margin: number) => {
  if (margin >= 40) {
    return <Badge className="bg-primary/10 text-primary border-primary/20">{margin}%</Badge>;
  } else if (margin >= 30) {
    return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">{margin}%</Badge>;
  }
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{margin}%</Badge>;
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

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
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit</Label>
                <Input id="productName" placeholder="Ex: Sauce tomate bio" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité de vente</Label>
                  <Input id="unit" placeholder="Ex: pot 250g" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceBTC">Prix BTC (€)</Label>
                <Input id="priceBTC" type="number" step="0.01" placeholder="0.00" />
              </div>
              <p className="text-xs text-muted-foreground">
                Les prix BTB et Distributeur seront calculés automatiquement selon les coefficients définis.
              </p>
              <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                Ajouter le produit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
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
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.unit}
                </TableCell>
                <TableCell className="text-right">
                  {product.priceBTC.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {product.priceBTB.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {product.priceDistributor.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right">
                  {product.costPrice.toFixed(2)} €
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
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteProduct(product.id)}
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

export default Products;
