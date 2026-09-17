#!/usr/bin/env node
/**
 * Porta i documenti legali dentro l'app **e sulla landing**.
 *
 * ## Perché esiste invece di un copia-incolla
 *
 * I documenti devono essere **leggibili dentro l'app** (art. 13 GDPR: l'informativa
 * va resa nel momento in cui i dati si raccolgono, cioè alla registrazione) e
 * **pubblicabili a un URL** (requisito di entrambi gli store). Due usi, un testo
 * solo: la fonte resta il `.md` in `docs/legal/en/`, e questo script ne ricava
 * **entrambe** le destinazioni — il modulo che Metro sa impacchettare e le pagine
 * statiche della landing.
 *
 * ⚠️ **Metro non sa importare un `.md`**, quindi qualche passaggio serve per forza.
 * La strada scartata era incollare il testo dentro un `.ts` scritto a mano: due
 * copie dello stesso documento che divergono in silenzio, ed è la copia — mai
 * l'originale — quella che invecchia. Qui il `.ts` **e** l'`.html` sono
 * **derivati**: si rigenerano, non si modificano.
 *
 * 🔑 **Perché l'HTML lo genera questo script e non l'ha scritto nessuno a mano.**
 * Un'informativa privacy esiste in due posti — nell'app e a un URL pubblico — e
 * quei due posti devono dire **la stessa cosa**. Scritti a mano diventano due
 * documenti diversi al primo aggiornamento, e quello che invecchia è sempre il
 * secondo. *La versione pubblicata che contraddice quella resa nell'app non è un
 * disallineamento tecnico: è la prova documentale che la trasparenza non c'è.*
 *
 * ## Il controllo che vale più di tutti
 *
 * 🔑 Lo script **rifiuta di generare** se nel testo resta un segnaposto
 * (`[DA DECIDERE`, `[DA VERIFICARE`, `[TO BE DECIDED`, `[TO BE VERIFIED`,
 * `{{...}}`, `TODO`). I documenti di lavoro in `docs/legal/` ne contengono
 * parecchi: senza questa guardia, il primo copia-incolla distratto pubblicherebbe
 * «[DA DECIDERE: email di contatto]» dentro un'informativa privacy resa a un
 * utente vero. *Un documento legale con un buco dichiarato è peggio di nessun
 * documento, perché ha l'aria di essere finito.*
 *
 * ⚠️ **Le forme inglesi sono state aggiunte il 2026-09-10 (D-123), e l'omissione
 * era grave**: da quando la documentazione ufficiale è in inglese, i segnaposto si
 * scrivono in inglese — e una guardia che cerca solo `[DA DECIDERE` è cieca
 * esattamente sui documenti che deve proteggere. *Non sarebbe fallita: avrebbe
 * generato, che è il modo peggiore di sbagliare.*
 *
 * Uso:
 *   node tools/genera-legale.mjs           rigenera i derivati
 *   node tools/genera-legale.mjs --check   verifica soltanto, esce 1 se disallineato
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORGENTE = path.join(radice, 'docs', 'legal', 'en');

/**
 * ⟳ **La cartella italiana, aggiunta il 2026-09-17.**
 *
 * 🔑 **I file dentro `it/` hanno gli STESSI NOMI di quelli dentro `en/`**, e non e'
 * un caso: cosi' una lingua e' una cartella, non una tabella di corrispondenze fra
 * nomi diversi che qualcuno deve tenere allineata.
 *
 * ⚠️ **Le traduzioni alimentano SOLO le pagine pubbliche, non `lib/legale/testi.ts`.**
 * Quel modulo e' codice dell'app: cambiarlo renderebbe vecchia la build gia' firmata
 * (`94dd41b7`, 2026-09-15) e ne imporrebbe una nuova. Le pagine della landing sono
 * file statici e si pubblicano da sole. *Decisione dell'utente del 2026-09-17: prima
 * le pagine pubbliche, i testi dentro l'app al primo aggiornamento.*
 */
