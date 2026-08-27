import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * I **token del movimento**: le molle, le durate e i ritardi dell'app.
 *
 * Esiste per lo stesso motivo per cui esiste `lib/tema.ts`. Li' i colori stanno
 * in un posto solo perche' due magenta leggermente diversi si notano; qui le
 * molle stanno in un posto solo perche' **due movimenti leggermente diversi si
 * notano ancora di piu'**: il colore lo confronti solo se i due elementi sono
 * vicini, il movimento lo confronti con il ricordo di trenta secondi fa. Una
 * carta che sale con `damping: 18` e un'altra con `damping: 24` non sembrano
 * due scelte, sembrano un difetto.
 *
 * ⚠️ **Molle, non durate**, dove si puo'. Una molla ha una massa e arriva col
 * suo peso; una durata fissa arriva quando e' scaduto il cronometro. La
 * differenza si sente sul dito: `withTiming` resta per le cose che *svaniscono*
 * (velature, uscite), dove non c'e' nessun oggetto che si muove.
 *
 * ## La taratura, e perche' e' questa
 *
 * `tocco` e' **rigida e cortissima**: il riscontro del dito deve arrivare
 * mentre il dito e' ancora giu'. Una molla morbida sul tocco si legge come
 * lentezza dell'app, non come eleganza — la stessa lezione gia' scritta nella
 * barra volante ("una molla lenta su un gesto che si ripete decine di volte al
 * giorno diventa attesa").
 *
 * `entrata` e' la piu' morbida delle tre: la usano le cose che *compaiono*, che
 * si guardano una volta e devono farsi notare.
 *
 * `scivolo` sta in mezzo: la usano le cose che si **spostano** restando dove
 * sono — l'indicatore di un interruttore, una carta che cambia posto.
 */
export const molla = {
  /** Il dito preme e la superficie cede. Rigidissima: dev'essere gia' finita. */
  tocco: { damping: 20, stiffness: 420, mass: 0.55 },
  /** Qualcosa entra in scena. Morbida, ma senza rimbalzo: non e' un giocattolo. */
  entrata: { damping: 19, stiffness: 200, mass: 0.9 },
  /** Qualcosa si sposta da un punto all'altro restando visibile. */
  scivolo: { damping: 22, stiffness: 260, mass: 0.85 },
} as const;

/** Le durate, per cio' che sfuma invece di muoversi. In millisecondi. */
export const durata = {
  /** Un cambio di stato che non deve nemmeno essere percepito come animato. */
  lampo: 110,
  /** L'entrata di una velatura. */
  breve: 170,
  /** L'uscita: **sempre piu' corta dell'entrata**. Si veda sotto. */
  uscita: 150,
  /** Un incrocio in dissolvenza fra due contenuti. */
  media: 220,
} as const;

/**
 * Il ritardo fra un elemento e il successivo in una **cascata**.
 *
 * ⚠️ E c'e' un **tetto**, che e' la parte che si sbaglia. Con un ritardo di 45ms
 * e venti schede, l'ultima parte dopo quasi un secondo: chi scorre subito vede
 * righe che si accendono sotto il dito mentre scorre, e sembra un'app che non
 * sta dietro. Oltre `CASCATA_MAX` elementi il ritardo si ferma, cosi' la coda
 * dell'elenco entra tutta insieme — nessuno la sta guardando comunque.
 */
export const CASCATA = 45;
export const CASCATA_MAX = 6;

/** Il ritardo dell'elemento `i` in una cascata, col tetto gia' applicato. */
export function cascata(i: number) {
  return Math.min(i, CASCATA_MAX) * CASCATA;
}

/**
 * Il **riscontro tattile**.
 *
 * ⚠️ Volutamente parco, e questa e' una decisione, non una dimenticanza: si
 * accende sui comandi che **fanno accadere qualcosa** (un bottone, la scelta di
 * una vista), mai sullo scorrimento o sull'apertura di una schermata. Un'app
 * che vibra a ogni tocco smette di comunicare con la vibrazione — diventa
 * rumore, e la prima cosa che si cerca e' come spegnerla.
 *
 * ⚠️ **Sul web non esiste**, e `expo-haptics` li' restituisce una promessa
 * rifiutata: senza il `catch` sarebbe un "unhandled rejection" a ogni tocco
 * nella preview. La chiamata e' volutamente **non attesa** — un riscontro
 * tattile che facesse aspettare l'azione sarebbe il contrario del suo scopo.
 */
export function tatto(tipo: 'tocco' | 'scelta' | 'fatto' = 'tocco') {
  if (Platform.OS === 'web') return;
  const p =
    tipo === 'scelta'
      ? Haptics.selectionAsync()
      : tipo === 'fatto'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  p?.catch(() => {});
}
