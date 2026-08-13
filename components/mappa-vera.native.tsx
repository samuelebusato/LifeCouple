import MapView, { Marker } from 'react-native-maps';
import type { Luogo } from '@/lib/luoghi';

/** Un ristorante con le coordinate del suo posto (0012): disegnabile. */
export type RistoranteSuMappa = {
  id: string;
  titolo: string;
  lat: number;
  lng: number;
};

/**
 * Il componente mappa **solo per il nativo**.
 *
 * Sta in un file `.native.tsx` e non dentro un `if (Platform.OS !== 'web')`
 * perche' Metro risolve gli import **staticamente**: un `require` dentro un
 * ramo mai eseguito finisce lo stesso nel bundle, e `react-native-maps` importa
 * internals di React Native che sul web non esistono — rompendo l'intero
 * bundle, non solo la mappa. Con l'estensione di piattaforma il web non vede
 * mai questo file.
 */
export function MappaVera({
  centro,
  luoghi,
  ristoranti = [],
  onLuogo,
  onRistorante,
  onPuntoNuovo,
}: {
  centro: { latitude: number; longitude: number };
  luoghi: Luogo[];
  ristoranti?: RistoranteSuMappa[];
  onLuogo: (l: Luogo) => void;
  onRistorante?: (r: RistoranteSuMappa) => void;
  onPuntoNuovo: (p: { lat: number; lng: number }) => void;
}) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{ ...centro, latitudeDelta: 0.5, longitudeDelta: 0.5 }}
      // `region` controllata renderebbe la mappa un pendolo che torna sempre al
      // centro; per "vai al risultato cercato" basta la key sul centro (sotto).
      key={`${centro.latitude.toFixed(4)},${centro.longitude.toFixed(4)}`}
      onLongPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onPuntoNuovo({ lat: latitude, lng: longitude });
      }}
    >
      {luoghi.map((l) => (
        <Marker
          key={l.id}
          coordinate={{ latitude: l.lat, longitude: l.lng }}
          title={l.nome}
          pinColor={l.stato === 'visitato' ? '#d64360' : '#816a6f'}
          onPress={() => onLuogo(l)}
          onCalloutPress={() => onLuogo(l)}
        />
      ))}
      {/* I ristoranti in ambra: sulla stessa mappa, un colore diverso dice
          "questo si mangia" prima ancora di leggere. Disegnati DOPO i luoghi:
          dove coincidono, sopra sta il ristorante, che ha piu' da raccontare. */}
      {ristoranti.map((r) => (
        <Marker
          key={`rist-${r.id}`}
          coordinate={{ latitude: r.lat, longitude: r.lng }}
          title={r.titolo}
          pinColor="#d98e2b"
          onPress={() => onRistorante?.(r)}
          onCalloutPress={() => onRistorante?.(r)}
        />
      ))}
    </MapView>
  );
}

/** Sul nativo il componente c'e': la schermata puo' disegnare la mappa. */
export const MAPPA_DISPONIBILE = true;
