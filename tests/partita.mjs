// =============================================================================
// Una partita vera, giocata da due giocatori simulati contro il progetto REALE.
//   node tests/partita.mjs   (oppure: npm run test:partita)
//
// Perché esiste, ed è la ragione per cui non basta provarlo a mano sul telefono:
// **un gioco a due non è verificabile da una persona sola**, e una prova a due
// telefoni non è ripetibile — la si fa una volta, si dice «funziona», e alla
// modifica dopo nessuno la rifà. Qui i due giocatori sono due client con due
// sessioni vere, e ogni giro riparte da zero.
//
// ⚠️ E soprattutto verifica **la cosa che a mano non si può verificare**: che
// chi indovina non riesca a leggere la parola nemmeno interrogando l'API col
// proprio token. Sul telefono si vede solo che l'interfaccia non la mostra —
// che è un'altra affermazione, molto più debole (la lezione di D-12).
//
// Prerequisiti: come `rls.avversariali.mjs` — `.env` compilato e "Confirm
// email" spento nel dashboard. Crea utenti gioco-*@example.com.
//
// ⚠️ **Ripulisce ciò che crea** (a differenza di `rls.avversariali.mjs`, ed è
// proprio quella mancanza che ha fatto fallire la migrazione 0020 — vedi B-21).
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
let ok = 0;
let ko = 0;

function esito(descrizione, condizione, dettaglio = '') {
  if (condizione) {
    ok++;
    console.log(`  ok  ${descrizione}`);
  } else {
    ko++;
    console.log(`  KO  ${descrizione}${dettaglio ? ` — ${dettaglio}` : ''}`);
  }
}

async function utente(email) {
  const c = createClient(URL_SB, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) ({ data, error } = await c.auth.signUp({ email, password: PASSWORD }));
  if (error) throw new Error(`auth ${email}: ${error.message}`);
  if (!data.session)
    throw new Error(`nessuna sessione per ${email}: "Confirm email" è probabilmente attivo`);
  return { c, id: data.user.id };
}

/** Due utenti dentro la stessa coppia, formata davvero (D-14). */
async function coppiaDiDue() {
  const a = await utente('gioco-a@example.com');
  const b = await utente('gioco-b@example.com');

  const { data: gia } = await a.c
    .from('membro_coppia')
    .select('coppia_id')
    .is('uscito_il', null)
    .limit(1);
  if (gia?.length) {
    const { data: membri } = await a.c
      .from('membro_coppia')
      .select('utente_id')
      .eq('coppia_id', gia[0].coppia_id)
      .is('uscito_il', null);
    if ((membri ?? []).some((m) => m.utente_id === b.id)) return { a, b, coppia: gia[0].coppia_id };
  }

  // Il builder di Supabase e' un thenable, non una Promise: niente `.catch`.
  // Se la coppia esiste gia' l'errore torna dentro l'oggetto e si ignora.
  await a.c.rpc('crea_coppia');
  const { data: token } = await a.c.rpc('crea_invito');
  const { data: inv } = await b.c.rpc('apri_invito', { p_token: token });
  const { data: coppia, error } = await a.c.rpc('conferma_invito', { p_invito_id: inv });
  if (error) throw new Error(`formazione coppia: ${error.message}`);
  return { a, b, coppia };
}

/** Toglie di mezzo le partite vive: l'indice unico ne ammette una per gioco. */
async function pulisci(a, coppia) {
  await a.c
    .from('partita')
    .update({ stato: 'abbandonata' })
    .eq('coppia_id', coppia)
    .in('stato', ['attesa', 'in_corso']);
}

// =============================================================================
const { a, b, coppia } = await coppiaDiDue();
console.log(`\nCoppia di prova formata (${coppia.slice(0, 8)}…)\n`);
await pulisci(a, coppia);

