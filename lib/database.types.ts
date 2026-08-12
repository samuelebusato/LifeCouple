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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      coppia: {
        Row: {
          byte_foto_usati: number
          creata_il: string
          id: string
          sciolta_il: string | null
          stato: string
        }
        Insert: {
          byte_foto_usati?: number
          creata_il?: string
          id?: string
          sciolta_il?: string | null
          stato?: string
        }
        Update: {
          byte_foto_usati?: number
          creata_il?: string
          id?: string
          sciolta_il?: string | null
          stato?: string
        }
        Relationships: []
      }
      creatura: {
        Row: {
          coppia_id: string
          creata_il: string
          punti: number
        }
        Insert: {
          coppia_id: string
          creata_il?: string
          punti?: number
        }
        Update: {
          coppia_id?: string
          creata_il?: string
          punti?: number
        }
        Relationships: [
          {
            foreignKeyName: "creatura_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: true
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      domanda: {
        Row: {
          coppia_id: string | null
          creato_il: string
          gioco: string
          id: string
          lingua: string
          testo: string
        }
        Insert: {
          coppia_id?: string | null
          creato_il?: string
          gioco: string
          id?: string
          lingua: string
          testo: string
        }
        Update: {
          coppia_id?: string | null
          creato_il?: string
          gioco?: string
          id?: string
          lingua?: string
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "domanda_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      elemento_lista: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          fatto_il: string | null
          id: string
          stato: string
          tipo: string
          titolo: string
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          fatto_il?: string | null
          id?: string
          stato?: string
          tipo: string
          titolo: string
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          fatto_il?: string | null
          id?: string
          stato?: string
          tipo?: string
          titolo?: string
        }
        Relationships: [
          {
            foreignKeyName: "elemento_lista_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      evento: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          fine: string | null
          id: string
          inizio: string
          nota: string | null
          titolo: string
          tutto_il_giorno: boolean
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          fine?: string | null
          id?: string
          inizio: string
          nota?: string | null
          titolo: string
          tutto_il_giorno?: boolean
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          fine?: string | null
          id?: string
          inizio?: string
          nota?: string | null
          titolo?: string
          tutto_il_giorno?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evento_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      foto: {
        Row: {
          autore_id: string
          byte: number
          chiave_storage: string
          coppia_id: string
          creato_il: string
          id: string
          luogo_id: string | null
          scattata_il: string | null
        }
        Insert: {
          autore_id?: string
          byte: number
          chiave_storage: string
          coppia_id: string
          creato_il?: string
          id?: string
          luogo_id?: string | null
          scattata_il?: string | null
        }
        Update: {
          autore_id?: string
          byte?: number
          chiave_storage?: string
          coppia_id?: string
          creato_il?: string
          id?: string
          luogo_id?: string | null
          scattata_il?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foto_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foto_luogo_id_fkey"
            columns: ["luogo_id"]
            isOneToOne: false
            referencedRelation: "luogo"
            referencedColumns: ["id"]
          },
        ]
      }
      invio_sigillato: {
        Row: {
          autore_id: string
          contenuto: Json
          creato_il: string
          domanda_id: string | null
          id: string
          natura: string
          partita_id: string
          round: number
        }
        Insert: {
          autore_id?: string
          contenuto: Json
          creato_il?: string
          domanda_id?: string | null
          id?: string
          natura: string
          partita_id: string
          round?: number
        }
        Update: {
          autore_id?: string
          contenuto?: Json
          creato_il?: string
          domanda_id?: string | null
          id?: string
          natura?: string
          partita_id?: string
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "invio_sigillato_domanda_id_fkey"
            columns: ["domanda_id"]
            isOneToOne: false
            referencedRelation: "domanda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invio_sigillato_partita_id_fkey"
            columns: ["partita_id"]
            isOneToOne: false
            referencedRelation: "partita"
            referencedColumns: ["id"]
          },
        ]
      }
      invito: {
        Row: {
          aperto_da: string | null
          coppia_id: string
          creato_da: string
          id: string
          scade_il: string
          stato: string
          token_hash: string
          usato_il: string | null
        }
        Insert: {
          aperto_da?: string | null
          coppia_id: string
          creato_da: string
          id?: string
          scade_il: string
          stato?: string
          token_hash: string
          usato_il?: string | null
        }
        Update: {
          aperto_da?: string | null
          coppia_id?: string
          creato_da?: string
          id?: string
          scade_il?: string
          stato?: string
          token_hash?: string
          usato_il?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invito_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      luogo: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          id: string
          lat: number
          lng: number
          nome: string
          nota: string | null
          stato: string
          visitato_il: string | null
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          id?: string
          lat: number
          lng: number
          nome: string
          nota?: string | null
          stato?: string
          visitato_il?: string | null
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          id?: string
          lat?: number
          lng?: number
          nome?: string
          nota?: string | null
          stato?: string
          visitato_il?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "luogo_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      membro_coppia: {
        Row: {
          coppia_id: string
          entrato_il: string
          uscito_il: string | null
          utente_id: string
        }
        Insert: {
          coppia_id: string
          entrato_il?: string
          uscito_il?: string | null
          utente_id: string
        }
        Update: {
          coppia_id?: string
          entrato_il?: string
          uscito_il?: string | null
          utente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membro_coppia_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      partita: {
        Row: {
          coppia_id: string
          creata_da: string
          creata_il: string
          gioco: string
          id: string
          stato: string
          turno_di: string | null
        }
        Insert: {
          coppia_id: string
          creata_da?: string
          creata_il?: string
          gioco: string
          id?: string
          stato?: string
          turno_di?: string | null
        }
        Update: {
          coppia_id?: string
          creata_da?: string
          creata_il?: string
          gioco?: string
          id?: string
          stato?: string
          turno_di?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partita_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      partita_risultato: {
        Row: {
          esito: Json
          partita_id: string
          punti_assegnati: number
          rivelato_il: string
        }
        Insert: {
          esito: Json
          partita_id: string
          punti_assegnati?: number
          rivelato_il?: string
        }
        Update: {
          esito?: Json
          partita_id?: string
          punti_assegnati?: number
          rivelato_il?: string
        }
        Relationships: [
          {
            foreignKeyName: "partita_risultato_partita_id_fkey"
            columns: ["partita_id"]
            isOneToOne: true
            referencedRelation: "partita"
            referencedColumns: ["id"]
          },
        ]
      }
      punti_evento: {
        Row: {
          coppia_id: string
          creato_il: string
          id: string
          punti: number
          riferimento_id: string
          tipo: string
        }
        Insert: {
          coppia_id: string
          creato_il?: string
          id?: string
          punti: number
          riferimento_id: string
          tipo: string
        }
        Update: {
          coppia_id?: string
          creato_il?: string
          id?: string
          punti?: number
          riferimento_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "punti_evento_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      recensione: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          elemento_id: string
          id: string
          testo: string | null
          voto: number
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          elemento_id: string
          id?: string
          testo?: string | null
          voto: number
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          elemento_id?: string
          id?: string
          testo?: string | null
          voto?: number
        }
        Relationships: [
          {
            foreignKeyName: "recensione_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recensione_elemento_id_fkey"
            columns: ["elemento_id"]
            isOneToOne: false
            referencedRelation: "elemento_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_azioni: {
        Row: {
          autore_id: string
          azione: string
          coppia_id: string
          creato_il: string
          id: string
          oggetto: Json | null
        }
        Insert: {
          autore_id?: string
          azione: string
          coppia_id: string
          creato_il?: string
          id?: string
          oggetto?: Json | null
        }
        Update: {
          autore_id?: string
          azione?: string
          coppia_id?: string
          creato_il?: string
          id?: string
          oggetto?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "registro_azioni_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      stadio_soglia: {
        Row: {
          punti_minimi: number
          stadio: number
        }
        Insert: {
          punti_minimi: number
          stadio: number
        }
        Update: {
          punti_minimi?: number
          stadio?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assegna_punti: {
        Args: { cid: string; n: number; rif: string; tipo_evento: string }
        Returns: undefined
      }
      crea_coppia: { Args: never; Returns: string }
      e_membro_attivo: { Args: { cid: string }; Returns: boolean }
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
