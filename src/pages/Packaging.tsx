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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface Packaging {
  id: string;
  name: string;
  pricePerUnit: number;
  type: "primary" | "secondary" | "tertiary";
  stock?: number;
}

const packagingTypes = {
  primary: { label: "Primaire", description: "En contact avec le produit" },
  secondary: { label: "Secondaire", description: "Emballage de présentation" },
  tertiary: { label: "Tertiaire", description: "Transport et stockage" },
};

const initialPackaging: Packaging[] = [
  { id: "1", name: "Pot verre 250g", pricePerUnit: 0.45, type: "primary", stock: 500 },
  { id: "2", name: "Pot verre 350g", pricePerUnit: 0.55, type: "primary", stock: 350 },
  { id: "3", name: "Pot verre 180g", pricePerUnit: 0.38, type: "primary", stock: 400 },
  { id: "4", name: "Bouteille verre 75cl", pricePerUnit: 0.65, type: "primary", stock: 200 },
  { id: "5", name: "Couvercle métal twist-off", pricePerUnit: 0.12, type: "primary", stock: 1000 },
  { id: "6", name: "Étiquette personnalisée", pricePerUnit: 0.08, type: "secondary", stock: 2000 },
  { id: "7", name: "Carton 6 pots", pricePerUnit: 0.35, type: "secondary", stock: 150 },
  { id: "8", name: "Palette bois", pricePerUnit: 8.00, type: "tertiary", stock: 20 },
];

const getTypeBadge = (type: Packaging["type"]) => {
  switch (type) {
    case "primary":
      return <Badge className="bg-primary/10 text-primary border-primary/20">{packagingTypes.primary.label}</Badge>;
    case "secondary":
      return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">{packagingTypes.secondary.label}</Badge>;
    case "tertiary":
      return <Badge variant="outline">{packagingTypes.tertiary.label}</Badge>;
  }
};

const Packaging = () => {
  const [packaging, setPackaging] = useState<Packaging[]>(initialPackaging);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPackaging = packaging.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePackaging = (id: string) => {
    setPackaging(packaging.filter((p) => p.id !== id));
  };

  return (
    <AppLayout
      title="Emballages"
      subtitle="Gérez vos emballages et conditionnements"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un emballage..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un emballage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un emballage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="packagingName">Nom de l'emballage</Label>
                <Input id="packagingName" placeholder="Ex: Pot verre 250g" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix unitaire (€)</Label>
                  <Input id="price" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(packagingTypes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                Ajouter l'emballage
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emballage</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPackaging.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">
                  {item.pricePerUnit.toFixed(2)} €
                </TableCell>
                <TableCell>{getTypeBadge(item.type)}</TableCell>
                <TableCell className="text-right">
                  {item.stock !== undefined ? (
                    <span className={item.stock < 50 ? "text-destructive font-medium" : ""}>
                      {item.stock} unités
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
                        onClick={() => handleDeletePackaging(item.id)}
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

export default Packaging;
