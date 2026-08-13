import type { Luogo } from '@/lib/luoghi';

/** Un ristorante con le coordinate del suo posto (0012): disegnabile. */
export type RistoranteSuMappa = {
  id: string;
  titolo: string;
  lat: number;
  lng: number;
};

/**
 * La versione **web** della mappa: non esiste.
 *
 * `react-native-maps` e' nativo e sul web romperebbe l'intero bundle. Metro
 * sceglie questo file quando compila per il web e `mappa-vera.native.tsx`
 * altrove: la schermata ripiega da sola sull'elenco dei posti, che porta agli
 * stessi eventi.
 */
export function MappaVera(_: {
  centro: { latitude: number; longitude: number };
  luoghi: Luogo[];
  ristoranti?: RistoranteSuMappa[];
  spazioSotto?: number;
  onLuogo: (l: Luogo) => void;
  onRistorante?: (r: RistoranteSuMappa) => void;
  onPuntoNuovo: (p: { lat: number; lng: number }) => void;
}) {
  return null;
}

/** Il web lo sa in anticipo: cosi' la schermata mostra l'elenco senza tentare. */
export const MAPPA_DISPONIBILE = false;
