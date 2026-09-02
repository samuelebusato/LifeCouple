import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Riani, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { BottoneVetro, BottonePieno, CartaVetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Foglio } from '@/components/foglio';
import { CartaGioco } from '@/components/carta-gioco';
import { ServePartner } from '@/components/serve-partner';
import { GIOCHI, type CodiceGioco, type ModoGioco } from '@/lib/giochi';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { useTema } from '@/lib/tema';
import { molla } from '@/lib/movimento';
import { t } from '@/lib/i18n';

/**
 * **L'hub dei giochi**: si sceglie il gioco scorrendo, e sotto ci sono i due
 * soli comandi che servono — «Classifica» e «Gioca».
 *
 * ## Perche' un carosello e non una griglia
 *
 * Una griglia di tre icone era la soluzione ovvia e piu' corta da scrivere. Il
 * carosello vince per una ragione che non e' estetica: i giochi qui sono
 * **quattro**, e resteranno pochi anche dopo (P-04 ne propone altri quattro, non
 * altri quaranta). Con pochi elementi la griglia spreca lo schermo e li mostra
 * tutti alla stessa distanza dall'occhio, mentre il carosello ne **sceglie uno
 * alla volta** e quindi puo' permettersi di dire, di ognuno, cosa e': un disegno
 * grande e una frase intera, invece di un'etichetta di due parole sotto
 * un'icona.
 *
 * ⚠️ I due comandi restano **due, sempre gli stessi, fermi in fondo**. E' la
 * parte del riferimento che valeva la pena prendere: la carta cambia, i comandi
 * no. Se ogni carta avesse i suoi bottoni, cambiare gioco sposterebbe anche i
 * comandi, e ogni scorrimento costringerebbe a ritrovarli.
 *
 * ## Cosa manca ancora, e si dice invece di nasconderlo
 *
 * ✅ Le partite **ci sono tutte e quattro** dal 2026-09-02 (la voce 8 del backlog
 * e' chiusa dalla 0020: il sigillo D-12 esiste, e i tre giochi che ne hanno
 * bisogno lo usano).
 *
 * ✅ E dal 2026-09-02 **anche la riga «personalizzata» fa qualcosa** (D-19): per
 * tre sessioni di fila era stata segnalata come *l'unico comando dell'app che
 * prometteva una differenza inesistente*. Ora avvia la partita col set scritto
 * dalla coppia — tranne nella telepatia, dove è stata tolta su richiesta
 * dell'utente e il bottone «Gioca» entra diretto (vedi `CON_PERSONALIZZATA`).
 *
 * Questo hub **non finge**: è la regola di `SezioneInArrivo` — *nessun gap
 * silenzioso* — che vale anche verso chi usa l'app.
 */
