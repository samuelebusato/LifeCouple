import * as React from 'react';
import { lingua, t } from '@/lib/i18n';

/**
 * Ricerca di luoghi mentre si digita — **Google Places API (New)**.
 * Deciso dall'utente il 2026-08-13 (sera), al posto di Photon/OSM: i risultati
 * di Google sono quelli che la gente si aspetta, e le **foto dei ristoranti**
 * diventano le copertine in app.
 *
 * ## La chiave
 *
 * `EXPO_PUBLIC_GOOGLE_PLACES_KEY` nel `.env` (l'utente la creera' su Google
 * Cloud: Places API (New) abilitata + fatturazione). Finche' manca, la ricerca
 * **dice che manca** invece di fingere di non trovare niente: un campo muto
 * sembra un bug, un campo che spiega e' uno stato.
 *
 * ## Cosa esce da qui, e cosa no
 *
 * Esce **solo il testo digitato** e la lingua — niente coordinate, niente
 * `locationBias`: e' la stessa scelta fatta con OSM (D-05), e resta valida col
 * fornitore nuovo. Non aggiungere la posizione senza una decisione esplicita.
 *
 * ## Attribuzione
 *
 * Mostrare risultati Places fuori da una mappa Google richiede l'attribuzione
 * "Google": sta in `ATTRIBUZIONE`, sotto l'elenco dei suggerimenti.
 */

const CHIAVE = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

export const ATTRIBUZIONE = 'Google';

export type Trovato = {
  /** Chiave stabile per le liste. */
  chiave: string;
  nome: string;
  /** Indirizzo formattato: quello che distingue due omonimi. */
  dettaglio: string;
  lat: number;
  lng: number;
  /** L'id Google del posto: sui ristoranti si salva (0013). */
  placeId?: string;
  /** Nome-risorsa della prima foto Google: diventa la copertina. */
  fotoNome?: string;
};

type PostoGoogle = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: { name?: string }[];
};

/**
 * Una ricerca singola. `soloRistoranti` restringe ai ristoranti: e' il modo in
 * cui i preferiti impediscono di inventare posti che non esistono.
 */
export async function cercaLuoghi(
  query: string,
  segnale?: AbortSignal,
  soloRistoranti = false
): Promise<Trovato[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  if (!CHIAVE) throw new Error(t.mappa.mancaChiave);

  const r = await fetch(ENDPOINT, {
    method: 'POST',
    signal: segnale,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': CHIAVE,
      // Solo i campi che si usano: il conto di Google si fa per campo chiesto.
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.photos',
    },
    body: JSON.stringify({
      textQuery: q,
      languageCode: lingua,
      pageSize: 8,
      ...(soloRistoranti ? { includedType: 'restaurant' } : {}),
    }),
  });
  if (!r.ok) throw new Error(`ricerca non riuscita (${r.status})`);

  const dati = (await r.json()) as { places?: PostoGoogle[] };
  const fuori: Trovato[] = [];
  for (const p of dati.places ?? []) {
    const nome = p.displayName?.text;
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (!nome || lat === undefined || lng === undefined) continue;
    fuori.push({
      chiave: p.id ?? `${lat},${lng}`,
      nome,
      dettaglio: p.formattedAddress ?? '',
      lat,
      lng,
      placeId: p.id,
      fotoNome: p.photos?.[0]?.name,
    });
  }
  return fuori;
}

/**
 * L'indirizzo dell'immagine di una foto Places, dal suo nome-risorsa.
 * Si chiede a Google al momento di mostrarla (niente copia nostra): e' la
 * strada che le condizioni d'uso di Places prevedono per le foto.
 */
export function urlFotoGoogle(nome: string, larghezza = 900) {
  if (!CHIAVE) return undefined;
  return `https://places.googleapis.com/v1/${nome}/media?maxWidthPx=${larghezza}&key=${CHIAVE}`;
}

/** C'e' la chiave? Chi disegna puo' dire "manca" senza provare una fetch. */
export const CHIAVE_PRESENTE = !!CHIAVE;

/**
 * La ricerca pronta da collegare a un campo di testo.
 *
 * **Aspetta 350 ms** dopo l'ultimo tasto e **annulla la richiesta precedente**:
 * senza la prima, una richiesta per lettera (e Google le fattura); senza la
 * seconda, la risposta di "ri" puo' arrivare dopo quella di "risto" e
 * sovrascrivere i risultati giusti con quelli vecchi.
 */
export function useRicercaLuoghi(soloRistoranti = false) {
  const [query, setQuery] = React.useState('');
  const [risultati, setRisultati] = React.useState<Trovato[]>([]);
  const [cercando, setCercando] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setRisultati([]);
      setCercando(false);
      setErrore(null);
      return;
    }

    const controllo = new AbortController();
    setCercando(true);
    const attesa = setTimeout(async () => {
      try {
        const r = await cercaLuoghi(q, controllo.signal, soloRistoranti);
        setRisultati(r);
        setErrore(null);
      } catch (e: unknown) {
        // Annullare non e' un errore: succede a ogni tasto premuto.
        if ((e as { name?: string })?.name === 'AbortError') return;
        setErrore(String((e as Error)?.message ?? e));
        setRisultati([]);
      } finally {
        setCercando(false);
      }
    }, 350);

    return () => {
      clearTimeout(attesa);
      controllo.abort();
    };
  }, [query, soloRistoranti]);

  const pulisci = React.useCallback(() => {
    setQuery('');
    setRisultati([]);
    setErrore(null);
  }, []);

  return { query, setQuery, risultati, cercando, errore, pulisci };
}
