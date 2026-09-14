// =============================================================================
// Copertura RLS — nessuna tabella senza policy puo' entrare in silenzio.
//   node tests/rls.copertura.mjs   (oppure: npm run test:copertura)
//
// ## Perche' questo file esiste (2026-09-14)
//
// E' il **punto 4** della lista di verifica scritta il 2026-08-12 in
// docs/threat-model.md §7 — *«un test che fallisce se una tabella non ha policy
// RLS, cosi' l'aggiunta futura di una tabella non puo' passare in silenzio»* —
// ed e' rimasto l'unico dei quattro mai costruito.
//
// 🔑 **Il buco che chiude e' di forma diversa da tutti gli altri test.**
//    tests/rls.avversariali.mjs prova le RLS **tabella per tabella**, con una
//    lista scritta a mano: misura benissimo le tabelle a cui qualcuno ha
//    pensato, e **non puo' accorgersi di quelle a cui nessuno ha pensato**. Una
//    tabella nuova senza policy non fa fallire niente — e le 89 asserzioni
//    verdi rendono piu' facile credere che sia coperta.
//
// ## La scelta di leggere le MIGRAZIONI e non il catalogo, col suo costo
//
// La strada ovvia sarebbe interrogare `pg_policies` e chiedere al database chi
// e' senza policy. ⚠️ **Con la chiave publishable il catalogo non e'
// leggibile** — e' la stessa cosa che ha impedito di verificare
// `pg_publication_tables` il 2026-09-02 (Architecture.md §4.1-bis) — e l'unica
// chiave che lo leggerebbe e' la `service_role`, che in questo repo non entra.
//
// Quindi si legge cio' che il repository **dichiara**. Il costo e' dichiarato
// anche lui, ed e' preciso:
//
//   ✅ prova che nessuna migrazione introduca una tabella senza RLS
//   ❌ NON prova cosa c'e' davvero nel database
//
// 🔴 **Una tabella creata a mano dal dashboard non compare qui**, e questo test
//    tacerebbe. Resta vero il contrario di cio' che conta: le tabelle di questo
//    progetto nascono da migrazioni versionate, e il giorno che una non lo fara'
//    il problema sara' quello, non questo file.
//
// 🔑 In cambio **gira senza credenziali e senza rete**: nessun .env, nessun
//    utente di prova, nessun dato scritto. E' l'unico test del progetto che un
//    hook pre-commit puo' eseguire su qualunque dispositivo.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';

const CARTELLA = new URL('../supabase/migrations/', import.meta.url);

// --- Le eccezioni, dichiarate per nome e con la loro ragione ------------------
// 🔑 **Dichiararle qui e' cio' che rende il test utile invece che rumoroso**: una
//    tabella con RLS e zero policy e' la mitigazione piu' forte che esista
//    (nessun client legge, nessuno scrive) oppure il buco piu' grosso, e le due
//    cose si distinguono solo dall'intenzione. Scriverla qui e' l'intenzione.
//
// ⚠️ E l'eccezione e' verificata a sua volta: se un domani qualcuno aggiunge una
//    policy a una di queste, il test fallisce — perche' la dichiarazione sarebbe
//    diventata falsa, e una riga falsa in un elenco di eccezioni e' peggio
//    dell'eccezione stessa.
const SENZA_POLICY_DI_PROPOSITO = {
  notifica_in_coda:
    '0039 — RLS attiva e ZERO policy: nessun client legge o scrive la coda. ' +
    'L unico accesso e il service_role della Edge Function invia-notifiche.',
};

// --- Lettura ------------------------------------------------------------------
const file = readdirSync(CARTELLA)
  .filter((f) => f.endsWith('.sql'))
  .sort();

/** Toglie i commenti di riga: le intestazioni di questo progetto sono lunghe e
 *  citano per nome tabelle e policy, quindi contarle sarebbe un falso positivo
 *  garantito. ⚠️ Non tratta il caso `--` dentro una stringa: qui non capita, e
 *  se capitasse il sintomo sarebbe un FAIL rumoroso, non un silenzio. */
const senzaCommenti = (sql) =>
  sql
    .split('\n')
    .map((r) => {
      const i = r.indexOf('--');
      return i === -1 ? r : r.slice(0, i);
    })
    .join('\n');

// Un'unica espressione, perche' l'ORDINE fra `drop policy` e `create policy`
// conta: le migrazioni ricreano le policy precedute da un drop idempotente, e
// contare i due gruppi separatamente darebbe il risultato sbagliato.
const ISTRUZIONE = new RegExp(
  [
    String.raw`create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?<tabella>[a-z_0-9]+)`,
    String.raw`alter\s+table\s+(?:only\s+)?public\.(?<rls>[a-z_0-9]+)\s+enable\s+row\s+level\s+security`,
    String.raw`create\s+policy\s+"?(?<nuova>[a-z_0-9]+)"?\s+on\s+public\.(?<suTabella>[a-z_0-9]+)`,
    String.raw`drop\s+policy\s+(?:if\s+exists\s+)?"?(?<tolta>[a-z_0-9]+)"?\s+on\s+public\.(?<daTabella>[a-z_0-9]+)`,
  ].join('|'),
  'gi'
);

