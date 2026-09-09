/**
 * Controlla `vaChiesto` di `lib/valutazione.ts`: la funzione che decide **se
 * questo e' il momento di chiedere una valutazione sullo store**.
 *
 * ## Perche' esiste
 *
 * 🔑 **Un errore qui non si vede provando l'app.** Il pop-up nativo non compare
 * a comando — iOS decide, e lo concede al massimo tre volte l'anno — quindi
 * «non e' comparso» e' il comportamento normale e non distingue una politica
 * giusta da una sbagliata. Chiedere troppo spesso non si manifesta come un
 * difetto: si manifesta come **una quota bruciata in silenzio** e, mesi dopo,
 * come un pop-up che non arriva mai quando servirebbe.
 *
 * ⚠️ E il caso che conta di piu' e' il piu' invisibile: che **aprire l'app non
 * conti come un momento buono**. Senza quel controllo basterebbe riavviare tre
 * volte per superare la soglia — cioe' chiedere cinque stelle a chi non ha
 * ancora usato niente, che e' esattamente cio' che le linee guida di Apple
 * vietano e che raccoglie una stella invece di cinque.
 *
 * ## Come importa il codice vero
 *
 * ⚠️ Non lo reimplementa: **estrae le dichiarazioni dal sorgente** e le esegue,
 * lo stesso ripiego di `tests/creatura.mjs` e `tests/parole.mjs`. Node non
 * risolve gli alias `@/` ne' i tipi, e un test che ricopiasse la logica
 * proverebbe la copia invece dell'originale — cioe' niente.
 *
 * Si lancia con `npm run test:valutazione`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const qui = dirname(fileURLToPath(import.meta.url));
const sorgente = readFileSync(join(qui, '..', 'lib', 'valutazione.ts'), 'utf8');

/**
 * Estrae una dichiarazione dal sorgente bilanciando le graffe.
 *
 * Se non la trova **fallisce rumorosamente** invece di provare una versione
 * vecchia o vuota: e' la stessa scelta di `tests/creatura.mjs`.
 */
function estrai(intestazione) {
  const inizio = pulito.indexOf(intestazione);
  if (inizio < 0) {
    console.error(`❌ "${intestazione}" non trovata in lib/valutazione.ts — il test non prova niente.`);
    process.exit(1);
  }
  const apertura = pulito.indexOf('{', inizio);
  let livello = 0;
  for (let i = apertura; i < pulito.length; i++) {
    if (pulito[i] === '{') livello++;
    else if (pulito[i] === '}') {
      livello--;
      if (livello === 0) return pulito.slice(inizio, i + 1);
    }
  }
  console.error(`❌ "${intestazione}": graffe non bilanciate.`);
  process.exit(1);
}

/** Le sole annotazioni che Node non digerisce, e sono poche e note. */
function senzaTipi(codice) {
  return codice
    .replace(': Record<Momento, boolean>', '')
    .replace('(iso: string): number | null', '(iso)')
    .replace('(tentativi: string[]): string[]', '(tentativi)')
    .replace(
      /\(\s*stato: Stato,\s*momento: Momento,\s*ora: number = Date\.now\(\)\s*\): \{[^}]*\}/,
      '(stato, momento, ora = Date.now())'
    )
    .replace(/^export /gm, '');
}

/**
 * ⚠️ **I tipi si tolgono PRIMA di estrarre, non dopo.** L'annotazione di ritorno
 * di `vaChiesto` contiene graffe (`: { chiedere: boolean; perche: string }`), e
 * un estrattore che bilancia le graffe si fermerebbe alla fine del *tipo*
 * invece che alla fine del *corpo* — restituendo la sola firma. Il sintomo era
 * un errore di sintassi lontano dalla causa.
 */
const pulito = senzaTipi(sorgente);

const pezzi = [
  'const SOGLIA_MOMENTI',
  'const GIORNI_ETA_MINIMA',
  'const GIORNI_FRA_TENTATIVI',
  'const TENTATIVI_PER_ANNO',
  'const GIORNO',
].map((nome) => {
  const riga = pulito.split('\n').find((r) => r.startsWith(nome));
  if (!riga) {
    console.error(`❌ "${nome}" non trovata in lib/valutazione.ts.`);
    process.exit(1);
  }
  return riga;
});

const codice = [
  ...pezzi,
  estrai('const CONTA_COME_MOMENTO'),
  estrai('function giorniDa'),
  estrai('function tentativiRecenti'),
  estrai('function vaChiesto'),
  'return { vaChiesto, SOGLIA_MOMENTI, GIORNI_ETA_MINIMA, GIORNI_FRA_TENTATIVI, TENTATIVI_PER_ANNO };',
].join('\n');

const { vaChiesto, SOGLIA_MOMENTI, GIORNI_ETA_MINIMA, GIORNI_FRA_TENTATIVI, TENTATIVI_PER_ANNO } =
  new Function(codice)();

/* ---------------------------------------------------------------------- */

const GIORNO = 24 * 60 * 60 * 1000;
const ORA = Date.parse('2026-09-10T12:00:00.000Z');
const giorniFa = (n) => new Date(ORA - n * GIORNO).toISOString();

