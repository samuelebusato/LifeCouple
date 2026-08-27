import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { inizioGiorno } from '@/lib/date';

/** I tre tipi decisi con l'utente: la vacanza e' l'unica che occupa piu' giorni. */
export type TipoEvento = 'impegno' | 'romantico' | 'vacanza';
export const TIPI: TipoEvento[] = ['impegno', 'romantico', 'vacanza'];

export type Evento = {
  id: string;
  coppia_id: string;
  autore_id: string;
  titolo: string;
  inizio: string;
  fine: string | null;
  tutto_il_giorno: boolean;
  nota: string | null;
  tipo: string;
  categoria: string | null;
  /** Dove e' successo: facoltativo, non tutto ha un posto da ricordare (0008). */
  luogo_id: string | null;
  /** Il ristorante della serata (0012): un'altra strada verso l'evento, D-33. */
  elemento_id: string | null;
  speciale: string | null;
  origine_esterna: string | null;
  creato_il: string;
};

/**
 * Il calendario condiviso della coppia (funzione 3 di D-11).
 *
 * Funziona **anche da soli**: chi entra prima del partner scrive i suoi
 * appuntamenti e li ritrova quando l'altro arriva. Non c'e' cartellino
 * "serve il partner" qui — quello resta per i giochi, che da soli non hanno
 * senso (D-28).
 *
 * Come per `useCoppia`, gli errori si dichiarano invece di sparire: un
 * elenco vuoto perche' la rete non risponde non deve sembrare un calendario
 * senza impegni (lezione di B-03).
 */
export function useEventi(coppiaId: string | null) {
  const [eventi, setEventi] = React.useState<Evento[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setEventi([]);
      setErrore(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('coppia_id', coppiaId)
      .order('inizio', { ascending: true });
    setErrore(error?.message ?? null);
    if (!error) setEventi((data ?? []) as Evento[]);
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  /**
   * Aggiunge un evento, creando lo spazio se non esiste ancora (D-26): il
   * primo appuntamento e' uno dei gesti che fanno nascere la coppia, come
   * l'invito. Chiedere prima "crea il tuo spazio" sarebbe di nuovo un
   * cancello, spostato piu' avanti.
   */
  const aggiungi = React.useCallback(
    async (
      dati: {
        titolo: string;
        inizio: Date;
        fine?: Date | null;
        tuttoIlGiorno: boolean;
        tipo: TipoEvento;
        nota?: string;
        luogoId?: string | null;
        elementoId?: string | null;
      },
      ricaricaCoppia: () => Promise<StatoCoppia>
      // ⚠️ Restituisce anche l'**id** del nuovo evento, non solo l'esito.
      // Serve a chi crea un evento con delle foto gia' scelte: le foto si
      // attaccano a un evento, e l'evento prima deve esistere. Senza l'id
      // bisognerebbe rileggere l'elenco e indovinare qual e' — cioe' fidarsi
      // che sia il piu' recente, che con due persone che scrivono insieme non
      // e' una garanzia.
    ): Promise<{ errore: string | null; id?: string }> => {
      const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
      if (!esito.coppiaId) return { errore: esito.errore };

      const { data, error } = await supabase.from('evento').insert({
        coppia_id: esito.coppiaId,
        titolo: dati.titolo.trim(),
        inizio: dati.inizio.toISOString(),
        fine: dati.fine ? dati.fine.toISOString() : null,
        tutto_il_giorno: dati.tuttoIlGiorno,
        tipo: dati.tipo,
        nota: dati.nota?.trim() || null,
        luogo_id: dati.luogoId ?? null,
        elemento_id: dati.elementoId ?? null,
      }).select('id').single();
      if (error) return { errore: error.message };
      await ricarica();
      return { errore: null, id: data.id };
    },
    [coppiaId, ricarica]
  );

  /** Modifica di un evento esistente: solo il proprio, come la cancellazione. */
  const aggiorna = React.useCallback(
    async (
      id: string,
      dati: {
        titolo: string;
        inizio: Date;
        fine?: Date | null;
        tuttoIlGiorno: boolean;
        tipo: TipoEvento;
        nota?: string;
        luogoId?: string | null;
        elementoId?: string | null;
      }
    ): Promise<string | null> => {
      const { error } = await supabase
        .from('evento')
        .update({
          titolo: dati.titolo.trim(),
          inizio: dati.inizio.toISOString(),
          fine: dati.fine ? dati.fine.toISOString() : null,
          tutto_il_giorno: dati.tuttoIlGiorno,
          tipo: dati.tipo,
          nota: dati.nota?.trim() || null,
          luogo_id: dati.luogoId ?? null,
          elemento_id: dati.elementoId ?? null,
        })
        .eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /** Solo i propri: la policy lo impone, qui si evita solo di provarci. */
  const elimina = React.useCallback(
    async (id: string): Promise<string | null> => {
      const { error } = await supabase.from('evento').delete().eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  return { eventi, loading, errore, ricarica, aggiungi, aggiorna, elimina };
}

/**
 * Gli eventi che toccano un giorno.
 *
 * Una vacanza non "sta" in un giorno: lo attraversa. Se si guardasse solo la
 * data di inizio, una settimana in montagna comparirebbe il giorno della
 * partenza e sparirebbe per tutti gli altri — cioe' proprio nei giorni in cui
 * la si sta vivendo.
 */
/** Gli eventi che toccano un mese — vale anche per una vacanza che lo attraversa. */
export function eventiDelMese(eventi: Evento[], mese: Date) {
  const da = new Date(mese.getFullYear(), mese.getMonth(), 1).getTime();
  const a = new Date(mese.getFullYear(), mese.getMonth() + 1, 1).getTime();
  return eventi.filter((e) => {
    const i = new Date(e.inizio).getTime();
    const f = e.fine ? new Date(e.fine).getTime() : i;
    return i < a && f >= da;
  });
}

export function eventiDelGiorno(eventi: Evento[], giorno: Date) {
  const g = inizioGiorno(giorno).getTime();
  return eventi.filter((e) => {
    const da = inizioGiorno(new Date(e.inizio)).getTime();
    if (!e.fine) return da === g;
    const a = inizioGiorno(new Date(e.fine)).getTime();
    return g >= da && g <= a;
  });
}
