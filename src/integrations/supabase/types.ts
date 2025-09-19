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
      bairros: {
        Row: {
          ativo: boolean
          cidade_id: string | null
          created_at: string
          id: string
          nome: string
          regional_id: string | null
        }
        Insert: {
          ativo?: boolean
          cidade_id?: string | null
          created_at?: string
          id?: string
          nome: string
          regional_id?: string | null
        }
        Update: {
          ativo?: boolean
          cidade_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          regional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bairros_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bairros_regional_id_fkey"
            columns: ["regional_id"]
            isOneToOne: false
            referencedRelation: "regionais"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_anos: {
        Row: {
          ano: number
          candidato_id: string
          created_at: string
          id: string
          votos_por_bairro_file: string | null
          votos_por_secao_file: string | null
        }
        Insert: {
          ano: number
          candidato_id: string
          created_at?: string
          id?: string
          votos_por_bairro_file?: string | null
          votos_por_secao_file?: string | null
        }
        Update: {
          ano?: number
          candidato_id?: string
          created_at?: string
          id?: string
          votos_por_bairro_file?: string | null
          votos_por_secao_file?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_anos_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_bairros: {
        Row: {
          ano: number | null
          bairro_nome: string
          candidato_id: string | null
          cidade: string | null
          created_at: string | null
          id: string
          percentual_votos: number | null
          regional_id: string | null
          votos: number | null
        }
        Insert: {
          ano?: number | null
          bairro_nome: string
          candidato_id?: string | null
          cidade?: string | null
          created_at?: string | null
          id?: string
          percentual_votos?: number | null
          regional_id?: string | null
          votos?: number | null
        }
        Update: {
          ano?: number | null
          bairro_nome?: string
          candidato_id?: string | null
          cidade?: string | null
          created_at?: string | null
          id?: string
          percentual_votos?: number | null
          regional_id?: string | null
          votos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_bairros_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_bairros_regional_id_fkey"
            columns: ["regional_id"]
            isOneToOne: false
            referencedRelation: "regionais"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_secoes: {
        Row: {
          ano: number | null
          bairro: string | null
          candidato_id: string | null
          cidade: string | null
          created_at: string | null
          endereco_local: string | null
          id: string
          local_votacao: string | null
          secao: number
          secoes_agregadas: string | null
          votos: number | null
          zona: number
        }
        Insert: {
          ano?: number | null
          bairro?: string | null
          candidato_id?: string | null
          cidade?: string | null
          created_at?: string | null
          endereco_local?: string | null
          id?: string
          local_votacao?: string | null
          secao: number
          secoes_agregadas?: string | null
          votos?: number | null
          zona: number
        }
        Update: {
          ano?: number | null
          bairro?: string | null
          candidato_id?: string | null
          cidade?: string | null
          created_at?: string | null
          endereco_local?: string | null
          id?: string
          local_votacao?: string | null
          secao?: number
          secoes_agregadas?: string | null
          votos?: number | null
          zona?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_secoes_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          ativo: boolean
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          numero: number | null
          partido_id: string
          updated_at: string
          usa_regionais: boolean | null
          user_id: string | null
          votos_por_bairro_file: string | null
          votos_por_secao_file: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          foto_url?: string | null
          id?: string
          nome: string
          numero?: number | null
          partido_id: string
          updated_at?: string
          usa_regionais?: boolean | null
          user_id?: string | null
          votos_por_bairro_file?: string | null
          votos_por_secao_file?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          numero?: number | null
          partido_id?: string
          updated_at?: string
          usa_regionais?: boolean | null
          user_id?: string | null
          votos_por_bairro_file?: string | null
          votos_por_secao_file?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      cidades: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      partidos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          numero: number | null
          sigla: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          numero?: number | null
          sigla: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          numero?: number | null
          sigla?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          login: string | null
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          login?: string | null
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          login?: string | null
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regionais: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          id: string
          nome: string
          sigla: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          id?: string
          nome: string
          sigla?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          id?: string
          nome?: string
          sigla?: string | null
        }
        Relationships: []
      }
      regionais_bairros: {
        Row: {
          bairro_nome: string
          cidade: string
          created_at: string
          id: string
          regional_id: string
        }
        Insert: {
          bairro_nome: string
          cidade: string
          created_at?: string
          id?: string
          regional_id: string
        }
        Update: {
          bairro_nome?: string
          cidade?: string
          created_at?: string
          id?: string
          regional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regionais_bairros_regional_id_fkey"
            columns: ["regional_id"]
            isOneToOne: false
            referencedRelation: "regionais"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_neighborhood_map: {
        Row: {
          city_id: string | null
          created_at: string | null
          id: string
          neighborhood_name: string
          regional_id: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          neighborhood_name: string
          regional_id: string
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          neighborhood_name?: string
          regional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_neighborhood_map_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_neighborhood_map_regional_id_fkey"
            columns: ["regional_id"]
            isOneToOne: false
            referencedRelation: "regionais"
            referencedColumns: ["id"]
          },
        ]
      }
      secoes: {
        Row: {
          ativo: boolean
          bairro_id: string | null
          created_at: string
          endereco: string | null
          id: string
          numero: number
          zona_id: string
        }
        Insert: {
          ativo?: boolean
          bairro_id?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          numero: number
          zona_id: string
        }
        Update: {
          ativo?: boolean
          bairro_id?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          numero?: number
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secoes_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secoes_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_eleitorais"
            referencedColumns: ["id"]
          },
        ]
      }
      user_candidate_access: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_candidate_access_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_candidate_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_party_access: {
        Row: {
          created_at: string | null
          id: string
          party_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          party_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          party_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_party_access_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_party_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      votacao: {
        Row: {
          ano_eleicao: number
          bairro_id: string | null
          candidato_id: string
          created_at: string
          eleitores_aptos: number | null
          id: string
          regional_id: string | null
          secao_id: string
          turno: number
          updated_at: string
          votos: number
          zona_id: string
        }
        Insert: {
          ano_eleicao: number
          bairro_id?: string | null
          candidato_id: string
          created_at?: string
          eleitores_aptos?: number | null
          id?: string
          regional_id?: string | null
          secao_id: string
          turno?: number
          updated_at?: string
          votos?: number
          zona_id: string
        }
        Update: {
          ano_eleicao?: number
          bairro_id?: string | null
          candidato_id?: string
          created_at?: string
          eleitores_aptos?: number | null
          id?: string
          regional_id?: string | null
          secao_id?: string
          turno?: number
          updated_at?: string
          votos?: number
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votacao_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votacao_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votacao_regional_id_fkey"
            columns: ["regional_id"]
            isOneToOne: false
            referencedRelation: "regionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votacao_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votacao_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_eleitorais"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_eleitorais: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string | null
          numero: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string | null
          numero: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string | null
          numero?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_accessible_candidates: {
        Args: { user_id: string }
        Returns: {
          candidate_id: string
          candidate_name: string
          party_name: string
        }[]
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "presidente" | "candidato"
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
      user_role: ["admin", "presidente", "candidato"],
    },
  },
} as const
