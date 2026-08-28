import * as React from 'react';
import { View } from 'react-native';
import Riani, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { EmblemaGioco } from '@/components/emblemi-giochi';
import type { Gioco } from '@/lib/giochi';
import { t } from '@/lib/i18n';

/**
 * Una carta del carosello dei giochi.
 *
 * ## Perche' non e' di vetro, ed e' una scelta
 *
 * Tutto il resto dell'app galleggia: i comandi sono vetro sopra il contenuto.
 * Qui il contenuto **e' la carta**, e una carta di vetro sopra uno sfondo
 * chiaro non mostra niente di interessante — mostra il bianco che ha sotto.
 * Peggio: tre carte di vetro affiancate diventano tre rettangoli lattiginosi
 * che si distinguono solo per il titolo, ed e' l'opposto di quel che serve a un
 * carosello, dove **si deve capire dove si e' senza leggere**.
 *
 * Quindi tinta piena, un colore per gioco (dai pastelli, vedi `lib/giochi.ts`)
 * e il vetro lasciato ai due comandi sotto — che sopra una carta colorata
 * finalmente hanno qualcosa da lasciar trasparire. Di passaggio si evita anche
 * il vetro-dentro-il-vetro, che sull'iPhone si legge scuro
 * (`components/ui/vetro.tsx`).
 *
 * ## Il movimento: la posizione si **vede**, non si conta
 *
 * Ogni carta legge la stessa `x` dello scorrimento e ne ricava la propria
 * distanza dal centro. Da quella distanza discendono scala, opacita', quota e
 * una **piccola rotazione**: le vicine sono piu' piccole, piu' pallide, piu'
 * basse e appena storte, come carte da gioco posate a ventaglio.
 *
 * ⚠️ La rotazione e' l'unico ingrediente puramente "toon" del movimento, ed e'
 * volutamente minima (5 gradi). A 10 sembrava un mazzo buttato sul tavolo: su
 * un'app di coppia il registro e' *giocoso*, non *sciatto*, e la differenza fra
 * i due sta tutta in quanti gradi si concede.
 *
 * ⚠️ Tutto gira sul thread della UI: la scala e' una funzione della posizione
 * dello scorrimento, non un'animazione lanciata a ogni cambio pagina. Se
 * dipendesse dallo stato React, il ventaglio si muoverebbe **a scatti dopo** il
 * dito invece che sotto il dito.
 */
export function CartaGioco({
  gioco,
  indice,
  x,
  pagina,
  larghezza,
  altezza,
  zoom,
}: {
  gioco: Gioco;
  indice: number;
  /** Lo scorrimento orizzontale in punti, condiviso da tutte le carte. */
  x: SharedValue<number>;
  /** Quanto vale una pagina: larghezza della carta piu' lo spazio fra due. */
  pagina: number;
  larghezza: number;
  altezza: number;
  /**
   * Lo **zoom del comando**: 1 a riposo, poco piu' di 1 quando si preme
   * «Gioca» o «Classifica». Vive nell'hub perche' e' uno solo per tutte e tre
   * le carte — solo quella al centro lo sente, ed e' cio' che lo fa leggere
   * come *questa* carta che viene avanti.
   */
  zoom: SharedValue<number>;
}) {
  const { pastello, codice } = gioco;

  const stile = useAnimatedStyle(() => {
    /** Distanza dal centro in pagine: 0 = sono io la carta scelta. */
    const d = x.value / pagina - indice;
    /** Quanto e' "mia" la carta corrente: 1 al centro, 0 appena mi allontano. */
    const centrata = interpolate(Math.abs(d), [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: interpolate(d, [-1, 0, 1], [0.45, 1, 0.45], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(d, [-1, 0, 1], [18, 0, 18], Extrapolation.CLAMP) },
        // Lo zoom entra moltiplicato e **pesato sulla centratura**: le due
        // laterali non devono ingrandirsi quando si preme un comando che parla
        // solo di quella davanti.
        {
          scale:
            interpolate(d, [-1, 0, 1], [0.86, 1, 0.86], Extrapolation.CLAMP) *
            (1 + (zoom.value - 1) * centrata),
        },
        { rotateZ: `${interpolate(d, [-1, 0, 1], [5, 0, -5], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  return (
    <Riani.View style={[{ width: larghezza, height: altezza }, stile]}>
      <View
        style={{
          flex: 1,
          borderRadius: 36,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#ffffff',
          shadowColor: pastello.testo,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.18,
          shadowRadius: 26,
          elevation: 10,
        }}
      >
        <LinearGradient
          colors={[pastello.fondo, '#ffffff']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* Due bolle di fondo: e' il fondale "toon", e sta **dentro** il
              ritaglio della carta cosi' non sporca lo spazio fra una carta e
              l'altra. Sono decorazione pura, quindi non toccabili. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -40,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: pastello.barra,
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
              backgroundColor: pastello.barra,
              opacity: 0.12,
            }}
          />

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 26 }}>
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                shadowColor: pastello.testo,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.14,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              <EmblemaGioco gioco={codice} size={84} colore={pastello.barra} scuro={pastello.testo} />
            </View>

            <Text
              className="text-center font-serif-bold text-2xl"
              style={{ color: pastello.testo }}
              numberOfLines={2}
            >
              {t.giochi[codice]}
            </Text>
            <Text className="text-center text-sm text-muted-foreground" numberOfLines={4}>
              {t.hubGiochi.descrizioni[codice]}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Riani.View>
  );
}
