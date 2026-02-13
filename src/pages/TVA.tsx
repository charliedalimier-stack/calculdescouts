import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/contexts/ProjectContext";
import { useTVA, useMonthlyTVA } from "@/hooks/useTVA";
import { TVASummaryCards } from "@/components/tva/TVASummaryCards";
import { TVADetailTable } from "@/components/tva/TVADetailTable";
import { TVAMonthlyChart } from "@/components/tva/TVAMonthlyChart";
import { TVACashFlowImpact } from "@/components/tva/TVACashFlowImpact";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, BarChart3, Wallet, Settings, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectSettings, VATRegime } from "@/hooks/useProjectSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentYear } from "@/lib/dateOptions";

export default function TVA() {
  const { currentProject } = useProject();
  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [mode, setMode] = useState<DataMode>('budget');

  const { summary, tvaCollectee, tvaDeductible, tvaNette, defaultTvaVente, defaultTvaAchat, isLoading: tvaLoading } =
    useTVA({ year, mode, month });
  const { monthlyData, isLoading: monthlyLoading } = useMonthlyTVA({ year, mode });
  const { settings, updateSettings, isVATApplicable } = useProjectSettings();

  const handleRegimeChange = (value: VATRegime) => {
    updateSettings.mutate({ regime_tva: value });
  };

  const handleTvaVenteChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ tva_vente: numValue });
    }
  };

  const handleTvaAchatChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ tva_achat: numValue });
    }
  };

  const handleTvaStandardChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ tva_standard: numValue });
    }
  };

  const handleTvaReduit1Change = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ tva_reduit_1: numValue });
    }
  };

  const handleTvaReduit2Change = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ tva_reduit_2: numValue });
    }
  };

  if (!currentProject) {
    return (
      <AppLayout title="Gestion de la TVA" subtitle="Suivi TVA collectée et déductible">
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Veuillez sélectionner un projet</p>
        </div>
      </AppLayout>
    );
  }

  if (monthlyLoading || tvaLoading) {
    return (
      <AppLayout title="Gestion de la TVA" subtitle="Suivi TVA collectée et déductible">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  const isFranchise = settings.regime_tva === 'franchise_taxe';

  return (
    <AppLayout title="Gestion de la TVA" subtitle="TVA Belge - Suivi collectée et déductible">
      <div className="space-y-6">
        {/* Period Selector */}
        <PeriodSelector
          year={year}
          month={month ?? 1}
          mode={mode}
          showMonth={true}
          onChange={({ month: m, year: y, mode: dm }) => {
            setMonth(m);
            setYear(y);
            setMode(dm);
          }}
        />

        {/* Franchise alert */}
        {isFranchise && (
          <Alert className="border-chart-4 bg-chart-4/10">
            <AlertTriangle className="h-4 w-4 text-chart-4" />
            <AlertTitle>Régime de franchise de taxe</AlertTitle>
            <AlertDescription>
              En régime de franchise de taxe (petite entreprise), aucune TVA n'est collectée sur les ventes 
              et aucune TVA n'est déductible sur les achats. Les prix sont affichés hors TVA.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <TVASummaryCards
          tvaCollectee={isFranchise ? 0 : tvaCollectee}
          tvaDeductible={isFranchise ? 0 : tvaDeductible}
          tvaNette={isFranchise ? 0 : tvaNette}
          tauxVente={defaultTvaVente}
          tauxAchat={defaultTvaAchat}
          isFranchise={isFranchise}
        />

        {/* Tabs */}
        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="detail" className="gap-2" disabled={isFranchise}>
              <Receipt className="h-4 w-4" />
              Détail TVA
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2" disabled={isFranchise}>
              <BarChart3 className="h-4 w-4" />
              Évolution
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="gap-2" disabled={isFranchise}>
              <Wallet className="h-4 w-4" />
              Impact Trésorerie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Regime selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Régime TVA
                    <Badge variant="outline" className="ml-auto">
                      {settings.pays}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez votre régime de TVA applicable en Belgique
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Régime applicable</Label>
                    <Select
                      value={settings.regime_tva}
                      onValueChange={handleRegimeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assujetti_normal">
                          Assujetti normal (TVA applicable)
                        </SelectItem>
                        <SelectItem value="franchise_taxe">
                          Franchise de taxe (petite entreprise)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h4 className="font-semibold text-sm">📋 Régimes TVA en Belgique</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Assujetti normal :</strong> TVA collectée sur les ventes 
                        et TVA déductible sur les achats.
                      </p>
                      <p>
                        <strong>Franchise de taxe :</strong> Pour les entreprises avec un CA annuel 
                        &lt; 25.000€. Pas de TVA collectée ni déductible.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Belgian VAT rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Taux de TVA Belge</CardTitle>
                  <CardDescription>
                    Configuration des taux de TVA selon la législation belge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tva-standard">Standard</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Taux normal pour la plupart des biens et services</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          id="tva-standard"
                          type="number"
                          step="0.1"
                          value={settings.tva_standard}
                          onChange={(e) => handleTvaStandardChange(e.target.value)}
                          disabled={isFranchise}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tva-reduit1">Réduit 1</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Produits alimentaires transformés</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          id="tva-reduit1"
                          type="number"
                          step="0.1"
                          value={settings.tva_reduit_1}
                          onChange={(e) => handleTvaReduit1Change(e.target.value)}
                          disabled={isFranchise}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tva-reduit2">Réduit 2</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Produits alimentaires de base</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          id="tva-reduit2"
                          type="number"
                          step="0.1"
                          value={settings.tva_reduit_2}
                          onChange={(e) => handleTvaReduit2Change(e.target.value)}
                          disabled={isFranchise}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h4 className="font-semibold text-sm">🇧🇪 Taux de TVA en Belgique</h4>
                    <div className="grid gap-1 text-sm text-muted-foreground">
                      <p>
                        <strong>21% :</strong> Taux standard (équipements, services, boissons alcoolisées)
                      </p>
                      <p>
                        <strong>12% :</strong> Certains produits alimentaires transformés
                      </p>
                      <p>
                        <strong>6% :</strong> Produits alimentaires de base (viandes, légumes, pain...)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Default rates for sales and purchases */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Taux par défaut</CardTitle>
                  <CardDescription>
                    Taux de TVA appliqués par défaut aux ventes et achats (modifiables par produit)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tva-vente">TVA Vente par défaut (%)</Label>
                      <Select
                        value={settings.tva_vente.toString()}
                        onValueChange={(v) => handleTvaVenteChange(v)}
                        disabled={isFranchise}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={settings.tva_reduit_2.toString()}>
                            {settings.tva_reduit_2}% - Réduit (produits de base)
                          </SelectItem>
                          <SelectItem value={settings.tva_reduit_1.toString()}>
                            {settings.tva_reduit_1}% - Réduit (transformés)
                          </SelectItem>
                          <SelectItem value={settings.tva_standard.toString()}>
                            {settings.tva_standard}% - Standard
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Taux appliqué aux ventes de produits
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tva-achat">TVA Achat par défaut (%)</Label>
                      <Select
                        value={settings.tva_achat.toString()}
                        onValueChange={(v) => handleTvaAchatChange(v)}
                        disabled={isFranchise}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={settings.tva_reduit_2.toString()}>
                            {settings.tva_reduit_2}% - Réduit (produits de base)
                          </SelectItem>
                          <SelectItem value={settings.tva_reduit_1.toString()}>
                            {settings.tva_reduit_1}% - Réduit (transformés)
                          </SelectItem>
                          <SelectItem value={settings.tva_standard.toString()}>
                            {settings.tva_standard}% - Standard
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Taux appliqué aux achats (ingrédients, emballages, charges)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detail">
            <TVADetailTable summary={summary} />
          </TabsContent>

          <TabsContent value="evolution">
            <TVAMonthlyChart data={monthlyData} />
          </TabsContent>

          <TabsContent value="cashflow">
            <TVACashFlowImpact data={monthlyData} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}