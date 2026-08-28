import { pastelli, type Pastello } from '@/lib/tema';

/**
 * Il **catalogo dei tre giochi** (D-12): quiz sulle preferenze, obbligo o
 * verita', telepatia.
 *
 * ⚠️ E' un catalogo di **presentazione**, non di regole. Qui stanno il codice,
 * il colore e l'emblema — cioe' cio' che serve all'hub per mostrarli. Le regole
 * (il sigillo, i turni, il banco filtrato) vivono nel database e nella funzione
 * Postgres, dove D-12 le ha messe apposta: *l'autorizzazione sta nel database,
 * non nell'app*. Se un giorno una regola comparisse in questo file, sarebbe il
 * segno che qualcosa e' finito dalla parte sbagliata del confine.
 *
 * ## Perche' i colori sono i pastelli del calendario
 *
 * Sono gli stessi di `pastelli` in `lib/tema.ts`, quelli dei tipi di evento.
 * Non e' riuso per pigrizia: e' lo **stesso problema**, cioe' distinguere a
 * colpo d'occhio pochi elementi di pari rango. Una seconda famiglia di colori
 * per tre carte avrebbe aggiunto tinte da tarare senza aggiungere niente da
 * capire — e con due famiglie vicine si vede subito quale delle due e' arrivata
 * dopo.
 *
 * L'ordine dell'elenco e' quello del backlog (voci 9, 10, 11): il quiz per
 * primo perche' e' il piu' semplice da spiegare a chi apre l'app la prima
 * volta, poi obbligo o verita', poi la telepatia — l'unica dei tre che pretende
 * che siate davvero tutti e due sul telefono nello stesso momento.
 *
 * ## ⚠️ Il quarto non e' come gli altri tre (2026-08-28)
 *
 * `indovina_disegno` sta **in fondo**, e non e' un ordine arbitrario: gli altri
 * tre sono lo stesso meccanismo (il sigillo D-12 — *ognuno manda in segreto, si
 * rivela quando hanno mandato entrambi*), questo e' un **secondo meccanismo**,
 * *uno produce e l'altro indovina*, che il progetto non ha ancora. Era la
 * proposta 1 di P-04, dove e' registrata come **la piu' cara delle quattro**:
 * serve una superficie di disegno, e il disegno va salvato e trasmesso.
 *
 * Nel catalogo dell'hub questo non costa niente — e' una carta come le altre.
 * Costa quando lo si costruira', ed e' scritto in `History.md` perche' non
 * arrivi come una sorpresa.
 */
export type CodiceGioco =
  | 'quiz_preferenze'
  | 'obbligo_verita'
  | 'telepatia'
  | 'indovina_disegno';

export type Gioco = {
  codice: CodiceGioco;
  pastello: Pastello;
};

export const GIOCHI: readonly Gioco[] = [
  { codice: 'quiz_preferenze', pastello: pastelli.romantico },
  { codice: 'obbligo_verita', pastello: pastelli.speciale },
  { codice: 'telepatia', pastello: pastelli.impegno },
  { codice: 'indovina_disegno', pastello: pastelli.vacanza },
] as const;

/**
 * Le due sorgenti di domande di una partita (**D-19**, backlog 11-bis).
 *
 * ⚠️ **Non sono due giochi**: sono due banchi per lo stesso gioco, ed e' la
 * distinzione che 11-bis chiede di non perdere. In schema e' una colonna sola:
 * `domanda.coppia_id` — `NULL` per il banco comune, valorizzato per quello
 * della coppia. Le tre policy RLS che ne discendono dicono il resto: si legge
 * il comune piu' il proprio, si scrive e si cancella **solo** il proprio,
 * nessuno puo' inserire nel comune.
 */
export type ModoGioco = 'ufficiale' | 'personalizzata';
