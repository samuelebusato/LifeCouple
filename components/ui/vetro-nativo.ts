import type * as React from 'react';

/**
 * La versione **web**: il Liquid Glass di sistema non esiste, e il pacchetto
 * `expo-glass-effect` non e' nemmeno risolvibile da Metro sul web. Questo file
 * lo dice in anticipo, cosi' `vetro.tsx` usa i tre strati senza tentare.
 * (Gemello di `vetro-nativo.native.ts` — vedi il perche' la'.)
 */
export const GlassView: React.ComponentType<any> | null = null;
export const GlassContainer: React.ComponentType<any> | null = null;
export const VETRO_NATIVO = false;
