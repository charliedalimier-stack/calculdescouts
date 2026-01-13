import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreakevenAnalysis, Channel } from "@/hooks/useBreakevenAnalysis";
import { useCategories } from "@/hooks/useCategories";
import { BreakevenChart } from "@/components/breakeven/BreakevenChart";
import { BreakevenTable } from "@/components/breakeven/BreakevenTable";
import { BreakevenSummary } from "@/components/breakeven/BreakevenSummary";
import { Target, Download, Settings } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFINITIONS } from "@/lib/pedagogicDefinitions";

export default function Breakeven() {
  const { productsWithCosts, isLoading, getAllProductsBreakeven, getProductBreakeven, getBreakevenSummary } = useBreakevenAnalysis();
  const { categories } = useCategories();

  // États des filtres
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<Channel>("btc");
  const [includeTva, setIncludeTva] = useState(false);
  const [coutFixeTotal, setCoutFixeTotal] = useState<number>(0);

  // Filtrer les produits par catégorie
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return productsWithCosts;
    return productsWithCosts.filter(p => p.categorie_id === selectedCategory);
  }, [productsWithCosts, selectedCategory]);

  // Calcul des données
  const allBreakevenData = useMemo(() => {
    const allData = getAllProductsBreakeven(coutFixeTotal, selectedChannel, includeTva);
    if (selectedCategory === "all") return allData;
    return allData.filter(d => {
      const product = productsWithCosts.find(p => p.id === d.productId);
      return product?.categorie_id === selectedCategory;
    });
  }, [getAllProductsBreakeven, coutFixeTotal, selectedChannel, includeTva, selectedCategory, productsWithCosts]);

  const selectedProductData = useMemo(() => {
    if (selectedProduct === "all") return null;
    return getProductBreakeven(selectedProduct, coutFixeTotal, includeTva);
  }, [selectedProduct, getProductBreakeven, coutFixeTotal, includeTva]);

  const summary = useMemo(() => {
    return getBreakevenSummary(coutFixeTotal, includeTva);
  }, [getBreakevenSummary, coutFixeTotal, includeTva]);

  // Export CSV
  const handleExport = () => {
    const headers = [
      "Produit",
      "Catégorie",
      "Canal",
      "Prix vente HT",
      "Coût variable",
      "Contribution",
      "Seuil (unités)",
      "Seuil (€)",
      "Volume actuel",
      "Marge sécurité (%)",
      "Statut"
    ];

    const rows = allBreakevenData.map(d => [
      d.productName,
      d.categoryName || "",
      d.channel.toUpperCase(),
      d.prixVenteHT.toFixed(2),
      d.coutVariable.toFixed(2),
      d.contributionUnitaire.toFixed(2),
      d.seuilUnites >= 0 ? d.seuilUnites : "N/A",
      d.seuilCA >= 0 ? d.seuilCA.toFixed(2) : "N/A",
      d.volumeActuel,
      d.margeSecurite.toFixed(1),
      d.isRentable ? "Rentable" : "Sous seuil"
    ]);

    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seuil-rentabilite-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <AppLayout title="Seuil de rentabilité">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Seuil de rentabilité" subtitle="Analysez le point mort par produit et par canal de vente">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Paramètres */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres de calcul
              <InfoTooltip
                title={DEFINITIONS.seuil_rentabilite.title}
                formula={DEFINITIONS.seuil_rentabilite.formula}
                description={DEFINITIONS.seuil_rentabilite.description}
                interpretation={DEFINITIONS.seuil_rentabilite.interpretation}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Coûts fixes */}
              <div className="space-y-2">
                <Label htmlFor="couts-fixes">Coûts fixes mensuels (€)</Label>
                <Input
                  id="couts-fixes"
                  type="number"
                  min={0}
                  value={coutFixeTotal}
                  onChange={(e) => setCoutFixeTotal(Number(e.target.value) || 0)}
                  placeholder="Ex: 5000"
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nom_categorie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Produit */}
              <div className="space-y-2">
                <Label>Produit</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nom_produit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Canal */}
              <div className="space-y-2">
                <Label>Canal de vente</Label>
                <Select value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as Channel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="btc">Vente directe (BTC)</SelectItem>
                    <SelectItem value="btb">Professionnels (BTB)</SelectItem>
                    <SelectItem value="distributeur">Distributeurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TVA */}
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="include-tva"
                  checked={includeTva}
                  onCheckedChange={setIncludeTva}
                />
                <Label htmlFor="include-tva">Afficher TTC</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Par produit</TabsTrigger>
            <TabsTrigger value="channels">Par canal</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-4">
            <BreakevenSummary summary={summary} coutFixeTotal={coutFixeTotal} />
            
            {selectedProduct !== "all" && selectedProductData && (
              <div className="grid gap-4 lg:grid-cols-2">
                {selectedProductData.map((data) => (
                  <BreakevenChart key={data.channel} data={data} />
                ))}
              </div>
            )}

            <BreakevenTable data={allBreakevenData} showChannel={false} />
          </TabsContent>

          {/* Par produit */}
          <TabsContent value="products" className="space-y-4">
            {selectedProduct === "all" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredProducts.slice(0, 4).map((product) => {
                  const productData = getProductBreakeven(product.id, coutFixeTotal, includeTva);
                  const channelData = productData?.find(d => d.channel === selectedChannel);
                  if (!channelData) return null;
                  return <BreakevenChart key={product.id} data={channelData} />;
                })}
              </div>
            ) : (
              selectedProductData && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {selectedProductData.map((data) => (
                    <BreakevenChart key={data.channel} data={data} />
                  ))}
                </div>
              )
            )}

            <BreakevenTable data={allBreakevenData} showChannel={true} />
          </TabsContent>

          {/* Par canal */}
          <TabsContent value="channels" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {(['btc', 'btb', 'distributeur'] as Channel[]).map((channel) => {
                const channelData = getAllProductsBreakeven(coutFixeTotal, channel, includeTva);
                const rentables = channelData.filter(d => d.isRentable).length;
                const total = channelData.length;
                const avgMarge = channelData.reduce((sum, d) => sum + d.margeSecurite, 0) / (total || 1);

                return (
                  <Card key={channel}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {channel === 'btc' && 'Vente directe (BTC)'}
                        {channel === 'btb' && 'Professionnels (BTB)'}
                        {channel === 'distributeur' && 'Distributeurs'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Produits rentables</p>
                          <p className="text-2xl font-bold">{rentables}/{total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Marge moy.</p>
                          <p className={`text-2xl font-bold ${avgMarge >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                            {avgMarge >= 0 ? '+' : ''}{avgMarge.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <BreakevenTable 
              data={[
                ...getAllProductsBreakeven(coutFixeTotal, 'btc', includeTva),
                ...getAllProductsBreakeven(coutFixeTotal, 'btb', includeTva),
                ...getAllProductsBreakeven(coutFixeTotal, 'distributeur', includeTva),
              ]} 
              showChannel={true} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
