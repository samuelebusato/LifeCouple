import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';

export type Luogo = {
  id: string;
  coppia_id: string;
  autore_id: string;
  nome: string;
  lat: number;
  lng: number;
  stato: string;
  visitato_il: string | null;
  nota: string | null;
  creato_il: string;
};

/**
 * I posti della coppia (D-05).
 *
 * ⚠️ **Non c'e' e non ci sara' alcun tracciamento**: un luogo entra qui solo
 * con un gesto esplicito — un tocco lungo sulla mappa, o un "segna dove sono
 * adesso" premuto apposta. La posizione non viene letta in background, non
 * viene letta all'avvio, e nessuno dei due membri puo' sapere dove si trova
 * l'altro **adesso**. E' la decisione che tiene questa app fuori dalla
 * categoria degli strumenti di controllo del partner, e vale piu' di qualunque
 * funzione che potrebbe abilitare.
 */
export function useLuoghi(coppiaId: string | null) {
  const [luoghi, setLuoghi] = React.useState<Luogo[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setLuoghi([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('luogo')
      .select('*')
      .eq('coppia_id', coppiaId)
      .order('creato_il', { ascending: false });
    setErrore(error?.message ?? null);
    if (!error) setLuoghi((data ?? []) as Luogo[]);
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  const aggiungi = React.useCallback(
    async (
      dati: { nome: string; lat: number; lng: number; visitato: boolean; nota?: string },
      ricaricaCoppia: () => Promise<StatoCoppia>
    ): Promise<string | null> => {
      const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
      if (!esito.coppiaId) return esito.errore;
      const { error } = await supabase.from('luogo').insert({
        coppia_id: esito.coppiaId,
        nome: dati.nome.trim(),
        lat: dati.lat,
        lng: dati.lng,
        stato: dati.visitato ? 'visitato' : 'desiderato',
        // La data della visita la mette il trigger dei punti alla transizione
        // (D-15); qui si valorizza solo se nasce gia' visitato.
        visitato_il: dati.visitato ? new Date().toISOString() : null,
        nota: dati.nota?.trim() || null,
      });
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [coppiaId, ricarica]
  );

  /**
   * Da desiderato a visitato: e' **la transizione** che alimenta la creatura
   * (D-15), e i punti li assegna un trigger sul database — non il client, e
   * solo al passaggio. Avanti e indietro non fabbrica punti.
   */
  const segnaVisitato = React.useCallback(
    async (id: string, visitato: boolean): Promise<string | null> => {
      const { error } = await supabase
        .from('luogo')
        .update({ stato: visitato ? 'visitato' : 'desiderato' })
        .eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  const elimina = React.useCallback(
    async (id: string): Promise<string | null> => {
      const { error } = await supabase.from('luogo').delete().eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  return { luoghi, loading, errore, ricarica, aggiungi, segnaVisitato, elimina };
}