// =============================================================================
// INDOVINA IL DISEGNO — cinque round, ruoli che si invertono
// =============================================================================
console.log('Indovina il disegno');
{
  const { data: partita, error } = await a.c
    .from('partita')
    .insert({ coppia_id: coppia, gioco: 'indovina_disegno', round_totali: 5 })
    .select('*')
    .single();
  esito('A crea la partita', !error && !!partita, error?.message);

  // --- «entrambi premono avvia» ---------------------------------------------
  const { data: dopoA } = await a.c.rpc('segna_pronto', { p_partita: partita.id });
  esito('con un solo pronto la partita NON parte', dopoA?.stato === 'attesa', `stato=${dopoA?.stato}`);

  const { data: dopoB } = await b.c.rpc('segna_pronto', { p_partita: partita.id });
  esito('quando premono in due la partita parte', dopoB?.stato === 'in_corso', `stato=${dopoB?.stato}`);

  // --- cinque round ----------------------------------------------------------
  let attesi = 0;
  for (let n = 1; n <= 5; n++) {
    // Il turno si ricava dal numero del round: dispari a chi ha creato.
    const disegna = n % 2 === 1 ? a : b;
    const indovina = n % 2 === 1 ? b : a;

    const { data: round, error: eR } = await disegna.c
      .from('partita_round')
      .insert({ partita_id: partita.id, numero: n, disegnatore_id: disegna.id })
      .select('*')
      .single();
    if (eR) {
      esito(`round ${n}: creato`, false, eR.message);
      break;
    }

    const parola = n === 3 ? 'cat' : 'dog';
    const { error: eS } = await disegna.c
      .from('round_segreto')
      .insert({ round_id: round.id, chiave: parola });
    esito(`round ${n}: chi disegna scrive la parola`, !eS, eS?.message);

    // 🔴 L'asserzione per cui esiste tutta la tabella `round_segreto`.
    const { data: sbircia } = await indovina.c
      .from('round_segreto')
      .select('*')
      .eq('round_id', round.id);
    esito(
      `round ${n}: 🔴 chi indovina NON legge la parola`,
      (sbircia ?? []).length === 0,
      `righe lette: ${(sbircia ?? []).length}`
    );

    const { data: propria } = await disegna.c
      .from('round_segreto')
      .select('chiave')
      .eq('round_id', round.id)
      .maybeSingle();
    esito(`round ${n}: chi disegna la rilegge`, propria?.chiave === parola);

    // Round dispari indovinati, pari scaduti: così il punteggio atteso non è
    // né tutto né niente, e un conteggio sbagliato si vede.
    const vinto = n % 2 === 1;
    if (vinto) attesi++;
    const { data: dopo, error: eC } = await disegna.c.rpc('chiudi_round', {
      p_round: round.id,
      p_esito: vinto ? 'vinto' : 'scaduto',
      p_punti: vinto ? 1 : 0,
      p_chiave: parola,
    });
    esito(`round ${n}: chiuso (${vinto ? 'vinto' : 'scaduto'})`, !eC, eC?.message);
    if (dopo) {
      esito(`round ${n}: il punteggio sale a ${attesi}`, dopo.punti === attesi, `punti=${dopo.punti}`);
    }

    // Chiudere due volte lo stesso round non deve raddoppiare niente.
    if (n === 1) {
      const { data: bis } = await disegna.c.rpc('chiudi_round', {
        p_round: round.id,
        p_esito: 'vinto',
        p_punti: 1,
        p_chiave: parola,
      });
      esito('chiudere due volte lo stesso round non raddoppia i punti', bis?.punti === attesi, `punti=${bis?.punti}`);
    }
  }

  const { data: finale } = await a.c.from('partita').select('*').eq('id', partita.id).single();
  esito('dopo il quinto round la partita è conclusa', finale?.stato === 'conclusa', `stato=${finale?.stato}`);
  esito(`punteggio finale ${attesi}/5`, finale?.punti === attesi, `punti=${finale?.punti}`);
}

// =============================================================================
// TELEPATIA — il sigillo di D-12, che è la parte che conta
// =============================================================================
console.log('\nTelepatia');
{
  await pulisci(a, coppia);
  const { data: partita } = await a.c
    .from('partita')
    .insert({ coppia_id: coppia, gioco: 'telepatia', round_totali: 10 })
    .select('*')
    .single();
  await a.c.rpc('segna_pronto', { p_partita: partita.id });
  const { data: viva } = await b.c.rpc('segna_pronto', { p_partita: partita.id });
  esito('la partita di telepatia parte con due pronti', viva?.stato === 'in_corso');

  const { data: round } = await a.c
    .from('partita_round')
    .insert({
      partita_id: partita.id,
      numero: 1,
      opzioni: { tema: 'A colour', scelte: ['red', 'blue', 'green', 'yellow'] },
    })
    .select('*')
    .single();
  esito('le quattro opzioni sono visibili a chi non le ha scritte', !!round);
  const { data: vedeB } = await b.c
    .from('partita_round')
    .select('opzioni')
    .eq('id', round.id)
    .maybeSingle();
  esito('e sono le STESSE per tutti e due', JSON.stringify(vedeB?.opzioni) === JSON.stringify(round.opzioni));

  // --- A sceglie, B non ha ancora scelto -------------------------------------
  await a.c.from('invio_sigillato').insert({
    partita_id: partita.id,
    round: 1,
    natura: 'scelta',
    contenuto: { chiave: 'blue' },
  });

  const { data: sbircia } = await b.c
    .from('invio_sigillato')
    .select('*')
    .eq('partita_id', partita.id);
  esito('🔴 D-12: B non legge la scelta di A', (sbircia ?? []).length === 0, `righe: ${(sbircia ?? []).length}`);

  const { data: presto } = await a.c.rpc('rivela_telepatia', { p_partita: partita.id, p_round: 1 });
  esito(
    '🔴 con una sola scelta la rivelazione non dice NIENTE',
    (presto ?? []).length === 0,
    `righe: ${(presto ?? []).length}`
  );
  const { data: prestoB } = await b.c.rpc('rivela_telepatia', { p_partita: partita.id, p_round: 1 });
  esito('e non lo dice nemmeno a chi non ha ancora scelto', (prestoB ?? []).length === 0);

  // --- B sceglie: adesso si rivela -------------------------------------------
  await b.c.from('invio_sigillato').insert({
    partita_id: partita.id,
    round: 1,
    natura: 'scelta',
    contenuto: { chiave: 'blue' },
  });

  const { data: rivelato } = await b.c.rpc('rivela_telepatia', { p_partita: partita.id, p_round: 1 });
  esito('con due scelte la rivelazione dà entrambe', (rivelato ?? []).length === 2, `righe: ${(rivelato ?? []).length}`);
  const scelte = (rivelato ?? []).map((r) => r.scelta);
  esito('le due scelte coincidono, quindi è un punto', scelte[0] === scelte[1] && scelte[0] === 'blue');

  const { data: dopo } = await a.c.rpc('chiudi_round', {
    p_round: round.id,
    p_esito: 'vinto',
    p_punti: 1,
  });
  esito('il punto della telepatia è contato', dopo?.punti === 1, `punti=${dopo?.punti}`);
  esito('e la partita da dieci round NON è conclusa al primo', dopo?.stato === 'in_corso', `stato=${dopo?.stato}`);
}

// =============================================================================
await pulisci(a, coppia);
console.log(`\n${ok}/${ok + ko} asserzioni passate`);
if (ko > 0) {
  console.error(`${ko} fallite.`);
  process.exit(1);
}
console.log('Le due partite girano contro il database vero.\n');