export default function Giochi() {
  const router = useRouter();
  const { c } = useTema();
  const { width, height } = useWindowDimensions();
  const { coppiaId, completa, ricarica } = useCoppia();

  /** Quale foglio e' aperto. Uno solo alla volta: sono due strade diverse. */
  const [foglio, setFoglio] = React.useState<null | 'gioca' | 'punteggio'>(null);
  /**
   * Il gioco al centro.
   *
   * ⚠️ Vive in uno stato React e **non** nella `x` di Reanimated, ed e' voluto:
   * la `x` cambia sessanta volte al secondo e serve al movimento, questo cambia
   * una volta per carta attraversata e serve a **scrivere un nome**. Tenerli separati
   * evita di far ridisegnare tre carte a ogni fotogramma per aggiornare un
   * titolo che nessuno sta guardando mentre scorre.
   *
   * Serve perche' senza, i due fogli parlerebbero di «un gioco» generico: una
   * domanda come «come volete giocare?» senza dire *a cosa* e' la stessa
   * ambiguita' che rende inutile meta' dei menu.
   */
  const [scelto, setScelto] = React.useState(0);

  /**
   * I due punteggi della coppia, sommati sulle partite concluse.
   *
   * 🔑 Sono **della coppia**, non di uno contro l'altro, ed è la ragione per cui
   * qui non c'è una classifica: P-03 vieta che il punteggio diventi un verdetto
   * sulla relazione, e una graduatoria fra due persone lo sarebbe. Un totale
   * condiviso non lo è — non c'è nessuno che vince contro nessuno.
   */
  /**
   * 🔑 **Una media, non un totale** (chiesto dall'utente il 2026-09-01).
   *
   * Prima si sommavano i punti e basta. Un totale che sale e non scende mai
   * misura **quanto avete giocato**, non quanto vi capite: dopo venti partite è
   * un numero grande comunque, e non c'è modo di andare peggio. Il rapporto
   * `punti / round giocati` invece si muove nei due versi — è la ragione per cui
   * l'utente l'ha chiesto: *«così il punteggio può essere migliorato o
   * peggiorato nel tempo»*.
   *
   * ⚠️ Il denominatore è `round_totali`, non il numero di partite: una partita
   * di telepatia vale 10 round e una di disegno 5, e sommare partite di lunghezza
   * diversa darebbe una percentuale che dipende da quale gioco si è scelto.
   */
  const [punteggi, setPunteggi] = React.useState<
    Record<string, { punti: number; round: number; partite: number }>
  >({});
  React.useEffect(() => {
    if (!coppiaId) return;
    supabase
      .from('partita')
      .select('gioco, punti, round_totali')
      .eq('coppia_id', coppiaId)
      .eq('stato', 'conclusa')
      .then(({ data }) => {
        const somma: Record<string, { punti: number; round: number; partite: number }> = {};
        for (const r of data ?? []) {
          const v = somma[r.gioco] ?? { punti: 0, round: 0, partite: 0 };
          v.punti += r.punti;
          v.round += r.round_totali;
          v.partite += 1;
          somma[r.gioco] = v;
        }
        setPunteggi(somma);
      });
  }, [coppiaId, foglio]);

  /**
   * ⚠️ La carta e' larga il **74%** dello schermo, non il 100%: le due vicine
   * devono sporgere. Un carosello a pagina piena non si legge come un mazzo —
   * si legge come una schermata che ogni tanto cambia contenuto, e nessuno prova
   * a scorrerla perche' niente dice che ci sia dell'altro.
   */
  const CARTA = Math.min(width * 0.74, 330);
  const SPAZIO = 16;
  const PAGINA = CARTA + SPAZIO;
  const ALTEZZA = Math.max(280, Math.min(height * 0.42, 390));
  /**
   * ⚠️ **L'altezza del carosello la decido io** (2026-08-28).
   *
   * Prima la \`ScrollView\` non aveva altezza e se la prendeva dal contenuto: il
   * risultato sul telefono e' stato un vuoto largo sopra i puntini e tutto il
   * resto — puntini, comandi, riga di stato e barra — schiacciato in fondo, che
   * e' il difetto riferito dall'utente. Con un'altezza esplicita lo spazio si
   * distribuisce dove decido, invece che dove avanza.
   *
   * I 48 punti in piu' della carta non sono aria: sono il posto in cui la carta
   * puo' **ingrandirsi con lo zoom** (1,07 su 390 sono 27 punti) e in cui la
   * sua ombra puo' cadere. Una \`ScrollView\` ritaglia ai propri bordi: senza
   * questo margine, premere «Gioca» taglierebbe la carta sopra e sotto proprio
   * mentre la si sta guardando venire avanti.
   */
  const PISTA = ALTEZZA + 48;

  const x = useSharedValue(0);
  const zoom = useSharedValue(1);
  /**
   * 🔴 **Il gioco al centro si legge dallo scorrimento, non dalla fine
   * dell'inerzia** (2026-09-02, B-44).
   *
   * Prima `scelto` si aggiornava solo in `onMomentumScrollEnd`, che scatta
   * **solo se c'è inerzia**: un trascinamento lento che si ferma sulla carta
   * accanto — lo `snapToInterval` la centra comunque — non lo fa scattare, e
   * `scelto` restava sulla carta di prima. Era il difetto riferito dall'utente
   * in tre forme diverse: «Gioca» apriva il gioco precedente, il foglio portava
   * il nome di un altro gioco, e un gioco con la versione personalizzata
   * entrava diretto perché l'hub credeva fosse la telepatia.
   *
   * Qui l'indice si ricava da **ogni** evento di scorrimento e passa al thread
   * JS **solo quando cambia** (`ultimo`): la separazione fra la `x` a sessanta
   * fotogrammi e lo stato React che scrive un nome resta intatta.
   */
  const ultimo = useSharedValue(0);
  const alloScorrimento = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
    const i = Math.max(0, Math.min(GIOCHI.length - 1, Math.round(e.contentOffset.x / PAGINA)));
    if (i !== ultimo.value) {
      ultimo.value = i;
      runOnJS(setScelto)(i);
    }
  });

  /**
   * Lo **zoom del comando**, la seconda animazione chiesta.
   *
   * Resta su finche' il foglio e' aperto, invece di essere un lampo: cosi' non
   * e' un effetto sul bottone, e' la carta che **viene avanti** perche' il
   * foglio parla di lei. Alla chiusura torna con la molla dello scivolo, meno
   * viva di quella d'entrata — sta tornando al suo posto, non arrivando.
   */
  /**
   * Avvia il gioco scelto, dicendo alla schermata **con che set** si gioca.
   *
   * ⚠️ Il modo viaggia come parametro di rotta, ma decide **solo se la partita
   * va creata**: se una è già viva ci si entra dentro, col suo modo (`apri`, in
   * `lib/partita.ts`). I due telefoni non si accordano su niente — chi arriva
   * secondo si aggancia — quindi il modo deve stare sulla riga della partita.
   */
  function avvia(modo: ModoGioco) {
    const rotta = ROTTE[GIOCHI[scelto].codice];
    if (!rotta) return;
    chiudi();
    router.push({ pathname: rotta, params: { modo } });
  }

  function apri(quale: 'gioca' | 'punteggio') {
    zoom.value = withSpring(1.07, molla.entrata);
    setFoglio(quale);
  }
  function chiudi() {
    zoom.value = withSpring(1, molla.scivolo);
    setFoglio(null);
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="gap-1 px-6 pb-2 pt-2">
          <Text className="font-serif-bold text-3xl text-foreground">{t.hubGiochi.titolo}</Text>
          <Text className="text-sm text-muted-foreground">{t.hubGiochi.sottotitolo}</Text>
        </View>

        <View className="flex-1 justify-center">
          <Riani.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={alloScorrimento}
            scrollEventThrottle={16}
            // `flexGrow: 0` insieme all'altezza: dentro una colonna `flex-1`
            // una ScrollView senza freno si allunga, ed e' cosi' che nasceva
            // il vuoto sopra i puntini.
            style={{ height: PISTA, flexGrow: 0 }}
            // `snapToInterval` e non `pagingEnabled`: la pagina qui non e' larga
            // quanto lo schermo, ed e' esattamente il punto — vedi CARTA.
            snapToInterval={PAGINA}
            disableIntervalMomentum
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - CARTA) / 2,
              gap: SPAZIO,
              alignItems: 'center',
            }}
          >
            {GIOCHI.map((g, i) => (
              <CartaGioco
                key={g.codice}
                gioco={g}
                indice={i}
                x={x}
                pagina={PAGINA}
                larghezza={CARTA}
                altezza={ALTEZZA}
                zoom={zoom}
              />
            ))}
          </Riani.ScrollView>

          <View className="mt-2 flex-row justify-center gap-2">
            {GIOCHI.map((g, i) => (
              <Puntino key={g.codice} indice={i} x={x} pagina={PAGINA} colore={c.accento} />
            ))}
          </View>
        </View>

        {/*
          ⚠️ **Lo spazio in fondo e' `SPAZIO_BARRA + 26`, non `SPAZIO_BARRA`**
          (2026-08-28). Quella costante misura quanto serve perche' il contenuto
          non finisca **sotto** la barra volante — cioe' il minimo per non
          sparire, non la distanza a cui una riga di testo smette di sembrarle
          addosso. Qui sotto i comandi c'e' anche la riga di stato, e con il solo
          minimo le tre cose si toccavano.
          `paddingTop` e `gap-5` fanno la stessa cosa dall'alto: i puntini sono
          l'indicatore del carosello, non l'etichetta dei bottoni, e devono
          stare piu' vicini a cio' che indicano che a cio' che li segue.
        */}
        <View
          className="gap-5 px-6"
          style={{ paddingTop: 18, paddingBottom: SPAZIO_BARRA + 26 }}
        >
          {/*
            ⚠️ Il cartellino sostituisce i **comandi**, non la schermata (D-25 e
            la scelta del 2026-08-13: si blocca cio' che senza due persone non
            esiste, non cio' che senza due persone e' solo meno bello). Chi e'
            ancora solo vede lo stesso i tre giochi e capisce cosa lo aspetta;
            quello che non puo' fare e' avviarli — una partita da soli non e' una
            partita meno bella, non e' niente.
          */}
          {completa ? (
            <View className="flex-row gap-3">
              <BottoneVetro style={{ flex: 1 }} onPress={() => apri('punteggio')}>
                <Sparkles color={c.testo} size={18} />
                <Text>{t.hubGiochi.punteggio}</Text>
              </BottoneVetro>
              {/* ⚠️ Pieno e non vetro tinto: vedi il commento in
                  `components/attesa-partita.tsx`. Sopra lo sfondo chiaro il
                  vetro accento si legge **spento**, ed era il difetto riferito.
                  Qui si perde l'icona — `BottonePieno` prende solo testo — e va
                  bene: fra un'azione riconoscibile e un'icona, in fondo a una
                  schermata con due soli comandi, l'icona è quella che si può
                  perdere. */}
              <BottonePieno
                style={{ flex: 1 }}
                altezza={54}
                testo={t.hubGiochi.gioca}
                onPress={() => {
                  // ⚠️ **Un gioco con una sola sorgente non apre il foglio.**
                  // «Come volete giocare?» con una risposta sola è una domanda
                  // finta: costa un tocco e non decide niente. Dalla telepatia
                  // la versione personalizzata è stata tolta il 2026-09-02
                  // (vedi `CON_PERSONALIZZATA`), quindi lei entra diretta.
                  const codice = GIOCHI[scelto].codice;
                  if (ROTTE[codice] && !CON_PERSONALIZZATA.includes(codice)) {
                    avvia('ufficiale');
                    return;
                  }
                  apri('gioca');
                }}
              />
            </View>
          ) : (
            <ServePartner coppiaId={coppiaId} ricarica={ricarica} />
          )}

          {!PRONTI.includes(GIOCHI[scelto].codice) && (
            <Text className="text-center text-xs text-muted-foreground/80">
              {t.hubGiochi.inArrivo}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* --- «Gioca»: le due sorgenti di domande (D-19, backlog 11-bis) ------ */}
      <Foglio visibile={foglio === 'gioca'} onChiudi={chiudi}>
        <CartaVetro raggio={30} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="gap-1">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.giochi[GIOCHI[scelto].codice]}
                </Text>
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.hubGiochi.modoTitolo}
                </Text>
              </View>
