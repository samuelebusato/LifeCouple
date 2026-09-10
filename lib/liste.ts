import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { pastelli, type Pastello } from '@/lib/tema';
import { t } from '@/lib/i18n';
import { LISTA_FILM_NASCOSTA } from '@/lib/funzioni-nascoste';

/** I quattro colori possibili di una lista: gli stessi pastelli dei giochi. */
export type NomePastello = keyof typeof pastelli;
export const NOMI_PASTELLO = Object.keys(pastelli) as NomePastello[];

export type Lista = {
  id: string;
  coppia_id: string;
  autore_id: string;
  nome: string;
  pastello: NomePastello;
  /**
   * Cosa contiene, e quindi **come si aggiunge una voce** (0023): scrivendo
   * (`voce`) o scegliendo da una tendina con le locandine (`film`).
   */
  tipo: 'voce' | 'film' | 'luogo';
  /**
   * È una delle tre liste di partenza (0025): «Film», «Viaggi», «Ristoranti».
   * Non si possono eliminare — il divieto vive nel database, qui serve solo a
   * non mostrare un comando che fallirebbe.
   */
  predefinita: boolean;
  /**
   * **Quale** delle tre liste di partenza è (0035), o `null` per le liste create
   * dalla coppia.
   *
   * Esiste per una ragione sola: mostrarne il nome nella lingua del telefono.
   * `tipo` non basta — «Viaggi» e «Ristoranti» sono tutte e due `luogo` — e il
   * nome non si può usare, perché è dell'utente (la stessa trappola descritta in
   * 0025 per la protezione).
   */
  chiave: 'film' | 'viaggi' | 'ristoranti' | null;
  creata_il: string;
  /** Quante voci contiene, e quante sono spuntate. Serve alla carta. */
  voci: number;
  fatte: number;
};

/**
 * Il colore della **prossima** lista: il primo che non è già in fondo.
 *
 * Guarda **le ultime due** e non solo l'ultima: con quattro tinte, evitare la
 * sola precedente lascia passare A-B-A, che nel carosello si legge come un
 * motivo e non come tre cose diverse. Se tutte e quattro fossero escluse — non
 * può accadere con due sole esclusioni, ma il codice non deve dipendere da quel
 * ragionamento — si torna alla prima invece di restituire `undefined`.
 */
export function prossimoPastello(liste: Pick<Lista, 'pastello'>[]): NomePastello {
  const ultime = liste.slice(-2).map((l) => l.pastello);
  return NOMI_PASTELLO.find((n) => !ultime.includes(n)) ?? NOMI_PASTELLO[0];
}

/** Il pastello vero a partire dal nome salvato nel database. */
export function tintaDi(l: Pick<Lista, 'pastello'>): Pastello {
  return pastelli[l.pastello] ?? pastelli.romantico;
}

/**
 * I nomi con cui il trigger di 0025 semina le tre liste di partenza.
 *
 * Non servono a **riconoscerle** — quello lo fa `chiave` — ma a rispondere a una
 * domanda diversa: *questa lista ha ancora il nome che le è stato dato, o la
 * coppia gliene ha messo uno suo?*
 */
const NOME_SEMINATO: Record<NonNullable<Lista['chiave']>, string> = {
  film: 'Film',
  viaggi: 'Viaggi',
  ristoranti: 'Ristoranti',
};

/**
 * Il nome da **mostrare** (0035): tradotto se è una lista di partenza col nome
 * di fabbrica, così com'è in ogni altro caso.
 *
 * ## Perché si traduce qui e non nel database
 *
 * 🔑 La lingua è **di chi guarda, non del dato**. I due partner possono avere il
 * telefono in due lingue diverse, e la lista è una riga sola: tradurla alla
 * scrittura vorrebbe dire che chi apre l'app per ultimo riscrive il nome
 * all'altro. Tradurre alla lettura è l'unica forma che regge in due.
 *
 * ## Perché confronta col nome seminato invece di fidarsi di `chiave`
 *
 * ⚠️ 0025 lascia **rinominabili** le liste di partenza: «Ristoranti» può
 * diventare «Dove mangiare bene». Se `chiave` bastasse a tradurre, quel nome
 * scelto dalla coppia sparirebbe dallo schermo — la protezione riguarda
 * l'eliminazione, non il nome, e una traduzione che sovrascrive una scelta
 * dell'utente è una perdita di dato travestita da funzione.
 *
 * Il confronto risponde quindi alla domanda giusta: *finché il nome è quello che
 * abbiamo messo noi, è nostro e lo traduciamo; dal momento in cui è loro, no.*
 */
export function nomeLista(l: Pick<Lista, 'nome' | 'chiave'>): string {
  if (!l.chiave) return l.nome;
  return l.nome === NOME_SEMINATO[l.chiave] ? t.liste.predefinite[l.chiave] : l.nome;
}

/**
 * Le **liste dei desideri** della coppia (0022).
 *
 * Prima «Liste» era un elenco solo e fisso — i film — perché i luoghi erano
 * passati alla mappa con D-51 e nessuno aveva ridiscusso cosa restava. Ora
 * l'elenco lo crea la coppia: quante liste vuole, coi nomi che vuole.
 *
 * ## Il conteggio arriva col resto, non dopo
 *
 * La query porta a casa anche le voci, e da quelle si contano totale e spuntate
 * in memoria. L'alternativa — una `count` per lista — sarebbe una richiesta di
 * rete per carta, cioè quattro o cinque richieste per disegnare una schermata
 * che ne faceva una. A scala di coppia le voci sono decine, non milioni: il
 * conto in memoria è gratis e la schermata si disegna in un viaggio solo.
 */
