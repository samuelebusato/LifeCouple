import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { Evento } from '@/lib/eventi';

export type Commento = {
  id: string;
  evento_id: string;
  autore_id: string;
  testo: string;
  creato_il: string;
};

export type Luogo = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  stato: string;
};

export type Foto = {
  id: string;
  chiave_storage: string;
  autore_id: string;
};

export type RistoranteEvento = {
  id: string;
  titolo: string;
  stato: string;
};

/**
 * Tutto quello che appartiene a un evento: il momento, il posto, gli scatti e
 * le parole.
 *
 * L'evento e' il centro (0008): calendario, mappa e recap sono tre modi di
 * arrivare **qui**, non tre funzioni diverse. Per questo la lettura sta in un
 * hook solo, e ogni vista si limita a portarci l'id.
 */
export function useEventoDettaglio(id: string | undefined) {
  const [evento, setEvento] = React.useState<Evento | null>(null);
  const [luogo, setLuogo] = React.useState<Luogo | null>(null);
  const [ristorante, setRistorante] = React.useState<RistoranteEvento | null>(null);
  const [commenti, setCommenti] = React.useState<Commento[]>([]);
  const [foto, setFoto] = React.useState<Foto[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const [e, c, f] = await Promise.all([
      supabase.from('evento').select('*').eq('id', id).maybeSingle(),
      supabase.from('commento').select('*').eq('evento_id', id).order('creato_il'),
      supabase.from('foto').select('id, chiave_storage, autore_id').eq('evento_id', id),
    ]);

    if (e.error) setErrore(e.error.message);
    else setErrore(null);

    const ev = (e.data as Evento | null) ?? null;
    setEvento(ev);
    setCommenti((c.data ?? []) as Commento[]);
    setFoto((f.data ?? []) as Foto[]);

    if (ev?.luogo_id) {
      const { data } = await supabase
        .from('luogo')
        .select('id, nome, lat, lng, stato')
        .eq('id', ev.luogo_id)
        .maybeSingle();
      setLuogo((data as Luogo | null) ?? null);
    } else {
      setLuogo(null);
    }

    // Il ristorante della serata (0012): stessa forma del luogo.
    if (ev?.elemento_id) {
      const { data } = await supabase
        .from('elemento_lista')
        .select('id, titolo, stato')
        .eq('id', ev.elemento_id)
        .maybeSingle();
      setRistorante((data as RistoranteEvento | null) ?? null);
    } else {
      setRistorante(null);
    }
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  const commenta = React.useCallback(
    async (testo: string): Promise<string | null> => {
      if (!evento || !testo.trim()) return null;
      const { error } = await supabase
        .from('commento')
        .insert({ coppia_id: evento.coppia_id, evento_id: evento.id, testo: testo.trim() });
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [evento, ricarica]
  );

  /** Solo i propri: la policy lo impone, qui si evita di offrire il gesto. */
  const cancellaCommento = React.useCallback(
    async (idCommento: string): Promise<string | null> => {
      const { error } = await supabase.from('commento').delete().eq('id', idCommento);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /**
   * Modifica **mirata** dall'ingranaggio della pagina evento (D-35): un campo
   * alla volta, non un secondo form completo. La regola "la modifica vive in
   * un posto solo" resta vera per il form intero, che sta nel calendario.
   * La policy consente l'update solo all'autore: agli altri l'errore arriva
   * dal database, e la pagina lo mostra invece di fingere.
   */
  const aggiorna = React.useCallback(
    async (
      campi: Partial<{
        nota: string | null;
        inizio: string;
        fine: string | null;
        luogo_id: string | null;
        elemento_id: string | null;
      }>
    ): Promise<string | null> => {
      if (!evento) return null;
      const { error, count } = await supabase
        .from('evento')
        .update(campi, { count: 'exact' })
        .eq('id', evento.id);
      if (error) return error.message;
      // RLS non "vieta": filtra. Zero righe toccate = non era tuo da modificare.
      if (count === 0) return 'solo-autore';
      await ricarica();
      return null;
    },
    [evento, ricarica]
  );

  const eliminaEvento = React.useCallback(async (): Promise<string | null> => {
    if (!evento) return null;
    const { error, count } = await supabase
      .from('evento')
      .delete({ count: 'exact' })
      .eq('id', evento.id);
    if (error) return error.message;
    if (count === 0) return 'solo-autore';
    return null;
  }, [evento]);

  return {
    evento,
    luogo,
    ristorante,
    commenti,
    foto,
    loading,
    errore,
    ricarica,
    commenta,
    cancellaCommento,
    aggiorna,
    eliminaEvento,
  };
}

/** Gli eventi legati a un luogo: e' l'ingresso dalla mappa. */
export function useEventiDelLuogo(luogoId: string | undefined) {
  const [eventi, setEventi] = React.useState<Evento[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      if (!luogoId) return setLoading(false);
      const { data } = await supabase
        .from('evento')
        .select('*')
        .eq('luogo_id', luogoId)
        .order('inizio', { ascending: false });
      setEventi((data ?? []) as Evento[]);
      setLoading(false);
    })();
  }, [luogoId]);

  return { eventi, loading };
}