<Scelta
                titolo={t.hubGiochi.ufficiale}
                nota={t.hubGiochi.ufficialeNota}
                modo="ufficiale"
                // ✅ Dal 2026-09-02 la partita ce l'hanno tutti e quattro. Il
                // controllo resta perche' il tipo di `ROTTE` e' `Partial`: un
                // quinto gioco aggiunto al catalogo resterebbe toccabile e
                // **direbbe** che non ha ancora una partita, invece di essere
                // spento senza spiegazione.
                pronto={PRONTI.includes(GIOCHI[scelto].codice)}
                onPress={() => avvia('ufficiale')}
              />
              {CON_PERSONALIZZATA.includes(GIOCHI[scelto].codice) && (
                <Scelta
                  titolo={t.hubGiochi.personalizzata}
                  nota={t.hubGiochi.personalizzataNota}
                  modo="personalizzata"
                  // ✅ Dal 2026-09-02 questa riga **fa** qualcosa (D-19): era
                  // l'unico comando dell'app che prometteva una differenza
                  // inesistente, ed è stato scritto per tre sessioni di fila nel
                  // punto di ripresa.
                  pronto={PRONTI.includes(GIOCHI[scelto].codice)}
                  onPress={() => avvia('personalizzata')}
                />
              )}
              {!PRONTI.includes(GIOCHI[scelto].codice) && (
                <Text className="text-center text-xs text-muted-foreground">
                  {t.hubGiochi.inArrivo}
                </Text>
              )}
              <BottoneVetro altezza={46} onPress={chiudi}>
                <Text>{t.hubGiochi.chiudi}</Text>
              </BottoneVetro>
            </View>
          </SafeAreaView>
        </CartaVetro>
      </Foglio>

      {/* --- «Classifica» ---------------------------------------------------- */}
      <Foglio visibile={foglio === 'punteggio'} onChiudi={chiudi}>
        <CartaVetro raggio={30} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="gap-1">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.giochi[GIOCHI[scelto].codice]}
                </Text>
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.hubGiochi.punteggioTitolo}
                </Text>
              </View>
              {/*
                ✅ **Il nodo di P-03, sciolto il 2026-09-01.** Qui c'era scritto
                che il conteggio si poteva fare ma che **come** formularlo — «un
                gioco o una pagella» — restava da decidere quando le partite
                esistessero davvero. Le partite ora esistono, e la decisione
                dell'utente le scioglie tutte e due:

                - **una media in percentuale**, non una graduatoria di vittorie:
                  non c'e' nessun «chi ha vinto», quindi non c'e' il verdetto fra
                  le due persone che P-03 vieta;
                - **un punteggio solo, quello del gioco da cui si apre**. Il
                  foglio porta gia' in testa il nome del gioco scelto, e mostrare
                  sotto anche il punteggio dell'altro era la contraddizione
                  riferita dall'utente.
              */}
              {(() => {
                const codice = GIOCHI[scelto].codice;
                const etichette = PUNTEGGIO[codice];
                const dato = punteggi[codice];
                // ⚠️ Anche `round === 0`: una partita conclusa con zero round non
                // dovrebbe esistere, ma una divisione per zero stampata a schermo
                // come «NaN%» sarebbe il modo peggiore di scoprirlo.
                if (!etichette || !dato || dato.round === 0)
                  return (
                    <Text className="text-base text-muted-foreground">
                      {t.hubGiochi.punteggioVuoto}
                    </Text>
                  );
                return (
                  <Punteggio
                    nome={etichette.nome()}
                    percentuale={Math.round((dato.punti / dato.round) * 100)}
                    sotto={t.hubGiochi.mediaSu(dato.partite)}
                    nota={etichette.nota()}
                  />
                );
              })()}
              <BottoneVetro altezza={46} onPress={chiudi}>
                <Text>{t.hubGiochi.chiudi}</Text>
              </BottoneVetro>
            </View>
          </SafeAreaView>
        </CartaVetro>
      </Foglio>
    </View>
  );
}