const tabelle = new Map(); // nome -> migrazione che l'ha creata
const conRls = new Map(); // nome -> migrazione che ha acceso la RLS
const policy = new Map(); // nome -> Set(policy attive)
const policyOrfane = []; // policy su tabelle mai create in queste migrazioni

for (const f of file) {
  const sql = senzaCommenti(readFileSync(new URL(f, CARTELLA), 'utf8'));
  for (const m of sql.matchAll(ISTRUZIONE)) {
    const g = m.groups;
    if (g.tabella) {
      if (!tabelle.has(g.tabella)) tabelle.set(g.tabella, f);
      if (!policy.has(g.tabella)) policy.set(g.tabella, new Set());
    } else if (g.rls) {
      if (!conRls.has(g.rls)) conRls.set(g.rls, f);
    } else if (g.nuova) {
      if (!policy.has(g.suTabella)) {
        policy.set(g.suTabella, new Set());
        if (!tabelle.has(g.suTabella)) policyOrfane.push([g.nuova, g.suTabella, f]);
      }
      policy.get(g.suTabella).add(g.nuova);
    } else if (g.tolta) {
      policy.get(g.daTabella)?.delete(g.tolta);
    }
  }
}

// --- Esito --------------------------------------------------------------------
let falliti = 0;
const esito = (nome, ok, dettaglio = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}${dettaglio ? ` — ${dettaglio}` : ''}`);
  if (!ok) falliti++;
};

console.log(`\nCopertura RLS — ${file.length} migrazioni, ${tabelle.size} tabelle in public\n`);

// 1. Ogni tabella deve avere la RLS accesa.
for (const [t, nata] of [...tabelle].sort()) {
  esito(
    `${t} — RLS attiva`,
    conRls.has(t),
    conRls.has(t) ? '' : `creata in ${nata}, nessun «enable row level security» in nessuna migrazione`
  );
}

console.log('');

// 2. Ogni tabella con RLS deve avere almeno una policy, o essere dichiarata.
for (const [t] of [...tabelle].sort()) {
  // Se la RLS non e' nemmeno accesa, il FAIL l'ha gia' dato il controllo 1: il
  // messaggio qui sotto parlerebbe di una RLS attiva che non c'e'.
  if (!conRls.has(t)) continue;
  const quante = policy.get(t)?.size ?? 0;
  const dichiarata = Object.hasOwn(SENZA_POLICY_DI_PROPOSITO, t);
  if (quante === 0 && !dichiarata) {
    esito(
      `${t} — ha almeno una policy`,
      false,
      'zero policy e nessuna dichiarazione: con RLS attiva la tabella e muta per ogni client. ' +
        'Se e voluto, va scritto in SENZA_POLICY_DI_PROPOSITO con la sua ragione'
    );
  } else if (!dichiarata) {
    esito(`${t} — ha almeno una policy`, true, `${quante}`);
  }
}

console.log('');

// 3. Le eccezioni sono verificate a loro volta.
for (const [t, ragione] of Object.entries(SENZA_POLICY_DI_PROPOSITO)) {
  if (!tabelle.has(t)) {
    esito(`eccezione ${t}`, false, 'dichiarata ma la tabella non esiste piu: la riga va tolta');
    continue;
  }
  const quante = policy.get(t)?.size ?? 0;
  esito(
    `eccezione ${t} — ancora senza policy`,
    quante === 0,
    quante === 0 ? ragione : `ha ${quante} policy: la dichiarazione e diventata falsa`
  );
}

// 4. Una policy su una tabella mai creata e quasi sempre un nome sbagliato.
for (const [p, t, f] of policyOrfane) {
  esito(`policy ${p} su ${t}`, false, `${t} non e creata da nessuna migrazione (${f})`);
}

console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log(`- **cosa c'e' davvero nel database**: qui si legge cio' che le migrazioni
  dichiarano. Una tabella creata a mano dal dashboard non comparirebbe, e questo
  test tacerebbe. Serve la service_role per chiederlo al catalogo, e in questo
  repo non entra.
- **se una policy sia GIUSTA**: qui si conta che esista. Che dica la cosa giusta
  lo misura tests/rls.avversariali.mjs, chiamando l'API col token dell'attaccante.
- **le policy su storage.objects** (le foto): vivono fuori dallo schema public e
  hanno la loro prova in rls.avversariali (B-62, otto asserzioni su file veri).`);

console.log(
  `\n${
    falliti === 0
      ? '✅ Nessuna tabella entra senza RLS, e ogni eccezione e dichiarata.'
      : `🔴 ${falliti} TEST FALLITI`
  }\n`
);
process.exit(falliti === 0 ? 0 : 1);
