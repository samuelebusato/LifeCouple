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

  /*
   * ⚠️ **Qui c'era `aggiungi`, ed e' stata tolta il 2026-08-28.**
   *
   * Creava un luogo dalla mappa: posizione attuale piu' un nome scritto a mano.
   * Era la **seconda** funzione capace di far nascere un posto — l'altra e'
   * `creaLuogo` in `lib/preferiti.ts` — e le due non scrivevano la stessa riga:
   * questa non aveva identita' Google, copertina, genere (B-19).
   *
   * Toglierla e' la meta' invisibile della normalizzazione chiesta dall'utente.
   * Lasciarla inutilizzata sarebbe stato peggio che lasciarla in uso: una
   * seconda strada che nessuno percorre non viene corretta quando cambia lo
   * schema, e chi la trova fra sei mesi la ricollega credendola equivalente.
   *
   * Chi deve creare un luogo usa `creaLuogo`; chi ha una lista da rinfrescare
   * usa `aggiungiLuogoPreferito`, che e' la stessa piu' una `ricarica`.
   */

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

  return { luoghi, loading, errore, ricarica, segnaVisitato, elimina };
}