export function useListe(coppiaId: string | null) {
  const [liste, setListe] = React.useState<Lista[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setListe([]);
      setErrore(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('lista')
      .select('*, elemento_lista(id, stato)')
      .eq('coppia_id', coppiaId)
      .order('creata_il', { ascending: true });
    setErrore(error?.message ?? null);
    if (!error) {
      setListe(
        (data ?? [])
          /* La lista dei film e' nascosta finche' la licenza delle locandine
             non e' risolta (lib/funzioni-nascoste.ts). Il filtro e' su `tipo`
             e non sul nome: il nome si rinomina, il tipo e' quello che
             governa ricerca e locandina. ⚠️ Le righe restano in banca dati e
             tornano visibili spegnendo la costante — non si cancella niente.
             🔑 Filtrando qui si chiude anche il link diretto per id: la rotta
             app/lista/[id].tsx risolve la lista con questo stesso hook, e
             cade da sola nel ramo «lista inesistente» che c'era gia'. */
          .filter((r) => !(LISTA_FILM_NASCOSTA && (r as { tipo?: string }).tipo === 'film'))
          .map((r) => {
          const { elemento_lista, ...resto } = r as typeof r & {
            elemento_lista: { id: string; stato: string }[];
          };
          const voci = elemento_lista ?? [];
          return {
            ...resto,
            voci: voci.length,
            fatte: voci.filter((v) => v.stato === 'fatto').length,
          } as unknown as Lista;
        })
      );
    }
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  /**
   * Crea una lista.
   *
   * Il colore **non si sceglie**: lo assegna il codice. Un selettore sarebbe un
   * secondo campo da riempire per una decisione che non cambia niente.
   *
   * ## ⚠️ Ma non basta ciclare, e il primo tentativo lo faceva (2026-08-28)
   *
   * La prima stesura prendeva `pastelli[liste.length % 4]`. Sembra un giro
   * regolare e non lo è: **basta cancellare una lista** perché il conteggio
   * torni indietro e la prossima nasca dello stesso colore di quella che ora le
   * sta accanto. Il ciclo garantisce di non ripetersi *contando*, non di non
   * ripetersi *in fila* — e in fila è l'unica cosa che conta, perché il colore
   * serve a distinguere due carte vicine senza leggerne il nome.
   *
   * 🔑 La regola si scrive quindi per ciò che deve ottenere: **diverso dagli
   * ultimi due**, non «il prossimo del giro». I colori possono ripetersi — con
   * quattro pastelli e liste a volontà è inevitabile — ma mai a contatto.
   */
  const crea = React.useCallback(
    async (nome: string, ricaricaCoppia: () => Promise<StatoCoppia>): Promise<string | null> => {
      const pulito = nome.trim();
      if (!pulito) return 'nome-vuoto';
      const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
      if (!esito.coppiaId) return esito.errore;
      const { error } = await supabase.from('lista').insert({
        coppia_id: esito.coppiaId,
        nome: pulito,
        pastello: prossimoPastello(liste),
      });
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [coppiaId, liste, ricarica]
  );

  /**
   * Rinomina una lista. Solo l'autore può: per gli altri l'update filtra zero
   * righe — vedi `elimina` qui sotto per perché questo va **verificato** e non
   * dato per riuscito.
   */
  const rinomina = React.useCallback(
    async (id: string, nome: string): Promise<string | null> => {
      const pulito = nome.trim();
      if (!pulito) return 'nome-vuoto';
      const { error, count } = await supabase
        .from('lista')
        .update({ nome: pulito }, { count: 'exact' })
        .eq('id', id);
      if (error) return error.message;
      if (count === 0) return 'solo-autore';
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /**
   * Elimina una lista, **e con lei tutte le sue voci** (il `on delete cascade`
   * di 0022).
   *
   * 🔑 **Si controlla quante righe ha toccato, e non è pedanteria.** La policy
   * di `delete` è solo-autore: se a premere è il partner che la lista non l'ha
   * creata, la RLS non restituisce un errore — restituisce **`error: null` e
   * zero righe**. È il difetto di B-23 nella sua forma esatta: *un permesso che
   * manca non fallisce, tace*. Senza questo controllo l'app direbbe «fatto» e
   * la lista resterebbe lì, e chi ha premuto crederebbe a un guasto casuale.
   */
  const elimina = React.useCallback(
    async (id: string): Promise<string | null> => {
      const { error, count } = await supabase
        .from('lista')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) {
        // 🔑 Il trigger di 0025 alza un'eccezione, e arriva **come errore** —
        // non come zero righe filtrate in silenzio. È la differenza voluta
        // rispetto a una policy più stretta: un rifiuto che va spiegato non si
        // nasconde in un filtro (B-23).
        if (error.message.includes('lista-predefinita')) return 'predefinita';
        return error.message;
      }
      if (count === 0) return 'solo-autore';
      await ricarica();
      return null;
    },
    [ricarica]
  );

  return { liste, loading, errore, ricarica, crea, rinomina, elimina };
}
