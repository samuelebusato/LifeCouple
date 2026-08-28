import * as React from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { CodiceGioco } from '@/lib/giochi';
import type { Database } from '@/lib/database.types';

export type Partita = Database['public']['Tables']['partita']['Row'];
export type Round = Database['public']['Tables']['partita_round']['Row'];

/** Quanti round fa una partita. Chiesti dall'utente il 2026-08-28. */
export const ROUND_TOTALI: Record<CodiceGioco, number> = {
  indovina_disegno: 5,
  telepatia: 10,
  quiz_preferenze: 10,
  obbligo_verita: 10,
};

/**
 * Quanto dura un round del disegno, in secondi.
 *
 * ⚠️ Sessanta e non novanta, e non è una cifra a caso: chi disegna smette di
 * aggiungere dettagli utili molto prima di finire il tempo, e chi indovina, dopo
 * il primo minuto, ha già detto tutto quello che gli veniva in mente. Un timer
 * lungo non allunga il gioco, allunga **l'attesa dentro il gioco** — che è la
 * cosa che fa posare il telefono.
 */
export const SECONDI_ROUND = 60;

/**
 * Quanto si resta sull'esito prima che parta il round dopo, in millisecondi.
 *
 * 🔑 Serve perché senza di essa **il risultato non si vede**. Chiuso un round,
 * chi apre il successivo lo creerebbe nel fotogramma dopo, e la riga «era: cane»
 * comparirebbe e sparirebbe prima che l'occhio ci arrivi. Il round finito è il
 * momento in cui succede la cosa per cui si sta giocando — indovinato o no, la
 * parola svelata — e mangiarselo per fretta significa togliere al gioco il suo
 * unico momento di soddisfazione.
 *
 * ⚠️ Tre secondi, non uno: il tempo di leggere una parola **e** di guardare in
 * faccia l'altra persona, che in un gioco di coppia è metà del punto.
 */
export const PAUSA_FRA_ROUND = 3000;

/**
 * La macchina di una partita, condivisa dai due giochi.
 *
 * ## Cosa fa, e cosa lascia fare a chi la usa
 *
 * Qui sta tutto ciò che i due giochi hanno **in comune**: trovare o creare la
 * partita viva della coppia, dichiararsi pronti, seguire i cambi di stato in
 * tempo reale, chiudere un round. Ciò che è specifico — la tela e i tratti per
 * il disegno, le quattro opzioni per la telepatia — sta nelle schermate.
 *
 * ## 🔑 Chi crea il round, e perché uno solo
 *
 * Il round lo crea **una sola** delle due app, sempre in modo deterministico:
 * nel disegno, chi in quel round disegna; nella telepatia, chi ha creato la
 * partita. Se lo creassero entrambe, due telefoni scriverebbero il round 1 nello
 * stesso istante e uno dei due prenderebbe un errore di chiave duplicata — o
 * peggio, in una versione senza vincolo unico, la partita avrebbe due round 1
 * con due parole diverse.
 *
 * Il turno si ricava da un dato che **entrambi leggono e nessuno decide**:
 * chi ha creato la partita disegna nei round dispari, l'altro nei pari. Nessun
 * messaggio da scambiare, nessun accordo da raggiungere: è una funzione del
 * numero di round, e i due telefoni ci arrivano da soli alla stessa risposta.
 */
