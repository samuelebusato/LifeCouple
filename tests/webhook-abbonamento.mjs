// =============================================================================
// Il webhook degli abbonamenti, provato per intero — contro il progetto REALE.
//   node tests/webhook-abbonamento.mjs   (oppure: npm run test:webhook)
//
// ## Perche' esiste, e cosa chiude
//
// `tests/abbonamento.mjs` prova cio' che un client puo' esercitare: che NON
// possa darsi il diritto. Ma dichiara non coperte le due asserzioni che
// contano di piu' — che un abbonamento attivo **accenda** la proiezione e che
// si **spenga** — perche' richiedono qualcuno che SCRIVA la tabella, e nessun
// client puo'. Quel qualcuno ora esiste: e' la Edge Function.
//
// 🔑 **E cosi' la proprieta' portante della 0041 diventa misurata**: il diritto
//    si accende e si spegne **senza che il client tocchi mai** `abbonamento`.
//
// ## ⚠️ Serve il segreto, che non e' nel repo
//
// Gira solo dove esiste `.env.segreto.local` (gitignorato). Altrove **salta e
// lo dice**: un test che finge di essere passato sarebbe peggio di nessun test.
//
// ⚠️ Scrive davvero nel database, su un utente di prova (abb-1@example.com), e
//    finisce lasciando il diritto SPENTO. E' lo stesso patto di rls.avversariali.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const percorsoSegreto = new URL('../.env.segreto.local', import.meta.url);
if (!existsSync(percorsoSegreto)) {
  console.log('\n⏭️  SALTATO — manca .env.segreto.local, che porta RC_WEBHOOK_SECRET.');
  console.log('   Non e un guasto: quel file e gitignorato di proposito e vive solo');
  console.log('   sulla macchina che ha impostato il segreto. Vedi docs/pagamenti.md §3.1.\n');
  process.exit(0);
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
);
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SEG = readFileSync(percorsoSegreto, 'utf8').split('=')[1].trim();
const HOOK = `${URL_SB}/functions/v1/abbonamento-webhook`;

