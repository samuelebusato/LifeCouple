import * as React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { CartaVetro, TondoVetro, BottonePieno } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { PunteggioFinale } from '@/components/punteggio-finale';
import { Attesa } from '@/components/attesa-partita';
import { PreparazioneCarte } from '@/components/preparazione-carte';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { usePartita, useAperturaRound } from '@/lib/partita';
import { DOMANDE_QUIZ, rendi, normalizza, type Voce } from '@/lib/parole';
import { useCarte, pescaCarta } from '@/lib/carte';
import { useTema } from '@/lib/tema';
import { tatto } from '@/lib/movimento';
import { t, lingua } from '@/lib/i18n';

/** Ciò che il round salva: la domanda e le quattro risposte, come chiavi. */
type Opzioni = { tema: string; scelte: string[] };

/**
 * Quattro risposte pescate da una domanda, senza ripetizioni.
 *
 * ⚠️ **E la domanda non si ripete nella partita**, per la stessa ragione di
 * B-33: con 14 domande e 10 round, pescando a caso ogni volta la probabilità di
 * vederne almeno una due volte è **oltre il 97%** — cioè sempre. Qui pesa più
 * che nella telepatia: rivedere la stessa domanda significa che il secondo
 * turno la sa già, e il gioco smette di misurare qualcosa.
 */
function pescaOpzioni(usate: Set<string>): Opzioni {
  const disponibili = DOMANDE_QUIZ.filter((d) => !usate.has(d.titolo[0]));
  // Con 14 domande e 10 round non può succedere, ma il modo in cui un caso
  // impossibile fallisce va deciso, non scoperto.
  const banco = disponibili.length > 0 ? disponibili : DOMANDE_QUIZ;
  const domanda = banco[Math.floor(Math.random() * banco.length)];
  const rimaste = [...domanda.voci];
  const scelte: string[] = [];
  for (let i = 0; i < 4 && rimaste.length > 0; i++) {
    const k = Math.floor(Math.random() * rimaste.length);
    scelte.push(rimaste[k][0]);
    rimaste.splice(k, 1);
  }
  return { tema: domanda.titolo[0], scelte };
}

/**
 * **Quiz sulle preferenze.** Uno risponde per sé, l'altro prova a indovinarlo.
 *
 * ## Perché è un gioco diverso dalla telepatia, pur somigliandole tanto
 *
 * Il meccanismo è quasi lo stesso — quattro carte, due invii sigillati, un
 * confronto — ma la domanda che pone è opposta. Nella telepatia **nessuno dei
 * due sa la risposta giusta**: si vince se per caso pensate uguale. Qui una
 * risposta giusta c'è, ce l'ha in tasca uno dei due, e l'altro deve trovarla.
 *
 * 🔑 Da lì discende l'unica differenza strutturale: **i ruoli si scambiano a
 * ogni round** (`disegnatoreDi`, la stessa funzione del disegno). Senza lo
 * scambio il gioco misurerebbe quanto uno conosce l'altro e basta — cioè
 * produrrebbe un giudizio **su una persona sola**, che è la cosa che P-03 vieta
 * di far uscire da questi giochi. Dieci round, cinque per parte: il punteggio
 * torna a essere della coppia perché entrambi sono stati esaminati e
 * esaminatori la stessa quantità di volte.
 *
 * ## Perché nessuna migrazione, e perché `natura = 'scelta'`
 *
 * `invio_sigillato` prevede `'verita'` e `'tentativo'`, nate nella 0001 proprio
 * per questo gioco. Non le uso, e non è pigrizia: **quale delle due righe sia la
 * verità lo dice già il turno.** Il soggetto del round è calcolabile da
 * `creata_da` e dal numero — è uguale sui due telefoni per costruzione (B-30) —
 * quindi un'etichetta sulla riga ripeterebbe in un secondo posto un fatto che
 * vive già altrove, con l'unico effetto di poter divergere. Usando `'scelta'`
 * per entrambi, `rivela_telepatia` funziona qui senza una riga di SQL nuova: non
 * filtra per gioco, restituisce **le due scelte sigillate di un round** — che è
 * esattamente ciò che serve.
 */
