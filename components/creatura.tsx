import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import Riani, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ciclo, durata, molla, tatto, useMovimentoRidotto } from '@/lib/movimento';
import { t } from '@/lib/i18n';
import type { Stadio } from '@/lib/creatura';

/**
 * **Il disegno della creatura.** Riceve `stadio` e `umore` e non sa altro.
 *
 * ## Il confine di D-09, e perche' e' l'unica cosa da non rompere qui
 *
 * Questo componente non sa cosa siano i punti, non sa che esiste una tabella
 * di soglie, non sa chi ha visitato quale luogo. Sa disegnare una lontra in
 * uno di nove stati e sa muoverla. 🔑 **La mappa dei nove PNG sta qui dentro
 * apposta**: la logica di crescita non deve sapere che esistono dei file,
 * esattamente come nell'agosto 2026 non sapeva che esistevano dei cerchi.
 *
 * E' cio' che ha permesso il 2026-09-06 di sostituire le forme geometriche con
 * una lontra generata senza toccare una riga di logica, e sara' cio' che
 * permettera' di passare a Lottie senza toccarla di nuovo.
 *
 * ⚠️ **`require` deve essere statico.** Metro non risolve
 * `require(\`…-${stadio}-${umore}.png\`)`: la mappa esplicita di nove voci non
 * e' verbosita', e' l'unico modo che funziona.
 *
 * ## I quattro strati, e perche' sono annidati in quest'ordine
 *
 * Ogni strato ha un **perno diverso**, e due trasformazioni con perni diversi
 * non stanno sulla stessa vista. Da fuori a dentro:
 *
 * 1. **scodinzolio** — rotazione, perno **in alto** (D-111)
 * 2. **respiro** — scala verticale, perno **in basso** (D-103)
 * 3. **scatto** — rimbalzo della festa, del tocco e del cambio di stadio
 * 4. **umore** — due immagini sovrapposte che si incrociano in dissolvenza
 *
 * 🔑 Il perno dello scodinzolio e' il dettaglio che fa tutto il lavoro: ancorata
 * **in alto**, la rotazione lascia ferma la testa e fa descrivere alla parte
 * piu' lontana dal perno — la coda — l'arco piu' ampio. Non e' una coda
 * animata: e' una rotazione scelta perche' a muoversi di piu' sia lei. Ancorarla
 * in basso darebbe la stessa quantita' di movimento e sembrerebbe un dondolio.
 *
 * ## La dissolvenza (D-113)
 *
 * Le tre immagini di uno stadio si sovrappongono **oltre il 99%** — misurato
 * con `tools/confronta-stadi.py` — quindi un incrocio in dissolvenza non mostra
 * fantasmi. ⚠️ **Se un domani un'immagine venisse rigenerata fuori taglia**, la
 * sovrapposizione scenderebbe e la dissolvenza comincerebbe a mostrare la
 * differenza: la strada di ricambio e' la schiacciata di D-112, ed e' scritta
 * in `docs/mascotte.md` §9.
 */

/** ⚠️ Statica per forza: vedi la nota su Metro qui sopra. */
const IMMAGINI = {
  1: {
    quiete: require('../assets/creatura/creatura-1-quiete.png'),
    festa: require('../assets/creatura/creatura-1-festa.png'),
    sonno: require('../assets/creatura/creatura-1-sonno.png'),
  },
  2: {
    quiete: require('../assets/creatura/creatura-2-quiete.png'),
    festa: require('../assets/creatura/creatura-2-festa.png'),
    sonno: require('../assets/creatura/creatura-2-sonno.png'),
  },
  3: {
    quiete: require('../assets/creatura/creatura-3-quiete.png'),
    festa: require('../assets/creatura/creatura-3-festa.png'),
    sonno: require('../assets/creatura/creatura-3-sonno.png'),
  },
} as const;

export type Umore = 'quiete' | 'festa' | 'sonno';

/**
 * **I tre ritratti a riposo**, per chi deve mostrare Philippe senza animarlo —
 * oggi solo la pagina d'ingresso che lo presenta.
 *
 * ⚠️ Esiste per non avere **un secondo posto che conosce i nomi dei file**. La
 * mappa `IMMAGINI` è l'unica cosa in tutto il progetto che sa che la creatura è
 * fatta di PNG (D-09): duplicare tre `require` altrove significherebbe che
 * rinominare un asset rompe qualcosa in un file che nessuno pensa di guardare.
 */
export const RITRATTI = {
  1: IMMAGINI[1].quiete,
  2: IMMAGINI[2].quiete,
  3: IMMAGINI[3].quiete,
} as const;

/** Tre tocchi entro questa finestra fanno una carezza (D-113). */
const CAREZZA_TOCCHI = 3;
const CAREZZA_FINESTRA = 1500;