/**
 * I giochi che una partita ce l'hanno davvero, e le loro rotte.
 *
 * ✅ **Dal 2026-09-02 ci sono tutti e quattro.** Il guardiano `PRONTI` resta
 * dov'e': il tipo e' `Partial`, quindi il compilatore non sa che la mappa e'
 * completa, e il giorno che si aggiunge un quinto gioco al catalogo di
 * `lib/giochi.ts` la sua carta dira' «non ha ancora una partita» invece di non
 * rispondere al tocco. Togliere il guardiano perche' oggi non serve vorrebbe
 * dire riscoprirlo con un bottone morto.
 */
const ROTTE: Partial<
  Record<CodiceGioco, '/gioco/disegno' | '/gioco/telepatia' | '/gioco/quiz' | '/gioco/obbligo'>
> = {
  indovina_disegno: '/gioco/disegno',
  telepatia: '/gioco/telepatia',
  quiz_preferenze: '/gioco/quiz',
  obbligo_verita: '/gioco/obbligo',
};
const PRONTI = Object.keys(ROTTE) as CodiceGioco[];

/**
 * I giochi che hanno **due** sorgenti di contenuto (D-19, backlog 11-bis).
 *
 * ⚠️ **La telepatia non c'è, per richiesta dell'utente del 2026-09-02** — *«per
 * il momento rimuovi la versione personalizzata da telepatia»*. Finché non c'è,
 * la sua riga nel foglio «Gioca» non si mostra affatto: una scelta con una sola
 * risposta non è una scelta, e mostrarla disattivata prometterebbe qualcosa che
 * nessuno ha in programma. Il gioco entra diretto dal bottone «Gioca».
 *
 * 🔑 E c'è una ragione tecnica dietro la richiesta, che vale la pena scrivere:
 * negli altri tre il contenuto lo mette **una persona nel proprio turno** — la
 * parola da disegnare, la risposta scritta, le carte di obbligo o verità. La
 * telepatia invece pretende **insiemi di quattro opzioni**, cioè quaranta
 * caselle da riempire prima di cominciare una partita da dieci round. Non è che
 * personalizzarla sia sbagliato: è che costa una schermata di data entry, e
 * nessuno la riempirebbe due volte.
 */
