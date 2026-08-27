/**
 * I colori **letterali** della direzione "Quarzo rosa / Barbie".
 *
 * Perche' questo file esiste, visto che `global.css` dice che i colori si
 * definiscono la' e basta: `expo-blur`, `expo-linear-gradient`, le icone di
 * `lucide-react-native`, `react-native-maps` e `ActivityIndicator` non leggono
 * le variabili CSS — vogliono stringhe.
 *
 * **Regola per non far divergere le due case**: qui stanno solo i valori che
 * NON possono essere espressi come classe. Se un colore puo' essere una
 * classe, non deve stare qui. I valori sono i token di `global.css` convertiti
 * in esadecimale; il commento accanto riporta l'HSL di origine.
 *
 * ## ⚠️ Una modalita' sola (D-39, 2026-08-27)
 *
 * Non esiste piu' il tema scuro. La palette e' **una**, chiara, e non dipende
 * dalle impostazioni del telefono: le tinte scelte sono le uniche che qualcuno
 * vedra' davvero, dove prima meta' del lavoro di taratura finiva su schermate
 * che nessuno guardava.
 *
 * ⚠️ **Togliere la modalita' NON ha chiuso B-02**, ed e' istruttivo: l'errore
 * NativeWind "Cannot manually set color scheme" e' rimasto identico dopo aver
 * cancellato ogni token scuro e messo `userInterfaceStyle: light`. La causa non
 * era *avere* due modalita', era il `darkMode: 'media'` di NativeWind, che
 * rifiuta qualunque impostazione manuale — e Expo ne fa una a ogni render.
 * La correzione sta in `tailwind.config.js` (`darkMode: 'class'`), verificata
 * nella console del browser il 2026-08-27.
 */

/** La palette. Unica: non c'e' un gemello scuro da tenere allineato. */
const colori = {
  sfondo: '#ffffff', //   bianco + magenta + pastelli
  testo: '#251d22', //    325 12% 13%
  tenue: '#816e7b', //    320 8% 47%
  /** Ancora piu' tenue del tenue: separatori, righe della griglia oraria. */
  linea: '#ede4ea',
  accento: '#e4259e', //  322 78% 52% — il magenta delle azioni
  suAccento: '#ffffff',
  pericolo: '#d93226', // 4 70% 50%
  carta: '#ffffff',
  /** L'alone dietro un'icona attiva: l'accento a bassissima opacita'. */
  alone: 'rgba(228,37,158,0.09)',
  aloneForte: 'rgba(228,37,158,0.15)',
  /** L'ambra dei ristoranti: un colore che dice "questo si mangia" (0012). */
  ambra: '#d98e2b',
  /** La riga dell'ora corrente nell'agenda: rossa, come su ogni calendario. */
  adesso: '#e5484d',
};

/**
 * Le tinte pastello delle **pillole degli eventi** (riferimento: lo shot
 * Exyte). Fondo tenue + testo scuro della stessa famiglia: si leggono a
 * corpo 11 e restano distinguibili l'una dall'altra a colpo d'occhio, che e'
 * l'unica cosa che conta in una cella di calendario larga cinquanta punti.
 *
 * Un colore per **tipo di evento**: il tipo si riconosce senza aprire nulla.
 */
export const pastelli = {
  impegno: { fondo: '#dbe9fd', testo: '#2b4b7a', barra: '#7aa7e8' },
  romantico: { fondo: '#fcdcef', testo: '#9d1f6b', barra: '#ef8fc6' },
  vacanza: { fondo: '#d6f0e2', testo: '#2f6b48', barra: '#6cbf93' },
  speciale: { fondo: '#fdeecd', testo: '#8a5a12', barra: '#e6b45c' },
} as const;

export type Pastello = (typeof pastelli)[keyof typeof pastelli];

type Vetro = {
  /** Tinta della sfocatura di sistema. */
  tinta: 'light' | 'dark';
  intensita: number;
  velo: readonly [string, string];
  riflesso: readonly [string, string];
  bordo: string;
  bordoBasso: string;
  ombra: string;
};

/**
 * Il vetro (fallback per iOS < 26 e Android — su iOS 26 c'e' il Liquid Glass
 * nativo, vedi `components/ui/vetro.tsx`).
 *
 * Prima taratura troppo lattiginosa: il velo a 0.74 copriva la sfocatura e
 * "non si vedeva nessun effetto". Il velo e' leggero apposta: il vetro deve
 * far intuire cio' che ci passa sotto, altrimenti e' plastica.
 */
const vetro: Vetro = {
  tinta: 'light',
  intensita: 55,
  velo: ['rgba(255,255,255,0.52)', 'rgba(255,240,245,0.26)'],
  riflesso: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'],
  bordo: 'rgba(255,255,255,0.85)',
  bordoBasso: 'rgba(214,67,96,0.14)',
  ombra: 'rgba(130,32,55,0.20)',
};

export type Tema = {
  c: typeof colori;
  vetro: Vetro;
};

const TEMA: Tema = { c: colori, vetro };

/**
 * Il tema. **Non e' piu' un hook** — non c'e' piu' niente da osservare, la
 * palette e' una costante (D-39).
 *
 * Il nome resta `useTema` di proposito: e' chiamato in una trentina di punti,
 * e rinominarlo sarebbe stato un diff enorme che non cambia una riga di
 * comportamento. Resta invocabile solo dentro i componenti, come prima.
 */
export function useTema(): Tema {
  return TEMA;
}

/** Comodo per chi disegna fuori da un componente (marker, funzioni pure). */
export const C = colori;

/**
 * Sfumature di fondo per le schermate: azzurro pastello in alto a sinistra,
 * bianco al centro dove vive il contenuto, rosa in basso a destra.
 *
 * Non e' decorazione: il vetro **prende quello che ha sotto**, e su un colore
 * piatto la sfocatura non ha niente da mescolare. E' cio' che fa esistere il
 * vetro.
 */
export const FONDO = ['#d8eafc', '#ffffff', '#fcdcef'] as [string, string, string];

/**
 * La sfumatura della **testata del calendario** (riferimento: lo shot Exyte,
 * dove il blocco in alto e' un gradiente che si arrotonda sul bianco).
 *
 * Va da azzurro a rosa passando per il magenta tenue: e' la famiglia di
 * `FONDO`, qualche grado piu' satura, perche' un blocco che deve *staccarsi*
 * dal bianco non puo' essere quasi bianco.
 */
export const FONDO_TESTATA = ['#9dc0f4', '#eb92cb', '#f58fa8'] as [string, string, string];

/**
 * Il testo **sopra** la testata sfumata: prugna scura, non bianco.
 *
 * ⚠️ Qui il riferimento non si copia. Nello shot Exyte il titolo e' bianco, ma
 * il suo gradiente e' molto piu' scuro del nostro; su questi pastelli il bianco
 * dava circa 2:1 di contrasto — sotto il minimo perfino per il testo grande.
 * La prugna sullo stesso gradiente sta intorno a 6:1. Si e' tenuta la
 * *struttura* del riferimento (blocco colorato che si arrotonda sul bianco) e
 * si e' cambiato cio' che sul nostro colore non avrebbe funzionato.
 */
export const SU_TESTATA = '#3d1a2e';
export const SU_TESTATA_TENUE = 'rgba(61,26,46,0.62)';
