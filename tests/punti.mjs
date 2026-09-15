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
// ## Esteso il 2026-09-15 (D-3 del piano di pubblicazione), e ha trovato B-70
//
// Il file misurava solo i luoghi. Le altre due sorgenti di punti — gli elementi
// di lista (0001, 10 punti) e le partite concluse (0033, 5 punti) — erano
// dichiarate NON coperte proprio qui sotto, con la nota «stessa forma, altro
// trigger». Misurandole, la forma si e' rivelata essere anche lo stesso buco:
//
//   ✅ luogo    nato «visitato» -> 20 punti   (B-64, chiuso dalla 0040)
//   🔴 elemento nato «fatto»    ->  0 punti   (B-70, chiuso dalla 0046)
//   ✅ partita  nata «conclusa» ->  0 punti   — ed e' GIUSTO, vedi la sezione 6
//
// 🔑 **Nessuno dei due era raggiungibile dall'app**: `lib/preferiti.ts` non
//    inserisce mai `stato`, e `lib/partita.ts` non inserisce mai una partita
//    diversa da 'attesa'. Erano latenti — *come lo era B-64 prima che
//    `collegaPosto` cominciasse a creare luoghi gia' visitati, e da quel
//    momento i punti sono spariti in silenzio per settimane.*
//
// Prerequisiti: .env compilato, "Confirm email" spento. Usa un utente di prova
// punti-*@example.com, che si elimina dal dashboard quando non serve piu'.
// ⚠️ La sezione 6 crea in piu' un utente `punti-p-<timestamp>@example.com` a
//    ogni esecuzione: il perche' e' scritto su `coppiaFresca()`.
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

async function creaElemento(coppiaId, stato) {
  const { data, error } = await c
    .from('elemento_lista')
    .insert({ coppia_id: coppiaId, tipo: 'film', titolo: `prova-punti ${Date.now()}`, stato })
    .select('id, stato, fatto_il')
    .single();
  if (error) throw new Error(`insert elemento (${stato}): ${error.message}`);
  return data;
}

async function creaPartita(coppiaId, stato) {
  const { data, error } = await c
    .from('partita')
    .insert({ coppia_id: coppiaId, gioco: 'quiz_preferenze', stato })
    .select('id, stato')
    .single();
  if (error) throw new Error(`insert partita (${stato}): ${error.message}`);
  return data;
}

/**
 * Una coppia nuova di zecca, con un utente nuovo.
 *
 * ⚠️ Lascia dietro di se' un utente `punti-p-<timestamp>@example.com` a ogni
 *    esecuzione, e la scelta e' deliberata: l'alternativa e' un utente fisso,
 *    che pero' esaurisce la sua partita gratuita al primo giro e fa fallire
 *    tutti i successivi della stessa giornata. 🔑 *Un test che e' verde solo
 *    prima di pranzo e' peggio di qualche utente di prova da ripulire.*
 */
