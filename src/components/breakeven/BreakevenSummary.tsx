import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { BreakevenSummary as BreakevenSummaryType } from "@/hooks/useBreakevenAnalysis";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  ShoppingBag,
  Store,
  Truck 
} from "lucide-react";

interface BreakevenSummaryProps {
  summary: BreakevenSummaryType;
  coutFixeTotal: number;
}

export function BreakevenSummary({ summary, coutFixeTotal }: BreakevenSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalProducts = summary.nbProduitsRentables + summary.nbProduitsSousSeuil;
  const percentRentable = totalProducts > 0 
    ? (summary.nbProduitsRentables / totalProducts) * 100 
    : 0;

  const getMargeColor = (marge: number) => {
    if (marge >= 30) return "text-chart-2";
    if (marge >= 15) return "text-primary";
    if (marge >= 0) return "text-amber-600";
    return "text-destructive";
  };

  const getMargeStatus = (marge: number) => {
    if (marge >= 30) return { label: "Excellente", color: "bg-chart-2" };
    if (marge >= 15) return { label: "Correcte", color: "bg-primary" };
    if (marge >= 0) return { label: "Faible", color: "bg-amber-500" };
    return { label: "Critique", color: "bg-destructive" };
  };

  const margeStatus = getMargeStatus(summary.margeSecuriteGlobale);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Seuil global en unités */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seuil global
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.seuilGlobalUnites.toLocaleString('fr-FR')}
            </div>
            <p className="text-xs text-muted-foreground">
              unités minimum à vendre
            </p>
          </CardContent>
        </Card>

        {/* CA minimum */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CA minimum
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.seuilGlobalCA)}
            </div>
            <p className="text-xs text-muted-foreground">
              pour atteindre l'équilibre
            </p>
          </CardContent>
        </Card>

        {/* Marge de sécurité */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Marge de sécurité
            </CardTitle>
            <div className={`h-2 w-2 rounded-full ${margeStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMargeColor(summary.margeSecuriteGlobale)}`}>
              {summary.margeSecuriteGlobale >= 0 ? '+' : ''}{summary.margeSecuriteGlobale.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {margeStatus.label} - au-dessus du seuil
            </p>
          </CardContent>
        </Card>

        {/* Produits rentables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produits rentables
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.nbProduitsRentables}/{totalProducts}
            </div>
            <Progress value={percentRentable} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Rentabilité par canal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rentabilité par canal de vente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* BTC */}
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-primary/10 p-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Vente directe (BTC)</p>
                <p className="text-2xl font-bold">{summary.produitsParCanal.btc}</p>
                <p className="text-xs text-muted-foreground">produits rentables</p>
              </div>
            </div>

            {/* BTB */}
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-chart-1/10 p-2">
                <Store className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm font-medium">Professionnels (BTB)</p>
                <p className="text-2xl font-bold">{summary.produitsParCanal.btb}</p>
                <p className="text-xs text-muted-foreground">produits rentables</p>
              </div>
            </div>

            {/* Distributeur */}
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-chart-3/10 p-2">
                <Truck className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm font-medium">Distributeurs</p>
                <p className="text-2xl font-bold">{summary.produitsParCanal.distributeur}</p>
                <p className="text-xs text-muted-foreground">produits rentables</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {summary.nbProduitsSousSeuil > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            {summary.nbProduitsSousSeuil} produit(s) sont actuellement sous leur seuil de rentabilité.
            Envisagez d'augmenter les prix, de réduire les coûts ou d'augmenter les volumes de vente.
          </AlertDescription>
        </Alert>
      )}

      {summary.margeSecuriteGlobale < 15 && summary.margeSecuriteGlobale >= 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Marge de sécurité faible</AlertTitle>
          <AlertDescription>
            Votre marge de sécurité globale est de seulement {summary.margeSecuriteGlobale.toFixed(1)}%.
            Une baisse des ventes de plus de {summary.margeSecuriteGlobale.toFixed(0)}% vous mettrait en situation de perte.
          </AlertDescription>
        </Alert>
      )}

      {coutFixeTotal === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Coûts fixes non renseignés</AlertTitle>
          <AlertDescription>
            Aucun coût fixe n'a été renseigné. Les calculs de seuil de rentabilité sont basés uniquement sur les coûts variables.
            Ajoutez vos coûts fixes pour un calcul plus précis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
