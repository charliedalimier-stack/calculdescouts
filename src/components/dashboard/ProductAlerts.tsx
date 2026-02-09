import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { Skeleton } from "@/components/ui/skeleton";

interface Alert {
  product: string;
  type: "danger" | "warning" | "success";
  message: string;
  value: string;
}

const getAlertStyles = (type: Alert["type"]) => {
  switch (type) {
    case "danger":
      return {
        icon: AlertTriangle,
        badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
        iconClass: "text-destructive",
      };
    case "warning":
      return {
        icon: TrendingDown,
        badgeClass: "bg-chart-4/10 text-chart-4 border-chart-4/20",
        iconClass: "text-chart-4",
      };
    case "success":
      return {
        icon: TrendingUp,
        badgeClass: "bg-primary/10 text-primary border-primary/20",
        iconClass: "text-primary",
      };
  }
};

interface ProductAlertsProps {
  mode?: 'budget' | 'reel';
}

export function ProductAlerts({ mode = 'budget' }: ProductAlertsProps) {
  const { productsWithCosts, isLoadingWithCosts } = useProducts(mode);
  const { settings, isLoading: isLoadingSettings } = useProjectSettings();

  

  const isLoading = isLoadingWithCosts || isLoadingSettings;

  // Generate alerts based on actual product data
  const alerts: Alert[] = (productsWithCosts || [])
    .map((product): Alert | null => {
      const margin = product.margin;
      const coefficient = product.coefficient;

      const margeMin = settings?.marge_min ?? 30;
      const margeCible = settings?.marge_cible ?? 40;
      const coeffMin = settings?.coefficient_min ?? 2;

      // Determine alert type and message
      if (margin < margeMin) {
        return {
          product: product.nom_produit,
          type: "danger",
          message: "Marge insuffisante",
          value: `${margin.toFixed(0)}%`,
        };
      } else if (coefficient > 0 && coefficient < coeffMin) {
        return {
          product: product.nom_produit,
          type: "danger",
          message: "Coefficient trop bas",
          value: `${coefficient.toFixed(1)}x`,
        };
      } else if (margin >= margeMin && margin < margeCible) {
        return {
          product: product.nom_produit,
          type: "warning",
          message: "Marge limite",
          value: `${margin.toFixed(0)}%`,
        };
      } else if (margin >= margeCible) {
        return {
          product: product.nom_produit,
          type: "success",
          message: "Très performant",
          value: `${margin.toFixed(0)}%`,
        };
      }
      return null;
    })
    .filter((alert): alert is Alert => alert !== null)
    // Sort by priority: danger first, then warning, then success
    .sort((a, b) => {
      const priority = { danger: 0, warning: 1, success: 2 };
      return priority[a.type] - priority[b.type];
    })
    .slice(0, 6); // Limit to 6 alerts

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Alertes produits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-[60px]" />
          <Skeleton className="h-[60px]" />
          <Skeleton className="h-[60px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Alertes produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Aucun produit à analyser
          </div>
        ) : (
          alerts.map((alert, index) => {
            const styles = getAlertStyles(alert.type);
            const Icon = styles.icon;

            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", styles.iconClass)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {alert.product}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                <Badge variant="outline" className={styles.badgeClass}>
                  {alert.value}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
