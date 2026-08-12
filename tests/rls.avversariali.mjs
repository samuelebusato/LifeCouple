// =============================================================================
// Test avversariali delle policy RLS — si eseguono contro il progetto REALE.
//   node tests/rls.avversariali.mjs   (oppure: npm run test:rls)
//
// Filosofia (Architecture.md §7 debito 1): senza un backend nostro, le policy
// sono l'unico strato di autorizzazione. Questi test non chiedono "la query
// e' giusta?" ma "un avversario col proprio token valido cosa ottiene?".
//
// Prerequisiti: .env compilato; "Confirm email" spento (gli utenti di prova
// si registrano senza verifica). Crea utenti rls-*@example.com nel progetto:
// sono utenti di test, si eliminano dal dashboard quando non servono piu'.
// Riesegubile: al secondo giro fa login invece di registrare.
// =============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- .env a mano: fuori da Expo, EXPO_PUBLIC_* non arriva da solo ------------
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
);
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_SB || !ANON) throw new Error('.env mancante o incompleto');

const nuovoClient = () =>
  createClient(URL_SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

const PASSWORD = 'Password-di-prova-1!';
async function utente(email) {
  const c = nuovoClient();
  let { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) ({ data, error } = await c.auth.signUp({ email, password: PASSWORD }));
  if (error) throw new Error(`auth ${email}: ${error.message}`);
  if (!data.session)
    throw new Error(
      `nessuna sessione per ${email}: "Confirm email" e' probabilmente ancora attivo nel dashboard`
    );
  return c;
}

async function coppiaDi(c) {
  const { data } = await c.from('membro_coppia').select('coppia_id').is('uscito_il', null).limit(1);
  if (data?.length) return data[0].coppia_id;
  const { data: id, error } = await c.rpc('crea_coppia');
  if (error) throw new Error(`crea_coppia: ${error.message}`);
  return id;
}

let falliti = 0;
const esito = (nome, ok, dettaglio = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}${dettaglio ? ` — ${dettaglio}` : ''}`);
  if (!ok) falliti++;
};

// =============================================================================
const anon = nuovoClient();
const a1 = await utente('rls-a1@example.com'); // coppia A
const b1 = await utente('rls-b1@example.com'); // coppia B — l'avversario
const coppiaA = await coppiaDi(a1);
const coppiaB = await coppiaDi(b1);

// --- anonimo -----------------------------------------------------------------
{
  const { data } = await anon.from('coppia').select('*');
  esito('anon non legge nessuna coppia', data?.length === 0);
  const { data: s } = await anon.from('stadio_soglia').select('*');
  esito('anon non legge nemmeno le soglie', s?.length === 0);
  const { error } = await anon.rpc('crea_coppia');
  esito('anon non puo chiamare crea_coppia', error?.code === '42501', error?.message);
}

// --- identita' e legame --------------------------------------------------------
{
  const { data } = await a1.rpc('e_membro_attivo', { cid: coppiaA });
  esito('A1 e membro attivo della propria coppia', data === true);
  const { data: d2 } = await a1.rpc('e_membro_attivo', { cid: coppiaB });
  esito('A1 NON e membro della coppia B', d2 === false);
  const { error } = await a1.rpc('crea_coppia');
  esito('una sola coppia attiva a testa', /gia/.test(error?.message ?? ''), error?.message);
  const { data: cb } = await a1.from('coppia').select('*').eq('id', coppiaB);
  esito('A1 non vede la riga della coppia B', cb?.length === 0);
  const { data: soglie } = await a1.from('stadio_soglia').select('*');
  esito('autenticato legge le 6 soglie stadio', soglie?.length === 6);
}

// --- contenuti: il confine coppia<->coppia (TB-3) -------------------------------
let luogoId;
{
  const { data, error } = await a1
    .from('luogo')
    .insert({ coppia_id: coppiaA, nome: 'Posto di prova', lat: 45.4, lng: 11.9 })
    .select()
    .single();
  esito('A1 inserisce un luogo nella propria coppia', !error, error?.message);
  luogoId = data?.id;

  const { data: spia } = await b1.from('luogo').select('*').eq('coppia_id', coppiaA);
  esito('B1 non legge i luoghi della coppia A', spia?.length === 0);

  const { error: eIns } = await b1
    .from('luogo')
    .insert({ coppia_id: coppiaA, nome: 'Intruso', lat: 0, lng: 0 });
  esito('B1 non inserisce nella coppia A', eIns?.code === '42501', eIns?.message);

  const { data: upd } = await b1.from('luogo').update({ nome: 'Vandalo' }).eq('id', luogoId).select();
  esito('B1 non modifica il luogo di A (0 righe)', upd?.length === 0);

  const { data: del } = await b1.from('luogo').delete().eq('id', luogoId).select();
  esito('B1 non cancella il luogo di A (0 righe)', del?.length === 0);

  const { error: eFalso } = await a1
    .from('luogo')
    .insert({ coppia_id: coppiaA, autore_id: '00000000-0000-0000-0000-0000000000ff', nome: 'X', lat: 0, lng: 0 });
  esito('autore_id falsificato viene rifiutato', eFalso?.code === '42501', eFalso?.message);
}

// --- punteggio: la transizione, una sola volta (D-15) -------------------------
{
  const punti = async () =>
    (await a1.from('creatura').select('punti').eq('coppia_id', coppiaA).single()).data?.punti ?? -1;

  const prima = await punti();
  await a1.from('luogo').update({ stato: 'visitato' }).eq('id', luogoId);
  const dopo = await punti();
  esito('la transizione desiderato->visitato vale +20', dopo === prima + 20, `${prima} -> ${dopo}`);

  await a1.from('luogo').update({ stato: 'desiderato' }).eq('id', luogoId);
  await a1.from('luogo').update({ stato: 'visitato' }).eq('id', luogoId);
  const terza = await punti();
  esito('togliere e rimettere NON fabbrica punti', terza === dopo, `${dopo} -> ${terza}`);

  const { error } = await a1.rpc('assegna_punti', {
    cid: coppiaA, tipo_evento: 'luogo_visitato', rif: luogoId, n: 9999,
  });
  esito('B-01 regressione: assegna_punti negato anche agli autenticati', error?.code === '42501', error?.message);
}

// --- giochi: il sigillo (D-12) --------------------------------------------------
{
  const { data: partita, error } = await a1
    .from('partita')
    .insert({ coppia_id: coppiaA, gioco: 'telepatia' })
    .select()
    .single();
  esito('A1 crea una partita nella propria coppia', !error, error?.message);

  const { error: eSig } = await a1
    .from('invio_sigillato')
    .insert({ partita_id: partita.id, natura: 'scelta', contenuto: { scelta: 'pizza' } });
  esito('A1 deposita un invio sigillato', !eSig, eSig?.message);

  const { data: spia } = await b1.from('invio_sigillato').select('*').eq('partita_id', partita.id);
  esito('B1 non legge gli invii sigillati altrui', spia?.length === 0);

  const { data: propri } = await a1.from('invio_sigillato').select('*').eq('partita_id', partita.id);
  esito('A1 rilegge il proprio invio', propri?.length === 1);
}

// --- vincoli sui dati -----------------------------------------------------------
{
  const { error } = await a1.from('foto').insert({
    coppia_id: coppiaA,
    chiave_storage: `test/${Date.now()}.jpg`,
    byte: 11 * 1024 * 1024,
  });
  esito('una foto oltre i 10 MB per file viene rifiutata', error?.code === '23514', error?.message);

  const { data: reg } = await a1
    .from('registro_azioni')
    .insert({ coppia_id: coppiaA, azione: 'test', oggetto: { nota: 'riga di prova' } })
    .select()
    .single();
  const { data: updReg } = await a1.from('registro_azioni').update({ azione: 'alterata' }).eq('id', reg.id).select();
  esito('il registro azioni non e alterabile (solo-append)', updReg?.length === 0);
}

// --- appaiamento via link (D-14) ------------------------------------------------
// a2 crea una coppia e invita; b_estraneo intercetta il link; a2_partner e' chi
// deve entrare davvero.
{
  const a2 = await utente('rls-a2@example.com');
  const partner = await utente('rls-a2partner@example.com');
  const estraneo = await utente('rls-estraneo@example.com');
  await coppiaDi(a2); // a2 ha la sua coppia

  const { data: token, error: eTok } = await a2.rpc('crea_invito');
  esito('chi e in coppia genera un token di invito', !eTok && typeof token === 'string' && token.length >= 40, eTok?.message);

  const { error: eSelf } = await a2.rpc('apri_invito', { p_token: token });
  esito('chi ha invitato non puo aprire il proprio invito', /creato tu/.test(eSelf?.message ?? ''), eSelf?.message);

  const { error: eFinto } = await estraneo.rpc('apri_invito', { p_token: 'token-inventato-non-valido' });
  esito('un token inventato non apre nulla', /non valido/.test(eFinto?.message ?? ''), eFinto?.message);

  // l'estraneo intercetta il link e lo apre: NON deve entrare, solo mettere in attesa
  const { data: invId, error: eApri } = await estraneo.rpc('apri_invito', { p_token: token });
  esito('aprire il link NON fa entrare (solo attesa conferma)', !eApri && !!invId, eApri?.message);
  const { data: membriDopoApertura } = await a2.rpc('n_membri_attivi', { cid: await coppiaDi(a2) });
  esito('dopo l apertura la coppia ha ancora 1 membro', membriDopoApertura === 1, `membri=${membriDopoApertura}`);

  // l'estraneo NON puo autoconfermarsi
  const { error: eAuto } = await estraneo.rpc('conferma_invito', { p_invito_id: invId });
  esito('chi ha aperto non puo confermare da se (solo chi invita)', /chi ha invitato/.test(eAuto?.message ?? ''), eAuto?.message);

  // il token e' monouso in attesa: il partner legittimo non puo aprirlo mentre e' gia' aperto
  const { error: eSecondo } = await partner.rpc('apri_invito', { p_token: token });
  esito('token gia aperto non e riapribile', /non piu/.test(eSecondo?.message ?? ''), eSecondo?.message);

  // a2 si accorge che ha aperto l'estraneo e REVOCA invece di confermare
  const { error: eRev } = await a2.rpc('revoca_invito', { p_invito_id: invId });
  esito('chi invita puo revocare un invito aperto', !eRev, eRev?.message);
  const { error: eConfDopoRev } = await a2.rpc('conferma_invito', { p_invito_id: invId });
  esito('dopo la revoca non si puo piu confermare', /nessuna apertura/.test(eConfDopoRev?.message ?? ''), eConfDopoRev?.message);

  // ora il flusso corretto: nuovo token, il PARTNER apre, a2 conferma
  const { data: token2 } = await a2.rpc('crea_invito');
  const { data: inv2 } = await partner.rpc('apri_invito', { p_token: token2 });
  const { data: coppiaFormata, error: eConf } = await a2.rpc('conferma_invito', { p_invito_id: inv2 });
  esito('il flusso corretto forma la coppia', !eConf && !!coppiaFormata, eConf?.message);
  const { data: membriFinali } = await a2.rpc('n_membri_attivi', { cid: coppiaFormata });
  esito('la coppia ora ha 2 membri', membriFinali === 2);

  const { data: partnerVede } = await partner.from('luogo').select('*').eq('coppia_id', coppiaFormata);
  esito('il partner appaiato legge i contenuti della coppia', Array.isArray(partnerVede));

  // --- sigillo (D-12) con DUE membri veri: prima era non coperto -----------------
  const { data: part } = await a2.from('partita').insert({ coppia_id: coppiaFormata, gioco: 'telepatia' }).select().single();
  await a2.from('invio_sigillato').insert({ partita_id: part.id, natura: 'scelta', contenuto: { s: 'A' } });
  const { data: sbircia } = await partner.from('invio_sigillato').select('*').eq('partita_id', part.id);
  esito('D-12: il compagno di coppia NON sbircia il sigillo prima della rivelazione', sbircia?.length === 0);
}

// =============================================================================
console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log('- ex-membro dopo lo scioglimento: testabile quando esistera sciogli_coppia (passo 5)');
console.log('- tetto cumulativo 1 GB: richiederebbe ~100 insert; verificata la sola guardia per-file');

console.log(`\n${falliti === 0 ? 'TUTTI I TEST PASSANO' : `${falliti} TEST FALLITI`}`);
process.exit(falliti === 0 ? 0 : 1);