let falliti = 0;
const esito = (n, ok, d = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`);
  if (!ok) falliti++;
};

const c = createClient(URL_SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
let { data, error } = await c.auth.signInWithPassword({
  email: 'abb-1@example.com',
  password: 'Password-di-prova-1!',
});
if (error) ({ data, error } = await c.auth.signUp({ email: 'abb-1@example.com', password: 'Password-di-prova-1!' }));
if (error) throw new Error(`auth: ${error.message}`);
const mio = data.user.id;

let cid = (await c.from('membro_coppia').select('coppia_id').is('uscito_il', null).limit(1)).data?.[0]?.coppia_id;
if (!cid) cid = (await c.rpc('crea_coppia')).data;

const manda = async (evento, header = SEG) => {
  const r = await fetch(HOOK, {
    method: 'POST',
    headers: { authorization: header, 'content-type': 'application/json' },
    body: JSON.stringify({ api_version: '1.0', event: evento }),
  });
  return { stato: r.status, corpo: await r.json() };
};
const haInsieme = async () => (await c.rpc('coppia_ha_insieme', { cid })).data;

// Identificativi unici per giro: gli eventi sono idempotenti sull'id, quindi
// riusare gli stessi farebbe passare il secondo giro senza provare niente.
const g = Date.now();
const t = (n) => g + n;

console.log('\nWebhook abbonamento — la catena intera');
console.log('='.repeat(60) + '\n');

// --- I due modi di essere respinti, che devono essere indistinguibili -------
{
  const r = await manda({ type: 'INITIAL_PURCHASE' }, '');
  esito('senza segreto: 401 dalla FUNZIONE, non dalla piattaforma',
    r.stato === 401 && r.corpo?.errore === 'non autorizzato', JSON.stringify(r.corpo));
}
{
  const r = await manda({ type: 'INITIAL_PURCHASE' }, 'segreto-sbagliato');
  esito('segreto sbagliato: risposta IDENTICA a quella senza segreto',
    r.stato === 401 && r.corpo?.errore === 'non autorizzato', JSON.stringify(r.corpo));
}

// 🔑 La prima asserzione e' anche la prova che `--no-verify-jwt` e' in vigore:
//    col cancello della piattaforma attivo la risposta sarebbe
//    UNAUTHORIZED_INVALID_JWT_FORMAT, e la funzione non partirebbe affatto.

{
  const r = await manda({ type: 'BILLING_ISSUE', id: `bill-${g}`, app_user_id: mio, event_timestamp_ms: t(0) });
  esito('BILLING_ISSUE non tocca il diritto (puo risolversi da se)',
    r.stato === 200 && r.corpo?.azione === 'ignorato', JSON.stringify(r.corpo));
}

esito('prima dell acquisto la coppia NON ha Insieme', (await haInsieme()) === false);

// --- L'acquisto, e la proiezione che si accende ----------------------------
const scadenza = g + 30 * 24 * 3600 * 1000;
{
  const r = await manda({
    type: 'INITIAL_PURCHASE', id: `acq-${g}`, app_user_id: mio, event_timestamp_ms: t(1),
    product_id: 'com.lifecouple.app.insieme.mensile', expiration_at_ms: scadenza, store: 'APP_STORE',
  });
  esito('INITIAL_PURCHASE concede il diritto', r.stato === 200 && r.corpo?.azione === 'concedi', JSON.stringify(r.corpo));
  esito('🔑 la proiezione si ACCENDE, e il client non ha scritto niente', (await haInsieme()) === true);
}

// --- Consegne doppie e fuori ordine ----------------------------------------
{
  const r = await manda({ type: 'INITIAL_PURCHASE', id: `acq-${g}`, app_user_id: mio, event_timestamp_ms: t(2) });
  esito('lo stesso evento consegnato due volte e riconosciuto', r.stato === 200 && r.corpo?.azione === 'gia visto', JSON.stringify(r.corpo));
}
{
  const r = await manda({ type: 'EXPIRATION', id: `vecchio-${g}`, app_user_id: mio, event_timestamp_ms: t(-86400000) });
  esito('un evento PIU VECCHIO non riporta indietro lo stato', r.stato === 200 && /piu vecchio/.test(r.corpo?.azione ?? ''), JSON.stringify(r.corpo));
  esito('...e infatti il diritto e ancora acceso', (await haInsieme()) === true);
}

// --- La distinzione che protegge chi ha gia' pagato ------------------------
{
  const r = await manda({ type: 'CANCELLATION', id: `disdetta-${g}`, app_user_id: mio, event_timestamp_ms: t(3), cancel_reason: 'UNSUBSCRIBE' });
  esito('disdetta del rinnovo: NON toglie', r.stato === 200 && r.corpo?.azione === 'ignorato', JSON.stringify(r.corpo));
  esito('...e il diritto resta fino alla scadenza pagata', (await haInsieme()) === true);
}
{
  const r = await manda({ type: 'CANCELLATION', id: `rimborso-${g}`, app_user_id: mio, event_timestamp_ms: t(4), cancel_reason: 'CUSTOMER_SUPPORT_REFUND', expiration_at_ms: scadenza });
  esito('rimborso: toglie subito', r.stato === 200 && r.corpo?.azione === 'togli', JSON.stringify(r.corpo));
  esito('🔑 la proiezione si SPEGNE', (await haInsieme()) === false);
}

console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log(`- che una coppia a DUE membri veda il diritto dell'altro: qui l'utente di prova
  e' solo. La proiezione lo prevede (join su membro_coppia), ma non e' misurato.
- che chi ESCE dalla coppia porti via il diritto a chi resta: e' l'asserzione
  che giustifica la proiezione calcolata invece che memorizzata, e serve una
  coppia a due piu' uno scioglimento. 🔑 Da fare, e' la piu' importante rimasta.
- la firma HMAC di RevenueCat: qui si usa l'header Authorization. Piu' debole
  contro un segreto trapelato dai log, equivalente contro un falsario.`);

console.log(`\n${falliti === 0 ? '✅ La catena regge, e il client non ha mai toccato la tabella.' : `🔴 ${falliti} FALLITI`}\n`);
process.exit(falliti === 0 ? 0 : 1);
