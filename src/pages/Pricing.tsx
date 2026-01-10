import { useState } from "react";
import { Calculator, Info, TrendingUp, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

interface PricingProduct {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  priceBTC: number;
  priceBTB: number;
  priceDistributor: number;
  coefficient: number;
  marginBTC: number;
  marginBTB: number;
  marginDist: number;
}

const initialProducts: PricingProduct[] = [
  {
    id: "1",
    name: "Sauce tomate bio",
    category: "Sauces",
    costPrice: 2.43,
    priceBTC: 5.50,
    priceBTB: 4.23,
    priceDistributor: 3.60,
    coefficient: 2.26,
    marginBTC: 55.8,
    marginBTB: 42.6,
    marginDist: 32.5,
  },
  {
    id: "2",
    name: "Confiture fraise",
    category: "Confitures",
    costPrice: 2.72,
    priceBTC: 6.00,
    priceBTB: 4.62,
    priceDistributor: 3.92,
    coefficient: 2.21,
    marginBTC: 54.7,
    marginBTB: 41.1,
    marginDist: 30.6,
  },
  {
    id: "3",
    name: "Pesto basilic",
    category: "Sauces",
    costPrice: 3.25,
    priceBTC: 7.50,
    priceBTB: 5.77,
    priceDistributor: 4.90,
    coefficient: 2.31,
    marginBTC: 56.7,
    marginBTB: 43.7,
    marginDist: 33.7,
  },
  {
    id: "4",
    name: "Terrine porc",
    category: "Terrines",
    costPrice: 5.76,
    priceBTC: 8.00,
    priceBTB: 6.15,
    priceDistributor: 5.23,
    coefficient: 1.39,
    marginBTC: 28.0,
    marginBTB: 6.4,
    marginDist: -10.1,
  },
  {
    id: "5",
    name: "Jus de pomme",
    category: "Boissons",
    costPrice: 2.25,
    priceBTC: 4.50,
    priceBTB: 3.46,
    priceDistributor: 2.94,
    coefficient: 2.00,
    marginBTC: 50.0,
    marginBTB: 35.0,
    marginDist: 23.5,
  },
];

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
  const [products] = useState<PricingProduct[]>(initialProducts);
  const [btbMarginTarget, setBtbMarginTarget] = useState(30);
  const [distributorMargin, setDistributorMargin] = useState(15);
  const [coefficientTarget, setCoefficientTarget] = useState({ min: 2.0, max: 3.0 });

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
                    <p>Marge appliquée pour calculer le prix BTB à partir du BTC</p>
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
                    <p>Marge accordée au distributeur sur le prix BTB</p>
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
                    setCoefficientTarget({ ...coefficientTarget, min: parseFloat(e.target.value) })
                  }
                  className="w-20"
                />
                <span className="text-muted-foreground">à</span>
                <Input
                  type="number"
                  step="0.1"
                  value={coefficientTarget.max}
                  onChange={(e) =>
                    setCoefficientTarget({ ...coefficientTarget, max: parseFloat(e.target.value) })
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
              {products.map((product) => {
                const coeffStatus = getCoefficientStatus(product.coefficient, coefficientTarget);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{product.costPrice.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-medium">{product.priceBTC.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{product.priceBTB.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{product.priceDistributor.toFixed(2)} €</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${coeffStatus.color}`}>
                        {product.coefficient.toFixed(2)}x
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{getMarginBadge(product.marginBTC)}</TableCell>
                    <TableCell className="text-center">{getMarginBadge(product.marginBTB)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Produits à surveiller
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products
              .filter((p) => p.coefficient < coefficientTarget.min || p.marginBTB < 25)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.coefficient < coefficientTarget.min
                        ? `Coefficient insuffisant (${product.coefficient.toFixed(2)}x < ${coefficientTarget.min}x)`
                        : `Marge BTB trop faible (${product.marginBTB.toFixed(1)}%)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prix minimum conseillé</p>
                    <p className="text-lg font-semibold text-primary">
                      {(product.costPrice * coefficientTarget.min).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Pricing;
