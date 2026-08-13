import type { Luogo } from '@/lib/luoghi';

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
  onLuogo: (l: Luogo) => void;
  onPuntoNuovo: (p: { lat: number; lng: number }) => void;
}) {
  return null;
}

/** Il web lo sa in anticipo: cosi' la schermata mostra l'elenco senza tentare. */
export const MAPPA_DISPONIBILE = false;
