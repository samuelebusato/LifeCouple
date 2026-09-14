// =============================================================================
// Test dei PUNTI della creatura — si eseguono contro il progetto REALE.
//   node tests/punti.mjs   (oppure: npm run test:punti)
//
// ## Perche' questo file esiste (B-64, 2026-09-14)
//
// `tests/creatura.mjs` prova `derivaStadio`: la funzione che, dati N punti,
// dice quale creatura guardi. E' una funzione pura, ed e' provata bene — ma
// **traduce** i punti, non li produce. Nessun test verificava che i punti
// **arrivassero**, ed e' esattamente da li' che B-64 e' passato: un posto
// creato gia' `visitato` non riceveva i suoi 20 punti, perche' il trigger della
// 0001 e' un `before update` e un INSERT non lo sveglia.
//
// 🔑 **Il difetto non si vedeva leggendo il codice del client**, che e'
//    corretto: e' l'incontro fra un client che inserisce gia' visitato e un
//    trigger che ascolta solo gli update. Si vede solo misurando il risultato.
//
// Prerequisiti: .env compilato, "Confirm email" spento. Usa un utente di prova
// punti-*@example.com, che si elimina dal dashboard quando non serve piu'.
// =============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
);
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_SB || !ANON) throw new Error('.env mancante o incompleto');

const PASSWORD = 'Password-di-prova-1!';
let falliti = 0;
const esito = (nome, ok, dettaglio = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}${dettaglio ? ` — ${dettaglio}` : ''}`);
  if (!ok) falliti++;
};

const c = createClient(URL_SB, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function entra(email) {
  let { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) ({ data, error } = await c.auth.signUp({ email, password: PASSWORD }));
  if (error) throw new Error(`auth ${email}: ${error.message}`);
  if (!data.session)
    throw new Error(`nessuna sessione per ${email}: "Confirm email" e' probabilmente attivo`);
}

async function coppia() {
  const { data } = await c.from('membro_coppia').select('coppia_id').is('uscito_il', null).limit(1);
  if (data?.length) return data[0].coppia_id;
  const { data: id, error } = await c.rpc('crea_coppia');
  if (error) throw new Error(`crea_coppia: ${error.message}`);
  return id;
}

/** I punti veri, riletti dal database: mai dedotti da quello che ci si aspetta. */
async function punti(coppiaId) {
  const { data, error } = await c.from('creatura').select('punti').eq('coppia_id', coppiaId).single();
  if (error) throw new Error(`lettura creatura: ${error.message}`);
  return data.punti;
}

async function creaLuogo(coppiaId, stato) {
  const { data, error } = await c
    .from('luogo')
    .insert({ coppia_id: coppiaId, nome: `prova-punti ${Date.now()}`, lat: 44.6, lng: 10.9, stato })
    .select('id, visitato_il')
    .single();
  if (error) throw new Error(`insert luogo (${stato}): ${error.message}`);
  return data;
}

console.log('\nPunti della creatura — arrivano davvero?');
console.log('='.repeat(60) + '\n');

await entra('punti-1@example.com');
const cid = await coppia();

// --- 1. Il caso di B-64: il posto nasce gia' visitato -------------------------
{
  const prima = await punti(cid);
  const luogo = await creaLuogo(cid, 'visitato');
  const dopo = await punti(cid);
  esito(
    'B-64: un posto creato gia visitato vale 20 punti',
    dopo === prima + 20,
    `prima=${prima} dopo=${dopo} (atteso ${prima + 20})`
  );
  esito(
    'B-64: ...e ha una data di visita, non null',
    !!luogo.visitato_il,
    `visitato_il=${luogo.visitato_il}`
  );
}

// --- 2. Che il trigger nuovo non premi l'insert normale -----------------------
// ⚠️ E' il rischio introdotto dalla correzione, non quello corretto da essa: un
// trigger sull'insert scritto male premierebbe ogni posto appena creato.
{
  const prima = await punti(cid);
  await creaLuogo(cid, 'desiderato');
  const dopo = await punti(cid);
  esito(
    'un posto creato come desiderato non vale niente finche non e visitato',
    dopo === prima,
    `prima=${prima} dopo=${dopo}`
  );
}

// --- 3. La transizione normale, che funzionava gia' ---------------------------
{
  const luogo = await creaLuogo(cid, 'desiderato');
  const prima = await punti(cid);
  await c.from('luogo').update({ stato: 'visitato' }).eq('id', luogo.id);
  const dopo = await punti(cid);
  esito(
    'la transizione desiderato -> visitato vale 20 punti (regressione 0001)',
    dopo === prima + 20,
    `prima=${prima} dopo=${dopo}`
  );

  // --- 4. E che non si fabbrichino punti andando avanti e indietro ------------
  // 🔑 La guardia della D-15: `punti_evento` ha un vincolo unico, quindi lo
  //    stesso posto premia una volta sola. E' il caso che un trigger in piu'
  //    puo' rompere in silenzio, e il motivo per cui questo test esiste.
  await c.from('luogo').update({ stato: 'desiderato' }).eq('id', luogo.id);
  await c.from('luogo').update({ stato: 'visitato' }).eq('id', luogo.id);
  const terzo = await punti(cid);
  esito(
    'togliere e rimettere la spunta NON fabbrica punti',
    terzo === dopo,
    `dopo=${dopo} dopo-il-giro=${terzo}`
  );
}

console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log(`- che la creatura MOSTRATA cambi allo scatto della soglia: e' derivaStadio,
  ed e' provata da tests/creatura.mjs. Qui si misura solo che i punti arrivino.
- i punti delle partite (0033) e degli elementi di lista: stessa forma, altro
  trigger. Non sono stati toccati da B-64 e restano senza misura diretta.`);

console.log(`\n${falliti === 0 ? '✅ I punti arrivano, e una volta sola.' : `🔴 ${falliti} TEST FALLITI`}\n`);
process.exit(falliti === 0 ? 0 : 1);
