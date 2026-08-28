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

/**
 * Quanti membri attivi ha una coppia, **contati passando dalla RLS**.
 *
 * Prima questi conteggi usavano `n_membri_attivi`, che e' `security definer` e
 * quindi scavalca la RLS per costruzione. Funzionava, ma era il test che si
 * appoggiava proprio alla scorciatoia chiusa da B-07 — e chiuderla ha fatto
 * fallire tre asserzioni che credevano di verificare il dominio e verificavano
 * un privilegio.
 *
 * Contare con una select normale e' anche **piu' forte**: e' la stessa strada
 * che percorre l'app, quindi verifica insieme il dato e la policy che lo
 * protegge. Vale pero' solo per chi e' ancora membro: da fuori la risposta e'
 * `0` sia se i membri non ci sono sia se non si possono vedere, e le due cose
 * non vanno confuse (e' la lezione di B-03).
 */
async function membriAttivi(client, cid) {
  const { data } = await client
    .from('membro_coppia')
    .select('utente_id')
    .eq('coppia_id', cid)
    .is('uscito_il', null);
  return data?.length ?? 0;
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

// --- anonimo: le funzioni di appaiamento (B-07) -------------------------------
// Questi casi mancavano, ed e' il motivo per cui B-07 e' vissuto indisturbato
// dal 2026-08-12 al 2026-08-27: il test copriva `crea_coppia` — chiusa bene
// dalla 0002, che revocava esplicitamente `from public, anon` — e dava per
// buone le altre, chiuse invece con `revoke from public` soltanto.
//
// ⚠️ Si controlla il **codice 42501**, non il fatto che la chiamata fallisca.
// Fallivano anche prima: con `P0001`, cioe' fermate dalla guardia interna
// invece che dai permessi. Un test su "ha dato errore" sarebbe passato verde
// sul difetto — ed e' esattamente l'errore che questo commento esiste per non
// far ripetere.
{
  const chiuse = [
    ['crea_invito', {}],
    ['apri_invito', { p_token: 'token-inventato' }],
    ['conferma_invito', { p_invito_id: '00000000-0000-0000-0000-000000000000' }],
    ['revoca_invito', { p_invito_id: '00000000-0000-0000-0000-000000000000' }],
  ];
  for (const [nome, args] of chiuse) {
    const { error } = await anon.rpc(nome, args);
    esito(
      `anon fermata ai PERMESSI su ${nome} (non dalla guardia interna)`,
      error?.code === '42501',
      `atteso 42501, ricevuto ${error?.code ?? 'nessun errore'}: ${error?.message ?? ''}`
    );
  }

  // Le due `security definer` che scavalcano la RLS per costruzione: a un
  // anonimo non devono nemmeno rispondere. Prima restituivano `false` e `0`,
  // cioe' un oracolo su `membro_coppia` per chiunque avesse la chiave pubblica.
  const oracoli = [
    ['ha_coppia_attiva', { uid: '00000000-0000-0000-0000-000000000000' }],
    ['n_membri_attivi', { cid: '00000000-0000-0000-0000-000000000000' }],
  ];
  for (const [nome, args] of oracoli) {
    const { error } = await anon.rpc(nome, args);
    esito(
      `anon non puo interrogare ${nome}`,
      error?.code === '42501',
      `atteso 42501, ricevuto ${error?.code ?? 'nessun errore'}: ${error?.message ?? ''}`
    );
  }
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
  // 🔑 **Si pulisce PRIMA, non dopo** (B-21).
  //
  // Questi test creano una partita a ogni esecuzione, e per due settimane non
  // ne hanno mai tolta una: il 2026-08-28 quelle righe hanno fatto fallire la
  // migrazione 0020, che stringeva il vincolo sugli stati e trovava valori del
  // ciclo di vita vecchio.
  //
  // La prima stesura di questa pulizia stava in coda al file — e non serviva a
  // niente: se il test fallisce prima, la coda non viene mai raggiunta. E'
  // successo al primo tentativo, con l'indice `partita_una_viva` che rifiutava
  // la partita nuova per colpa di quella vecchia. **Pulire dopo funziona solo
  // se il test riesce; pulire prima funziona sempre.**
  //
  // ⚠️ Prima del 2026-08-28 questa pulizia non si sarebbe potuta scrivere
  // affatto: mancava la policy di update su `partita` (B-23), quindi l'UPDATE
  // sarebbe tornato «riuscito» senza toccare niente. Il difetto che impediva di
  // ripulire era lo stesso che rendeva invisibile il non aver ripulito.
  await a1.from('partita').update({ stato: 'abbandonata' }).in('stato', ['attesa', 'in_corso']);
  const { data: vive } = await a1.from('partita').select('id').in('stato', ['attesa', 'in_corso']);
  esito(
    'la pulizia iniziale non lascia partite vive (B-21)',
    (vive ?? []).length === 0,
    // Sul PASS questo dettaglio si stampa comunque: tenerlo neutro. Il
    // perche' di un eventuale fallimento sta nel commento qui sopra.
    `vive: ${(vive ?? []).length}`
  );

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

// --- calendario: il confine vale anche per gli eventi ---------------------------
// I contenuti condividono la stessa forma di policy, ma "stessa forma" non e'
// "verificato": ora che il calendario esiste davvero, l'evento si prova.
{
  const { data: mio, error: eIns } = await a1
    .from('evento')
    .insert({ coppia_id: coppiaA, titolo: 'Cena di prova', inizio: '2026-12-24T20:00:00Z' })
    .select()
    .single();
  esito('A1 mette un evento nel proprio calendario', !eIns, eIns?.message);

  const { data: visti } = await b1.from('evento').select('*').eq('coppia_id', coppiaA);
  esito('B1 non legge il calendario della coppia A', visti?.length === 0);

  const { error: eDel } = await b1.from('evento').delete().eq('id', mio?.id);
  const { data: ancora } = await a1.from('evento').select('id').eq('id', mio?.id);
  esito('B1 non cancella un evento altrui', !eDel && ancora?.length === 1);

  await a1.from('evento').delete().eq('id', mio?.id); // il campo resta pulito
}

// --- appaiamento via link (D-14) ------------------------------------------------
// a2 crea una coppia e invita; b_estraneo intercetta il link; a2_partner e' chi
// deve entrare davvero.
{
  const a2 = await utente('rls-a2@example.com');
  const partner = await utente('rls-a2partner@example.com');
  const estraneo = await utente('rls-estraneo@example.com');
  // Il giro precedente li ha lasciati appaiati, e su una coppia completa non si
  // generano inviti: senza questa pulizia il blocco passa una volta sola, il
  // giorno che lo si scrive. Prima di `sciogli_coppia` non era possibile farla.
  for (const c of [a2, partner, estraneo]) await c.rpc('sciogli_coppia');
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
  // a2 e' ancora membro della propria coppia, quindi puo' contarla lui stesso:
  // e' l'asserzione centrale di D-14 — il link intercettato NON fa entrare.
  const membriDopoApertura = await membriAttivi(a2, await coppiaDi(a2));
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
  const membriFinali = await membriAttivi(a2, coppiaFormata);
  esito('la coppia ora ha 2 membri', membriFinali === 2, `membri=${membriFinali}`);

  const { data: partnerVede } = await partner.from('luogo').select('*').eq('coppia_id', coppiaFormata);
  esito('il partner appaiato legge i contenuti della coppia', Array.isArray(partnerVede));

  // --- sigillo (D-12) con DUE membri veri: prima era non coperto -----------------
  await a2.from('partita').update({ stato: 'abbandonata' }).in('stato', ['attesa', 'in_corso']);
  const { data: part } = await a2.from('partita').insert({ coppia_id: coppiaFormata, gioco: 'telepatia' }).select().single();
  await a2.from('invio_sigillato').insert({ partita_id: part.id, natura: 'scelta', contenuto: { s: 'A' } });
  const { data: sbircia } = await partner.from('invio_sigillato').select('*').eq('partita_id', part.id);
  esito('D-12: il compagno di coppia NON sbircia il sigillo prima della rivelazione', sbircia?.length === 0);
}

// =============================================================================
// SCIOGLIMENTO (D-04 / D-16 / D-21) — era l'ultimo caso dichiarato non coperto.
// La domanda avversariale qui non e' "la query e' giusta?" ma: dopo la rottura,
// **cosa resta in mano all'ex?** Se restasse una foto dell'altro, sarebbe
// esattamente il danno che D-04 esiste per impedire.
// =============================================================================
{
  const s1 = await utente('rls-s1@example.com');
  const s2 = await utente('rls-s2@example.com');
  const id1 = (await s1.auth.getUser()).data.user.id;
  const id2 = (await s2.auth.getUser()).data.user.id;

  // Si parte da zero anche alla seconda esecuzione: se sono ancora appaiati da
  // un giro precedente, si sciolgono prima (l'errore "non sei in una coppia" e'
  // il caso normale al primo giro e si ignora).
  await s1.rpc('sciogli_coppia');
  await s2.rpc('sciogli_coppia');

  const cid = await coppiaDi(s1);
  const { data: tokS } = await s1.rpc('crea_invito');
  const { data: invS } = await s2.rpc('apri_invito', { p_token: tokS });
  const { error: eConfS } = await s1.rpc('conferma_invito', { p_invito_id: invS });
  esito('scioglimento: coppia di prova formata', !eConfS, eConfS?.message);

  // --- si riempie la storia: condivisi di S1, personali di S2 su quei condivisi
  await s1.from('evento').insert({ coppia_id: cid, titolo: 'Anniversario', inizio: '2026-09-01T20:00:00Z' });
  const { data: luogoS1 } = await s1
    .from('luogo')
    .insert({ coppia_id: cid, nome: 'La nostra spiaggia', lat: 45.1, lng: 12.3 })
    .select()
    .single();
  const { data: elemS1 } = await s1
    .from('elemento_lista')
    .insert({ coppia_id: cid, tipo: 'film', titolo: 'Il film di quella sera' })
    .select()
    .single();
  await s2.from('recensione').insert({ coppia_id: cid, elemento_id: elemS1.id, voto: 5, testo: 'bellissimo' });
  const chiave = `prova/${id2}/${cid}.jpg`;
  await s2.from('foto').delete().eq('chiave_storage', chiave); // riesecuzione pulita
  await s2.from('foto').insert({ coppia_id: cid, chiave_storage: chiave, luogo_id: luogoS1.id, byte: 1234 });

  const { data: primaS2 } = await s2.from('foto').select('*').eq('coppia_id', cid);
  esito('prima della rottura: S2 vede foto nella coppia', (primaS2?.length ?? 0) >= 1);

  // --- la rottura, decisa da S1 e subita da S2 -------------------------------
  const { error: eSci } = await s1.rpc('sciogli_coppia');
  esito('S1 scioglie la coppia', !eSci, eSci?.message);

  // ⚠️ Qui il conteggio **non e' osservabile**, e va detto invece che aggirato.
  // `sciogli_coppia` mette `uscito_il` a TUTTI i membri, quindi dopo la rottura
  // nessuno dei due vede piu' `membro_coppia` per quella coppia: una select
  // torna 0 sia perche' i membri attivi non ci sono sia perche' non si possono
  // vedere. Sono due cose diverse (B-03), e questa asserzione non le distingue.
  //
  // Prima la distingueva solo perche' `n_membri_attivi` scavalcava la RLS —
  // cioe' grazie al difetto B-07. Verificarlo di nuovo richiederebbe la chiave
  // service_role, che in questo repo non deve entrare. Si asserisce quindi
  // cio' che si vede davvero, e il residuo sta fra i casi dichiarati non
  // coperti in fondo.
  //
  // Il fatto che conta e' comunque coperto, e piu' avanti: dopo la rottura
  // nessuno dei due legge, scrive o invita su quella coppia.
  const membriVistiDaS1 = await membriAttivi(s1, cid);
  esito(
    'dopo lo scioglimento S1 non vede piu nessun membro attivo',
    membriVistiDaS1 === 0,
    `visti=${membriVistiDaS1}`
  );

  // D-04: cio' che ha caricato l'altro sparisce dalla vista
  const { data: fotoViste1 } = await s1.from('foto').select('*').eq('coppia_id', cid);
  esito(
    'D-04: l ex NON vede piu la foto caricata dall altro',
    (fotoViste1?.length ?? 0) === 0,
    `viste=${fotoViste1?.length}`
  );
  const { data: fotoViste2 } = await s2.from('foto').select('autore_id').eq('coppia_id', cid);
  esito(
    'D-04: ciascuno conserva le proprie foto',
    (fotoViste2?.length ?? 0) === 1 && fotoViste2[0].autore_id === id2
  );

  // D-21: i condivisi duplicati, una copia a ciascuno, e ognuno vede la sua
  for (const [nome, c, id] of [['S1', s1, id1], ['S2', s2, id2]]) {
    const { data: ev } = await c.from('evento').select('autore_id').eq('coppia_id', cid);
    const { data: lu } = await c.from('luogo').select('autore_id').eq('coppia_id', cid);
    const { data: el } = await c.from('elemento_lista').select('autore_id').eq('coppia_id', cid);
    esito(
      `D-21: ${nome} conserva una copia propria di evento, luogo ed elemento`,
      ev?.length === 1 && lu?.length === 1 && el?.length === 1 &&
        ev[0].autore_id === id && lu[0].autore_id === id && el[0].autore_id === id,
      `evento=${ev?.length} luogo=${lu?.length} elemento=${el?.length}`
    );
  }

  // I legami sono stati ricuciti sulla copia giusta, non lasciati appesi
  const { data: recS2 } = await s2.from('recensione').select('elemento_id').eq('coppia_id', cid);
  const { data: elS2 } = await s2.from('elemento_lista').select('id').eq('coppia_id', cid);
  esito(
    'la recensione di S2 e attaccata alla copia di S2, non a quella sparita',
    recS2?.length === 1 && elS2?.length === 1 && recS2[0].elemento_id === elS2[0].id
  );
  const { data: fotoS2 } = await s2.from('foto').select('luogo_id').eq('coppia_id', cid);
  const { data: luS2 } = await s2.from('luogo').select('id').eq('coppia_id', cid);
  esito(
    'la foto di S2 e attaccata alla copia del luogo di S2',
    fotoS2?.[0]?.luogo_id === luS2?.[0]?.id
  );

  // D-16: la creatura sparisce per entrambi
  const { data: cr1 } = await s1.from('creatura').select('*').eq('coppia_id', cid);
  const { data: cr2 } = await s2.from('creatura').select('*').eq('coppia_id', cid);
  esito('D-16: la creatura sparisce per entrambi', cr1?.length === 0 && cr2?.length === 0);

  // A una storia finita non si aggiunge nulla
  const { error: eIns } = await s1
    .from('evento')
    .insert({ coppia_id: cid, titolo: 'dopo la fine', inizio: '2026-10-01T10:00:00Z' });
  esito('nessuno scrive piu nella coppia sciolta', !!eIns, eIns?.message ?? 'insert riuscito!');
  const { error: eInvDopo } = await s1.rpc('crea_invito');
  esito('un ex-membro non puo piu invitare su quella coppia', !!eInvDopo, eInvDopo?.message);

  // ...ma ciascuno puo cancellare cio' che e' suo (art. 17 non decade)
  const { error: eDel } = await s2.from('foto').delete().eq('chiave_storage', chiave);
  esito('dopo la rottura si puo ancora cancellare il proprio (art. 17)', !eDel, eDel?.message);

  // E si puo ricominciare: e' anche la via d uscita per chi ha creato lo
  // spazio da solo e poi riceve un invito (D-26).
  const { error: eNuova } = await s1.rpc('crea_coppia');
  esito('dopo lo scioglimento si puo formare una coppia nuova', !eNuova, eNuova?.message);
  await s1.rpc('sciogli_coppia'); // si lascia il campo pulito per la prossima esecuzione
}

// =============================================================================
// PULIZIA — la mancanza che ha fatto fallire una migrazione (B-21)
//
// Questi test creano partite per provare il sigillo di D-12, e per due settimane
// non le hanno mai tolte di mezzo: una a ogni esecuzione. Il 2026-08-28 quelle
// righe hanno fatto fallire la migrazione 0020, che stringeva il vincolo sugli
// stati e trovava valori del ciclo di vita vecchio.
//
// 🔑 Prima del 2026-08-28 questa pulizia **non si sarebbe potuta scrivere**, e
// non per distrazione: mancava la policy di update su `partita` (B-23), quindi
// l'UPDATE sarebbe tornato «riuscito» senza toccare niente. Il difetto che
// impediva di ripulire era lo stesso che rendeva invisibile il non aver
// ripulito.
//
// ⚠️ Si **verifica** di aver pulito, invece di limitarsi a lanciare la query: un
// permesso mancante non fallisce, tace — ed e' esattamente cosi' che la prima
// versione di questa pulizia sarebbe passata inosservata una seconda volta.
// =============================================================================
// =============================================================================
console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log('- file nello storage delle foto: la riga si cancella, il file no — non c e ancora storage');
console.log('- tetto cumulativo 1 GB: richiederebbe ~100 insert; verificata la sola guardia per-file');
console.log(
  '- conteggio dei membri DOPO lo scioglimento: dall esterno 0 significa sia "non ci sono"\n' +
    '  sia "non li vedo". Servirebbe la service_role, che non entra in questo repo.\n' +
    '  Coperte invece le conseguenze: l ex non legge, non scrive e non invita.'
);

// Pulizia in coda: **in piu**, non al posto di quella in testa.
// Quella in testa garantisce che il giro funzioni anche partendo sporco;
// questa lascia il campo pulito quando il giro arriva in fondo. Se il test
// muore prima non gira — ed e proprio per questo che non puo essere la sola.
// ⚠️ Client nuovi e non `a1`/`a2`: quelli vivono dentro i blocchi `{ }` piu
// sopra e qui non esistono. Il primo tentativo e morto proprio cosi.
for (const email of ['rls-a1@example.com', 'rls-a2@example.com']) {
  const c = await utente(email);
  await c.from('partita').update({ stato: 'abbandonata' }).in('stato', ['attesa', 'in_corso']);
}

console.log(`\n${falliti === 0 ? 'TUTTI I TEST PASSANO' : `${falliti} TEST FALLITI`}`);
process.exit(falliti === 0 ? 0 : 1);
