import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { TipoEvento } from '@/lib/eventi';

/**
 * Importazione dal calendario del telefono — che include gli account collegati
 * (Google, iCloud), senza che l'app parli con nessun servizio esterno.
 *
 * ⚠️ La regola che governa questo file: **si importa solo cio' che l'utente
 * spunta**, mai un intervallo intero in automatico. Quello che entra qui
 * finisce nel calendario **condiviso**, e per D-21 il partner lo vede tutto,
 * per sempre: un "prendi tutto" trascinerebbe dentro il colloquio di lavoro e
 * la visita medica insieme al compleanno della nonna. La selezione non e' una
 * comodita' in piu', e' la mitigazione.
 *
 * Il permesso si chiede **quando si apre questa schermata**, non all'avvio:
 * chiedere l'accesso al calendario a chi non ha ancora deciso di importare
 * niente e' il modo migliore per farselo negare (e per meritarselo).
 */

export type Candidato = {
  id: string;
  titolo: string;
  inizio: Date;
  fine: Date | null;
  tuttoIlGiorno: boolean;
  tipo: TipoEvento;
  calendario: string;
  /** Ricorrenti come i compleanni: si segnalano, di solito e' cio' che si cerca. */
  ricorrente: boolean;
};

const PAROLE_VACANZA =
  /(volo|flight|hotel|b&b|airbnb|viaggio|vacanz|holiday|trip|check-?in|soggiorno|crociera)/i;
const PAROLE_COMPLEANNO = /(complean|birthday|onomastico|anniversar)/i;

/** Il tipo si indovina, non si impone: resta modificabile prima di importare. */
function indovinaTipo(titolo: string, tuttoIlGiorno: boolean, giorni: number): TipoEvento {
  if (PAROLE_VACANZA.test(titolo) || (tuttoIlGiorno && giorni >= 2)) return 'vacanza';
  return 'impegno';
}

export async function chiediPermesso() {
  if (Platform.OS === 'web') return false;
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Le voci candidate all'importazione, da un mese fa a un anno avanti: indietro
 * quel tanto che basta a ripescare cio' che e' appena passato, avanti abbastanza
 * da coprire i viaggi gia' prenotati e un giro completo di compleanni.
 */
export async function leggiCandidati(): Promise<Candidato[]> {
  const calendari = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (calendari.length === 0) return [];

  const da = new Date();
  da.setMonth(da.getMonth() - 1);
  const a = new Date();
  a.setFullYear(a.getFullYear() + 1);

  const eventi = await Calendar.getEventsAsync(
    calendari.map((c) => c.id),
    da,
    a
  );
  const nomi = new Map(calendari.map((c) => [c.id, c.title]));

  return eventi
    .filter((e) => !!e.title)
    .map((e) => {
      const inizio = new Date(e.startDate as string);
      const fine = e.endDate ? new Date(e.endDate as string) : null;
      const giorni = fine ? Math.round((fine.getTime() - inizio.getTime()) / 86_400_000) : 0;
      const ricorrente = !!e.recurrenceRule || PAROLE_COMPLEANNO.test(e.title);
      return {
        // L'id dell'istanza cambia a ogni ricorrenza: per i ricorrenti si usa
        // l'id dell'evento piu' la data, cosi' il compleanno di quest'anno e
        // quello dell'anno prossimo restano due righe distinte e riconoscibili.
        id: ricorrente ? `${e.id}@${inizio.toISOString().slice(0, 10)}` : String(e.id),
        titolo: e.title,
        inizio,
        fine: e.allDay || giorni >= 1 ? fine : null,
        tuttoIlGiorno: !!e.allDay,
        tipo: indovinaTipo(e.title, !!e.allDay, giorni),
        calendario: nomi.get(e.calendarId as string) ?? '',
        ricorrente,
      };
    })
    .sort((x, y) => x.inizio.getTime() - y.inizio.getTime());
}

/** Gia' importati: si escludono dall'elenco invece di farli scegliere due volte. */
export async function giaImportati(coppiaId: string) {
  const { data } = await supabase
    .from('evento')
    .select('origine_esterna')
    .eq('coppia_id', coppiaId)
    .not('origine_esterna', 'is', null);
  return new Set((data ?? []).map((r) => r.origine_esterna as string));
}

export async function importa(
  coppiaId: string,
  scelti: Candidato[]
): Promise<{ entrati: number; errore: string | null }> {
  if (scelti.length === 0) return { entrati: 0, errore: null };
  const { error } = await supabase.from('evento').insert(
    scelti.map((c) => ({
      coppia_id: coppiaId,
      titolo: c.titolo,
      inizio: c.inizio.toISOString(),
      fine: c.tipo === 'vacanza' && c.fine ? c.fine.toISOString() : null,
      tutto_il_giorno: c.tuttoIlGiorno || c.tipo === 'vacanza',
      tipo: c.tipo,
      // La categoria e' il nome del calendario di provenienza: e' cio' che
      // distingue venti compleanni da venti impegni qualunque (0007).
      categoria: c.calendario || null,
      origine_esterna: c.id,
    }))
  );
  return { entrati: error ? 0 : scelti.length, errore: error?.message ?? null };
}

/** Le voci raggruppate per calendario d'origine — cioe' per categoria. */
export function perCategoria(candidati: Candidato[]) {
  const m = new Map<string, Candidato[]>();
  for (const c of candidati) {
    const k = c.calendario || '—';
    m.set(k, [...(m.get(k) ?? []), c]);
  }
  // Le categorie piu' popolose per prime: di solito sono compleanni e festivita',
  // che sono anche quelle che si importano davvero.
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}
