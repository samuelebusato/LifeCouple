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
 * `EXPO_PUBLIC_GOOGLE_PLACES_KEY` nel `.env` (Google Cloud: Places API (New)
 * abilitata + fatturazione). Finche' manca, la ricerca **dice che manca**
 * invece di fingere di non trovare niente: un campo muto sembra un bug, un
 * campo che spiega e' uno stato.
 *
 * 🔴 **La chiave e' pubblica, e va trattata come tale.** Il prefisso
 * `EXPO_PUBLIC_` non e' un dettaglio di nomenclatura: significa che il valore
 * viene **scritto dentro il bundle** dell'app, quindi chiunque la scarichi puo'
 * estrarlo. E c'e' una seconda uscita, meno ovvia: `urlFotoGoogle` mette la
 * chiave **nella query string** dell'immagine, dove finisce nelle cache HTTP e
 * nei log di qualunque intermediario.
 *
 * Le "application restrictions" di Google (bundle iOS, package Android) non
 * chiudono il buco *qui*: valgono per gli SDK nativi, che mandano da soli gli
 * header d'identita'. Una `fetch` scritta a mano non li manda, e chi ha copiato
 * la chiave puo' fabbricarli. Sono un dosso, non un muro.
 *
 * → **Finche' si resta cosi', la difesa vera e' il tetto di quota** su Google
 * Cloud, non la restrizione. La correzione strutturale e' spostare la chiamata
 * dietro una Edge Function di Supabase, con la chiave in un secret: sta nel
 * backlog, ed e' da fare **prima di utenti veri**.
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
  /**
   * Il tipo principale secondo Google (`restaurant`, `park`, `museum`…).
   *
   * Serve a una cosa sola ma importante: capire, quando si sceglie un posto nel
   * form dell'evento, **se quel posto e' un ristorante** — e in quel caso
   * aggiungerlo da solo ai preferiti invece di chiedere all'utente di
   * reinserirlo a mano in un'altra schermata.
   */
  primaryType?: string;
  /** Nome-risorsa della prima foto Google: diventa la copertina. */
  fotoNome?: string;
};

type PostoGoogle = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: { name?: string }[];
  primaryType?: string;
  types?: string[];
};

/**
 * Una ricerca singola, su **tutti** i tipi di posto.
 *
 * ⚠️ Il parametro `soloRistoranti` e' sparito con 0016, e con lui la maschera
 * dei campi a due rami che avevo introdotto poche ore prima per risparmiare.
 * Quell'ottimizzazione poggiava su una premessa — «solo i ristoranti diventano
 * preferiti, quindi solo loro hanno bisogno di una copertina» — che il
 * passaggio da "ristoranti" a "luoghi" ha eliminato: ora **ogni** posto scelto
 * entra in lista con la sua foto. Una maschera che chiede meno campi
 * restituirebbe elementi senza copertina, cioe' un risparmio pagato con un
 * difetto visibile.
 */
export async function cercaLuoghi(query: string, segnale?: AbortSignal): Promise<Trovato[]> {
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
      // ⚠️ **Il campo chiesto e' il prezzo.** Google fattura una ricerca al SKU
      // piu' alto fra i campi del field mask: chiedere `places.photos` su ogni
      // ricerca alzava il conto anche per la mappa, che le foto non le usa —
      // le guarda solo il ristorante, per farne la copertina (D-37).
      // Quindi la maschera e' **due**: minima per i luoghi, con le foto solo
      // dove servono davvero.
      // I campi sono il prezzo, e questi si pagano tutti consapevolmente:
      // `photos` diventa la copertina del luogo in lista, `primaryType` decide
      // l'icona e il colore del pin sulla mappa.
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.primaryType',
    },
    body: JSON.stringify({
      textQuery: q,
      languageCode: lingua,
      pageSize: 8,
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
      primaryType: p.primaryType ?? p.types?.[0],
    });
  }
  return fuori;
}

/**
 * L'indirizzo dell'immagine di una foto Places, dal suo nome-risorsa.
 * Si chiede a Google al momento di mostrarla (niente copia nostra): e' la
 * strada che le condizioni d'uso di Places prevedono per le foto.
 */
export function urlFotoGoogle(nome: string | null | undefined, larghezza = 900) {
  if (!CHIAVE) return undefined;
  // ⚠️ **Un nome vuoto non e' una foto**, ed e' il caso che questa funzione
  // sbagliava (2026-08-28). Senza questa riga, `urlFotoGoogle('')` costruiva
  // un URL valido verso una risorsa inesistente: chi lo usava non otteneva
  // `undefined` — otteneva **un'immagine rotta**, che e' peggio, perche' il
  // ripiego previsto (una sfumatura, un segnaposto) non scattava mai.
  //
  // 🔑 I chiamanti si guardavano gia' da soli con un `? :`. Proprio per questo
  // valeva la pena chiudere il buco **qui**: una funzione che si comporta bene
  // solo se chi la chiama se ne ricorda e' la forma di D-60, e il prossimo
  // chiamante non ha modo di saperlo.
  if (!nome) return undefined;
  return `https://places.googleapis.com/v1/${nome}/media?maxWidthPx=${larghezza}&key=${CHIAVE}`;
}

