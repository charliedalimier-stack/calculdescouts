import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { useTaxBrackets, TaxBracket } from "@/hooks/useTaxBrackets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

interface FiscalSettingsCardProps {
  formData: {
    taux_cotisations_sociales: number;
    annee_fiscale_reference: number;
    taux_communal: number;
    nombre_enfants_charge: number;
    quotite_exemptee_base: number;
    majoration_par_enfant: number;
  };
  onChange: (field: string, value: string) => void;
}

export function FiscalSettingsCard({ formData, onChange }: FiscalSettingsCardProps) {
  const { brackets, updateBracket, addBracket, deleteBracket, isLoading } = useTaxBrackets();
  const [editingBracket, setEditingBracket] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TaxBracket>>({});

  const handleBracketEdit = (bracket: TaxBracket) => {
    setEditingBracket(bracket.id);
    setEditValues({
      tranche_min: bracket.tranche_min,
      tranche_max: bracket.tranche_max,
      taux: bracket.taux,
    });
  };

  const handleBracketSave = (id: string) => {
    updateBracket.mutate({
      id,
      tranche_min: editValues.tranche_min,
      tranche_max: editValues.tranche_max,
      taux: editValues.taux,
    });
    setEditingBracket(null);
    setEditValues({});
  };

  const handleAddBracket = () => {
    const maxOrdre = brackets.length > 0 ? Math.max(...brackets.map(b => b.ordre)) : 0;
    const lastBracket = brackets.find(b => b.ordre === maxOrdre);
    const newMin = lastBracket?.tranche_max || 0;
    
    addBracket.mutate({
      tranche_min: newMin,
      tranche_max: null,
      taux: 50,
      ordre: maxOrdre + 1,
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "∞";
    return new Intl.NumberFormat('fr-BE').format(value) + " €";
  };

  return (
    <>
      {/* Cotisations sociales et paramètres fiscaux de base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-primary" />
            Paramètres fiscaux
          </CardTitle>
          <CardDescription>
            Configuration des cotisations sociales et de l'impôt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taux_cotisations_sociales">Taux cotisations sociales (%)</Label>
              <Input
                id="taux_cotisations_sociales"
                type="number"
                step="0.1"
                value={formData.taux_cotisations_sociales}
                onChange={(e) => onChange('taux_cotisations_sociales', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annee_fiscale_reference">Année fiscale de référence</Label>
              <Input
                id="annee_fiscale_reference"
                type="number"
                value={formData.annee_fiscale_reference}
                onChange={(e) => onChange('annee_fiscale_reference', e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taux_communal">Taux communal (%)</Label>
              <Input
                id="taux_communal"
                type="number"
                step="0.1"
                value={formData.taux_communal}
                onChange={(e) => onChange('taux_communal', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Additionnel communal à l'IPP
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre_enfants_charge">Nombre d'enfants à charge</Label>
              <Input
                id="nombre_enfants_charge"
                type="number"
                min="0"
                value={formData.nombre_enfants_charge}
                onChange={(e) => onChange('nombre_enfants_charge', e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quotite_exemptee_base">Quotité exemptée de base (€)</Label>
              <Input
                id="quotite_exemptee_base"
                type="number"
                step="10"
                value={formData.quotite_exemptee_base}
                onChange={(e) => onChange('quotite_exemptee_base', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="majoration_par_enfant">Majoration par enfant (€)</Label>
              <Input
                id="majoration_par_enfant"
                type="number"
                step="10"
                value={formData.majoration_par_enfant}
                onChange={(e) => onChange('majoration_par_enfant', e.target.value)}
              />
            </div>
          </div>
          <div className="pt-2 p-3 bg-muted/50 rounded-md">
            <p className="text-sm">
              <strong>Quotité exemptée totale :</strong>{" "}
              {formatCurrency(
                Number(formData.quotite_exemptee_base) + 
                (Number(formData.majoration_par_enfant) * Number(formData.nombre_enfants_charge))
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tranches d'imposition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-primary" />
            Tranches d'imposition
          </CardTitle>
          <CardDescription>
            Barème progressif de l'impôt sur le revenu (IPP belge)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De (€)</TableHead>
                <TableHead>À (€)</TableHead>
                <TableHead>Taux (%)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : brackets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucune tranche configurée
                  </TableCell>
                </TableRow>
              ) : (
                brackets.map((bracket) => (
                  <TableRow key={bracket.id}>
                    <TableCell>
                      {editingBracket === bracket.id ? (
                        <Input
                          type="number"
                          value={editValues.tranche_min ?? 0}
                          onChange={(e) => setEditValues(prev => ({ ...prev, tranche_min: Number(e.target.value) }))}
                          className="w-24"
                        />
                      ) : (
                        formatCurrency(bracket.tranche_min)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingBracket === bracket.id ? (
                        <Input
                          type="number"
                          value={editValues.tranche_max ?? ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            tranche_max: e.target.value ? Number(e.target.value) : null 
                          }))}
                          className="w-24"
                          placeholder="∞"
                        />
                      ) : (
                        formatCurrency(bracket.tranche_max)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingBracket === bracket.id ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={editValues.taux ?? 0}
                          onChange={(e) => setEditValues(prev => ({ ...prev, taux: Number(e.target.value) }))}
                          className="w-20"
                        />
                      ) : (
                        `${bracket.taux}%`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingBracket === bracket.id ? (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleBracketSave(bracket.id)}
                          >
                            OK
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingBracket(null)}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleBracketEdit(bracket)}
                          >
                            ✏️
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteBracket.mutate(bracket.id)}
                            disabled={deleteBracket.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddBracket}
              disabled={addBracket.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une tranche
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
