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
      cash_flow: {
        Row: {
          created_at: string
          decaissements: number
          delai_paiement_jours: number
          encaissements: number
          id: string
          mois: string
          notes: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decaissements?: number
          delai_paiement_jours?: number
          encaissements?: number
          id?: string
          mois: string
          notes?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decaissements?: number
          delai_paiement_jours?: number
          encaissements?: number
          id?: string
          mois?: string
          notes?: string | null
          project_id?: string
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
          nom_ingredient: string
          project_id: string
          unite: string
          updated_at: string
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          fournisseur?: string | null
          id?: string
          nom_ingredient: string
          project_id: string
          unite?: string
          updated_at?: string
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          fournisseur?: string | null
          id?: string
          nom_ingredient?: string
          project_id?: string
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
        ]
      }
      packaging: {
        Row: {
          cout_unitaire: number
          created_at: string
          id: string
          nom: string
          project_id: string
          type_emballage: string | null
          unite: string
          updated_at: string
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          nom: string
          project_id: string
          type_emballage?: string | null
          unite?: string
          updated_at?: string
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          nom?: string
          project_id?: string
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
      product_packaging: {
        Row: {
          created_at: string
          id: string
          packaging_id: string
          product_id: string
          quantite: number
        }
        Insert: {
          created_at?: string
          id?: string
          packaging_id: string
          product_id: string
          quantite?: number
        }
        Update: {
          created_at?: string
          id?: string
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
          product_id: string
          quantite: number
          variable_cost_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantite?: number
          variable_cost_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
          nom_produit: string
          prix_btc: number
          project_id: string
          unite_vente: string
          updated_at: string
        }
        Insert: {
          categorie_id?: string | null
          created_at?: string
          id?: string
          nom_produit: string
          prix_btc?: number
          project_id: string
          unite_vente?: string
          updated_at?: string
        }
        Update: {
          categorie_id?: string | null
          created_at?: string
          id?: string
          nom_produit?: string
          prix_btc?: number
          project_id?: string
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
          product_id: string
          quantite_utilisee: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          product_id: string
          quantite_utilisee?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
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
          mois: string
          product_id: string
          project_id: string
          quantite_reelle: number
        }
        Insert: {
          created_at?: string
          id?: string
          mois: string
          product_id: string
          project_id: string
          quantite_reelle?: number
        }
        Update: {
          created_at?: string
          id?: string
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
          mois: string
          product_id: string
          project_id: string
          quantite_objectif: number
        }
        Insert: {
          created_at?: string
          id?: string
          mois: string
          product_id: string
          project_id: string
          quantite_objectif?: number
        }
        Update: {
          created_at?: string
          id?: string
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
      variable_costs: {
        Row: {
          cout_unitaire: number
          created_at: string
          id: string
          nom: string
          project_id: string
          type_cout: string
          unite: string
          updated_at: string
        }
        Insert: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          nom: string
          project_id: string
          type_cout?: string
          unite?: string
          updated_at?: string
        }
        Update: {
          cout_unitaire?: number
          created_at?: string
          id?: string
          nom?: string
          project_id?: string
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
