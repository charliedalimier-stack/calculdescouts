import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SensitivityChart } from '@/components/sensitivity/SensitivityChart';
import { SensitivityTable } from '@/components/sensitivity/SensitivityTable';
import { SensitivityRiskZone } from '@/components/sensitivity/SensitivityRiskZone';
import { useSensitivityAnalysis } from '@/hooks/useSensitivityAnalysis';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  BarChart3,
  Layers,
  AlertTriangle,
  Activity
} from 'lucide-react';

const Sensitivity = () => {
  const { 
    productsWithCosts, 
    categories, 
    isLoading,
    getProductSensitivity,
    getCategorySensitivity,
  } = useSensitivityAnalysis();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'product' | 'category'>('product');

  // Get sensitivity data based on selection
  const sensitivityData = useMemo(() => {
    if (analysisType === 'product' && selectedProductId) {
      return getProductSensitivity(selectedProductId);
    }
    return null;
  }, [analysisType, selectedProductId, getProductSensitivity]);

  const categorySensitivityData = useMemo(() => {
    if (analysisType === 'category' && selectedCategoryId) {
      return getCategorySensitivity(selectedCategoryId);
    }
    return null;
  }, [analysisType, selectedCategoryId, getCategorySensitivity]);

  // Auto-select first product/category
  useMemo(() => {
    if (productsWithCosts.length > 0 && !selectedProductId) {
      setSelectedProductId(productsWithCosts[0].id);
    }
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [productsWithCosts, categories, selectedProductId, selectedCategoryId]);

  const selectedProduct = productsWithCosts.find(p => p.id === selectedProductId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  if (isLoading) {
    return (
      <AppLayout title="Analyse de sensibilité" subtitle="Chargement...">
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Analyse de sensibilité"
      subtitle="Impact des variations sur la rentabilité"
    >
      {/* Selection controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Configuration de l'analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type d'analyse</label>
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as 'product' | 'category')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Par produit
                    </div>
                  </SelectItem>
                  <SelectItem value="category">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Par catégorie
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {analysisType === 'product' && (
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Produit</label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsWithCosts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{product.nom_produit}</span>
                          <Badge variant="outline" className="text-xs">
                            {product.coefficient.toFixed(2)}x
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {analysisType === 'category' && (
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Catégorie</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nom_categorie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedProduct && analysisType === 'product' && (
              <div className="flex gap-4 ml-auto">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Prix BTC</p>
                  <p className="font-bold text-lg">{selectedProduct.prix_btc.toFixed(2)} €</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Coût revient</p>
                  <p className="font-bold text-lg">{selectedProduct.cost_total.toFixed(2)} €</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Marge</p>
                  <p className={`font-bold text-lg ${selectedProduct.margin >= 30 ? 'text-primary' : selectedProduct.margin < 15 ? 'text-destructive' : 'text-chart-4'}`}>
                    {selectedProduct.margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No data warning */}
      {productsWithCosts.length === 0 && (
        <Card className="border-chart-4/20 bg-chart-4/5">
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="h-6 w-6 text-chart-4" />
              <p className="text-muted-foreground">
                Aucun produit disponible. Créez des produits avec leurs coûts pour lancer l'analyse.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product sensitivity analysis */}
      {analysisType === 'product' && sensitivityData && (
        <>
          {/* Risk zones */}
          <SensitivityRiskZone
            productName={sensitivityData.product.nom_produit}
            costData={sensitivityData.costVariations}
            priceData={sensitivityData.priceVariations}
            volumeData={sensitivityData.volumeVariations}
          />

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <SensitivityChart
              title="Impact sur la marge %"
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
              costData={sensitivityData.costVariations}
              priceData={sensitivityData.priceVariations}
              volumeData={sensitivityData.volumeVariations}
              metric="marge_percent"
              metricLabel="Marge %"
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
            <SensitivityChart
              title="Impact sur la rentabilité"
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              costData={sensitivityData.costVariations}
              priceData={sensitivityData.priceVariations}
              volumeData={sensitivityData.volumeVariations}
              metric="rentabilite"
              metricLabel="Rentabilité"
              formatValue={(v) => `${v.toFixed(0)} €`}
            />
          </div>

          {/* Detailed tables */}
          <Tabs defaultValue="cost" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cost" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Variation coûts
              </TabsTrigger>
              <TabsTrigger value="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Variation prix
              </TabsTrigger>
              <TabsTrigger value="volume" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Variation volume
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cost" className="mt-4">
              <SensitivityTable
                title="Impact des variations de coût matières"
                icon={<TrendingUp className="h-5 w-5 text-chart-1" />}
                data={sensitivityData.costVariations}
                variationType="cost"
              />
            </TabsContent>
            <TabsContent value="price" className="mt-4">
              <SensitivityTable
                title="Impact des variations de prix de vente"
                icon={<DollarSign className="h-5 w-5 text-chart-2" />}
                data={sensitivityData.priceVariations}
                variationType="price"
              />
            </TabsContent>
            <TabsContent value="volume" className="mt-4">
              <SensitivityTable
                title="Impact des variations de volume"
                icon={<Package className="h-5 w-5 text-chart-3" />}
                data={sensitivityData.volumeVariations}
                variationType="volume"
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Category sensitivity analysis */}
      {analysisType === 'category' && categorySensitivityData && selectedCategory && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5 text-primary" />
                Catégorie: {selectedCategory.nom_categorie}
                <Badge variant="outline" className="ml-2">
                  {categorySensitivityData.categoryProducts.length} produit(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categorySensitivityData.categoryProducts.map((p) => (
                  <Badge key={p.id} variant="secondary">
                    {p.nom_produit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts for category */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SensitivityChart
              title="Impact catégorie sur la marge %"
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
              costData={categorySensitivityData.costVariations}
              priceData={categorySensitivityData.priceVariations}
              volumeData={categorySensitivityData.volumeVariations}
              metric="marge_percent"
              metricLabel="Marge %"
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
            <SensitivityChart
              title="Impact catégorie sur la rentabilité"
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              costData={categorySensitivityData.costVariations}
              priceData={categorySensitivityData.priceVariations}
              volumeData={categorySensitivityData.volumeVariations}
              metric="rentabilite"
              metricLabel="Rentabilité"
              formatValue={(v) => `${v.toFixed(0)} €`}
            />
          </div>

          {/* Detailed tables for category */}
          <Tabs defaultValue="cost" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cost">Variation coûts</TabsTrigger>
              <TabsTrigger value="price">Variation prix</TabsTrigger>
              <TabsTrigger value="volume">Variation volume</TabsTrigger>
            </TabsList>
            <TabsContent value="cost" className="mt-4">
              <SensitivityTable
                title="Impact catégorie - Variations coût"
                data={categorySensitivityData.costVariations}
                variationType="cost"
              />
            </TabsContent>
            <TabsContent value="price" className="mt-4">
              <SensitivityTable
                title="Impact catégorie - Variations prix"
                data={categorySensitivityData.priceVariations}
                variationType="price"
              />
            </TabsContent>
            <TabsContent value="volume" className="mt-4">
              <SensitivityTable
                title="Impact catégorie - Variations volume"
                data={categorySensitivityData.volumeVariations}
                variationType="volume"
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </AppLayout>
  );
};

export default Sensitivity;
