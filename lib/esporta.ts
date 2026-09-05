// ⚠️ API **nuova** di expo-file-system (SDK 54): `File` + `Paths`. La vecchia
// — `FileSystem.writeAsStringAsync`, `FileSystem.cacheDirectory` — non è solo
// deprecata: **lancia a runtime**. Il typecheck l'ha intercettata; senza,
// sarebbe esplosa al primo tocco del bottone, sul telefono.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';

/**
 * **Portabilità dei dati — art. 20 GDPR.**
 *
 * ## Perché è codice e non una voce di backlog
 *
 * Fino al 2026-08-29 l'esportazione stava nel backlog sotto «Dopo l'MVP, non
 * prima», accanto alle notifiche push e ai filtri nelle liste. ⚠️ **Ma non è
 * una funzione: è un diritto.** Un utente europeo può chiederla in qualunque
 * momento, e la risposta «arriverà in una versione futura» non è una risposta
 * ammessa. Dal momento in cui l'app incassa e si pubblica, non averla è una
 * lacuna di conformità, non una voce di roadmap.
 *
 * ## 🔑 Cosa esporta, e perché esattamente questo
 *
 * L'art. 20 riguarda i dati **che riguardano l'interessato** e che ha
 * **fornito lui**. Qui significa: ciò di cui è **autore**, non tutto ciò che
 * vede. È lo stesso confine di **D-21** — la sorte dei contenuti segue
 * l'autore, non la condivisione — e non è una coincidenza: se esportasse anche
 * i contenuti del partner, un membro potrebbe portarsi via i ricordi dell'altro
 * con un bottone, che è precisamente ciò che TB-2 esiste per impedire.
 *
 * ⚠️ **Le foto non ci sono, e va detto invece di lasciarlo scoprire.** Il file
 * contiene i loro *metadati* — quando, dove, quanto pesano — non i binari:
 * un JSON con dentro un gigabyte di immagini non è portabilità, è un file che
 * non si apre. Le immagini si salvano dalla galleria, e l'export lo dice.
 *
 * ## Formato
 *
 * JSON: leggibile da una persona e re-importabile da un programma, che sono le
 * due cose che l'art. 20 chiede insieme («formato strutturato, di uso comune e
 * leggibile da dispositivo automatico»).
 */

/**
 * Le tabelle da cui si prende ciò di cui l'utente è autore.
 *
 * ⚠️ `domanda` **non c'è**, e non è una dimenticanza: non ha `autore_id` — è
 * di coppia, non di persona. Ce l'aveva questo elenco al primo tentativo, e a
 * intercettarlo è stato `tsc`, non una prova. 🔑 È il vantaggio dei tipi
 * generati dallo schema: un elenco di tabelle scritto a mano sbaglia in
 * silenzio, e sarebbe uscito come una riga vuota nell'export di qualcuno.
 */
const TABELLE_PER_AUTORE = [
  'evento',
  'luogo',
  'elemento_lista',
  'lista',
  'recensione',
  'foto',
  'commento',
  'cartella',
] as const;

export type EsitoEsportazione =
  | { ok: true; percorso: string; righe: number }
  | { ok: false; errore: string };

export async function esportaMieiDati(): Promise<EsitoEsportazione> {
  const { data: utente } = await supabase.auth.getUser();
  const io = utente?.user;
  if (!io) return { ok: false, errore: 'non autenticato' };

  const dati: Record<string, unknown> = {};
  let righe = 0;

  // Il conto di ciò che si è caricato, tabella per tabella.
  for (const tabella of TABELLE_PER_AUTORE) {
    const { data, error } = await supabase.from(tabella).select('*').eq('autore_id', io.id);
    // ⚠️ Un errore non si ingoia: un export a cui manca una tabella **senza
    // dirlo** è peggio di un export fallito, perché l'utente crede di avere
    // tutto. Si registra dentro il file, dove resta visibile.
    dati[tabella] = error ? { errore: error.message } : (data ?? []);
    if (!error) righe += data?.length ?? 0;
  }

  // L'appartenenza alla coppia: è un dato che riguarda l'utente, e le date di
  // ingresso e uscita sono sue quanto i contenuti.
  const { data: appartenenza } = await supabase
    .from('membro_coppia')
    .select('coppia_id, entrato_il, uscito_il')
    .eq('utente_id', io.id);

  // Le risposte del questionario (migrazione 0029).
  // ⚠️ Vanno nell'export anche se sono **della coppia** e non dell'autore: sono
  // dati personali di chi esporta, e l'art. 20 non guarda a chi ha premuto il
  // bottone. Sono anche l'unico dato del progetto raccolto su base **consenso**,
  // e proprio per questo devono essere riottenibili — un consenso su dati che
  // non si possono rivedere è un consenso al buio.
  const { data: profilo } = await supabase
    .from('profilo_coppia')
    .select('conosciuto_da, fascia_eta, convivenza, interesse, consenso_il')
    .maybeSingle();

  const documento = {
    formato: 'lifecouple-export-1',
    generato_il: new Date().toISOString(),
    utente: { id: io.id, email: io.email, registrato_il: io.created_at },
    appartenenza_coppia: appartenenza ?? [],
    questionario: profilo ?? null,
    // 🔑 I due limiti dichiarati dentro il file stesso, non solo
    // nell'interfaccia: il file sopravvive alla schermata che l'ha prodotto, e
    // fra sei mesi sarà l'unica cosa che chi lo apre avrà sotto gli occhi.
    nota:
      "Questo file contiene i contenuti di cui sei AUTORE. Non contiene i contenuti caricati dal tuo partner: appartengono a lui, e sono suoi da esportare. Le fotografie sono presenti come metadati (data, luogo, dimensione), non come immagini: le immagini si salvano dalla galleria dell'app.",
    dati,
  };

  const nomeFile = `lifecouple-dati-${new Date().toISOString().slice(0, 10)}.json`;

  let file: File;
  try {
    // La cartella di cache e non quella dei documenti: è un file che si genera
    // per consegnarlo, non da conservare nell'app. Il sistema la svuota da sé.
    file = new File(Paths.cache, nomeFile);
    // `overwrite`: due export nello stesso giorno hanno lo stesso nome, e senza
    // questo il secondo fallirebbe su un file che esiste già.
    file.create({ overwrite: true });
    file.write(JSON.stringify(documento, null, 2));
  } catch (e) {
    return { ok: false, errore: e instanceof Error ? e.message : 'scrittura non riuscita' };
  }

  // ⚠️ Se la condivisione non è disponibile il file **esiste comunque**: si
  // torna il percorso invece di fallire, così l'utente non perde il lavoro
  // fatto per un foglio di sistema che non si è aperto.
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: nomeFile,
      UTI: 'public.json',
    });
  }

  return { ok: true, percorso: file.uri, righe };
}
