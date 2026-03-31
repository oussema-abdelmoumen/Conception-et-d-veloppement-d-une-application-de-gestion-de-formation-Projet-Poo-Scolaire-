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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      domaines: {
        Row: {
          created_at: string
          id: string
          libelle: string
        }
        Insert: {
          created_at?: string
          id?: string
          libelle: string
        }
        Update: {
          created_at?: string
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      employeurs: {
        Row: {
          created_at: string
          id: string
          nom_employeur: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom_employeur: string
        }
        Update: {
          created_at?: string
          id?: string
          nom_employeur?: string
        }
        Relationships: []
      }
      formateurs: {
        Row: {
          created_at: string
          email: string | null
          id: string
          id_employeur: string | null
          nom: string
          prenom: string
          tel: string | null
          type: Database["public"]["Enums"]["type_formateur"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          id_employeur?: string | null
          nom: string
          prenom: string
          tel?: string | null
          type?: Database["public"]["Enums"]["type_formateur"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          id_employeur?: string | null
          nom?: string
          prenom?: string
          tel?: string | null
          type?: Database["public"]["Enums"]["type_formateur"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formateurs_id_employeur_fkey"
            columns: ["id_employeur"]
            isOneToOne: false
            referencedRelation: "employeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_formateurs: {
        Row: {
          id: string
          id_formateur: string
          id_formation: string
        }
        Insert: {
          id?: string
          id_formateur: string
          id_formation: string
        }
        Update: {
          id?: string
          id_formateur?: string
          id_formation?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_formateurs_id_formateur_fkey"
            columns: ["id_formateur"]
            isOneToOne: false
            referencedRelation: "formateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_formateurs_id_formation_fkey"
            columns: ["id_formation"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_participants: {
        Row: {
          id: string
          id_formation: string
          id_participant: string
        }
        Insert: {
          id?: string
          id_formation: string
          id_participant: string
        }
        Update: {
          id?: string
          id_formation?: string
          id_participant?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_participants_id_formation_fkey"
            columns: ["id_formation"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_participants_id_participant_fkey"
            columns: ["id_participant"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          annee: number
          budget: number
          created_at: string
          duree: number
          id: string
          id_domaine: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          annee: number
          budget?: number
          created_at?: string
          duree: number
          id?: string
          id_domaine?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          annee?: number
          budget?: number
          created_at?: string
          duree?: number
          id?: string
          id_domaine?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_id_domaine_fkey"
            columns: ["id_domaine"]
            isOneToOne: false
            referencedRelation: "domaines"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          email: string | null
          id: string
          id_profil: string | null
          id_structure: string | null
          nom: string
          prenom: string
          tel: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          id_profil?: string | null
          id_structure?: string | null
          nom: string
          prenom: string
          tel?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          id_profil?: string | null
          id_structure?: string | null
          nom?: string
          prenom?: string
          tel?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_id_profil_fkey"
            columns: ["id_profil"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_id_structure_fkey"
            columns: ["id_structure"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      profils: {
        Row: {
          created_at: string
          id: string
          libelle: string
        }
        Insert: {
          created_at?: string
          id?: string
          libelle: string
        }
        Update: {
          created_at?: string
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      structures: {
        Row: {
          created_at: string
          id: string
          libelle: string
        }
        Insert: {
          created_at?: string
          id?: string
          libelle: string
        }
        Update: {
          created_at?: string
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "administrateur" | "responsable" | "simple_utilisateur"
      type_formateur: "interne" | "externe"
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
      app_role: ["administrateur", "responsable", "simple_utilisateur"],
      type_formateur: ["interne", "externe"],
    },
  },
} as const
