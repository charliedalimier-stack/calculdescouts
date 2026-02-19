

# Redirection "Changer d'activite" vers StartFood

## Objectif

Modifier le lien "Changer d'activite" dans la sidebar pour rediriger vers l'application externe **https://starterfood.lovable.app/select-activity** au lieu de la route interne `/select-activity`.

## Modification

### Fichier : `src/components/layout/AppSidebar.tsx`

Remplacer le `<Link to="/select-activity">` par un lien externe utilisant `window.location.href` ou une balise `<a>` pointant vers `https://starterfood.lovable.app/select-activity`.

### Fichier : `src/lib/config.ts`

Ajouter une constante `STARTER_APP_URL` pour centraliser l'URL de l'application StartFood, facilitant les modifications futures.

### Nettoyage optionnel

La route interne `/select-activity` dans `App.tsx` et la page `src/pages/SelectActivity.tsx` peuvent etre conservees ou supprimees selon votre preference, puisque la selection se fera desormais depuis l'application StartFood.

## Impact

- Aucune modification de la base de donnees
- Aucune modification de la logique metier
- Seul le comportement du lien "Changer d'activite" change : redirection externe au lieu de navigation interne

