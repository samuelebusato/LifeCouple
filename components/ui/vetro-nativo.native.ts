import * as React from 'react';
import { Platform } from 'react-native';

/**
 * Il Liquid Glass di sistema (iOS 26+), **solo per il nativo**.
 *
 * Sta in un file `.native.ts` per la stessa ragione di `mappa-vera`: Metro
 * risolve i `require` **staticamente**, anche dentro un try/catch — e
 * `expo-glass-effect` non ha i moduli per il web, quindi un require nel file
 * condiviso rompeva l'intero bundle web (successo davvero, 2026-08-13).
 *
 * Il try/catch resta per il caso runtime: JS del pacchetto presente ma parte
 * nativa assente (Android, o un Expo Go piu' vecchio).
 *
 * `GlassContainer` (D-40) e' la scatola che fa **fondere fra loro** i vetri che
 * contiene quando si avvicinano: e' cio' che nel video del riferimento fa
 * sembrare la lente della barra una goccia che si stacca e si riattacca. Senza
 * di lui due `GlassView` restano due lastre sovrapposte, non un liquido.
 */
let vista: React.ComponentType<any> | null = null;
let scatola: React.ComponentType<any> | null = null;
let ok = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const g = require('expo-glass-effect');
  if (Platform.OS === 'ios' && g.isLiquidGlassAvailable?.()) {
    vista = g.GlassView;
    scatola = g.GlassContainer ?? null;
    ok = true;
  }
} catch {
  // niente modulo nativo: si resta sui tre strati di vetro.tsx
}

export const GlassView = vista;
export const GlassContainer = scatola;
export const VETRO_NATIVO = ok;

// Diagnostico: senza, "il vetro non sembra vetro" resta un'impressione e non si
// sa se il ripiego e' attivo per scelta del sistema o per un errore nostro.
// Stampa una riga sola all'avvio, nei log di Metro.
console.log(
  `[vetro] Liquid Glass di sistema: ${ok ? 'ATTIVO' : 'NON disponibile — si usa il ripiego'}`
);