async function coppiaFresca() {
  await entra(`punti-p-${Date.now()}@example.com`);
  const { data: id, error } = await c.rpc('crea_coppia');
  if (error) throw new Error(`crea_coppia (fresca): ${error.message}`);
  return id;
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

// --- 5. Gli elementi di lista (D-3): 10 punti, e lo stesso buco di B-64? -----
// 🔑 `punti_su_transizione_elemento` e' un `before update of stato`, cioe' la
//    forma ESATTA del trigger che aveva B-64. E `elemento_lista.stato` ammette
//    'fatto' all'insert. Quindi la domanda non e' teorica: un elemento creato
//    gia' fatto sveglia il trigger, o no?
{
  const el = await creaElemento(cid, 'desiderato');
  const prima = await punti(cid);
  await c.from('elemento_lista').update({ stato: 'fatto' }).eq('id', el.id);
  const dopo = await punti(cid);
  esito(
    'un elemento portato a «fatto» vale 10 punti (regressione 0001)',
    dopo === prima + 10,
    `prima=${prima} dopo=${dopo} (atteso ${prima + 10})`
  );

  await c.from('elemento_lista').update({ stato: 'desiderato' }).eq('id', el.id);
  await c.from('elemento_lista').update({ stato: 'fatto' }).eq('id', el.id);
  const terzo = await punti(cid);
  esito(
    '...e rifarlo avanti e indietro NON fabbrica punti',
    terzo === dopo,
    `dopo=${dopo} dopo-il-giro=${terzo}`
  );

  const prima2 = await punti(cid);
  const nato = await creaElemento(cid, 'fatto');
  const dopo2 = await punti(cid);
  esito(
    'B-70: un elemento creato GIA «fatto» riceve i suoi 10 punti (rosso = 0046 non applicata)',
    dopo2 === prima2 + 10,
    `prima=${prima2} dopo=${dopo2} (atteso ${prima2 + 10}) · stato letto=${nato.stato}`
  );
}

// --- 6. Le partite (0033): 5 punti, e lo stesso buco? ------------------------
// ⚠️ Due coppie FRESCHE, e non e' pigrizia: la 0042 concede **una partita al
//    giorno per coppia** nel piano gratuito, quindi due asserzioni sulle
//    partite non stanno nella stessa coppia nello stesso giorno. Un utente
//    fisso renderebbe questo test verde solo alla prima esecuzione della
//    giornata — cioe' un test che mente il pomeriggio.
{
  const a = await coppiaFresca();
  const prima = await punti(a);
  // ⚠️ 'attesa', non 'invito': la 0020 ha rifatto il vincolo degli stati
  //    ('attesa', 'in_corso', 'conclusa', 'abbandonata') e la 0001 e' superata.
  //    Scritto qui perche' il primo tentativo ha usato 'invito' ed e' finito
  //    contro `partita_stato_check` — il vincolo ha fatto il suo lavoro.
  const p = await creaPartita(a, 'attesa');
  await c.from('partita').update({ stato: 'conclusa' }).eq('id', p.id);
  const dopo = await punti(a);
  esito(
    'una partita portata a «conclusa» vale 5 punti (regressione 0033)',
    dopo === prima + 5,
    `prima=${prima} dopo=${dopo} (atteso ${prima + 5})`
  );

  // 🔑 Qui l'asserzione e' ROVESCIATA rispetto a luoghi ed elementi, ed e' il
  //    punto piu' importante di questa sezione. Una partita nata «conclusa» ha
  //    la stessa forma di B-64, ma il trattamento giusto e' l'opposto:
  //    premiarla farebbe comparire punti per una partita **mai giocata**, cioe'
  //    darebbe a un client il modo di fabbricarsi punti inserendo partite
  //    finte. La 0033 lo dice gia': il punto premia «la chiusura del cerchio,
  //    non il tempo passato dentro l'app» — e un cerchio nato chiuso non e'
  //    mai stato percorso.
  //    ⚠️ L'asserzione sta qui in POSITIVO proprio perche', se un domani
  //    qualcuno "correggesse" anche questo per simmetria con la 0046, il test
  //    lo fermi e lo mandi a leggere questo commento.
  const b = await coppiaFresca();
  const prima2 = await punti(b);
  const nata = await creaPartita(b, 'conclusa');
  const dopo2 = await punti(b);
  esito(
    'una partita creata GIA «conclusa» NON vale punti, e deve restare cosi',
    dopo2 === prima2,
    `prima=${prima2} dopo=${dopo2} (atteso invariato) · stato letto=${nata.stato}`
  );
}

console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log(`- che la creatura MOSTRATA cambi allo scatto della soglia: e' derivaStadio,
  ed e' provata da tests/creatura.mjs. Qui si misura solo che i punti arrivino.
- che i punti si SOMMINO fra sorgenti diverse nella stessa coppia: ogni sezione
  qui misura un delta isolato. Il vincolo unico di punti_evento e' per (tipo,
  riferimento), quindi sorgenti diverse non possono collidere per costruzione.
- il caso in cui una partita passi a «conclusa» PIU' VOLTE da stati diversi
  (deposito -> conclusa -> tentativi -> conclusa): il trigger guarda la
  transizione e punti_evento ha la chiave unica, ma non e' misurato.`);

console.log(`\n${falliti === 0 ? '✅ I punti arrivano, e una volta sola.' : `🔴 ${falliti} TEST FALLITI`}\n`);
process.exit(falliti === 0 ? 0 : 1);
