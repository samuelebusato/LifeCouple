import * as React from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from '@/components/ui/text';
import { Vetro } from '@/components/ui/vetro';
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
 * ⚠️ **Sparisce quando si apre la tastiera.** Una barra volante ancorata in
 * basso, a tastiera aperta, finirebbe *sopra i tasti* — cioe' esattamente il
 * difetto che l'utente ha chiesto di evitare. Ancorarla piu' in alto non basta:
 * ruberebbe spazio proprio quando ce n'e' meno.
 */

/** Quanto spazio devono lasciare le schermate in fondo per non finirci sotto. */
export const SPAZIO_BARRA = 108;

export function BarraVolante({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { c, scuro } = useTema();
  const { aperta } = useTastiera();

  if (aperta) return null;

  return (
    <View
      // `box-none` e non `none`: i tocchi devono passare **attorno** alla
      // pillola (il contenuto sotto resta raggiungibile) ma non attraverso.
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, 10) + 6,
      }}
    >
      <Vetro raggio={34} intensita={scuro ? 60 : 55} style={{ width: '100%' }}>
        {/* Larghezza esplicita a OGNI livello (wrapper, vetro, riga) piu'
            `space-between`: la catena di stretch si era gia' rotta due volte
            su due percorsi diversi (BlurView e GlassView) — mai piu' implicita. */}
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 4,
          }}
        >
          {state.routes.map((route, i) => {
            const { options } = descriptors[route.key];
            const attiva = state.index === i;
            const colore = attiva ? c.accento : c.tenue;
            const etichetta =
              typeof options.title === 'string' ? options.title : route.name;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={attiva ? { selected: true } : {}}
                accessibilityLabel={etichetta}
                onPress={() => {
                  const evento = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!attiva && !evento.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                style={({ pressed }) => ({
                  flexGrow: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  alignItems: 'center',
                  gap: 3,
                  paddingVertical: 4,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                {/* L'alone dietro l'icona attiva: e' cio' che segnala "sei qui"
                    senza aggiungere una barretta, che su vetro sporca. */}
                <View
                  style={{
                    width: 40,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: attiva ? c.aloneForte : 'transparent',
                  }}
                >
                  {options.tabBarIcon?.({ focused: attiva, color: colore, size: 20 })}
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    letterSpacing: 0.1,
                    textAlign: 'center',
                    color: colore,
                    fontWeight: attiva ? '700' : '500',
                  }}
                >
                  {etichetta}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Vetro>
    </View>
  );
}
