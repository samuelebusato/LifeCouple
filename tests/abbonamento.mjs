// =============================================================================
// Test del diritto a pagamento (0041) — si eseguono contro il progetto REALE.
//   node tests/abbonamento.mjs   (oppure: npm run test:abbonamento)
//
// Scritti PRIMA che la 0041 sia applicata, e prima che esista una riga di
// codice dei pagamenti: girando adesso devono FALLIRE dicendo «0041 non
// applicata». Un test che nasce verde non dimostra niente — e' la stessa
// disciplina con cui sono nate le asserzioni della 0039.
//
// ## Cosa si sta misurando, e perche' e' la cosa piu' importante di 0041
//
// 🔑 La tabella `abbonamento` ha UNA policy, di sola lettura. Non e' una
//    dimenticanza: con RLS attiva cio' che nessuna policy permette e' vietato,
//    quindi l'assenza di policy di scrittura E' la mitigazione — il client non
//    puo' concedersi il diritto nemmeno con un token valido.
//
// ⚠️ Il rischio di questa forma e' che sembra funzionare anche quando non
//    funziona: se un domani qualcuno aggiungesse una policy di `insert` «per
//    comodita'», nessuna schermata cambierebbe e nessun errore comparirebbe.
//    Ci accorgeremmo che il prodotto e' gratis solo guardando gli incassi.
//    Questo file e' l'unica cosa che lo intercetta.
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

let { data, error } = await c.auth.signInWithPassword({
  email: 'abb-1@example.com',
  password: PASSWORD,
});
if (error) ({ data, error } = await c.auth.signUp({ email: 'abb-1@example.com', password: PASSWORD }));
if (error) throw new Error(`auth: ${error.message}`);
const mio = data.user.id;

let cid = (await c.from('membro_coppia').select('coppia_id').is('uscito_il', null).limit(1)).data?.[0]?.coppia_id;
if (!cid) cid = (await c.rpc('crea_coppia')).data;

console.log('\nAbbonamento — il diritto che il client non puo darsi');
console.log('='.repeat(60) + '\n');

// --- 1. Il client non puo' scriversi il diritto ------------------------------
{
  const { error: e } = await c.from('abbonamento').insert({ utente_id: mio, attivo: true });
  const rls = /row-level security|violates/i.test(e?.message ?? '');
  const assente = /does not exist|schema cache/i.test(e?.message ?? '');
  esito(
    '0041: un client NON puo inserire il proprio abbonamento',
    rls,
    assente ? '0041 non applicata' : (e?.message ?? '🔴 NESSUN ERRORE: la insert e passata')
  );
}

// --- 2. La lettura della propria riga e' permessa (e non trova niente) -------
{
  const { data: righe, error: e } = await c.from('abbonamento').select('attivo').eq('utente_id', mio);
  const assente = /does not exist|schema cache/i.test(e?.message ?? '');
  esito(
    '0041: il client PUO leggere la propria riga (zero righe, nessun errore)',
    !e && Array.isArray(righe),
    assente ? '0041 non applicata' : (e?.message ?? `righe=${righe?.length}`)
  );
}

// --- 3. La proiezione sulla propria coppia -----------------------------------
{
  const { data: v, error: e } = await c.rpc('coppia_ha_insieme', { cid });
  const assente = /does not exist|schema cache|function/i.test(e?.message ?? '');
  esito(
    '0041: coppia_ha_insieme sulla PROPRIA coppia risponde (false, nessuno paga)',
    !e && v === false,
    assente ? '0041 non applicata' : (e?.message ?? `valore=${v}`)
  );
}

// --- 4. Il cancello di TB-3 --------------------------------------------------
// ⚠️ Asserzione onesta ma DEBOLE finche' nessuno e' abbonato: una coppia
//    estranea e non abbonata darebbe false comunque. Cio' che prova oggi e' che
//    la funzione non esplode e non e' un oracolo raggiungibile; la prova piena
//    arriva quando esistera' un abbonato vero (vedi «non coperti»).
{
  const { data: v, error: e } = await c.rpc('coppia_ha_insieme', {
    cid: '00000000-0000-4000-8000-0000000000ff',
  });
  const assente = /does not exist|schema cache|function/i.test(e?.message ?? '');
  esito(
    '0041: coppia_ha_insieme su una coppia ALTRUI torna false',
    !e && v === false,
    assente ? '0041 non applicata' : (e?.message ?? `valore=${v}`)
  );
}

console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log(`- che un abbonamento ATTIVO accenda davvero la proiezione: nessun client puo
  scrivere quella riga, ed e' il punto. Serve la service_role — che non entra in
  questo repo — o la Edge Function del webhook, quando esistera'.
- che il diritto SI SPENGA per chi resta quando l'abbonato ESCE dalla coppia:
  e' l'asserzione che giustifica la forma dell'intera 0041 (proiezione calcolata
  e non memorizzata), e ha lo stesso problema: serve prima un abbonato vero.
  🔑 Da fare nello stesso giro in cui il webhook diventa provabile, non dopo.
- che il PARTNER non legga la riga dell'altro: oggi non esistono righe, quindi
  «zero righe» non distingue «non c'e'» da «non lo vedo» (B-03).
- rimborsi, scadenze e eventi fuori ordine: sono della Edge Function, non dello
  schema. Il loro threat model e' gia' scritto (docs/threat-model.md §4-ter).`);

console.log(`\n${falliti === 0 ? '✅ Il client non puo darsi il diritto, e la proiezione risponde.' : `🔴 ${falliti} TEST FALLITI`}\n`);
process.exit(falliti === 0 ? 0 : 1);
