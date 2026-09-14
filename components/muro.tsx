// =============================================================================
// muro — la schermata che dice «questo fa parte di Insieme»
//
// 🔑 **Non nasconde: mostra e spiega.** Una scheda che sparisce dalla barra
//    fa pensare a un guasto; una che c'è e dice perché è chiusa vende. È anche
//    la ragione per cui la barra in basso resta identica: chi paga e chi no
//    vedono la stessa app, con porte diverse.
//
// ⚠️ **Questo componente NON decide niente.** Chi lo mostra ha già chiesto al
//    database con `useInsieme()`, che legge `coppia_ha_insieme()` (0041). Qui
//    non si guarda nessuno stato dell'SDK: il threat model §4-ter dice che il
//    telefono è ostile per definizione, e un muro che si apre perché l'app lo
//    ha deciso non è un muro.
//
// 🔑 **E il muro non tocca i dati già dentro.** Mappa e liste si chiudono in
//    LETTURA della schermata, non in lettura del database: chi smette di
//    pagare non perde i suoi luoghi, smette di vedere quella pagina. La
//    differenza conta, ed è scritta anche nella 0042.
// =============================================================================

import * as React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Riani, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { C } from '@/lib/tema';
import { cascata, ciclo, tatto, useMovimentoRidotto } from '@/lib/movimento';
import { t } from '@/lib/i18n';

/**
 * L'emblema che respira, come sul paywall. 🔑 Lo stesso `ciclo.respiro` della
 * creatura: il muro e la vetrina devono sembrare la stessa mano.
 */
function EmblemaCheRespira({ fermo, size = 72 }: { fermo: boolean; size?: number }) {
  const scala = useSharedValue(1);

  React.useEffect(() => {
    if (fermo) {
      scala.value = 1;
      return;
    }
    scala.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: ciclo.respiro / 2 }),
        withTiming(1, { duration: ciclo.respiro / 2 })
      ),
      -1,
      false
    );
  }, [fermo, scala]);

  const stile = useAnimatedStyle(() => ({ transform: [{ scale: scala.value }] }));

  return (
    <Riani.View style={stile}>
      <Emblema size={size} />
    </Riani.View>
  );
}

/**
 * Il muro pieno, per una scheda intera (mappa, liste).
 *
 * @param nota  Che cosa c'è dietro: si dice **che cosa si guadagna**, non che
 *              cosa è vietato. «La mappa dei posti dove siete stati vi aspetta
 *              qui» vende; «funzione non disponibile» respinge.
 */
export function Muro({ nota }: { nota: string }) {
  const router = useRouter();
  const fermo = useMovimentoRidotto();

  return (
    <View className="flex-1 items-center justify-center px-10">
      <Comparsa visibile da="ferma" scala={0.94}>
        <View className="items-center">
          <EmblemaCheRespira fermo={fermo} />
        </View>
      </Comparsa>

      <Comparsa visibile ritardo={fermo ? 0 : cascata(1)}>
        <Text className="mt-5 text-center font-serif-bold text-2xl text-foreground">
          {t.abbonamento.muroTitolo}
        </Text>
      </Comparsa>

      <Comparsa visibile ritardo={fermo ? 0 : cascata(2)}>
        <Text className="mt-2 text-center text-base leading-relaxed text-muted-foreground">
          {nota}
        </Text>
      </Comparsa>

      <Comparsa visibile ritardo={fermo ? 0 : cascata(3)}>
        <Premibile
          onPress={() => {
            tatto('scelta');
            router.push('/paywall');
          }}
          scala={0.98}
        >
          <View
            className="mt-7 items-center justify-center rounded-full px-8 py-3.5"
            style={{ backgroundColor: C.accento }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16 }}>{t.abbonamento.scopri}</Text>
          </View>
        </Premibile>
      </Comparsa>
    </View>
  );
}

/**
 * Il muro **tenue**, per la creatura sulla home.
 *
 * ⚠️ Non è il muro pieno, e la differenza è voluta: la home non è una scheda
 * chiusa, è la casa. Qui si mostra **cosa manca** senza occupare lo schermo —
 * è la scelta dell'utente del 2026-09-14: *«la creatura spenta, con l'invito»*.
 *
 * 🔑 Mostrare la sagoma invece di togliere il riquadro è la leva di vendita più
 * onesta che ci sia: dice cosa si perde senza toglierti niente che avevi.
 */
export function MuroCreatura() {
  const router = useRouter();
  const fermo = useMovimentoRidotto();

  return (
    <Premibile
      onPress={() => {
        tatto('scelta');
        router.push('/paywall');
      }}
      scala={0.99}
    >
      <View className="items-center py-6">
        {/* La sagoma: stesso emblema, quasi spento. ⚠️ Non respira — è il
            punto: la creatura viva respira, questa no, e la differenza si
            legge senza una parola. */}
        <View style={{ opacity: 0.28 }}>
          <EmblemaCheRespira fermo size={96} />
        </View>

        <Comparsa visibile ritardo={fermo ? 0 : cascata(1)}>
          <Text className="mt-4 text-center text-base text-muted-foreground">
            {t.abbonamento.muroCreatura}
          </Text>
        </Comparsa>

        <Comparsa visibile ritardo={fermo ? 0 : cascata(2)}>
          <Text className="mt-2 text-center text-base" style={{ color: C.accento }}>
            {t.abbonamento.scopri}
          </Text>
        </Comparsa>
      </View>
    </Premibile>
  );
}
