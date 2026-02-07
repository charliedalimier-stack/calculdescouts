import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PeriodSelector } from "@/components/layout/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useInvestments } from "@/hooks/useInvestments";
import { useProject } from "@/contexts/ProjectContext";
import { Plus, Trash2, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const INVESTMENT_CATEGORIES = [
  { value: "equipement", label: "Équipement" },
  { value: "vehicule", label: "Véhicule" },
  { value: "immobilier", label: "Immobilier" },
  { value: "informatique", label: "Informatique" },
  { value: "mobilier", label: "Mobilier" },
  { value: "autre", label: "Autre" },
];

const FINANCING_TYPES = [
  { value: "apport", label: "Apport personnel" },
  { value: "pret", label: "Prêt bancaire" },
  { value: "subvention", label: "Subvention" },
  { value: "leasing", label: "Leasing" },
];

export default function Investments() {
  const { currentProject } = useProject();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [dataMode, setDataMode] = useState<"budget" | "reel">("budget");

  const {
    investments, financings, isLoading,
    totalInvestments, totalInvestmentsTTC, totalFinancings, besoinFinancement,
    addInvestment, updateInvestment, deleteInvestment,
    addFinancing, updateFinancing, deleteFinancing,
  } = useInvestments(dataMode);

  const [invDialog, setInvDialog] = useState(false);
  const [finDialog, setFinDialog] = useState(false);
  const [newInv, setNewInv] = useState({ nom: "", categorie: "equipement", montant_ht: 0, tva_taux: 21, date_achat: new Date().toISOString().split("T")[0], duree_amortissement: 5 });
  const [newFin, setNewFin] = useState({ type_financement: "apport", montant: 0, date_debut: new Date().toISOString().split("T")[0], duree_mois: 60, taux_interet: 0 });

  const handleAddInvestment = () => {
    if (!newInv.nom.trim()) { toast.error("Nom requis"); return; }
    addInvestment.mutate({ ...newInv, mode: dataMode });
    setInvDialog(false);
    setNewInv({ nom: "", categorie: "equipement", montant_ht: 0, tva_taux: 21, date_achat: new Date().toISOString().split("T")[0], duree_amortissement: 5 });
  };

  const handleAddFinancing = () => {
    if (newFin.montant <= 0) { toast.error("Montant requis"); return; }
    addFinancing.mutate({ ...newFin, mode: dataMode });
    setFinDialog(false);
    setNewFin({ type_financement: "apport", montant: 0, date_debut: new Date().toISOString().split("T")[0], duree_mois: 60, taux_interet: 0 });
  };

  if (!currentProject) {
    return (
      <AppLayout title="Investissements" subtitle="Plan d'investissement et financement">
        <div className="text-center py-12 text-muted-foreground">Sélectionnez un projet pour commencer.</div>
      </AppLayout>
    );
  }

  const fmt = (n: number) => n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });

  return (
    <AppLayout title="Investissements" subtitle="Plan d'investissement et financement">
      <div className="space-y-6">
        <PeriodSelector
          year={selectedYear}
          mode={dataMode}
          showMonth={false}
          onChange={({ year, mode }) => {
            setSelectedYear(year);
            setDataMode(mode);
          }}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investissements HT</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalInvestments)}</div>
              <p className="text-xs text-muted-foreground">TTC : {fmt(totalInvestmentsTTC)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Financements</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalFinancings)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Besoin de financement</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${besoinFinancement > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${besoinFinancement > 0 ? "text-destructive" : "text-primary"}`}>
                {fmt(besoinFinancement)}
              </div>
              <p className="text-xs text-muted-foreground">
                {besoinFinancement > 0 ? "Financement insuffisant" : "Financement couvert"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investments Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Investissements initiaux</CardTitle>
            <Dialog open={invDialog} onOpenChange={setInvDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvel investissement</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nom</Label><Input value={newInv.nom} onChange={e => setNewInv(p => ({ ...p, nom: e.target.value }))} /></div>
                  <div><Label>Catégorie</Label>
                    <Select value={newInv.categorie} onValueChange={v => setNewInv(p => ({ ...p, categorie: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{INVESTMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Montant HT (€)</Label><Input type="number" value={newInv.montant_ht} onChange={e => setNewInv(p => ({ ...p, montant_ht: parseFloat(e.target.value) || 0 }))} /></div>
                    <div><Label>TVA (%)</Label>
                      <Select value={String(newInv.tva_taux)} onValueChange={v => setNewInv(p => ({ ...p, tva_taux: parseFloat(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="21">21%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="6">6%</SelectItem>
                          <SelectItem value="0">0%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Date d'achat</Label><Input type="date" value={newInv.date_achat} onChange={e => setNewInv(p => ({ ...p, date_achat: e.target.value }))} /></div>
                    <div><Label>Durée amortissement (ans)</Label><Input type="number" min={1} value={newInv.duree_amortissement} onChange={e => setNewInv(p => ({ ...p, duree_amortissement: parseInt(e.target.value) || 1 }))} /></div>
                  </div>
                  <Button onClick={handleAddInvestment} className="w-full">Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amort. (ans)</TableHead>
                  <TableHead className="text-right">Amort. annuel</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Aucun investissement</TableCell></TableRow>
                ) : investments.map(inv => {
                  const ttc = Number(inv.montant_ht) * (1 + Number(inv.tva_taux) / 100);
                  const amortAnnuel = Number(inv.montant_ht) / Number(inv.duree_amortissement);
                  const catLabel = INVESTMENT_CATEGORIES.find(c => c.value === inv.categorie)?.label ?? inv.categorie;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.nom}</TableCell>
                      <TableCell>{catLabel}</TableCell>
                      <TableCell className="text-right">{fmt(Number(inv.montant_ht))}</TableCell>
                      <TableCell className="text-right">{inv.tva_taux}%</TableCell>
                      <TableCell className="text-right">{fmt(ttc)}</TableCell>
                      <TableCell>{new Date(inv.date_achat).toLocaleDateString("fr-BE")}</TableCell>
                      <TableCell className="text-right">{inv.duree_amortissement}</TableCell>
                      <TableCell className="text-right">{fmt(amortAnnuel)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteInvestment.mutate(inv.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              {investments.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totalInvestments)}</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-bold">{fmt(totalInvestmentsTTC)}</TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className="text-right font-bold">
                      {fmt(investments.reduce((s, i) => s + Number(i.montant_ht) / Number(i.duree_amortissement), 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>

        {/* Financings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Plan de financement</CardTitle>
            <Dialog open={finDialog} onOpenChange={setFinDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau financement</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Type</Label>
                    <Select value={newFin.type_financement} onValueChange={v => setNewFin(p => ({ ...p, type_financement: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FINANCING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Montant (€)</Label><Input type="number" value={newFin.montant} onChange={e => setNewFin(p => ({ ...p, montant: parseFloat(e.target.value) || 0 }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Date de début</Label><Input type="date" value={newFin.date_debut} onChange={e => setNewFin(p => ({ ...p, date_debut: e.target.value }))} /></div>
                    <div><Label>Durée (mois)</Label><Input type="number" min={1} value={newFin.duree_mois} onChange={e => setNewFin(p => ({ ...p, duree_mois: parseInt(e.target.value) || 1 }))} /></div>
                  </div>
                  <div><Label>Taux d'intérêt (%)</Label><Input type="number" step="0.1" value={newFin.taux_interet} onChange={e => setNewFin(p => ({ ...p, taux_interet: parseFloat(e.target.value) || 0 }))} /></div>
                  <Button onClick={handleAddFinancing} className="w-full">Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead className="text-right">Durée (mois)</TableHead>
                  <TableHead className="text-right">Taux (%)</TableHead>
                  <TableHead className="text-right">Mensualité est.</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financings.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Aucun financement</TableCell></TableRow>
                ) : financings.map(fin => {
                  const typeLabel = FINANCING_TYPES.find(t => t.value === fin.type_financement)?.label ?? fin.type_financement;
                  const tauxMensuel = Number(fin.taux_interet) / 100 / 12;
                  const mensualite = tauxMensuel > 0
                    ? (Number(fin.montant) * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -Number(fin.duree_mois)))
                    : Number(fin.montant) / Number(fin.duree_mois);
                  return (
                    <TableRow key={fin.id}>
                      <TableCell className="font-medium">{typeLabel}</TableCell>
                      <TableCell className="text-right">{fmt(Number(fin.montant))}</TableCell>
                      <TableCell>{new Date(fin.date_debut).toLocaleDateString("fr-BE")}</TableCell>
                      <TableCell className="text-right">{fin.duree_mois}</TableCell>
                      <TableCell className="text-right">{fin.taux_interet}%</TableCell>
                      <TableCell className="text-right">{fmt(mensualite)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteFinancing.mutate(fin.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              {financings.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totalFinancings)}</TableCell>
                    <TableCell colSpan={5} />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
