import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';

export type TipoElemento = 'film' | 'ristorante';

export type Recensione = {
  id: string;
  elemento_id: string;
  autore_id: string;
  voto: number;
  testo: string | null;
};

export type Elemento = {
  id: string;
  coppia_id: string;
  autore_id: string;
  tipo: string;
  titolo: string;
  stato: string;
  fatto_il: string | null;
  creato_il: string;
  /** Il posto del ristorante (0012): e' cio' che lo porta sulla mappa. */
  luogo_id: string | null;
  luogo: { id: string; nome: string; lat: number; lng: number } | null;
  recensioni: Recensione[];
};

/**
 * Film e ristoranti: quelli da vedere/provare e quelli gia' fatti, ciascuno con
 * **una recensione per persona** (il vincolo `unique(elemento, autore)` sta
 * nello schema dal primo giorno: due persone, due opinioni, nessuna delle due
 * sovrascrive l'altra).
 *
 * La transizione desiderato → fatto e' anche cio' che alimenta la creatura
 * (D-15): i punti li assegna un trigger sul database, non il client, e solo
 * **al passaggio** — rifarlo avanti e indietro non fabbrica punti.
 */
export function usePreferiti(coppiaId: string | null) {
  const [elementi, setElementi] = React.useState<Elemento[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setElementi([]);
      setErrore(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('elemento_lista')
      .select('*, recensione(*), luogo:luogo_id(id, nome, lat, lng)')
      .eq('coppia_id', coppiaId)
      .order('creato_il', { ascending: false });
    setErrore(error?.message ?? null);
    if (!error) {
      setElementi(
        (data ?? []).map((r) => {
          const { recensione, ...resto } = r as typeof r & { recensione: Recensione[] };
          return { ...resto, recensioni: recensione ?? [] } as unknown as Elemento;
        })
      );
    }
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  const aggiungi = React.useCallback(
    async (
      tipo: TipoElemento,
      titolo: string,
      ricaricaCoppia: () => Promise<StatoCoppia>
    ): Promise<string | null> => {
      const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
      if (!esito.coppiaId) return esito.errore;
      const { error } = await supabase
        .from('elemento_lista')
        .insert({ coppia_id: esito.coppiaId, tipo, titolo: titolo.trim() });
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [coppiaId, ricarica]
  );

  /** Il passaggio che conta: da desiderato a fatto (e i punti seguono). */
  const segnaFatto = React.useCallback(
    async (id: string, fatto: boolean): Promise<string | null> => {
      const { error } = await supabase
        .from('elemento_lista')
        .update({ stato: fatto ? 'fatto' : 'desiderato' })
        .eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /** La propria recensione: si sovrascrive la propria, mai quella dell'altro. */
  const recensisci = React.useCallback(
    async (elemento: Elemento, voto: number, testo: string): Promise<string | null> => {
      const { error } = await supabase.from('recensione').upsert(
        {
          coppia_id: elemento.coppia_id,
          elemento_id: elemento.id,
          voto,
          testo: testo.trim() || null,
        },
        { onConflict: 'elemento_id,autore_id' }
      );
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  const elimina = React.useCallback(
    async (id: string): Promise<string | null> => {
      const { error } = await supabase.from('elemento_lista').delete().eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /**
   * Lega un ristorante a un posto (0012): crea il luogo dal risultato della
   * ricerca e lo aggancia. Un solo ingresso per due scritture, cosi' non
   * esiste lo stato "luogo creato ma ristorante non collegato" sparso in giro.
   * La policy consente l'aggancio solo all'autore del ristorante: per gli
   * altri l'update filtra zero righe, e si dice.
   */
  const collegaPosto = React.useCallback(
    async (
      elemento: Elemento,
      posto: { nome: string; lat: number; lng: number }
    ): Promise<string | null> => {
      const visitato = elemento.stato === 'fatto';
      const { data, error } = await supabase
        .from('luogo')
        .insert({
          coppia_id: elemento.coppia_id,
          nome: posto.nome.trim(),
          lat: posto.lat,
          lng: posto.lng,
          stato: visitato ? 'visitato' : 'desiderato',
          visitato_il: visitato ? new Date().toISOString() : null,
        })
        .select('id')
        .single();
      if (error) return error.message;
      const up = await supabase
        .from('elemento_lista')
        .update({ luogo_id: data.id }, { count: 'exact' })
        .eq('id', elemento.id);
      if (up.error) return up.error.message;
      if (up.count === 0) return 'solo-autore';
      await ricarica();
      return null;
    },
    [ricarica]
  );

  return { elementi, loading, errore, ricarica, aggiungi, segnaFatto, recensisci, elimina, collegaPosto };
}

/** L'ultimo film visto: serve al riquadro della home. */
export function ultimoFatto(elementi: Elemento[], tipo: TipoElemento) {
  return (
    elementi
      .filter((e) => e.tipo === tipo && e.stato === 'fatto')
      .sort(
        (a, b) =>
          new Date(b.fatto_il ?? b.creato_il).getTime() -
          new Date(a.fatto_il ?? a.creato_il).getTime()
      )[0] ?? null
  );
}