const SORGENTE_IT = path.join(radice, 'docs', 'legal', 'it');
const USCITA = path.join(radice, 'lib', 'legale', 'testi.ts');
const LANDING = path.join(radice, 'landing');

/** I documenti resi all'utente. L'ordine è quello in cui compaiono nei menu. */
const DOCUMENTI = [
  { chiave: 'privacy', file: 'privacy-policy.md', pagina: 'privacy-policy.html', paginaIt: 'privacy-policy-it.html' },
  { chiave: 'cookie', file: 'cookie-policy.md', pagina: 'cookie-policy.html', paginaIt: 'cookie-policy-it.html' },
  { chiave: 'termini', file: 'terms-of-use.md', pagina: 'terms-of-use.html', paginaIt: 'terms-of-use-it.html' },
];

/**
 * I documenti che stanno in `docs/legal/en/` e **non** vengono resi, col perché.
 *
 * ⚠️ Esistono per essere **dichiarati**, non per essere dimenticati: un file nella
 * cartella dei documenti ufficiali che non compare da nessuna parte sembra un
 * errore, e al prossimo giro qualcuno lo aggiunge a `DOCUMENTI` senza sapere
 * perché non c'era. Lo script li nomina a ogni esecuzione.
 */
const NON_RESI = [];

/**
 * ⟳ **NON_RESI e' vuoto dal 2026-09-15 (7), e prima conteneva i termini d'uso.**
 * La ragione scritta li' era: *«restano DUE segnaposto, e sono DATI MANCANTI —
 * telefono e indirizzo del professionista, obbligo DSA»*. 🔑 Quei due dati **non
 * sono ancora arrivati**: e' l'utente ad aver deciso di rendere il documento
 * ugualmente, con i segnaposto in chiaro, e di sostituirli in un secondo
 * momento (2026-09-15). ⚠️ *Per questo esiste la lista qui sotto*: il
 * documento ora si costruisce, ma non si costruisce in silenzio.
 */

/**
 * Segnaposto **tollerati**: il documento si costruisce lo stesso, ma vengono
 * contati e stampati a ogni esecuzione.
 *
 * 🔑 **Perche' non bloccano, a differenza di quelli sotto.** I `[DA DECIDERE]`
 * segnano una cosa che *nessuno ha ancora deciso*; questi segnano un dato che
 * **e' deciso, esiste, e va solo trascritto** — e l'utente ha scelto
 * consapevolmente di pubblicare prima di averlo (2026-09-15).
 *
 * ⚠️ **Ma il rischio vero non e' legale, e' dimenticarsene**: il documento e'
 * pubblico e nessuno lo rilegge piu'. Per questo non basta che siano ammessi:
 * vanno **nominati a ogni giro**, e per questo lo script termina con un
 * riquadro che li elenca invece di un silenzioso «fatto».
 */
const DA_COMPLETARE = [/\[indirizzo\]/g, /\[numero di telefono\]/g];

