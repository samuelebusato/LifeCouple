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
  /**
   * ⚠️ Dichiarate anche qui, dove non servono: questa è la variante **senza
   * mappa** e non disegna pin. Ma è **questo** file che TypeScript usa per
   * controllare le chiamate — il `.native.tsx` lo vede solo il bundler — quindi
   * una prop che manca qui è un errore di compilazione anche se il codice che
   * la usa è corretto. Le due firme vanno tenute allineate (D-72).
   */
  programmatiLuogo?: Record<string, boolean>;
  programmatiRistorante?: Record<string, boolean>;
  spazioSotto?: number;
  /** Le due posizioni di adesso (D-100). Qui non si disegnano: non c'è mappa. */
  noi?: {
    mia: { lat: number; lon: number } | null;
    altro: { lat: number; lon: number } | null;
    distanza: string | null;
  } | null;
  onLuogo: (l: Luogo) => void;
  onRistorante?: (r: RistoranteSuMappa) => void;
}) {
  return null;
}

/** Il web lo sa in anticipo: cosi' la schermata mostra l'elenco senza tentare. */
export const MAPPA_DISPONIBILE = false;
