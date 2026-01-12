import { useState } from "react";
import { toast } from "sonner";
import { cashFlowSchema, getValidationError } from "@/lib/validations";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Plus, Trash2, Receipt } from "lucide-react";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useExpenses } from "@/hooks/useExpenses";

const getSoldeBadge = (solde: number) => {
  if (solde > 0) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        +{solde.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
      </Badge>
    );
  } else if (solde === 0) {
    return <Badge variant="outline">0 €</Badge>;
  }
  return (
    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
      {solde.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
    </Badge>
  );
};

const CashFlow = () => {
  const { 
    cashFlowEntries, 
    cashFlowData, 
    currentMonth, 
    hasNegativeCashFlow, 
    isLoading,
    addCashFlowEntry,
    deleteCashFlowEntry,
  } = useCashFlow();
  
  const { summary: expensesSummary, isLoading: isLoadingExpenses } = useExpenses();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    mois: new Date().toISOString().slice(0, 7) + '-01',
    encaissements: 0,
    decaissements: 0,
    delai_paiement_jours: 30,
    notes: '',
  });

  const handleAddEntry = () => {
    const data = {
      mois: newEntry.mois,
      encaissements: newEntry.encaissements,
      decaissements: newEntry.decaissements,
      delai_paiement_jours: newEntry.delai_paiement_jours,
      notes: newEntry.notes || null,
    };

    const error = getValidationError(cashFlowSchema, data);
    if (error) {
      toast.error(error);
      return;
    }

    addCashFlowEntry.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewEntry({
          mois: new Date().toISOString().slice(0, 7) + '-01',
          encaissements: 0,
          decaissements: 0,
          delai_paiement_jours: 30,
          notes: '',
        });
      },
    });
  };

  // Calculate cash flow data with expenses
  const cashFlowDataWithExpenses = cashFlowData.map(row => {
    const monthKey = row.month.slice(0, 7);
    const monthExpenses = expensesSummary.by_month[monthKey] || 0;
    return {
      ...row,
      fraisPro: monthExpenses,
      soldeApresFrais: row.solde - monthExpenses,
    };
  });

  // Calculate cumulative with expenses
  let cumulApresFrais = 0;
  const cashFlowDataFinal = cashFlowDataWithExpenses.map(row => {
    cumulApresFrais += row.soldeApresFrais;
    return {
      ...row,
      cumulApresFrais,
    };
  });

  const currentMonthExpenses = expensesSummary.by_month[new Date().toISOString().slice(0, 7)] || 0;
  const soldeApresFrais = currentMonth.solde - currentMonthExpenses;
  const hasNegativeAfterExpenses = cashFlowDataFinal.some(d => d.cumulApresFrais < 0);

  if (isLoading || isLoadingExpenses) {
    return (
      <AppLayout title="Cash-flow" subtitle="Suivez votre trésorerie mensuelle">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Cash-flow"
      subtitle="Suivez votre trésorerie mensuelle"
    >
      {/* Alert if negative */}
      {hasNegativeCashFlow && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Attention : trésorerie négative détectée</p>
              <p className="text-sm text-muted-foreground">
                Certains mois présentent un solde cumulé négatif. Revoyez vos délais de paiement ou votre plan de production.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert for expenses impact */}
      {hasNegativeAfterExpenses && !hasNegativeCashFlow && (
        <Card className="mb-6 border-chart-4/50 bg-chart-4/5">
          <CardContent className="flex items-center gap-4 p-4">
            <Receipt className="h-5 w-5 text-chart-4" />
            <div>
              <p className="font-medium text-chart-4">Impact des frais professionnels</p>
              <p className="text-sm text-muted-foreground">
                Votre trésorerie production est positive, mais devient négative après prise en compte des frais professionnels.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Row 1 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encaissements</p>
                <p className="text-xl font-bold">{currentMonth.encaissements.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Décaissements (prod.)</p>
                <p className="text-xl font-bold">{currentMonth.decaissements.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
                <Receipt className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frais professionnels</p>
                <p className="text-xl font-bold">{currentMonthExpenses.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                currentMonth.solde >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                <Wallet className={`h-5 w-5 ${currentMonth.solde >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde production</p>
                <p className={`text-xl font-bold ${currentMonth.solde >= 0 ? "text-primary" : "text-destructive"}`}>
                  {currentMonth.solde >= 0 ? "+" : ""}{currentMonth.solde.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                soldeApresFrais >= 0 ? "bg-primary/10" : "bg-destructive/10"
              }`}>
                <Wallet className={`h-5 w-5 ${soldeApresFrais >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde après frais</p>
                <p className={`text-xl font-bold ${soldeApresFrais >= 0 ? "text-primary" : "text-destructive"}`}>
                  {soldeApresFrais >= 0 ? "+" : ""}{soldeApresFrais.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Wallet className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trésorerie cumulée</p>
                <p className="text-xl font-bold">{currentMonth.cumul.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {cashFlowDataFinal.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Évolution de la trésorerie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowDataFinal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCumulFrais" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`,
                      name === "cumul" ? "Trésorerie production" : name === "cumulApresFrais" ? "Trésorerie après frais" : name === "encaissements" ? "Encaissements" : "Décaissements",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumul"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCumul)"
                    name="cumul"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulApresFrais"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCumulFrais)"
                    name="cumulApresFrais"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Détail mensuel
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un mois
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une entrée cash-flow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Mois</Label>
                  <Input
                    type="month"
                    value={newEntry.mois.slice(0, 7)}
                    onChange={(e) => setNewEntry({ ...newEntry, mois: e.target.value + '-01' })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Encaissements (€)</Label>
                    <Input
                      type="number"
                      value={newEntry.encaissements}
                      onChange={(e) => setNewEntry({ ...newEntry, encaissements: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Décaissements (€)</Label>
                    <Input
                      type="number"
                      value={newEntry.decaissements}
                      onChange={(e) => setNewEntry({ ...newEntry, decaissements: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Délai de paiement (jours)</Label>
                  <Input
                    type="number"
                    value={newEntry.delai_paiement_jours}
                    onChange={(e) => setNewEntry({ ...newEntry, delai_paiement_jours: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddEntry}
                  disabled={addCashFlowEntry.isPending}
                >
                  {addCashFlowEntry.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {cashFlowEntries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Aucune entrée cash-flow. Ajoutez votre premier mois pour commencer le suivi.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead className="text-right">Encaissements</TableHead>
                  <TableHead className="text-right">Décaiss. prod.</TableHead>
                  <TableHead className="text-right">Frais pro.</TableHead>
                  <TableHead className="text-center">Solde prod.</TableHead>
                  <TableHead className="text-center">Solde après frais</TableHead>
                  <TableHead className="text-right">Cumul</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashFlowDataFinal.map((row, index) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">
                      {new Date(row.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right text-primary">
                      +{row.encaissements.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -{row.decaissements.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell className="text-right text-chart-5">
                      -{row.fraisPro.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell className="text-center">{getSoldeBadge(row.solde)}</TableCell>
                    <TableCell className="text-center">{getSoldeBadge(row.soldeApresFrais)}</TableCell>
                    <TableCell className={`text-right font-medium ${row.cumulApresFrais >= 0 ? '' : 'text-destructive'}`}>
                      {row.cumulApresFrais.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCashFlowEntry.mutate(cashFlowEntries[index].id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default CashFlow;
