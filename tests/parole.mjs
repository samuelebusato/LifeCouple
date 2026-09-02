/**
 * Controlla i **banchi di parole** di tutti e quattro i giochi (`lib/parole.ts`).
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
// 🔴 **Non greedy, e non è un dettaglio di stile** (2026-09-02).
//
// Con `[\s\S]*` questa espressione arrivava fino all'**ultima** chiusura `\n];`
// del file: dal 2026-09-01, cioè da quando esiste `DOMANDE_QUIZ`, il blocco
// della telepatia si portava dentro anche le domande del quiz. Le voci contate
// diventavano 612 invece di 500 e il controllo era **rosso da un giorno**, senza
// che nessuno lo vedesse — questa suite non gira nel `pre-commit`, va lanciata.
//
// 🔑 Stessa forma di B-36: il test non diceva «non so leggere il file», diceva
// «500 voci di telepatia — trovate 612», cioè accusava il banco. Un test che
// sbaglia manda a cercare un difetto che non c'è, e qui per di più in una lista
// di cinquecento righe scritte a mano.
const bloccoTemi = sorgente.match(/TEMI_TELEPATIA[^=]*=\s*\[([\s\S]*?)\n\];/);
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

// --- il banco del quiz -------------------------------------------------------
//
// ⚠️ **Non era controllato da nessuno** fino al 2026-09-02: è nato il giorno
// prima e questa suite copriva ancora due giochi su tre. I difetti che cerca
// sono gli stessi degli altri banchi, più uno che qui è specifico: due domande
// con lo **stesso titolo** manderebbero in tilt la regola per cui una domanda
// non si ripete nella partita (B-33), che identifica la domanda proprio dalla
// chiave del titolo.
console.log('\nQuiz sulle preferenze');
const bloccoQuiz = sorgente.match(/DOMANDE_QUIZ[^=]*=\s*\[([\s\S]*?)\n\];/);
verifica('il banco del quiz esiste', !!bloccoQuiz);

const domande = bloccoQuiz
  ? bloccoQuiz[1].split(/\n  \{\n/).filter((d) => d.includes('titolo:'))
  : [];
verifica('almeno 12 domande', domande.length >= 12, `trovate ${domande.length}`);

const titoliQuiz = [];
let quizCorte = [];
let quizDoppie = [];
let quizSenzaTuo = [];
for (const d of domande) {
  const titolo = d.match(/titolo:\s*\[\s*(['"])(.*?)\1/);
  const nome = titolo ? titolo[2] : '(senza titolo)';
  titoliQuiz.push(nome);
  // ⚠️ `tuo` e `titolo` sono due frasi diverse per costruzione: «il tuo piatto»
  // e «il suo piatto». Se una domanda ne avesse una sola, il ruolo tornerebbe a
  // essere una cosa in più da leggere invece che la riga grande in cima.
  if (!/tuo:\s*\[/.test(d)) quizSenzaTuo.push(nome);
  const corpo = d.slice(d.indexOf('voci:'));
  const v = voci(corpo);
  // Almeno 4: sotto questa soglia il round non compone il suo set di quattro, e
  // il difetto uscirebbe **solo** quando esce quella domanda.
  if (v.length < 4) quizCorte.push(`${nome} (${v.length})`);
  const chiavi = v.map((x) => x[0]);
  const dup = chiavi.filter((c, i) => chiavi.indexOf(c) !== i);
  if (dup.length) quizDoppie.push(`${nome}: ${dup.join(', ')}`);
}

verifica('ogni domanda ha le due versioni, «tuo» e «suo»', quizSenzaTuo.length === 0, quizSenzaTuo.join(' · '));
verifica('ogni domanda ha almeno 4 risposte', quizCorte.length === 0, quizCorte.join(' · '));
verifica('nessuna risposta doppia dentro una domanda', quizDoppie.length === 0, quizDoppie.join(' · '));
const titoliDoppi = titoliQuiz.filter((c, i) => titoliQuiz.indexOf(c) !== i);
verifica(
  'nessun titolo di domanda doppio',
  titoliDoppi.length === 0,
  `${titoliDoppi.join(', ')} — la regola «una domanda non si ripete» le confonderebbe`
);

// --- le carte di obbligo o verità --------------------------------------------
console.log('\nObbligo o verità');
const bloccoObblighi = sorgente.match(/OBBLIGHI[^=]*=\s*\[([\s\S]*?)\n\] as const;/);
const bloccoVerita = sorgente.match(/VERITA[^=]*=\s*\[([\s\S]*?)\n\] as const;/);
verifica('i due banchi esistono', !!bloccoObblighi && !!bloccoVerita);

const obblighi = bloccoObblighi ? voci(bloccoObblighi[1]) : [];
const verita = bloccoVerita ? voci(bloccoVerita[1]) : [];

// ⚠️ La soglia è **il doppio dei round**, non il numero dei round. Con dieci
// carte esatte una partita le userebbe tutte e la seconda sarebbe identica alla
// prima: il banco sarebbe formalmente sufficiente e praticamente esaurito.
verifica('almeno 20 obblighi', obblighi.length >= 20, `trovati ${obblighi.length}`);
verifica('almeno 20 verità', verita.length >= 20, `trovate ${verita.length}`);

for (const [nome, lista] of [
  ['gli obblighi', obblighi],
  ['le verità', verita],
]) {
  const chiavi = lista.map((v) => v[0]);
  const dup = chiavi.filter((c, i) => chiavi.indexOf(c) !== i);
  verifica(`nessuna chiave doppia fra ${nome}`, dup.length === 0, dup.join(', '));
  const its = lista.map((v) => v[1]);
  const dupIt = its.filter((c, i) => its.indexOf(c) !== i);
  verifica(`nessun italiano doppio fra ${nome}`, dupIt.length === 0, dupIt.join(', '));
  verifica(
    `nessuna carta vuota fra ${nome}`,
    lista.every((v) => v[0].trim() && v[1].trim())
  );
}

// 🔴 I due banchi non devono condividere chiavi, e la ragione sta nel codice
// della schermata: le carte già uscite si tengono in **un insieme solo**, senza
// distinguere il tipo. Una chiave in comune sparirebbe da tutti e due i mazzi
// appena usata in uno — un difetto che si vedrebbe come «quella carta non esce
// mai», cioè non si vedrebbe affatto.
const comuni = obblighi.map((v) => v[0]).filter((k) => verita.some((v) => v[0] === k));
verifica('nessuna chiave in comune fra obblighi e verità', comuni.length === 0, comuni.join(', '));

// ⚠️ Il filtro di D-08 e D-13 **non è controllabile da uno script**: che una
// carta non tocchi salute, religione o relazioni precedenti è un giudizio sul
// significato, non sulla forma. Qui si controlla solo che il banco sia sano.
// Detto perché un elenco di controlli verdi non venga letto come «il contenuto
// è stato approvato»: quel filtro resta umano, ed è la mitigazione di D-13.


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
