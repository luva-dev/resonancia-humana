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
      ai_settings: {
        Row: {
          api_key: string | null
          base_url: string | null
          id: string
          max_tokens: number
          model: string
          provider: string
          singleton: boolean
          temperature: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_key?: string | null
          base_url?: string | null
          id?: string
          max_tokens?: number
          model?: string
          provider?: string
          singleton?: boolean
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_key?: string | null
          base_url?: string | null
          id?: string
          max_tokens?: number
          model?: string
          provider?: string
          singleton?: boolean
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      congress_sessions: {
        Row: {
          created_at: string
          id: string
          markdown_filename: string | null
          module_id: string
          module_title: string
          sort_order: number
          speaker: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          markdown_filename?: string | null
          module_id: string
          module_title: string
          sort_order?: number
          speaker: string
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          markdown_filename?: string | null
          module_id?: string
          module_title?: string
          sort_order?: number
          speaker?: string
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_settings: {
        Row: {
          id: string
          rag_notice: string
          singleton: boolean
          style_prompt: string
          system_prompt: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          rag_notice: string
          singleton?: boolean
          style_prompt: string
          system_prompt: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          rag_notice?: string
          singleton?: boolean
          style_prompt?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      transcript_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          id: string
          keywords: string[]
          session_id: string
          token_estimate: number
          transcript_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          id?: string
          keywords?: string[]
          session_id: string
          token_estimate?: number
          transcript_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          id?: string
          keywords?: string[]
          session_id?: string
          token_estimate?: number
          transcript_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "congress_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_chunks_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          created_at: string
          id: string
          markdown_content: string
          markdown_filename: string | null
          session_id: string
          status: Database["public"]["Enums"]["transcript_status"]
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          markdown_content?: string
          markdown_filename?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["transcript_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          markdown_content?: string
          markdown_filename?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["transcript_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "congress_sessions"
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      transcript_status: "pending" | "loaded" | "updated"
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
      app_role: ["admin", "user"],
      transcript_status: ["pending", "loaded", "updated"],
    },
  },
} as const
