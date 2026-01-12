export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      breakeven_analysis: {
        Row: {
          ca_minimum: number | null
          canal: string | null
          created_at: string
          id: string
          inclure_tva: boolean
          marge_securite: number | null
          mode: string
          mois: string
          product_id: string | null
          project_id: string
          updated_at: string
          volume_minimum: number | null
        }
        Insert: {
          ca_minimum?: number | null
          canal?: string | null
          created_at?: string
          id?: string
          inclure_tva?: boolean
          marge_securite?: number | null
          mode?: string
          mois: string
          product_id?: string | null
          project_id: string
          updated_at?: string
          volume_minimum?: number | null
        }
        Update: {
          ca_minimum?: number | null
          canal?: string | null
          created_at?: string
          id?: string
          inclure_tva?: boolean
          marge_securite?: number | null
          mode?: string
          mois?: string
          product_id?: string | null
          project_id?: string
          updated_at?: string
          volume_minimum?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "breakeven_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breakeven_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          created_at: string
          decaissements: number
          delai_paiement_jours: number
          encaissements: number
          id: string
          mode: string
          mois: string
          notes: string | null
          project_id: string
          tva_collectee: number
          tva_deductible: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          decaissements?: number
          delai_paiement_jours?: number
          encaissements?: number
          id?: string
          mode?: string
          mois: string
          notes?: string | null
          project_id: string
          tva_collectee?: number
          tva_deductible?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          decaissements?: number
          delai_paiement_jours?: number
          encaissements?: number
          id?: string
          mode?: string
          mois?: string
          notes?: string | null
          project_id?: string
          tva_collectee?: number
          tva_deductible?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_stress_tests: {
        Row: {
          augmentation_stock_pct: number | null
          baisse_ventes_pct: number | null
          besoin_tresorerie_max: number | null
          cash_flow_projete: number[] | null
          created_at: string
          hausse_cout_matieres_pct: number | null
          id: string
          mois_tension_critique: number | null
          nom_scenario: string
          project_id: string
          retard_paiement_jours: number | null
        }
        Insert: {
          augmentation_stock_pct?: number | null
          baisse_ventes_pct?: number | null
          besoin_tresorerie_max?: number | null
          cash_flow_projete?: number[] | null
          created_at?: string
          hausse_cout_matieres_pct?: number | null
          id?: string
          mois_tension_critique?: number | null
          nom_scenario: string
          project_id: string
          retard_paiement_jours?: number | null
        }
        Update: {
          augmentation_stock_pct?: number | null
          baisse_ventes_pct?: number | null
          besoin_tresorerie_max?: number | null
          cash_flow_projete?: number[] | null
          created_at?: string
          hausse_cout_matieres_pct?: number | null
          id?: string
          mois_tension_critique?: number | null
          nom_scenario?: string
          project_id?: string
          retard_paiement_jours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_stress_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          nom_categorie: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom_categorie: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom_categorie?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          cout_unitaire: number
          created_at: string
          fournisseur: string | null
          id: string
          is_sous_recette: boolean
          mode: string
          nom_ingredient: string
          project_id: string
          source_product_id: string | null
          tva_taux: number | null
          unite: string
          updated_at: string
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          fournisseur?: string | null
          id?: string
          is_sous_recette?: boolean
          mode?: string
          nom_ingredient: string
          project_id: string
          source_product_id?: string | null
          tva_taux?: number | null
          unite?: string
          updated_at?: string
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          fournisseur?: string | null
          id?: string
          is_sous_recette?: boolean
          mode?: string
          nom_ingredient?: string
          project_id?: string
          source_product_id?: string | null
          tva_taux?: number | null
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging: {
        Row: {
          cout_unitaire: number
          created_at: string
          id: string
          mode: string
          nom: string
          project_id: string
          tva_taux: number | null
          type_emballage: string | null
          unite: string
          updated_at: string
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          mode?: string
          nom: string
          project_id: string
          tva_taux?: number | null
          type_emballage?: string | null
          unite?: string
          updated_at?: string
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          mode?: string
          nom?: string
          project_id?: string
          tva_taux?: number | null
          type_emballage?: string | null
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      product_comments: {
        Row: {
          canal: string | null
          category_id: string | null
          commentaire: string | null
          created_at: string
          id: string
          mode: string
          product_id: string | null
          project_id: string
          recommandation: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          canal?: string | null
          category_id?: string | null
          commentaire?: string | null
          created_at?: string
          id?: string
          mode?: string
          product_id?: string | null
          project_id: string
          recommandation?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          canal?: string | null
          category_id?: string | null
          commentaire?: string | null
          created_at?: string
          id?: string
          mode?: string
          product_id?: string | null
          project_id?: string
          recommandation?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_comments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packaging: {
        Row: {
          created_at: string
          id: string
          mode: string
          packaging_id: string
          product_id: string
          quantite: number
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          packaging_id: string
          product_id: string
          quantite?: number
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          packaging_id?: string
          product_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_packaging_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packaging_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variable_costs: {
        Row: {
          created_at: string
          id: string
          mode: string
          product_id: string
          quantite: number
          variable_cost_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          product_id: string
          quantite?: number
          variable_cost_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          product_id?: string
          quantite?: number
          variable_cost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variable_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variable_costs_variable_cost_id_fkey"
            columns: ["variable_cost_id"]
            isOneToOne: false
            referencedRelation: "variable_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          categorie_id: string | null
          created_at: string
          id: string
          mode: string
          nom_produit: string
          prix_btc: number
          project_id: string
          tva_taux: number | null
          unite_vente: string
          updated_at: string
        }
        Insert: {
          categorie_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          nom_produit: string
          prix_btc?: number
          project_id: string
          tva_taux?: number | null
          unite_vente?: string
          updated_at?: string
        }
        Update: {
          categorie_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          nom_produit?: string
          prix_btc?: number
          project_id?: string
          tva_taux?: number | null
          unite_vente?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_expenses: {
        Row: {
          categorie_frais: string
          created_at: string
          id: string
          libelle: string
          mode: string
          mois: string
          montant_ht: number
          montant_ttc: number | null
          project_id: string
          tva_taux: number | null
          updated_at: string
        }
        Insert: {
          categorie_frais?: string
          created_at?: string
          id?: string
          libelle: string
          mode?: string
          mois: string
          montant_ht?: number
          montant_ttc?: number | null
          project_id: string
          tva_taux?: number | null
          updated_at?: string
        }
        Update: {
          categorie_frais?: string
          created_at?: string
          id?: string
          libelle?: string
          mode?: string
          mois?: string
          montant_ht?: number
          montant_ttc?: number | null
          project_id?: string
          tva_taux?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_settings: {
        Row: {
          coefficient_cible: number
          coefficient_min: number
          created_at: string
          delai_paiement_client: number
          delai_paiement_fournisseur: number
          id: string
          marge_btb: number
          marge_cible: number
          marge_distributeur: number
          marge_min: number
          pays: string
          project_id: string
          regime_tva: string
          seuil_stock_alerte: number
          tva_achat: number
          tva_reduit_1: number
          tva_reduit_2: number
          tva_standard: number
          tva_vente: number
          updated_at: string
        }
        Insert: {
          coefficient_cible?: number
          coefficient_min?: number
          created_at?: string
          delai_paiement_client?: number
          delai_paiement_fournisseur?: number
          id?: string
          marge_btb?: number
          marge_cible?: number
          marge_distributeur?: number
          marge_min?: number
          pays?: string
          project_id: string
          regime_tva?: string
          seuil_stock_alerte?: number
          tva_achat?: number
          tva_reduit_1?: number
          tva_reduit_2?: number
          tva_standard?: number
          tva_vente?: number
          updated_at?: string
        }
        Update: {
          coefficient_cible?: number
          coefficient_min?: number
          created_at?: string
          delai_paiement_client?: number
          delai_paiement_fournisseur?: number
          id?: string
          marge_btb?: number
          marge_cible?: number
          marge_distributeur?: number
          marge_min?: number
          pays?: string
          project_id?: string
          regime_tva?: string
          seuil_stock_alerte?: number
          tva_achat?: number
          tva_reduit_1?: number
          tva_reduit_2?: number
          tva_standard?: number
          tva_vente?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom_projet: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom_projet: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom_projet?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          mode: string
          product_id: string
          quantite_utilisee: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          mode?: string
          product_id: string
          quantite_utilisee?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          mode?: string
          product_id?: string
          quantite_utilisee?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_actuals: {
        Row: {
          created_at: string
          id: string
          mode: string
          mois: string
          product_id: string
          project_id: string
          quantite_reelle: number
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          mois: string
          product_id: string
          project_id: string
          quantite_reelle?: number
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          mois?: string
          product_id?: string
          project_id?: string
          quantite_reelle?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_actuals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_actuals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string
          id: string
          mode: string
          mois: string
          product_id: string
          project_id: string
          quantite_objectif: number
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          mois: string
          product_id: string
          project_id: string
          quantite_objectif?: number
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          mois?: string
          product_id?: string
          project_id?: string
          quantite_objectif?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sensitivity_scenarios: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          impact_cash_flow: number | null
          impact_cout_revient: number | null
          impact_marge: number | null
          impact_rentabilite: number | null
          nom_scenario: string
          product_id: string | null
          project_id: string
          variation_cout_matieres: number
          variation_prix_vente: number
          variation_volume: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          impact_cash_flow?: number | null
          impact_cout_revient?: number | null
          impact_marge?: number | null
          impact_rentabilite?: number | null
          nom_scenario: string
          product_id?: string | null
          project_id: string
          variation_cout_matieres?: number
          variation_prix_vente?: number
          variation_volume?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          impact_cash_flow?: number | null
          impact_cout_revient?: number | null
          impact_marge?: number | null
          impact_rentabilite?: number | null
          nom_scenario?: string
          product_id?: string | null
          project_id?: string
          variation_cout_matieres?: number
          variation_prix_vente?: number
          variation_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensitivity_scenarios_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitivity_scenarios_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitivity_scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          cout_unitaire: number | null
          created_at: string
          id: string
          motif: string | null
          project_id: string
          quantite: number
          reference_id: string | null
          stock_id: string
          type_mouvement: string
        }
        Insert: {
          cout_unitaire?: number | null
          created_at?: string
          id?: string
          motif?: string | null
          project_id: string
          quantite: number
          reference_id?: string | null
          stock_id: string
          type_mouvement: string
        }
        Update: {
          cout_unitaire?: number | null
          created_at?: string
          id?: string
          motif?: string | null
          project_id?: string
          quantite?: number
          reference_id?: string | null
          stock_id?: string
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          cout_unitaire: number
          created_at: string
          id: string
          ingredient_id: string | null
          mode: string
          packaging_id: string | null
          product_id: string | null
          project_id: string
          quantite: number
          seuil_alerte: number | null
          type_stock: string
          updated_at: string
          valeur_totale: number | null
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          ingredient_id?: string | null
          mode?: string
          packaging_id?: string | null
          product_id?: string | null
          project_id: string
          quantite?: number
          seuil_alerte?: number | null
          type_stock: string
          updated_at?: string
          valeur_totale?: number | null
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          ingredient_id?: string | null
          mode?: string
          packaging_id?: string | null
          product_id?: string | null
          project_id?: string
          quantite?: number
          seuil_alerte?: number | null
          type_stock?: string
          updated_at?: string
          valeur_totale?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stocks_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      variable_costs: {
        Row: {
          cout_unitaire: number
          created_at: string
          id: string
          mode: string
          nom: string
          project_id: string
          tva_taux: number | null
          type_cout: string
          unite: string
          updated_at: string
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          mode?: string
          nom: string
          project_id: string
          tva_taux?: number | null
          type_cout?: string
          unite?: string
          updated_at?: string
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          mode?: string
          nom?: string
          project_id?: string
          tva_taux?: number | null
          type_cout?: string
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variable_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
