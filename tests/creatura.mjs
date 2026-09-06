/**
 * Controlla `derivaStadio` di `lib/creatura.ts`: la funzione che decide
 * **quale delle tre creature guardi**.
 *
 * ## Perché esiste
 *
 * Un errore qui non si presenterebbe come un errore. Si presenterebbe come la
 * creatura sbagliata sulla schermata di casa, o come una barra di crescita che
 * dice il falso — e nessuno saprebbe che è sbagliata, perché non c'è niente
 * con cui confrontarla. È la stessa ragione di `tests/parole.mjs`: i difetti
 * che contano qui sono quelli che **non si vedono leggendo**.
 *
 * ⚠️ E c'è un motivo preciso per cui i casi storti pesano più di quelli
 * normali: `stadio_soglia` è una **tabella** e non una costante nel codice,
 * apposta per essere ritarata **senza migrazione** (commento della `0001`, e
 * ritarata davvero dalla `0033`). Quindi può tornare disordinata, con uno
 * stadio 4 rimasto da una taratura vecchia, o con due righe alla stessa
 * soglia. Una funzione che assume tre righe ordinate è una funzione che si
 * rompe la prima volta che qualcuno tocca quella tabella da un pannello.
 *
 * ## Come importa il codice vero
 *
 * ⚠️ Non lo reimplementa: **estrae la funzione dal sorgente** e la esegue. È
 * lo stesso ripiego di `tests/parole.mjs`, che legge `lib/parole.ts` come
 * testo — Node non risolve né gli alias `@/` né i tipi, e un test che
 * ricopiasse la logica proverebbe la copia invece dell'originale, cioè
 * esattamente niente.
 *
 * Si lancia con `npm run test:creatura`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const qui = dirname(fileURLToPath(import.meta.url));
const sorgente = readFileSync(join(qui, '..', 'lib', 'creatura.ts'), 'utf8');

// Si prende il corpo della funzione dal sorgente e se ne toglie il TypeScript:
// le annotazioni sono le uniche cose che Node non digerisce, e sono poche e
// note. Se un giorno la funzione cambiasse forma questo test **fallirebbe
// rumorosamente** invece di provare una versione vecchia, ed è il
// comportamento giusto.
const inizio = sorgente.indexOf('export function derivaStadio');
if (inizio < 0) {
  console.error('❌ `derivaStadio` non trovata in lib/creatura.ts — il test non prova niente.');
  process.exit(1);
}
let profondita = 0;
let fine = -1;
for (let i = sorgente.indexOf('{', inizio); i < sorgente.length; i++) {
  if (sorgente[i] === '{') profondita++;
  else if (sorgente[i] === '}') {
    profondita--;
    if (profondita === 0) {
      fine = i + 1;
      break;
    }
  }
}
const codice = sorgente
  .slice(inizio, fine)
  .replace('export function', 'function')
  .replace('(punti: number, soglie: Soglia[])', '(punti, soglie)')
  .replace(/: Stadio/g, '')
  .replace(/ as Stadio/g, '');

const derivaStadio = new Function(`${codice}; return derivaStadio;`)();

/* -------------------------------------------------------------------------- */

let falliti = 0;
function prova(nome, atteso, ottenuto) {
  const ok = JSON.stringify(atteso) === JSON.stringify(ottenuto);
  if (!ok) {
    falliti++;
    console.error(`  ❌ ${nome}\n     atteso   ${JSON.stringify(atteso)}\n     ottenuto ${JSON.stringify(ottenuto)}`);
  } else {
    console.log(`  ok  ${nome}`);
  }
}

/** Le soglie vere, come le semina la 0033. */
const VERE = [
  { stadio: 1, punti_minimi: 0 },
  { stadio: 2, punti_minimi: 250 },
  { stadio: 3, punti_minimi: 1200 },
];

const s = (punti, soglie = VERE) => derivaStadio(punti, soglie).stadio;
const q = (punti, soglie = VERE) => Number(derivaStadio(punti, soglie).quota.toFixed(3));

console.log('\nLe soglie vere (0 / 250 / 1200)');
prova('zero punti → cucciolo', 1, s(0));
prova('un punto sotto la soglia resta cucciolo', 1, s(249));
prova('esattamente sulla soglia si sale', 2, s(250));
prova('un punto sotto la terza resta giovane', 2, s(1199));
prova('esattamente sulla terza si sale', 3, s(1200));
prova('molto oltre resta adulta', 3, s(50000));

console.log('\nLa barra di crescita');
prova('a zero la barra è vuota', 0, q(0));
prova('a metà strada verso la seconda', 0.5, q(125));
prova('appena saliti la barra riparte da zero', 0, q(250));
prova("a metà fra seconda e terza", 0.5, q(725));
prova('da adulta la barra è piena, non vuota', 1, q(1200));
prova('e resta piena anche crescendo ancora', 1, q(99999));

console.log('\nTabella storta — è ritarabile a mano, quindi può esserlo');
prova('righe in ordine sparso', 2, s(300, [
  { stadio: 3, punti_minimi: 1200 },
  { stadio: 1, punti_minimi: 0 },
  { stadio: 2, punti_minimi: 250 },
]));
prova('uno stadio 4 rimasto da una taratura vecchia non si mostra', 3, s(9999, [
  ...VERE,
  { stadio: 4, punti_minimi: 3000 },
]));
prova('e nemmeno uno stadio 0', 1, s(10, [{ stadio: 0, punti_minimi: 0 }, ...VERE]));
prova('tabella vuota → si resta cuccioli', 1, s(9999, []));
prova('barra piena se non esiste un prossimo stadio', 1, q(9999, [{ stadio: 1, punti_minimi: 0 }]));
prova('due righe alla stessa soglia non rompono niente', 2, s(250, [
  { stadio: 1, punti_minimi: 0 },
  { stadio: 2, punti_minimi: 250 },
  { stadio: 3, punti_minimi: 250 },
].slice(0, 2)));

console.log('\nCasi limite dei punti');
prova('punti negativi (non dovrebbero esistere) → cucciolo', 1, s(-5));
prova('e la barra non va sottozero', 0, q(-5));

console.log('');
if (falliti) {
  console.error(`❌ ${falliti} controlli falliti.`);
  process.exit(1);
}
console.log('✅ Tutti i controlli passati.');
console.log('\n⚠️  Verifica la LOGICA, non che le soglie siano quelle giuste:');
console.log('   0/250/1200 è una stima dichiarata su ~130 punti/mese (0033), da');
console.log('   confrontare coi dati d\'uso. Nessuno script lo può fare.');
