import {
  TrendingUp,
  Package,
  Wallet,
  BarChart3,
  ChefHat,
  CircleDollarSign,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { BCGMatrix } from "@/components/dashboard/BCGMatrix";
import { ProductAlerts } from "@/components/dashboard/ProductAlerts";

const Index = () => {
  return (
    <AppLayout
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
    >
      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Chiffre d'affaires"
          value="31 500 €"
          change="+12% vs mois dernier"
          changeType="positive"
          icon={TrendingUp}
          tooltip="Total des ventes du mois en cours"
        />
        <KPICard
          title="Marge brute moyenne"
          value="38.5%"
          change="+2.1 pts vs objectif"
          changeType="positive"
          icon={CircleDollarSign}
          tooltip="Marge moyenne pondérée par le CA"
        />
        <KPICard
          title="Produits actifs"
          value="12"
          change="3 nouveaux ce mois"
          changeType="neutral"
          icon={Package}
          tooltip="Nombre de produits en vente"
        />
        <KPICard
          title="Cash-flow mensuel"
          value="4 250 €"
          change="Trésorerie positive"
          changeType="positive"
          icon={Wallet}
          tooltip="Flux de trésorerie du mois"
        />
      </div>

      {/* Main Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <SalesChart />
        <ProductAlerts />
      </div>

      {/* Secondary Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <MarginChart />
        <CategoryPieChart />
      </div>

      {/* BCG Matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BCGMatrix />
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <ChefHat className="h-5 w-5 text-primary" />
            Produits phares du mois
          </h3>
          <div className="space-y-4">
            {[
              { name: "Sauce tomate bio", sold: 245, revenue: "2 450 €", margin: "45%" },
              { name: "Confiture fraise", sold: 180, revenue: "1 800 €", margin: "38%" },
              { name: "Pesto basilic", sold: 156, revenue: "1 872 €", margin: "52%" },
              { name: "Jus de pomme", sold: 320, revenue: "1 600 €", margin: "35%" },
            ].map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sold} unités vendues
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{product.revenue}</p>
                  <p className="text-sm text-primary">{product.margin} marge</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
