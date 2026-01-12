import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

interface TVASummaryCardsProps {
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
  tauxVente: number;
  tauxAchat: number;
  isFranchise?: boolean;
}

export function TVASummaryCards({
  tvaCollectee,
  tvaDeductible,
  tvaNette,
  tauxVente,
  tauxAchat,
  isFranchise = false,
}: TVASummaryCardsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
          <div className="rounded-full bg-green-500/10 p-2">
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {isFranchise ? "N/A" : formatCurrency(tvaCollectee)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isFranchise ? "Franchise de taxe" : `Taux par défaut: ${tauxVente}%`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">TVA Déductible</CardTitle>
          <div className="rounded-full bg-blue-500/10 p-2">
            <ArrowDownCircle className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {isFranchise ? "N/A" : formatCurrency(tvaDeductible)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isFranchise ? "Franchise de taxe" : `Taux par défaut: ${tauxAchat}%`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">TVA Nette</CardTitle>
          <div
            className={`rounded-full p-2 ${
              tvaNette >= 0 ? "bg-amber-500/10" : "bg-green-500/10"
            }`}
          >
            <Receipt
              className={`h-4 w-4 ${
                tvaNette >= 0 ? "text-amber-500" : "text-green-500"
              }`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isFranchise ? "text-muted-foreground" : tvaNette >= 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            {isFranchise ? "N/A" : formatCurrency(tvaNette)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isFranchise ? "Non applicable" : tvaNette >= 0 ? "À reverser" : "Crédit de TVA"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impact Trésorerie</CardTitle>
          <div className="rounded-full bg-primary/10 p-2">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isFranchise ? "text-muted-foreground" : tvaNette <= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {isFranchise ? "N/A" : formatCurrency(-tvaNette)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isFranchise ? "Non applicable" : tvaNette <= 0 ? "Remboursement attendu" : "Décaissement prévu"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
