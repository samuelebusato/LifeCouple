import type { Luogo } from '@/lib/luoghi';

/**
 * Un **luogo dei preferiti** con le coordinate del suo posto.
 *
 * ⚠️ Questo e' il file che **TypeScript** risolve (`mappa-vera.tsx`), mentre
 * Metro sul telefono prende `mappa-vera.native.tsx`. I due tipi vanno tenuti
 * uguali a mano: se divergono, il controllo dei tipi approva codice che sul
 * telefono non regge.
 */
export type RistoranteSuMappa = {
  id: string;
  titolo: string;
  lat: number;
  lng: number;
  /** Il tipo primario di Google: dice che pin disegnare (0016). */
  genere?: string | null;
  /** La riga `luogo` collegata: serve a non disegnare due pin sullo stesso posto. */
  luogoId?: string | null;
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
  eventiPerLuogo?: Record<string, number>;
  eventiPerRistorante?: Record<string, number>;
  spazioSotto?: number;
  onLuogo: (l: Luogo) => void;
  onRistorante?: (r: RistoranteSuMappa) => void;
  onPuntoNuovo: (p: { lat: number; lng: number }) => void;
}) {
  return null;
}

/** Il web lo sa in anticipo: cosi' la schermata mostra l'elenco senza tentare. */
export const MAPPA_DISPONIBILE = false;
