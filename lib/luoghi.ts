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
      const { data, error } = await supabase
        .from('luogo')
        .insert({
          coppia_id: esito.coppiaId,
          nome: dati.nome.trim(),
          lat: dati.lat,
          lng: dati.lng,
          stato: dati.visitato ? 'visitato' : 'desiderato',
          // La data della visita la mette il trigger dei punti alla transizione
          // (D-15); qui si valorizza solo se nasce gia' visitato.
          visitato_il: dati.visitato ? new Date().toISOString() : null,
          nota: dati.nota?.trim() || null,
        })
        .select('id')
        .single();
      if (error) return error.message;

      // ⚠️ **E anche la riga in lista** (0017).
      //
      // Un posto poteva nascere in due modi che non producevano la stessa cosa:
      // dal campo "dove" di un evento nascevano entrambe le righe, dalla mappa
      // solo `luogo`. Finche' la lista si chiamava "ristoranti" la differenza
      // aveva senso; da 0016 la lista e' dei **luoghi**, e un posto che sta
      // sulla mappa ma non in lista e' semplicemente un posto che manca —
      // senza copertina, senza recensioni, senza "da fare / fatto".
      //
      // Se fallisce non si annulla il luogo: un posto sulla mappa senza riga in
      // lista e' un difetto lieve e recuperabile (0017 sa ripararlo), mentre
      // cancellare un posto che l'utente ha appena segnato e' una perdita.
      await supabase.from('elemento_lista').insert({
        coppia_id: esito.coppiaId,
        tipo: 'luogo',
        titolo: dati.nome.trim(),
        luogo_id: data.id,
        stato: dati.visitato ? 'fatto' : 'desiderato',
        fatto_il: dati.visitato ? new Date().toISOString() : null,
      });

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
      // E la riga in lista, che dello stesso posto e' la scheda: senza, il
      // posto risulta visitato sulla mappa e ancora da fare in lista. Stessa
      // simmetria della cancellazione (B-11).
      await supabase
        .from('elemento_lista')
        .update({ stato: visitato ? 'fatto' : 'desiderato', fatto_il: visitato ? new Date().toISOString() : null })
        .eq('luogo_id', id)
        .eq('tipo', 'luogo');
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /**
   * Elimina un posto — e **anche la sua riga in lista**.
   *
   * 🔴 Era il difetto dei «luoghi che non esistono». La chiave esterna e'
   * `luogo_id ... on delete set null`: cancellando il posto dalla mappa, la
   * riga in `elemento_lista` **restava**, con `luogo_id` azzerato. Il risultato
   * era un luogo ancora elencato fra i preferiti che sulla mappa non c'era
   * piu': non un dato sbagliato, un dato **sopravvissuto**.
   *
   * `set null` resta giusto per le **foto** (una foto sopravvive al posto: e'
   * un ricordo, non un riferimento) ma non per la riga di lista, che del posto
   * e' la scheda. Le due tabelle sono uno a uno da 0017, e questa cancellazione
   * lo rispetta.
   *
   * Prima la lista, poi il posto: se fallisse la seconda resterebbe un posto
   * sulla mappa senza scheda — riparabile, e comunque il male minore rispetto a
   * una scheda che punta al vuoto.
   */
  const elimina = React.useCallback(
    async (id: string): Promise<string | null> => {
      await supabase.from('elemento_lista').delete().eq('luogo_id', id).eq('tipo', 'luogo');
      const { error } = await supabase.from('luogo').delete().eq('id', id);
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  return { luoghi, loading, errore, ricarica, aggiungi, segnaVisitato, elimina };
}
