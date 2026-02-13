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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      business_status: {
        Row: {
          closed_at: string | null
          id: string
          is_open: boolean
          opened_at: string | null
          opened_by: string | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          id?: string
          is_open?: boolean
          opened_at?: string | null
          opened_by?: string | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          id?: string
          is_open?: boolean
          opened_at?: string | null
          opened_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          amount_paid: number
          created_at: string
          credit_group_id: string | null
          customer_name: string | null
          id: string
          is_credit: boolean
          is_paid: boolean
          movement_date: string
          movement_type: string
          notes: string | null
          package_type: string | null
          product_id: string
          quantity: number
          sold_by: string | null
          total_amount: number
          unit_equivalence_id: string | null
          unit_price: number
          units_per_package: number | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          credit_group_id?: string | null
          customer_name?: string | null
          id?: string
          is_credit?: boolean
          is_paid?: boolean
          movement_date?: string
          movement_type: string
          notes?: string | null
          package_type?: string | null
          product_id: string
          quantity: number
          sold_by?: string | null
          total_amount: number
          unit_equivalence_id?: string | null
          unit_price: number
          units_per_package?: number | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          credit_group_id?: string | null
          customer_name?: string | null
          id?: string
          is_credit?: boolean
          is_paid?: boolean
          movement_date?: string
          movement_type?: string
          notes?: string | null
          package_type?: string | null
          product_id?: string
          quantity?: number
          sold_by?: string | null
          total_amount?: number
          unit_equivalence_id?: string | null
          unit_price?: number
          units_per_package?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_unit_equivalence_id_fkey"
            columns: ["unit_equivalence_id"]
            isOneToOne: false
            referencedRelation: "unit_equivalences"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          product_id: string
          units_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: number
          product_id: string
          units_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          product_id?: string
          units_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_unit: string
          code: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          price_per_kilo: number | null
          purchase_price: number
          sale_price: number
          sale_type: string
          stock: number
          stock_base_units: number
          unit: string
          updated_at: string
        }
        Insert: {
          base_unit?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          price_per_kilo?: number | null
          purchase_price?: number
          sale_price: number
          sale_type?: string
          stock?: number
          stock_base_units?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          base_unit?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          price_per_kilo?: number | null
          purchase_price?: number
          sale_price?: number
          sale_type?: string
          stock?: number
          stock_base_units?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unit_equivalences: {
        Row: {
          base_unit_multiplier: number
          created_at: string
          display_order: number
          id: string
          price: number
          product_id: string
          unit_name: string
        }
        Insert: {
          base_unit_multiplier: number
          created_at?: string
          display_order?: number
          id?: string
          price?: number
          product_id: string
          unit_name: string
        }
        Update: {
          base_unit_multiplier?: number
          created_at?: string
          display_order?: number
          id?: string
          price?: number
          product_id?: string
          unit_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_equivalences_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      accounts_receivable: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          customer_name: string | null
          debt_percentage: number | null
          id: string | null
          is_credit: boolean | null
          is_paid: boolean | null
          movement_date: string | null
          movement_type: string | null
          notes: string | null
          package_type: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          seller_name: string | null
          sold_by: string | null
          total_amount: number | null
          unit_price: number | null
          units_per_package: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_base_units: {
        Args: {
          _product_id: string
          _quantity: number
          _unit_equivalence_id?: string
        }
        Returns: number
      }
      get_readable_stock: { Args: { _product_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "empleado"
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
    Enums: {
      app_role: ["admin", "empleado"],
    },
  },
} as const
