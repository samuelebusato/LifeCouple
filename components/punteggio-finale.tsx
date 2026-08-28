import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { BottoneVetro } from '@/components/ui/vetro';
import { useTema } from '@/lib/tema';
import { molla, tatto } from '@/lib/movimento';
import { t } from '@/lib/i18n';

const CerchioAnimato = Riani.createAnimatedComponent(Circle);

const LATO = 220;
const RAGGIO = 96;
const CIRCONFERENZA = 2 * Math.PI * RAGGIO;

/**
 * Il punteggio di fine partita, con l'anello che si riempie.
 *
 * ## Perché un anello e non un numero che appare
 *
 * Il numero da solo non dice quanto vale: *3* è tanto o poco? L'anello lo dice
 * senza spiegarlo, perché mostra **la parte su un intero** — e mostra anche
 * quanto mancava, che è l'informazione che fa venire voglia di rigiocare.
 *
 * ⚠️ **Il riempimento parte da fermo e ci mette quasi un secondo**, molto più di
 * ogni altra animazione dell'app. È l'unico punto in cui la lentezza è il punto:
 * qui non si sta dando riscontro a un dito, si sta **consegnando un risultato**,
 * e un risultato che compare istantaneamente non si guarda. È la stessa ragione
 * per cui alla lotteria estraggono le palline una alla volta.
 *
 * ⚠️ E il conteggio non è mai «hai perso». Sono giochi di coppia: il punteggio è
 * **della coppia**, quindi anche zero è un risultato condiviso e la frase che lo
 * accompagna non deve suonare come una pagella. La regola sta in P-03 e qui si
 * vede tutta: *la ricompensa è la crescita, non un numero da esibire.*
 */
export function PunteggioFinale({
  titolo,
  punti,
  totali,
  etichetta,
  onChiudi,
}: {
  titolo: string;
  punti: number;
  /** Il massimo possibile: i round giocati. */
  totali: number;
  /** Come si chiama questo punteggio: «Intesa», «Sintonia». */
  etichetta: string;
  onChiudi: () => void;
}) {
  const { c } = useTema();
  const quota = totali > 0 ? Math.min(1, Math.max(0, punti / totali)) : 0;

  /** 0 = anello vuoto, 1 = pieno quanto la quota. */
  const riempi = useSharedValue(0);
  /** Il numero che sale: è un valore condiviso, non uno stato React. */
  const salita = useSharedValue(0);
  const entrata = useSharedValue(0);
  const [mostrato, setMostrato] = React.useState(0);

  React.useEffect(() => {
    entrata.value = withSpring(1, molla.entrata);
    riempi.value = withDelay(260, withTiming(1, { duration: 900 }));
    salita.value = withDelay(260, withTiming(punti, { duration: 900 }));
    tatto('fatto');
  }, [entrata, riempi, salita, punti]);

  /**
   * ⚠️ Il numero si legge dal valore condiviso con un intervallo, invece di
   * essere animato con `setState` a ogni fotogramma. Sessanta render al secondo
   * per far salire una cifra sono sessanta render sprecati: l'occhio non
   * distingue più di una decina di scatti al secondo su un numero che cambia.
   */
  React.useEffect(() => {
    const id = setInterval(() => setMostrato(Math.round(salita.value)), 60);
    const stop = setTimeout(() => {
      clearInterval(id);
      setMostrato(punti);
    }, 1300);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [salita, punti]);

  const propsAnello = useAnimatedProps(() => ({
    strokeDashoffset: CIRCONFERENZA * (1 - quota * riempi.value),
  }));

  const stileBlocco = useAnimatedStyle(() => ({
    opacity: entrata.value,
    transform: [{ scale: 0.9 + 0.1 * entrata.value }],
  }));

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
        <Riani.View className="flex-1 items-center justify-center gap-6 px-10" style={stileBlocco}>
          <Text className="text-center text-sm uppercase tracking-wide text-muted-foreground">
            {titolo}
          </Text>

          <View style={{ width: LATO, height: LATO, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={LATO} height={LATO} style={{ position: 'absolute' }}>
              {/* La traccia: dice quanto era il massimo, quindi quanto mancava. */}
              <Circle
                cx={LATO / 2}
                cy={LATO / 2}
                r={RAGGIO}
                stroke={c.linea}
                strokeWidth={14}
                fill="none"
              />
              <CerchioAnimato
                cx={LATO / 2}
                cy={LATO / 2}
                r={RAGGIO}
                stroke={c.accento}
                strokeWidth={14}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={CIRCONFERENZA}
                animatedProps={propsAnello}
                // Si parte dall'alto e si gira in senso orario: da sinistra
                // sarebbe geometricamente identico e si leggerebbe come un
                // grafico invece che come un punteggio.
                transform={`rotate(-90 ${LATO / 2} ${LATO / 2})`}
              />
            </Svg>
            <View className="items-center">
              <Text className="font-serif-bold text-6xl text-foreground">{mostrato}</Text>
              <Text className="text-base text-muted-foreground">
                {t.gioco.suTotale(totali)}
              </Text>
            </View>
          </View>

          <View className="items-center gap-1">
            <Text className="font-serif-bold text-2xl" style={{ color: c.accento }}>
              {etichetta}
            </Text>
            <Text className="text-center text-base text-muted-foreground">
              {t.gioco.commento(punti, totali)}
            </Text>
          </View>
        </Riani.View>

        <View className="px-8 pb-8">
          <BottoneVetro variante="accento" onPress={onChiudi}>
            <Text>{t.gioco.finito}</Text>
          </BottoneVetro>
        </View>
      </SafeAreaView>
    </View>
  );
}
