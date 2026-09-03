import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase';

/**
 * Le foto: scelta, compressione, caricamento, indirizzo firmato.
 *
 * **Si comprime prima di caricare** (D-06): l'originale resta sul telefono,
 * dove gia' e'. E' l'unica funzione a costo non limitato del progetto, e il
 * tetto di 1 GB per coppia lo impone un trigger sul database (D-22) — non un
 * controllo qui, che si potrebbe aggirare.
 *
 * Il percorso e' `<coppia_id>/<uuid>.jpg`: la prima cartella e' il confine su
 * cui poggiano le policy dello storage (0009), le stesse di `e_membro_attivo`.
 */

const LATO_MAX = 1600;
const QUALITA = 0.7;

export async function scegliFoto() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return { negato: true, immagini: [] as ImagePicker.ImagePickerAsset[] };
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });
  return { negato: false, immagini: r.canceled ? [] : r.assets };
}

/** Ridimensiona e comprime: quello che si carica non e' l'originale. */
async function comprimi(uri: string) {
  const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
  ctx.resize({ width: LATO_MAX });
  const reso = await ctx.renderAsync();
  return reso.saveAsync({ compress: QUALITA, format: ImageManipulator.SaveFormat.JPEG });
}

/**
 * Quante foto si comprimono e caricano **insieme**.
 *
 * ⚠️ Prima erano in fila indiana: dieci foto volevano dire dieci cicli
 * comprimi-carica uno dopo l'altro, e l'attesa era la loro somma — e' il
 * «molto lente a caricarsi». La compressione usa la CPU e il caricamento la
 * rete: mentre una comprime, un'altra puo' gia' star salendo.
 *
 * Tre e non dieci: oltre, si contendono la banda e la memoria (ogni immagine
 * decompressa sta in RAM per intero) senza che il totale migliori. Su una rete
 * lenta il collo di bottiglia diventa la banda comunque.
 */
const INSIEME = 3;

export async function caricaFoto(
  coppiaId: string,
  immagini: { uri: string }[],
  legami?: {
    eventoId?: string | null;
    luogoId?: string | null;
    cartellaId?: string | null;
    elementoId?: string | null;
  },
  /** Chiamato dopo ogni foto: serve a dire "3 di 10" invece di far aspettare. */
  avanzamento?: (fatte: number, totale: number) => void
): Promise<{ caricate: number; errore: string | null }> {
  let caricate = 0;
  let primoErrore: string | null = null;

  /** Una foto sola: comprimi, carica, scrivi la riga. */
  const una = async (img: { uri: string }): Promise<string | null> => {
    try {
      const piccola = await comprimi(img.uri);
      // 🔑 Il file compresso si legge con expo-file-system, non con `fetch`
      // (aggiornamento a SDK 56, 2026-09-03): da SDK 56 il `fetch` globale è
      // `expo/fetch`, che su Android passa da OkHttp e non apre gli URI
      // `file://`. La classe `File` legge un file locale su tutte e due le
      // piattaforme, ed è la stessa API già usata in `lib/esporta.ts`.
      const dati = await new File(piccola.uri).arrayBuffer();
      const chiave = `${coppiaId}/${Date.now()}-${Math.round(dati.byteLength)}.jpg`;

      const su = await supabase.storage
        .from('foto')
        .upload(chiave, dati, { contentType: 'image/jpeg', upsert: false });
      if (su.error) return su.error.message;

      // La riga arriva **dopo** il file: se fallisse l'inserimento (per esempio
      // per il tetto di 1 GB) resterebbe un file orfano, che e' meno grave di
      // una riga che punta a un file inesistente.
      const { error } = await supabase.from('foto').insert({
        coppia_id: coppiaId,
        chiave_storage: chiave,
        byte: dati.byteLength,
        evento_id: legami?.eventoId ?? null,
        luogo_id: legami?.luogoId ?? null,
        // Caricare stando dentro una cartella ce le mette: e' l'unico momento in
        // cui l'intenzione e' gia' chiara senza chiederla.
        cartella_id: legami?.cartellaId ?? null,
        elemento_id: legami?.elementoId ?? null,
      });
      if (error) {
        await supabase.storage.from('foto').remove([chiave]);
        return error.message;
      }
      return null;
    } catch (e) {
      return String(e);
    }
  };

  // A blocchi di `INSIEME`. Un errore **non** ferma le altre del blocco — sono
  // gia' partite — ma ferma i blocchi successivi: se il tetto di 1 GB e' pieno,
  // insistere altre sette volte produce sette errori identici.
  for (let i = 0; i < immagini.length; i += INSIEME) {
    const blocco = immagini.slice(i, i + INSIEME);
    const esiti = await Promise.all(blocco.map(una));
    for (const e of esiti) {
      if (e) primoErrore ??= e;
      else caricate++;
    }
    avanzamento?.(Math.min(i + blocco.length, immagini.length), immagini.length);
    if (primoErrore) break;
  }
  return { caricate, errore: primoErrore };
}