const CON_PERSONALIZZATA: readonly CodiceGioco[] = [
  'quiz_preferenze',
  'obbligo_verita',
  'indovina_disegno',
];

/**
 * Come si chiama il punteggio di ciascun gioco, e cosa conta.
 *
 * ⚠️ **Ogni gioco ha il suo nome, e non e' un vezzo**: «Sintonia» conta le volte
 * in cui avete scelto la stessa cosa, «Intesa» i disegni che l'altro ha
 * indovinato. Sono due cose diverse, e chiamarle con la stessa parola farebbe
 * sembrare confrontabili due numeri che non lo sono.
 *
 * I giochi che una partita non ce l'hanno ancora restano fuori: la loro
 * classifica non e' vuota, **non esiste** — e la schermata lo dice invece di
 * mostrare uno zero che sembrerebbe un risultato.
 *
 * 🔑 **«Coraggio» conta le carte portate a termine dalla coppia**, non da uno
 * dei due (2026-09-02). In «obbligo o verita'» la tentazione di contare i pass
 * *di ciascuno* c'era scritta perfino in D-13: sarebbe stata l'unica voce di
 * questo elenco a mettere i due uno contro l'altro, cioe' il verdetto sulla
 * relazione che P-03 vieta e che D-83 aveva appena tolto dagli altri.
 */
