#!/usr/bin/env node
/**
 * Porta i documenti legali dentro l'app.
 *
 * ## Perché esiste invece di un copia-incolla
 *
 * I documenti devono essere **leggibili dentro l'app** (art. 13 GDPR: l'informativa
 * va resa nel momento in cui i dati si raccolgono, cioè alla registrazione) e
 * **pubblicabili a un URL** (requisito di entrambi gli store). Due usi, un testo
 * solo: la fonte resta il `.md` in `docs/legal/en/`, e questo script ne ricava il
 * modulo che Metro sa impacchettare.
 *
 * ⚠️ **Metro non sa importare un `.md`**, quindi qualche passaggio serve per forza.
 * La strada scartata era incollare il testo dentro un `.ts` scritto a mano: due
 * copie dello stesso documento che divergono in silenzio, ed è la copia — mai
 * l'originale — quella che invecchia. Qui il `.ts` è **derivato**: si rigenera, non
 * si modifica.
 *
 * ## Il controllo che vale più di tutti
 *
 * 🔑 Lo script **rifiuta di generare** se nel testo resta un segnaposto
 * (`[DA DECIDERE`, `[DA VERIFICARE`, `{{...}}`). I documenti in `docs/legal/` sono
 * documenti di lavoro e ne contengono parecchi: senza questa guardia, il primo
 * copia-incolla distratto pubblicherebbe «[DA DECIDERE: email di contatto]» dentro
 * un'informativa privacy resa a un utente vero. *Un documento legale con un buco
 * dichiarato è peggio di nessun documento, perché ha l'aria di essere finito.*
 *
 * Uso:
 *   node tools/genera-legale.mjs           rigenera lib/legale/testi.ts
 *   node tools/genera-legale.mjs --check   verifica soltanto, esce 1 se disallineato
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORGENTE = path.join(radice, 'docs', 'legal', 'en');
const USCITA = path.join(radice, 'lib', 'legale', 'testi.ts');

/** I documenti resi all'utente. L'ordine è quello in cui compaiono nei menu. */
const DOCUMENTI = [
  { chiave: 'privacy', file: 'privacy-policy.md' },
  { chiave: 'cookie', file: 'cookie-policy.md' },
];

/** Segnaposto che non devono mai finire sotto gli occhi di un utente. */
const SEGNAPOSTO = [/\[DA DECIDERE/i, /\[DA VERIFICARE/i, /\{\{[^}]+\}\}/, /\bTODO\b/];

const soloControllo = process.argv.includes('--check');

console.log('\nGenera legale — i documenti resi dentro l\'app');
console.log('='.repeat(58));

/* ---------- lettura e validazione ---------- */

const letti = [];
let problemi = 0;

for (const d of DOCUMENTI) {
  const abs = path.join(SORGENTE, d.file);
  if (!fs.existsSync(abs)) {
    console.log(`   ❌ ${d.file} — non esiste in docs/legal/en/`);
    problemi++;
    continue;
  }
  const testo = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n').trimEnd();

  const trovati = SEGNAPOSTO.filter((r) => r.test(testo));
  if (trovati.length) {
    console.log(`   🔴 ${d.file} — contiene ancora un segnaposto non risolto`);
    for (const riga of testo.split('\n')) {
      if (SEGNAPOSTO.some((r) => r.test(riga))) console.log(`        ${riga.trim().slice(0, 110)}`);
    }
    problemi++;
    continue;
  }

  const titolo = (testo.match(/^#\s+(.+)$/m) || [])[1];
  if (!titolo) {
    console.log(`   ❌ ${d.file} — manca il titolo (una riga "# ...")`);
    problemi++;
    continue;
  }

  letti.push({ ...d, titolo: titolo.trim(), testo });
  console.log(`   ✅ ${d.file} — «${titolo.trim()}», ${testo.split('\n').length} righe`);
}

if (problemi) {
  console.log(`\n❌ ${problemi} documento/i non utilizzabile/i. Niente è stato scritto.`);
  console.log('   Un segnaposto dentro un documento reso a un utente non è un dettaglio:');
  console.log('   è una dichiarazione incompleta che sembra completa.\n');
  process.exit(1);
}

/* ---------- costruzione del modulo ---------- */

/** Il testo entra in un template literal: vanno protetti backtick, ${ e backslash. */
function perTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const atteso =
  `/* FILE GENERATO — non modificarlo a mano.\n` +
  ` *\n` +
  ` * Sorgente: docs/legal/en/*.md\n` +
  ` * Rigenera: node tools/genera-legale.mjs\n` +
  ` *\n` +
  ` * I documenti sono in inglese soltanto, per decisione dell'utente del 2026-09-09\n` +
  ` * (D-121). Le etichette dell'interfaccia restano bilingui: è il testo legale a\n` +
  ` * non esserlo.\n` +
  ` */\n\n` +
  `export type ChiaveDocumento = ${letti.map((d) => `'${d.chiave}'`).join(' | ')};\n\n` +
  `export const DOCUMENTI_LEGALI: Record<ChiaveDocumento, { titolo: string; testo: string }> = {\n` +
  letti
    .map(
      (d) =>
        `  '${d.chiave}': {\n` +
        `    titolo: ${JSON.stringify(d.titolo)},\n` +
        `    testo: \`${perTemplate(d.testo)}\`,\n` +
        `  },`
    )
    .join('\n') +
  `\n};\n\n` +
  `export const ORDINE_DOCUMENTI: ChiaveDocumento[] = [${letti.map((d) => `'${d.chiave}'`).join(', ')}];\n`;

/* ---------- scrittura o confronto ---------- */

const attuale = fs.existsSync(USCITA) ? fs.readFileSync(USCITA, 'utf8').replace(/\r\n/g, '\n') : null;

if (soloControllo) {
  if (attuale === atteso) {
    console.log('\n✅ lib/legale/testi.ts allineato ai documenti.\n');
    process.exit(0);
  }
  console.log('\n❌ lib/legale/testi.ts non è allineato ai documenti in docs/legal/en/.');
  console.log('   Rigeneralo:  node tools/genera-legale.mjs\n');
  process.exit(1);
}

fs.mkdirSync(path.dirname(USCITA), { recursive: true });
fs.writeFileSync(USCITA, atteso, 'utf8');
console.log(`\n✅ lib/legale/testi.ts ${attuale === null ? 'creato' : 'aggiornato'} — ${letti.length} documenti.\n`);
