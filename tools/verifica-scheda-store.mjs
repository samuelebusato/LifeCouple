// =============================================================================
// I limiti dei campi della scheda App Store — misurati, non ricordati.
//   node tools/verifica-scheda-store.mjs   (oppure: npm run test:scheda)
//
// ## Perche' esiste
//
// 🔑 **Un limite scritto in una tabella e non misurato e' una porta chiusa con
//    un cartello** — la stessa ragione per cui il confine gratis/pagamento vive
//    in un trigger e non nell'interfaccia (0042, D-135).
//
// ⚠️ Il modo in cui si scopre di aver sforato, senza questo controllo, e'
//    incollare il testo in App Store Connect e vederselo troncare **in
//    silenzio** — oppure, peggio, accorgersene quando la scheda e' gia'
//    pubblicata e il sottotitolo finisce a meta' parola.
//
// ## Cosa misura
//
// I campi che hanno un limite dichiarato da Apple, nelle due lingue, piu' la
// forma delle parole chiave (separate da virgola, senza spazio dopo: lo spazio
// conta come carattere e non serve a niente).
//
// ⚠️ **Cosa NON misura**: se il testo dica il vero. Che la descrizione non
//    prometta gratuito cio' che si paga (B-69) resta un giudizio umano, e la
//    fonte e' `0042_confine_gratis.sql`, non questo file.
// =============================================================================
import { readFileSync } from 'node:fs';

const SCHEDA = new URL('../docs/scheda-store.md', import.meta.url);

/** I limiti di Apple, per campo. Il nome e' quello dell'intestazione `###`. */
const LIMITI = {
  Subtitle: 30,
  'Promotional Text': 170,
  Keywords: 100,
  Description: 4000,
};

const testo = readFileSync(SCHEDA, 'utf8');

/**
 * Le lingue sono sezioni `## N. <bandiera> <nome>`; i campi dentro sono
 * `### <nome>` seguiti da un blocco fra apici tripli.
 */
function sezioni(md) {
  const fuori = [];
  const righe = md.split('\n');
  let lingua = null;
  let campo = null;
  let dentro = false;
  let buffer = [];

  for (const riga of righe) {
    // ⚠️ Qualunque `##` chiude la sezione precedente, anche se non e' una
    //    lingua. Senza questa riga il blocco `bash` di §6 veniva contato come
    //    una seconda «English Description»: il parser non usciva mai dall'ultima
    //    lingua vista. E' il primo difetto che questo controllo ha trovato — su
    //    se stesso.
    if (/^##\s/.test(riga)) {
      const l = riga.match(/^##\s+\d+\.\s+\S+\s+(Italiano|English)\s*$/);
      lingua = l ? l[1] : null;
      campo = null;
      continue;
    }
    const c = riga.match(/^###\s+(.+?)\s*$/);
    if (c && lingua) {
      campo = c[1];
      continue;
    }
    if (riga.startsWith('```')) {
      if (dentro) {
        if (lingua && campo) fuori.push({ lingua, campo, testo: buffer.join('\n') });
        buffer = [];
      }
      dentro = !dentro;
      continue;
    }
    if (dentro) buffer.push(riga);
  }
  return fuori;
}

const trovati = sezioni(testo);
let errori = 0;
let visti = 0;

console.log('\nScheda App Store — limiti dei campi\n');

for (const { lingua, campo, testo: valore } of trovati) {
  const limite = LIMITI[campo];
  if (!limite) continue;
  visti++;

  // Apple conta i caratteri, non i byte: un'emoji vale 1, non 4. `[...s]`
  // separa per punti di codice, che e' la misura giusta per i campi di testo.
  const quanti = [...valore.trim()].length;
  const ok = quanti <= limite;
  if (!ok) errori++;
  const margine = limite - quanti;
  console.log(
    `  ${ok ? '✅' : '🔴'} ${lingua.padEnd(8)} ${campo.padEnd(17)} ${String(quanti).padStart(4)} / ${limite}` +
      (ok ? `   (${margine} liberi)` : `   SFORA di ${-margine}`)
  );

  if (campo === 'Keywords') {
    if (/,\s/.test(valore)) {
      console.log('     🔴 spazio dopo una virgola: conta come carattere e non serve');
      errori++;
    }
    const chiavi = valore.trim().split(',');
    const doppie = chiavi.filter((k, i) => chiavi.indexOf(k) !== i);
    if (doppie.length) {
      console.log(`     🔴 parole ripetute: ${[...new Set(doppie)].join(', ')}`);
      errori++;
    }
  }
}

// ⚠️ Zero campi trovati NON e' un successo: vuol dire che il documento e'
//    cambiato di forma e questo controllo non guarda piu' niente. E' il modo in
//    cui un controllo muore senza fallire.
const attesi = Object.keys(LIMITI).length * 2;
if (visti !== attesi) {
  console.log(`\n🔴 campi misurati: ${visti}, attesi ${attesi} — il documento ha cambiato forma?`);
  errori++;
}

console.log(errori ? `\n🔴 ${errori} problemi.\n` : '\n✅ Tutti i campi stanno nei limiti.\n');
process.exit(errori ? 1 : 0);
