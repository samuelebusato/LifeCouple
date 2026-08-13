import MapView, { Marker } from 'react-native-maps';
import type { Luogo } from '@/lib/luoghi';

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
  onLuogo,
  onPuntoNuovo,
}: {
  centro: { latitude: number; longitude: number };
  luoghi: Luogo[];
  onLuogo: (l: Luogo) => void;
  onPuntoNuovo: (p: { lat: number; lng: number }) => void;
}) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{ ...centro, latitudeDelta: 0.5, longitudeDelta: 0.5 }}
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
          pinColor={l.stato === 'visitato' ? '#bf5333' : '#9a8b7d'}
          onPress={() => onLuogo(l)}
          onCalloutPress={() => onLuogo(l)}
        />
      ))}
    </MapView>
  );
}

/** Sul nativo il componente c'e': la schermata puo' disegnare la mappa. */
export const MAPPA_DISPONIBILE = true;
