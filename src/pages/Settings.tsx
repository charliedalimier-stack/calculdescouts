import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { useProject } from "@/contexts/ProjectContext";
import { Percent, Timer, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FiscalSettingsCard } from "@/components/settings/FiscalSettingsCard";
import { TVASettingsCard, VATRegime, VATPeriodicite } from "@/components/settings/TVASettingsCard";

const SettingsPage = () => {
  const { currentProject } = useProject();
  const { settings, isLoading, updateSettings } = useProjectSettings();
  
  const [formData, setFormData] = useState({
    coefficient_min: 2.0,
    coefficient_cible: 2.5,
    marge_min: 30,
    marge_cible: 40,
    marge_btb: 30,
    marge_distributeur: 15,
    tva_vente: 6,
    tva_achat: 21,
    tva_standard: 21,
    tva_reduit_1: 12,
    tva_reduit_2: 6,
    regime_tva: 'assujetti_normal' as VATRegime,
    periodicite_tva: 'trimestrielle' as VATPeriodicite,
    seuil_stock_alerte: 10,
    delai_paiement_client: 30,
    delai_paiement_fournisseur: 30,
    taux_cotisations_sociales: 20.5,
    annee_fiscale_reference: 2026,
    taux_communal: 7.0,
    nombre_enfants_charge: 0,
    quotite_exemptee_base: 10570,
    majoration_par_enfant: 1850,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        coefficient_min: settings.coefficient_min,
        coefficient_cible: settings.coefficient_cible,
        marge_min: settings.marge_min,
        marge_cible: settings.marge_cible,
        marge_btb: settings.marge_btb,
        marge_distributeur: settings.marge_distributeur,
        tva_vente: settings.tva_vente,
        tva_achat: settings.tva_achat,
        tva_standard: settings.tva_standard,
        tva_reduit_1: settings.tva_reduit_1,
        tva_reduit_2: settings.tva_reduit_2,
        regime_tva: settings.regime_tva as VATRegime,
        periodicite_tva: (settings as any).periodicite_tva || 'trimestrielle',
        seuil_stock_alerte: settings.seuil_stock_alerte,
        delai_paiement_client: settings.delai_paiement_client,
        delai_paiement_fournisseur: settings.delai_paiement_fournisseur,
        taux_cotisations_sociales: settings.taux_cotisations_sociales,
        annee_fiscale_reference: settings.annee_fiscale_reference,
        taux_communal: settings.taux_communal,
        nombre_enfants_charge: settings.nombre_enfants_charge,
        quotite_exemptee_base: settings.quotite_exemptee_base,
        majoration_par_enfant: settings.majoration_par_enfant,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  if (!currentProject) {
    return (
      <AppLayout title="Paramètres" subtitle="Configuration du projet">
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Sélectionnez un projet pour accéder aux paramètres
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout title="Paramètres" subtitle="Configuration du projet">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Paramètres" 
      subtitle={`Configuration du projet "${currentProject.nom_projet}"`}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Règles de rentabilité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Règles de rentabilité
            </CardTitle>
            <CardDescription>
              Définissez les seuils d'alerte pour les marges et coefficients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coefficient_min">Coefficient minimum</Label>
                <Input
                  id="coefficient_min"
                  type="number"
                  step="0.1"
                  value={formData.coefficient_min}
                  onChange={(e) => handleChange('coefficient_min', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  En dessous = non viable
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coefficient_cible">Coefficient cible</Label>
                <Input
                  id="coefficient_cible"
                  type="number"
                  step="0.1"
                  value={formData.coefficient_cible}
                  onChange={(e) => handleChange('coefficient_cible', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Objectif optimal
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marge_min">Marge minimum (%)</Label>
                <Input
                  id="marge_min"
                  type="number"
                  step="1"
                  value={formData.marge_min}
                  onChange={(e) => handleChange('marge_min', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  En dessous = non viable
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="marge_cible">Marge cible (%)</Label>
                <Input
                  id="marge_cible"
                  type="number"
                  step="1"
                  value={formData.marge_cible}
                  onChange={(e) => handleChange('marge_cible', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Objectif optimal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marges commerciales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5 text-primary" />
              Marges commerciales
            </CardTitle>
            <CardDescription>
              Configurez les remises par canal de vente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marge_btb">Remise BTB vs BTC (%)</Label>
              <Input
                id="marge_btb"
                type="number"
                step="1"
                value={formData.marge_btb}
                onChange={(e) => handleChange('marge_btb', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Prix BTB = Prix BTC × (1 - {formData.marge_btb}%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marge_distributeur">Remise Distributeur vs BTB (%)</Label>
              <Input
                id="marge_distributeur"
                type="number"
                step="1"
                value={formData.marge_distributeur}
                onChange={(e) => handleChange('marge_distributeur', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Prix Distributeur = Prix BTB × (1 - {formData.marge_distributeur}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TVA Belgique */}
        <TVASettingsCard 
          formData={formData}
          onChange={handleChange}
        />

        {/* Délais et alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-5 w-5 text-primary" />
              Délais et alertes
            </CardTitle>
            <CardDescription>
              Configurez les délais de paiement et seuils d'alerte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delai_paiement_client">Délai client (jours)</Label>
                <Input
                  id="delai_paiement_client"
                  type="number"
                  step="1"
                  value={formData.delai_paiement_client}
                  onChange={(e) => handleChange('delai_paiement_client', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delai_paiement_fournisseur">Délai fournisseur (jours)</Label>
                <Input
                  id="delai_paiement_fournisseur"
                  type="number"
                  step="1"
                  value={formData.delai_paiement_fournisseur}
                  onChange={(e) => handleChange('delai_paiement_fournisseur', e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="seuil_stock_alerte">Seuil alerte stock</Label>
              <Input
                id="seuil_stock_alerte"
                type="number"
                step="1"
                value={formData.seuil_stock_alerte}
                onChange={(e) => handleChange('seuil_stock_alerte', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quantité minimum avant alerte de réapprovisionnement
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres fiscaux */}
        <FiscalSettingsCard 
          formData={formData}
          onChange={handleChange}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;