/**
 * Recupera il nome-risorsa di una foto per un posto di cui si ha solo l'id.
 *
 * ## Perche' serve una riparazione
 *
 * Per qualche ora, il 2026-08-27, la maschera dei campi della ricerca generica
 * **non chiedeva le foto** — era un'ottimizzazione basata sulla premessa che
 * solo i ristoranti diventassero preferiti. I luoghi aggiunti in quella
 * finestra hanno `google_place_id` valorizzato e `foto_google` nullo, quindi
 * restano senza copertina per sempre: la ricerca non si rifa', e il dato non
 * torna da solo.
 *
 * Questa funzione lo va a prendere da **Place Details**, che accetta l'id e
 * risponde con le foto. Costa una chiamata **per luogo rotto, una volta sola**:
 * appena il nome e' salvato non si ripassa piu' di qui.
 *
 * ⚠️ La lezione, che vale piu' della riparazione: un'ottimizzazione che toglie
 * un campo a una scrittura **lascia dietro dati incompleti anche dopo essere
 * stata annullata**. Il codice torna com'era; le righe scritte nel frattempo no.
 */
export async function fotoDiUnPosto(placeId: string): Promise<string | null> {
  if (!CHIAVE) return null;
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { 'X-Goog-Api-Key': CHIAVE, 'X-Goog-FieldMask': 'photos' },
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { photos?: { name?: string }[] };
    return d.photos?.[0]?.name ?? null;
  } catch {
    // Una copertina mancante non merita di far fallire il caricamento di una
    // schermata: si torna null e il posto resta senza foto.
    return null;
  }
}

/**
 * Cerca su Google un posto **per nome** e ne restituisce id e foto.
 *
 * Serve ai posti nati da un tocco lungo sulla mappa: hanno un nome e delle
 * coordinate, ma nessuna identita' Google, quindi nessuna copertina — ed e' il
 * «i luoghi non visitati non hanno l'immagine».
 *
 * ⚠️ **Solo il nome, nessuna coordinata.** Mandare anche il punto migliorerebbe
 * molto la precisione, ma la regola di D-05 e' che da qui esce solo il testo, e
 * quella regola non si piega per una copertina. La conseguenza e' dichiarata: su
 * un nome generico ("Casa", "Il parco") la corrispondenza puo' essere sbagliata
 * o assente — e in quel caso e' meglio nessuna immagine che l'immagine di un
 * altro posto.
 */
export async function cercaIdentita(
  nome: string
): Promise<{ placeId: string; fotoNome: string | null } | null> {
  if (!CHIAVE) return null;
  const q = nome.trim();
  if (q.length < 3) return null;
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': CHIAVE,
        'X-Goog-FieldMask': 'places.id,places.photos',
      },
      body: JSON.stringify({ textQuery: q, languageCode: lingua, pageSize: 1 }),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { places?: { id?: string; photos?: { name?: string }[] }[] };
    const p = d.places?.[0];
    if (!p?.id) return null;
    return { placeId: p.id, fotoNome: p.photos?.[0]?.name ?? null };
  } catch {
    return null;
  }
}

/**
 * E' un posto dove si mangia?
 *
 * Google ha una **famiglia** di tipi per la ristorazione, non uno solo: un
 * locale puo' tornare `restaurant`, ma anche `pizza_restaurant`, `bar`,
 * `cafe`… Controllare solo `restaurant` avrebbe lasciato fuori proprio i casi
 * piu' comuni di una serata di coppia. Il suffisso `_restaurant` copre l'intera
 * famiglia dei sottotipi senza doverli elencare tutti.
 */
export function eRistorante(tipo?: string) {
  if (!tipo) return false;
  const fissi = ['restaurant', 'bar', 'cafe', 'bakery', 'pub', 'wine_bar', 'ice_cream_shop'];
  return fissi.includes(tipo) || tipo.endsWith('_restaurant');
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
export function useRicercaLuoghi() {
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
        const r = await cercaLuoghi(q, controllo.signal);
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
  }, [query]);

  const pulisci = React.useCallback(() => {
    setQuery('');
    setRisultati([]);
    setErrore(null);
  }, []);

  return { query, setQuery, risultati, cercando, errore, pulisci };
}
