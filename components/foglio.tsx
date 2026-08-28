import * as React from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Riani, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { NienteSotto } from '@/components/ui/vetro';

/**
 * Il **foglio che sale dal basso**, con la salita animata da noi.
 *
 * ## Perche' non basta `animationType="slide"`
 *
 * Il `Modal` di React Native anima **tutto se stesso**, velatura scura
 * compresa. Su un foglio trasparente il risultato e' che il fondo scuro
 * *scivola su* insieme al pannello invece di comparire dove sta: si legge come
 * un blocco unico che entra da sotto, ed e' cio' che rendeva l'apertura di
 * "nuovo evento" brusca.
 *
 * Qui le due cose sono separate, come in ogni foglio di sistema:
 * - la **velatura sfuma** sul posto (`withTiming`, breve);
 * - il **pannello sale con una molla**, quindi arriva con un peso invece che
 *   con una velocita' costante.
 *
 * Entrambe girano sul thread della UI (Reanimated), quindi la salita non
 * rallenta mentre React monta il contenuto del form — che e' l'altra meta' del
 * motivo per cui sembrava scattosa: un `Modal` che anima e insieme monta
 * quaranta campi fa le due cose sullo stesso thread.
 *
 * ## Smontare dopo, non prima
 *
 * `visibile` a `false` non smonta subito: prima si lascia finire l'uscita e
 * solo alla fine si toglie il `Modal`. Senza, il foglio sparirebbe di colpo e
 * l'animazione di chiusura non si vedrebbe mai.
 */
export function Foglio({
  visibile,
  onChiudi,
  children,
}: {
  visibile: boolean;
  onChiudi: () => void;
  children?: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const [montato, setMontato] = React.useState(visibile);
  const salita = useSharedValue(1);
  const velo = useSharedValue(0);

  React.useEffect(() => {
    if (visibile) {
      setMontato(true);
      velo.value = withTiming(1, { duration: 180 });
      salita.value = withSpring(0, { damping: 24, stiffness: 240, mass: 0.9 });
    } else if (montato) {
      velo.value = withTiming(0, { duration: 160 });
      salita.value = withTiming(1, { duration: 200 }, (finita) => {
        if (finita) runOnJS(setMontato)(false);
      });
    }
  }, [visibile, montato, salita, velo]);

  const stileVelo = useAnimatedStyle(() => ({ opacity: velo.value }));
  const stileFoglio = useAnimatedStyle(() => ({
    transform: [{ translateY: salita.value * height }],
  }));

  return (
    <Modal
      visible={montato}
      transparent
      // Nessuna animazione di sistema: la facciamo noi, e sommarle darebbe due
      // movimenti sfasati.
      animationType="none"
      onRequestClose={onChiudi}
    >
      <Riani.View style={[StyleSheet.absoluteFill, stileVelo]}>
        {/* Toccare fuori chiude: e' quello che ci si aspetta da un foglio, e
            costa una vista. */}
        <Pressable
          onPress={onChiudi}
          accessibilityRole="button"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,8,14,0.4)' }]}
        />
      </Riani.View>
      <Riani.View
        pointerEvents="box-none"
        style={[{ flex: 1, justifyContent: 'flex-end' }, stileFoglio]}
      >
        {/* ⚠️ La velatura scura qui sopra e' proprio cio' che un vetro non deve
            sfocare: dichiararlo **una volta**, qui, evita che ogni schermata se
            lo ricordi — che e' come si e' perso il difetto del 2026-08-27.
            Vedi `ContestoNienteSotto` in `components/ui/vetro.tsx`. */}
        <NienteSotto>{children}</NienteSotto>
      </Riani.View>
    </Modal>
  );
}
