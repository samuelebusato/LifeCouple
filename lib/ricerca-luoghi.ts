import * as React from 'react';
import { lingua } from '@/lib/i18n';

/**
 * Ricerca di luoghi mentre si digita, su dati **OpenStreetMap**.
 * Scelta dell'utente il 2026-08-13 fra quattro strade.
 *
 * ## Perche' Photon e non Nominatim
 *
 * Nominatim e' il servizio "ufficiale" di OSM, ma la sua politica d'uso
 * **vieta esplicitamente l'autocompletamento** ("Auto-complete search — this is
 * not supported") e impone un massimo di una richiesta al secondo. Cercare
 * mentre si digita e' esattamente l'uso che vieta: costruirci sopra
 * significherebbe farsi bloccare l'indirizzo IP a uso reale, e scoprirlo dagli
 * utenti. **Photon** (di Komoot) usa gli stessi dati OpenStreetMap ed e' fatto
 * apposta per l'autocompletamento, senza chiave e senza account.
 *
 * ## Cosa esce da qui, e cosa no
 *
 * Esce **solo il testo digitato** e la lingua. Photon accetterebbe anche
 * `lat`/`lon` per ordinare i risultati per vicinanza — e i risultati sarebbero
 * migliori — ma sarebbe la posizione della coppia a uscire, che e' cio' che
 * D-05 e lo scostamento dichiarato in D-32 hanno evitato finora. L'utente ha
 * scelto la versione senza posizione **sapendo** che i risultati sono piu'
 * deboli. Non aggiungere quei due parametri senza una decisione nuova.
 *
 * ## Attribuzione
 *
 * I dati sono © contributori OpenStreetMap (ODbL) e l'attribuzione va mostrata
 * dove compaiono i risultati: `ATTRIBUZIONE_OSM`.
 */

const ENDPOINT = 'https://photon.komoot.io/api/';

export const ATTRIBUZIONE_OSM = '© OpenStreetMap';

export type Trovato = {
  /** Chiave stabile per le liste: Photon non restituisce un id proprio. */
  chiave: string;
  /** Quello che si legge in grande: il nome del posto, o la via. */
  nome: string;
  /** Citta', provincia, paese: quello che serve a distinguere due omonimi. */
  dettaglio: string;
  lat: number;
  lng: number;
};

type Proprieta = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
  osm_id?: number;
  osm_type?: string;
};

function componi(p: Proprieta) {
  const via = [p.street, p.housenumber].filter(Boolean).join(' ');
  const nome = p.name || via || p.city || p.state || p.country || '';
  const dettaglio = [
    p.name && via ? via : null,
    p.postcode,
    p.city ?? p.district ?? p.county,
    p.state,
    p.country,
  ]
    .filter(Boolean)
    .join(', ');
  return { nome, dettaglio };
}

/** Una ricerca singola. Chi la usa deve gia' aver aspettato (vedi `useRicercaLuoghi`). */
export async function cercaLuoghi(query: string, segnale?: AbortSignal): Promise<Trovato[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // ⚠️ Niente `lang=it`: Photon lo RIFIUTA con un 400 ("Supported are:
  // default, de, en, fr") e ogni digitazione fallirebbe — e' esattamente il
  // bug trovato sull'iPhone il 2026-08-13. Il default restituisce i nomi
  // nella lingua locale del posto, che per i luoghi italiani e' l'italiano.
  const url =
    `${ENDPOINT}?q=${encodeURIComponent(q)}&limit=8` + (lingua === 'en' ? '&lang=en' : '');

  const r = await fetch(url, {
    signal: segnale,
    headers: {
      // Identificarsi e' quello che chiedono i servizi OSM in cambio dell'uso
      // gratuito. Un client anonimo e' il primo a essere bloccato.
      'User-Agent': 'LifeCouple/0.1 (app di coppia; contatto via GitHub samuelebusato/LifeCouple)',
      Accept: 'application/json',
    },
  });
  if (!r.ok) throw new Error(`ricerca non riuscita (${r.status})`);

  const dati = (await r.json()) as {
    features?: { geometry?: { coordinates?: [number, number] }; properties?: Proprieta }[];
  };

  const visti = new Set<string>();
  const fuori: Trovato[] = [];
  for (const f of dati.features ?? []) {
    const c = f.geometry?.coordinates;
    const p = f.properties ?? {};
    if (!c || c.length < 2) continue;
    const { nome, dettaglio } = componi(p);
    if (!nome) continue;
    // Photon restituisce a volte lo stesso posto due volte (nodo e via):
    // due righe identiche in un elenco di suggerimenti sembrano un difetto.
    const chiave = `${p.osm_type ?? '?'}${p.osm_id ?? `${c[1]},${c[0]}`}`;
    const impronta = `${nome}|${dettaglio}`;
    if (visti.has(impronta)) continue;
    visti.add(impronta);
    fuori.push({ chiave, nome, dettaglio, lat: c[1], lng: c[0] });
  }
  return fuori;
}

/**
 * La ricerca pronta da collegare a un campo di testo.
 *
 * **Aspetta 350 ms** dopo l'ultimo tasto e **annulla la richiesta precedente**:
 * senza la prima, si manda una richiesta per lettera; senza la seconda, la
 * risposta di "ri" puo' arrivare dopo quella di "risto" e sovrascrivere i
 * risultati giusti con quelli vecchi. E' un difetto che si vede solo su rete
 * lenta, cioe' mai in prova e sempre in uso.
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
