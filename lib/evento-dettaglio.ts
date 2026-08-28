import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { Evento, TipoEvento } from '@/lib/eventi';

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
 * ## La copertina che il **luogo** presta a un evento senza foto (D-73)
 *
 * Un evento a cui non avete ancora attaccato scatti mostrava una sfumatura
 * rosa. Se però quell'evento ha un posto, il posto **una sua immagine ce
 * l'ha** — quella di Google — e usarla è meglio di una sfumatura: dice *dove*
 * eravate anche prima che ci sia una foto vostra.
 *
 * ## ⚠️ Perché la foto di Google e non «l'ultima foto scattata lì»
 *
 * La scheda di un luogo, in lista, usa questa scala: foto scelta a mano →
 * **foto delle vostre serate lì** → Google. Verrebbe da riusarla tale e quale.
 *
 * 🔑 **Sarebbe sbagliato proprio qui**, e per una ragione che non è tecnica:
 * quelle sono foto di *altre* serate. Metterle in testa a **questa** pagina le
 * presenterebbe come scatti di questo evento — un ricordo attribuito alla
 * data sbagliata. La foto di Google non ha questo problema: non è di nessuno e
 * non è di nessuna sera, è **l'immagine del posto**.
 *
 * *Una copertina che mente sul giorno è peggio di nessuna copertina.*
 *
 * ⚠️ Resta `null` per i posti senza identità Google (quelli nati da un tocco
 * lungo sulla mappa, prima di D-64): lì la sfumatura resta, ed è corretto.
 */
export type CopertinaLuogo = string | null;

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
  /** Il `foto_google` del posto della serata (D-73). Vedi `CopertinaLuogo`. */
  const [fotoLuogo, setFotoLuogo] = React.useState<CopertinaLuogo>(null);
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

    /**
     * La copertina del posto (D-73).
     *
     * ⚠️ **`foto_google` sta su `elemento_lista`, non su `luogo`** — è lì da
     * 0013 — quindi non basta la query qui sopra: serve la riga di lista di
     * quel posto, che da 0017 è una sola.
     *
     * 🔑 E si prova per **entrambe le strade**, perché un evento punta al posto
     * in due modi (`elemento_id` e `luogo_id`): è **B-12**, e guardarne una
     * sola avrebbe fatto comparire la copertina solo per metà degli eventi —
     * cioè il tipo di difetto che sembra casuale.
     */
    if (ev?.elemento_id || ev?.luogo_id) {
      const q = supabase.from('elemento_lista').select('foto_google').limit(1);
      const { data } = await (ev.elemento_id
        ? q.eq('id', ev.elemento_id)
        : q.eq('luogo_id', ev.luogo_id!)
      ).maybeSingle();
      setFotoLuogo(((data as { foto_google: string | null } | null)?.foto_google) ?? null);
    } else {
      setFotoLuogo(null);
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
        /** Il tag dell'evento: impegno, romantico, vacanza. */
        tipo: TipoEvento;
        /** Segue il tipo: una vacanza e' sempre a giornate intere. */
        tutto_il_giorno: boolean;
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
    fotoLuogo,
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
