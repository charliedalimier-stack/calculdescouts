import { z } from 'zod';

// Product validation schema
export const productSchema = z.object({
  nom_produit: z.string()
    .min(1, 'Le nom du produit est requis')
    .max(200, 'Le nom du produit ne peut pas dépasser 200 caractères'),
  prix_btc: z.number()
    .nonnegative('Le prix doit être positif ou nul')
    .max(999999, 'Le prix ne peut pas dépasser 999 999 €'),
  unite_vente: z.string()
    .min(1, 'L\'unité de vente est requise')
    .max(50, 'L\'unité de vente ne peut pas dépasser 50 caractères'),
  categorie_id: z.string().uuid().nullable().optional(),
});

// Ingredient validation schema
export const ingredientSchema = z.object({
  nom_ingredient: z.string()
    .min(1, 'Le nom de l\'ingrédient est requis')
    .max(200, 'Le nom de l\'ingrédient ne peut pas dépasser 200 caractères'),
  cout_unitaire: z.number()
    .nonnegative('Le coût doit être positif ou nul')
    .max(999999, 'Le coût ne peut pas dépasser 999 999 €'),
  unite: z.string()
    .min(1, 'L\'unité est requise')
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères'),
  fournisseur: z.string().max(200, 'Le fournisseur ne peut pas dépasser 200 caractères').nullable().optional(),
});

// Packaging validation schema
export const packagingSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom de l\'emballage est requis')
    .max(200, 'Le nom de l\'emballage ne peut pas dépasser 200 caractères'),
  cout_unitaire: z.number()
    .nonnegative('Le coût doit être positif ou nul')
    .max(999999, 'Le coût ne peut pas dépasser 999 999 €'),
  unite: z.string()
    .min(1, 'L\'unité est requise')
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères'),
  type_emballage: z.enum(['primaire', 'secondaire', 'tertiaire']),
});

// Expense validation schema
export const expenseSchema = z.object({
  libelle: z.string()
    .min(1, 'Le libellé est requis')
    .max(200, 'Le libellé ne peut pas dépasser 200 caractères'),
  montant_ht: z.number()
    .nonnegative('Le montant doit être positif ou nul')
    .max(9999999, 'Le montant ne peut pas dépasser 9 999 999 €'),
  tva_taux: z.number()
    .min(0, 'Le taux de TVA ne peut pas être négatif')
    .max(100, 'Le taux de TVA ne peut pas dépasser 100%'),
  categorie_frais: z.string().min(1, 'La catégorie est requise'),
  mois: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
});

// Cash flow validation schema
export const cashFlowSchema = z.object({
  mois: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  encaissements: z.number()
    .nonnegative('Les encaissements doivent être positifs ou nuls')
    .max(99999999, 'Les encaissements ne peuvent pas dépasser 99 999 999 €'),
  decaissements: z.number()
    .nonnegative('Les décaissements doivent être positifs ou nuls')
    .max(99999999, 'Les décaissements ne peuvent pas dépasser 99 999 999 €'),
  delai_paiement_jours: z.number()
    .int('Le délai doit être un nombre entier')
    .min(0, 'Le délai ne peut pas être négatif')
    .max(365, 'Le délai ne peut pas dépasser 365 jours'),
  notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').nullable().optional(),
});

// Sales validation schema
export const salesSchema = z.object({
  product_id: z.string().uuid('ID produit invalide'),
  mois: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  quantite: z.number()
    .nonnegative('La quantité doit être positive ou nulle')
    .max(9999999, 'La quantité ne peut pas dépasser 9 999 999'),
});

// Category validation schema
export const categorySchema = z.object({
  nom_categorie: z.string()
    .min(1, 'Le nom de la catégorie est requis')
    .max(100, 'Le nom de la catégorie ne peut pas dépasser 100 caractères'),
});

// Helper function to validate and return error message or null
export function getValidationError<T>(schema: z.ZodSchema<T>, data: unknown): string | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return null;
  }
  return result.error.errors[0]?.message || 'Données invalides';
}

// Helper function to validate and parse data (returns data or undefined)
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}
