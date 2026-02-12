import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  TrendingUp,
  Warehouse,
  FileSpreadsheet,
  ShieldAlert,
  Wallet,
  Landmark,
  FileText,
  ArrowUp,
  BookOpen,
  Video,
  Headphones,
  FileDown,
  Lightbulb,
  Target,
  Package,
  Apple,
  Box,
  ChefHat,
  Calculator,
  Receipt,
} from "lucide-react";
import { useLearningResources } from "@/hooks/useLearningResources";

const sections = [
  { id: "introduction", label: "Introduction", icon: BookOpen },
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "products", label: "Produits", icon: Package },
  { id: "ingredients", label: "Ingrédients", icon: Apple },
  { id: "packaging", label: "Emballages", icon: Box },
  { id: "recipes", label: "Recettes", icon: ChefHat },
  { id: "pricing", label: "Tarification", icon: Calculator },
  { id: "sales", label: "Ventes", icon: TrendingUp },
  { id: "stocks", label: "Stocks", icon: Warehouse },
  { id: "plan", label: "Plan financier", icon: FileSpreadsheet },
  { id: "stress", label: "Stress Test", icon: ShieldAlert },
  { id: "cashflow", label: "Cash Flow", icon: Wallet },
  { id: "tva", label: "TVA", icon: Receipt },
  { id: "investments", label: "Investissements", icon: Landmark },
  { id: "reports", label: "Rapports", icon: FileText },
  { id: "resources", label: "Ressources", icon: Video },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Explanations() {
  const [showTop, setShowTop] = useState(false);
  const { data: resources = [] } = useLearningResources();

  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const videos = resources.filter((r) => r.type === "video");
  const podcasts = resources.filter((r) => r.type === "podcast");
  const pdfs = resources.filter((r) => r.type === "pdf");

  return (
    <AppLayout title="Explications" subtitle="Guide d'utilisation et formation">
      <div className="flex gap-6">
        {/* Left nav */}
        <nav className="hidden lg:block w-56 shrink-0 sticky top-20 self-start space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-4xl space-y-8">
          {/* Introduction */}
          <section id="introduction">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Introduction générale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">PilotFood</strong> est un outil de pilotage financier conçu pour les porteurs de projets
                  en transformation alimentaire. Il vous accompagne de l'encodage de vos données jusqu'à la prise de décision stratégique.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Lightbulb, step: "1. Encoder", desc: "Produits, ingrédients, recettes, prix" },
                    { icon: Target, step: "2. Analyser", desc: "Marges, coefficients, seuils de rentabilité" },
                    { icon: TrendingUp, step: "3. Optimiser", desc: "Stress tests, sensibilité, simulations" },
                    { icon: BookOpen, step: "4. Décider", desc: "Plan financier, rapports, cash-flow" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3 rounded-lg border p-3">
                      <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{item.step}</p>
                        <p className="text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p>
                  Chaque page fonctionne en mode <Badge variant="outline">Budget</Badge> et <Badge variant="outline">Réel</Badge>.
                  Le mode Budget correspond à vos prévisions, le mode Réel à vos données effectives.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Onglet par onglet */}
          <Accordion type="multiple" className="space-y-2">
            {/* Dashboard */}
            <AccordionItem value="dashboard" id="dashboard" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  Tableau de bord
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Le tableau de bord offre une vue synthétique de votre projet :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Mode Budget / Réel</strong> — Basculez pour comparer vos prévisions aux résultats réels.</li>
                  <li><strong className="text-foreground">KPI principaux</strong> — Chiffre d'affaires, marge brute, nombre de produits, coefficient moyen.</li>
                  <li><strong className="text-foreground">Graphiques</strong> — Évolution du CA mensuel, répartition par catégorie, analyse des marges.</li>
                  <li><strong className="text-foreground">Alertes produits</strong> — Produits dont la marge est insuffisante ou le coefficient trop bas.</li>
                </ul>
                <p>L'objectif est de détecter en un coup d'œil les points d'attention de votre projet.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Products */}
            <AccordionItem value="products" id="products" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  Produits
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>La page Produits est le point de départ de votre projet. Chaque produit représente un article que vous fabriquez et vendez.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Nom du produit</strong> — Identifiant unique dans votre gamme.</li>
                  <li><strong className="text-foreground">Catégorie</strong> — Permet de regrouper vos produits pour l'analyse (ex : confitures, sauces).</li>
                  <li><strong className="text-foreground">Unité de vente</strong> — Pièce, kg, litre… selon votre mode de commercialisation.</li>
                  <li><strong className="text-foreground">Rendement</strong> — Nombre d'unités produites par recette.</li>
                </ul>
                <p>Les produits sont ensuite liés aux recettes, prix et ventes pour calculer automatiquement vos marges.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Ingredients */}
            <AccordionItem value="ingredients" id="ingredients" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Apple className="h-4 w-4 text-primary" />
                  Ingrédients
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Encodez tous vos ingrédients avec leur coût unitaire et leur unité de mesure (kg, litre, pièce).</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Coût unitaire</strong> — Le prix d'achat par unité de mesure.</li>
                  <li><strong className="text-foreground">Fournisseur</strong> — Pour le suivi de vos approvisionnements.</li>
                  <li><strong className="text-foreground">Taux de TVA</strong> — TVA applicable sur l'achat (21%, 12%, 6% ou 0%).</li>
                  <li><strong className="text-foreground">Sous-recette</strong> — Un ingrédient peut être lui-même issu d'une fabrication interne.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Packaging */}
            <AccordionItem value="packaging" id="packaging" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Box className="h-4 w-4 text-primary" />
                  Emballages
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Les emballages font partie du coût variable de vos produits. Chaque produit peut utiliser plusieurs emballages (pot, étiquette, carton).</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Type</strong> — Primaire (au contact du produit), secondaire (groupage), tertiaire (transport).</li>
                  <li><strong className="text-foreground">Coût unitaire</strong> — Prix par unité d'emballage.</li>
                  <li><strong className="text-foreground">TVA</strong> — Généralement à 21%.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Recipes */}
            <AccordionItem value="recipes" id="recipes" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <ChefHat className="h-4 w-4 text-primary" />
                  Recettes
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>La recette lie un produit à ses ingrédients et emballages. C'est ici que se calcule le <strong className="text-foreground">coût de revient</strong>.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Quantité utilisée</strong> — Par ingrédient, pour une recette complète.</li>
                  <li><strong className="text-foreground">Coût de revient</strong> — Somme (quantité × coût unitaire) de tous les ingrédients + emballages, divisée par le rendement.</li>
                  <li><strong className="text-foreground">Sous-recettes</strong> — Un produit intermédiaire peut servir d'ingrédient à un autre produit.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Pricing */}
            <AccordionItem value="pricing" id="pricing" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Calculator className="h-4 w-4 text-primary" />
                  Tarification
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Définissez les prix de vente HT pour chaque canal de distribution :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">BTC (vente directe)</strong> — Prix le plus élevé, marge la meilleure.</li>
                  <li><strong className="text-foreground">BTB (professionnel)</strong> — Prix réduit, volume plus important.</li>
                  <li><strong className="text-foreground">Distributeur</strong> — Prix le plus bas, le distributeur ajoute sa marge.</li>
                </ul>
                <p>Le <strong className="text-foreground">coefficient</strong> = Prix de vente HT / Coût de revient. Un coefficient de 2,5 signifie que vous vendez 2,5× le prix coûtant.</p>
                <p>La <strong className="text-foreground">marge</strong> = (Prix − Coût) / Prix × 100. Elle indique la part du prix qui constitue votre bénéfice brut.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Sales */}
            <AccordionItem value="sales" id="sales" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Ventes
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>La page Ventes est le cœur de votre prévisionnel :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Saisie annuelle (Budget)</strong> — Entrez vos objectifs de ventes par produit, canal et année. La répartition mensuelle est calculée automatiquement via les coefficients de saisonnalité.</li>
                  <li><strong className="text-foreground">Saisie mensuelle (Réel)</strong> — Encodez mois par mois vos ventes effectives.</li>
                  <li><strong className="text-foreground">Coefficients de saisonnalité</strong> — Définissez la répartition mensuelle (en %) de vos ventes annuelles. Total = 100%.</li>
                  <li><strong className="text-foreground">Canaux</strong> — BTC, BTB et Distributeur ont chacun leur prix et leur volume.</li>
                </ul>
                <p>Le tableau mensuel vous montre : quantités, CA HT, CA TTC par produit et par mois.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Stocks */}
            <AccordionItem value="stocks" id="stocks" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Warehouse className="h-4 w-4 text-primary" />
                  Stocks
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Gérez vos stocks de produits finis, d'ingrédients et d'emballages :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Stock initial</strong> — Quantité de départ encodée.</li>
                  <li><strong className="text-foreground">Mouvements</strong> — Entrées, sorties, pertes et ajustements modifient le stock.</li>
                  <li><strong className="text-foreground">Valeur du stock</strong> — Quantité × coût unitaire, calculée automatiquement.</li>
                  <li><strong className="text-foreground">Seuil d'alerte</strong> — Notification lorsque le stock descend sous un niveau critique.</li>
                </ul>
                <p>⚠️ Le stock impacte le <strong className="text-foreground">cash-flow</strong> (trésorerie bloquée) mais pas la marge.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Plan financier */}
            <AccordionItem value="plan" id="plan" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Plan financier
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Le Plan financier est la synthèse de votre projet. Il reprend tous les flux :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">CA HT</strong> — Chiffre d'affaires hors taxes, issu de vos ventes.</li>
                  <li><strong className="text-foreground">Achats marchandises</strong> — Coût des matières premières consommées (CA / coefficient).</li>
                  <li><strong className="text-foreground">Marge brute</strong> — CA − Achats.</li>
                  <li><strong className="text-foreground">Charges professionnelles</strong> — Loyers, assurances, énergie, etc.</li>
                  <li><strong className="text-foreground">Bénéfice brut</strong> — Marge brute − Charges.</li>
                  <li><strong className="text-foreground">Cotisations sociales</strong> — Calculées selon le taux défini dans les paramètres.</li>
                  <li><strong className="text-foreground">Impôts</strong> — Barème progressif belge, ajusté selon la situation familiale.</li>
                  <li><strong className="text-foreground">Résultat net</strong> — Ce qui reste après tout.</li>
                  <li><strong className="text-foreground">Revenu mensuel</strong> — Résultat net / 12.</li>
                </ul>
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="font-medium text-foreground mb-1">💡 Logique inverse</p>
                  <p>Le seuil de viabilité et le revenu idéal fonctionnent en sens inverse : on part du revenu souhaité pour calculer le CA nécessaire.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Stress Test */}
            <AccordionItem value="stress" id="stress" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Stress Test
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Le Stress Test permet de simuler des scénarios défavorables sans modifier vos données :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Variation du CA</strong> — Que se passe-t-il si vos ventes baissent de 20% ?</li>
                  <li><strong className="text-foreground">Variation du coefficient</strong> — Si le coût des matières premières augmente ?</li>
                  <li><strong className="text-foreground">Variation des charges</strong> — Si vos charges fixes augmentent ?</li>
                </ul>
                <p>Le tableau comparatif montre l'impact sur chaque indicateur : CA, marge, résultat net, revenu mensuel.</p>
                <p>🟢 Vert = amélioration — 🔴 Rouge = dégradation</p>
              </AccordionContent>
            </AccordionItem>

            {/* Cash Flow */}
            <AccordionItem value="cashflow" id="cashflow" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Wallet className="h-4 w-4 text-primary" />
                  Cash Flow
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Le cash-flow mesure la trésorerie réellement disponible chaque mois :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Encaissements</strong> — Argent entrant (ventes encaissées, tenant compte des délais de paiement).</li>
                  <li><strong className="text-foreground">Décaissements</strong> — Argent sortant (achats, charges, TVA, remboursements).</li>
                  <li><strong className="text-foreground">TVA</strong> — La TVA collectée et déductible impacte la trésorerie, pas le résultat.</li>
                  <li><strong className="text-foreground">Délais de paiement</strong> — BTC = immédiat, BTB/Distributeur = 30 jours par défaut.</li>
                </ul>
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="font-medium text-foreground mb-1">⚠️ Résultat ≠ Trésorerie</p>
                  <p>Un résultat positif ne garantit pas une trésorerie positive. Les délais de paiement, la TVA et les stocks créent un décalage.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* TVA */}
            <AccordionItem value="tva" id="tva" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Receipt className="h-4 w-4 text-primary" />
                  TVA
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>La page TVA détaille vos obligations en matière de TVA belge :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Taux applicables</strong> — 21% (standard), 12%, 6% (alimentaire), 0%.</li>
                  <li><strong className="text-foreground">TVA collectée</strong> — Sur vos ventes (à reverser à l'État).</li>
                  <li><strong className="text-foreground">TVA déductible</strong> — Sur vos achats (récupérable).</li>
                  <li><strong className="text-foreground">TVA nette</strong> — Collectée − Déductible = montant à payer ou à récupérer.</li>
                  <li><strong className="text-foreground">Périodicité</strong> — Mensuelle ou trimestrielle selon votre régime.</li>
                </ul>
                <p>⚠️ La TVA impacte le cash-flow mais jamais la rentabilité (elle est neutre pour l'entreprise).</p>
              </AccordionContent>
            </AccordionItem>

            {/* Investments */}
            <AccordionItem value="investments" id="investments" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <Landmark className="h-4 w-4 text-primary" />
                  Investissements
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Encodez vos investissements (équipements, véhicules, aménagements) :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Montant HT</strong> — Le coût d'acquisition hors taxes.</li>
                  <li><strong className="text-foreground">Durée d'amortissement</strong> — Répartition du coût sur plusieurs années (3, 5, 10 ans…).</li>
                  <li><strong className="text-foreground">Impact cash-flow</strong> — Le décaissement a lieu à l'achat (ou via un emprunt).</li>
                  <li><strong className="text-foreground">Impact résultat</strong> — Seul l'amortissement annuel impacte le résultat.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Reports */}
            <AccordionItem value="reports" id="reports" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  Rapports
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                <p>Les rapports synthétisent vos données sous forme de tableaux exportables :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Rapport ventes</strong> — CA par produit, canal et période.</li>
                  <li><strong className="text-foreground">Rapport financier</strong> — Compte de résultat complet.</li>
                  <li><strong className="text-foreground">Rapport stock</strong> — Valeur et quantités en stock par type.</li>
                </ul>
                <p>Chaque rapport respecte le mode sélectionné (Budget ou Réel).</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Resources section */}
          <section id="resources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Ressources complémentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {resources.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Les ressources pédagogiques (vidéos, podcasts, documents) seront ajoutées prochainement.
                  </p>
                )}

                {videos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Video className="h-4 w-4" /> Vidéos
                    </h3>
                    <div className="grid gap-3">
                      {videos.map((v) => (
                        <div key={v.id} className="rounded-lg border p-3">
                          <p className="font-medium text-sm">{v.title}</p>
                          {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                          <div className="mt-2 aspect-video">
                            <iframe
                              src={v.url}
                              className="w-full h-full rounded"
                              allowFullScreen
                              title={v.title}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {podcasts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Headphones className="h-4 w-4" /> Podcasts
                    </h3>
                    <div className="grid gap-3">
                      {podcasts.map((p) => (
                        <a
                          key={p.id}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                        >
                          <Headphones className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{p.title}</p>
                            {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {pdfs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <FileDown className="h-4 w-4" /> Documents
                    </h3>
                    <div className="grid gap-3">
                      {pdfs.map((d) => (
                        <a
                          key={d.id}
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                        >
                          <FileDown className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{d.title}</p>
                            {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Back to top */}
      {showTop && (
        <Button
          size="icon"
          variant="secondary"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </AppLayout>
  );
}