export function Creatura({
  stadio,
  umore,
  attiva,
  onCarezza,
  onEvoluzioneFinita,
  size = 180,
}: {
  stadio: Stadio;
  umore: Umore;
  /**
   * La schermata e' davanti agli occhi?
   *
   * 🔴 **Senza questo il respiro non si ferma mai.** Le schede restano montate
   * passando da un tab all'altro — e' voluto, e sta scritto nel commento di
   * `app/(tabs)/home.tsx` — quindi un'animazione infinita continuerebbe a
   * girare sul thread UI mentre si guarda la mappa. E' l'unico motivo per cui
   * il costo di un respiro perpetuo e' accettabile.
   */
  attiva: boolean;
  /** Tre tocchi ravvicinati. Chi la riceve decide cosa farne (D-113). */
  onCarezza?: () => void;
  /** Il momento del cambio di stadio e' finito: si puo' segnare come visto. */
  onEvoluzioneFinita?: () => void;
  size?: number;
}) {
  const ridotto = useMovimentoRidotto();

  /** 0 = riposo, 1 = fine espirazione. */
  const respiro = useSharedValue(0);
  /** Gradi di rotazione dello scodinzolio. */
  const coda = useSharedValue(0);
  /** Scala del rimbalzo (festa, tocco, evoluzione). */
  const scatto = useSharedValue(1);
  /** Velatura dell'evoluzione: la creatura si ritira e torna. */
  const velo = useSharedValue(1);
  /** 0 = si vede `sotto`, 1 = si vede `sopra`. */
  const incrocio = useSharedValue(0);

  /**
   * Le due immagini della dissolvenza.
   *
   * ⚠️ `sotto` e' cio' che si vede a riposo; `sopra` esiste solo durante
   * l'incrocio. A dissolvenza finita `sopra` diventa `sotto` e si azzera: due
   * viste sempre montate a opacita' piena sprecherebbero un livello, e una
   * `sopra` dimenticata a meta' opacita' sarebbe un fantasma permanente.
   */
  const [sotto, setSotto] = React.useState<{ s: Stadio; u: Umore }>({ s: stadio, u: umore });
  const [sopra, setSopra] = React.useState<{ s: Stadio; u: Umore } | null>(null);

  const tocchi = React.useRef<number[]>([]);
  const carezzaFredda = React.useRef(false);

  /** ---------------------------------------------------------------- respiro */
  React.useEffect(() => {
    cancelAnimation(respiro);
    if (!attiva || ridotto) {
      respiro.value = 0;
      return;
    }
    respiro.value = withRepeat(
      withTiming(1, { duration: ciclo.respiro / 2, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => cancelAnimation(respiro);
  }, [attiva, ridotto, respiro]);

  /** ------------------------------------------------- cambio d'umore e stadio */
  const chiudiIncrocio = React.useCallback(
    (s: Stadio, u: Umore) => {
      setSotto({ s, u });
      setSopra(null);
      incrocio.value = 0;
    },
    [incrocio]
  );

  React.useEffect(() => {
    if (sotto.s === stadio && sotto.u === umore) return;

    const cresciuta = stadio > sotto.s;

    if (ridotto) {
      // ⚠️ L'informazione non si perde insieme al movimento: l'immagine cambia
      // comunque, solo senza il momento intorno.
      chiudiIncrocio(stadio, umore);
      if (cresciuta && onEvoluzioneFinita) onEvoluzioneFinita();
      return;
    }

    setSopra({ s: stadio, u: umore });

    if (cresciuta) {
      /**
       * 🔴 **Il cambio di stadio non e' un incrocio: e' un momento.** Succede
       * due volte in tutta la vita della creatura (D-96), e `docs/mascotte.md`
       * §2 chiede che sia inequivocabile. Una dissolvenza di 220 ms sarebbe
       * indistinguibile da un cambio d'umore, cioe' da qualcosa che succede
       * dieci volte al giorno.
       *
       * Si ritira, si scambia, e torna con una sovraelongazione.
       */
      tatto('fatto');
      velo.value = withSequence(
        withTiming(0.25, { duration: 260, easing: Easing.in(Easing.quad) }),
        withDelay(40, withTiming(1, { duration: 220 }))
      );
      scatto.value = withSequence(
        withTiming(0.82, { duration: 260, easing: Easing.in(Easing.quad) }),
        withSpring(1, { damping: 9, stiffness: 150, mass: 0.9 })
      );
      incrocio.value = withDelay(
        260,
        withTiming(1, { duration: 1 }, (finita) => {
          if (finita) {
            runOnJS(chiudiIncrocio)(stadio, umore);
            if (onEvoluzioneFinita) runOnJS(onEvoluzioneFinita)();
          }
        })
      );
      return;
    }

    // Cambio d'umore: la dissolvenza porta l'immagine, il rimbalzo il
    // significato. Non erano alternative (D-113).
    incrocio.value = withTiming(1, { duration: durata.media }, (finita) => {
      if (finita) runOnJS(chiudiIncrocio)(stadio, umore);
    });

    if (umore === 'festa') {
      tatto('fatto');
      scatto.value = withSequence(
        withSpring(1.1, molla.entrata),
        withSpring(1, molla.scivolo)
      );
      // Perno in alto: la testa resta ferma, la coda descrive l'arco (D-111).
      coda.value = withSequence(
        withTiming(5, { duration: ciclo.scodinzolio * 0.2 }),
        withTiming(-5, { duration: ciclo.scodinzolio * 0.25 }),
        withTiming(4, { duration: ciclo.scodinzolio * 0.2 }),
        withTiming(-3, { duration: ciclo.scodinzolio * 0.2 }),
        withTiming(0, { duration: ciclo.scodinzolio * 0.15 })
      );
    }
  }, [
    stadio,
    umore,
    sotto,
    ridotto,
    chiudiIncrocio,
    onEvoluzioneFinita,
    incrocio,
    scatto,
    coda,
    velo,
  ]);

  /** ------------------------------------------------------------------ tocco */
  const premi = React.useCallback(() => {
    const ora = Date.now();
    tocchi.current = tocchi.current.filter((v) => ora - v < CAREZZA_FINESTRA);
    tocchi.current.push(ora);

    if (tocchi.current.length >= CAREZZA_TOCCHI && !carezzaFredda.current) {
      tocchi.current = [];
      carezzaFredda.current = true;
      // ⚠️ La pausa non e' un dettaglio: senza, tenendo premuto la festa si
      // concatenerebbe all'infinito e smetterebbe di essere un momento.
      setTimeout(() => {
        carezzaFredda.current = false;
      }, 2600);
      if (onCarezza) onCarezza();
      return;
    }

    if (ridotto) return;
    tatto('tocco');
    scatto.value = withSequence(
      withTiming(0.94, { duration: 90 }),
      withSpring(1, molla.tocco)
    );
  }, [onCarezza, ridotto, scatto]);

  /** ------------------------------------------------------------------ stili */
  const stileCoda = useAnimatedStyle(() => ({
    transform: [{ rotate: `${coda.value}deg` }],
  }));
  const stileRespiro = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + respiro.value * 0.018 }],
  }));
  const stileScatto = useAnimatedStyle(() => ({
    opacity: velo.value,
    transform: [{ scale: scatto.value }],
  }));
  const stileSopra = useAnimatedStyle(() => ({ opacity: incrocio.value }));

  const immagine = { width: size, height: size, resizeMode: 'contain' as const };

  return (
    <Pressable
      onPress={premi}
      accessibilityRole="image"
      accessibilityLabel={etichetta(stadio, umore)}
      hitSlop={8}
    >
      {/* 1. scodinzolio — perno in ALTO */}
      <Riani.View style={[{ transformOrigin: 'top center' }, stileCoda]}>
        {/* 2. respiro — perno in BASSO */}
        <Riani.View style={[{ transformOrigin: 'bottom center' }, stileRespiro]}>
          {/* 3. scatto e velo */}
          <Riani.View style={[{ transformOrigin: 'bottom center' }, stileScatto]}>
            <View style={{ width: size, height: size }}>
              <Image source={IMMAGINI[sotto.s][sotto.u]} style={immagine} />
              {sopra && (
                <Riani.View style={[{ position: 'absolute', inset: 0 }, stileSopra]}>
                  <Image source={IMMAGINI[sopra.s][sopra.u]} style={immagine} />
                </Riani.View>
              )}
            </View>
          </Riani.View>
        </Riani.View>
      </Riani.View>
    </Pressable>
  );
}

/**
 * L'etichetta per chi non vede il disegno.
 *
 * ⚠️ Descrive **cosa sta facendo**, non «immagine di una lontra»: chi usa
 * VoiceOver deve poter sapere che Philippe ha festeggiato, che e' cresciuto o
 * che sta dormendo, perche' e' la stessa informazione che l'immagine da' a chi
 * la guarda.
 *
 * ⚠️ E le stringhe stanno in `lib/i18n.ts` come tutte le altre: un'etichetta
 * di accessibilita' scritta in italiano dentro un componente e' una frase che
 * a un utente inglese arriva in italiano — ed e' l'unico testo dell'app che
 * nessuno si accorgerebbe mai di aver dimenticato di tradurre, perche' non si
 * vede.
 */
function etichetta(stadio: Stadio, umore: Umore) {
  return t.creatura.descrizione(t.creatura.eta[stadio], t.creatura.stato[umore]);
}
