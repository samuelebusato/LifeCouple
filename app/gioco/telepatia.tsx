import * as React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { CartaVetro, TondoVetro, BottonePieno } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { PunteggioFinale } from '@/components/punteggio-finale';
import { Attesa } from '@/components/attesa-partita';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { usePartita, useAperturaRound } from '@/lib/partita';
import { TEMI_TELEPATIA, rendi, type Voce } from '@/lib/parole';
import { useTema } from '@/lib/tema';
import { tatto } from '@/lib/movimento';
import { t, lingua } from '@/lib/i18n';

/** Ciò che il round salva: il tema e le quattro opzioni, come chiavi. */
type Opzioni = { tema: string; scelte: string[] };

/**
 * Quattro voci pescate da un tema, senza ripetizioni.
 *
 * 🔴 **E il tema non si ripete nella partita** (B-33). Prima si pescava a caso
 * fra i 25 temi a ogni round, senza memoria: su una partita da **10** round la
 * probabilità di vedere almeno una categoria due volte è circa l'**84%** — cioè
 * praticamente sempre. Non era un caso raro sfuggito alla prova: era il
 * comportamento normale, e il calcolo si poteva fare prima di scrivere il
 * codice.
 *
 * `usati` arriva dai round già giocati di **questa** partita, letti dal
 * database e non tenuti in memoria: chi crea i round è sempre lo stesso
 * telefono, ma può aver chiuso e riaperto la schermata.
 */
function pescaOpzioni(usati: Set<string>): Opzioni {
  // Se i temi finissero si ricomincia da tutti: ripetere è meglio che non avere
  // un round. Con 25 temi e 10 round non può succedere — ma il modo in cui un
  // caso impossibile fallisce va deciso, non scoperto.
  const disponibili = TEMI_TELEPATIA.filter((x) => !usati.has(x.titolo[0]));
  const banco = disponibili.length > 0 ? disponibili : TEMI_TELEPATIA;
  const tema = banco[Math.floor(Math.random() * banco.length)];
  const rimaste = [...tema.voci];
  const scelte: string[] = [];
  for (let i = 0; i < 4 && rimaste.length > 0; i++) {
    const k = Math.floor(Math.random() * rimaste.length);
    scelte.push(rimaste[k][0]);
    rimaste.splice(k, 1);
  }
  return { tema: tema.titolo[0], scelte };
}

/**
 * **Telepatia.** Le stesse quattro opzioni a tutti e due, nello stesso momento:
 * si vince quando pensate la stessa cosa.
 *
 * ## 🔑 Perché qui il sigillo di D-12 serve davvero
 *
 * Nel disegno non c'è niente da nascondere fra i due: uno sa la parola, l'altro
 * la cerca, e il gioco è quello. Qui invece **vedere la scelta dell'altro prima
 * di aver scelto non è barare: è non giocare**. Il gioco *è* scegliere al buio.
 *
 * Per questo le scelte passano da `invio_sigillato`, la cui policy dice che
 * l'altro non legge mai — e il confronto lo fa `rivela_telepatia`, che
 * restituisce **niente** finché mancano scelte. Non «la tua sì e la sua no»:
 * niente, perché rispondere a metà direbbe *quando* l'altro ha scelto, e anche
 * quello è un pezzo d'informazione che il gioco non deve dare.
 *
 * ## Perché si interroga a intervalli invece di ascoltare
 *
 * `invio_sigillato` non sta nella pubblicazione realtime, e non ci starebbe
 * bene: la sua RLS nasconde la riga dell'altro, quindi l'evento non arriverebbe
 * comunque a chi aspetta. La domanda ripetuta a `rivela_telepatia` è la strada
 * onesta — e costa poco, perché dura solo i secondi fra la prima scelta e la
 * seconda.
 */
