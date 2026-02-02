import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Timer, Store, Building2, Truck, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PaymentDelaysCardProps {
  formData: {
    delai_paiement_btc: number;
    delai_paiement_btb: number;
    delai_paiement_distributeur: number;
    delai_paiement_fournisseur: number;
    seuil_stock_alerte: number;
  };
  onChange: (field: string, value: string) => void;
}

const DELAY_OPTIONS_BTC = [
  { value: '0', label: 'Immédiat (0 jour)' },
  { value: '7', label: '7 jours' },
  { value: '15', label: '15 jours' },
  { value: '30', label: '30 jours' },
];

const DELAY_OPTIONS_PRO = [
  { value: '15', label: '15 jours' },
  { value: '30', label: '30 jours' },
  { value: '45', label: '45 jours' },
  { value: '60', label: '60 jours' },
];

export function PaymentDelaysCard({ formData, onChange }: PaymentDelaysCardProps) {
  const renderDelaySelect = (
    id: string,
    value: number,
    options: { value: string; label: string }[],
    onChange: (value: string) => void
  ) => {
    const isCustomValue = !options.some(opt => opt.value === String(value));
    
    if (isCustomValue) {
      return (
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            max={90}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground self-center">jours</span>
        </div>
      );
    }

    return (
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Personnalisé...</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  const handleDelayChange = (field: string, value: string) => {
    if (value === 'custom') {
      // Keep current value, user will edit manually
      return;
    }
    onChange(field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-primary" />
          Délais de paiement
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Les délais de paiement clients impactent uniquement le cash-flow (encaissements), pas le CA ni les marges.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Délais par canal de vente pour le calcul des encaissements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client payment delays by channel */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Délais clients par canal</h4>
          
          {/* BTC */}
          <div className="space-y-2">
            <Label htmlFor="delai_btc" className="flex items-center gap-2">
              <Store className="h-4 w-4 text-green-600" />
              BTC (Vente directe)
            </Label>
            <Select 
              value={String(formData.delai_paiement_btc)} 
              onValueChange={(v) => handleDelayChange('delai_paiement_btc', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELAY_OPTIONS_BTC.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Généralement paiement immédiat pour les consommateurs
            </p>
          </div>

          {/* BTB */}
          <div className="space-y-2">
            <Label htmlFor="delai_btb" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              BTB (Professionnels)
            </Label>
            <Select 
              value={String(formData.delai_paiement_btb)} 
              onValueChange={(v) => handleDelayChange('delai_paiement_btb', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELAY_OPTIONS_PRO.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Délai de paiement standard pour les clients professionnels
            </p>
          </div>

          {/* Distributeur */}
          <div className="space-y-2">
            <Label htmlFor="delai_distributeur" className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              Distributeurs
            </Label>
            <Select 
              value={String(formData.delai_paiement_distributeur)} 
              onValueChange={(v) => handleDelayChange('delai_paiement_distributeur', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELAY_OPTIONS_PRO.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Délai de paiement pour les distributeurs et grossistes
            </p>
          </div>
        </div>

        <Separator />

        {/* Supplier payment delay */}
        <div className="space-y-2">
          <Label htmlFor="delai_paiement_fournisseur">Délai fournisseur (jours)</Label>
          <Input
            id="delai_paiement_fournisseur"
            type="number"
            step="1"
            min={0}
            max={90}
            value={formData.delai_paiement_fournisseur}
            onChange={(e) => onChange('delai_paiement_fournisseur', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Délai moyen de paiement de vos fournisseurs
          </p>
        </div>

        <Separator />

        {/* Stock alert threshold */}
        <div className="space-y-2">
          <Label htmlFor="seuil_stock_alerte">Seuil alerte stock</Label>
          <Input
            id="seuil_stock_alerte"
            type="number"
            step="1"
            min={0}
            value={formData.seuil_stock_alerte}
            onChange={(e) => onChange('seuil_stock_alerte', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Quantité minimum avant alerte de réapprovisionnement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