const PUNTEGGIO: Partial<Record<CodiceGioco, { nome: () => string; nota: () => string }>> = {
  telepatia: { nome: () => t.gioco.sintonia, nota: () => t.hubGiochi.notaSintonia },
  indovina_disegno: { nome: () => t.gioco.intesa, nota: () => t.hubGiochi.notaIntesa },
  quiz_preferenze: { nome: () => t.gioco.conoscenza, nota: () => t.hubGiochi.notaConoscenza },
  obbligo_verita: { nome: () => t.gioco.coraggio, nota: () => t.hubGiochi.notaCoraggio },
};

/** Una riga del foglio dei punteggi: la media, e su quante partite. */
function Punteggio({
  nome,
  percentuale,
  sotto,
  nota,
}: {
  nome: string;
  percentuale: number;
  sotto: string;
  nota: string;
}) {
  const { c } = useTema();
  return (
    <View className="flex-row items-center gap-4 rounded-3xl border border-border/60 p-4">
      <View style={{ minWidth: 72 }}>
        <Text className="font-serif-bold text-4xl" style={{ color: c.accento }}>
          {percentuale}%
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-serif text-lg text-foreground">{nome}</Text>
        <Text className="text-sm text-muted-foreground">{nota}</Text>
        {/* Il denominatore sotto, piu' piccolo: senza, «34%» non dice se e'
            la media di due partite o di venti — e le due cose valgono diverso. */}
        <Text className="pt-1 text-xs text-muted-foreground">{sotto}</Text>
      </View>
    </View>
  );
}

/**
 * Il puntino sotto il carosello. Si **allunga** invece di cambiare colore: fra
 * tre elementi la posizione si legge meglio da una lunghezza che da una tinta,
 * e resta leggibile anche a chi i colori li distingue male.
 */
function Puntino({
  indice,
  x,
  pagina,
  colore,
}: {
  indice: number;
  x: SharedValue<number>;
  pagina: number;
  colore: string;
}) {
  const stile = useAnimatedStyle(() => {
    const d = Math.abs(x.value / pagina - indice);
    return {
      width: interpolate(d, [0, 1], [26, 8], Extrapolation.CLAMP),
      opacity: interpolate(d, [0, 1], [1, 0.3], Extrapolation.CLAMP),
    };
  });
  return <Riani.View style={[{ height: 8, borderRadius: 4, backgroundColor: colore }, stile]} />;
}

/**
 * Una delle due sorgenti di domande. Non avvia niente — la partita non esiste
 * ancora — ma **cede sotto il dito** come tutto il resto: un comando che non
 * risponde al tocco si legge come un'app rotta, non come una funzione in arrivo
 * (e' la lezione di `components/ui/premibile.tsx`).
 */
function Scelta({
  titolo,
  nota,
  modo,
  pronto = false,
  onPress,
}: {
  titolo: string;
  nota: string;
  modo: ModoGioco;
  /** C'è davvero una partita dietro? Solo allora il tocco promette qualcosa. */
  pronto?: boolean;
  onPress?: () => void;
}) {
  return (
    <Premibile
      accessibilityLabel={titolo}
      // ⚠️ Il riscontro tattile **solo se accade qualcosa**: il tatto conferma un
      // fatto, e su una riga che non avvia niente prometterebbe una partita.
      aptico={pronto ? 'tocco' : false}
      scala={0.98}
      onPress={pronto ? onPress : () => {}}
    >
      <View
        className="gap-1 rounded-3xl border border-border/60 p-4"
        // `modo` non serve al disegno: sta qui perche' questa riga diventera'
        // l'avvio della partita con quella sorgente, ed e' l'unico punto in cui
        // la scelta e' gia' nelle mani di chi la scrivera'.
        testID={`modo-${modo}`}
      >
        <Text className="font-serif text-lg text-foreground">{titolo}</Text>
        <Text className="text-sm text-muted-foreground">{nota}</Text>
      </View>
    </Premibile>
  );
}
