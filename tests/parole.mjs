/**
 * Controlla i **banchi di parole** dei giochi (`lib/parole.ts`).
 *
 * ## Perché esiste
 *
 * Mille voci scritte a mano sono mille occasioni di sbagliare, e gli sbagli
 * possibili qui non si vedono leggendo: una chiave doppia fa apparire due volte
 * la stessa parola nello stesso set di quattro, una voce con la traduzione
 * vuota manda in scena una carta bianca, un tema con diciannove voci invece di
 * venti fa fallire la pesca proprio quando esce quel tema. Sono tutti difetti
 * che si manifestano **a caso, in partita, a qualcun altro**.
 *
 * ⚠️ Non gira nel `pre-commit` degli altri controlli del brain: quello vale per
 * le note. Questo si lancia con `npm run test:parole`, e va lanciato quando si
 * toccano i banchi.
 *
 * Cosa NON verifica, e va detto: che le traduzioni siano **giuste**. Che `dog`
 * stia accanto a `cane` e non a `gatto` è un giudizio umano, e nessuno script
 * lo sostituisce.
 */
import { readFileSync } from 'node:fs';

// 🔴 **I fine riga si normalizzano prima di guardare il sorgente** (B-36).
//
// Questo test non importa il modulo: lo **legge come testo** e lo spacca con
// espressioni regolari che contengono `\n`. Con `core.autocrlf=true` — il
// default di Git su Windows — la copia di lavoro ha `\r\n`, quei `\n` non
// combaciano più, e `TEMI_TELEPATIA` si legge come **un tema solo** contenente
// tutte le voci.
//
// ⚠️ E il modo in cui falliva è la parte peggiore: non diceva «il test non sa
// leggere il file», diceva **«almeno 20 temi — trovati 1»** e «chiave doppia
// dentro un tema», cioè accusava il banco di parole. Un test che sbaglia
// indica il file sbagliato, e chi lo legge va a cercare un difetto che non c'è.
//
// 🔑 Ed era invisibile finché il progetto è vissuto su un dispositivo solo:
// stessa forma della chiave TMDB — qualcosa che vale su questa macchina e non
// sull'altra, dove però nessuno dei due lo vede. *Un controllo che dipende dal
// checkout non sta verificando il codice: sta verificando il checkout.*
const sorgente = readFileSync(new URL('../lib/parole.ts', import.meta.url), 'utf8').replace(
  /\r\n/g,
  '\n'
);

let errori = 0;
let controlli = 0;

function verifica(descrizione, condizione, dettaglio = '') {
  controlli++;
  if (condizione) {
    console.log(`  ok  ${descrizione}`);
  } else {
    errori++;
    console.log(`  KO  ${descrizione}${dettaglio ? ` — ${dettaglio}` : ''}`);
  }
}

/** Estrae le coppie `['chiave', 'italiano']` da un pezzo di sorgente. */
function voci(testo) {
  const fuori = [];
  const re = /\[\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*\]/g;
  for (const m of testo.matchAll(re)) fuori.push([m[2], m[4]]);
  return fuori;
}

// --- il banco del disegno ---------------------------------------------------
console.log('\nIndovina il disegno');
const bloccoDisegno = sorgente.match(/PAROLE_DISEGNO[^=]*=\s*\[([\s\S]*?)\n\];/);
verifica('il banco del disegno esiste', !!bloccoDisegno);

const disegno = bloccoDisegno ? voci(bloccoDisegno[1]) : [];
verifica('almeno 500 parole da disegnare', disegno.length >= 500, `trovate ${disegno.length}`);

const chiaviDisegno = disegno.map((v) => v[0]);
const doppieChiaviD = chiaviDisegno.filter((c, i) => chiaviDisegno.indexOf(c) !== i);
verifica('nessuna chiave doppia', doppieChiaviD.length === 0, doppieChiaviD.join(', '));

const itDisegno = disegno.map((v) => v[1]);
const doppieItD = itDisegno.filter((c, i) => itDisegno.indexOf(c) !== i);
verifica('nessun italiano doppio', doppieItD.length === 0, doppieItD.join(', '));

verifica(
  'nessuna voce vuota',
  disegno.every((v) => v[0].trim() && v[1].trim())
);

// --- il banco della telepatia ------------------------------------------------
console.log('\nTelepatia');
const bloccoTemi = sorgente.match(/TEMI_TELEPATIA[^=]*=\s*\[([\s\S]*)\n\];/);
verifica('il banco della telepatia esiste', !!bloccoTemi);

const temi = bloccoTemi ? bloccoTemi[1].split(/\n  \{\n/).filter((t) => t.includes('titolo:')) : [];
verifica('almeno 20 temi', temi.length >= 20, `trovati ${temi.length}`);

let vociTotali = 0;
let temiCorti = [];
let doppieNelTema = [];
for (const t of temi) {
  const titolo = t.match(/titolo:\s*\[\s*(['"])(.*?)\1/);
  const nome = titolo ? titolo[2] : '(senza titolo)';
  const corpo = t.slice(t.indexOf('voci:'));
  const v = voci(corpo);
  vociTotali += v.length;
  // ⚠️ Almeno 4: sotto questa soglia il round non può nemmeno comporre il suo
  // set di quattro opzioni, ed è il difetto che si presenterebbe **solo** quando
  // esce quel tema — cioè raramente, e a partita già cominciata.
  if (v.length < 4) temiCorti.push(`${nome} (${v.length})`);
  const chiavi = v.map((x) => x[0]);
  const dup = chiavi.filter((c, i) => chiavi.indexOf(c) !== i);
  if (dup.length) doppieNelTema.push(`${nome}: ${dup.join(', ')}`);
}

verifica('500 voci di telepatia in tutto', vociTotali === 500, `trovate ${vociTotali}`);
verifica('ogni tema ha almeno 4 voci', temiCorti.length === 0, temiCorti.join(' · '));
verifica('nessuna chiave doppia dentro un tema', doppieNelTema.length === 0, doppieNelTema.join(' · '));

// --- il normalizzatore dei tentativi -----------------------------------------
console.log('\nNormalizzazione dei tentativi');
const fonte = sorgente.match(/export function normalizza[\s\S]*?\n\}/)[0].replace('export ', '');
const normalizza = new Function(`${fonte.replace(/: string/g, '')}; return normalizza;`)();

const casi = [
  ['  Il CANE  ', 'cane', 'spazi, maiuscole e articolo'],
  ['Perù', 'peru', 'accento'],
  ['the Dog', 'dog', 'articolo inglese'],
  ['un  gatto', 'gatto', 'spazi doppi'],
  ['falò', 'falo', 'accento grave'],
];
for (const [dentro, atteso, perche] of casi) {
  verifica(`${perche}: ${JSON.stringify(dentro)} → ${atteso}`, normalizza(dentro) === atteso, `ottenuto ${JSON.stringify(normalizza(dentro))}`);
}

// --- esito -------------------------------------------------------------------
console.log(`\n${controlli - errori}/${controlli} controlli passati`);
if (errori > 0) {
  console.error(`${errori} problemi nei banchi di parole.`);
  process.exit(1);
}
console.log('Banchi in ordine.\n');
