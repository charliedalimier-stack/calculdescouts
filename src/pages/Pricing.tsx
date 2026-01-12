import { Calculator, Info, TrendingUp, AlertCircle, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProducts } from "@/hooks/useProducts";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { useMode } from "@/contexts/ModeContext";
import { cn } from "@/lib/utils";

const getMarginBadge = (margin: number, thresholds: { min: number; target: number }) => {
  if (margin >= thresholds.target) {
    return <Badge className="bg-primary/10 text-primary border-primary/20">{margin.toFixed(1)}%</Badge>;
  } else if (margin >= thresholds.min) {
    return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">{margin.toFixed(1)}%</Badge>;
  } else if (margin >= 0) {
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{margin.toFixed(1)}%</Badge>;
  }
  return <Badge className="bg-destructive text-destructive-foreground">{margin.toFixed(1)}%</Badge>;
};

const getCoefficientStatus = (coef: number, target: { min: number; cible: number }) => {
  if (coef >= target.cible) {
    return { status: "optimal", color: "text-primary" };
  } else if (coef >= target.min) {
    return { status: "acceptable", color: "text-chart-4" };
  }
  return { status: "insuffisant", color: "text-destructive" };
};

const formatCurrency = (value: number) => 
  value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const Pricing = () => {
  const { mode } = useMode();
  const { productsWithCosts, isLoadingWithCosts } = useProducts();
  const { settings, isLoading: isLoadingSettings, updateSettings } = useProjectSettings();

  // Handle real-time updates to settings
  const handleMargeBtbChange = (value: number[]) => {
    updateSettings.mutate({ marge_btb: value[0] });
  };

  const handleMargeDistributeurChange = (value: number[]) => {
    updateSettings.mutate({ marge_distributeur: value[0] });
  };

  const handleTvaVenteChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ tva_vente: numValue });
    }
  };

  const handleCoefficientMinChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateSettings.mutate({ coefficient_min: numValue });
    }
  };

  const handleCoefficientCibleChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateSettings.mutate({ coefficient_cible: numValue });
    }
  };

  const handleMargeMinChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ marge_min: numValue });
    }
  };

  const handleMargeCibleChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateSettings.mutate({ marge_cible: numValue });
    }
  };

  // Filter alert products based on current settings
  const alertProducts = productsWithCosts.filter(
    p => p.coefficient < settings.coefficient_min || p.margin_btb < settings.marge_min
  );

  const isLoading = isLoadingWithCosts || isLoadingSettings;

  if (isLoading) {
    return (
      <AppLayout title="Tarification" subtitle="Calculez vos prix de vente et analysez vos marges">
        <Card className="mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Tarification"
      subtitle={`Calculez vos prix de vente et analysez vos marges - Mode ${mode === 'simulation' ? 'Simulation' : 'Réel'}`}
    >
      {/* Parameters Card - All changes are applied in REAL-TIME */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-primary" />
            Paramètres de calcul
          </CardTitle>
          <CardDescription>
            Tous les changements sont appliqués immédiatement à la grille tarifaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Marge BTB */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Marge BTB</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prix BTB = Prix BTC × (1 - marge)</p>
                    <p>Ex: BTC 10€, marge 30% → BTB 7€</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.marge_btb]}
                  onValueChange={handleMargeBtbChange}
                  max={50}
                  min={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium text-primary">{settings.marge_btb}%</span>
              </div>
            </div>

            {/* Marge Distributeur */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Marge distributeur</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prix Distrib. = Prix BTB × (1 - marge)</p>
                    <p>Ex: BTB 7€, marge 15% → Distrib. 5,95€</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.marge_distributeur]}
                  onValueChange={handleMargeDistributeurChange}
                  max={30}
                  min={5}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium text-primary">{settings.marge_distributeur}%</span>
              </div>
            </div>

            {/* TVA Vente */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>TVA vente (%)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Taux de TVA applicable aux ventes</p>
                    <p>5,5% alimentaire, 20% standard</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.tva_vente}
                onChange={(e) => handleTvaVenteChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Coefficient cible */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Coefficient cible</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ratio prix de vente / coût de revient</p>
                    <p>Recommandé : 2.0 à 3.0</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={settings.coefficient_min}
                  onChange={(e) => handleCoefficientMinChange(e.target.value)}
                  className="w-20"
                />
                <span className="text-muted-foreground">à</span>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  value={settings.coefficient_cible}
                  onChange={(e) => handleCoefficientCibleChange(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Secondary parameters */}
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
            <div className="space-y-3">
              <Label>Marge minimale (%)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.marge_min}
                onChange={(e) => handleMargeMinChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Marge cible (%)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.marge_cible}
                onChange={(e) => handleMargeCibleChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table - Updates in REAL-TIME */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Grille tarifaire
            <Badge variant="outline" className="ml-2">
              {productsWithCosts.length} produit{productsWithCosts.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Les prix BTB et Distributeur sont calculés automatiquement selon les paramètres ci-dessus
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {productsWithCosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Aucun produit trouvé. Créez des produits pour voir la grille tarifaire.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Coût revient</TableHead>
                  <TableHead className="text-right">Prix BTC HT</TableHead>
                  <TableHead className="text-right">Prix BTC TTC</TableHead>
                  <TableHead className="text-right">Prix BTB HT</TableHead>
                  <TableHead className="text-right">Prix Distrib. HT</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead className="text-center">Marge BTC</TableHead>
                  <TableHead className="text-center">Marge BTB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithCosts.map((product) => {
                  const coeffStatus = getCoefficientStatus(product.coefficient, {
                    min: settings.coefficient_min,
                    cible: settings.coefficient_cible,
                  });
                  const marginThresholds = { min: settings.marge_min, target: settings.marge_cible };
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.nom_produit}</TableCell>
                      <TableCell>
                        {product.category_name ? (
                          <Badge variant="outline">{product.category_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(product.cost_total)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.prix_btc)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.prix_btc_ttc)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-chart-2">
                        {formatCurrency(product.prix_btb)}
                      </TableCell>
                      <TableCell className="text-right text-chart-3">
                        {formatCurrency(product.prix_distributor)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-semibold", coeffStatus.color)}>
                          {product.coefficient.toFixed(2)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getMarginBadge(product.margin, marginThresholds)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getMarginBadge(product.margin_btb, marginThresholds)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alerts - Updates in REAL-TIME */}
      {alertProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Produits à surveiller
              <Badge variant="destructive" className="ml-2">{alertProducts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertProducts.map((product) => {
                const isCoefIssue = product.coefficient < settings.coefficient_min;
                const isMarginIssue = product.margin_btb < settings.marge_min;
                
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.nom_produit}</p>
                      <p className="text-sm text-muted-foreground">
                        {isCoefIssue && (
                          <span>Coefficient insuffisant ({product.coefficient.toFixed(2)}x &lt; {settings.coefficient_min}x)</span>
                        )}
                        {isCoefIssue && isMarginIssue && <span> • </span>}
                        {isMarginIssue && (
                          <span>Marge BTB trop faible ({product.margin_btb.toFixed(1)}% &lt; {settings.marge_min}%)</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Prix minimum conseillé</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(product.cost_total * settings.coefficient_min)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Pricing;