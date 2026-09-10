/**
 * Funzioni nascoste temporaneamente dall'interfaccia.
 *
 * ⚠️ NASCOSTE, NON RIMOSSE. Qui non si cancella niente: né righe in banca
 * dati, né codice, né migrazioni. Le liste, gli elementi e le locandine già
 * inseriti restano dove sono e ricompaiono intatti rimettendo `false` qui
 * sotto. È una decisione dell'utente del 2026-09-10.
 */

/**
 * La lista «Film» e tutto ciò che dipende da TMDB.
 *
 * **Perché**: le locandine arrivano da TMDB, che è gratuito solo per uso
 * **non commerciale**, e LifeCouple nasce con gli abbonamenti attivi — quindi
 * commerciale dal primo giorno. Finché la licenza non è risolta (backlog:
 * licenza TMDB, TheTVDB, o la foto della coppia al posto della locandina), la
 * funzione resta fuori dalla portata dell'utente. Vedi `docs/pubblicazione.md`
 * §1.2 e la decisione D-99 in `History.md`.
 *
 * 🔴 **Nascondere la lista NON basta, ed è la parte che si sbaglia.**
 * `lib/preferiti.ts` carica gli elementi con `.eq('coppia_id', ...)` — tutti
 * quelli della coppia, non quelli della lista aperta — e `riparaLocandine()`
 * parte all'apertura di una lista **qualsiasi**. Senza spegnere anche quella,
 * aprire «Viaggi» continuerebbe a chiamare TMDB per i film: stesso rischio di
 * prima, ma invisibile, che è la versione peggiore.
 *
 * **Cosa spegne questo interruttore**, tutto in un giro:
 * - `lib/liste.ts` — la lista sparisce dall'elenco. Poiché `app/lista/[id].tsx`
 *   risolve la lista attraverso lo stesso hook, anche il link diretto per id
 *   cade nel ramo «lista inesistente» che c'era già: nessuna guardia in più.
 * - `lib/preferiti.ts` — `riparaLocandine()` non parte. **È questa la riga che
 *   ferma davvero le chiamate a TMDB.**
 * - `lib/riepilogo.ts` — `ultimoFilm` resta nullo. L'interrogazione al NOSTRO
 *   database resta e il suo esito si scarta: costa un giro, non una licenza, e
 *   lasciarla intatta fa si' che riaccendere sia una costante sola.
 * - `app/(tabs)/home.tsx` — via il riquadro «ultimo film», che altrimenti
 *   nominerebbe qualcosa che non si può più aprire.
 *
 * **Per riaccenderla**: `false`, e basta. Nessuna migrazione da rifare.
 */
/* Tipata `boolean` e non lasciata al letterale `true`: col tipo letterale
   TypeScript considererebbe morto il ramo spento e smetterebbe di
   controllarlo, cosi' che riaccendendo la funzione i primi errori li
   troverebbe l'utente invece del compilatore. */
export const LISTA_FILM_NASCOSTA: boolean = true;
