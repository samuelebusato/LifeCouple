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

  return { evento, luogo, commenti, foto, loading, errore, ricarica, commenta, cancellaCommento };
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
