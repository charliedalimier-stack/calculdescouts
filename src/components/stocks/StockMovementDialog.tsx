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
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "entree" | "sortie";
  stockName: string;
  stockUnit: string;
  onSubmit: (data: {
    quantite: number;
    motif: string;
    notes?: string;
  }) => void;
}

const MOTIFS_ENTREE = [
  { value: "Achat", label: "Achat fournisseur" },
  { value: "Production", label: "Production interne" },
  { value: "Retour", label: "Retour client" },
  { value: "Inventaire", label: "Ajustement inventaire (+)" },
  { value: "Transfert", label: "Transfert entrant" },
];

const MOTIFS_SORTIE = [
  { value: "Vente", label: "Vente" },
  { value: "Consommation", label: "Consommation production" },
  { value: "Perte", label: "Perte / Casse" },
  { value: "Peremption", label: "Péremption" },
  { value: "Inventaire", label: "Ajustement inventaire (-)" },
  { value: "Transfert", label: "Transfert sortant" },
];

export function StockMovementDialog({
  open,
  onOpenChange,
  type,
  stockName,
  stockUnit,
  onSubmit,
}: StockMovementDialogProps) {
  const [quantite, setQuantite] = useState("");
  const [motif, setMotif] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const motifs = type === "entree" ? MOTIFS_ENTREE : MOTIFS_SORTIE;
  const isEntree = type === "entree";

  const handleSubmit = async () => {
    const qty = parseFloat(quantite);
    if (isNaN(qty) || qty <= 0 || !motif) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ quantite: qty, motif, notes: notes || undefined });
      handleClose();
    } catch (error) {
      console.error("Error submitting movement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuantite("");
    setMotif("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEntree ? (
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
            )}
            {isEntree ? "Entrée de stock" : "Sortie de stock"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{stockName}</p>
          </div>

          <div>
            <Label>Quantité ({stockUnit})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>

          <div>
            <Label>Motif</Label>
            <Select value={motif} onValueChange={setMotif}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                {motifs.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!quantite || parseFloat(quantite) <= 0 || !motif || isSubmitting}
            className={isEntree ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isSubmitting ? "Enregistrement..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
