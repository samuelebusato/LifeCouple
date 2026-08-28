import * as React from 'react';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { cercaIdentita, fotoDiUnPosto } from '@/lib/ricerca-luoghi';
import { identitaFilm } from '@/lib/ricerca-film';

/**
 * I due tipi della lista dei desideri.
 *
 * ⚠️ `ristorante` e' diventato `luogo` con 0016: la stessa struttura — posto
 * scelto da Google, identita', copertina, "da fare / fatto", recensioni di
 * entrambi — serve identica per un museo, un parco o un teatro, e l'unica cosa
 * che cambiava era l'etichetta. Che genere di posto sia lo dice `genere`, che
 * e' il tipo primario di Google: un dato piu' ricco di quello che si e' perso.
 */
export type TipoElemento = 'film' | 'luogo' | 'voce';

/**
 * ⚠️ `voce` è arrivato con 0022, ed è il tipo delle righe di una **wishlist**:
 * ciò che una coppia scrive da sé — «prendere il passaporto», «regalo per mia
 * sorella» — e che non è né un film né un posto. Non ha copertina, non ha
 * identità Google, non ha un pin sulla mappa: ha un titolo e una spunta.
 */

export type Recensione = {
  id: string;
  elemento_id: string;
  autore_id: string;
  voto: number;
  testo: string | null;
};

export type Elemento = {
  id: string;
  coppia_id: string;
  autore_id: string;
  tipo: string;
  titolo: string;
  stato: string;
  fatto_il: string | null;
  creato_il: string;
  /**
   * La wishlist a cui appartiene (0022).
   *
   * ⚠️ `null` **non è un dato mancante**: significa che questa riga è un luogo
   * della mappa (D-46), che vive in questa tabella senza stare in nessuna
   * lista. Filtrare per `lista_id` non è quindi mai «prendi tutti tranne
   * qualche caso da sistemare»: è prendere l'altra metà della tabella.
   */
  lista_id: string | null;
  /** Il posto del ristorante (0012): e' cio' che lo porta sulla mappa. */
  luogo_id: string | null;
  luogo: { id: string; nome: string; lat: number; lng: number } | null;
  /** Identita' Google del ristorante (0013): scelto, non inventato. */
  google_place_id: string | null;
  /** Nome-risorsa della foto Places: la copertina, chiesta a Google al volo. */
  foto_google: string | null;
  /** Il tipo primario secondo Google (`restaurant`, `city_park`, `museum`…). */
  genere: string | null;
  /** L'identità TMDB di un film (0023): scelto dalla tendina, non inventato. */
  tmdb_id: number | null;
  /** Il `poster_path` TMDB — la locandina. L'URL si ricompone al momento. */
  locandina: string | null;
  recensioni: Recensione[];
};

/**
 * Film e ristoranti: quelli da vedere/provare e quelli gia' fatti, ciascuno con
 * **una recensione per persona** (il vincolo `unique(elemento, autore)` sta
 * nello schema dal primo giorno: due persone, due opinioni, nessuna delle due
 * sovrascrive l'altra).
 *
 * La transizione desiderato → fatto e' anche cio' che alimenta la creatura
 * (D-15): i punti li assegna un trigger sul database, non il client, e solo
 * **al passaggio** — rifarlo avanti e indietro non fabbrica punti.
 */
