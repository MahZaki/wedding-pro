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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      budget_categories: {
        Row: {
          allocated_amount: number
          id: string
          name: string
          sort_order: number | null
          wedding_id: string | null
        }
        Insert: {
          allocated_amount: number
          id?: string
          name: string
          sort_order?: number | null
          wedding_id?: string | null
        }
        Update: {
          allocated_amount?: number
          id?: string
          name?: string
          sort_order?: number | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_cost: number | null
          category_id: string | null
          estimated_cost: number | null
          id: string
          is_paid: boolean | null
          name: string
          vendor_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          category_id?: string | null
          estimated_cost?: number | null
          id?: string
          is_paid?: boolean | null
          name: string
          vendor_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          category_id?: string | null
          estimated_cost?: number | null
          id?: string
          is_paid?: boolean | null
          name?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          contributor: string
          created_at: string | null
          id: string
          label: string | null
          notes: string | null
          received: boolean | null
          received_at: string | null
          wedding_id: string | null
        }
        Insert: {
          amount: number
          contributor: string
          created_at?: string | null
          id?: string
          label?: string | null
          notes?: string | null
          received?: boolean | null
          received_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          amount?: number
          contributor?: string
          created_at?: string | null
          id?: string
          label?: string | null
          notes?: string | null
          received?: boolean | null
          received_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          date: string | null
          id: string
          location: string | null
          name: string
          start_time: string | null
          wedding_id: string | null
        }
        Insert: {
          date?: string | null
          id?: string
          location?: string | null
          name: string
          start_time?: string | null
          wedding_id?: string | null
        }
        Update: {
          date?: string | null
          id?: string
          location?: string | null
          name?: string
          start_time?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          budget_item_id: string | null
          created_at: string | null
          description: string
          id: string
          paid_at: string | null
          paid_by: string | null
          receipt_url: string | null
          vendor_id: string | null
          wedding_id: string | null
        }
        Insert: {
          amount: number
          budget_item_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          receipt_url?: string | null
          vendor_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          amount?: number
          budget_item_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          receipt_url?: string | null
          vendor_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          age_group: string | null
          allergies: string[] | null
          email: string | null
          first_name: string
          group_id: string | null
          id: string
          invitation_group_id: string | null
          is_child: boolean | null
          last_name: string
          meal_preference: string | null
          notes: string | null
          phone: string | null
          side: string | null
          table_id: string | null
          tags: string[] | null
          thank_you_sent: boolean | null
          thank_you_sent_at: string | null
          token: string | null
          wedding_id: string | null
        }
        Insert: {
          address?: string | null
          age_group?: string | null
          allergies?: string[] | null
          email?: string | null
          first_name: string
          group_id?: string | null
          id?: string
          invitation_group_id?: string | null
          is_child?: boolean | null
          last_name: string
          meal_preference?: string | null
          notes?: string | null
          phone?: string | null
          side?: string | null
          table_id?: string | null
          tags?: string[] | null
          thank_you_sent?: boolean | null
          thank_you_sent_at?: string | null
          token?: string | null
          wedding_id?: string | null
        }
        Update: {
          address?: string | null
          age_group?: string | null
          allergies?: string[] | null
          email?: string | null
          first_name?: string
          group_id?: string | null
          id?: string
          invitation_group_id?: string | null
          is_child?: boolean | null
          last_name?: string
          meal_preference?: string | null
          notes?: string | null
          phone?: string | null
          side?: string | null
          table_id?: string | null
          tags?: string[] | null
          thank_you_sent?: boolean | null
          thank_you_sent_at?: string | null
          token?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "guest_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_groups: {
        Row: {
          created_at: string | null
          id: string
          name: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_groups_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          amount: number
          budget_item_id: string | null
          due_date: string
          id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          amount: number
          budget_item_id?: string | null
          due_date: string
          id?: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          budget_item_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          dietary: string | null
          dietary_tags: string[] | null
          event_id: string | null
          guest_id: string | null
          id: string
          plus_one_name: string | null
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          dietary?: string | null
          dietary_tags?: string[] | null
          event_id?: string | null
          guest_id?: string | null
          id?: string
          plus_one_name?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          dietary?: string | null
          dietary_tags?: string[] | null
          event_id?: string | null
          guest_id?: string | null
          id?: string
          plus_one_name?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          id: string
          label: string | null
          pos_x: number | null
          pos_y: number | null
          shape: string | null
          table_number: number | null
          wedding_id: string | null
        }
        Insert: {
          capacity: number
          id?: string
          label?: string | null
          pos_x?: number | null
          pos_y?: number | null
          shape?: string | null
          table_number?: number | null
          wedding_id?: string | null
        }
        Update: {
          capacity?: number
          id?: string
          label?: string | null
          pos_x?: number | null
          pos_y?: number | null
          shape?: string | null
          table_number?: number | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_items: {
        Row: {
          assigned_roles: string[] | null
          end_time: string | null
          event_id: string | null
          id: string
          is_anchor: boolean | null
          sort_order: number | null
          start_time: string
          title: string
        }
        Insert: {
          assigned_roles?: string[] | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          is_anchor?: boolean | null
          sort_order?: number | null
          start_time: string
          title: string
        }
        Update: {
          assigned_roles?: string[] | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          is_anchor?: boolean | null
          sort_order?: number | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          business_name: string
          category: string
          contact_name: string | null
          contract_url: string | null
          email: string | null
          id: string
          notes: string | null
          parsed_contract: Json | null
          phone: string | null
          website: string | null
          wedding_id: string | null
        }
        Insert: {
          business_name: string
          category: string
          contact_name?: string | null
          contract_url?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          parsed_contract?: Json | null
          phone?: string | null
          website?: string | null
          wedding_id?: string | null
        }
        Update: {
          business_name?: string
          category?: string
          contact_name?: string | null
          contract_url?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          parsed_contract?: Json | null
          phone?: string | null
          website?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_members: {
        Row: {
          id: string
          invited_at: string | null
          role: string
          trial_started_at: string | null
          user_id: string | null
          wedding_id: string | null
        }
        Insert: {
          id?: string
          invited_at?: string | null
          role: string
          trial_started_at?: string | null
          user_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          id?: string
          invited_at?: string | null
          role?: string
          trial_started_at?: string | null
          user_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_members_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          ceremony_location: string | null
          created_at: string | null
          currency: string | null
          guest_count_estimate: number | null
          id: string
          partner1_name: string | null
          partner2_name: string | null
          reception_location: string | null
          region_tier: string | null
          setup_complete: boolean | null
          target_budget: number
          timezone: string | null
          title: string
          wedding_date: string | null
          wedding_style: string | null
        }
        Insert: {
          ceremony_location?: string | null
          created_at?: string | null
          currency?: string | null
          guest_count_estimate?: number | null
          id?: string
          partner1_name?: string | null
          partner2_name?: string | null
          reception_location?: string | null
          region_tier?: string | null
          setup_complete?: boolean | null
          target_budget: number
          timezone?: string | null
          title: string
          wedding_date?: string | null
          wedding_style?: string | null
        }
        Update: {
          ceremony_location?: string | null
          created_at?: string | null
          currency?: string | null
          guest_count_estimate?: number | null
          id?: string
          partner1_name?: string | null
          partner2_name?: string | null
          reception_location?: string | null
          region_tier?: string | null
          setup_complete?: boolean | null
          target_budget?: number
          timezone?: string | null
          title?: string
          wedding_date?: string | null
          wedding_style?: string | null
        }
        Relationships: []
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
