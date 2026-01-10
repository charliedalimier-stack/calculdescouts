import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Alert {
  product: string;
  type: "danger" | "warning" | "success";
  message: string;
  value?: string;
}

const alerts: Alert[] = [
  {
    product: "Rillettes",
    type: "danger",
    message: "Marge insuffisante",
    value: "22%",
  },
  {
    product: "Terrine porc",
    type: "danger",
    message: "Coefficient trop bas",
    value: "1.8x",
  },
  {
    product: "Jus pomme",
    type: "warning",
    message: "Marge limite",
    value: "35%",
  },
  {
    product: "Pesto basilic",
    type: "success",
    message: "Très performant",
    value: "52%",
  },
];

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

export function ProductAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Alertes produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => {
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
        })}
      </CardContent>
    </Card>
  );
}