export function usePreferiti(coppiaId: string | null) {
  const [elementi, setElementi] = React.useState<Elemento[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setElementi([]);
      setErrore(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('elemento_lista')
      .select('*, recensione(*), luogo:luogo_id(id, nome, lat, lng)')
      .eq('coppia_id', coppiaId)
      .order('creato_il', { ascending: false });
    setErrore(error?.message ?? null);
    if (!error) {
      setElementi(
        (data ?? []).map((r) => {
          const { recensione, ...resto } = r as typeof r & { recensione: Recensione[] };
          return { ...resto, recensioni: recensione ?? [] } as unknown as Elemento;
        })
      );
    }
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  const aggiungi = React.useCallback(
    async (
      tipo: TipoElemento,
      titolo: string,
      ricaricaCoppia: () => Promise<StatoCoppia>,
      /** La wishlist in cui finisce (0022). `null` solo per i luoghi. */
      listaId: string | null = null
    ): Promise<string | null> => {
      const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
      if (!esito.coppiaId) return esito.errore;
      const { error } = await supabase
        .from('elemento_lista')
        .insert({ coppia_id: esito.coppiaId, tipo, titolo: titolo.trim(), lista_id: listaId });
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [coppiaId, ricarica]
  );

  /** Il passaggio che conta: da desiderato a fatto (e i punti seguono). */
  /**
   * Spunta "fatto" — e su un luogo aggiorna **anche il posto sulla mappa**.
   *
   * 🔴 Era il «pulsante visitato/non visitato non funziona bene». Lo stesso
   * fatto vive in due righe da 0012 (`elemento_lista.stato` per la lista,
   * `luogo.stato` per la mappa) e questa funzione ne scriveva una sola: si
   * spuntava un posto nella lista e sulla mappa restava "da visitare", oppure
   * lo si segnava visitato sulla mappa e nella lista restava da fare. Non era
   * il bottone a non funzionare — funzionava a meta', ed e' peggio, perche'
   * sembra casuale.
   *
   * ⚠️ `fatto_il` lo si valorizza solo passando a fatto, e lo si azzera
   * tornando indietro: e' la data in cui ci siete stati, non quella dell'ultimo
   * tocco sul bottone.
   *
   * ⚠️ Sul `luogo` **non si tocca `visitato_il` alla transizione**: quella la
   * mette il trigger dei punti (D-15), ed e' cio' che impedisce di fabbricare
   * punti spuntando e despuntando.
   */
  const segnaFatto = React.useCallback(
    async (id: string, fatto: boolean): Promise<string | null> => {
      const quale = elementi.find((e) => e.id === id);
      const { error } = await supabase
        .from('elemento_lista')
        .update({ stato: fatto ? 'fatto' : 'desiderato', fatto_il: fatto ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) return error.message;
      if (quale?.tipo === 'luogo' && quale.luogo_id) {
        await supabase
          .from('luogo')
          .update({ stato: fatto ? 'visitato' : 'desiderato' })
          .eq('id', quale.luogo_id);
      }
      await ricarica();
      return null;
    },
    [elementi, ricarica]
  );

  /** La propria recensione: si sovrascrive la propria, mai quella dell'altro. */
  const recensisci = React.useCallback(
    async (elemento: Elemento, voto: number, testo: string): Promise<string | null> => {
      const { error } = await supabase.from('recensione').upsert(
        {
          coppia_id: elemento.coppia_id,
          elemento_id: elemento.id,
          voto,
          testo: testo.trim() || null,
        },
        { onConflict: 'elemento_id,autore_id' }
      );
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /**
   * Elimina un elemento — e, se e' un luogo, **anche il suo posto sulla mappa**.
   *
   * ⚠️ Da 0017 luogo e riga in lista sono uno a uno, quindi cancellarne una
   * sola lascia un mezzo posto. Il difetto si vedeva soprattutto nel verso
   * opposto (vedi `useLuoghi.elimina`), ma la simmetria va tenuta da entrambe
   * le parti: una regola che vale in una direzione sola non e' una regola, e'
   * un caso particolare che qualcuno dimenticherà.
   *
   * Il posto si cancella **dopo**: se fallisse la prima cancellazione non si
   * sarebbe tolto niente, mentre l'ordine inverso lascerebbe una riga in lista
   * che punta al vuoto — cioe' esattamente cio' che si sta riparando.
   */
  const elimina = React.useCallback(
    async (id: string): Promise<string | null> => {
      const quale = elementi.find((e) => e.id === id);
      const { error } = await supabase.from('elemento_lista').delete().eq('id', id);
      if (error) return error.message;
      if (quale?.tipo === 'luogo' && quale.luogo_id) {
        await supabase.from('luogo').delete().eq('id', quale.luogo_id);
      }
      await ricarica();
      return null;
    },
    [elementi, ricarica]
  );

  /**
   * Lega un ristorante a un posto (0012): crea il luogo dal risultato della
   * ricerca e lo aggancia. Un solo ingresso per due scritture, cosi' non
   * esiste lo stato "luogo creato ma ristorante non collegato" sparso in giro.
   * La policy consente l'aggancio solo all'autore del ristorante: per gli
   * altri l'update filtra zero righe, e si dice.
   */
  const collegaPosto = React.useCallback(
    async (
      elemento: Elemento,
      posto: { nome: string; lat: number; lng: number }
    ): Promise<string | null> => {
      const visitato = elemento.stato === 'fatto';
      const { data, error } = await supabase
        .from('luogo')
        .insert({
          coppia_id: elemento.coppia_id,
          nome: posto.nome.trim(),
          lat: posto.lat,
          lng: posto.lng,
          stato: visitato ? 'visitato' : 'desiderato',
          visitato_il: visitato ? new Date().toISOString() : null,
        })
        .select('id')
        .single();
      if (error) return error.message;
      const up = await supabase
        .from('elemento_lista')
        .update({ luogo_id: data.id }, { count: 'exact' })
        .eq('id', elemento.id);
      if (up.error) return up.error.message;
      if (up.count === 0) return 'solo-autore';
      await ricarica();
      return null;
    },
    [ricarica]
  );

  /**
   * Aggiunge un luogo e **ricarica l'elenco**. Il lavoro vero lo fa
   * `creaLuogo` qui sotto: questa e' solo la versione per chi ha una lista da
   * aggiornare subito dopo.
   */
  const aggiungiLuogoPreferito = React.useCallback(
    async (
      trovato: LuogoTrovato,
      ricaricaCoppia: () => Promise<StatoCoppia>,
      listaId: string | null = null
    ): Promise<{ errore: string | null; elementoId?: string; luogoId?: string }> => {
      const esito = await creaLuogo(coppiaId, trovato, ricaricaCoppia, listaId);
      if (!esito.errore) await ricarica();
      return esito;
    },
    [coppiaId, ricarica]
  );

  /**
   * Segna "fatti" i ristoranti la cui serata e' ormai passata (0015).
   *
   * Si chiama **quando si guarda**, non su un orario: al momento in cui un
   * evento diventa passato nel database non succede niente, quindi non c'e'
   * scrittura da intercettare con un trigger. E aggiornare la riga di notte non
   * varrebbe piu' che aggiornarla un istante prima che venga letta.
   *
   * Gira lato database come `security definer`, perche' la policy di
   * `elemento_lista` e' solo-autore ma la serata puo' averla messa il partner:
   * lato client si aggiornerebbe a volte si' e a volte no.
   */
  /**
   * Ripara le copertine mancanti: i luoghi che hanno un id Google ma non il
   * nome della foto (vedi `fotoDiUnPosto` per il come si sono rotti).
   *
   * Una chiamata per luogo rotto, **una volta sola**: appena il nome e' salvato
   * la condizione non li seleziona piu'. Se non c'e' niente da riparare non
   * parte nessuna richiesta.
   */
  /**
   * ⚠️ Chi e' gia' stato tentato non si ritenta.
   *
   * Senza questo, un posto che su Google **non ha foto** resterebbe per sempre
   * nell'insieme dei "rotti": la condizione lo seleziona, la chiamata torna
   * vuota, il dato non cambia — e si ripeterebbe a ogni modifica dell'elenco.
   * Una richiesta a pagamento in un ciclo che non converge e' il modo piu'
   * silenzioso di far salire un conto.
   */
  const tentati = React.useRef(new Set<string>());

  const riparaCopertine = React.useCallback(async () => {
    const rotti = elementi.filter(
      (e) => e.tipo === 'luogo' && !e.foto_google && !tentati.current.has(e.id)
    );
    if (rotti.length === 0) return;
    let riparati = 0;
    for (const e of rotti) {
      tentati.current.add(e.id);

      // Due casi, e il secondo e' quello dei posti nati da un tocco lungo sulla
      // mappa: hanno nome e coordinate ma **nessuna identita' Google**, quindi
      // nessuna copertina possibile. Si prova a trovarla cercandoli per nome.
      const aggiornamento: { foto_google?: string; google_place_id?: string } = {};
      if (e.google_place_id) {
        const nome = await fotoDiUnPosto(e.google_place_id);
        if (nome) aggiornamento.foto_google = nome;
      } else {
        const trovata = await cercaIdentita(e.titolo);
        if (trovata) {
          aggiornamento.google_place_id = trovata.placeId;
          if (trovata.fotoNome) aggiornamento.foto_google = trovata.fotoNome;
        }
      }
      if (Object.keys(aggiornamento).length === 0) continue;

      const { error } = await supabase
        .from('elemento_lista')
        .update(aggiornamento)
        .eq('id', e.id);
      if (!error) riparati++;
    }
    if (riparati > 0) await ricarica();
  }, [elementi, ricarica]);

  /**
   * Aggiunge un film **scelto dalla tendina** (0023): titolo, identità TMDB e
   * locandina in una scrittura sola.
   *
   * 🔑 È il gemello di `creaLuogo`, e per la stessa ragione di B-19: se il film
   * si potesse aggiungere da due punti con due scritture diverse, una delle due
   * dimenticherebbe la locandina — e la differenza si scoprirebbe fra settimane
   * guardando una lista in cui alcune schede hanno la copertina e altre no.
   */
  const aggiungiFilm = React.useCallback(
    async (
      trovato: { tmdbId: number; titolo: string; locandina: string | null },
      listaId: string | null,
      ricaricaCoppia: () => Promise<StatoCoppia>
    ): Promise<string | null> => {
      const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
      if (!esito.coppiaId) return esito.errore;
      const { error } = await supabase.from('elemento_lista').insert({
        coppia_id: esito.coppiaId,
        tipo: 'film',
        titolo: trovato.titolo.trim(),
        lista_id: listaId,
        tmdb_id: trovato.tmdbId,
        locandina: trovato.locandina,
      });
      if (error) return error.message;
      await ricarica();
      return null;
    },
    [coppiaId, ricarica]
  );

  /**
   * Ripara le locandine dei film scritti a mano, senza passare dalla tendina.
   *
   * ⚠️ **Stessa rete di `riparaCopertine`, e stessa trappola evitata**: chi è
   * già stato tentato non si ritenta. Senza il registro, un film che TMDB non
   * conosce resterebbe per sempre nell'insieme dei "senza locandina", e la
   * ricerca ripartirebbe a ogni modifica dell'elenco — una richiesta in un ciclo
   * che non converge.
   *
   * ⚠️ E prende **il primo risultato**, che è una scommessa: «Dune» sono due
   * film. La tendina resta la strada buona; questa è la rete per chi ha scritto
   * e basta.
   */
  const tentatiFilm = React.useRef(new Set<string>());

  const riparaLocandine = React.useCallback(async () => {
    const rotti = elementi.filter(
      (e) => e.tipo === 'film' && !e.locandina && !tentatiFilm.current.has(e.id)
    );
    if (rotti.length === 0) return;
    let riparati = 0;
    for (const e of rotti) {
      tentatiFilm.current.add(e.id);
      const trovato = await identitaFilm(e.titolo);
      if (!trovato?.locandina) continue;
      const { error } = await supabase
        .from('elemento_lista')
        .update({ tmdb_id: trovato.tmdbId, locandina: trovato.locandina })
        .eq('id', e.id);
      if (!error) riparati++;
    }
    if (riparati > 0) await ricarica();
  }, [elementi, ricarica]);

  const sincronizzaVisitati = React.useCallback(async () => {
    if (!coppiaId) return;
    const { data, error } = await supabase.rpc('aggiorna_ristoranti_visitati');
    // Un fallimento qui non e' un errore da mostrare: e' un abbellimento, e
    // l'elenco resta corretto anche senza. Ricaricare solo se ha cambiato
    // qualcosa evita una lettura in piu' a ogni apertura.
    if (!error && typeof data === 'number' && data > 0) await ricarica();
  }, [coppiaId, ricarica]);

  return {
    elementi,
    loading,
    errore,
    ricarica,
    aggiungi,
    segnaFatto,
    recensisci,
    elimina,
    collegaPosto,
    aggiungiLuogoPreferito,
    aggiungiFilm,
    riparaLocandine,
    sincronizzaVisitati,
    riparaCopertine,
  };
}

/** Ciò che serve per creare un luogo: e' quanto restituisce una ricerca Google. */
export type LuogoTrovato = {
  nome: string;
  lat: number;
  lng: number;
  placeId?: string;
  fotoNome?: string;
  primaryType?: string;
};

/**
 * Crea un **luogo vero** (D-37, allargato da 0016): dal risultato Google
 * nascono insieme il posto sulla mappa e l'elemento della lista, con identita',
 * copertina e genere. Un solo ingresso per tre fatti, cosi' non esistono luoghi
 * a meta'.
 *
 * ## Perche' e' una funzione autonoma e non un metodo dell'hook (2026-08-28)
 *
 * Perche' i luoghi si aggiungono da **due schermate** — l'elenco e la mappa — e
 * finche' questa logica e' vissuta dentro `usePreferiti`, la mappa non poteva
 * chiamarla: aveva il suo `useLuoghi`, con la sua funzione di inserimento, che
 * scriveva **una riga diversa** per lo stesso posto (B-19).
 *
 * 🔑 Due funzioni che creano la stessa entita' non restano uguali: divergono al
 * primo ritocco, e la differenza si scopre guardando una lista in cui alcune
 * schede hanno la copertina e altre no. Da oggi la funzione e' **una**, e chi
 * ha una lista da rinfrescare ci mette sopra la sua `ricarica`.
 *
 * ⚠️ Restituisce gli **id**, non solo l'esito: serve a chi la chiama dal form
 * dell'evento, dove il ristorante appena nato va anche *selezionato* — senza il
 * suo id l'utente dovrebbe sceglierlo a mano da un elenco in cui e' appena
 * comparso, cioe' rifare il gesto che ha appena fatto.
 */
export async function creaLuogo(
  coppiaId: string | null,
  trovato: LuogoTrovato,
  ricaricaCoppia: () => Promise<StatoCoppia>,
  /**
   * La wishlist in cui finisce (0024).
   *
   * 🔴 **Mancava, ed è il difetto riferito dall'utente** — *«quando aggiungo
   * degli elementi alla wishlist viaggi e ristoranti questi non vengono
   * caricati»*. La riga nasceva con `lista_id` a `null`, cioè fuori da ogni
   * lista, mentre la wishlist filtra **per** `lista_id`: il posto veniva creato
   * davvero, la mappa se ne accorgeva, e la lista da cui lo avevi aggiunto no.
   *
   * 🔑 È **la forma esatta di B-19**: una via di creazione che non scrive un
   * campo che chi legge usa per filtrare. Allora mancavano copertina e genere,
   * oggi manca l'appartenenza — e allora come oggi il sintomo non è un errore,
   * è una cosa che *non compare*.
   *
   * ⚠️ `null` resta legittimo: un posto può nascere **da un evento** (D-44)
   * senza passare da nessuna lista.
   */
  listaId: string | null = null
): Promise<{ errore: string | null; elementoId?: string; luogoId?: string }> {
  const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
  if (!esito.coppiaId) return { errore: esito.errore };

  const { data, error } = await supabase
    .from('luogo')
    .insert({
      coppia_id: esito.coppiaId,
      nome: trovato.nome.trim(),
      lat: trovato.lat,
      lng: trovato.lng,
      stato: 'desiderato',
    })
    .select('id')
    .single();
  if (error) return { errore: error.message };

  const ins = await supabase
    .from('elemento_lista')
    .insert({
      coppia_id: esito.coppiaId,
      tipo: 'luogo',
      titolo: trovato.nome.trim(),
      luogo_id: data.id,
      lista_id: listaId,
      google_place_id: trovato.placeId ?? null,
      foto_google: trovato.fotoNome ?? null,
      genere: trovato.primaryType ?? null,
    })
    .select('id')
    .single();
  if (ins.error) return { errore: ins.error.message };

  return { errore: null, elementoId: ins.data.id, luogoId: data.id };
}

/** L'ultimo film visto: serve al riquadro della home. */
export function ultimoFatto(elementi: Elemento[], tipo: TipoElemento) {
  return (
    elementi
      .filter((e) => e.tipo === tipo && e.stato === 'fatto')
      .sort(
        (a, b) =>
          new Date(b.fatto_il ?? b.creato_il).getTime() -
          new Date(a.fatto_il ?? a.creato_il).getTime()
      )[0] ?? null
  );
}
