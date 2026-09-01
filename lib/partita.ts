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

/*
 * ✅ **`PAUSA_FRA_ROUND` non esiste più** (2026-09-01, migrazione 0027).
 *
 * Erano i tre secondi che passavano fra un round e il successivo. La ragione per
 * cui esisteva resta vera parola per parola — *il round finito è il momento in
 * cui succede la cosa per cui si sta giocando, e mangiarselo per fretta toglie
 * al gioco il suo unico momento di soddisfazione* — ed è esattamente il motivo
 * per cui è stata **sostituita** invece che allungata: un tempo fisso protegge
 * quel momento solo per chi legge alla velocità per cui è stato tarato.
 *
 * Ora il round successivo parte quando hanno premuto «continua» tutti e due:
 * vedi `prontiRound` più sotto.
 */

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
   * 🔑 **I «continua» del round in corso** (0027, chiesto il 2026-09-01).
   *
   * Stessa forma di `pronti`, un livello più in basso: lì è «sono pronto a
   * giocare», qui «sono pronto ad andare avanti». La differenza che conta è che
   * questa risposta **scade a ogni round**, ed è la ragione per cui non si
   * poteva riusare `partita_pronto`.
   *
   * ⚠️ **Si azzera all'istante in cui cambia il round, prima ancora di leggere
   * il database.** Se restassero i «continua» del round precedente, il round
   * nuovo partirebbe da «sono pronti tutti e due» e sfilerebbe via da solo —
   * che è precisamente il difetto che questo meccanismo esiste per togliere.
   */
  const [prontiRound, setProntiRound] = React.useState<string[]>([]);
  React.useEffect(() => {
    const idRound = round?.id;
    setProntiRound([]);
    if (!idRound) return;
    let vivo = true;
    const leggi = () =>
      supabase
        .from('round_pronto')
        .select('utente_id')
        .eq('round_id', idRound)
        .then((r) => {
          if (vivo) setProntiRound((r.data ?? []).map((x) => x.utente_id));
        });
    // Si legge **anche** all'ingresso e non solo sugli eventi: chi riapre la
    // schermata a round già chiuso non riceverebbe mai un evento per una riga
    // scritta prima che si iscrivesse, e resterebbe fermo su un «continua» che
    // ha già premuto.
    leggi();
    const canale: RealtimeChannel = supabase
      .channel(`round_pronto:${idRound}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_pronto', filter: `round_id=eq.${idRound}` },
        () => leggi()
      )
      .subscribe();
    return () => {
      vivo = false;
      supabase.removeChannel(canale);
    };
  }, [round?.id]);

  /**
   * «Continua». Il round successivo parte quando lo preme anche l'altro.
   *
   * ⚠️ **Il duplicato non è un errore** (`23505`): premere due volte è la cosa
   * più naturale del mondo davanti a un bottone che non sembra aver fatto
   * niente — e qui *non fa* niente di visibile finché non preme anche l'altro.
   * Trattarlo come guasto mostrerebbe un messaggio rosso a chi ha solo insistito.
   */
  const segnaProntoRound = React.useCallback(async () => {
    const idRound = round?.id;
    if (!idRound) return;
    setErrore(null);
    const { error } = await supabase.from('round_pronto').insert({ round_id: idRound });
    if (error && error.code !== '23505') return setErrore(error.message);
    // Rilettura immediata, per la stessa ragione di `premiAvvia`: è il momento
    // in cui l'utente sta guardando il bottone che ha appena premuto, e
    // aspettare l'evento realtime lo lascerebbe senza risposta per un istante.
    await supabase
      .from('round_pronto')
      .select('utente_id')
      .eq('round_id', idRound)
      .then((r) => setProntiRound((r.data ?? []).map((x) => x.utente_id)));
  }, [round?.id]);

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
      // ⚠️ `>= 2` e non «tutti», come in `segna_pronto`: una coppia è due persone
      // per costruzione (D-14). Se un giorno servisse un gruppo, questo è il
      // punto in cui il codice lo dirà invece di sbagliare in silenzio.
      ioSonoProntoRound: !!io && prontiRound.includes(io),
      entrambiProntiRound: prontiRound.length >= 2,
      caricando,
      errore,
      apri,
      premiAvvia,
      segnaProntoRound,
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
      prontiRound,
      io,
      caricando,
      errore,
      apri,
      premiAvvia,
      segnaProntoRound,
      disegnatoreDi,
      chiudi,
      abbandona,
      rileggi,
    ]
  );
}
