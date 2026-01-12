import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Apple, Box, AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { StockSummary } from "@/hooks/useStocks";

interface StockSummaryCardsProps {
  summary: StockSummary;
}

export function StockSummaryCards({ summary }: StockSummaryCardsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const cards = [
    {
      title: "Ingrédients",
      value: formatCurrency(summary.totalIngredients),
      icon: Apple,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Emballages",
      value: formatCurrency(summary.totalPackaging),
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Produits finis",
      value: formatCurrency(summary.totalProducts),
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Valeur totale",
      value: formatCurrency(summary.totalValue),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Variation mensuelle",
      value: formatCurrency(summary.monthlyVariation),
      icon: TrendingUp,
      color: summary.monthlyVariation >= 0 ? "text-green-500" : "text-red-500",
      bgColor:
        summary.monthlyVariation >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      title: "Stock en alerte",
      value: summary.lowStockCount.toString(),
      icon: AlertTriangle,
      color: summary.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground",
      bgColor:
        summary.lowStockCount > 0
          ? "bg-destructive/10"
          : "bg-muted",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
