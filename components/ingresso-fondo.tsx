import * as React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Riani, { useAnimatedStyle, useSharedValue, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { FONDO_TESTATA } from '@/lib/tema';

/**
 * **Il fondo dell'ingresso**: il blocco colorato che nel saluto occupa la parte
 * alta dello schermo e poi si **espande fino a riempirlo tutto**.
 *
 * ## Perché è un componente e non due schermate
 *
 * La richiesta era che passando dal benvenuto alla prima pagina di spiegazione
 * *«lo sfondo diventi uniforme tramite un'animazione di riempimento partendo
 * dalla parte già colorata»*. 🔑 **Questo esclude due route**: `expo-router`
 * smonta la schermata che lascia e monta quella che arriva, quindi il colore
 * non è lo *stesso* colore che cresce — è un colore che sparisce e un altro che
 * compare, e il riempimento non parte da niente. Perché il movimento parta
 * davvero da ciò che si sta guardando, benvenuto e spiegazione devono essere
 * **una schermata sola con due fasi**, e il fondo un unico elemento che vive
 * attraverso entrambe. È la ragione per cui `benvenuto.tsx` ha delle fasi
 * interne invece di navigare.
 *
 * ## La collina, e perché sfuma invece di scorrere via
 *
 * Il bordo fra colore e bianco non è una riga dritta: è una **collina**, come
 * nel riferimento. Sta a cavallo del bordo inferiore del blocco, quindi mentre
 * il blocco cresce lei scende con lui.
 *
 * ⚠️ Ma scendere non basta: a riempimento finito il blocco è alto quanto lo
 * schermo e la collina si troverebbe **in fondo, ancora visibile** — una gobba
 * bianca sul colore pieno, cioè l'esatto contrario dello sfondo uniforme che si
 * voleva. Quindi sfuma **prima** di arrivarci (è finita al 60% del percorso),
 * e sotto di lei c'è già colore: la sparizione non lascia buchi.
 *
 * ⚠️ **`withTiming` e non una molla**, contro la regola generale di
 * `lib/movimento.ts`. Lì la regola dice *molle per ciò che si muove*, ma una
 * molla ha un rimbalzo, e un fondo che **rimbalza** dopo aver riempito lo
 * schermo si legge come un errore di disegno, non come peso: non c'è nessun
 * oggetto fisico a cui attribuirlo. È il caso previsto dall'eccezione già
 * scritta lì — le velature usano le durate.
 */
/**
 * Quanta parte dello schermo occupa il colore nel saluto.
 *
 * ⚠️ **Esportata perché la deve conoscere anche il layout**, non solo il fondo.
 * Al primo tentativo la schermata posizionava il testo con `flex`, e il testo
 * finiva **sopra** il colore invece che sotto la curva: `flex` divide lo spazio
 * rimasto dentro l'area sicura, che non è lo schermo, quindi le due frazioni
 * non cadevano nello stesso punto. Chi disegna sopra questo fondo deve misurare
 * con lo stesso righello.
 */
export const FRAZIONE_SALUTO = 0.56;

export function FondoIngresso({ pieno }: { pieno: boolean }) {
  const { height } = useWindowDimensions();
  /** 0 = saluto (blocco in alto), 1 = pieno (tutto lo schermo). */
  const q = useSharedValue(0);

  const ALTA = height * FRAZIONE_SALUTO;
  const COLLINA = 44;

  React.useEffect(() => {
    q.value = withTiming(pieno ? 1 : 0, {
      // Lunga abbastanza da leggersi come un riempimento e non come uno stacco.
      duration: 620,
      // Parte decisa e si posa: `out` sul finale evita che il bordo sembri
      // fermarsi di colpo quando arriva in fondo.
      easing: Easing.inOut(Easing.cubic),
    });
  }, [pieno, q]);

  const stileBlocco = useAnimatedStyle(() => ({
    height: interpolate(q.value, [0, 1], [ALTA, height]),
  }));

  const stileCollina = useAnimatedStyle(() => ({
    // Sparisce entro il 60% del percorso: vedi il commento sopra.
    opacity: interpolate(q.value, [0, 0.6], [1, 0], 'clamp'),
  }));

  return (
    <Riani.View style={[styles.blocco, stileBlocco]} pointerEvents="none">
      <LinearGradient
        colors={FONDO_TESTATA}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* La collina bianca, a cavallo del bordo inferiore del blocco. */}
      <Riani.View style={[styles.collina, { height: COLLINA, bottom: -1 }, stileCollina]}>
        <Svg width="100%" height={COLLINA} viewBox="0 0 100 44" preserveAspectRatio="none">
          {/* Parte dai fianchi in basso e si alza al centro: il bianco "monta"
              sul colore invece di tagliarlo con una riga. */}
          <Path d="M0 44 L0 30 Q50 -6 100 30 L100 44 Z" fill="#ffffff" />
        </Svg>
      </Riani.View>
    </Riani.View>
  );
}

const styles = StyleSheet.create({
  blocco: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
  },
  collina: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
