
# Plan : Intégration TVA dans le Cash-Flow

## Objectif
Ajouter la gestion complète de la TVA dans le module Cash-flow, impactant uniquement les flux de trésorerie sans modifier les calculs de marge ni de résultat.

---

## Vue d'ensemble de l'architecture

La structure existante offre déjà une base solide :
- Les **paramètres TVA** (taux, régime franchise) sont déjà configurés dans `project_settings`
- Le hook **`useTVA`** existe et calcule TVA collectée/déductible à partir des ventes et stocks
- Le hook **`useAutoCashFlow`** calcule les flux mensuels automatiquement

L'objectif est d'enrichir `useAutoCashFlow` avec les calculs TVA et d'afficher ces nouvelles lignes dans le tableau Cash-Flow.

---

## Partie 1 : Extension du hook `useAutoCashFlow`

### 1.1 Ajouter les champs TVA à l'interface

Nouvelles propriétés dans `MonthlyCashFlowData` :
- `encaissements_ttc` : CA HT + TVA collectée
- `tva_collectee` : TVA sur les ventes (CA HT × taux TVA produit)
- `tva_deductible_matieres` : TVA sur achats matières
- `tva_deductible_emballages` : TVA sur achats emballages  
- `tva_deductible_variables` : TVA sur coûts variables
- `tva_deductible_frais` : TVA sur frais professionnels
- `tva_deductible_total` : Somme des TVA déductibles
- `tva_nette` : TVA collectée - TVA déductible (positif = à payer)
- `solde_avec_tva` : Variation nette incluant l'impact TVA

### 1.2 Intégrer les taux TVA dans les calculs

Pour chaque produit vendu :
- Récupérer le `tva_taux` du produit (ou taux par défaut des settings)
- Calculer : `tva_collectee += montant_ht × (tva_taux / 100)`

Pour chaque achat (ingrédients, emballages, variables, frais) :
- Récupérer le `tva_taux` de l'item
- Calculer : `tva_deductible += montant_ht × (tva_taux / 100)`

### 1.3 Gérer le régime de franchise

Si `regime_tva === 'franchise_taxe'` :
- Tous les calculs TVA retournent 0
- Les encaissements restent en HT
- Un message informatif sera affiché

### 1.4 Mettre à jour le cumul

Le nouveau cumul inclura la variation de trésorerie avec TVA :
```text
variation_avec_tva = encaissements_ttc 
                   - decaissements_production 
                   - tva_deductible_production
                   - frais_professionnels 
                   - tva_deductible_frais
                   - tva_nette (si périodicité atteinte)
```

---

## Partie 2 : Gestion de la périodicité TVA

### 2.1 Logique de déclaration

Le champ `periodicite_tva` existe déjà dans `project_settings` (mensuelle/trimestrielle).

Règles :
- **Mensuelle** : TVA nette décaissée chaque mois (M+1)
- **Trimestrielle** : TVA nette décaissée aux mois T1 (Avril), T2 (Juillet), T3 (Octobre), T4 (Janvier N+1)

### 2.2 Impact sur le cash-flow

La TVA nette (à payer ou à récupérer) sera :
- Cumulée mensuellement
- Décaissée/encaissée selon la périodicité
- Affichée comme flux distinct

---

## Partie 3 : Mise à jour de l'interface Cash-Flow

### 3.1 Nouvelles cartes de synthèse

Ajouter dans la section des cartes :
- **TVA collectée (annuelle)** : Total TVA sur ventes
- **TVA déductible (annuelle)** : Total TVA sur achats
- **TVA nette** : Avec badge couleur (vert si crédit, rouge si débit)

### 3.2 Extension du tableau détaillé

Nouvelles colonnes :
| Mois | Encaiss. HT | TVA Coll. | Décaiss. | TVA Déd. | TVA Nette | Solde | Cumul |

### 3.3 Info-bulle pédagogique

Ajouter un tooltip sur les lignes TVA :
> "La TVA est un flux de trésorerie, pas un revenu. Elle n'impacte pas la marge ni le résultat."

### 3.4 Nouveau graphique

Ajouter un BarChart optionnel montrant :
- Barres vertes : TVA déductible
- Barres oranges : TVA collectée
- Ligne : TVA nette

---

## Partie 4 : Modifications de fichiers

### Fichiers à modifier

1. **`src/hooks/useAutoCashFlow.ts`**
   - Étendre l'interface `MonthlyCashFlowData`
   - Récupérer les paramètres TVA via `useProjectSettings`
   - Calculer TVA collectée et déductible par mois
   - Gérer la périodicité de déclaration
   - Mettre à jour le summary avec les totaux TVA

2. **`src/pages/CashFlow.tsx`**
   - Ajouter les cartes TVA dans l'en-tête
   - Étendre le tableau avec les colonnes TVA
   - Ajouter les info-bulles explicatives
   - Optionnel : graphique TVA

3. **`src/lib/pedagogicDefinitions.ts`**
   - Ajouter les définitions pour TVA collectée, déductible, nette

---

## Partie 5 : Contraintes respectées

| Contrainte | Solution |
|------------|----------|
| TVA n'impacte pas la marge | Calculs séparés, lignes distinctes |
| Flux de trésorerie uniquement | TVA intégrée au cumul trésorerie, pas au résultat |
| Budget / Réel | Mode passé aux requêtes, TVA calculée selon le mode |
| Pas de modification des tables | Utilisation des données existantes (tva_taux sur produits/ingrédients) |
| Régime franchise | Si franchise_taxe, tous les calculs TVA = 0 |

---

## Résultat attendu

1. Les encaissements affichent le CA HT et la TVA collectée séparément
2. Les décaissements montrent les achats HT et TVA déductible
3. Une ligne "TVA nette" apparaît avec le montant à payer/récupérer
4. La trésorerie cumulée reflète l'impact TVA réel
5. Le CA HT, les marges et le résultat restent inchangés
6. Les graphiques existants ne sont pas cassés

---

## Dépendances techniques

- Récupération de `tva_taux` sur : `products`, `ingredients`, `packaging`, `variable_costs`, `professional_expenses`
- Lecture de `regime_tva` et `periodicite_tva` depuis `project_settings`
- Mode Budget/Réel déjà géré par le sélecteur existant
