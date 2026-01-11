import { useState } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
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
import { usePackaging } from "@/hooks/usePackaging";
import { useProject } from "@/contexts/ProjectContext";

const packagingTypes = {
  primaire: { label: "Primaire", description: "En contact avec le produit" },
  secondaire: { label: "Secondaire", description: "Emballage de présentation" },
  tertiaire: { label: "Tertiaire", description: "Transport et stockage" },
};

const getTypeBadge = (type: string | null) => {
  switch (type) {
    case "primaire":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Primaire</Badge>;
    case "secondaire":
      return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Secondaire</Badge>;
    case "tertiaire":
      return <Badge variant="outline">Tertiaire</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
};

const Packaging = () => {
  const { currentProject } = useProject();
  const { packaging, isLoading, addPackaging, updatePackaging, deletePackaging } = usePackaging();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    cout_unitaire: "",
    unite: "unité",
    type_emballage: "primaire",
  });

  const filteredPackaging = packaging.filter((p) =>
    p.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ nom: "", cout_unitaire: "", unite: "unité", type_emballage: "primaire" });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.nom.trim()) return;

    const data = {
      nom: formData.nom,
      cout_unitaire: parseFloat(formData.cout_unitaire) || 0,
      unite: formData.unite,
      type_emballage: formData.type_emballage,
    };

    if (editingId) {
      updatePackaging.mutate({ id: editingId, ...data });
    } else {
      addPackaging.mutate(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (item: typeof packaging[0]) => {
    setFormData({
      nom: item.nom,
      cout_unitaire: item.cout_unitaire.toString(),
      unite: item.unite,
      type_emballage: item.type_emballage || "primaire",
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deletePackaging.mutate(id);
  };

  if (!currentProject) {
    return (
      <AppLayout title="Emballages" subtitle="Sélectionnez un projet pour voir les emballages">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Veuillez d'abord créer ou sélectionner un projet.</p>
        </Card>
      </AppLayout>
    );
  }

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
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un emballage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier l'emballage" : "Ajouter un emballage"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="packagingName">Nom de l'emballage</Label>
                <Input
                  id="packagingName"
                  placeholder="Ex: Pot verre 250g"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type_emballage}
                    onValueChange={(value) => setFormData({ ...formData, type_emballage: value })}
                  >
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
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={addPackaging.isPending || updatePackaging.isPending}
              >
                {(addPackaging.isPending || updatePackaging.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingId ? "Mettre à jour" : "Ajouter l'emballage"}
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
        ) : filteredPackaging.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "Aucun emballage trouvé" : "Aucun emballage. Ajoutez-en un !"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emballage</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackaging.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nom}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.cout_unitaire).toFixed(2)} €
                  </TableCell>
                  <TableCell>{getTypeBadge(item.type_emballage)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
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

export default Packaging;
