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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          course_id: string | null
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          kind?: string
          title: string
          user_id?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          created_at: string
          id: string
          status: string
          takeaways: string | null
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          status?: string
          takeaways?: string | null
          title: string
          user_id?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          status?: string
          takeaways?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          id: string
          name: string
          term_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          term_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          term_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          kind: string
          note: string | null
          project_id: string | null
          starts_at: string
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          kind?: string
          note?: string | null
          project_id?: string | null
          starts_at: string
          task_id?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          kind?: string
          note?: string | null
          project_id?: string | null
          starts_at?: string
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          horizon: string
          id: string
          progress: number
          progress_mode: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          horizon?: string
          id?: string
          progress?: number
          progress_mode?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          horizon?: string
          id?: string
          progress?: number
          progress_mode?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          user_id?: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          as_of: string
          contributed: number
          created_at: string
          current_value: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          as_of?: string
          contributed?: number
          created_at?: string
          current_value?: number
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          as_of?: string
          contributed?: number
          created_at?: string
          current_value?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          minutes: number
          note: string | null
          skill: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          minutes?: number
          note?: string | null
          skill: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          minutes?: number
          note?: string | null
          skill?: string
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          project_id: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          enabled_modules: string[]
          id: string
          onboarded: boolean
          updated_at: string
          weekly_available_hours: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          enabled_modules?: string[]
          id: string
          onboarded?: boolean
          updated_at?: string
          weekly_available_hours?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          enabled_modules?: string[]
          id?: string
          onboarded?: boolean
          updated_at?: string
          weekly_available_hours?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          area: string
          created_at: string
          deadline: string | null
          goal_id: string | null
          id: string
          outcome: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string
          created_at?: string
          deadline?: string | null
          goal_id?: string | null
          id?: string
          outcome?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          area?: string
          created_at?: string
          deadline?: string | null
          goal_id?: string | null
          id?: string
          outcome?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          goal_id: string | null
          id: string
          milestone_id: string | null
          priority: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          goal_id?: string | null
          id?: string
          milestone_id?: string | null
          priority?: string
          project_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          goal_id?: string | null
          id?: string
          milestone_id?: string | null
          priority?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          name: string
          starts_on: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          name: string
          starts_on?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          name?: string
          starts_on?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          kind: string
          note: string | null
          txn_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          txn_date?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          txn_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          created_at: string
          id: string
          obstacles: string | null
          priorities: string | null
          progress: string | null
          user_id: string
          week_start: string
          wins: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          obstacles?: string | null
          priorities?: string | null
          progress?: string | null
          user_id?: string
          week_start: string
          wins?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          obstacles?: string | null
          priorities?: string | null
          progress?: string | null
          user_id?: string
          week_start?: string
          wins?: string | null
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
