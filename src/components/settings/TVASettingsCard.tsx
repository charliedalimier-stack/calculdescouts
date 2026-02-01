import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Receipt, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export type VATRegime = 'assujetti_normal' | 'franchise_taxe';
export type VATPeriodicite = 'mensuelle' | 'trimestrielle';

interface TVASettingsCardProps {
  formData: {
    tva_vente: number;
    tva_achat: number;
    tva_standard: number;
    tva_reduit_1: number;
    tva_reduit_2: number;
    regime_tva: VATRegime;
    periodicite_tva: VATPeriodicite;
  };
  onChange: (field: string, value: string) => void;
}

export function TVASettingsCard({ formData, onChange }: TVASettingsCardProps) {
  const isFranchise = formData.regime_tva === 'franchise_taxe';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-5 w-5 text-primary" />
          TVA Belgique
          <InfoTooltip
            title="TVA (Taxe sur la Valeur Ajoutée)"
            description="La TVA est un flux de trésorerie, pas un revenu. Elle est collectée sur les ventes et déduite sur les achats."
            interpretation="La TVA impacte votre trésorerie mais pas votre résultat d'exploitation."
            size="sm"
          />
        </CardTitle>
        <CardDescription>
          Configurez les taux de TVA et le régime applicable
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Régime TVA */}
        <div className="space-y-2">
          <Label htmlFor="regime_tva">Régime TVA</Label>
          <Select 
            value={formData.regime_tva} 
            onValueChange={(value) => onChange('regime_tva', value)}
          >
            <SelectTrigger id="regime_tva">
              <SelectValue placeholder="Sélectionnez un régime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assujetti_normal">Assujetti normal</SelectItem>
              <SelectItem value="franchise_taxe">Franchise de taxe (petite entreprise)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isFranchise 
              ? "Aucune TVA n'est facturée ni déduite."
              : "TVA collectée sur les ventes et déductible sur les achats."
            }
          </p>
        </div>

        {isFranchise && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              En régime de franchise, vous ne facturez pas de TVA et ne pouvez pas déduire la TVA sur vos achats.
              Les calculs de cash-flow n'incluront pas de flux TVA.
            </AlertDescription>
          </Alert>
        )}

        {!isFranchise && (
          <>
            {/* Périodicité de déclaration */}
            <div className="space-y-2">
              <Label htmlFor="periodicite_tva">Périodicité de déclaration</Label>
              <Select 
                value={formData.periodicite_tva} 
                onValueChange={(value) => onChange('periodicite_tva', value)}
              >
                <SelectTrigger id="periodicite_tva">
                  <SelectValue placeholder="Sélectionnez la périodicité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuelle">Mensuelle</SelectItem>
                  <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Fréquence de déclaration et paiement de la TVA nette
              </p>
            </div>

            <Separator />

            {/* Taux de TVA */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tva_standard">Taux standard (%)</Label>
                <Input
                  id="tva_standard"
                  type="number"
                  step="0.1"
                  value={formData.tva_standard}
                  onChange={(e) => onChange('tva_standard', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  21% par défaut
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tva_reduit_1">Taux réduit 1 (%)</Label>
                <Input
                  id="tva_reduit_1"
                  type="number"
                  step="0.1"
                  value={formData.tva_reduit_1}
                  onChange={(e) => onChange('tva_reduit_1', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  12% (alimentation transformée)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tva_reduit_2">Taux réduit 2 (%)</Label>
                <Input
                  id="tva_reduit_2"
                  type="number"
                  step="0.1"
                  value={formData.tva_reduit_2}
                  onChange={(e) => onChange('tva_reduit_2', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  6% (produits de base)
                </p>
              </div>
            </div>

            <Separator />

            {/* Taux par défaut */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tva_vente">TVA ventes par défaut (%)</Label>
                <Input
                  id="tva_vente"
                  type="number"
                  step="0.1"
                  value={formData.tva_vente}
                  onChange={(e) => onChange('tva_vente', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Taux appliqué aux ventes (TVA collectée)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tva_achat">TVA achats par défaut (%)</Label>
                <Input
                  id="tva_achat"
                  type="number"
                  step="0.1"
                  value={formData.tva_achat}
                  onChange={(e) => onChange('tva_achat', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Taux appliqué aux achats (TVA déductible)
                </p>
              </div>
            </div>

            {/* Info box */}
            <div className="p-3 bg-muted/50 rounded-md space-y-1">
              <p className="text-sm font-medium">💡 Rappel TVA</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>La TVA collectée est facturée à vos clients (à reverser à l'État)</li>
                <li>La TVA déductible est payée sur vos achats (récupérable)</li>
                <li>TVA nette = Collectée - Déductible (flux de trésorerie uniquement)</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
