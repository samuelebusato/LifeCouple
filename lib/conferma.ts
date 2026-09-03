import { Alert, Platform } from 'react-native';
import { t } from '@/lib/i18n';

/**
 * **La domanda prima di buttare via** (D-94, 2026-09-03).
 *
 * ## Perché è una funzione sola e non sei `Alert.alert` copiati
 *
 * Le conferme nel progetto erano tre — le due foto e il «togli dall'evento» —
 * scritte a mano, e sei eliminazioni ne erano rimaste senza: l'evento dal
 * calendario, la cartella, il commento, il posto sulla mappa, il posto dalle
 * liste, la carta di gioco. Non per distrazione: perché **non c'era un posto
 * dove la regola vivesse**, quindi ogni schermata nuova ripartiva dalla memoria
 * di chi la scriveva.
 *
 * 🔑 È la lezione di **D-60** e **D-85**, alla lettera: *una regola che dipende
 * dalla memoria di chi scrive la prossima schermata non è una regola, è una
 * speranza*. Con questa funzione la prossima eliminazione ha un solo modo
 * ovvio di essere scritta, e chi legge il codice vede la conferma accanto alla
 * cancellazione invece di doverla cercare.
 *
 * ## Cosa deve dire la nota, e cosa non deve dire
 *
 * ⚠️ **«Sei sicuro?» non è una domanda**: non aggiunge niente a quello che chi
 * preme già sa, e insegna a premere «sì» senza leggere. La nota dice invece
 * **cosa si porta via** — se sparisce anche per il partner, se le foto restano,
 * quante voci se ne vanno. È la regola già scritta per le liste il 2026-08-30
 * (`t.liste.eliminaNota`), qui estesa a tutte le altre.
 *
 * ## Due dettagli che non sono estetici
 *
 * ⚠️ **L'azione distruttiva è la seconda**, e ha `style: 'destructive'`: su iOS
 * la prima posizione con `style: 'cancel'` è quella che il pollice trova per
 * prima e che l'`Esc` sceglie; su Android il primo bottone finisce a sinistra e
 * il tocco fuori dal riquadro annulla. In tutti e due i casi **la via facile è
 * non cancellare**, che è l'unico verso accettabile per un'azione irreversibile.
 *
 * ⚠️ **`onConferma` può essere asincrona e il suo errore non si perde**: la
 * `Promise` viene attesa qui dentro, e se fallisce l'errore arriva a
 * `onErrore`. Un `onPress` che lancia dentro un `Alert` sparisce senza traccia
 * (B-35: *una scrittura di cui non si guarda l'esito è una scrittura che si
 * spera sia avvenuta*).
 */
export function chiediConferma({
  titolo,
  nota,
  azione,
  onConferma,
  onErrore,
}: {
  /** La domanda, breve: «Eliminare l'evento?» */
  titolo: string;
  /** Cosa si porta via. Mai «sei sicuro?». */
  nota: string;
  /** L'etichetta del bottone rosso. Default: «Elimina». */
  azione?: string;
  onConferma: () => void | Promise<void | string | null>;
  /** Riceve il messaggio d'errore, se la cancellazione ne restituisce uno. */
  onErrore?: (messaggio: string) => void;
}) {
  /** L'esito, comunque si sia chiesto: si esegue in un posto solo. */
  const procedi = () => {
    void (async () => {
      try {
        // Chi cancella restituisce `string` sull'errore e `null` quando è
        // andata: le due convenzioni del progetto convivono qui, così i
        // punti di chiamata non devono adattarsi alla funzione.
        const esito = await onConferma();
        if (typeof esito === 'string' && esito) onErrore?.(esito);
      } catch (e) {
        onErrore?.(e instanceof Error ? e.message : String(e));
      }
    })();
  };

  /**
   * 🔴 **Sul web `Alert.alert` non esiste: è una funzione vuota.**
   *
   * In `react-native-web` la classe è letteralmente `class Alert { static
   * alert() {} }`. Senza questo ramo, ogni comando che passa di qui sarebbe
   * **morto nella preview**: nessuna domanda e nessuna cancellazione — e chi
   * verifica sul web leggerebbe «il cestino non funziona», che è un sintomo
   * falso e costa un giro di diagnosi. Vale anche per le due conferme sulle
   * foto, che avevano il problema da prima e in silenzio.
   *
   * ⚠️ Il web resta **solo preview** (D-28): questo ramo serve a poterci
   * provare le schermate, non a promettere che il web sia una piattaforma.
   */
  if (Platform.OS === 'web') {
    const conferma = typeof globalThis.confirm === 'function' ? globalThis.confirm : null;
    // Senza `confirm` (rendering fuori dal browser) non si inventa un consenso:
    // non si cancella, e chi guarda il comando lo vede semplicemente non fare
    // nulla — che è il fallimento giusto per un'azione irreversibile.
    if (conferma?.(`${titolo}\n\n${nota}`)) procedi();
    return;
  }

  Alert.alert(titolo, nota, [
    { text: t.conferma.annulla, style: 'cancel' },
    {
      text: azione ?? t.conferma.elimina,
      style: 'destructive',
      onPress: procedi,
    },
  ]);
}
