import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BCGMatrix } from "@/components/dashboard/BCGMatrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb, Info } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductSalesAnalysis } from "@/hooks/useAnnualSalesEntry";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PeriodSelector, DataMode } from "@/components/layout/PeriodSelector";
import { getCurrentYear } from "@/lib/dateOptions";

const getQuadrant = (margin: number, volume: number, avgMargin: number, avgVolume: number) => {
  if (margin >= avgMargin && volume >= avgVolume) return "star";
  if (margin >= avgMargin && volume < avgVolume) return "dilemma";
  if (margin < avgMargin && volume >= avgVolume) return "cashcow";
  return "dog";
};


const Matrix = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [dataMode, setDataMode] = useState<DataMode>('budget');

  const handlePeriodChange = ({ year, mode }: { month?: number; year: number; mode: DataMode }) => {
    setSelectedYear(year);
    setDataMode(mode);
  };

  const { productsWithCosts, isLoadingWithCosts } = useProducts(dataMode);
  const { productSales, isLoading: isLoadingSales } = useProductSalesAnalysis(selectedYear);

  // Group real products by BCG quadrant
  const productsByQuadrant = useMemo(() => {
    if (!productsWithCosts || !productSales || productSales.length === 0) {
      return { star: [], cashcow: [], dilemma: [], dog: [] };
    }

    

    // Create a map of product sales volumes based on mode
    const volumeMap: Record<string, number> = {};
    productSales.forEach((sale) => {
      const volume = dataMode === 'budget' ? sale.budget_qty : sale.reel_qty;
      volumeMap[sale.product_id] = (volumeMap[sale.product_id] || 0) + volume;
    });

    const productData = productsWithCosts
      .filter((p) => p.margin !== null && p.margin !== undefined)
      .map((p) => ({
        id: p.id,
        name: p.nom_produit,
        margin: Number((p.margin || 0).toFixed(1)),
        volume: volumeMap[p.id] || 0,
        coefficient: p.coefficient,
      }));

    if (productData.length === 0) {
      return { star: [], cashcow: [], dilemma: [], dog: [] };
    }

    const totalMargin = productData.reduce((sum, p) => sum + p.margin, 0);
    const totalVolume = productData.reduce((sum, p) => sum + p.volume, 0);
    const avgMargin = totalMargin / productData.length;
    const avgVolume = totalVolume / productData.length;

    const grouped = {
      star: [] as typeof productData,
      cashcow: [] as typeof productData,
      dilemma: [] as typeof productData,
      dog: [] as typeof productData,
    };

    productData.forEach((p) => {
      const quadrant = getQuadrant(p.margin, p.volume, avgMargin, avgVolume);
      grouped[quadrant as keyof typeof grouped].push(p);
    });

    return grouped;
  }, [productsWithCosts, productSales, dataMode]);

  const isLoading = isLoadingWithCosts || isLoadingSales;

  const renderProductBadges = (products: typeof productsByQuadrant.star, colorClass: string, bgClass: string) => {
    if (products.length === 0) {
      return <span className="text-xs text-muted-foreground italic">Aucun produit dans cette catégorie</span>;
    }
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {products.slice(0, 4).map((product) => (
          <TooltipProvider key={product.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`rounded-full ${bgClass} px-3 py-1 text-xs font-medium ${colorClass}`}>
                  {product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Marge: {product.margin}% | Volume: {product.volume} | Coef: {product.coefficient.toFixed(2)}x
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {products.length > 4 && (
          <span className={`rounded-full ${bgClass} px-3 py-1 text-xs font-medium ${colorClass}`}>
            +{products.length - 4} autres
          </span>
        )}
      </div>
    );
  };

  return (
    <AppLayout
      title="Matrice BCG"
      subtitle="Analysez le positionnement stratégique de vos produits"
    >
      {/* Period Selector */}
      <div className="mb-6">
        <PeriodSelector
          year={selectedYear}
          mode={dataMode}
          showMonth={false}
          onChange={handlePeriodChange}
        />
      </div>

      <div className="mb-6">
        <Card className="bg-accent/30">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Comment interpréter cette matrice ?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                La matrice BCG croise la rentabilité (axe X) et le volume des ventes (axe Y) pour identifier 
                4 catégories de produits : les Stars (à développer), les Cash Cows (à maintenir), 
                les Dilemmes (à analyser) et les Dogs (à supprimer ou repositionner).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BCGMatrix year={selectedYear} mode={dataMode} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              Recommandations stratégiques
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Les produits affichés proviennent de vos données réelles. 
                    La classification est basée sur la marge et le volume de ventes.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    ⭐ Stars - À développer
                    <Badge variant="outline" className="ml-auto">
                      {productsByQuadrant.star.length} produit{productsByQuadrant.star.length !== 1 ? "s" : ""}
                    </Badge>
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ces produits génèrent du volume ET de la marge. Investissez dans leur promotion, 
                    augmentez leur visibilité et développez des déclinaisons.
                  </p>
                  {renderProductBadges(productsByQuadrant.star, "text-primary", "bg-primary/10")}
                </div>

                <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    💰 Cash Cows - À maintenir
                    <Badge variant="outline" className="ml-auto">
                      {productsByQuadrant.cashcow.length} produit{productsByQuadrant.cashcow.length !== 1 ? "s" : ""}
                    </Badge>
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ces produits vendent bien mais avec une marge modérée. Maintenez leur qualité, 
                    évitez les investissements lourds, et utilisez leur trésorerie pour développer les Stars.
                  </p>
                  {renderProductBadges(productsByQuadrant.cashcow, "text-[hsl(var(--chart-2))]", "bg-chart-2/10")}
                </div>

                <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    ❓ Dilemmes - À analyser
                    <Badge variant="outline" className="ml-auto">
                      {productsByQuadrant.dilemma.length} produit{productsByQuadrant.dilemma.length !== 1 ? "s" : ""}
                    </Badge>
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Rentables mais faible volume. Analysez le potentiel : si le marché existe, 
                    investissez en communication. Sinon, considérez l'abandon.
                  </p>
                  {renderProductBadges(productsByQuadrant.dilemma, "text-[hsl(var(--chart-4))]", "bg-chart-4/10")}
                </div>

                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    🐶 Dogs - À repositionner
                    <Badge variant="outline" className="ml-auto">
                      {productsByQuadrant.dog.length} produit{productsByQuadrant.dog.length !== 1 ? "s" : ""}
                    </Badge>
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Faible volume ET faible marge. Analysez les causes : problème de prix, de qualité, 
                    de positionnement ? Décidez entre repositionnement ou arrêt.
                  </p>
                  {renderProductBadges(productsByQuadrant.dog, "text-destructive", "bg-destructive/10")}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Matrix;