export default function GiocoQuiz() {
  const router = useRouter();
  const { c } = useTema();
  const { coppiaId } = useCoppia();
  const p = usePartita('quiz_preferenze');
  const { apri, partita, round, io } = p;

  /**
   * 🔴 **I due valori si estraggono da `p`, e `p` NON va nelle dipendenze**
   * (B-43, 2026-09-02).
   *
   * `usePartita` restituisce un oggetto memoizzato su tutto lo stato della
   * partita: punteggio, pronti, round, «continua». Metterlo fra le dipendenze
   * dell'effetto che **crea** il round significa rimontare quell'effetto a ogni
   * evento realtime, cioè proprio mentre il round si sta creando.
   *
   * `setRound` è una `setState` (identità stabile) e `entrambiProntiRound` è un
   * booleano: le dipendenze diventano valori che cambiano **quando cambia la
   * risposta**, non quando arriva un evento qualsiasi.
   */
  const { setRound, entrambiProntiRound } = p;
  const apriRound = useAperturaRound();
  const [membri, setMembri] = React.useState<string[]>([]);
  const [miaScelta, setMiaScelta] = React.useState<string | null>(null);
  const [esito, setEsito] = React.useState<{ mia: string; sua: string } | null>(null);
  const [erroreScelta, setErroreScelta] = React.useState<string | null>(null);
  /** L'esito dell'ultimo round è già stato letto e congedato (B-39). */
  const [finaleLetto, setFinaleLetto] = React.useState(false);

  /** Il modo arriva dalla rotta e serve **solo a creare**: vedi `apri`. */
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  React.useEffect(() => {
    apri(coppiaId, modo === 'personalizzata' ? 'personalizzata' : 'ufficiale');
  }, [coppiaId, apri, modo]);

  /** Le domande scritte dai due, quando la partita è personalizzata (D-19). */
  const set = useCarte(coppiaId, partita?.id ?? null, 'quiz_preferenze');
  const [rispostaScritta, setRispostaScritta] = React.useState('');

  /**
   * I membri attivi: servono a sapere di chi si parla nei round pari.
   *
   * 🔴 **L'elenco, non «l'altro»** (B-30): `membri.find(u => u !== io)` darebbe
   * un valore **relativo a chi guarda**, e sui due telefoni varrebbe due persone
   * diverse. Il turno lo deduce `disegnatoreDi` da `creata_da`, che è uguale
   * per entrambi.
   */
  React.useEffect(() => {
    if (!coppiaId) return;
    supabase
      .from('membro_coppia')
      .select('utente_id')
      .eq('coppia_id', coppiaId)
      .is('uscito_il', null)
      .then(({ data }) => setMembri((data ?? []).map((m) => m.utente_id)));
  }, [coppiaId]);

  const numeroRound = (partita?.round_corrente ?? 0) + 1;
  const roundVivo = round && round.numero === numeroRound && round.esito === 'in_corso' ? round : null;
  /** Chi ha creato la partita apre i round: uno solo, sempre lo stesso. */
  const ioApro = !!io && partita?.creata_da === io;
  /**
   * Di chi si parla in questo round. `disegnatoreDi` non disegna niente qui: è
   * «a chi tocca essere il soggetto del round n», ed è la stessa alternanza.
   */
  const soggetto = p.disegnatoreDi(numeroRound, membri);
  const ioSonoSoggetto = !!io && soggetto === io;

  /** Le opzioni vengono da `round`, non da `roundVivo` (B-34). */
  /**
   * La domanda scritta dalla coppia, quando la partita è personalizzata.
   *
   * ⚠️ Il round salva **solo l'id**: il testo sta in `domanda` e si legge da lì.
   * Copiarlo dentro `opzioni` avrebbe risparmiato questa riga e reso possibile
   * che le due copie divergessero — la stessa ragione per cui il turno non si
   * scrive sul round (D-87).
   */
  const cartaId = (round?.opzioni as { cartaId?: string } | null)?.cartaId ?? null;
  const cartaDomanda = cartaId ? (set.carte.find((x) => x.id === cartaId) ?? null) : null;

  const opzioni = (round?.opzioni as Opzioni | null) ?? null;
  const domanda = React.useMemo(
    () => DOMANDE_QUIZ.find((d) => d.titolo[0] === opzioni?.tema) ?? null,
    [opzioni]
  );
  const voci: Voce[] = React.useMemo(() => {
    if (!domanda || !opzioni) return [];
    return opzioni.scelte
      .map((k) => domanda.voci.find((v) => v[0] === k))
      .filter((v): v is Voce => !!v);
  }, [domanda, opzioni]);

  /* --- chi apre crea il round ---------------------------------------------- */
  React.useEffect(() => {
    if (partita?.stato !== 'in_corso' || !ioApro) return;
    if (round && round.numero === numeroRound) return;
    // Il round nuovo parte quando hanno premuto «continua» tutti e due (0027).
    // ⚠️ Non si guarda `finito_il`: arriva col realtime, mentre `round_corrente`
    // arriva dalla RPC — e nell'istante fra i due il guardiano lascerebbe
    // passare. Vedi la nota estesa in `telepatia.tsx`.
    if (round && !entrambiProntiRound) return;
    // 🔴 **Una volta sola, e il risultato non si butta** (B-43): se questo
    // effetto si rimontava mentre l'inserimento era in volo, il round finiva
    // nel database e lo stato locale non lo sapeva. Il giro dopo riprovava,
    // prendeva un duplicato e taceva: la partita restava ferma su un round che
    // **esisteva** — e per giocarlo bisognava uscire e rientrare.
    apriRound(`${partita.id}:${numeroRound}`, async (montata) => {
      const passati = await supabase
        .from('partita_round')
        .select('opzioni')
        .eq('partita_id', partita.id);
      const usate = new Set(
        (passati.data ?? [])
          .map((r) => (r.opzioni as Opzioni | null)?.tema)
          .filter((k): k is string => !!k)
      );
      /**
       * 🔑 **In personalizzata la domanda viene dal set della coppia**, e le
       * quattro opzioni non esistono: si risponde scrivendo. Il round salva solo
       * *quale* carta è uscita — il testo vive in `domanda`, e duplicarlo qui
       * vorrebbe dire poterlo far divergere.
       *
       * ⚠️ Le carte già uscite si leggono dai round passati, come le domande del
       * banco comune: è la stessa regola di B-33, applicata a un set di dieci
       * dove una ripetizione si noterebbe subito.
       */
      const opzioni = p.personalizzata
        ? (() => {
            const usateId = new Set(
              (passati.data ?? [])
                .map((r) => (r.opzioni as { cartaId?: string } | null)?.cartaId)
                .filter((k): k is string => !!k)
            );
            const carta = pescaCarta(set.carte, usateId, null);
            return carta ? { cartaId: carta.id } : null;
          })()
        : pescaOpzioni(usate);
      // Senza carte non si apre un round vuoto: si aspetta che il set arrivi.
      if (!opzioni) return;

      const { data, error } = await supabase
        .from('partita_round')
        .insert({ partita_id: partita.id, numero: numeroRound, opzioni })
        .select('*')
        .single();

      if (error || !data) {
        // Il round c'è già: si rilegge invece di lasciarlo lì. È «chi perde la
        // corsa rilegge» di `apri`, applicato alla corsa contro sé stessi.
        const { data: gia } = await supabase
          .from('partita_round')
          .select('*')
          .eq('partita_id', partita.id)
          .eq('numero', numeroRound)
          .maybeSingle();
        if (gia && montata()) setRound(gia);
        return;
      }
      if (montata()) setRound(data);
    });
  }, [
    partita?.stato,
    partita?.id,
    ioApro,
    round,
    numeroRound,
    entrambiProntiRound,
    setRound,
    apriRound,
    p.personalizzata,
    set.carte,
  ]);

  /* --- si sceglie ---------------------------------------------------------- */
  /**
   * ⚠️ **Se la scelta non arriva al database si torna indietro** (B-35): una
   * scrittura di cui non si guarda l'esito è una scrittura che si spera sia
   * avvenuta, e qui il costo è la partita ferma senza un messaggio.
   */
  async function scegli(chiave: string) {
    if (!roundVivo || miaScelta) return;
    setMiaScelta(chiave);
    tatto('scelta');
    const { error } = await supabase.from('invio_sigillato').insert({
      partita_id: roundVivo.partita_id,
      round: roundVivo.numero,
      natura: 'scelta',
      contenuto: { chiave },
    });
    if (error) {
      setMiaScelta(null);
      setErroreScelta(t.gioco.sceltaNonInviata);
    }
  }

  /**
   * **La risposta scritta** (D-19). Stessa tabella e stesso sigillo della
   * versione ufficiale: cambia solo che nel contenuto va `testo` invece di
   * `chiave`.
   *
   * 🔑 **`chiave` non si riusa per il testo libero**, ed è la ragione per cui la
   * 0028 tocca `rivela_telepatia`: in tutto il progetto `chiave` vuol dire *la
   * chiave neutra rispetto alla lingua*, quella che permette a due partner con
   * il telefono in lingue diverse di giocare la stessa partita. Una frase
   * scritta a mano non è neutra rispetto a niente.
   */
  async function mandaRisposta() {
    const testo = rispostaScritta.trim();
    if (!roundVivo || miaScelta || !testo) return;
    setMiaScelta(testo);
    tatto('scelta');
    const { error } = await supabase.from('invio_sigillato').insert({
      partita_id: roundVivo.partita_id,
      round: roundVivo.numero,
      natura: 'scelta',
      contenuto: { testo },
    });
    if (error) {
      setMiaScelta(null);
      setErroreScelta(t.gioco.rispostaNonInviata);
    }
  }

  /* --- si aspetta l'altro, e si confronta ---------------------------------- */
  /**
   * 🔴 Si chiede a `round` e non a `roundVivo` (B-37), e a round finito si chiede
   * **anche senza `miaScelta`**: è ciò che permette di recuperare una partita
   * ricaricata invece di lasciarla bloccata sul pop-up che non arriva.
   */
  React.useEffect(() => {
    if (!round || esito || !io) return;
    if (!miaScelta && !round.finito_il) return;
    let vivo = true;
    const chiedi = async () => {
      const { data } = await supabase.rpc('rivela_telepatia', {
        p_partita: round.partita_id,
        p_round: round.numero,
      });
      if (!vivo || !data || data.length < 2) return;
      const mia = data.find((r) => r.utente_id === io)?.scelta ?? miaScelta ?? '';
      const sua = data.find((r) => r.utente_id !== io)?.scelta ?? '';
      if (!miaScelta && mia) setMiaScelta(mia);
      setEsito({ mia, sua });
      /**
       * ⚠️ **A mano il confronto è tollerante**, e usa lo stesso normalizzatore
       * dei tentativi del disegno: maiuscole, accenti, articolo iniziale e spazi
       * doppi non fanno perdere un punto. Non corregge i refusi e non conosce i
       * sinonimi — «la pizza» e «pizza» sono la stessa risposta, «pizza» e
       * «margherita» no.
       *
       * 🔴 È un rischio accettato e va detto: su testo libero il confronto esatto
       * dirà «no» dove due persone direbbero «sì». La via alternativa era far
       * giudicare al soggetto se l'altro ci avesse preso — scartata perché mette
       * una persona a dare un voto all'altra dentro un gioco il cui punteggio è
       * della coppia. Da rivedere dopo la prima partita vera.
       */
      const preso = p.personalizzata ? normalizza(mia) === normalizza(sua) : mia === sua;
      if (preso) tatto('fatto');
      if (ioApro && round.esito === 'in_corso')
        await p.chiudi(round.id, preso ? 'vinto' : 'perso', preso ? 1 : 0);
    };
    chiedi();
    const id = setInterval(chiedi, 1200);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [round, miaScelta, esito, io, ioApro, p]);

  /* --- cambio round -------------------------------------------------------- */
  React.useEffect(() => {
    setMiaScelta(null);
    setEsito(null);
    setErroreScelta(null);
    setFinaleLetto(false);
    setRispostaScritta('');
  }, [round?.id]);

  /* --- schermate ----------------------------------------------------------- */
  /** La X dentro il gioco: esci (la partita resta) o annulla (B-48, vedi disegno.tsx). */
  function chiediUscita() {
    Alert.alert(t.gioco.uscireTitolo, t.gioco.uscireNota, [
      { text: t.gioco.resta, style: 'cancel' },
      { text: t.gioco.esciLasciando, onPress: () => router.back() },
      {
        text: t.gioco.annulla,
        style: 'destructive',
        onPress: async () => {
          await p.abbandona();
          router.back();
        },
      },
    ]);
  }

  if (!partita || p.caricando) {
    return (
      <Attesa titolo={t.giochi.quiz_preferenze} testo={t.gioco.preparo} onEsci={() => router.back()} />
    );
  }

  if (partita.stato === 'conclusa' && finaleLetto) {
    return (
      <PunteggioFinale
        titolo={t.giochi.quiz_preferenze}
        punti={partita.punti}
        totali={partita.round_totali}
        etichetta={t.gioco.conoscenza}
        onChiudi={async () => {
          await p.abbandona();
          router.back();
        }}
      />
    );
  }

  if (partita.stato === 'attesa' && p.personalizzata) {
    return (
      <PreparazioneCarte
        gioco="quiz_preferenze"
        titolo={t.giochi.quiz_preferenze}
        carte={set.carte}
        io={io}
        altro={membri.find((u) => u !== io) ?? null}
        scrivi={set.scrivi}
        cancella={set.cancella}
        errore={set.errore}
        caricando={set.caricando}
        ioSonoPronto={p.ioSonoPronto}
        // 🔑 «Ho finito» **è** «sono pronto»: stessa funzione del bottone
        // «Avvia partita», quindi la partita comincia quando la seconda persona
        // ha finito di scrivere. Nessuno stato nuovo da inventare.
        onPronto={p.premiAvvia}
        onEsci={() => router.back()}
        onAnnulla={async () => {
          await p.abbandona();
          router.back();
        }}
      />
    );
  }

  if (partita.stato === 'attesa') {
    return (
      <Attesa
        titolo={t.giochi.quiz_preferenze}
        testo={p.ioSonoPronto ? t.gioco.attendoAltro : t.gioco.pronti}
        onEsci={() => router.back()}
        onAnnulla={async () => {
          await p.abbandona();
          router.back();
        }}
        azione={p.ioSonoPronto ? undefined : t.gioco.avvia}
        onAzione={p.premiAvvia}
        spiegazione={t.hubGiochi.comeSiGioca.quiz_preferenze}
        attesa={p.ioSonoPronto}
      />
    );
  }

  /**
   * ⚠️ **Il ruolo si scrive prima delle carte, non dopo.** Le stesse quattro
   * risposte servono a due cose opposte a seconda di chi guarda, e chi capisce
   * il ruolo al contrario non sbaglia solo il proprio round: lo rovina a
   * entrambi, perché la risposta «vera» finisce per essere un tentativo.
   */
  const istruzione = miaScelta
    ? ioSonoSoggetto
      ? t.gioco.haiRisposto
      : t.gioco.haiProvato
    : ioSonoSoggetto
      ? t.gioco.rispondiPerTe
      : t.gioco.indovinaLui;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-start justify-between px-6 pb-4 pt-1">
          <View className="flex-1 gap-1">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.gioco.round(numeroRound, partita.round_totali)}
            </Text>
            {/* 🔑 **La pillola del ruolo** (2026-09-01, chiesto dall'utente).
                Il ruolo stava solo in una riga grigia sotto la domanda, cioè
                nella parte della schermata che si legge per ultima — o non si
                legge. Qui è un blocco **colorato**, e i due colori sono quelli
                che l'app già usa per «tuo» e «suo»: magenta l'accento di chi
                agisce, ambra la tinta con cui, nelle carte, si segna la scelta
                dell'altro. Chi ha giocato un round li ha già imparati. */}
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: ioSonoSoggetto ? c.accento : c.ambra,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 5,
                marginTop: 2,
                marginBottom: 4,
              }}
            >
              <Text
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: c.suAccento }}
              >
                {ioSonoSoggetto ? t.gioco.ruoloRispondi : t.gioco.ruoloIndovina}
              </Text>
            </View>
            {/* 🔑 **E la domanda cambia persona**: «Il tuo piatto consolatorio»
                quando tocca a te, «Il suo» quando devi indovinarlo. È la metà
                che conta davvero — mette il ruolo dove gli occhi già sono,
                invece di aggiungere una cosa in più da leggere. */}
            <Text className="font-serif-bold text-3xl text-foreground">
              {p.personalizzata
                ? (cartaDomanda?.testo ?? '…')
                : domanda
                  ? rendi(ioSonoSoggetto ? domanda.tuo : domanda.titolo, lingua)
                  : '…'}
            </Text>
            <Text className="text-sm text-muted-foreground">{istruzione}</Text>
          </View>
          <TondoVetro lato={40} tinto={false} onPress={chiediUscita}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        {/* --- personalizzata: si scrive, non si sceglie ------------------ */}
        {p.personalizzata ? (
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-1 justify-center gap-4 px-6">
              {!miaScelta ? (
                <>
                  <View
                    className="rounded-3xl border border-border/60 px-5"
                    style={{ backgroundColor: c.alone }}
                  >
                    <TextInput
                      value={rispostaScritta}
                      onChangeText={setRispostaScritta}
                      // ⚠️ Il segnaposto dice **cosa** si sta scrivendo, e non è
                      // lo stesso testo per i due: la propria risposta e il
                      // tentativo sull'altro sono due cose diverse scritte nello
                      // stesso riquadro, ed è il punto in cui si può sbagliare
                      // gioco senza accorgersene.
                      placeholder={ioSonoSoggetto ? t.gioco.tuaRisposta : t.gioco.suaRisposta}
                      placeholderTextColor={c.tenue}
                      style={{ color: c.testo, paddingVertical: 16, fontSize: 18 }}
                      multiline
                      editable={!!roundVivo}
                      onSubmitEditing={mandaRisposta}
                      returnKeyType="done"
                    />
                  </View>
                  {!!rispostaScritta.trim() && (
                    <BottonePieno testo={t.gioco.manda} altezza={54} onPress={mandaRisposta} />
                  )}
                </>
              ) : (
                <CartaVetro raggio={26} fondo="pieno">
                  <View className="gap-2 px-6 py-6" style={{ borderRadius: 26 }}>
                    <Text
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: c.accento }}
                    >
                      {ioSonoSoggetto ? t.gioco.tuaRisposta : t.gioco.suaRisposta}
                    </Text>
                    <Text className="font-serif text-xl text-foreground">{miaScelta}</Text>
                    {/* La risposta dell'altro compare **solo a rivelazione
                        avvenuta**: prima non esiste per questo telefono, ed è la
                        policy `sigillato_select` a garantirlo, non questa riga. */}
                    {!!esito && (
                      <View className="gap-1 pt-3">
                        <Text
                          className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: c.ambra }}
                        >
                          {ioSonoSoggetto ? t.gioco.ruoloIndovina : t.gioco.ruoloRispondi}
                        </Text>
                        <Text className="font-serif text-xl" style={{ color: c.ambra }}>
                          {esito.sua}
                        </Text>
                      </View>
                    )}
                  </View>
                </CartaVetro>
              )}
            </View>
          </KeyboardAvoidingView>
        ) : (
        <View className="flex-1 justify-center gap-3 px-6">
          {voci.map((v, i) => {
            const mia = miaScelta === v[0];
            const sua = esito?.sua === v[0];
            return (
              <Comparsa key={v[0]} visibile ritardo={i * 60} scarto={10}>
                <Premibile
                  onPress={() => scegli(v[0])}
                  disabled={!!miaScelta || !roundVivo}
                  aptico={false}
                  scala={0.97}
                >
                  {/* `fondo="pieno"` per tutte: con `'sicuro'` il vetro nativo lo
                      disegna iOS quando gli pare, e una carta su quattro restava
                      senza superficie (2026-09-01, B-15 in flagrante). */}
                  <CartaVetro raggio={26} fondo="pieno">
                    <View
                      className="flex-row items-center justify-between px-6"
                      style={{
                        height: 78,
                        borderRadius: 26,
                        borderWidth: mia || sua ? 2 : 0,
                        borderColor: mia ? c.accento : sua ? c.ambra : 'transparent',
                        opacity: miaScelta && !mia && !sua ? 0.45 : 1,
                      }}
                    >
                      <Text
                        className="flex-1 font-serif text-xl"
                        style={{ color: mia ? c.accento : c.testo }}
                        numberOfLines={2}
                      >
                        {rendi(v, lingua)}
                      </Text>
                      {!!esito && sua && (
                        <View
                          style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.ambra }}
                        />
                      )}
                    </View>
                  </CartaVetro>
                </Premibile>
              </Comparsa>
            );
          })}
        </View>
        )}

        <View className="px-6 pb-6" style={{ minHeight: 40 }}>
          {!!(erroreScelta || p.errore) && (
            <Text className="pt-2 text-center text-sm text-destructive">
              {erroreScelta ?? p.errore}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* --- il pop-up dell'esito ------------------------------------------- */}
      {!!esito && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              backgroundColor: 'rgba(20,10,18,0.30)',
            },
          ]}
        >
          <Comparsa visibile scarto={14}>
            <CartaVetro raggio={28} fondo="pieno">
              <View className="items-center gap-3 px-7 py-7" style={{ minWidth: 250 }}>
                <Text
                  className="text-center font-serif-bold text-3xl"
                  style={{ color: esito.mia === esito.sua ? c.accento : c.tenue }}
                >
                  {esito.mia === esito.sua ? t.gioco.indovinato : t.gioco.nonIndovinato}
                </Text>
                {/* ⚠️ Sbagliando si mostra **la risposta vera**, non il tentativo:
                    è l'unica delle due che insegna qualcosa, e per il soggetto il
                    proprio tentativo mancato non esiste — la sua riga *era* la
                    verità. Chi è chi lo dice il turno, quindi la frase cambia. */}
                {(p.personalizzata ? normalizza(esito.mia) !== normalizza(esito.sua) : esito.mia !== esito.sua) && (
                  <Text className="text-center text-base text-muted-foreground">
                    {p.personalizzata
                      ? ioSonoSoggetto
                        ? t.gioco.tuAveviRisposto(esito.sua)
                        : t.gioco.avevaRisposto(esito.sua)
                      : ioSonoSoggetto
                      ? t.gioco.tuAveviDetto(
                          rendi(
                            domanda?.voci.find((v) => v[0] === esito.sua) ?? [esito.sua, esito.sua],
                            lingua
                          )
                        )
                      : t.gioco.avevaScelto(
                          rendi(
                            domanda?.voci.find((v) => v[0] === esito.sua) ?? [esito.sua, esito.sua],
                            lingua
                          )
                        )}
                  </Text>
                )}
                {partita.stato === 'conclusa' ? (
                  <BottonePieno
                    testo={t.gioco.continua}
                    onPress={() => setFinaleLetto(true)}
                    style={{ minWidth: 200 }}
                  />
                ) : p.ioSonoProntoRound ? (
                  <View className="items-center gap-2 pt-1">
                    <ActivityIndicator color={c.accento} />
                    <Text className="text-center text-sm text-muted-foreground">
                      {t.gioco.attendoContinua}
                    </Text>
                  </View>
                ) : (
                  <BottonePieno
                    testo={t.gioco.continua}
                    onPress={p.segnaProntoRound}
                    style={{ minWidth: 200 }}
                  />
                )}
              </View>
            </CartaVetro>
          </Comparsa>
        </View>
      )}
    </View>
  );
}
