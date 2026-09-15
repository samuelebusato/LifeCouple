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
      abbonamento: {
        Row: {
          aggiornato_il: string
          attivo: boolean
          evento_id: string | null
          evento_il: string | null
          prodotto: string | null
          scade_il: string | null
          utente_id: string
        }
        Insert: {
          aggiornato_il?: string
          attivo?: boolean
          evento_id?: string | null
          evento_il?: string | null
          prodotto?: string | null
          scade_il?: string | null
          utente_id: string
        }
        Update: {
          aggiornato_il?: string
          attivo?: boolean
          evento_id?: string | null
          evento_il?: string | null
          prodotto?: string | null
          scade_il?: string | null
          utente_id?: string
        }
        Relationships: []
      }
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
            foreignKeyName: "commento_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
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
      dispositivo: {
        Row: {
          creato_il: string
          id: string
          lingua: string
          piattaforma: string
          token: string
          utente_id: string
          visto_il: string
        }
        Insert: {
          creato_il?: string
          id?: string
          lingua?: string
          piattaforma: string
          token: string
          utente_id: string
          visto_il?: string
        }
        Update: {
          creato_il?: string
          id?: string
          lingua?: string
          piattaforma?: string
          token?: string
          utente_id?: string
          visto_il?: string
        }
        Relationships: []
      }
      domanda: {
        Row: {
          autore_id: string | null
          coppia_id: string | null
          creato_il: string
          gioco: string
          id: string
          lingua: string
          partita_id: string | null
          testo: string
          tipo: string | null
        }
        Insert: {
          autore_id?: string | null
          coppia_id?: string | null
          creato_il?: string
          gioco: string
          id?: string
          lingua: string
          partita_id?: string | null
          testo: string
          tipo?: string | null
        }
        Update: {
          autore_id?: string | null
          coppia_id?: string | null
          creato_il?: string
          gioco?: string
          id?: string
          lingua?: string
          partita_id?: string | null
          testo?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domanda_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domanda_partita_id_fkey"
            columns: ["partita_id"]
            isOneToOne: false
            referencedRelation: "partita"
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
            foreignKeyName: "elemento_lista_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elemento_lista_luogo_id_fkey"
            columns: ["luogo_id"]
            isOneToOne: false
            referencedRelation: "luogo"
            referencedColumns: ["id"]
          },
        ]
      }
      evento: {
        Row: {
          autore_id: string
          categoria: string | null
          coppia_id: string
          creato_il: string
          elemento_id: string | null
          fine: string | null
          id: string
          inizio: string
          luogo_id: string | null
          nota: string | null
          origine_esterna: string | null
          speciale: string | null
          tipo: string
          titolo: string
          tutto_il_giorno: boolean
        }
        Insert: {
          autore_id?: string
          categoria?: string | null
          coppia_id: string
          creato_il?: string
          elemento_id?: string | null
          fine?: string | null
          id?: string
          inizio: string
          luogo_id?: string | null
          nota?: string | null
          origine_esterna?: string | null
          speciale?: string | null
          tipo?: string
          titolo: string
          tutto_il_giorno?: boolean
        }
        Update: {
          autore_id?: string
          categoria?: string | null
          coppia_id?: string
          creato_il?: string
          elemento_id?: string | null
          fine?: string | null
          id?: string
          inizio?: string
          luogo_id?: string | null
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
          chiave_storage: string
          coppia_id: string
          creato_il: string
          elemento_id: string | null
          evento_id: string | null
          id: string
          luogo_id: string | null
          scattata_il: string | null
        }
        Insert: {
          autore_id?: string
          byte: number
          cartella_id?: string | null
          chiave_storage: string
          coppia_id: string
          creato_il?: string
          elemento_id?: string | null
          evento_id?: string | null
          id?: string
          luogo_id?: string | null
          scattata_il?: string | null
        }
        Update: {
          autore_id?: string
          byte?: number
          cartella_id?: string | null
          chiave_storage?: string
          coppia_id?: string
          creato_il?: string
          elemento_id?: string | null
          evento_id?: string | null
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
            foreignKeyName: "foto_elemento_id_fkey"
            columns: ["elemento_id"]
            isOneToOne: false
            referencedRelation: "elemento_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foto_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "evento"
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
      lista: {
        Row: {
          autore_id: string
          chiave: string | null
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
          chiave?: string | null
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
          chiave?: string | null
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
      notifica_in_coda: {
        Row: {
          chiave_dedup: string
          coppia_id: string | null
          creata_il: string
          da_inviare_il: string
          dati: Json
          destinatario_id: string
          id: string
          inviata_il: string | null
          motivo_scarto: string | null
          scartata_il: string | null
          tentativi: number
          tipo: string
          ultimo_errore: string | null
        }
        Insert: {
          chiave_dedup: string
          coppia_id?: string | null
          creata_il?: string
          da_inviare_il?: string
          dati?: Json
          destinatario_id: string
          id?: string
          inviata_il?: string | null
          motivo_scarto?: string | null
          scartata_il?: string | null
          tentativi?: number
          tipo: string
          ultimo_errore?: string | null
        }
        Update: {
          chiave_dedup?: string
          coppia_id?: string | null
          creata_il?: string
          da_inviare_il?: string
          dati?: Json
          destinatario_id?: string
          id?: string
          inviata_il?: string | null
          motivo_scarto?: string | null
          scartata_il?: string | null
          tentativi?: number
          tipo?: string
          ultimo_errore?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifica_in_coda_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      partita: {
        Row: {
          conclusa_il: string | null
          coppia_id: string
          creata_da: string
          creata_il: string
          gioco: string
          id: string
          modo: string
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
          modo?: string
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
          modo?: string
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
        Relationships: [
          {
            foreignKeyName: "partita_pronto_partita_id_fkey"
            columns: ["partita_id"]
            isOneToOne: false
            referencedRelation: "partita"
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
        Relationships: [
          {
            foreignKeyName: "partita_round_partita_id_fkey"
            columns: ["partita_id"]
            isOneToOne: false
            referencedRelation: "partita"
            referencedColumns: ["id"]
          },
        ]
      }
      posizione_membro: {
        Row: {
          aggiornata_il: string
          coppia_id: string
          lat: number
          lon: number
          precisione: number | null
          utente_id: string
        }
        Insert: {
          aggiornata_il?: string
          coppia_id: string
          lat: number
          lon: number
          precisione?: number | null
          utente_id: string
        }
        Update: {
          aggiornata_il?: string
          coppia_id?: string
          lat?: number
          lon?: number
          precisione?: number | null
          utente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posizione_membro_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: false
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      preferenze_notifiche: {
        Row: {
          aggiornate_il: string
          inviti_a_tornare: boolean
          scioglimento: boolean
          luogo_del_partner: boolean
          ricordi: boolean
          utente_id: string
        }
        Insert: {
          aggiornate_il?: string
          inviti_a_tornare?: boolean
          scioglimento?: boolean
          luogo_del_partner?: boolean
          ricordi?: boolean
          utente_id: string
        }
        Update: {
          aggiornate_il?: string
          inviti_a_tornare?: boolean
          scioglimento?: boolean
          luogo_del_partner?: boolean
          ricordi?: boolean
          utente_id?: string
        }
        Relationships: []
      }
      profilo_coppia: {
        Row: {
          aggiornato_il: string
          conosciuto_da: string | null
          consenso_il: string
          convivenza: string | null
          coppia_id: string
          fascia_eta: string | null
          interesse: string | null
        }
        Insert: {
          aggiornato_il?: string
          conosciuto_da?: string | null
          consenso_il?: string
          convivenza?: string | null
          coppia_id: string
          fascia_eta?: string | null
          interesse?: string | null
        }
        Update: {
          aggiornato_il?: string
          conosciuto_da?: string | null
          consenso_il?: string
          convivenza?: string | null
          coppia_id?: string
          fascia_eta?: string | null
          interesse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profilo_coppia_coppia_id_fkey"
            columns: ["coppia_id"]
            isOneToOne: true
            referencedRelation: "coppia"
            referencedColumns: ["id"]
          },
        ]
      }
      profilo_utente: {
        Row: {
          aggiornato_il: string
          data_nascita: string | null
          utente_id: string
        }
        Insert: {
          aggiornato_il?: string
          data_nascita?: string | null
          utente_id: string
        }
        Update: {
          aggiornato_il?: string
          data_nascita?: string | null
          utente_id?: string
        }
        Relationships: []
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
      round_pronto: {
        Row: {
          pronto_il: string
          round_id: string
          utente_id: string
        }
        Insert: {
          pronto_il?: string
          round_id: string
          utente_id?: string
        }
        Update: {
          pronto_il?: string
          round_id?: string
          utente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_pronto_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "partita_round"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "round_segreto_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "partita_round"
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
      accoda_inviti_a_tornare: {
        Args: { p_giorni_inattivita?: number }
        Returns: number
      }
      accoda_ricordi: { Args: never; Returns: number }
      aggiorna_ristoranti_visitati: { Args: never; Returns: number }
      apri_invito: { Args: { p_token: string }; Returns: string }
      assegna_punti: {
        Args: { cid: string; n: number; rif: string; tipo_evento: string }
        Returns: undefined
      }
      cancella_profilo_coppia: { Args: never; Returns: undefined }
      chiudi_round: {
        Args: {
          p_chiave?: string
          p_esito: string
          p_punti: number
          p_round: string
        }
        Returns: {
          conclusa_il: string | null
          coppia_id: string
          creata_da: string
          creata_il: string
          gioco: string
          id: string
          modo: string
          punti: number
          round_corrente: number
          round_totali: number
          stato: string
          turno_di: string | null
        }
        SetofOptions: {
          from: "*"
          to: "partita"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      conferma_invito: { Args: { p_invito_id: string }; Returns: string }
      coppia_ha_insieme: { Args: { cid: string }; Returns: boolean }
      crea_coppia: { Args: never; Returns: string }
      crea_invito: { Args: never; Returns: string }
      e_membro_attivo: { Args: { cid: string }; Returns: boolean }
      ha_coppia_attiva: { Args: { uid: string }; Returns: boolean }
      // ⚠️ Aggiunta A MANO il 2026-09-15 perché la `0047` non è ancora
      // applicata e i tipi non si possono rigenerare dal database.
      // 🔑 **Va rigenerata appena la migrazione è passata**: `lib/database.types.ts`
      // scritto a mano ha già prodotto un difetto il 2026-09-14 — `lib/partita.ts`
      // compilava solo perché i tipi dicevano una cosa diversa dal database.
      ho_insieme: { Args: never; Returns: boolean }
      imposta_insieme_dal: {
        Args: { p_data: string; p_titolo: string }
        Returns: undefined
      }
      n_membri_attivi: { Args: { cid: string }; Returns: number }
      prepara_cancellazione_account: { Args: never; Returns: undefined }
      revoca_invito: { Args: { p_invito_id: string }; Returns: undefined }
      rivela_telepatia: {
        Args: { p_partita: string; p_round: number }
        Returns: {
          scelta: string
          utente_id: string
        }[]
      }
      salva_profilo_coppia: {
        Args: {
          p_conosciuto_da?: string
          p_convivenza?: string
          p_fascia_eta?: string
          p_interesse?: string
        }
        Returns: undefined
      }
      sciogli_coppia: { Args: never; Returns: undefined }
      segna_pronto: {
        Args: { p_partita: string }
        Returns: {
          conclusa_il: string | null
          coppia_id: string
          creata_da: string
          creata_il: string
          gioco: string
          id: string
          modo: string
          punti: number
          round_corrente: number
          round_totali: number
          stato: string
          turno_di: string | null
        }
        SetofOptions: {
          from: "*"
          to: "partita"
          isOneToOne: true
          isSetofReturn: false
        }
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
