

# Plan : Page de selection d'activite avec redirection

## Objectif

Ajouter une page intermediaire apres la connexion qui permet a l'utilisateur de choisir entre **Transformation alimentaire** et **Restauration**, puis de le rediriger vers l'application correspondante.

L'application actuelle reste dediee a la transformation alimentaire. L'application restaurant sera un projet separe (remix). La page de selection sert de point d'entree commun.

## Fonctionnement

1. L'utilisateur se connecte sur `/auth`
2. Il est redirige vers `/select-activity` (au lieu de `/` directement)
3. Il voit deux grandes cartes cliquables :
   - **Transformation alimentaire** → redirige vers `/` (tableau de bord actuel)
   - **Restauration** → redirige vers une URL externe (l'application remixee, configurable)
4. Un bouton "Retour au choix" sera accessible depuis le menu pour revenir a cette page

## Details techniques

### Nouveau fichier : `src/pages/SelectActivity.tsx`

- Page plein ecran avec deux cartes visuelles (icones ChefHat et UtensilsCrossed)
- Descriptions courtes pour chaque activite
- Clic sur "Transformation" → `navigate("/")`
- Clic sur "Restauration" → `window.location.href` vers l'URL externe (ou message "Bientot disponible" si pas encore deployee)
- L'URL du projet restaurant sera stockee dans une constante facilement modifiable

### Modification : `src/pages/Auth.tsx`

- Changer la redirection apres connexion de `/` vers `/select-activity`

### Modification : `src/App.tsx`

- Ajouter la route `/select-activity` (protegee par ProtectedRoute)

### Modification : `src/components/layout/AppSidebar.tsx`

- Ajouter un lien "Changer d'activite" dans le footer du menu, avant la deconnexion, qui redirige vers `/select-activity`

### Configuration

- Une constante `RESTAURANT_APP_URL` sera definie dans un fichier de configuration
- Tant que le projet restaurant n'est pas deploye, le bouton affichera "Bientot disponible" avec un style desactive

## Ce qui ne change pas

- Aucune modification de la base de donnees
- Aucune modification de la logique metier existante
- Toutes les pages actuelles restent identiques
- L'application reste 100% dediee a la transformation alimentaire

