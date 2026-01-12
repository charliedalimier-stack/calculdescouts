import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/contexts/ProjectContext";
import { useTVA, useMonthlyTVA } from "@/hooks/useTVA";
import { TVASummaryCards } from "@/components/tva/TVASummaryCards";
import { TVADetailTable } from "@/components/tva/TVADetailTable";
import { TVAMonthlyChart } from "@/components/tva/TVAMonthlyChart";
import { TVACashFlowImpact } from "@/components/tva/TVACashFlowImpact";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, BarChart3, Wallet, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { useState, useEffect } from "react";

export default function TVA() {
  const { currentProject } = useProject();
  const { summary, tvaCollectee, tvaDeductible, tvaNette, defaultTvaVente, defaultTvaAchat } =
    useTVA();
  const { monthlyData, isLoading: monthlyLoading } = useMonthlyTVA();
  const { settings, updateSettings } = useProjectSettings();

  const [tvaVente, setTvaVente] = useState(5.5);
  const [tvaAchat, setTvaAchat] = useState(20);

  useEffect(() => {
    if (settings) {
      setTvaVente(settings.tva_vente);
      setTvaAchat(settings.tva_achat);
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings.mutate({
      tva_vente: tvaVente,
      tva_achat: tvaAchat,
    });
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

  if (monthlyLoading) {
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

  return (
    <AppLayout title="Gestion de la TVA" subtitle="Suivi TVA collectée et déductible">
      <div className="space-y-6">
        {/* Summary Cards */}
        <TVASummaryCards
          tvaCollectee={tvaCollectee}
          tvaDeductible={tvaDeductible}
          tvaNette={tvaNette}
          tauxVente={defaultTvaVente}
          tauxAchat={defaultTvaAchat}
        />

        {/* Tabs */}
        <Tabs defaultValue="detail" className="space-y-4">
          <TabsList>
            <TabsTrigger value="detail" className="gap-2">
              <Receipt className="h-4 w-4" />
              Détail TVA
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Évolution
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="gap-2">
              <Wallet className="h-4 w-4" />
              Impact Trésorerie
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail">
            <TVADetailTable summary={summary} />
          </TabsContent>

          <TabsContent value="evolution">
            <TVAMonthlyChart data={monthlyData} />
          </TabsContent>

          <TabsContent value="cashflow">
            <TVACashFlowImpact data={monthlyData} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres TVA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tva-vente">Taux TVA Vente (%)</Label>
                    <Input
                      id="tva-vente"
                      type="number"
                      step="0.1"
                      value={tvaVente}
                      onChange={(e) => setTvaVente(parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Taux de TVA par défaut appliqué aux ventes (produits alimentaires
                      : 5.5%, taux normal : 20%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tva-achat">Taux TVA Achat (%)</Label>
                    <Input
                      id="tva-achat"
                      type="number"
                      step="0.1"
                      value={tvaAchat}
                      onChange={(e) => setTvaAchat(parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Taux de TVA par défaut appliqué aux achats (ingrédients,
                      emballages, charges)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    Enregistrer les paramètres
                  </Button>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-semibold mb-2">📋 Taux de TVA en France</h4>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>
                      <strong>5,5% :</strong> Produits alimentaires, boissons non
                      alcoolisées
                    </p>
                    <p>
                      <strong>10% :</strong> Restauration sur place, produits
                      agricoles non transformés
                    </p>
                    <p>
                      <strong>20% :</strong> Taux normal (équipements, services,
                      boissons alcoolisées)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
