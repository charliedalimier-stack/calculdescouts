import { useState } from "react";
import { Calculator, Info, TrendingUp, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const getMarginBadge = (margin: number) => {
  if (margin >= 40) {
    return <Badge className="bg-primary/10 text-primary border-primary/20">{margin.toFixed(1)}%</Badge>;
  } else if (margin >= 25) {
    return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">{margin.toFixed(1)}%</Badge>;
  } else if (margin >= 0) {
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{margin.toFixed(1)}%</Badge>;
  }
  return <Badge className="bg-destructive text-destructive-foreground">{margin.toFixed(1)}%</Badge>;
};

const getCoefficientStatus = (coef: number, target: { min: number; max: number }) => {
  if (coef >= target.min && coef <= target.max) {
    return { status: "optimal", color: "text-primary" };
  } else if (coef >= target.min * 0.9) {
    return { status: "acceptable", color: "text-chart-4" };
  }
  return { status: "insuffisant", color: "text-destructive" };
};

const Pricing = () => {
  const { productsWithCosts, isLoading } = useProducts();
  const [btbMarginTarget, setBtbMarginTarget] = useState(30);
  const [distributorMargin, setDistributorMargin] = useState(15);
  const [coefficientTarget, setCoefficientTarget] = useState({ min: 2.0, max: 3.0 });

  // Calculate margins for BTB based on cost
  const productsWithMargins = productsWithCosts.map(product => {
    const marginBtb = product.prix_btb > 0 
      ? ((product.prix_btb - product.cost_total) / product.prix_btb) * 100 
      : 0;
    const marginDist = product.prix_distributor > 0 
      ? ((product.prix_distributor - product.cost_total) / product.prix_distributor) * 100 
      : 0;
    
    return {
      ...product,
      marginBtb,
      marginDist,
    };
  });

  const alertProducts = productsWithMargins.filter(
    p => p.coefficient < coefficientTarget.min || (p.prix_btb > 0 && ((p.prix_btb - p.cost_total) / p.prix_btb) * 100 < 25)
  );

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
      subtitle="Calculez vos prix de vente et analysez vos marges"
    >
      {/* Parameters Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-primary" />
            Paramètres de calcul
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Marge cible BTB</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prix BTB = 70% du prix BTC (marge de 30%)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[btbMarginTarget]}
                  onValueChange={(value) => setBtbMarginTarget(value[0])}
                  max={50}
                  min={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{btbMarginTarget}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Marge distributeur</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prix Distributeur = 85% du prix BTB (marge de 15%)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[distributorMargin]}
                  onValueChange={(value) => setDistributorMargin(value[0])}
                  max={30}
                  min={5}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{distributorMargin}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Coefficient cible</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ratio prix de vente / coût de revient recommandé</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={coefficientTarget.min}
                  onChange={(e) =>
                    setCoefficientTarget({ ...coefficientTarget, min: parseFloat(e.target.value) || 0 })
                  }
                  className="w-20"
                />
                <span className="text-muted-foreground">à</span>
                <Input
                  type="number"
                  step="0.1"
                  value={coefficientTarget.max}
                  onChange={(e) =>
                    setCoefficientTarget({ ...coefficientTarget, max: parseFloat(e.target.value) || 0 })
                  }
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Grille tarifaire
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {productsWithMargins.length === 0 ? (
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
                  <TableHead className="text-right">Prix BTC</TableHead>
                  <TableHead className="text-right">Prix BTB</TableHead>
                  <TableHead className="text-right">Prix Distrib.</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead className="text-center">Marge BTC</TableHead>
                  <TableHead className="text-center">Marge BTB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithMargins.map((product) => {
                  const coeffStatus = getCoefficientStatus(product.coefficient, coefficientTarget);
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
                      <TableCell className="text-right">{product.cost_total.toFixed(2)} €</TableCell>
                      <TableCell className="text-right font-medium">{product.prix_btc.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{product.prix_btb.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{product.prix_distributor.toFixed(2)} €</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${coeffStatus.color}`}>
                          {product.coefficient.toFixed(2)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{getMarginBadge(product.margin)}</TableCell>
                      <TableCell className="text-center">{getMarginBadge(product.marginBtb)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {alertProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Produits à surveiller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.nom_produit}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.coefficient < coefficientTarget.min
                        ? `Coefficient insuffisant (${product.coefficient.toFixed(2)}x < ${coefficientTarget.min}x)`
                        : `Marge BTB trop faible (${product.marginBtb.toFixed(1)}%)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prix minimum conseillé</p>
                    <p className="text-lg font-semibold text-primary">
                      {(product.cost_total * coefficientTarget.min).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Pricing;
