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
      action_logs: {
        Row: {
          action_plan_id: string
          created_at: string | null
          id: string
          log_date: string
          status: Database["public"]["Enums"]["action_status"]
        }
        Insert: {
          action_plan_id: string
          created_at?: string | null
          id?: string
          log_date: string
          status?: Database["public"]["Enums"]["action_status"]
        }
        Update: {
          action_plan_id?: string
          created_at?: string | null
          id?: string
          log_date?: string
          status?: Database["public"]["Enums"]["action_status"]
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_action_plan_id_fkey"
            columns: ["action_plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          cell_id: string
          created_at: string | null
          end_date: string | null
          id: string
          start_date: string | null
          target_count: number | null
          type: Database["public"]["Enums"]["action_type"]
          updated_at: string | null
        }
        Insert: {
          cell_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          target_count?: number | null
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string | null
        }
        Update: {
          cell_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          target_count?: number | null
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
        ]
      }
      cells: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          level: Database["public"]["Enums"]["cell_level"]
          mandalart_id: string
          position: number
          progress: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          level: Database["public"]["Enums"]["cell_level"]
          mandalart_id: string
          position: number
          progress?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["cell_level"]
          mandalart_id?: string
          position?: number
          progress?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cells_mandalart_id_fkey"
            columns: ["mandalart_id"]
            isOneToOne: false
            referencedRelation: "mandalarts"
            referencedColumns: ["id"]
          },
        ]
      }
      mandalarts: {
        Row: {
          created_at: string | null
          id: string
          start_date: string | null
          theme_color: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          start_date?: string | null
          theme_color?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          start_date?: string | null
          theme_color?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nickname: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nickname?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nickname?: string | null
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
      action_status: "DONE" | "SKIP"
      action_type: "DAILY" | "WEEKLY" | "MONTHLY"
      cell_level: "CENTER" | "SUB_CENTER" | "LEAF"
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
      action_status: ["DONE", "SKIP"],
      action_type: ["DAILY", "WEEKLY", "MONTHLY"],
      cell_level: ["CENTER", "SUB_CENTER", "LEAF"],
    },
  },
} as const
