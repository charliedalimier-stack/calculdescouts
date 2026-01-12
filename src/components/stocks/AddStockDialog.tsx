import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockInsert } from "@/hooks/useStocks";

interface Ingredient {
  id: string;
  nom_ingredient: string;
  cout_unitaire: number;
}

interface Packaging {
  id: string;
  nom: string;
  cout_unitaire: number;
}

interface Product {
  id: string;
  nom_produit: string;
}

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockInsert) => void;
  ingredients: Ingredient[];
  packaging: Packaging[];
  products: Product[];
}

export function AddStockDialog({
  open,
  onOpenChange,
  onSubmit,
  ingredients,
  packaging,
  products,
}: AddStockDialogProps) {
  const [formData, setFormData] = useState<StockInsert>({
    type_stock: "ingredient",
    quantite: 0,
    cout_unitaire: 0,
    seuil_alerte: 10,
  });

  const [selectedItemId, setSelectedItemId] = useState("");

  const handleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type_stock: type,
      ingredient_id: null,
      packaging_id: null,
      product_id: null,
    });
    setSelectedItemId("");
  };

  const handleItemChange = (id: string) => {
    setSelectedItemId(id);

    let cost = 0;
    if (formData.type_stock === "ingredient") {
      const item = ingredients.find((i) => i.id === id);
      cost = item?.cout_unitaire || 0;
      setFormData({
        ...formData,
        ingredient_id: id,
        cout_unitaire: cost,
      });
    } else if (formData.type_stock === "packaging") {
      const item = packaging.find((p) => p.id === id);
      cost = item?.cout_unitaire || 0;
      setFormData({
        ...formData,
        packaging_id: id,
        cout_unitaire: cost,
      });
    } else {
      setFormData({
        ...formData,
        product_id: id,
      });
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      type_stock: "ingredient",
      quantite: 0,
      cout_unitaire: 0,
      seuil_alerte: 10,
    });
    setSelectedItemId("");
    onOpenChange(false);
  };

  const getItems = () => {
    switch (formData.type_stock) {
      case "ingredient":
        return ingredients.map((i) => ({ id: i.id, name: i.nom_ingredient }));
      case "packaging":
        return packaging.map((p) => ({ id: p.id, name: p.nom }));
      case "product":
        return products.map((p) => ({ id: p.id, name: p.nom_produit }));
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type de stock</Label>
            <Select
              value={formData.type_stock}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingredient">Ingrédient</SelectItem>
                <SelectItem value="packaging">Emballage</SelectItem>
                <SelectItem value="product">Produit fini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Article</Label>
            <Select value={selectedItemId} onValueChange={handleItemChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un article" />
              </SelectTrigger>
              <SelectContent>
                {getItems().map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantité initiale</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.quantite}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
              value={formData.cout_unitaire}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
              value={formData.seuil_alerte || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  seuil_alerte: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedItemId}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