/**
 * Indirizzi firmati e temporanei: un'ora, poi non aprono piu' niente. Un
 * indirizzo che non scade e' una foto pubblica con un nome difficile.
 */
export async function indirizziFirmati(chiavi: string[]) {
  if (chiavi.length === 0) return {} as Record<string, string>;

  // ⚠️ **Un'ora era troppo poco.** Le anteprime nei preferiti si caricavano
  // "a volte": chi tiene l'app aperta, o torna su una schermata gia' montata
  // dopo un po', si ritrovava indirizzi scaduti e riquadri vuoti. Otto ore
  // coprono una giornata d'uso senza allungare la finestra oltre il ragionevole
  // — il bucket resta privato, e questi indirizzi non escono dal telefono.
  const DURATA = 8 * 3600;

  // ⚠️ E a **blocchi**. `createSignedUrls` con centinaia di chiavi in una
  // richiesta sola e' il punto in cui la risposta puo' tornare parziale: gli
  // indirizzi mancanti diventano immagini che non compaiono, in modo
  // apparentemente casuale — che e' esattamente il sintomo riferito.
  const BLOCCO = 60;
  const m: Record<string, string> = {};
  for (let i = 0; i < chiavi.length; i += BLOCCO) {
    const { data } = await supabase.storage
      .from('foto')
      .createSignedUrls(chiavi.slice(i, i + BLOCCO), DURATA);
    for (const r of data ?? []) if (r.path && r.signedUrl) m[r.path] = r.signedUrl;
  }
  return m;
}

/**
 * Una foto per evento, con l'indirizzo gia' firmato: e' cio' che serve alle
 * anteprime nell'elenco degli eventi.
 *
 * Una sola richiesta per l'intero elenco invece di una per riga: su una
 * schermata che si scorre, N richieste sono N attese.
 */
export async function anteprimePerEvento(eventiIds: string[]) {
  if (eventiIds.length === 0) return {} as Record<string, string>;
  const { data } = await supabase
    .from('foto')
    .select('evento_id, chiave_storage, creato_il')
    .in('evento_id', eventiIds)
    .order('creato_il', { ascending: true });

  // La prima caricata vince: e' quella che di solito racconta la giornata.
  const prima = new Map<string, string>();
  for (const r of data ?? []) {
    if (r.evento_id && !prima.has(r.evento_id)) prima.set(r.evento_id, r.chiave_storage);
  }
  const firmati = await indirizziFirmati([...prima.values()]);
  const perEvento: Record<string, string> = {};
  for (const [idEvento, chiave] of prima) {
    if (firmati[chiave]) perEvento[idEvento] = firmati[chiave];
  }
  return perEvento;
}

/**
 * La copertina di film e ristoranti: stessa forma di `anteprimePerEvento`.
 *
 * Una richiesta sola per tutto l'elenco, e la **prima caricata vince** — la
 * locandina la mette chi ha aggiunto il film, e non ha senso che cambi da sola
 * quando l'altro aggiunge una foto della serata.
 */
export async function copertinePerElemento(elementiIds: string[]) {
  if (elementiIds.length === 0) return {} as Record<string, string>;
  const { data } = await supabase
    .from('foto')
    .select('elemento_id, chiave_storage, creato_il')
    .in('elemento_id', elementiIds)
    .order('creato_il', { ascending: true });

  const prima = new Map<string, string>();
  for (const r of data ?? []) {
    if (r.elemento_id && !prima.has(r.elemento_id)) prima.set(r.elemento_id, r.chiave_storage);
  }
  const firmati = await indirizziFirmati([...prima.values()]);
  const per: Record<string, string> = {};
  for (const [id, chiave] of prima) if (firmati[chiave]) per[id] = firmati[chiave];
  return per;
}

/**
 * Cancella prima il file, poi la riga.
 *
 * In quest'ordine perche' Supabase **vieta** di toccare `storage.objects` da un
 * trigger (lo si e' scoperto con un test rosso, non leggendo il codice: la
 * cancellazione falliva del tutto). Se l'app muore fra i due passi resta un
 * file orfano — invisibile, perche' il bucket e' privato e nessuna riga lo
 * indica — che e' il male minore rispetto a una riga che punta al vuoto.
 */
/**
 * Tutte le foto **degli eventi** di ogni luogo della lista.
 *
 * Chiesto dall'utente il 2026-08-27: «ai luoghi sono associate tutte le
 * immagini di tutti gli eventi associati a quei luoghi».
 *
 * ## Perche' non basta `copertinePerElemento`
 *
 * Quella guarda le foto legate **direttamente** all'elemento (`elemento_id`),
 * cioe' la copertina scelta a mano. Le foto di una serata invece nascono
 * attaccate all'**evento** (`evento_id`), e nessuno le collegava al luogo: un
 * posto dove eravate stati tre volte, con venti foto, mostrava ancora
 * l'immagine di Google.
 *
 * ## Due letture, non una per luogo
 *
 * PostgREST non fa sottoquery, quindi il legame `foto → evento → elemento` si
 * percorre in due passi: prima gli eventi dei luoghi, poi le foto di quegli
 * eventi. Sono **due richieste in tutto**, non due per luogo — con dieci posti
 * in lista la differenza e' fra 2 e 20.
 *
 * Ordinate dalla piu' recente: la copertina di un posto e' l'ultima volta che
 * ci siete stati, non la prima.
 */
