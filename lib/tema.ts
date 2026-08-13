import { useColorScheme } from 'react-native';

/**
 * I colori **letterali** della direzione "Quarzo rosa" (seconda taratura:
 * tonalita' 347-351, il viola e' stato tolto su richiesta del 2026-08-13).
 *
 * Perche' questo file esiste, visto che `global.css` dice che i colori si
 * definiscono la' e basta: `expo-blur`, `expo-linear-gradient`, le icone di
 * `lucide-react-native` e `ActivityIndicator` non leggono le variabili CSS —
 * vogliono stringhe.
 *
 * **Regola per non far divergere le due case**: qui stanno solo i valori che
 * NON possono essere espressi come classe. Se un colore puo' essere una
 * classe, non deve stare qui. I valori sono i token di `global.css` convertiti
 * in esadecimale; il commento accanto riporta l'HSL di origine.
 */

const chiaro = {
  sfondo: '#ffffff', //   quarta taratura "Barbie": bianco + magenta + pastelli
  testo: '#251d22', //    325 12% 13%
  tenue: '#816e7b', //    320 8% 47%
  accento: '#e4259e', //  322 78% 52% — il magenta delle azioni
  suAccento: '#ffffff',
  pericolo: '#d93226', // 4 70% 50%
  carta: '#ffffff',
  /** L'alone dietro un'icona attiva: l'accento a bassissima opacita'. */
  alone: 'rgba(228,37,158,0.09)',
  aloneForte: 'rgba(228,37,158,0.15)',
};

const scuro = {
  sfondo: '#141012', //   322 12% 7%
  testo: '#f5f0f3', //    325 20% 95%
  tenue: '#ab9ca5', //    322 8% 64%
  accento: '#f25fbc', //  322 85% 66%
  suAccento: '#141012',
  pericolo: '#e05b52', // 4 70% 60%
  carta: '#1f191d', //    322 10% 11%
  alone: 'rgba(242,95,188,0.15)',
  aloneForte: 'rgba(242,95,188,0.22)',
};

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
 * "non si vedeva nessun effetto". Il velo scende, l'intensita' sale: il vetro
 * deve far intuire cio' che ci passa sotto, altrimenti e' plastica.
 */
const vetroChiaro: Vetro = {
  tinta: 'light',
  intensita: 55,
  velo: ['rgba(255,255,255,0.52)', 'rgba(255,240,245,0.26)'],
  riflesso: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'],
  bordo: 'rgba(255,255,255,0.85)',
  bordoBasso: 'rgba(214,67,96,0.14)',
  ombra: 'rgba(130,32,55,0.20)',
};

const vetroScuro: Vetro = {
  tinta: 'dark',
  intensita: 55,
  velo: ['rgba(70,46,52,0.44)', 'rgba(32,20,23,0.30)'],
  riflesso: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)'],
  bordo: 'rgba(255,255,255,0.15)',
  bordoBasso: 'rgba(236,121,142,0.16)',
  ombra: 'rgba(0,0,0,0.55)',
};

export type Tema = {
  scuro: boolean;
  c: typeof chiaro;
  vetro: Vetro;
};

/** Il tema segue il dispositivo, come la lingua (D-24). */
export function useTema(): Tema {
  const schema = useColorScheme();
  const eScuro = schema === 'dark';
  return {
    scuro: eScuro,
    c: eScuro ? scuro : chiaro,
    vetro: eScuro ? vetroScuro : vetroChiaro,
  };
}

/**
 * Sfumature di fondo per le schermate: bianco in alto, un velo di rosa in
 * basso. E' cio' che da' al vetro qualcosa da lasciar trasparire — su un fondo
 * piatto la sfocatura non ha niente da mostrare e sembra grigia.
 */
// Quarta taratura, dallo screenshot Barbie: la pagina attraversa i due
// pastelli — azzurro in alto, rosa in basso — col bianco al centro dove vive
// il contenuto. La diagonale la mette `Fondo` (start/end), non i colori.
export const fondoChiaro = ['#d8eafc', '#ffffff', '#fcdcef'] as const;
export const fondoScuro = ['#10131a', '#141012', '#1e1119'] as const;

export function fondo(scuroAttivo: boolean) {
  return (scuroAttivo ? fondoScuro : fondoChiaro) as unknown as [string, string, string];
}
