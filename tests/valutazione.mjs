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
  'const COMPARSE_SUBITO',
  'const MOMENTI_FRA_COMPARSE',
  'const GIORNI_ETA_MINIMA',
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
  'return { vaChiesto, COMPARSE_SUBITO, MOMENTI_FRA_COMPARSE, GIORNI_ETA_MINIMA, TENTATIVI_PER_ANNO };',
].join('\n');

const { vaChiesto, COMPARSE_SUBITO, MOMENTI_FRA_COMPARSE, GIORNI_ETA_MINIMA, TENTATIVI_PER_ANNO } =
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
/**
 * Uno stato di partenza, con tutti i campi espliciti.
 *
 * ⚠️ Si scrivono anche `comparseTotali` e `momentiAllUltimaComparsa` invece di
 * lasciarli assenti: `vaChiesto` non ha ripieghi — quelli stanno in `leggi()` —
 * e uno stato incompleto qui produrrebbe `NaN`, che nei confronti e' sempre
 * falso e darebbe test verdi per la ragione sbagliata.
 */
const base = (extra = {}) => ({
  visto: giorniFa(30),
  momenti: 0,
  tentativi: [],
  comparseTotali: 0,
  momentiAllUltimaComparsa: 0,
  ...extra,
});

/** Subito dopo una comparsa: i momenti ripartono da li'. */
const dopoComparse = (quante, momenti = quante) =>
  base({ momenti, comparseTotali: quante, momentiAllUltimaComparsa: momenti });

console.log('\nValutazione — quando si chiede, e soprattutto quando no');
console.log('='.repeat(60));

/* --- il cancello dell'età ---------------------------------------------- */
{
  const s = base({ visto: giorniFa(0), momenti: 99 });
  const r = vaChiesto(s, 'partita', ORA);
  esito('non si chiede a chi ha installato oggi', !r.chiedere, r.perche);

  const s2 = base({ visto: giorniFa(GIORNI_ETA_MINIMA - 1), momenti: 99 });
  esito('non si chiede il giorno prima della soglia', !vaChiesto(s2, 'partita', ORA).chiedere);

  const s3 = base({ visto: giorniFa(GIORNI_ETA_MINIMA) });
  esito('si chiede il giorno della soglia', vaChiesto(s3, 'partita', ORA).chiedere);
}

/* --- la fase generosa: le prime comparse, a OGNI momento piacevole ------ */
{
  esito(
    'il primo momento piacevole in assoluto apre la domanda',
    vaChiesto(base(), 'partita', ORA).chiedere
  );

  for (let fatte = 1; fatte < COMPARSE_SUBITO; fatte++) {
    esito(
      `dopo ${fatte} comparse basta ancora UN momento piacevole`,
      vaChiesto(dopoComparse(fatte), 'partita', ORA).chiedere
    );
  }

  esito(
    'ma subito dopo una comparsa, senza momenti nuovi, non si richiede',
    !vaChiesto(dopoComparse(1), 'accesso', ORA).chiedere,
    'un accesso senza momenti nuovi ha riaperto la domanda'
  );
}

/* --- 🔑 IL CASO CHE QUESTO TEST ESISTE PER PROTEGGERE -------------------
 *
 * Finita la fase generosa servono tre momenti NUOVI, e la trappola e' che il
 * contatore `momenti` e' cumulativo: chi confrontasse `momenti >= 3` invece di
 * `momenti - momentiAllUltimaComparsa >= 3` troverebbe la condizione vera per
 * sempre, e — tolta la pausa settimanale il 2026-09-14 — chiederebbe a ogni
 * singolo momento piacevole fino a esaurire il tetto annuale.
 * ---------------------------------------------------------------------- */
{
  const appena = dopoComparse(COMPARSE_SUBITO, 999);
  esito(
    'un contatore ALTO non basta: contano i momenti dall ultima comparsa',
    !vaChiesto(appena, 'partita', ORA).chiedere,
    'regressione: si sta confrontando il totale invece della differenza'
  );

  const quasi = base({
    momenti: 999 + MOMENTI_FRA_COMPARSE - 2,
    comparseTotali: COMPARSE_SUBITO,
    momentiAllUltimaComparsa: 999,
  });
  esito(
    `con ${MOMENTI_FRA_COMPARSE - 1} momenti nuovi non si chiede ancora`,
    !vaChiesto(quasi, 'partita', ORA).chiedere
  );

  const pronto = base({
    momenti: 999 + MOMENTI_FRA_COMPARSE - 1,
    comparseTotali: COMPARSE_SUBITO,
    momentiAllUltimaComparsa: 999,
  });
  esito(
    `il momento che completa i ${MOMENTI_FRA_COMPARSE} apre la domanda`,
    vaChiesto(pronto, 'partita', ORA).chiedere
  );
}

