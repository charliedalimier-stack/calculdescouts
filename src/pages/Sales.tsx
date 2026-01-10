import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

interface SalesData {
  product: string;
  category: string;
  objectiveQty: number;
  realQty: number;
  objectiveCA: number;
  realCA: number;
  ecartQty: number;
  ecartCA: number;
  ecartPercent: number;
}

const salesData: SalesData[] = [
  {
    product: "Sauce tomate bio",
    category: "Sauces",
    objectiveQty: 250,
    realQty: 245,
    objectiveCA: 1375,
    realCA: 1347.50,
    ecartQty: -5,
    ecartCA: -27.50,
    ecartPercent: -2.0,
  },
  {
    product: "Confiture fraise",
    category: "Confitures",
    objectiveQty: 180,
    realQty: 195,
    objectiveCA: 1080,
    realCA: 1170,
    ecartQty: 15,
    ecartCA: 90,
    ecartPercent: 8.3,
  },
  {
    product: "Pesto basilic",
    category: "Sauces",
    objectiveQty: 150,
    realQty: 156,
    objectiveCA: 1125,
    realCA: 1170,
    ecartQty: 6,
    ecartCA: 45,
    ecartPercent: 4.0,
  },
  {
    product: "Terrine porc",
    category: "Terrines",
    objectiveQty: 100,
    realQty: 72,
    objectiveCA: 800,
    realCA: 576,
    ecartQty: -28,
    ecartCA: -224,
    ecartPercent: -28.0,
  },
  {
    product: "Jus de pomme",
    category: "Boissons",
    objectiveQty: 350,
    realQty: 320,
    objectiveCA: 1575,
    realCA: 1440,
    ecartQty: -30,
    ecartCA: -135,
    ecartPercent: -8.6,
  },
];

const totalObjectiveCA = salesData.reduce((sum, d) => sum + d.objectiveCA, 0);
const totalRealCA = salesData.reduce((sum, d) => sum + d.realCA, 0);
const totalEcart = totalRealCA - totalObjectiveCA;
const totalEcartPercent = ((totalRealCA - totalObjectiveCA) / totalObjectiveCA) * 100;

const getEcartBadge = (ecart: number) => {
  if (ecart > 0) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        +{ecart.toFixed(1)}%
      </Badge>
    );
  } else if (ecart >= -5) {
    return (
      <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
        {ecart.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
      {ecart.toFixed(1)}%
    </Badge>
  );
};

const Sales = () => {
  return (
    <AppLayout
      title="Suivi des ventes"
      subtitle="Comparez vos objectifs aux résultats réels"
    >
      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Target className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CA Objectif</p>
                <p className="text-xl font-bold">{totalObjectiveCA.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CA Réel</p>
                <p className="text-xl font-bold">{totalRealCA.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totalEcart >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {totalEcart >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écart CA</p>
                <p className={`text-xl font-bold ${totalEcart >= 0 ? "text-primary" : "text-destructive"}`}>
                  {totalEcart >= 0 ? "+" : ""}{totalEcart.toFixed(0)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totalEcartPercent >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                {totalEcartPercent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className={`text-xl font-bold ${totalEcartPercent >= 0 ? "text-primary" : "text-destructive"}`}>
                  {totalEcartPercent >= 0 ? "+" : ""}{totalEcartPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Détail par produit - Janvier 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Obj. Qté</TableHead>
                <TableHead className="text-right">Réel Qté</TableHead>
                <TableHead className="text-right">Obj. CA</TableHead>
                <TableHead className="text-right">Réel CA</TableHead>
                <TableHead className="text-right">Écart CA</TableHead>
                <TableHead className="text-center">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.product}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.objectiveQty}
                  </TableCell>
                  <TableCell className="text-right">{row.realQty}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.objectiveCA.toLocaleString()} €
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.realCA.toLocaleString()} €
                  </TableCell>
                  <TableCell className={`text-right ${row.ecartCA >= 0 ? "text-primary" : "text-destructive"}`}>
                    {row.ecartCA >= 0 ? "+" : ""}{row.ecartCA.toFixed(0)} €
                  </TableCell>
                  <TableCell className="text-center">
                    {getEcartBadge(row.ecartPercent)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-accent/50 font-semibold">
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell className="text-right">
                  {totalObjectiveCA.toLocaleString()} €
                </TableCell>
                <TableCell className="text-right">
                  {totalRealCA.toLocaleString()} €
                </TableCell>
                <TableCell className={`text-right ${totalEcart >= 0 ? "text-primary" : "text-destructive"}`}>
                  {totalEcart >= 0 ? "+" : ""}{totalEcart.toFixed(0)} €
                </TableCell>
                <TableCell className="text-center">
                  {getEcartBadge(totalEcartPercent)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Sales;
