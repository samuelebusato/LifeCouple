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
      // ⚠️ SCRITTO A MANO, non generato — migrazione 0011 (cartelle della
      // galleria). Il resto di questo file viene dallo schema reale: questo
      // blocco va **sostituito rigenerando i tipi** appena la 0011 e' applicata,
      // altrimenti resta l'unico punto in cui i tipi dicono ciò che crediamo
      // invece di ciò che è. Vale anche per `foto.cartella_id` più sotto.
      cartella: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          id: string
          nome: string
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          id?: string
          nome: string
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartella_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      commento: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          evento_id: string
          id: string
          testo: string
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          evento_id: string
          id?: string
          testo: string
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          evento_id?: string
          id?: string
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "commento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "evento"
            referencedColumns: ["id"]
          },
        ]
      }
      coppia: {
        Row: {
          byte_foto_usati: number
          creata_il: string
          id: string
          insieme_dal: string | null
          sciolta_il: string | null
          stato: string
        }
        Insert: {
          byte_foto_usati?: number
          creata_il?: string
          id?: string
          insieme_dal?: string | null
          sciolta_il?: string | null
          stato?: string
        }
        Update: {
          byte_foto_usati?: number
          creata_il?: string
          id?: string
          insieme_dal?: string | null
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
      // ⚠️ `luogo_id` (0012), `google_place_id`/`foto_google` (0013) SCRITTI A
      // MANO — da sostituire rigenerando i tipi.
      elemento_lista: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          fatto_il: string | null
          foto_google: string | null
          genere: string | null
          google_place_id: string | null
          id: string
          lista_id: string | null
          locandina: string | null
          luogo_id: string | null
          stato: string
          tipo: string
          titolo: string
          tmdb_id: number | null
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          fatto_il?: string | null
          foto_google?: string | null
          genere?: string | null
          google_place_id?: string | null
          id?: string
          lista_id?: string | null
          locandina?: string | null
          luogo_id?: string | null
          stato?: string
          tipo: string
          titolo: string
          tmdb_id?: number | null
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          fatto_il?: string | null
          foto_google?: string | null
          genere?: string | null
          google_place_id?: string | null
          id?: string
          lista_id?: string | null
          locandina?: string | null
          luogo_id?: string | null
          stato?: string
          tipo?: string
          titolo?: string
          tmdb_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "elemento_lista_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elemento_lista_luogo_id_fkey"
            columns: ["luogo_id"]
            isOneToOne: false
            referencedRelation: "luogo"
            referencedColumns: ["id"]
          },
          // ⚠️ SCRITTO A MANO (0022) — da sostituire rigenerando i tipi.
          {
            foreignKeyName: "elemento_lista_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "lista"
            referencedColumns: ["id"]
          },
        ]
      }
      // ⚠️ TABELLA SCRITTA A MANO (0022) — da sostituire rigenerando i tipi.
      // Verificata contro la migrazione, non generata dallo schema vero: e' il
      // debito gia' dichiarato nel PUNTO DI RIPRESA, e questa e' l'ennesima
      // tabella che lo rende un po' piu' caro.
      lista: {
        Row: {
          autore_id: string
          coppia_id: string
          creata_il: string
          id: string
          nome: string
          pastello: string
          predefinita: boolean
          tipo: string
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creata_il?: string
          id?: string
          nome: string
          pastello?: string
          predefinita?: boolean
          tipo?: string
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creata_il?: string
          id?: string
          nome?: string
          pastello?: string
          predefinita?: boolean
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      // ⚠️ `elemento_id` SCRITTO A MANO (0012) — da sostituire rigenerando i tipi.
      evento: {
        Row: {
          autore_id: string
          coppia_id: string
          creato_il: string
          elemento_id: string | null
          fine: string | null
          id: string
          inizio: string
          luogo_id: string | null
          categoria: string | null
          nota: string | null
          origine_esterna: string | null
          speciale: string | null
          tipo: string
          titolo: string
          tutto_il_giorno: boolean
        }
        Insert: {
          autore_id?: string
          coppia_id: string
          creato_il?: string
          elemento_id?: string | null
          fine?: string | null
          id?: string
          inizio: string
          luogo_id?: string | null
          categoria?: string | null
          nota?: string | null
          origine_esterna?: string | null
          speciale?: string | null
          tipo?: string
          titolo: string
          tutto_il_giorno?: boolean
        }
        Update: {
          autore_id?: string
          coppia_id?: string
          creato_il?: string
          elemento_id?: string | null
          fine?: string | null
          id?: string
          inizio?: string
          luogo_id?: string | null
          categoria?: string | null
          nota?: string | null
          origine_esterna?: string | null
          speciale?: string | null
          tipo?: string
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
          {
            foreignKeyName: "evento_elemento_id_fkey"
            columns: ["elemento_id"]
            isOneToOne: false
            referencedRelation: "elemento_lista"
            referencedColumns: ["id"]
          },
          // ⚠️ SCRITTA A MANO (0024) — mancava, ed è il motivo per cui
          // `luogo.select('*, evento(id)')` non compilava: senza la relazione
          // dichiarata, PostgREST-types non sa che i due sono collegati. La
          // colonna `luogo_id` c'era da 0008; la **relazione** no.
          {
            foreignKeyName: "evento_luogo_id_fkey"
            columns: ["luogo_id"]
            isOneToOne: false
            referencedRelation: "luogo"
            referencedColumns: ["id"]
          },
        ]
      }
      foto: {
        Row: {
          autore_id: string
          byte: number
          cartella_id: string | null
          elemento_id: string | null
          chiave_storage: string
          coppia_id: string
          creato_il: string
          evento_id: string | null
          id: string
          luogo_id: string | null
          scattata_il: string | null
        }
        Insert: {
          autore_id?: string
          byte: number
          cartella_id?: string | null
          elemento_id?: string | null
          chiave_storage: string
          coppia_id: string
          creato_il?: string
          evento_id?: string | null
          id?: string
          luogo_id?: string | null
          scattata_il?: string | null
        }
        Update: {
          autore_id?: string
          byte?: number
          cartella_id?: string | null
          elemento_id?: string | null
          chiave_storage?: string
          coppia_id?: string
          evento_id?: string | null
          creato_il?: string
          id?: string
          luogo_id?: string | null
          scattata_il?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foto_cartella_id_fkey"
            columns: ["cartella_id"]
            isOneToOne: false
            referencedRelation: "cartella"
            referencedColumns: ["id"]
          },
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
      // ⚠️ SCRITTO A MANO — migrazione 0020 (le partite dei giochi). Come il
      // blocco `cartella` più sopra, questo va **sostituito rigenerando i tipi**
      // (`supabase gen types`) appena si ha in mano una chiave segreta: finché
      // resta scritto a mano dice ciò che crediamo, non ciò che è.
      //
      // Le colonne aggiunte sono però state **verificate contro il database
      // vero** il 2026-08-28, una per una, con una `select` mirata attraverso
      // l'API REST — non copiate dalla migrazione e sperate.
      // ⚠️ SCRITTE A MANO — migrazione 0020. Vale la stessa avvertenza del
      // blocco `partita` qui sotto: da rigenerare.
      partita_pronto: {
        Row: {
          partita_id: string
          pronto_il: string
          utente_id: string
        }
        Insert: {
          partita_id: string
          pronto_il?: string
          utente_id?: string
        }
        Update: {
          partita_id?: string
          pronto_il?: string
          utente_id?: string
        }
        Relationships: []
      }
      partita_round: {
        Row: {
          chiave_rivelata: string | null
          disegnatore_id: string | null
          esito: string
          finito_il: string | null
          id: string
          iniziato_il: string
          numero: number
          opzioni: Json | null
          partita_id: string
          punti: number
        }
        Insert: {
          chiave_rivelata?: string | null
          disegnatore_id?: string | null
          esito?: string
          finito_il?: string | null
          id?: string
          iniziato_il?: string
          numero: number
          opzioni?: Json | null
          partita_id: string
          punti?: number
        }
        Update: {
          chiave_rivelata?: string | null
          disegnatore_id?: string | null
          esito?: string
          finito_il?: string | null
          id?: string
          iniziato_il?: string
          numero?: number
          opzioni?: Json | null
          partita_id?: string
          punti?: number
        }
        Relationships: []
      }
      round_segreto: {
        Row: {
          chiave: string
          creato_il: string
          round_id: string
        }
        Insert: {
          chiave: string
          creato_il?: string
          round_id: string
        }
        Update: {
          chiave?: string
          creato_il?: string
          round_id?: string
        }
        Relationships: []
      }
      partita: {
        Row: {
          conclusa_il: string | null
          coppia_id: string
          creata_da: string
          creata_il: string
          gioco: string
          id: string
          punti: number
          round_corrente: number
          round_totali: number
          stato: string
          turno_di: string | null
        }
        Insert: {
          conclusa_il?: string | null
          coppia_id: string
          creata_da?: string
          creata_il?: string
          gioco: string
          id?: string
          punti?: number
          round_corrente?: number
          round_totali?: number
          stato?: string
          turno_di?: string | null
        }
        Update: {
          conclusa_il?: string | null
          coppia_id?: string
          creata_da?: string
          creata_il?: string
          gioco?: string
          id?: string
          punti?: number
          round_corrente?: number
          round_totali?: number
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
      // ⚠️ SCRITTE A MANO — migrazione 0020. Le tre firme sono state provate
      // contro il database vero il 2026-08-28: chiamandole via `/rest/v1/rpc`
      // hanno risposto con le **nostre** eccezioni («partita inesistente»,
      // «round inesistente», «partita non tua»), che è la prova che esistono e
      // che i parametri sono quelli giusti — una firma sbagliata avrebbe dato
      // 404 sulla funzione, non un errore del suo corpo.
      segna_pronto: {
        Args: { p_partita: string }
        Returns: Database['public']['Tables']['partita']['Row']
      }
      chiudi_round: {
        Args: { p_round: string; p_esito: string; p_punti: number; p_chiave?: string | null }
        Returns: Database['public']['Tables']['partita']['Row']
      }
      rivela_telepatia: {
        Args: { p_partita: string; p_round: number }
        Returns: { utente_id: string; scelta: string }[]
      }
      apri_invito: { Args: { p_token: string }; Returns: string }
      assegna_punti: {
        Args: { cid: string; n: number; rif: string; tipo_evento: string }
        Returns: undefined
      }
      conferma_invito: { Args: { p_invito_id: string }; Returns: string }
      crea_coppia: { Args: never; Returns: string }
      crea_invito: { Args: never; Returns: string }
      e_membro_attivo: { Args: { cid: string }; Returns: boolean }
      ha_coppia_attiva: { Args: { uid: string }; Returns: boolean }
      imposta_insieme_dal: {
        Args: { p_data: string; p_titolo: string }
        Returns: undefined
      }
      n_membri_attivi: { Args: { cid: string }; Returns: number }
      // ⚠️ Blocco scritto a mano (0015), come quelli di 0011/0012/0013: questo
      // file va rigenerato dallo schema reale, ed e' in coda al PUNTO DI
      // RIPRESA. Finche' non lo si fa, ogni funzione nuova va aggiunta qui o il
      // client non la vede.
      aggiorna_ristoranti_visitati: { Args: never; Returns: number }
      revoca_invito: { Args: { p_invito_id: string }; Returns: undefined }
      sciogli_coppia: { Args: never; Returns: undefined }
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