/* --- aprire l'app non e' un motivo per dare cinque stelle --------------- */
{
  esito(
    'APRIRE L\'APP non conta come momento (accesso)',
    !vaChiesto(base(), 'accesso', ORA).chiedere,
    'un accesso ha contato come momento buono: si chiederebbe a chi non ha usato niente'
  );
  esito(
    'il controllo periodico non conta come momento (settimanale)',
    !vaChiesto(base(), 'settimanale', ORA).chiedere
  );
  esito(
    'ma con un momento gia\' in banca l\'accesso puo\' aprire la domanda',
    vaChiesto(base({ momenti: 1 }), 'accesso', ORA).chiedere
  );
}

/* --- il tetto annuale, che ora e' una rete e non il freno principale ---- */
{
  const pieno = base({
    tentativi: Array.from({ length: TENTATIVI_PER_ANNO }, (_, i) => giorniFa(300 - i * 10)),
  });
  esito(
    `${TENTATIVI_PER_ANNO} tentativi in un anno chiudono la porta`,
    !vaChiesto(pieno, 'partita', ORA).chiedere,
    'si continuerebbe a chiedere a vuoto'
  );

  // ⚠️ Il piu' vecchio esce dalla finestra: la porta si riapre da sola, senza
  // che nessuno azzeri niente.
  const scaduto = base({
    tentativi: [
      giorniFa(400),
      ...Array.from({ length: TENTATIVI_PER_ANNO - 1 }, (_, i) => giorniFa(300 - i * 10)),
    ],
  });
  esito(
    'un tentativo piu' + "' vecchio di un anno non conta piu'",
    vaChiesto(scaduto, 'partita', ORA).chiedere
  );
}

/* --- robustezza: dati storti non devono far chiedere ------------------- */
{
  const s = base({ visto: 'non-una-data', momenti: 99 });
  esito('una data d\'inizio illeggibile non apre la domanda', !vaChiesto(s, 'partita', ORA).chiedere);

  // Una data illeggibile fra i tentativi viene scartata, non contata: quindi
  // NON puo' essere usata per gonfiare il tetto e bloccare la domanda, e
  // nemmeno per aggirarlo. Qui i tentativi validi sono uno sotto il tetto.
  const storto = base({
    tentativi: [
      'boh',
      ...Array.from({ length: TENTATIVI_PER_ANNO - 1 }, (_, i) => giorniFa(300 - i * 10)),
    ],
  });
  esito(
    'un tentativo con data storta viene scartato, non contato',
    vaChiesto(storto, 'partita', ORA).chiedere
  );
}

/* ---------------------------------------------------------------------- */

console.log(`\n${passati}/${passati + falliti} controlli passati`);
if (falliti) {
  console.error('\n❌ CONTROLLI FALLITI\n');
  process.exit(1);
}
console.log(
  '\n✅ La politica regge: generosa all inizio, poi a intervalli, e mai per un semplice avvio.\n'
);
console.log('⚠️ Cosa questo test NON prova: che il pop-up compaia. Non e\' osservabile —');
console.log('   il sistema non dice se lo ha mostrato. Vedi la nota in lib/valutazione.ts.\n');