export default function GiocoTelepatia() {
  const router = useRouter();
  const { c } = useTema();
  const { coppiaId } = useCoppia();
  const p = usePartita('telepatia');
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
  const [miaScelta, setMiaScelta] = React.useState<string | null>(null);
  const [esito, setEsito] = React.useState<{ mia: string; sua: string } | null>(null);
  /** La scelta non è arrivata al database: si può — e si deve — ripremere. */
  const [erroreScelta, setErroreScelta] = React.useState<string | null>(null);
  /**
   * 🔴 **Se l'esito dell'ultimo round è già stato letto e congedato** (B-39,
   * 2026-09-01 — difetto riferito: *«entra in un loop in cui continua a comparire
   * il pop-up "è la stessa"»*).
   *
   * Il primo tentativo congedava il pop-up con `setEsito(null)`. Non poteva
   * funzionare: da B-37 l'effetto della rivelazione **sopravvive alla chiusura
   * del round**, quindi trovava `esito` vuoto, richiedeva la rivelazione al
   * database — che risponde sempre la stessa cosa — e rimetteva il pop-up. Un
   * anello chiuso, e senza uscita: il bottone alimentava ciò che voleva togliere.
   *
   * 🔑 *Cancellare un dato non è dire che l'hai visto.* Il dato è vero e resta
   * vero; quello che cambia è che **questo telefono** l'ha già letto — ed è una
   * cosa che nessun campo del database può sapere, perché l'altro lo legge per
   * conto suo.
   */
  const [finaleLetto, setFinaleLetto] = React.useState(false);

  React.useEffect(() => {
    apri(coppiaId);
  }, [coppiaId, apri]);

  const numeroRound = (partita?.round_corrente ?? 0) + 1;
  const roundVivo = round && round.numero === numeroRound && round.esito === 'in_corso' ? round : null;
  /** Chi ha creato la partita apre i round: uno solo, sempre lo stesso. */
  const ioApro = !!io && partita?.creata_da === io;

  /**
   * 🔴 **Le opzioni vengono da `round`, non da `roundVivo`** (B-34).
   *
   * `roundVivo` diventa `null` nell'istante in cui il round si chiude — è la
   * sua definizione. Leggendo le opzioni da lì, **le quattro carte sparivano
   * insieme al round**: nei tre secondi della rivelazione restava una
   * schermata vuota col titolo `…`, e la scelta del partner non si poteva
   * vedere perché non c'era più nessuna carta su cui vederla.
   *
   * 🔑 Il round finito **è** il momento per cui si gioca. `roundVivo` continua
   * a servire, ma per una cosa sola: dire se si può ancora premere.
   */
  const opzioni = (round?.opzioni as Opzioni | null) ?? null;
  const tema = React.useMemo(
    () => TEMI_TELEPATIA.find((x) => x.titolo[0] === opzioni?.tema) ?? null,
    [opzioni]
  );
  const voci: Voce[] = React.useMemo(() => {
    if (!tema || !opzioni) return [];
    return opzioni.scelte
      .map((k) => tema.voci.find((v) => v[0] === k))
      .filter((v): v is Voce => !!v);
  }, [tema, opzioni]);

  /* --- chi apre crea il round ---------------------------------------------- */
  React.useEffect(() => {
    if (partita?.stato !== 'in_corso' || !ioApro) return;
    if (round && round.numero === numeroRound) return;
    /**
     * 🔑 **Il round nuovo non parte più dopo un tempo: parte quando hanno
     * premuto «continua» tutti e due** (0027, chiesto il 2026-09-01).
     *
     * Qui c'era `PAUSA_FRA_ROUND`, tre secondi uguali per chiunque. Il difetto
     * riferito — *«le animazioni sono troppo veloci»* — non si sarebbe risolto
     * allungandoli: un timer più lungo sposta il problema addosso a chi legge in
     * fretta, e resta comunque un'attesa cieca, identica sia che l'altro stia
     * guardando lo schermo sia che abbia posato il telefono.
     *
     * 🔴 **E il guardiano NON può guardare `finito_il`** (2026-09-01, secondo
     * tentativo). La prima stesura diceva `round?.finito_il && !entrambiProntiRound`
     * e il round passava avanti lo stesso, col pop-up che si affacciava e
     * spariva. La causa è una corsa fra due aggiornamenti che arrivano da strade
     * diverse: `chiudi` fa `setPartita` con `round_corrente` già avanzato — è la
     * risposta della RPC — mentre il `round` locale prende `finito_il` **solo**
     * quando arriva l'evento realtime, un istante dopo. In quell'istante
     * `numeroRound` è già N+1 e `finito_il` è ancora `null`: il guardiano
     * interrogava un campo non ancora arrivato, e lasciava passare.
     *
     * 🔑 La condizione giusta non ha bisogno che nessun campo arrivi: **se un
     * round esiste ed è arrivato fin qui, è un round passato.** Quello in corso
     * l'ha già fermato la riga sopra, e al primo round `round` è `null` — quindi
     * la partita parte senza aspettare un «continua» che nessuno vedrebbe.
     * *Un guardiano che dipende da un dato in viaggio non è un guardiano.*
     */
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
      const { data, error } = await supabase
        .from('partita_round')
        .insert({ partita_id: partita.id, numero: numeroRound, opzioni: pescaOpzioni(usate) })
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
  ]);

  /* --- si sceglie ---------------------------------------------------------- */
  /**
   * ⚠️ **Se la scelta non arriva al database, si torna indietro** (B-35).
   *
   * Prima l'esito dell'`insert` non si guardava. Una scelta che non si scrive
   * lascia la schermata dicendo «hai scelto» mentre il database non ha niente:
   * `rivela_telepatia` non arriverà **mai** a due righe, il partner aspetta
   * all'infinito, e il guardiano `if (miaScelta) return` impedisce pure di
   * riprovare. È la partita che si blocca, senza un messaggio.
   *
   * 🔑 È la forma di B-23 spostata di un livello: lì un permesso mancante non
   * falliva, qui un fallimento c'era e nessuno lo leggeva. *Una scrittura di
   * cui non si guarda l'esito è una scrittura che si spera sia avvenuta.*
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

  /* --- si aspetta l'altro, e si confronta ---------------------------------- */
  /**
   * 🔴 **Si chiede la rivelazione a `round`, non a `roundVivo`** (B-37,
   * 2026-09-01) — ed è la seconda metà di B-34, rimasta indietro per tre giorni.
   *
   * `roundVivo` diventa `null` **nell'istante in cui il round si chiude**: è la
   * sua definizione. Ma chi chiude è uno solo — chi apre i round — e lo fa
   * appena *lui* ha ricevuto la rivelazione. Sull'altro telefono il giro di
   * domande passa ogni 1200 ms: se la chiusura arriva prima del suo giro,
   * `roundVivo` si spegne, questo effetto si smonta, e `esito` **non viene
   * impostato mai**.
   *
   * 🔑 Fino al 2026-09-01 il difetto c'era ma non fermava niente: la pausa di
   * tre secondi faceva partire il round dopo comunque, e chi perdeva l'esito si
   * limitava a non vederlo — cioè esattamente il sintomo di B-34, che era stato
   * corretto **solo dalla parte delle carte**. Da quando il round successivo
   * aspetta il «Continua» di tutti e due, quel mancato esito non è più un
   * fastidio: è una **partita che si blocca**, perché chi non ha visto il pop-up
   * non ha nessun bottone da premere.
   *
   * ⚠️ Il round finito **è** il momento per cui si gioca (B-34): questo effetto
   * deve sopravvivergli, non spegnersi insieme a lui.
   */
  React.useEffect(() => {
    if (!round || esito || !io) return;
    /**
     * ⚠️ **A round aperto serve aver scelto; a round chiuso no.**
     *
     * `miaScelta` è stato locale: chi chiude e riapre la schermata lo perde. Con
     * la sola condizione `!miaScelta` chi rientrasse a round finito non
     * chiederebbe più la rivelazione, resterebbe senza pop-up e — da oggi che il
     * round dopo aspetta il «Continua» — **senza modo di far ripartire la
     * partita**. La rivelazione però non ha bisogno di sapere cosa abbiamo
     * scelto: la scelta gliela dice il database. Quindi a round finito si chiede
     * comunque, ed è ciò che permette di recuperare una partita ricaricata.
     */
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
      // Ripristina anche l'evidenza sulla carta: chi ha ricaricato deve rivedere
      // **quale** aveva scelto, o l'esito è una frase senza il suo referente.
      if (!miaScelta && mia) setMiaScelta(mia);
      setEsito({ mia, sua });
      const coincide = mia === sua;
      if (coincide) tatto('fatto');
      // ⚠️ Chiude **solo chi apre i round**, e **solo se è ancora aperto**: ora
      // che questo effetto sopravvive alla chiusura, senza la seconda condizione
      // manderebbe una `chiudi` su un round già chiuso a ogni giro. La funzione
      // la regge — trova il round non più `in_corso` e torna — ma sarebbe una
      // scrittura inutile ogni 1200 ms invece che una sola.
      if (ioApro && round.esito === 'in_corso')
        await p.chiudi(round.id, coincide ? 'vinto' : 'perso', coincide ? 1 : 0);
    };
    chiedi();
    const id = setInterval(chiedi, 1200);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [round, miaScelta, esito, io, ioApro, p]);

  /* --- cambio round -------------------------------------------------------- */
  /**
   * 🔴 **Si azzera quando arriva il round NUOVO, non quando finisce il vecchio**
   * (B-34) — ed è il difetto per cui «non si vedeva se si aveva indovinato».
   *
   * La dipendenza era `numeroRound`, cioè `partita.round_corrente + 1`. Ma
   * `round_corrente` lo scrive `chiudi_round` **nello stesso istante** in cui
   * il round si chiude: `setEsito(...)` e `setEsito(null)` finivano nello
   * stesso giro di render. L'esito veniva calcolato correttamente, scritto, e
   * cancellato prima di comparire — poi la schermata restava tre secondi
   * **vuota** (la pausa fra i round) e ripartiva. Da fuori si legge come
   * «l'animazione è troppo veloce»: non lo era, non c'era proprio.
   *
   * 🔑 `round?.id` cambia solo quando il round successivo viene **inserito**,
   * cioè dopo la pausa. La chiusura del round in corso è un `update` sulla
   * stessa riga e lascia l'id dov'è — che è esattamente la distinzione che
   * serve: *l'esito appartiene al round che l'ha prodotto, e vive finché vive
   * lui.*
   */
  React.useEffect(() => {
    setMiaScelta(null);
    setEsito(null);
    setErroreScelta(null);
    // Anche questo: un round nuovo vuol dire che si sta giocando, quindi nessun
    // esito finale e' stato congedato. Senza, una seconda partita aperta senza
    // smontare la schermata salterebbe il pop-up del suo ultimo round.
    setFinaleLetto(false);
  }, [round?.id]);

  /* --- schermate ----------------------------------------------------------- */
  if (!partita || p.caricando) {
    return <Attesa titolo={t.giochi.telepatia} testo={t.gioco.preparo} onEsci={() => router.back()} />;
  }

  /**
   * 🔴 **`&& !esito`: l'ultimo round mostrava il punteggio senza mostrare come
   * era andato** (2026-09-01, difetto riferito: *«l'ultima domanda della
   * telepatia non mostra il risultato»*).
   *
   * Chiuso il decimo round la partita passa a `conclusa` nello stesso istante,
   * e questa riga portava dritti al punteggio finale: il pop-up del round non
   * faceva in tempo a esistere. Si perdeva **proprio l'ultimo**, cioè quello che
   * decide il punteggio che si sta per leggere.
   *
   * 🔑 Era un difetto già prima del pop-up — l'esito dell'ultimo round non l'ha
   * mai visto nessuno — ma finché tutti gli altri sfilavano via da soli non
   * stonava. Adesso che ogni round si chiude con un gesto, l'unico che si
   * chiudeva da solo era quello che conta di più.
   */
  if (partita.stato === 'conclusa' && finaleLetto) {
    return (
      <PunteggioFinale
        titolo={t.giochi.telepatia}
        punti={partita.punti}
        totali={partita.round_totali}
        etichetta={t.gioco.sintonia}
        onChiudi={async () => {
          await p.abbandona();
          router.back();
        }}
      />
    );
  }

  if (partita.stato === 'attesa') {
    return (
      <Attesa
        titolo={t.giochi.telepatia}
        testo={p.ioSonoPronto ? t.gioco.attendoAltro : t.gioco.pronti}
        onEsci={() => router.back()}
        onAnnulla={async () => {
          await p.abbandona();
          router.back();
        }}
        azione={p.ioSonoPronto ? undefined : t.gioco.avvia}
        onAzione={p.premiAvvia}
        spiegazione={t.hubGiochi.comeSiGioca.telepatia}
        attesa={p.ioSonoPronto}
      />
    );
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-start justify-between px-6 pb-4 pt-1">
          <View className="flex-1 gap-1">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.gioco.round(numeroRound, partita.round_totali)}
            </Text>
            <Text className="font-serif-bold text-3xl text-foreground">
              {tema ? rendi(tema.titolo, lingua) : '…'}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {miaScelta ? t.gioco.haiScelto : t.gioco.sceglieteInsieme}
            </Text>
          </View>
          <TondoVetro lato={40} tinto={false} onPress={() => router.back()}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        <View className="flex-1 justify-center gap-3 px-6">
          {voci.map((v, i) => {
            const mia = miaScelta === v[0];
            const sua = esito?.sua === v[0];
            return (
              <Comparsa key={v[0]} visibile ritardo={i * 60} scarto={10}>
                {/* ⚠️ Anche `!roundVivo`: durante la rivelazione le carte
                    restano **visibili** (è il punto di B-34) ma non si premono
                    più. Prima bastava `miaScelta` perché a round finito le
                    carte sparivano del tutto. */}
                <Premibile
                  onPress={() => scegli(v[0])}
                  disabled={!!miaScelta || !roundVivo}
                  aptico={false}
                  scala={0.97}
                >
                  {/* 🔴 **Lo stesso `fondo` per tutte e quattro** (2026-09-01,
                      difetto riferito: *«alcuni riquadri con la risposta sono
                      come evidenziati o in rilievo»*).

                      Qui c'era `fondo={mia ? 'pieno' : 'sicuro'}`, e non sono due
                      sfumature dello stesso materiale: **sono due materiali
                      diversi**. `'pieno'` salta del tutto il vetro nativo e mette
                      una base opaca; `'sicuro'` lo lascia fare al sistema. Nella
                      stessa fila di quattro carte questo produce una superficie
                      che sta su un piano diverso dalle altre — che è esattamente
                      la parola usata nella segnalazione, «in rilievo».

                      🔑 **L'evidenza della scelta non deve passare dal
                      materiale**, perché il materiale lo decide iOS e cambia
                      aspetto senza avvisare (B-15, causa mai isolata). Passa da
                      cose nostre, che ci sono già e non sbiadiscono: il bordo di
                      2 punti in accento, il testo in accento, e le altre carte
                      portate a 0,45 di opacita'.

                      🔴 **E `'pieno'` per tutte, non `'sicuro'`** (2026-09-01,
                      secondo giro, con lo screenshot alla mano). Uniformare il
                      fondo non bastava: nello screenshot le quattro carte
                      avevano già lo stesso `fondo`, e **la prima non aveva il
                      riquadro affatto** — non era «più in evidenza», erano le
                      altre tre ad avere una superficie e lei no. È B-15 preso in
                      flagrante: `'sicuro'` lascia disegnare il vetro **nativo**,
                      e quando iOS decide di non disegnarlo resta la sola
                      velatura chiarissima, che sul fondo chiaro dell'app è
                      indistinguibile dallo sfondo.

                      `'pieno'` **salta il vetro nativo** e mette una base opaca
                      nostra: stesso aspetto su iOS e su Android, e nessuna carta
                      può più sparire. Si perde l'effetto vetro su queste quattro
                      superfici — ed è un prezzo che vale, perché una carta da
                      premere che a volte non si vede non è una decorazione
                      riuscita male: è un comando invisibile. */}
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
                      {/* Chi ha scelto cosa si vede **solo dopo** la rivelazione:
                          prima non c'è niente da mostrare, ed è il punto. */}
                      {/* Un pallino, non una scritta: la frase per esteso sta
                          nel riquadro dell'esito, e ripeterla qui su ogni riga
                          sarebbe la stessa informazione detta due volte. */}
                      {!!esito && sua && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: c.ambra,
                          }}
                        />
                      )}
                    </View>
                  </CartaVetro>
                </Premibile>
              </Comparsa>
            );
          })}
        </View>

        <View className="px-6 pb-6" style={{ minHeight: 40 }}>
          {!!(erroreScelta || p.errore) && (
            <Text className="pt-2 text-center text-sm text-destructive">
              {erroreScelta ?? p.errore}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* --- il pop-up dell'esito (0027, chiesto il 2026-09-01) --------------
          🔑 **Era un riquadro in fondo, ora è un pop-up, e il cambio non è
          estetico.** Il riquadro conviveva con una pausa di tre secondi: si
          affacciava e spariva, e chi non stava già guardando in basso lo
          perdeva. Il difetto riferito — *«le animazioni sono troppo veloci»* —
          era questo. Un pop-by al centro con un bottone toglie il cronometro
          dalla faccenda: **la schermata resta finché non decidete voi**.

          ⚠️ **Le carte sotto restano visibili** attraverso il velo, ed è
          deliberato: è il punto di B-34: l'esito si legge guardando *quale*
          carta ha scelto l'altro, e un pop-up opaco cancellerebbe proprio ciò
          che si è appena finito di aspettare. */}
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
            {/* 🔴 `fondo="pieno"` e non `"sicuro"` (2026-09-01, difetto riferito:
                *«a volte il pop-up è in trasparenza»*). `"sicuro"` lascia fare al
                **vetro nativo di iOS**, che il sistema disegna quando gli pare:
                quando non lo fa resta la sola velatura chiarissima, e sopra un
                velo scuro quella non è un fondo — è un pop-up che si vede
                attraverso. La regola sta gia' scritta in `vetro.tsx`: `"pieno"` è
                *«per il vetro dentro un foglio, dove sotto c'è solo la velatura
                scura del modale»*, che è esattamente questo. Sbagliato io a non
                applicarla: è la stessa lezione del bottone «avvia» che sembrava
                spento — **ciò che deve reggere non può dipendere da un materiale
                che decide il sistema**. */}
            <CartaVetro raggio={28} fondo="pieno">
              <View className="items-center gap-3 px-7 py-7" style={{ minWidth: 250 }}>
                <Text
                  className="text-center font-serif-bold text-3xl"
                  style={{ color: esito.mia === esito.sua ? c.accento : c.tenue }}
                >
                  {esito.mia === esito.sua ? t.gioco.coincidete : t.gioco.diverso}
                </Text>
                {esito.mia !== esito.sua && (
                  <Text className="text-center text-base text-muted-foreground">
                    {t.gioco.haSceltoLui(
                      rendi(
                        tema?.voci.find((v) => v[0] === esito.sua) ?? [esito.sua, esito.sua],
                        lingua
                      )
                    )}
                  </Text>
                )}
                {/* ⚠️ Premuto il bottone sparisce e al suo posto c'è **chi si sta
                    aspettando**. Un bottone che resta premibile dopo aver fatto
                    il suo lavoro invita a premerlo di nuovo, e qui la seconda
                    pressione non fa niente di visibile: sembrerebbe rotto. */}
                {/* ⚠️ **All'ultimo round non si aspetta nessuno.** Dopo di questo
                    non c'è un round da far partire insieme: c'è il punteggio, e
                    ognuno lo legge quando vuole. Far aspettare qui sarebbe
                    un'attesa senza scopo — e se l'altro avesse gia' posato il
                    telefono, un'attesa senza fine. */}
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
