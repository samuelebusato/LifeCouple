import * as React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
// ⚠️ Il `Pressable` viene da **gesture-handler**, non da React Native.
// Dentro un `GestureDetector` i due sistemi di tocco convivono male: il gesto
// nativo di RNGH puo' vincere la contesa e i tocchi sulle icone non arrivare
// mai. Il `Pressable` di RNGH parla la stessa lingua del gesto che gli sta
// attorno, quindi tocco e trascinamento si spartiscono il dito invece di
// contenderselo.
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Vetro, GlassView, GlassContainer } from '@/components/ui/vetro';
import { useTastiera } from '@/lib/tastiera';
import { useTema } from '@/lib/tema';

/**
 * La barra delle funzioni, **volante**: una pillola di vetro staccata dai bordi
 * invece della barra di sistema attaccata al fondo.
 *
 * Perche' volante e non ancorata: staccata dal bordo lascia vedere il contenuto
 * che le scorre sotto, ed e' quello che rende il vetro leggibile come vetro. Una
 * barra attaccata al fondo, per quanto sfocata, si legge come un'altra
 * schermata; questa si legge come un oggetto **sopra** la schermata.
 *
 * ## La lente che viaggia (D-40, 2026-08-27)
 *
 * Riferimento: il video portato dall'utente — una barra a pillola dove il
 * segnalino della voce attiva non compare e sparisce, ma **scivola** da una
 * voce all'altra, e mentre viaggia si deforma come una goccia, con la luce che
 * si spezza sui bordi.
 *
 * **Due strade, come per tutto il vetro di questa app:**
 *
 * 1. **iOS 26 → `GlassContainer`.** E' la scatola che fa *fondere fra loro* i
 *    vetri che contiene quando si avvicinano. Pillola e lente sono due
 *    `GlassView` dentro lo stesso contenitore: la deformazione a goccia la fa
 *    il sistema, con la rifrazione vera. Non e' un'imitazione dell'effetto del
 *    video — e' lo stesso effetto.
 * 2. **Altrove → una lastra chiara con riflesso e bordo.** Non un secondo
 *    vetro sfocato: due sfocature a schermo intero costano il doppio e sul
 *    ripiego non aggiungono niente che si veda.
 *
 * In entrambi i casi il movimento e' nostro, e gira **sul thread della UI**
 * (Reanimated + gesture-handler):
 * - **una sola vista che si sposta**, non sei alonate che si accendono a turno.
 *   E' la differenza fra "e' cambiata la selezione" e "la selezione si e'
 *   spostata": la seconda racconta da dove vieni, e su una barra a sei voci
 *   quell'informazione vale piu' di qualunque animazione decorativa;
 * - **la lente si trascina**: il dito la porta dove vuole e al rilascio scatta
 *   sulla voce piu' vicina, che diventa quella attiva. Con `Animated` non era
 *   fattibile — un valore guidato dal driver nativo non si puo' scrivere da
 *   JavaScript, quindi o si animava bene o si trascinava, mai le due cose;
 * - **lo stiramento segue la velocita' del dito**, non una durata fissa. Sul
 *   thread della UI la velocita' e' un dato che arriva col gesto, quindi la
 *   goccia si allunga quanto e' veloce chi la muove. E' cio' che nel video di
 *   riferimento fa sembrare la lente un liquido invece di un rettangolo che
 *   cambia posto.
 *
 * ⚠️ **Niente etichette** (D-40): il riferimento non ne ha, e sotto una lente
 * che si sposta un testo da 10 punti diventa rumore. Il costo e' reale — con
 * sei icone astratte non tutte si spiegano da sole — ed e' accettato
 * consapevolmente; `accessibilityLabel` resta su ogni voce, quindi VoiceOver
 * continua a leggerle per nome.
 *
 * ⚠️ **Sparisce quando si apre la tastiera.** Una barra volante ancorata in
 * basso, a tastiera aperta, finirebbe *sopra i tasti* — cioe' esattamente il
 * difetto che l'utente ha chiesto di evitare. Ancorarla piu' in alto non basta:
 * ruberebbe spazio proprio quando ce n'e' meno.
 */