export async function fotoDegliEventiPerElemento(
  luoghi: { id: string; luogo_id: string | null }[]
) {
  const vuoto = {} as Record<string, string[]>;
  if (luoghi.length === 0) return vuoto;

  // 1. quali eventi appartengono a quali luoghi
  //
  // ⚠️ **Due legami, non uno.** Un evento puo' puntare al posto in due modi:
  // `elemento_id` (la scheda in lista, da 0012) oppure `luogo_id` (il posto
  // sulla mappa, da 0008). Gli eventi creati prima che il campo "dove"
  // impostasse entrambi hanno **solo** il secondo — e cercandoli per il primo
  // risultavano zero. E' la ragione per cui un posto con tre serate alle spalle
  // mostrava l'immagine di Google e nessuna serata: non e' che le foto non
  // c'erano, e' che non si guardava dove stavano.
  const idElementi = luoghi.map((l) => l.id);
  const idPosti = luoghi.map((l) => l.luogo_id).filter((x): x is string => !!x);
  const perPosto = new Map<string, string>();
  for (const l of luoghi) if (l.luogo_id) perPosto.set(l.luogo_id, l.id);

  const { data: eventi } = await supabase
    .from('evento')
    .select('id, elemento_id, luogo_id')
    .or(
      [
        idElementi.length ? `elemento_id.in.(${idElementi.join(',')})` : null,
        idPosti.length ? `luogo_id.in.(${idPosti.join(',')})` : null,
      ]
        .filter(Boolean)
        .join(',')
    );
  if (!eventi || eventi.length === 0) return vuoto;

  const luogoDiEvento = new Map<string, string>();
  for (const e of eventi) {
    // `elemento_id` vince: e' il legame esplicito.
    const id = e.elemento_id ?? (e.luogo_id ? perPosto.get(e.luogo_id) : undefined);
    if (id) luogoDiEvento.set(e.id, id);
  }

  // 2. le foto di quegli eventi
  const { data: foto } = await supabase
    .from('foto')
    .select('evento_id, chiave_storage, creato_il')
    .in('evento_id', [...luogoDiEvento.keys()])
    .order('creato_il', { ascending: false });
  if (!foto || foto.length === 0) return vuoto;

  // Non tutte: la striscia ne mostra sei e la copertina una. Firmarne
  // centinaia per mostrarne sei e' lavoro e attesa per niente — e allunga la
  // richiesta proprio dove tornava parziale.
  const MAX_PER_LUOGO = 12;
  const conta: Record<string, number> = {};
  const scelte = foto.filter((f) => {
    const idLuogo = f.evento_id ? luogoDiEvento.get(f.evento_id) : undefined;
    if (!idLuogo) return false;
    conta[idLuogo] = (conta[idLuogo] ?? 0) + 1;
    return conta[idLuogo] <= MAX_PER_LUOGO;
  });

  const firmati = await indirizziFirmati(scelte.map((f) => f.chiave_storage));
  const perLuogo: Record<string, string[]> = {};
  for (const f of scelte) {
    const idLuogo = f.evento_id ? luogoDiEvento.get(f.evento_id) : undefined;
    const url = firmati[f.chiave_storage];
    if (!idLuogo || !url) continue;
    (perLuogo[idLuogo] ??= []).push(url);
  }
  return perLuogo;
}

export async function cancellaFoto(id: string, chiave?: string) {
  if (chiave) await supabase.storage.from('foto').remove([chiave]);
  const { error } = await supabase.from('foto').delete().eq('id', id);
  return error?.message ?? null;
}

/**
 * Togliere una foto **da un evento** senza cancellarla.
 *
 * ⚠️ Non e' la stessa cosa di `cancellaFoto`, e la differenza e' una decisione
 * di prodotto, non un dettaglio (chiesta dall'utente il 2026-08-27):
 *
 *   dalla **galleria** → si elimina davvero: sparisce anche dagli eventi,
 *                        perche' la galleria e' dove la foto *vive*;
 *   da un **evento**   → si stacca soltanto: resta in galleria, perche'
 *                        «questa foto non c'entra con questa serata» non vuol
 *                        dire «questa foto non deve esistere».
 *
 * Confonderle sarebbe la peggiore delle due direzioni: chi voleva riordinare un
 * evento si ritroverebbe un ricordo cancellato, e non c'e' cestino da cui
 * ripescarlo.
 *
 * Il file nello storage non si tocca: la riga resta, e punta ancora a lui.
 */
export async function staccaDaEvento(id: string) {
  const { error } = await supabase.from('foto').update({ evento_id: null }).eq('id', id);
  return error?.message ?? null;
}
