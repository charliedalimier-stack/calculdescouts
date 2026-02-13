import { useState, useMemo } from "react";
import { format, parse, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { expenseSchema, getValidationError } from "@/lib/validations";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses, EXPENSE_CATEGORIES } from "@/hooks/useExpenses";
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Receipt,
  TrendingDown,
  Building2,
  Calendar,
  PieChart,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const Expenses = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = format(new Date(), "yyyy-MM");

  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    libelle: "",
    categorie_frais: "autres",
    montant_ht: 0,
    tva_taux: 20,
    recurrence: "ponctuel" as "ponctuel" | "mensuel" | "annuel",
  });
  const [duplicateSource, setDuplicateSource] = useState("");
  const [duplicateTarget, setDuplicateTarget] = useState("");

  const {
    expenses,
    summary,
    isLoading,
    getExpensesByMonth,
    getExpensesByYear,
    getMonthlyTotal,
    getAnnualTotal,
    addExpense,
    updateExpense,
    deleteExpense,
    duplicateMonth,
  } = useExpenses();

  // Get displayed expenses based on view mode
  const displayedExpenses = useMemo(() => {
    if (viewMode === "monthly") {
      return getExpensesByMonth(selectedMonth);
    }
    return getExpensesByYear(selectedYear);
  }, [viewMode, selectedMonth, selectedYear, expenses]);

  // Calculate totals for current view
  const viewTotal = useMemo(() => {
    if (viewMode === "monthly") {
      return getMonthlyTotal(selectedMonth);
    }
    return getAnnualTotal(selectedYear);
  }, [viewMode, selectedMonth, selectedYear, expenses]);

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    displayedExpenses.forEach((e) => {
      categoryTotals[e.categorie_frais] = (categoryTotals[e.categorie_frais] || 0) + Number(e.montant_ht);
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name: EXPENSE_CATEGORIES.find((c) => c.value === name)?.label || name,
      value,
    }));
  }, [displayedExpenses]);

  // Prepare monthly bar chart data (for annual view)
  const monthlyChartData = useMemo(() => {
    if (viewMode !== "annual") return [];
    const monthlyTotals: { [key: string]: number } = {};
    MONTHS.forEach((_, index) => {
      const monthKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
      monthlyTotals[monthKey] = 0;
    });
    displayedExpenses.forEach((e) => {
      const monthKey = e.mois.substring(0, 7);
      if (monthlyTotals[monthKey] !== undefined) {
        monthlyTotals[monthKey] += Number(e.montant_ht);
      }
    });
    return Object.entries(monthlyTotals).map(([key, value]) => ({
      month: MONTHS[parseInt(key.split("-")[1]) - 1]?.substring(0, 3) || key,
      total: value,
    }));
  }, [viewMode, selectedYear, displayedExpenses]);

  const handleAddExpense = () => {
    const recurrence = newExpense.recurrence;
    const montantMensuel = recurrence === "annuel" 
      ? newExpense.montant_ht / 12 
      : newExpense.montant_ht;

    const months: string[] = [];

    if (recurrence === "ponctuel") {
      const moisDate = viewMode === "monthly" 
        ? `${selectedMonth}-01`
        : `${selectedYear}-${format(new Date(), "MM")}-01`;
      months.push(moisDate);
    } else {
      // mensuel or annuel: create for all 12 months of selected year
      for (let m = 1; m <= 12; m++) {
        months.push(`${selectedYear}-${String(m).padStart(2, "0")}-01`);
      }
    }

    const baseData = {
      libelle: newExpense.libelle.trim(),
      montant_ht: Math.round(montantMensuel * 100) / 100,
      tva_taux: newExpense.tva_taux,
      categorie_frais: newExpense.categorie_frais,
    };

    const error = getValidationError(expenseSchema, { ...baseData, mois: months[0] });
    if (error) {
      toast.error(error);
      return;
    }

    // Add expense for each month
    months.forEach((mois) => {
      addExpense.mutate({ ...baseData, mois });
    });

    setNewExpense({ libelle: "", categorie_frais: "autres", montant_ht: 0, tva_taux: 20, recurrence: "ponctuel" });
    setIsAddDialogOpen(false);
  };

  const handleDuplicate = () => {
    duplicateMonth.mutate({
      sourceMonth: duplicateSource,
      targetMonth: duplicateTarget,
    });
    setIsDuplicateDialogOpen(false);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <AppLayout title="Frais Professionnels" subtitle="Gestion des charges fixes">
        <div className="space-y-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Frais Professionnels"
      subtitle="Charges fixes et frais de fonctionnement"
    >
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total HT période</p>
                <p className="text-xl font-bold">{formatCurrency(viewTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Building2 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total TTC période</p>
                <p className="text-xl font-bold">
                  {formatCurrency(displayedExpenses.reduce((sum, e) => sum + Number(e.montant_ttc), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <TrendingDown className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TVA déductible</p>
                <p className="text-xl font-bold">
                  {formatCurrency(displayedExpenses.reduce((sum, e) => sum + (Number(e.montant_ttc) - Number(e.montant_ht)), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                <PieChart className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Catégories</p>
                <p className="text-xl font-bold">{pieChartData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "monthly" | "annual")}>
              <TabsList>
                <TabsTrigger value="monthly">
                  <Calendar className="mr-2 h-4 w-4" />
                  Mensuel
                </TabsTrigger>
                <TabsTrigger value="annual">
                  <Calendar className="mr-2 h-4 w-4" />
                  Annuel
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {viewMode === "monthly" && (
              <Select
                value={selectedMonth.split("-")[1]}
                onValueChange={(v) => setSelectedMonth(`${selectedYear}-${v}`)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={String(index + 1).padStart(2, "0")}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="ml-auto flex gap-2">
              <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Dupliquer un mois
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dupliquer les frais d'un mois</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Mois source</Label>
                      <Input
                        type="month"
                        value={duplicateSource}
                        onChange={(e) => setDuplicateSource(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mois cible</Label>
                      <Input
                        type="month"
                        value={duplicateTarget}
                        onChange={(e) => setDuplicateTarget(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleDuplicate} className="w-full" disabled={duplicateMonth.isPending}>
                      Dupliquer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un frais
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un frais professionnel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={newExpense.categorie_frais}
                        onValueChange={(v) => setNewExpense({ ...newExpense, categorie_frais: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Libellé</Label>
                      <Input
                        value={newExpense.libelle}
                        onChange={(e) => setNewExpense({ ...newExpense, libelle: e.target.value })}
                        placeholder="Ex: Loyer local commercial"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Montant HT</Label>
                        <Input
                          type="number"
                          value={newExpense.montant_ht}
                          onChange={(e) => setNewExpense({ ...newExpense, montant_ht: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>TVA (%)</Label>
                        <Input
                          type="number"
                          value={newExpense.tva_taux}
                          onChange={(e) => setNewExpense({ ...newExpense, tva_taux: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Récurrence</Label>
                      <Select
                        value={newExpense.recurrence}
                        onValueChange={(v) => setNewExpense({ ...newExpense, recurrence: v as "ponctuel" | "mensuel" | "annuel" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ponctuel">Ponctuel (ce mois uniquement)</SelectItem>
                          <SelectItem value="mensuel">Mensuel récurrent (même montant × 12 mois)</SelectItem>
                          <SelectItem value="annuel">Annuel réparti (montant ÷ 12 mois)</SelectItem>
                        </SelectContent>
                      </Select>
                      {newExpense.recurrence === "annuel" && newExpense.montant_ht > 0 && (
                        <p className="text-xs text-muted-foreground">
                          → {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Math.round(newExpense.montant_ht / 12 * 100) / 100)} /mois
                        </p>
                      )}
                      {newExpense.recurrence === "mensuel" && newExpense.montant_ht > 0 && (
                        <p className="text-xs text-muted-foreground">
                          → {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(newExpense.montant_ht * 12)} /an
                        </p>
                      )}
                    </div>
                    <Button onClick={handleAddExpense} className="w-full" disabled={addExpense.isPending || !newExpense.libelle}>
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {viewMode === "monthly"
                ? `Frais de ${MONTHS[parseInt(selectedMonth.split("-")[1]) - 1]} ${selectedYear}`
                : `Frais annuels ${selectedYear}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayedExpenses.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Aucun frais enregistré pour cette période
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {viewMode === "annual" && <TableHead>Mois</TableHead>}
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      {viewMode === "annual" && (
                        <TableCell>
                          {MONTHS[parseInt(expense.mois.substring(5, 7)) - 1]?.substring(0, 3)}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">
                          {EXPENSE_CATEGORIES.find((c) => c.value === expense.categorie_frais)?.label || expense.categorie_frais}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{expense.libelle}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.montant_ht)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {expense.tva_taux}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.montant_ttc)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpense.mutate(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  Aucune donnée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {viewMode === "annual" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évolution mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v}€`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Expenses;
