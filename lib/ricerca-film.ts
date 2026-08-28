import * as React from 'react';
import { lingua } from '@/lib/i18n';

/**
 * **La ricerca dei film**, con locandina — il gemello di `ricerca-luoghi.ts`.
 *
 * ## ⚠️ Perché TMDB e non Google, che è quello che era stato chiesto
 *
 * Google **non ha un'API per le locandine dei film**. Places serve i luoghi, e
 * non esiste un equivalente per il cinema: la Knowledge Graph Search API è
 * deprecata e non restituisce poster utilizzabili. La fonte di fatto per
 * copertine, anno e sinossi è **TMDB**, che è anche quella che sta dietro a
 * mezzo settore — JustWatch, Letterboxd e gran parte delle app di film.
 *
 * Quindi la richiesta è stata soddisfatta nella sostanza (*«il titolo, e la
 * copertina arriva da sola»*) e non alla lettera (*«da Google»*), perché alla
 * lettera non è possibile.
 *
 * ## Cosa serve per accenderla
 *
 * `EXPO_PUBLIC_TMDB_KEY` nel `.env` — si crea gratis su themoviedb.org
 * (Impostazioni → API → chiave v3). Poi **Metro va riavviato**: le
 * `EXPO_PUBLIC_` finiscono nel bundle a tempo di compilazione, non a runtime.
 *
 * 🔴 **E porta con sé lo stesso debito della chiave Google**, che qui va
 * dichiarato invece di scoprirlo dopo:
 * - la chiave **vive nel bundle**, quindi è leggibile da chi apre l'app. Per
 *   TMDB il danno è minore che per Google (nessuna fatturazione a consumo su
 *   una chiave v3 di lettura), ma la strada giusta resta la stessa: **proxy
 *   dietro una Edge Function** prima di utenti veri;
 * - ⚠️ **TMDB è gratuito per uso NON commerciale.** Se LifeCouple attivasse il
 *   listino di `Marketing/LifeCouple/monetizzazione.md`, questa licenza va
 *   verificata **prima**, non dopo. È scritto anche lì.
 *
 * ## L'attribuzione non è cortesia, è nei termini
 *
 * TMDB richiede di dichiarare che i dati vengono da loro e che il prodotto non
 * è approvato da loro. `ATTRIBUZIONE_TMDB` esiste per essere mostrata, non per
 * stare in un commento.
 */

const CHIAVE = process.env.EXPO_PUBLIC_TMDB_KEY;

/** Da mostrare accanto ai risultati: è una condizione dei termini d'uso. */
export const ATTRIBUZIONE_TMDB = 'TMDB';

export const CHIAVE_TMDB_PRESENTE = !!CHIAVE;

export type FilmTrovato = {
  tmdbId: number;
  titolo: string;
  /** Il titolo originale, mostrato solo quando è diverso da quello tradotto. */
  titoloOriginale: string;
  /** L'anno di uscita, o `null` se TMDB non ce l'ha. */
  anno: number | null;
  /** Il `poster_path`, da dare a `urlLocandina`. `null` se il film non ne ha. */
  locandina: string | null;
  sinossi: string | null;
};

/**
 * L'URL della locandina a partire dal percorso salvato.
 *
 * ⚠️ Le larghezze **non sono libere**: TMDB serve una scala fissa (w92, w154,
 * w185, w342, w500, w780, original) e un valore fuori scala restituisce 404.
 * Si sceglie quindi il gradino più piccolo che copre la richiesta, invece di
 * passare il numero chiesto — che è l'errore che farebbe sparire le copertine
 * solo su certi schermi.
 */
const GRADINI = [92, 154, 185, 342, 500, 780] as const;

export function urlLocandina(percorso: string | null, larghezza = 342): string | null {
  if (!percorso) return null;
  const gradino = GRADINI.find((g) => g >= larghezza);
  const taglia = gradino ? `w${gradino}` : 'original';
  return `https://image.tmdb.org/t/p/${taglia}${percorso}`;
}

type RispostaTmdb = {
  results?: {
    id: number;
    title?: string;
    original_title?: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
  }[];
};

/**
 * Cerca un film per titolo.
 *
 * ⚠️ `include_adult=false` è deliberato e non è pudore: il banco delle domande
 * dei giochi è già filtrato (D-08 e le due esclusioni), e un elenco condiviso
 * fra due persone che possono guardarlo in momenti diversi non è il posto per
 * far comparire risultati che uno dei due non ha chiesto.
 *
 * La lingua segue quella del dispositivo (D-24), così i titoli arrivano già
 * tradotti dove esiste una traduzione.
 */
export async function cercaFilm(query: string, segnale?: AbortSignal): Promise<FilmTrovato[]> {
  if (!CHIAVE) throw new Error('chiave-mancante');
  const q = query.trim();
  if (q.length < 3) return [];

  const url =
    'https://api.themoviedb.org/3/search/movie' +
    `?api_key=${encodeURIComponent(CHIAVE)}` +
    `&query=${encodeURIComponent(q)}` +
    `&language=${lingua === 'it' ? 'it-IT' : 'en-US'}` +
    '&include_adult=false';

  const risposta = await fetch(url, { signal: segnale });
  if (!risposta.ok) throw new Error(`TMDB ${risposta.status}`);
  const dati = (await risposta.json()) as RispostaTmdb;

  return (dati.results ?? []).slice(0, 8).map((r) => ({
    tmdbId: r.id,
    titolo: r.title ?? r.original_title ?? '',
    titoloOriginale: r.original_title ?? '',
    // `release_date` è `AAAA-MM-GG` oppure stringa vuota per i film non usciti.
    anno: r.release_date ? Number(r.release_date.slice(0, 4)) : null,
    locandina: r.poster_path ?? null,
    sinossi: r.overview?.trim() || null,
  }));
}

/**
 * Il **primo** risultato per un titolo scritto a mano.
 *
 * Serve alla riparazione automatica: un film aggiunto scrivendo il titolo, senza
 * passare dalla tendina, non ha né identità né locandina. Questa lo cerca e
 * prende il primo risultato.
 *
 * ⚠️ **Prendere il primo è una scommessa, e va saputo**: «Dune» restituisce sia
 * il film del 2021 sia quello del 1984, e TMDB ordina per popolarità, non per
 * pertinenza a *quello che intendevate voi*. La tendina resta quindi la strada
 * buona (è D-37 per i film: *si sceglie fra quelli veri*), e questa è la rete
 * per chi ha scritto e basta. Chi vuole essere sicuro sceglie.
 */
export async function identitaFilm(titolo: string): Promise<FilmTrovato | null> {
  try {
    const risultati = await cercaFilm(titolo);
    return risultati[0] ?? null;
  } catch {
    // Un fallimento qui non è un errore da mostrare: è un abbellimento, e
    // l'elenco resta corretto anche senza copertina.
    return null;
  }
}

/**
 * La ricerca mentre si scrive.
 *
 * Identica per struttura a `useRicercaLuoghi`, e per le stesse due ragioni:
 * **aspetta 350 ms** dopo l'ultimo tasto, e **annulla la richiesta precedente**
 * — senza la seconda, la risposta di «int» può arrivare dopo quella di
 * «interstellar» e sovrascrivere i risultati giusti coi vecchi.
 */
export function useRicercaFilm() {
  const [query, setQuery] = React.useState('');
  const [risultati, setRisultati] = React.useState<FilmTrovato[]>([]);
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
        const r = await cercaFilm(q, controllo.signal);
        setRisultati(r);
        setErrore(null);
      } catch (e: unknown) {
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
