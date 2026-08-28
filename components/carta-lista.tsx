import * as React from 'react';
import { View } from 'react-native';
import Riani, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { tintaDi, type Lista } from '@/lib/liste';
import { pastelli } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * Una carta del carosello delle liste — e, nell'ultima posizione, la carta «+»
 * che ne fa nascere una nuova.
 *
 * ## Perché è quasi identica a `carta-gioco.tsx` invece di essere lo stesso file
 *
 * Il movimento è lo stesso (distanza dal centro → scala, opacità, quota,
 * rotazione) e la scelta di fondo pure: **tinta piena e non vetro**, perché un
 * carosello si legge dal colore prima che dal titolo, e tre rettangoli di vetro
 * su fondo chiaro sono tre rettangoli uguali.
 *
 * ⚠️ Il contenuto però non è lo stesso, e non lo sarà mai: un gioco ha un
 * emblema disegnato e una descrizione scritta da noi, una lista ha un **nome
 * scritto dall'utente** e un conteggio che cambia da solo. Fondere i due in un
 * componente con sei parametri opzionali avrebbe prodotto la cosa che questo
 * progetto evita da sempre — una funzione che serve due padroni e finisce per
 * servirne male uno.
 *
 * Ciò che invece **è** condiviso e va tenuto tale sono i numeri del movimento:
 * se un giorno cambiano lì, cambiano anche qui, e il modo di accorgersene è che
 * i due caroselli si muovano diversamente.
 */
export function CartaLista({
  lista,
  indice,
  x,
  pagina,
  larghezza,
  altezza,
  zoom,
}: {
  /** `null` = è la carta «+», l'ultima del mazzo. */
  lista: Lista | null;
  indice: number;
  x: SharedValue<number>;
  pagina: number;
  larghezza: number;
  altezza: number;
  zoom: SharedValue<number>;
}) {
  const stile = useAnimatedStyle(() => {
    const d = x.value / pagina - indice;
    const centrata = interpolate(Math.abs(d), [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: interpolate(d, [-1, 0, 1], [0.45, 1, 0.45], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(d, [-1, 0, 1], [18, 0, 18], Extrapolation.CLAMP) },
        {
          scale:
            interpolate(d, [-1, 0, 1], [0.86, 1, 0.86], Extrapolation.CLAMP) *
            (1 + (zoom.value - 1) * centrata),
        },
        { rotateZ: `${interpolate(d, [-1, 0, 1], [5, 0, -5], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  /**
   * ⚠️ La carta «+» è **grigia di proposito**, e non è "disabilitata".
   *
   * B-22 ha insegnato che in quest'app lo sbiadito significa *spento*: qui
   * però la carta non è un comando — non si tocca, come nessuna carta di
   * nessuno dei due caroselli — e il grigio dice un'altra cosa, cioè *qui non
   * c'è ancora niente*. Per non ricadere nell'equivoco il segno «+» resta a
   * **pieno contrasto** e il bordo è tratteggiato: un vuoto da riempire si
   * disegna come un contorno, non come un pieno pallido.
   */
  const tinta = lista ? tintaDi(lista) : pastelli.romantico;
  const nuova = lista === null;

  return (
    <Riani.View style={[{ width: larghezza, height: altezza }, stile]}>
      <View
        style={{
          flex: 1,
          borderRadius: 36,
          overflow: 'hidden',
          borderWidth: nuova ? 2 : 1,
          borderColor: nuova ? tinta.barra : '#ffffff',
          borderStyle: nuova ? 'dashed' : 'solid',
          shadowColor: tinta.testo,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: nuova ? 0.08 : 0.18,
          shadowRadius: 26,
          elevation: nuova ? 4 : 10,
        }}
      >
        <LinearGradient
          colors={nuova ? ['#ffffff', '#ffffff'] : [tinta.fondo, '#ffffff']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1 }}
        >
          {!nuova && (
            <>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: -40,
                  top: -30,
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: tinta.barra,
                  opacity: 0.18,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: -50,
                  bottom: -60,
                  width: 190,
                  height: 190,
                  borderRadius: 95,
                  backgroundColor: tinta.barra,
                  opacity: 0.12,
                }}
              />
            </>
          )}

          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              padding: 26,
            }}
          >
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                shadowColor: tinta.testo,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: nuova ? 0.08 : 0.14,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              {nuova ? (
                <Plus color={tinta.barra} size={64} strokeWidth={2.2} />
              ) : (
                /**
                 * Il **numero di voci** al posto dell'emblema.
                 *
                 * Una lista non ha un disegno suo: quello che la distingue da
                 * un'altra è il nome, e quello che dice se vale la pena aprirla
                 * è **quanto c'è dentro**. Un'icona generica di elenco su tutte
                 * le carte sarebbe stata la stessa icona quattro volte, cioè
                 * zero informazione nel punto in cui l'occhio arriva per primo.
                 */
                <View style={{ alignItems: 'center' }}>
                  <Text className="font-serif-bold text-5xl" style={{ color: tinta.testo }}>
                    {lista.voci}
                  </Text>
                  <Text className="text-xs" style={{ color: tinta.testo, opacity: 0.7 }}>
                    {lista.voci === 1 ? t.liste.voce : t.liste.vociPlurale}
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-center font-serif-bold text-2xl"
              style={{ color: nuova ? tinta.testo : tinta.testo }}
              numberOfLines={2}
            >
              {nuova ? t.liste.nuovaCarta : lista.nome}
            </Text>

            <Text className="text-center text-sm text-muted-foreground" numberOfLines={3}>
              {nuova
                ? t.liste.nuovaCartaNota
                : lista.voci === 0
                  ? t.liste.vuota
                  : t.liste.avanzamento(lista.fatte, lista.voci)}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Riani.View>
  );
}
