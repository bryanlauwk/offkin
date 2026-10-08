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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      brick_concepts: {
        Row: {
          brand: string
          cache_key: string
          created_at: string
          edition: string
          format: string
          id: string
          image_path: string
          interaction: string
          prompt_version: string
          source_title: string
          source_url: string
          story: string
          title: string
        }
        Insert: {
          brand: string
          cache_key: string
          created_at?: string
          edition?: string
          format?: string
          id?: string
          image_path: string
          interaction?: string
          prompt_version: string
          source_title?: string
          source_url?: string
          story: string
          title: string
        }
        Update: {
          brand?: string
          cache_key?: string
          created_at?: string
          edition?: string
          format?: string
          id?: string
          image_path?: string
          interaction?: string
          prompt_version?: string
          source_title?: string
          source_url?: string
          story?: string
          title?: string
        }
        Relationships: []
      }
      brick_generation_limits: {
        Row: {
          expires_at: string
          key: string
          used: number
        }
        Insert: {
          expires_at: string
          key: string
          used: number
        }
        Update: {
          expires_at?: string
          key?: string
          used?: number
        }
        Relationships: []
      }
      proposal_request_limits: {
        Row: {
          expires_at: string
          key: string
          used: number
        }
        Insert: {
          expires_at: string
          key: string
          used?: number
        }
        Update: {
          expires_at?: string
          key?: string
          used?: number
        }
        Relationships: []
      }
      proposal_requests: {
        Row: {
          asset_ids: string[]
          brand_name: string
          budget: string
          buyer_name: string
          company: string
          concept_story: string
          concept_summary: Json
          created_at: string
          id: string
          priorities: string
          quantity: string
          reference: string
          status: string
          timing: string
          website: string
          work_email: string
        }
        Insert: {
          asset_ids: string[]
          brand_name: string
          budget?: string
          buyer_name: string
          company: string
          concept_story: string
          concept_summary?: Json
          created_at?: string
          id?: string
          priorities?: string
          quantity?: string
          reference?: string
          status?: string
          timing?: string
          website?: string
          work_email: string
        }
        Update: {
          asset_ids?: string[]
          brand_name?: string
          budget?: string
          buyer_name?: string
          company?: string
          concept_story?: string
          concept_summary?: Json
          created_at?: string
          id?: string
          priorities?: string
          quantity?: string
          reference?: string
          status?: string
          timing?: string
          website?: string
          work_email?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          choice: string
          created_at: string
          id: string
          level: number
          opponent_choice: string | null
          outcome: string | null
          session_id: string
          wait_time_seconds: number | null
        }
        Insert: {
          choice: string
          created_at?: string
          id?: string
          level: number
          opponent_choice?: string | null
          outcome?: string | null
          session_id: string
          wait_time_seconds?: number | null
        }
        Update: {
          choice?: string
          created_at?: string
          id?: string
          level?: number
          opponent_choice?: string | null
          outcome?: string | null
          session_id?: string
          wait_time_seconds?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_brick_generation: {
        Args: { client_key: string }
        Returns: boolean
      }
      reserve_proposal_request: {
        Args: { client_key: string }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
