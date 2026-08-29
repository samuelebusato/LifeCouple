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

  /**
   * Chi disegna nel round `n`: dispari a chi ha creato, pari all'altro.
   *
   * 🔴 **Prende i membri della coppia, non «l'altro»** — e la differenza è
   * l'intero difetto B-30. La firma precedente era `(n, altroId)`, dove
   * `altroId` lo calcolava la schermata come *«il membro che non sono io»*:
   * un valore **relativo a chi guarda**, cioè diverso sui due telefoni. Nei
   * round pari il telefono di A concludeva «disegna B» e quello di B
   * concludeva «disegna A»: **nessuno dei due si riconosceva disegnatore**,
   * entrambi vedevano «indovina tu», e siccome il round lo crea chi disegna,
   * il round successivo non nasceva più e la partita si fermava lì.
   *
   * 🔑 Il turno deve essere una funzione di dati che **entrambi leggono uguali**
   * — `creata_da` e l'elenco dei membri — e mai di «io». Che è la stessa forma
   * di D-60: se il dato è deducibile, si deduce, invece di farlo passare da
   * chi chiama. Per questo la funzione ora **non accetta più** un parametro
   * che chi chiama possa calcolare dal proprio punto di vista.
   */
  const disegnatoreDi = React.useCallback(
    (n: number, membri: string[]) => {
      if (!partita) return null;
      if (n % 2 === 1) return partita.creata_da;
      return membri.find((u) => u !== partita.creata_da) ?? null;
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

  /**
   * Abbandona: serve a non lasciare una partita viva che blocca la prossima.
   *
   * ⚠️ **Controlla di averlo fatto davvero.** Fino al 2026-08-28 questa funzione
   * non funzionava e non lo diceva: mancava la policy di `update` su
   * `partita` (migrazione 0021), e un UPDATE negato dalla RLS torna
   * «riuscito» con zero righe toccate. Chiudere la schermata azzerando lo stato
   * locale faceva sembrare tutto a posto mentre la partita restava viva nel
   * database, a bloccare la successiva.
   *
   * 🔑 La regola che ne esce: **dopo una scrittura che dipende da un permesso,
   * si rilegge.** Non perché la rete possa fallire — quello lo direbbe l'errore
   * — ma perché il permesso che manca non fallisce: tace.
   */
  const abbandona = React.useCallback(async () => {
    if (!partita) return;

    // 🔴 **Una partita conclusa NON si abbandona** (B-31). La migrazione 0021 lo
    // dice già a voce — *«una partita conclusa è il punteggio della coppia: è
    // ciò che alimenta Intesa e Sintonia nell'hub»* — ma il codice faceva il
    // contrario: la schermata del punteggio finale chiamava questa funzione in
    // chiusura, e `stato` passava da `conclusa` ad `abbandonata`. L'hub conta
    // le partite `conclusa`, quindi **ogni partita finita spariva dalla
    // classifica nel momento esatto in cui la si chiudeva**, e la classifica
    // restava vuota per sempre.
    //
    // 🔑 Qui non serve nemmeno abbandonare: l'indice `partita_una_viva` copre
    // solo `attesa` e `in_corso`, quindi una partita conclusa **non blocca**
    // la successiva. La chiamata non era solo dannosa: era inutile.
    if (partita.stato === 'conclusa') {
      setPartita(null);
      setRound(null);
      setPronti([]);
      return;
    }

    const { error } = await supabase
      .from('partita')
      .update({ stato: 'abbandonata' })
      .eq('id', partita.id);
    if (error) return setErrore(error.message);

    const { data } = await supabase.from('partita').select('stato').eq('id', partita.id).maybeSingle();
    if (data && data.stato !== 'abbandonata') {
      return setErrore('la partita non si è chiusa: manca il permesso di aggiornarla');
    }
    setPartita(null);
    setRound(null);
    setPronti([]);
  }, [partita]);

  /**
   * ⚠️ **L'oggetto è memoizzato, e non è cosmesi** (B-32).
   *
   * Prima si restituiva un oggetto letterale nuovo a **ogni render**. Le due
   * schermate lo mettono nelle dipendenze dei loro effetti (`p.chiudi`,
   * `p.setRound`), quindi quegli effetti si smontavano e rimontavano di
   * continuo — e dentro ci sono un `setTimeout` di tre secondi (la pausa fra i
   * round) e un `setInterval` (il tempo del disegno). Ogni render li
   * **azzerava e li faceva ripartire da capo**.
   *
   * 🔑 Un valore instabile nelle dipendenze non rompe il codice che lo legge:
   * rompe i **timer** di chi lo osserva. È un difetto che non si vede leggendo
   * l'effetto — si vede solo sapendo cosa gli viene passato.
   */
  return React.useMemo(
    () => ({
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
    }),
    [
      partita,
      round,
      pronti,
      io,
      caricando,
      errore,
      apri,
      premiAvvia,
      disegnatoreDi,
      chiudi,
      abbandona,
      rileggi,
    ]
  );
}