let passati = 0;
let falliti = 0;

function esito(nome, condizione, dettaglio = '') {
  if (condizione) {
    passati++;
  } else {
    falliti++;
    console.error(`  ✗ ${nome}${dettaglio ? ` — ${dettaglio}` : ''}`);
  }
}

/** Uno stato «maturo»: vecchio abbastanza, con i momenti già accumulati. */
const maturo = (extra = {}) => ({
  visto: giorniFa(30),
  momenti: SOGLIA_MOMENTI,
  tentativi: [],
  ...extra,
});

console.log('\nValutazione — quando si chiede, e soprattutto quando no');
console.log('='.repeat(60));

/* --- il cancello dell'età ---------------------------------------------- */
{
  const s = { visto: giorniFa(0), momenti: 99, tentativi: [] };
  const r = vaChiesto(s, 'partita', ORA);
  esito('non si chiede a chi ha installato oggi', !r.chiedere, r.perche);

  const s2 = { visto: giorniFa(GIORNI_ETA_MINIMA - 1), momenti: 99, tentativi: [] };
  esito(
    'non si chiede il giorno prima della soglia',
    !vaChiesto(s2, 'partita', ORA).chiedere
  );

  const s3 = { visto: giorniFa(GIORNI_ETA_MINIMA), momenti: SOGLIA_MOMENTI, tentativi: [] };
  esito('si chiede il giorno della soglia', vaChiesto(s3, 'partita', ORA).chiedere);
}

/* --- il cancello dei momenti ------------------------------------------- */
{
  const s = { visto: giorniFa(30), momenti: SOGLIA_MOMENTI - 1, tentativi: [] };
  esito(
    'una partita che porta al numero giusto apre la domanda',
    vaChiesto(s, 'partita', ORA).chiedere
  );

  const s2 = { visto: giorniFa(30), momenti: SOGLIA_MOMENTI - 2, tentativi: [] };
  esito('sotto la soglia non si chiede', !vaChiesto(s2, 'partita', ORA).chiedere);
}

/* --- 🔑 il caso che il test esiste per proteggere ----------------------- */
{
  const s = { visto: giorniFa(30), momenti: SOGLIA_MOMENTI - 1, tentativi: [] };
  esito(
    'APRIRE L\'APP non porta oltre la soglia (accesso)',
    !vaChiesto(s, 'accesso', ORA).chiedere,
    'un accesso ha contato come momento buono: si chiederebbe a chi non ha usato niente'
  );
  esito(
    'il controllo periodico non porta oltre la soglia (settimanale)',
    !vaChiesto(s, 'settimanale', ORA).chiedere
  );
  esito(
    'ma su uno stato gia\' maturo l\'accesso puo\' aprire la domanda',
    vaChiesto(maturo(), 'accesso', ORA).chiedere
  );
}

/* --- la distanza fra due tentativi ------------------------------------- */
{
  const s = maturo({ tentativi: [giorniFa(GIORNI_FRA_TENTATIVI - 1)] });
  esito('non si richiede prima di una settimana', !vaChiesto(s, 'partita', ORA).chiedere);

  const s2 = maturo({ tentativi: [giorniFa(GIORNI_FRA_TENTATIVI)] });
  esito('si richiede dopo una settimana piena', vaChiesto(s2, 'partita', ORA).chiedere);
}

/* --- il tetto annuale, allineato alla quota del sistema ---------------- */
{
  const s = maturo({
    tentativi: [giorniFa(300), giorniFa(200), giorniFa(100)],
  });
  esito(
    'tre tentativi in un anno chiudono la porta',
    !vaChiesto(s, 'partita', ORA).chiedere,
    'si continuerebbe a chiedere a vuoto: iOS ne concede tre'
  );

  // ⚠️ Il piu' vecchio esce dalla finestra: la porta si riapre da sola, senza
  // che nessuno azzeri niente.
  const s2 = maturo({
    tentativi: [giorniFa(400), giorniFa(200), giorniFa(100)],
  });
  esito(
    'un tentativo piu' + "' vecchio di un anno non conta piu'",
    vaChiesto(s2, 'partita', ORA).chiedere
  );
}

/* --- robustezza: dati storti non devono far chiedere ------------------- */
{
  const s = { visto: 'non-una-data', momenti: 99, tentativi: [] };
  esito('una data d\'inizio illeggibile non apre la domanda', !vaChiesto(s, 'partita', ORA).chiedere);

  const s2 = maturo({ tentativi: ['boh', giorniFa(1)] });
  esito(
    'un tentativo con data storta non aggira la distanza minima',
    !vaChiesto(s2, 'partita', ORA).chiedere
  );
}

/* ---------------------------------------------------------------------- */

console.log(`\n${passati}/${passati + falliti} controlli passati`);
if (falliti) {
  console.error('\n❌ CONTROLLI FALLITI\n');
  process.exit(1);
}
console.log('\n✅ La politica regge: si chiede tardi, di rado, e mai per un semplice avvio.\n');
console.log('⚠️ Cosa questo test NON prova: che il pop-up compaia. Non e\' osservabile —');
console.log('   il sistema non dice se lo ha mostrato. Vedi la nota in lib/valutazione.ts.\n');
