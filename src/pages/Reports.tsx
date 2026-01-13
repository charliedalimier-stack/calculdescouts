import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FinancialReport } from "@/components/reports/FinancialReport";
import { ProductReport } from "@/components/reports/ProductReport";
import { SalesReport } from "@/components/reports/SalesReport";
import { StockReport } from "@/components/reports/StockReport";
import { getYearOptions, getCurrentYear } from "@/lib/dateOptions";
import { useMode } from "@/contexts/ModeContext";
import { FileText, Package, TrendingUp, Warehouse, Download, Printer } from "lucide-react";

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear().toString());
  const [activeTab, setActiveTab] = useState("financial");
  const { mode } = useMode();
  const yearOptions = getYearOptions();

  const handlePrint = () => {
    window.print();
  };

  const reportTabs = [
    { id: "financial", label: "Financier", icon: FileText, description: "CA, marges, résultats et TVA" },
    { id: "products", label: "Produits", icon: Package, description: "Rentabilité et coefficients" },
    { id: "sales", label: "Ventes", icon: TrendingUp, description: "Performance vs objectifs" },
    { id: "stocks", label: "Stocks", icon: Warehouse, description: "Inventaire et valorisation" },
  ];

  return (
    <AppLayout title="Rapports thématiques">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapports thématiques</h1>
            <p className="text-muted-foreground">
              Analyses détaillées par domaine • Mode: <span className="font-medium capitalize">{mode}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report Type Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {reportTabs.map((tab) => (
            <Card
              key={tab.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === tab.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <tab.icon className="h-5 w-5 text-primary" />
                  {tab.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tab.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {reportTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rapport Financier {selectedYear}
                </CardTitle>
                <CardDescription>
                  Synthèse complète des indicateurs financiers : chiffre d'affaires, marges, résultat net et TVA
                </CardDescription>
              </CardHeader>
            </Card>
            <FinancialReport year={parseInt(selectedYear)} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Rapport Produits
                </CardTitle>
                <CardDescription>
                  Analyse de la rentabilité produit : coûts de revient, coefficients, contributions à la marge
                </CardDescription>
              </CardHeader>
            </Card>
            <ProductReport />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rapport Ventes {selectedYear}
                </CardTitle>
                <CardDescription>
                  Performance commerciale : comparaison objectifs vs réalisé par canal et par période
                </CardDescription>
              </CardHeader>
            </Card>
            <SalesReport year={parseInt(selectedYear)} />
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Rapport Stocks
                </CardTitle>
                <CardDescription>
                  État des stocks : valorisation, alertes de rupture, taux de rotation
                </CardDescription>
              </CardHeader>
            </Card>
            <StockReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
