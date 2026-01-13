/**
 * Définitions pédagogiques centralisées pour tous les indicateurs financiers
 * Chaque définition inclut: titre, formule (optionnelle), description et interprétation
 */

export interface PedagogicDefinition {
  title: string;
  formula?: string;
  description: string;
  interpretation?: string;
}

// ============= INDICATEURS PRINCIPAUX =============

export const DEFINITIONS = {
  // Chiffre d'affaires
  ca_ht: {
    title: "Chiffre d'affaires HT",
    formula: "CA HT = Σ (Prix HT × Quantité vendue)",
    description: "Total des ventes hors taxes sur la période. C'est le montant réellement perçu avant TVA.",
    interpretation: "Un CA croissant indique une activité en développement. Comparez-le aux objectifs pour mesurer la performance commerciale.",
  },
  
  ca_ttc: {
    title: "Chiffre d'affaires TTC",
    formula: "CA TTC = CA HT × (1 + Taux TVA)",
    description: "Total des ventes incluant la TVA collectée. C'est le montant facturé au client final.",
    interpretation: "La différence avec le CA HT représente la TVA à reverser à l'État.",
  },

  // Marges
  marge_brute: {
    title: "Marge brute",
    formula: "Marge brute = CA HT - Coût de production",
    description: "Différence entre le chiffre d'affaires et les coûts directs de production (matières, emballages, charges variables).",
    interpretation: "Une marge brute élevée signifie que votre activité de production est rentable. Objectif minimum : 30-40%.",
  },
  
  taux_marge: {
    title: "Taux de marge",
    formula: "Taux marge = (Marge brute ÷ CA HT) × 100",
    description: "Pourcentage de marge dégagé sur chaque euro de vente. Mesure l'efficacité opérationnelle.",
    interpretation: "Un taux de marge de 40% signifie que sur 100€ vendus, 40€ restent après avoir payé les coûts de production.",
  },

  // Coefficient
  coefficient: {
    title: "Coefficient multiplicateur",
    formula: "Coefficient = Prix de vente HT ÷ Coût de production",
    description: "Ratio entre le prix de vente et le coût de revient. Un coefficient de 3 signifie un prix de vente 3× supérieur au coût.",
    interpretation: "Coefficient cible recommandé : entre 2,5 et 4. En dessous de 2, la rentabilité est à risque.",
  },

  coefficient_cible: {
    title: "Coefficient cible",
    description: "Le coefficient multiplicateur que vous visez pour assurer une rentabilité optimale.",
    interpretation: "Définissez ce coefficient dans les paramètres du projet. Les produits en dessous seront signalés.",
  },

  coefficient_min: {
    title: "Coefficient minimum",
    description: "Le coefficient en dessous duquel un produit est considéré comme non rentable.",
    interpretation: "Les produits sous ce seuil nécessitent une action : augmenter le prix ou réduire les coûts.",
  },

  // Résultat
  resultat_net: {
    title: "Résultat net",
    formula: "Résultat net = Marge brute - Frais professionnels",
    description: "Ce qu'il reste après avoir payé tous les coûts (production + frais fixes). C'est le bénéfice réel.",
    interpretation: "Un résultat positif indique une activité rentable. Un résultat négatif nécessite des ajustements urgents.",
  },

  // Frais
  frais_professionnels: {
    title: "Frais professionnels",
    description: "Charges fixes de l'entreprise : loyer, assurances, abonnements, salaires, etc. Indépendants du volume de production.",
    interpretation: "Ces frais doivent être couverts par la marge brute pour atteindre la rentabilité.",
  },

  // Cash-flow
  cash_flow: {
    title: "Cash-flow (flux de trésorerie)",
    formula: "Cash-flow = Encaissements - Décaissements",
    description: "Différence entre l'argent qui entre et l'argent qui sort sur une période. Mesure la santé financière immédiate.",
    interpretation: "Un cash-flow positif signifie que vous avez plus d'entrées que de sorties. Un cash-flow négatif indique un besoin de financement.",
  },

  encaissements: {
    title: "Encaissements",
    description: "Argent effectivement reçu sur la période (paiements clients). Attention aux délais de paiement.",
    interpretation: "Les encaissements peuvent différer du CA si vos clients paient avec un délai.",
  },

  decaissements: {
    title: "Décaissements",
    description: "Argent effectivement dépensé sur la période (paiements fournisseurs, charges).",
    interpretation: "Maîtrisez vos décaissements en négociant des délais de paiement avec vos fournisseurs.",
  },

  tresorerie_cumulee: {
    title: "Trésorerie cumulée",
    formula: "Trésorerie = Trésorerie précédente + Cash-flow du mois",
    description: "Solde de votre compte en banque théorique à un instant T.",
    interpretation: "Une trésorerie négative signifie un besoin de financement (découvert, prêt, apport).",
  },

  // Seuil de rentabilité
  seuil_rentabilite: {
    title: "Seuil de rentabilité (point mort)",
    formula: "Seuil = Coûts fixes ÷ (Prix unitaire - Coût variable unitaire)",
    description: "Nombre minimum d'unités à vendre pour couvrir tous les coûts (fixes et variables).",
    interpretation: "En dessous de ce seuil, vous perdez de l'argent. Au-dessus, vous êtes rentable.",
  },

  marge_securite: {
    title: "Marge de sécurité",
    formula: "Marge sécurité = ((Volume actuel - Seuil) ÷ Volume actuel) × 100",
    description: "Écart en pourcentage entre vos ventes actuelles et le seuil de rentabilité.",
    interpretation: "Une marge de sécurité de 20% signifie que vous pouvez perdre 20% de vos ventes avant de devenir déficitaire.",
  },

  contribution_unitaire: {
    title: "Contribution unitaire",
    formula: "Contribution = Prix de vente - Coût variable",
    description: "Ce que chaque unité vendue contribue à couvrir les coûts fixes et générer du profit.",
    interpretation: "Plus la contribution est élevée, moins vous avez besoin de vendre pour être rentable.",
  },

  // TVA
  tva_collectee: {
    title: "TVA collectée",
    formula: "TVA collectée = CA HT × Taux TVA",
    description: "TVA facturée à vos clients que vous devez reverser à l'État.",
    interpretation: "Ce n'est pas un revenu pour vous, c'est une dette envers l'État.",
  },

  tva_deductible: {
    title: "TVA déductible",
    formula: "TVA déductible = Achats HT × Taux TVA",
    description: "TVA payée sur vos achats que vous pouvez récupérer auprès de l'État.",
    interpretation: "La TVA déductible réduit votre dette de TVA.",
  },

  tva_nette: {
    title: "TVA nette à payer",
    formula: "TVA nette = TVA collectée - TVA déductible",
    description: "Montant effectif de TVA à reverser à l'État (ou à récupérer si négatif).",
    interpretation: "Si négatif, vous avez un crédit de TVA récupérable.",
  },

  // Coûts
  cout_production: {
    title: "Coût de production",
    formula: "Coût = Matières + Emballages + Charges variables",
    description: "Ensemble des coûts directs pour fabriquer un produit ou réaliser une prestation.",
    interpretation: "Réduire ce coût augmente directement votre marge. Négociez avec vos fournisseurs.",
  },

  cout_matiere: {
    title: "Coût matière",
    description: "Coût des ingrédients et matières premières utilisés dans la recette du produit.",
    interpretation: "Généralement le poste le plus important. Optimisez vos recettes et négociez les prix d'achat.",
  },

  cout_emballage: {
    title: "Coût emballage",
    description: "Coût des emballages, contenants, étiquettes associés au produit.",
    interpretation: "Pensez à optimiser vos achats en volume pour réduire ce coût.",
  },

  cout_variable: {
    title: "Charges variables",
    description: "Coûts qui varient proportionnellement à la production : main d'œuvre directe, énergie, eau...",
    interpretation: "Ces coûts augmentent avec la production mais peuvent être optimisés.",
  },

  // Stocks
  stock_valeur: {
    title: "Valeur du stock",
    formula: "Valeur = Quantité × Coût unitaire",
    description: "Capital immobilisé dans les stocks. Cet argent n'est pas disponible pour d'autres usages.",
    interpretation: "Un stock trop important pèse sur la trésorerie. Optimisez les rotations.",
  },

  seuil_alerte_stock: {
    title: "Seuil d'alerte stock",
    description: "Quantité minimum en dessous de laquelle une alerte est déclenchée.",
    interpretation: "Définissez ce seuil pour anticiper les réapprovisionnements et éviter les ruptures.",
  },

  // Analyse de sensibilité
  sensibilite: {
    title: "Analyse de sensibilité",
    description: "Simulation de l'impact de variations (+/-%) sur les coûts, prix ou volumes sur votre rentabilité.",
    interpretation: "Identifiez les variables critiques pour votre activité et anticipez les risques.",
  },

  score_resilience: {
    title: "Score de résilience",
    description: "Mesure la capacité d'un produit à rester rentable face aux variations de marché.",
    interpretation: "Un score élevé indique un produit robuste. Un score faible nécessite une vigilance accrue.",
  },

  // BCG Matrix
  bcg_star: {
    title: "Stars (Vedettes)",
    description: "Produits à forte croissance et forte part de marché relative. Ils génèrent du cash mais en nécessitent aussi pour maintenir leur position.",
    interpretation: "Investissez pour maintenir leur leadership. Ce sont vos futurs générateurs de cash.",
  },

  bcg_cashcow: {
    title: "Cash Cows (Vaches à lait)",
    description: "Produits matures à forte part de marché mais faible croissance. Ils génèrent un cash-flow stable.",
    interpretation: "Récoltez les bénéfices et réinvestissez dans les Stars ou Question Marks.",
  },

  bcg_questionmark: {
    title: "Question Marks (Dilemmes)",
    description: "Produits à forte croissance mais faible part de marché. Potentiel incertain nécessitant des investissements.",
    interpretation: "Décidez : investir pour en faire des Stars ou abandonner avant de perdre trop.",
  },

  bcg_dog: {
    title: "Dogs (Poids morts)",
    description: "Produits à faible croissance et faible part de marché. Ils ne génèrent ni ne consomment beaucoup de cash.",
    interpretation: "Envisagez de les arrêter ou de les repositionner. Ils mobilisent des ressources.",
  },

  // Prix par canal
  prix_btc: {
    title: "Prix BTC (vente directe)",
    description: "Prix de vente au consommateur final en vente directe (marchés, boutique, e-commerce).",
    interpretation: "C'est votre prix de référence, généralement le plus élevé car sans intermédiaire.",
  },

  prix_btb: {
    title: "Prix BTB (professionnels)",
    formula: "Prix BTB = Prix BTC × (1 - Marge BTB%)",
    description: "Prix pratiqué pour les clients professionnels (restaurateurs, épiceries, etc.).",
    interpretation: "Une remise de 20-30% est courante pour fidéliser les professionnels.",
  },

  prix_distributeur: {
    title: "Prix Distributeur",
    formula: "Prix Distributeur = Prix BTB × (1 - Marge Distributeur%)",
    description: "Prix le plus bas, pour les grossistes et distributeurs qui revendent à des détaillants.",
    interpretation: "La marge est plus faible mais les volumes compensent.",
  },

  // Stress test
  stress_test: {
    title: "Stress test trésorerie",
    description: "Simulation de scénarios critiques (retards de paiement, hausse des coûts, baisse des ventes) pour anticiper les besoins de financement.",
    interpretation: "Identifiez votre capacité à résister aux chocs et préparez des plans d'action.",
  },

  // Budget vs Réel
  ecart_budget: {
    title: "Écart Budget vs Réel",
    formula: "Écart = (Réel - Budget) ÷ Budget × 100",
    description: "Différence en pourcentage entre ce qui était prévu (budget) et ce qui s'est réellement passé.",
    interpretation: "Un écart positif sur le CA est favorable. Un écart positif sur les coûts est défavorable.",
  },
} as const;

// Type pour les clés de définitions
export type DefinitionKey = keyof typeof DEFINITIONS;

// Fonction helper pour récupérer une définition
export function getDefinition(key: DefinitionKey): PedagogicDefinition {
  return DEFINITIONS[key];
}