/** Segnaposto che non devono mai finire sotto gli occhi di un utente. */
const SEGNAPOSTO = [
  /\[DA DECIDERE/i,
  /\[DA VERIFICARE/i,
  /\[TO BE DECIDED/i,
  /\[TO BE VERIFIED/i,
  /\{\{[^}]+\}\}/,
  /\bTODO\b/,
];

const soloControllo = process.argv.includes('--check');

console.log('\nGenera legale — i documenti resi dentro l\'app e sulla landing');
console.log('='.repeat(62));

/* ---------- lettura e validazione ---------- */

const letti = [];
const lettiIt = [];
const incompleti = [];
let problemi = 0;

/**
 * Legge e valida i documenti di UNA cartella.
 *
 * 🔑 **La validazione e' la stessa per tutte le lingue, e deve restarlo.** Un
 * segnaposto dentro la versione italiana di un'informativa privacy e' esattamente
 * grave quanto dentro quella inglese: separare i due controlli significherebbe
 * proteggere con cura il documento che qualcuno rilegge e lasciare scoperto quello
 * che nessuno rilegge — cioe' il contrario di quello che serve.
 */
function leggiCartella(sorgente, dove, dentro) {
for (const d of DOCUMENTI) {
  const abs = path.join(sorgente, d.file);
  if (!fs.existsSync(abs)) {
    console.log(`   ❌ ${d.file} — non esiste in ${dove}`);
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

  // ⚠️ `match` e non `test`: queste regex hanno il flag /g, e `test` con /g
  //    porta `lastIndex` avanti fra una chiamata e l'altra — il secondo giro
  //    sullo stesso documento direbbe di no. Un contatore che sbaglia per un
  //    dettaglio di API e' peggio di nessun contatore.
  const daCompletare = DA_COMPLETARE.flatMap((r) => testo.match(r) ?? []);
  if (daCompletare.length) incompleti.push({ file: d.file, quanti: daCompletare.length });

  dentro.push({ ...d, titolo: titolo.trim(), testo });
  console.log(`   ✅ ${dove}${d.file} — «${titolo.trim()}», ${testo.split('\n').length} righe` +
      (daCompletare.length ? `  ⚠️ ${daCompletare.length} segnaposto da completare` : ''));
}
}

leggiCartella(SORGENTE, 'en/', letti);
leggiCartella(SORGENTE_IT, 'it/', lettiIt);

/* I non resi: nominati sempre, così il buco non è silenzioso. */
for (const n of NON_RESI) {
  const esiste = fs.existsSync(path.join(SORGENTE, n.file));
  console.log(`   ⬜ ${n.file} — ${esiste ? 'presente, non reso' : 'dichiarato non reso, ma il file non c\'è'}`);
  console.log(`        ${n.perche}`);
}

if (problemi) {
  console.log(`\n❌ ${problemi} documento/i non utilizzabile/i. Niente è stato scritto.`);
  console.log('   Un segnaposto dentro un documento reso a un utente non è un dettaglio:');
  console.log('   è una dichiarazione incompleta che sembra completa.\n');
  process.exit(1);
}

/* ---------- costruzione del modulo dell'app ---------- */

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
  ` * (D-121), confermata e allargata il 2026-09-10 (D-123): l'inglese è la lingua\n` +
  ` * ufficiale della documentazione, landing compresa. Le etichette dell'interfaccia\n` +
  ` * restano bilingui: è il testo legale a non esserlo.\n` +
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

/* ---------- costruzione delle pagine della landing ---------- *
 *
 * Il sottoinsieme markdown riconosciuto è **lo stesso** di components/markdown.tsx
 * (titoli, paragrafi, grassetto, corsivo, codice, link, elenchi, citazioni, righe
 * orizzontali, tabelle), perché i due resi devono mostrare lo stesso documento.
 * ⚠️ L'unica differenza voluta: qui le tabelle restano tabelle, dentro un
 * contenitore che scorre. Nell'app diventano blocchetti perché 375 px di larghezza
 * non tengono quattro colonne; una pagina web ha lo spazio e il browser ha lo
 * scorrimento orizzontale.
 */

const PAGINE = new Map(letti.map((d) => [d.file, d.pagina]));

function fuggi(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Il livello in linea.
 *
 * 🔑 **Una sola `replace` con alternanza, e ricorsione dentro grassetto e corsivo.**
 * L'alternanza serve perché `` `**x**` `` resti letterale dentro il codice invece
 * di diventare grassetto; la ricorsione serve per il caso opposto —
 * `**Version \`app-1.0\`**` — che senza di essa stampa i backtick a schermo. ⚠️ *È
 * lo stesso difetto trovato il 2026-09-10 in `components/markdown.tsx`, e qui
 * conta il doppio: se i due resi divergono, la pagina pubblicata e la schermata
 * dell'app mostrano lo stesso documento in due modi.*
 *
 * 🔴 **La regex è dichiarata DENTRO la funzione, e non è un dettaglio di stile.**
 * Una regex globale condivisa fra la chiamata esterna e quella annidata si porta
 * dietro `lastIndex`, e la ricorsione duplicherebbe pezzi di un documento legale.
 * Ogni invocazione — comprese quelle ricorsive — ne ha una sua.
 */
function inLinea(testo, giaFuggito = false) {
  const dentro = giaFuggito ? testo : fuggi(testo);
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+?)\*\*|\*([^*]+?)\*/g;

  return dentro.replace(re, (intero, codice, etichetta, url, grassetto, corsivo) => {
    if (codice !== undefined) return `<code>${codice}</code>`;
    if (etichetta !== undefined) {
      if (/^(https?:|mailto:|tel:)/.test(url)) {
        return `<a href="${url}" rel="noopener">${inLinea(etichetta, true)}</a>`;
      }
      /* Un rimando a un altro documento vale solo se quel documento è una
         pagina generata; altrimenti si mostra il testo senza fingere che sia
         premibile — come fa l'app. */
      const pagina = PAGINE.get(url.replace(/^\.\//, ''));
      const dentroEtichetta = inLinea(etichetta, true);
      return pagina ? `<a href="${pagina}">${dentroEtichetta}</a>` : dentroEtichetta;
    }
    if (grassetto !== undefined) return `<strong>${inLinea(grassetto, true)}</strong>`;
    return `<em>${inLinea(corsivo, true)}</em>`;
  });
}

/**
 * L'`id` di un titolo, ricavato dal testo markdown **grezzo** (senza `**` e senza
 * backtick) e non dall'HTML già reso.
 *
 * 🔑 Serve a una cosa concreta: questi documenti si rimandano fra loro dicendo
 * *«see section 7 of the Privacy Policy»*, e un'ancora rende quel rimando
 * raggiungibile invece che solo leggibile. ⚠️ Deriva dal titolo, quindi
 * **cambiare un titolo cambia l'ancora**: un link esterno a una sezione si rompe
 * in silenzio. È il prezzo di non tenere a mano una tabella di ancore, e per un
 * documento che cambia due volte l'anno conviene.
 */
function ancora(titolo) {
  return titolo
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*+/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function celle(riga) {
  return riga.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function eSeparatore(riga) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(riga) && riga.includes('-');
}

function corpoHtml(markdown) {
  const righe = markdown.split('\n');
  const out = [];
  let i = 0;

  while (i < righe.length) {
    const riga = righe[i];

    if (!riga.trim()) {
      i++;
      continue;
    }

    /* riga orizzontale */
    if (/^-{3,}$/.test(riga.trim())) {
      out.push('<hr>');
      i++;
      continue;
    }

    /* titolo */
    const t = riga.match(/^(#{1,3})\s+(.+)$/);
    if (t) {
      const n = t[1].length;
      /* Il titolo del documento è già nell'intestazione della pagina: qui si
         salta, altrimenti compare due volte. */
      if (n === 1) {
        i++;
        continue;
      }
      out.push(`<h${n} id="${ancora(t[2])}">${inLinea(t[2])}</h${n}>`);
      i++;
      continue;
    }

    /* tabella */
    if (riga.trim().startsWith('|') && righe[i + 1] && eSeparatore(righe[i + 1])) {
      const intestazioni = celle(riga);
      i += 2;
      const corpo = [];
      while (i < righe.length && righe[i].trim().startsWith('|')) {
        corpo.push(celle(righe[i]));
        i++;
      }
      /* `data-etichetta` porta l'intestazione dentro ogni cella: su schermo
         stretto il CSS la mostra come etichetta e la riga diventa un blocchetto,
         esattamente come fa components/markdown.tsx nell'app. */
      const etichette = intestazioni.map((c) => c.replace(/[*`]/g, '').trim());
      out.push(
        '<div class="tabella"><table><thead><tr>' +
          intestazioni.map((c) => `<th>${inLinea(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          corpo
            .map(
              (r) =>
                '<tr>' +
                r
                  .map(
                    (c, k) =>
                      `<td${etichette[k] ? ` data-etichetta="${fuggi(etichette[k])}"` : ''}>${inLinea(c)}</td>`
                  )
                  .join('') +
                '</tr>'
            )
            .join('') +
          '</tbody></table></div>'
      );
      continue;
    }

    /* citazione */
    if (riga.trim().startsWith('>')) {
      const pezzi = [];
      while (i < righe.length && righe[i].trim().startsWith('>')) {
        pezzi.push(righe[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${inLinea(pezzi.join(' ').trim())}</blockquote>`);
      continue;
    }

    /* elenchi */
    const puntato = /^[-*]\s+(.+)$/;
    const numerato = /^\d+[.)]\s+(.+)$/;
    if (puntato.test(riga.trim()) || numerato.test(riga.trim())) {
      const ordinato = numerato.test(riga.trim());
      const voci = [];
      while (i < righe.length) {
        const m = righe[i].trim().match(ordinato ? numerato : puntato);
        if (!m) break;
        voci.push(m[1]);
        i++;
      }
      const tag = ordinato ? 'ol' : 'ul';
      out.push(`<${tag}>` + voci.map((v) => `<li>${inLinea(v)}</li>`).join('') + `</${tag}>`);
      continue;
    }

    /* paragrafo: righe consecutive fino alla prossima vuota */
    const pezzi = [];
    while (
      i < righe.length &&
      righe[i].trim() &&
      !/^(#{1,3})\s/.test(righe[i]) &&
      !righe[i].trim().startsWith('>') &&
      !righe[i].trim().startsWith('|') &&
      !/^-{3,}$/.test(righe[i].trim()) &&
      !puntato.test(righe[i].trim()) &&
      !numerato.test(righe[i].trim())
    ) {
      pezzi.push(righe[i].trim());
      i++;
    }
    out.push(`<p>${inLinea(pezzi.join(' '))}</p>`);
  }

  return out.join('\n');
}

/**
 * La pagina intera. I colori e i caratteri sono gli stessi di `landing/index.html`
 * — che a sua volta li prende da `lib/tema.ts` — perché un documento legale su una
 * pagina che non somiglia al prodotto sembra di qualcun altro.
 * ⚠️ Sola modalità chiara, come la landing e come l'app (D-39).
 */
function pagina(doc, altri, lingua = 'en') {
  const it = lingua === 'it';
  const chiavePagina = it ? 'paginaIt' : 'pagina';
  const nav = altri
    .map((a) => `<a href="${a[chiavePagina]}">${a.titolo.replace(/ — LifeCouple$/, '')}</a>`)
    .join('\n        ');

  /* Il rimando all'altra lingua: e' l'unica cosa che rende raggiungibili le
     pagine italiane, che nessun altro file collega. Senza, esisterebbero e
     non le troverebbe nessuno. */
  const altraLingua = it
    ? `<a href="${doc.pagina}" hreflang="en" lang="en">English</a>`
    : `<a href="${doc.paginaIt}" hreflang="it" lang="it">Italiano</a>`;

  return `<!doctype html>
<html lang="${lingua}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow">
<title>${fuggi(doc.titolo)}</title>
<link rel="icon" href="/immagini/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/immagini/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/immagini/apple-touch-icon.png">
<style>
/* PAGINA GENERATA da tools/genera-legale.mjs — non modificarla a mano. */
:root {
  color-scheme: light;
  --accento:    #e4259e;
  --inchiostro: #251d22;
  --tenue:      #816e7b;
  --linea:      #ede4ea;
  --carta:      #ffffff;
  --fondo:      #fdfbfc;
  --display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --testo:   "Karla", "Segoe UI", system-ui, -apple-system, sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--fondo); color: var(--inchiostro);
  font: 400 16px/1.65 var(--testo); -webkit-font-smoothing: antialiased;
}
.guscio { max-width: 780px; margin: 0 auto; padding: 0 22px; }
header { border-bottom: 1px solid var(--linea); background: var(--carta); }
header .guscio { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; padding-top: 18px; padding-bottom: 18px; }
.marchio { display: inline-flex; align-items: center; gap: 9px; font: 600 19px/1 var(--display); color: var(--inchiostro); text-decoration: none; }
.marchio svg { width: 25px; height: 25px; color: var(--accento); }
header nav { display: flex; gap: 18px; font-size: 14px; }
header nav a { color: var(--tenue); text-decoration: none; }
header nav a:hover { color: var(--accento); }
main { padding: 44px 0 64px; }
h1 { font: 600 clamp(29px, 5vw, 40px)/1.15 var(--display); margin: 0 0 6px; letter-spacing: -.015em; }
.versione { color: var(--tenue); font-size: 14px; margin: 0 0 34px; }
h2 { font: 600 25px/1.25 var(--display); margin: 44px 0 12px; letter-spacing: -.01em; }
h3 { font: 700 17px/1.35 var(--testo); margin: 30px 0 10px; }
p { margin: 0 0 15px; }
ul, ol { margin: 0 0 15px; padding-left: 22px; }
li { margin-bottom: 7px; }
a { color: var(--accento); }
code { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: .88em; background: var(--linea); border-radius: 4px; padding: 1px 5px; }
hr { border: 0; border-top: 1px solid var(--linea); margin: 34px 0; }
blockquote { margin: 0 0 18px; padding: 14px 18px; background: var(--carta); border: 1px solid var(--linea); border-left: 3px solid var(--accento); border-radius: 0 10px 10px 0; }
blockquote p:last-child { margin-bottom: 0; }
.tabella { overflow-x: auto; margin: 0 0 22px; border: 1px solid var(--linea); border-radius: 12px; background: var(--carta); }
table { border-collapse: collapse; width: 100%; font-size: 14.5px; }
th, td { text-align: left; vertical-align: top; padding: 11px 13px; border-bottom: 1px solid var(--linea); }
th { font-weight: 700; white-space: nowrap; }
tr:last-child td { border-bottom: 0; }

/* 🔑 Su schermo stretto la tabella diventa un elenco di blocchetti, con
   l'intestazione come etichetta di ogni cella. Quattro colonne dentro 330 px
   danno colonne da 80 px: testo che l'utente ha il diritto di CAPIRE, non solo
   di ricevere (art. 12 GDPR). È la stessa scelta di components/markdown.tsx,
   presa per la stessa ragione — e presa qui perche' i due resi dello stesso
   documento devono somigliarsi. */
@media (max-width: 640px) {
  .tabella { overflow-x: visible; border: 0; background: none; }
  table { font-size: 15px; }
  thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  tr { display: block; background: var(--carta); border: 1px solid var(--linea); border-radius: 12px; padding: 4px 14px; margin-bottom: 12px; }
  td { display: block; padding: 9px 0; border-bottom: 1px solid var(--linea); }
  tr td:last-child { border-bottom: 0; }
  td[data-etichetta]::before {
    content: attr(data-etichetta);
    display: block;
    font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: var(--tenue); margin-bottom: 3px;
  }
}
footer { border-top: 1px solid var(--linea); padding: 26px 0 40px; color: var(--tenue); font-size: 14px; }
footer .guscio { display: flex; flex-wrap: wrap; gap: 10px 20px; justify-content: space-between; }
footer a { color: var(--tenue); }
</style>
</head>
<body>

<header>
  <div class="guscio">
    <a class="marchio" href="index.html">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M42 78C30 68 16 58 16 42c0-9 7-16 16-16 6 0 10 3 13 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M45 34c3-5 7-8 13-8 9 0 16 7 16 16 0 16-14 26-26 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
        <path d="M44 42l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      LifeCouple
    </a>
    <nav>
      <a href="index.html">Home</a>
      ${nav}
    </nav>
  </div>
</header>

<main>
  <div class="guscio">
    <h1>${fuggi(doc.titolo)}</h1>
${corpoHtml(doc.testo)}
  </div>
</main>

<footer>
  <div class="guscio">
    <span>LifeCouple — Samuele Busato</span>
    <span>${altraLingua} · <a href="index.html">${it ? "Torna alla pagina dell'app" : 'Back to the app page'}</a></span>
  </div>
</footer>

</body>
</html>
`;
}

const pagineAttese = [
  ...letti.map((d) => ({
    percorso: path.join(LANDING, d.pagina),
    nome: d.pagina,
    contenuto: pagina(d, letti.filter((a) => a.chiave !== d.chiave), 'en'),
  })),
  ...lettiIt.map((d) => ({
    percorso: path.join(LANDING, d.paginaIt),
    nome: d.paginaIt,
    contenuto: pagina(d, lettiIt.filter((a) => a.chiave !== d.chiave), 'it'),
  })),
];

/* ---------- scrittura o confronto ---------- */

function leggi(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : null;
}

if (soloControllo) {
  const disallineati = [];
  if (leggi(USCITA) !== atteso) disallineati.push('lib/legale/testi.ts');
  for (const p of pagineAttese) if (leggi(p.percorso) !== p.contenuto) disallineati.push(`landing/${p.nome}`);

  if (!disallineati.length) {
    console.log(`\n✅ Derivati allineati ai documenti: lib/legale/testi.ts + ${pagineAttese.length} pagine della landing.\n`);
    riepilogoDaCompletare();
    process.exit(0);
  }
  console.log('\n❌ Questi derivati non sono allineati a docs/legal/en/ e docs/legal/it/:');
  for (const d of disallineati) console.log(`   • ${d}`);
  console.log('\n   Rigenerali:  node tools/genera-legale.mjs\n');
  process.exit(1);
}

/**
 * Il riquadro dei segnaposto da completare.
 *
 * 🔑 **Chiude lo script anche quando tutto e' andato bene, ed e' voluto**: un
 * avviso stampato a meta' output, sopra tre righe verdi di successo, si legge
 * una volta e poi diventa arredamento. L'ultima cosa che resta sul terminale
 * e' l'unica che si rilegge davvero.
 *
 * ⚠️ **Non fa fallire lo script**: i due dati mancano per decisione dell'utente
 * (2026-09-15), non per errore, e bloccare qui fermerebbe ogni commit finche'
 * non arrivano. *Questo controllo non impedisce: ricorda.*
 */
function riepilogoDaCompletare() {
  if (!incompleti.length) return;
  const totale = incompleti.reduce((n, d) => n + d.quanti, 0);
  console.log('━'.repeat(62));
  console.log(`🔴  ${totale} SEGNAPOSTO ANCORA DA SOSTITUIRE, in ${incompleti.length} documento/i RESO/I`);
  for (const d of incompleti) console.log(`      • ${d.file} — ${d.quanti}`);
  console.log('');
  console.log("   Questi documenti sono DENTRO L'APP e PUBBLICI sulla landing.");
  console.log("   [indirizzo] e [numero di telefono] sono l'obbligo DSA:");
  console.log("   vanno sostituiti prima di inviare l'app alla revisione.");
  console.log('   Vedi: docs/pubblicazione.md — voce A3.');
  console.log('━'.repeat(62));
  console.log('');
}

fs.mkdirSync(path.dirname(USCITA), { recursive: true });
const primaTs = leggi(USCITA);
fs.writeFileSync(USCITA, atteso, 'utf8');
console.log(`\n✅ lib/legale/testi.ts ${primaTs === null ? 'creato' : 'aggiornato'} — ${letti.length} documenti.`);

fs.mkdirSync(LANDING, { recursive: true });
for (const p of pagineAttese) {
  const prima = leggi(p.percorso);
  fs.writeFileSync(p.percorso, p.contenuto, 'utf8');
  console.log(`✅ landing/${p.nome} ${prima === null ? 'creata' : 'aggiornata'} — ${p.contenuto.split('\n').length} righe.`);
}
riepilogoDaCompletare();
