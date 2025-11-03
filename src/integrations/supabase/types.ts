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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_plans: {
        Row: {
          analysis_result_id: string
          business_id: string
          category: string
          created_at: string
          description: string
          estimated_effort: string | null
          estimated_impact: string | null
          id: string
          priority: string
          status: string | null
          tasks: Json
          title: string
          updated_at: string
        }
        Insert: {
          analysis_result_id: string
          business_id: string
          category: string
          created_at?: string
          description: string
          estimated_effort?: string | null
          estimated_impact?: string | null
          id?: string
          priority: string
          status?: string | null
          tasks?: Json
          title: string
          updated_at?: string
        }
        Update: {
          analysis_result_id?: string
          business_id?: string
          category?: string
          created_at?: string
          description?: string
          estimated_effort?: string | null
          estimated_impact?: string | null
          id?: string
          priority?: string
          status?: string | null
          tasks?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_analysis_result_id_fkey"
            columns: ["analysis_result_id"]
            isOneToOne: false
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_results: {
        Row: {
          analysis_version: string | null
          analyzed_at: string
          branding_details: Json | null
          branding_score: number
          business_id: string
          design_details: Json | null
          design_score: number
          id: string
          issues_identified: string[] | null
          overall_score: number | null
          recommendations: string[] | null
          seo_details: Json | null
          seo_score: number
          uiux_details: Json | null
          uiux_score: number | null
        }
        Insert: {
          analysis_version?: string | null
          analyzed_at?: string
          branding_details?: Json | null
          branding_score: number
          business_id: string
          design_details?: Json | null
          design_score: number
          id?: string
          issues_identified?: string[] | null
          overall_score?: number | null
          recommendations?: string[] | null
          seo_details?: Json | null
          seo_score: number
          uiux_details?: Json | null
          uiux_score?: number | null
        }
        Update: {
          analysis_version?: string | null
          analyzed_at?: string
          branding_details?: Json | null
          branding_score?: number
          business_id?: string
          design_details?: Json | null
          design_score?: number
          id?: string
          issues_identified?: string[] | null
          overall_score?: number | null
          recommendations?: string[] | null
          seo_details?: Json | null
          seo_score?: number
          uiux_details?: Json | null
          uiux_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          description: string | null
          discovered_at: string
          email: string | null
          id: string
          industry: string | null
          last_analyzed: string | null
          location: string | null
          name: string
          phone: string | null
          search_query_id: string | null
          social_media: Json | null
          status: string | null
          website_url: string | null
        }
        Insert: {
          description?: string | null
          discovered_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          last_analyzed?: string | null
          location?: string | null
          name: string
          phone?: string | null
          search_query_id?: string | null
          social_media?: Json | null
          status?: string | null
          website_url?: string | null
        }
        Update: {
          description?: string | null
          discovered_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          last_analyzed?: string | null
          location?: string | null
          name?: string
          phone?: string | null
          search_query_id?: string | null
          social_media?: Json | null
          status?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_search_query_id_fkey"
            columns: ["search_query_id"]
            isOneToOne: false
            referencedRelation: "search_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          action_plan_id: string | null
          business_id: string
          created_at: string
          email_body: string
          id: string
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          replied_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          action_plan_id?: string | null
          business_id: string
          created_at?: string
          email_body: string
          id?: string
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          action_plan_id?: string | null
          business_id?: string
          created_at?: string
          email_body?: string
          id?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      places_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          industry: string | null
          location: string
          radius: number
          results: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          id?: string
          industry?: string | null
          location: string
          radius: number
          results: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          industry?: string | null
          location?: string
          radius?: number
          results?: Json
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          query_type: string
          results_count: number | null
          search_parameters: Json
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          query_type: string
          results_count?: number | null
          search_parameters: Json
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          query_type?: string
          results_count?: number | null
          search_parameters?: Json
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: { Args: never; Returns: undefined }
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