export function usePartita(gioco: CodiceGioco) {
  const { session } = useAuth();
  const io = session?.user.id ?? null;

  const [partita, setPartita] = React.useState<Partita | null>(null);
  const [round, setRound] = React.useState<Round | null>(null);
  const [pronti, setPronti] = React.useState<string[]>([]);
  const [caricando, setCaricando] = React.useState(true);
  const [errore, setErrore] = React.useState<string | null>(null);

  /** Ricarica tutto lo stato di una partita dal database. */
  const rileggi = React.useCallback(async (id: string) => {
    const [p, r, pr] = await Promise.all([
      supabase.from('partita').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('partita_round')
        .select('*')
        .eq('partita_id', id)
        .order('numero', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('partita_pronto').select('utente_id').eq('partita_id', id),
    ]);
    if (p.data) setPartita(p.data);
    setRound(r.data ?? null);
    setPronti((pr.data ?? []).map((x) => x.utente_id));
  }, []);

  /**
   * Trova la partita viva della coppia per questo gioco, o ne crea una.
   *
   * ⚠️ **La collisione va gestita, non evitata**: i due telefoni possono aprire
   * la schermata nello stesso momento e provare a creare tutti e due. L'indice
   * unico `partita_una_viva` fa fallire il secondo con un errore di duplicato —
   * ed è il comportamento giusto: chi perde la corsa **rilegge** e trova quella
   * dell'altro. Senza il vincolo ci sarebbero due partite e due schermate che
   * non si vedono.
   */
  const apri = React.useCallback(
    async (coppiaId: string | null) => {
      if (!coppiaId) {
        setCaricando(false);
        return;
      }
      setErrore(null);
      const viva = await supabase
        .from('partita')
        .select('*')
        .eq('coppia_id', coppiaId)
        .eq('gioco', gioco)
        .in('stato', ['attesa', 'in_corso'])
        .maybeSingle();

      if (viva.data) {
        await rileggi(viva.data.id);
        setCaricando(false);
        return;
      }

      const creata = await supabase
        .from('partita')
        .insert({ coppia_id: coppiaId, gioco, round_totali: ROUND_TOTALI[gioco] })
        .select('*')
        .single();

      if (creata.error) {
        // Ha vinto l'altro telefono: la sua partita c'è già.
        const seconda = await supabase
          .from('partita')
          .select('*')
          .eq('coppia_id', coppiaId)
          .eq('gioco', gioco)
          .in('stato', ['attesa', 'in_corso'])
          .maybeSingle();
        if (seconda.data) await rileggi(seconda.data.id);
        else setErrore(creata.error.message);
      } else {
        await rileggi(creata.data.id);
      }
      setCaricando(false);
    },
    [gioco, rileggi]
  );

  /**
   * Il canale in tempo reale.
   *
   * ⚠️ Si sottoscrive **una sola** volta per partita e ascolta le tre tabelle
   * filtrate per `partita_id`. Senza il filtro ogni coppia riceverebbe gli
   * eventi di tutte le altre — che la RLS poi scarterebbe, ma solo dopo averli
   * spediti a tutti i telefoni del mondo.
   */
  React.useEffect(() => {
    if (!partita?.id) return;
    const id = partita.id;
    const canale: RealtimeChannel = supabase
      .channel(`partita:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partita', filter: `id=eq.${id}` },
        (m) => setPartita(m.new as Partita)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partita_pronto', filter: `partita_id=eq.${id}` },
        () => {
          supabase
            .from('partita_pronto')
            .select('utente_id')
            .eq('partita_id', id)
            .then((r) => setPronti((r.data ?? []).map((x) => x.utente_id)));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partita_round', filter: `partita_id=eq.${id}` },
        (m) => setRound(m.new as Round)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canale);
    };
  }, [partita?.id]);

  /** «Avvia partita». La partita comincia quando lo preme anche l'altro. */
  const premiAvvia = React.useCallback(async () => {
    if (!partita) return;
    setErrore(null);
    const { data, error } = await supabase.rpc('segna_pronto', { p_partita: partita.id });
    if (error) return setErrore(error.message);
    if (data) setPartita(data as Partita);
    // ⚠️ Si rilegge comunque: se l'altro era già pronto, la funzione ha appena
    // fatto partire la partita e il nostro elenco dei pronti è vecchio di un
    // istante. L'evento realtime arriverebbe lo stesso, ma dopo — e questo è
    // l'unico punto della partita in cui l'utente sta **guardando** il bottone
    // che ha appena premuto.
    await supabase
      .from('partita_pronto')
      .select('utente_id')
      .eq('partita_id', partita.id)
      .then((r) => setPronti((r.data ?? []).map((x) => x.utente_id)));
  }, [partita]);

  /** Chi disegna nel round `n`: dispari a chi ha creato, pari all'altro. */
  const disegnatoreDi = React.useCallback(
    (n: number, altroId: string | null) => {
      if (!partita) return null;
      return n % 2 === 1 ? partita.creata_da : altroId;
    },
    [partita]
  );

  const chiudi = React.useCallback(
    async (roundId: string, esito: 'vinto' | 'perso' | 'scaduto', punti: number, chiave?: string) => {
      const { data, error } = await supabase.rpc('chiudi_round', {
        p_round: roundId,
        p_esito: esito,
        p_punti: punti,
        p_chiave: chiave ?? null,
      });
      if (error) return setErrore(error.message);
      if (data) setPartita(data as Partita);
    },
    []
  );

  /** Abbandona: serve a non lasciare una partita viva che blocca la prossima. */
  const abbandona = React.useCallback(async () => {
    if (!partita) return;
    await supabase.from('partita').update({ stato: 'abbandonata' }).eq('id', partita.id);
    setPartita(null);
    setRound(null);
    setPronti([]);
  }, [partita]);

  return {
    partita,
    round,
    pronti,
    io,
    ioSonoPronto: !!io && pronti.includes(io),
    entrambiPronti: pronti.length >= 2,
    caricando,
    errore,
    apri,
    premiAvvia,
    disegnatoreDi,
    chiudi,
    abbandona,
    rileggi,
    setRound,
  };
}