/** Quanto spazio devono lasciare le schermate in fondo per non finirci sotto. */
export const SPAZIO_BARRA = 108;

/**
 * Dove appoggiare un bottone tondo che deve stare **sopra** la pillola.
 *
 * `SPAZIO_BARRA` da solo non basta e sull'iPhone si vedeva: la pillola arriva a
 * `insets.bottom + 6 + ALTEZZA`, cioe' 106 punti su un telefono con la tacca —
 * un tondo a 100 ci finiva sotto per una manciata di punti. Sta qui e non nelle
 * schermate perche' e' una misura della barra, e le schermate non devono
 * conoscerne l'anatomia.
 */
export const SOPRA_BARRA = SPAZIO_BARRA + 6;

/** Altezza della pillola, e della lente che ci vive dentro. */
const ALTEZZA = 66;
const LENTE = 50;
/** Aria fra il bordo della pillola e la prima voce. */
const MARGINE = 4;
/** Quanto la pillola sta staccata dai bordi dello schermo. */
const LATO = 14;

export function BarraVolante({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { c, vetro } = useTema();
  const { aperta } = useTastiera();

  const voci = state.routes.length;
  /**
   * Il passo di una colonna, **calcolato dallo schermo**: niente `onLayout`,
   * niente misura, niente flex.
   *
   * ⚠️ Terza correzione dello stesso difetto, e stavolta togliendo la causa
   * invece di aggirarla. Prima le voci erano `flexGrow: 1` (finivano ammassate
   * a sinistra a larghezza di contenuto), poi `width: passo` con `passo` da
   * `onLayout` — e sull'iPhone erano **ancora** ammassate, cioe' il numero che
   * arrivava dalla misura non era quello vero.
   *
   * Ora la geometria non dipende piu' da niente che stia sopra o attorno: la
   * pillola sta a `LATO` dai bordi, quindi la sua larghezza e' `schermo -
   * 2·LATO` per definizione, e ogni voce e' un sesto di quello. Le voci sono
   * **posizionate in assoluto**, che e' l'unico modo perche' nessun contenitore
   * — Yoga, `BlurView` o una vista nativa di sistema — possa avere voce in
   * capitolo su dove finiscono.
   *
   * Icone e lente leggono lo stesso `passo`: disallinearsi e' diventato
   * impossibile, non improbabile.
   */
  const { width: schermo } = useWindowDimensions();
  const passo = Math.max(0, (schermo - LATO * 2 - MARGINE * 2) / voci);

  // La posizione della lente e' l'**indice**, non i pixel: cosi' non va
  // rimisurata quando cambia la larghezza, e la conversione avviene nello stile
  // animato, con il passo aggiornato.
  const posizione = useSharedValue(state.index);
  /** Quanto e' stirata la goccia (0 = a riposo). */
  const stiramento = useSharedValue(0);
  /** 1 mentre il dito la sta trascinando: la ingrossa appena. */
  const trascinata = useSharedValue(0);
  /** Da dove e' partito il trascinamento, in indici. */
  const partenza = useSharedValue(0);
  const precedente = React.useRef(state.index);

  /** Porta alla voce `i`. Chiamata dal gesto, quindi passa da `runOnJS`. */
  const vaiA = React.useCallback(
    (i: number) => {
      const route = state.routes[i];
      if (!route || state.index === i) return;
      const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!evento.defaultPrevented) navigation.navigate(route.name);
    },
    [state.routes, state.index, navigation]
  );

  React.useEffect(() => {
    const salto = Math.abs(state.index - precedente.current);
    precedente.current = state.index;

    // Morbida ma non molle: una molla lenta su un gesto che si ripete decine di
    // volte al giorno diventa attesa, non eleganza.
    posizione.value = withSpring(state.index, { damping: 17, stiffness: 190, mass: 0.9 });

    if (salto === 0) return;
    // Piu' lungo il salto, piu' si stira — con un tetto: oltre due voci la
    // deformazione non aumenta piu', o un salto da 1 a 6 diventa una striscia.
    const quanto = Math.min(salto, 2) / 2;
    stiramento.value = withSequence(
      withTiming(quanto, { duration: 130 }),
      withSpring(0, { damping: 13, stiffness: 220 })
    );
  }, [state.index, posizione, stiramento]);

  /**
   * Il trascinamento della lente.
   *
   * `activeOffsetX` a 8 punti: sotto quella soglia il tocco resta delle voci,
   * quindi toccare un'icona continua a funzionare come prima. Sopra, il gesto
   * diventa un trascinamento e la lente segue il dito.
   */
  const trascina = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .onBegin(() => {
          partenza.value = posizione.value;
          trascinata.value = withTiming(1, { duration: 120 });
        })
        .onUpdate((e) => {
          if (passo <= 0) return;
          const grezza = partenza.value + e.translationX / passo;
          posizione.value = Math.min(voci - 1, Math.max(0, grezza));
          // Lo stiramento **dalla velocita' del dito**: e' il dettaglio che
          // rende il movimento liquido invece che meccanico.
          stiramento.value = Math.min(1, Math.abs(e.velocityX) / 2200);
        })
        .onEnd(() => {
          const meta = Math.round(posizione.value);
          posizione.value = withSpring(meta, { damping: 18, stiffness: 220, mass: 0.8 });
          stiramento.value = withSpring(0, { damping: 14, stiffness: 220 });
          trascinata.value = withTiming(0, { duration: 150 });
          runOnJS(vaiA)(meta);
        }),
    [passo, voci, posizione, stiramento, trascinata, partenza, vaiA]
  );

  /**
   * Posizione e deformazione della lente, calcolate sul thread della UI.
   * Si allarga e contemporaneamente si schiaccia: il volume resta costante, ed
   * e' quello che la fa sembrare un liquido invece di un rettangolo che cambia
   * dimensione.
   */
  const stileLente = useAnimatedStyle(() => ({
    transform: [
      { translateX: posizione.value * passo },
      { scaleX: 1 + stiramento.value * 0.34 + trascinata.value * 0.06 },
      { scaleY: 1 - stiramento.value * 0.1 },
    ],
  }));

  // Diagnostico: se le voci tornassero a stare storte, questa riga dice se il
  // problema e' la geometria (numeri sbagliati) o il disegno (numeri giusti,
  // posizionamento ignorato). Senza, si ricomincia a indovinare.
  React.useEffect(() => {
    console.log(`[barra] schermo=${schermo} passo=${passo.toFixed(1)} voci=${voci}`);
  }, [schermo, passo, voci]);

  if (aperta) return null;

  /** L'ingombro della lente: identico sulle due strade. */
  const posaLente = {
    position: 'absolute' as const,
    left: MARGINE + 3,
    top: (ALTEZZA - LENTE) / 2,
    width: Math.max(0, passo - 6),
    height: LENTE,
    borderRadius: LENTE / 2,
  };

  // Alias locali: e' l'unico modo perche' TypeScript **restringa** i tre
  // componenti a non-null dentro il ramo del ternario. Con un booleano di
  // comodo (`const nativo = ...`) la restrizione non si propaga e i tre
  // restano `ComponentType | null`, cioe' non usabili come JSX.
  const Scatola = GlassContainer;
  const Lastra = GlassView;

  return (
    <View
      // `box-none` e non `none`: i tocchi devono passare **attorno** alla
      // pillola (il contenuto sotto resta raggiungibile) ma non attraverso.
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: LATO,
        right: LATO,
        bottom: Math.max(insets.bottom, 10) + 6,
        shadowColor: vetro.ombra,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      <GestureDetector gesture={trascina}>
      <View style={{ width: '100%', height: ALTEZZA }}>
        {Scatola && Lastra ? (
          // --- iOS 26: pillola e lente ------------------------------------
          // ⚠️ `spacing` era 30, ed e' probabilmente cio' che sull'iPhone
          // produceva una **nuvola rosa** invece di una lente. E' la distanza
          // entro cui due vetri cominciano a fondersi: con 30 e la lente
          // *appoggiata* sulla pillola i due si fondevano sempre e del tutto,
          // quindi la tinta si spandeva su tutta la barra e il bordo della
          // lente spariva.
          //
          // Con 8 si fondono solo quando si sfiorano davvero: a riposo la lente
          // e' un oggetto distinto, e il liquido si vede nel passaggio — che e'
          // il comportamento del video di riferimento.
          // 🔑 **Il Liquid Glass e' ATTIVO** — verificato nei log del telefono
          // il 2026-08-27 (`[vetro] ... ATTIVO`). Quando "non si vede" non
          // manca: non ha **niente da rifrangere**. Il vetro mostra cio' che gli
          // passa sotto, e sotto questa barra c'e' quasi sempre bianco. Nel
          // video di riferimento la stessa barra e' spettacolare perche' sta
          // sopra un'interfaccia scura e affollata.
          //
          // Da qui tre scelte:
          // - `clear` invece di `regular`: e' la variante piu' trasparente, la
          //   sola che su fondo chiaro lasci vedere qualcosa;
          // - `spacing` a 18, via di mezzo fra 30 (i due vetri si fondevano
          //   sempre e del tutto: la "nuvola rosa") e 8 (non si fondevano mai,
          //   quindi niente liquido nel passaggio);
          // - **la lente non e' piu' tinta di rosa** (sotto).
          <Scatola spacing={18} style={{ width: '100%', height: ALTEZZA }}>
            <Lastra
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: ALTEZZA / 2,
              }}
              glassEffectStyle="clear"
              colorScheme="light"
              isInteractive
            />
            {passo > 0 && (
              // ⚠️ L'animazione sta su una **vista animata normale**, e il
              // vetro nativo ci sta dentro fermo.
              //
              // Prima il `transform` animato era applicato direttamente al
              // `GlassView`: una vista nativa di sistema non e' tenuta a gestire
              // le trasformazioni del driver nativo, e infatti la lente **non si
              // spostava** — restava dov'era mentre le icone cambiavano. Era
              // l'"ombra rosa che non si posiziona in base all'interfaccia".
              <Riani.View style={[posaLente, stileLente]} pointerEvents="none">
                {/* Nessuna tinta: nel video la capsula attiva e' **neutra**, e
                    a colorarsi e' solo l'icona. Il rosa sul vetro era una mia
                    aggiunta, ed era esattamente cio' che l'utente ha descritto
                    come "l'ombra rosa". */}
                <Lastra
                  style={{ flex: 1, borderRadius: LENTE / 2 }}
                  glassEffectStyle="regular"
                  colorScheme="light"
                />
                {/* Anello di luce **sopra** il vetro di sistema.
                    Il vetro da solo, su una barra a sua volta di vetro, si
                    distingueva appena: il riquadro di selezione deve dire "sei
                    qui" a colpo d'occhio, e un bordo netto e' il modo piu'
                    economico per farlo senza tingerlo di rosa — che era il
                    tentativo precedente, quello dell'"ombra rosa". */}
                <View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: LENTE / 2,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.95)',
                    shadowColor: 'rgba(120,20,80,0.30)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 6,
                  }}
                />
              </Riani.View>
            )}
          </Scatola>
        ) : (
          // --- ovunque altrove: i tre strati + una lastra chiara -------------
          <>
            {/* Meno velo e piu' sfocatura del vetro normale: una barra che
                galleggia sopra una mappa o una foto deve **far vedere** cosa le
                passa sotto, o si legge come plastica — che e' esattamente
                l'appunto ricevuto guardandola sull'iPhone. */}
            <Vetro
              raggio={ALTEZZA / 2}
              intensita={72}
              ombra={false}
              style={{ ...StyleSheet.absoluteFillObject, width: '100%' }}
            >
              <View style={{ width: '100%', height: ALTEZZA }} />
            </Vetro>
            {/* Anello di luce sul bordo della pillola: e' il dettaglio che
                distingue una lastra di vetro da un rettangolo sfocato. Sul
                vetro di sistema non serve — quello il bordo se lo disegna. */}
            <View
              pointerEvents="none"
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: ALTEZZA / 2,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.75)',
              }}
            />
            {passo > 0 && (
              <Riani.View pointerEvents="none" style={[posaLente, stileLente]}>
                {/* La lente del ripiego: un bordo **netto** e due riflessi.
                    Prima era una macchia chiara sfumata — sull'iPhone si
                    leggeva come un alone, non come un oggetto di vetro. Il
                    bordo definito e il controluce in basso sono le due cose che
                    nel video del riferimento fanno sembrare la lente spessa. */}
                <View
                  style={{
                    flex: 1,
                    borderRadius: LENTE / 2,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.48)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.98)',
                  }}
                >
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: c.alone }]} />
                  {/* Luce dall'alto. */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%' }}
                  />
                  {/* Controluce dal basso: e' il bordo che da' spessore. */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%' }}
                  />
                </View>
              </Riani.View>
            )}
          </>
        )}

        {/* --- le voci, sopra a tutto -------------------------------------
            ⚠️ **La geometria sta su una `View` con stile-oggetto**, e il
            `Pressable` ci vive dentro **senza stile**.

            E' la quarta stesura di questo pezzo, e le prime tre sono fallite
            tutte per la stessa causa, scoperta solo il 2026-08-27 guardando uno
            screenshot in cui le sei icone erano **impilate in colonna**: in
            questo progetto uno stile passato come *funzione* a `Pressable`
            (`style={({ pressed }) => …}`) **non viene applicato**. Senza stile
            un contenitore React Native torna a `flexDirection: 'column'` — ed
            era esattamente quello che si vedeva.

            Sintomi corrispondenti, tutti spiegati dalla stessa causa: prima le
            voci ammassate a sinistra a larghezza di contenuto (`flexGrow`
            ignorato), poi ancora ammassate (`width` ignorato), infine in
            colonna (`position: 'absolute'` ignorato). Non era la misura, non
            era il flex, non era la vista nativa: era che lo stile non arrivava.

            Regola per tutto il repo: **niente stili-funzione su `Pressable`**.
            Il riscontro del tocco si fa con `onPressIn`/`onPressOut`. */}
        <View
          pointerEvents="box-none"
          style={{
            ...StyleSheet.absoluteFillObject,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: MARGINE,
          }}
        >
          {state.routes.map((route, i) => {
            const { options } = descriptors[route.key];
            const attiva = state.index === i;
            const etichetta = typeof options.title === 'string' ? options.title : route.name;

            return (
              <View
                key={route.key}
                style={{
                  width: passo,
                  height: LENTE,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={attiva ? { selected: true } : {}}
                  // L'etichetta non e' piu' a schermo (D-40): qui deve restare,
                  // o VoiceOver leggerebbe sei bottoni senza nome.
                  accessibilityLabel={etichetta}
                  hitSlop={10}
                  // Stessa funzione del trascinamento: toccare e trascinare
                  // devono finire nello stesso posto, e due percorsi separati
                  // avrebbero potuto divergere.
                  onPress={() => vaiA(i)}
                >
                  <View
                    style={{
                      width: passo,
                      height: LENTE,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {options.tabBarIcon?.({
                      focused: attiva,
                      color: attiva ? c.accento : c.tenue,
                      size: 23,
                    })}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
      </GestureDetector>
    </View>
  );
}

/**
 * Lo spessore del tratto delle icone della barra. Sta qui e non in `_layout`
 * perche' e' una proprieta' della barra, non delle rotte: l'icona attiva ha un
 * tratto piu' pieno, ed e' cio' che la fa "accendere" dentro la lente senza
 * riempirla di colore — riempire `CalendarDays` produce una macchia, non
 * un'icona.
 */
export const tratto = (attiva: boolean) => (attiva ? 2.4 : 1.9);
