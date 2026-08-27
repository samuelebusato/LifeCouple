import * as React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Riani, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { molla, tatto } from '@/lib/movimento';

/**
 * Il **riscontro del tocco**: la superficie cede sotto il dito e torna su.
 *
 * ## Perche' e' un componente e non tre righe copiate
 *
 * Prima di oggi i comandi di vetro non rispondevano affatto al tocco: l'unica
 * differenza fra premuto e non premuto era il nulla, e l'unica variazione di
 * opacita' in tutta la libreria segnalava *disabilitato*, non *premuto*. Su
 * un'interfaccia fatta di vetro — che per definizione non ha un rilievo da
 * schiacciare — questo si legge come "il tocco non e' arrivato", e la reazione
 * di chi la usa e' toccare **una seconda volta**.
 *
 * Sta qui in un file solo perche' e' l'unico modo perche' i comandi cedano
 * tutti **della stessa quantita' e con la stessa molla**. Tre copie della
 * stessa idea divergono al primo ritocco, e allora la barra cede piu' del
 * bottone che sta accanto, per nessun motivo che qualcuno abbia deciso.
 *
 * ⚠️ **Stile-oggetto e non funzione.** In questo progetto uno stile passato a
 * `Pressable` come funzione (`style={({pressed}) => …}`) non viene applicato —
 * la storia sta in `components/barra-volante.tsx`, e i suoi effetti in
 * `components/ui/vetro.tsx`. Quella e' anche la ragione per cui la scala non
 * puo' venire dallo stato `pressed` di `Pressable` e passa da Reanimated: qui
 * il vantaggio e' doppio, perche' il movimento gira sul thread della UI e non
 * si inceppa mentre React monta cio' che il tocco ha aperto.
 *
 * ## Il tatto arriva sull'azione, non sul contatto
 *
 * La vibrazione sta su `onPress` e non su `onPressIn`. La differenza conta in
 * un elenco che si scorre: sfiorando una scheda per iniziare a scorrere,
 * `onPressIn` scatta comunque — l'app vibrerebbe a ogni scorrimento, per
 * un'azione che non e' avvenuta. La regola e' che **il tatto conferma un
 * fatto**; la scala, che invece e' solo riscontro del contatto, resta su
 * `onPressIn`, dove dev'essere per sembrare immediata.
 */
export function Premibile({
  children,
  onPress,
  onLongPress,
  disabled,
  /** Quanto cede: 1 = per niente. Piu' l'oggetto e' grande, meno deve cedere. */
  scala = 0.96,
  /** Il riscontro tattile, o `false` per zittirlo. Vedi `lib/movimento.ts`. */
  aptico = 'tocco',
  style,
  hitSlop,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scala?: number;
  aptico?: 'tocco' | 'scelta' | 'fatto' | false;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
}) {
  const giu = useSharedValue(0);

  const stile = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - giu.value * (1 - scala) }],
  }));

  return (
    <Riani.View style={[stile, style]}>
      <Pressable
        onPress={
          onPress
            ? () => {
                if (aptico) tatto(aptico);
                onPress();
              }
            : undefined
        }
        onLongPress={onLongPress}
        disabled={disabled}
        // Il cedimento non si accende sui comandi spenti: una superficie che si
        // muove promette che qualcosa succedera'.
        onPressIn={() => {
          if (!disabled) giu.value = withSpring(1, molla.tocco);
        }}
        onPressOut={() => {
          giu.value = withSpring(0, molla.tocco);
        }}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
      >
        {children}
      </Pressable>
    </Riani.View>
  );
}
