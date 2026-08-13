/**
 * Aritmetica delle date per il calendario, senza librerie.
 *
 * Due lingue, tre viste e un mese da disegnare non giustificano il peso di
 * date-fns o dayjs (stessa regola di i18n in D-24). Tutto quello che serve
 * sono confronti per giorno e spostamenti; la formattazione la fa `Intl`,
 * che conosce gia' entrambe le lingue.
 *
 * La settimana comincia di **lunedi'**: e' la convenzione italiana e quella
 * dello schema di riferimento del calendario.
 */

/**
 * Le tre scale a cui si guarda un calendario di coppia: la settimana per
 * sapere cosa succede adesso, il mese per orientarsi, l'anno per ritrovare.
 * La vista "giorno" e' stata tolta il 2026-08-13: apriva un giorno alla volta
 * facendo il lavoro che ora fa il foglio di dettaglio, meglio e da ovunque.
 */
export type Vista = 'giorni' | 'mese' | 'anno' | 'eventi';

/**
 * Giorni civili fra oggi e una data: positivo se deve venire, negativo se e'
 * passata. Si contano i **giorni**, non le ore: alle 23:00 e alle 07:00 la
 * risposta dev'essere la stessa.
 */
export function giorniDaOggi(d: Date, oggi = new Date()) {
  return Math.round((inizioGiorno(d).getTime() - inizioGiorno(oggi).getTime()) / 86_400_000);
}

export const inizioGiorno = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const stessoGiorno = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const stessoMese = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const aggiungiGiorni = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Il giorno resta valido anche nei mesi corti: 31 gennaio + 1 mese = 28/29 febbraio. */
export function aggiungiMesi(d: Date, n: number) {
  const primo = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimo = new Date(primo.getFullYear(), primo.getMonth() + 1, 0).getDate();
  return new Date(primo.getFullYear(), primo.getMonth(), Math.min(d.getDate(), ultimo));
}

export function inizioSettimana(d: Date) {
  const g = inizioGiorno(d);
  const dow = (g.getDay() + 6) % 7; // domenica=0 -> 6, lunedi'=1 -> 0
  return aggiungiGiorni(g, -dow);
}

/** Le 6 righe da 7 giorni che coprono il mese, bordi inclusi: griglia sempre stabile. */
export function grigliaMese(d: Date): Date[] {
  const partenza = inizioSettimana(new Date(d.getFullYear(), d.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => aggiungiGiorni(partenza, i));
}

/** Di quanto ci si sposta con le frecce: una settimana, un mese, un anno. */
export function scorri(d: Date, vista: Vista, verso: 1 | -1) {
  if (vista === 'giorni') return aggiungiGiorni(d, 7 * verso);
  if (vista === 'anno') return aggiungiMesi(d, 12 * verso);
  return aggiungiMesi(d, verso);
}

export function titoloPeriodo(d: Date, vista: Vista, lingua: string) {
  if (vista === 'giorni') {
    const da = inizioSettimana(d);
    const a = aggiungiGiorni(da, 6);
    const f = (x: Date) => x.toLocaleDateString(lingua, { day: 'numeric', month: 'short' });
    return `${f(da)} – ${f(a)}`;
  }
  if (vista === 'anno') return String(d.getFullYear());
  return d.toLocaleDateString(lingua, { month: 'long', year: 'numeric' });
}

/** I dodici mesi dell'anno di `d`, per la vista d'insieme. */
export function mesiDellAnno(d: Date) {
  return Array.from({ length: 12 }, (_, m) => new Date(d.getFullYear(), m, 1));
}

/** Iniziali dei sette giorni nella lingua attiva, da lunedi'. */
export function iniziali(lingua: string) {
  const base = inizioSettimana(new Date(2026, 0, 5)); // un lunedi' qualunque
  return Array.from({ length: 7 }, (_, i) =>
    aggiungiGiorni(base, i).toLocaleDateString(lingua, { weekday: 'short' })
  );
}
