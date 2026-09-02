// =============================================================================
// Le partite vere, giocate da due giocatori simulati contro il progetto REALE.
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
// ⚠️ Da qui passa anche **l'unica verifica possibile della publication
// realtime** (migrazione 0027): `pg_publication_tables` con la chiave dell'app
// non si legge, ma un evento che arriva — o non arriva — sì. Vedi il
// blocco del «continua» a due, in fondo al file.
//
// Prerequisiti: come `rls.avversariali.mjs` — `.env` compilato e "Confirm
// email" spento nel dashboard. Crea utenti gioco-*@example.com.
//
// ⚠️ **Ripulisce ciò che crea**, e soprattutto **verifica di averlo fatto**.
// La prima versione si limitava a lanciare l'UPDATE: non funzionava — mancava
// la policy di update su `partita` (0021) — e non lo diceva, perché un UPDATE
// negato dalla RLS torna «riuscito» con zero righe. Una pulizia non asserita è
// una pulizia che non sta avvenendo, ed è la stessa forma di B-21.
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
  // Il token esce di qui perche' il canale realtime va autenticato a mano: senza,
  // la RLS di `round_pronto` non lascia passare niente e il test leggerebbe come
  // 'publication assente' cio' che e' solo una sessione non dichiarata.
  return { c, id: data.user.id, token: data.session.access_token };
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

/**
 * Toglie di mezzo le partite vive: l'indice unico ne ammette una per gioco.
 *
 * ⚠️ **Restituisce quante ne restano**, e chi la chiama alla fine lo asserisce.
 * Senza, una pulizia che non funziona è indistinguibile da una che funziona:
 * l'UPDATE negato dalla RLS non solleva niente.
 */
async function pulisci(a, coppia) {
  await a.c
    .from('partita')
    .update({ stato: 'abbandonata' })
    .eq('coppia_id', coppia)
    .in('stato', ['attesa', 'in_corso']);
  const { data } = await a.c
    .from('partita')
    .select('id')
    .eq('coppia_id', coppia)
    .in('stato', ['attesa', 'in_corso']);
  return (data ?? []).length;
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
// QUIZ SULLE PREFERENZE — dieci round, e i ruoli che si scambiano
//
// Terzo gioco (D-84, 2026-09-01). Somiglia alla telepatia — quattro carte, due
// invii sigillati, un confronto — ma la domanda che pone è opposta, e da lì
// viene ciò che qui va verificato e là no.
//
// 🔴 **Il sigillo qui protegge la risposta vera, non una coincidenza.** Nella
// telepatia la risposta giusta non ce l'ha nessuno dei due: leggere in anticipo
// la scelta dell'altro è un vantaggio. Qui la verità è in tasca a uno dei due, e
// chi riuscisse a leggerla non starebbe più giocando — indovinerebbe sempre, e
// il punteggio racconterebbe il falso su una coppia vera. Stessa policy di D-12
// (`sigillato_select`), molto di più da perdere se cede.
//
// ⚠️ **Cosa questo blocco NON copre, e non va creduto coperto**: la regola per
// cui una domanda non si ripete nella partita (B-33) vive in `pescaOpzioni`,
// dentro `app/gioco/quiz.tsx` — una schermata TSX, che da un test in Node non si
// importa (la convenzione del progetto per il codice TS è leggerlo come testo,
// vedi `parole.mjs`). Resta verificabile solo a mano.
// =============================================================================
console.log('\nQuiz sulle preferenze');
let ultimoRound = null;
{
  await pulisci(a, coppia);
  const { data: partita, error } = await a.c
    .from('partita')
    .insert({ coppia_id: coppia, gioco: 'quiz_preferenze', round_totali: 10 })
    .select('*')
    .single();
  esito('A crea la partita del quiz', !error && !!partita, error?.message);

  await a.c.rpc('segna_pronto', { p_partita: partita.id });
  const { data: viva } = await b.c.rpc('segna_pronto', { p_partita: partita.id });
  esito('la partita del quiz parte con due pronti', viva?.stato === 'in_corso', `stato=${viva?.stato}`);

  /**
   * 🔴 **Il turno si deduce da `creata_da`, non da «io»** (B-30).
   *
   * È l'unico dato su cui si regge l'alternanza dei ruoli, ed è la ragione per
   * cui la si controlla qui invece di darla per buona: se `creata_da` non fosse
   * chi ha creato, i due telefoni calcolerebbero due soggetti diversi per lo
   * stesso round e nessuno dei due si riconoscerebbe.
   */
  esito("la partita ricorda chi l'ha creata", partita.creata_da === a.id);

  const { data: membri } = await a.c
    .from('membro_coppia')
    .select('utente_id')
    .eq('coppia_id', coppia)
    .is('uscito_il', null);
  const elenco = (membri ?? []).map((m) => m.utente_id);
  esito('la coppia ha due membri attivi', elenco.length === 2, `membri=${elenco.length}`);

  /**
   * La stessa regola di `disegnatoreDi` in `lib/partita.ts`: dispari a chi ha
   * creato, pari all'altro.
   *
   * ⚠️ Ciò che l'asserzione qui sotto prova **non** è l'aritmetica — quella è
   * copiata, e una copia che si dà ragione da sola non prova niente. Prova che
   * **con i dati veri di questa coppia** (due membri, `creata_da` fra loro) la
   * regola distribuisce i ruoli 5 e 5. Se un giorno i membri attivi fossero tre,
   * o `creata_da` non fosse più fra i membri, il conto smetterebbe di tornare —
   * ed è esattamente il caso in cui D-84 smetterebbe di valere: il quiz
   * produrrebbe un giudizio su una persona sola, che è ciò che P-03 vieta.
   */
  const soggettoDi = (n) =>
    n % 2 === 1 ? partita.creata_da : elenco.find((u) => u !== partita.creata_da) ?? null;
  const quante = (chi) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((n) => soggettoDi(n) === chi).length;
  esito(
    'sui dieci round ognuno è soggetto cinque volte',
    quante(a.id) === 5 && quante(b.id) === 5,
    `A=${quante(a.id)} B=${quante(b.id)}`
  );

  // Indovinati 1, 4, 7, 10: due per parte, e un punteggio che non è né tutto né
  // niente — così un conteggio sbagliato si vede invece di confondersi col caso.
  const INDOVINATI = new Set([1, 4, 7, 10]);
  let attesi = 0;

  for (let n = 1; n <= 10; n++) {
    const soggetto = soggettoDi(n) === a.id ? a : b;
    const indovino = soggetto === a ? b : a;

    // Il round lo crea **chi ha creato la partita**, sempre lo stesso: è ciò che
    // fa la schermata (`ioApro`), e per la stessa ragione — se lo creassero in
    // due, uno dei due prenderebbe un duplicato sulla chiave `(partita_id, numero)`.
    const { data: round, error: eR } = await a.c
      .from('partita_round')
      .insert({
        partita_id: partita.id,
        numero: n,
        opzioni: { tema: `prova-${n}`, scelte: ['red', 'blue', 'green', 'yellow'] },
      })
      .select('*')
      .single();
    if (eR || !round) {
      esito(`round ${n}: creato`, false, eR?.message);
      break;
    }
    ultimoRound = round;

    const verita = 'blue';
    const tentativo = INDOVINATI.has(n) ? 'blue' : 'green';

    const { error: eV } = await soggetto.c.from('invio_sigillato').insert({
      partita_id: partita.id,
      round: n,
      natura: 'scelta',
      contenuto: { chiave: verita },
    });
    esito(`round ${n}: il soggetto risponde per sé`, !eV, eV?.message);

    // Le due asserzioni che valgono l'intero gioco si fanno nei primi due round,
    // uno per verso: con A soggetto e con B soggetto. Ripeterle dieci volte non
    // aggiunge una prova, aggiunge otto righe.
    if (n <= 2) {
      const { data: sbircia } = await indovino.c
        .from('invio_sigillato')
        .select('*')
        .eq('partita_id', partita.id)
        .eq('round', n);
      esito(
        `round ${n}: 🔴 chi indovina NON legge la risposta vera`,
        (sbircia ?? []).length === 0,
        `righe lette: ${(sbircia ?? []).length}`
      );

      const { data: presto } = await indovino.c.rpc('rivela_telepatia', {
        p_partita: partita.id,
        p_round: n,
      });
      esito(
        `round ${n}: 🔴 e non se la fa dire nemmeno dalla rivelazione`,
        (presto ?? []).length === 0,
        `righe: ${(presto ?? []).length}`
      );
    }

    const { error: eT } = await indovino.c.from('invio_sigillato').insert({
      partita_id: partita.id,
      round: n,
      natura: 'scelta',
      contenuto: { chiave: tentativo },
    });
    esito(`round ${n}: l'altro prova a indovinarlo`, !eT, eT?.message);

    const { data: rivelato } = await indovino.c.rpc('rivela_telepatia', {
      p_partita: partita.id,
      p_round: n,
    });
    esito(
      `round ${n}: con due invii la rivelazione dà entrambi`,
      (rivelato ?? []).length === 2,
      `righe: ${(rivelato ?? []).length}`
    );

    if (n <= 2) {
      // Chi è chi lo dice il turno, e la rivelazione lo conferma dai dati: la
      // riga del soggetto è la verità, quella dell'altro il tentativo.
      const suaVera = (rivelato ?? []).find((r) => r.utente_id === soggetto.id)?.scelta;
      const suoTentativo = (rivelato ?? []).find((r) => r.utente_id === indovino.id)?.scelta;
      esito(`round ${n}: la riga del soggetto è la risposta vera`, suaVera === verita, `letta=${suaVera}`);
      esito(`round ${n}: quella dell'altro è il tentativo`, suoTentativo === tentativo, `letto=${suoTentativo}`);
    }

    const preso = INDOVINATI.has(n);
    if (preso) attesi++;
    // Chiude chi ha creato la partita: nella schermata è `ioApro`, e uno solo.
    const { data: dopo, error: eC } = await a.c.rpc('chiudi_round', {
      p_round: round.id,
      p_esito: preso ? 'vinto' : 'perso',
      p_punti: preso ? 1 : 0,
    });
    esito(`round ${n}: chiuso (${preso ? 'indovinato' : 'sbagliato'})`, !eC, eC?.message);
    esito(`round ${n}: il punteggio è ${attesi}`, dopo?.punti === attesi, `punti=${dopo?.punti}`);
  }

  const { data: finale } = await a.c.from('partita').select('*').eq('id', partita.id).single();
  esito('dopo il decimo round il quiz è concluso', finale?.stato === 'conclusa', `stato=${finale?.stato}`);
  esito(`punteggio finale ${attesi}/10`, finale?.punti === attesi, `punti=${finale?.punti}`);
  esito('e il contatore dei round è arrivato in fondo', finale?.round_corrente === 10, `round=${finale?.round_corrente}`);
}

// =============================================================================
// IL «CONTINUA» A DUE (migrazione 0027)
//
// 🔴 **Qui si verifica la publication realtime**, che al 2026-09-01 era l'unica
// parte della migrazione rimasta non verificata. Con la chiave dell'app
// `pg_publication_tables` non è leggibile, quindi la query lasciata in coda al
// file `0027` da qui non si può eseguire — ma la domanda per cui quella query
// esiste sì: *l'evento arriva all'altro telefono?* B si iscrive, A preme
// «continua», e o l'evento arriva o non arriva.
//
// 🔑 Ed è la verifica migliore delle due, non un ripiego. Il catalogo dice che
// la tabella è **dichiarata** nella publication; l'evento dice che il
// meccanismo **funziona**. Se un giorno divergessero, quello che conta è il
// secondo — è la stessa lezione del 2026-08-31, quando un documento diceva che
// sul server c'era una funzione che non c'era.
//
// ⚠️ Se questo blocco fallisce, il sintomo sull'app è preciso e va riconosciuto:
// il «continua» si blocca **a intermittenza** — chi preme per secondo rilegge e
// va avanti, chi preme per primo aspetta un evento che non arriva mai.
// =============================================================================
console.log('\nIl «continua» a due (0027)');
if (!ultimoRound) {
  esito("c'è un round su cui provare il «continua»", false, 'il quiz non ha prodotto round');
} else {
  const idRound = ultimoRound.id;

  // Il token si passa a mano al canale: la sottoscrizione va autenticata o la
  // RLS di `round_pronto` non lascerebbe passare niente, e il test leggerebbe
  // come «publication assente» ciò che è solo una sessione non dichiarata.
  try {
    await b.c.realtime.setAuth(b.token);
  } catch {
    /* versioni diverse di realtime-js: se non serve, non serve. */
  }

  let risolviEvento;
  const evento = new Promise((r) => (risolviEvento = r));
  let risolviIscrizione;
  const iscritto = new Promise((r) => (risolviIscrizione = r));

  const canale = b.c
    .channel(`prova-round-pronto:${idRound}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'round_pronto', filter: `round_id=eq.${idRound}` },
      (m) => risolviEvento(m.new ?? true)
    )
    .subscribe((stato) => {
      if (stato === 'SUBSCRIBED') risolviIscrizione(true);
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT' || stato === 'CLOSED')
        risolviIscrizione(false);
    });

  const attesa = (ms, valore) => new Promise((r) => setTimeout(() => r(valore), ms));
  const sottoscritto = await Promise.race([iscritto, attesa(10000, false)]);
  esito('B si iscrive al canale del round', sottoscritto === true, 'iscrizione non riuscita entro 10s');

  /**
   * ⚠️ **Si aspetta un istante dopo `SUBSCRIBED`, e non è scaramanzia.**
   *
   * L'ack dell'iscrizione arriva **prima** che la sottoscrizione sia attiva sul
   * server: una scrittura fatta in quella finestra non produce nessun evento, e
   * l'evento perso non si recupera più. Alla prima stesura questo test è
   * fallito una volta su due — e falliva **accusando la publication**, che
   * invece era a posto: verificato lo stesso giorno provando lo stesso
   * meccanismo su `partita_pronto` e su `partita`, dove l'evento arrivava.
   *
   * 🔑 È la forma di B-36: *un test che sbaglia indica il file sbagliato*, e chi
   * lo legge va a cercare un difetto che non c'è — qui, per di più, nell'unico
   * punto della migrazione 0027 che si sospettava già.
   */
  await attesa(1500);

  const { error: ePronto } = await a.c.from('round_pronto').insert({ round_id: idRound });
  esito('A preme «continua»', !ePronto, ePronto?.message);

  let arrivato = await Promise.race([evento, attesa(8000, null)]);
  if (!arrivato) {
    // Secondo tentativo sulla stessa riga: A si ripensa e ripreme (il `delete`
    // è la policy `round_pronto_delete`, quindi è una cosa che l'app può fare).
    // Se non arriva **nemmeno** il secondo evento non è più una corsa persa: è
    // il meccanismo che non funziona, ed è quello che l'asserzione deve dire.
    await a.c.from('round_pronto').delete().eq('round_id', idRound).eq('utente_id', a.id);
    await a.c.from('round_pronto').insert({ round_id: idRound });
    arrivato = await Promise.race([evento, attesa(10000, null)]);
  }
  esito(
    '🔴 realtime: il «continua» di A arriva a B senza ricaricare',
    !!arrivato,
    'due inserimenti e nessun evento — `round_pronto` è nella publication supabase_realtime?'
  );
  await b.c.removeChannel(canale);

  // --- e le tre policy della 0027, dal lato in cui si vedono ------------------
  const { data: vedeB } = await b.c
    .from('round_pronto')
    .select('utente_id')
    .eq('round_id', idRound);
  esito(
    'B vede il «continua» di A',
    (vedeB ?? []).some((r) => r.utente_id === a.id),
    `righe: ${(vedeB ?? []).length}`
  );

  const { error: eBis } = await a.c.from('round_pronto').insert({ round_id: idRound });
  esito(
    'premere due volte dà un duplicato, non un guasto nuovo',
    eBis?.code === '23505',
    `codice=${eBis?.code ?? 'nessun errore'}`
  );

  // 🔴 L'asserzione che a mano non si può fare: sul telefono il bottone dell'altro
  // non c'è, ma «non c'è il bottone» e «il database rifiuta» sono due
  // affermazioni diverse, e solo la seconda regge se l'app viene aggirata.
  const { error: ePerAltri } = await b.c
    .from('round_pronto')
    .insert({ round_id: idRound, utente_id: a.id });
  esito('🔴 B non può premere «continua» al posto di A', !!ePerAltri, 'la riga è passata');

  const { error: eB } = await b.c.from('round_pronto').insert({ round_id: idRound });
  esito('B preme il suo «continua»', !eB, eB?.message);

  const { data: tutti } = await a.c.from('round_pronto').select('utente_id').eq('round_id', idRound);
  esito(
    'ora i pronti del round sono due — il round successivo può partire',
    (tutti ?? []).length === 2,
    `righe: ${(tutti ?? []).length}`
  );

  // Ci si ripensa solo per sé (policy `round_pronto_delete`): senza il delete
  // lo stato sarebbe senza ritorno, e quelli si decidono, non si subiscono.
  const { error: eAnnulla } = await b.c
    .from('round_pronto')
    .delete()
    .eq('round_id', idRound)
    .eq('utente_id', b.id);
  esito('e ci si può ripensare', !eAnnulla, eAnnulla?.message);
}

// =============================================================================
// OBBLIGO O VERITÀ — dieci carte, e nessuno che perde
//
// Quarto gioco (2026-09-02). È l'unico dei quattro che **non usa il sigillo**:
// qui non c'è niente da nascondere — la carta la deve leggere anche l'altro, o
// non c'è nessuno davanti a cui farla. Quindi le asserzioni che valgono negli
// altri tre («l'altro NON legge») qui sono rovesciate: si verifica che la carta
// **si veda in due**, che è la condizione perché il gioco esista.
//
// 🔴 **E si verifica la cosa che decide D-13**: che il database non sappia *chi*
// ha passato. Il round registra l'esito della carta, non la persona: senza un
// dato per persona la graduatoria dei pass **non è calcolabile**, cioè P-03 non
// è protetto da una scelta di interfaccia ma dalla forma dei dati. È la stessa
// logica di D-12 portata su un'altra minaccia: se non deve essere possibile,
// non basta non farlo — non va reso rappresentabile.
// =============================================================================
console.log('\nObbligo o verità');
{
  await pulisci(a, coppia);
  const { data: partita, error } = await a.c
    .from('partita')
    .insert({ coppia_id: coppia, gioco: 'obbligo_verita', round_totali: 10 })
    .select('*')
    .single();
  esito('A crea la partita di obbligo o verità', !error && !!partita, error?.message);

  await a.c.rpc('segna_pronto', { p_partita: partita.id });
  const { data: viva } = await b.c.rpc('segna_pronto', { p_partita: partita.id });
  esito('la partita parte con due pronti', viva?.stato === 'in_corso', `stato=${viva?.stato}`);

  const { data: membri } = await a.c
    .from('membro_coppia')
    .select('utente_id')
    .eq('coppia_id', coppia)
    .is('uscito_il', null);
  const elenco = (membri ?? []).map((m) => m.utente_id);
  const soggettoDi = (n) =>
    n % 2 === 1 ? partita.creata_da : elenco.find((u) => u !== partita.creata_da) ?? null;

  // Sei carte fatte su dieci: un punteggio che non è né tutto né niente, e con
  // le passate distribuite su tutti e due i turni — se il conteggio dipendesse
  // da *chi* ha passato, il totale non tornerebbe.
  const FATTE = new Set([1, 2, 4, 6, 7, 10]);
  let attesi = 0;

  for (let n = 1; n <= 10; n++) {
    const soggetto = soggettoDi(n) === a.id ? a : b;
    const altro = soggetto === a ? b : a;
    const tipo = n % 3 === 0 ? 'verita' : 'obbligo';

    // 🔴 Il round lo crea **chi ha il turno**, non chi ha creato la partita: è
    // l'unico che sa cosa scriverci, perché è lui a scegliere obbligo o verità.
    const { data: round, error: eR } = await soggetto.c
      .from('partita_round')
      .insert({
        partita_id: partita.id,
        numero: n,
        opzioni: { tipo, chiave: `prova-carta-${n}` },
      })
      .select('*')
      .single();
    if (eR || !round) {
      esito(`round ${n}: chi ha il turno crea il round`, false, eR?.message);
      break;
    }

    if (n <= 2) {
      esito(`round ${n}: chi ha il turno crea il round`, true);

      // 🔴 La carta si vede in due, ed è **la stessa** carta. Se la RLS la
      // nascondesse all'altro, il gioco non avrebbe spettatore: uno leggerebbe
      // una carta che l'altro non sa nemmeno quale sia.
      const { data: vedeAltro } = await altro.c
        .from('partita_round')
        .select('opzioni')
        .eq('id', round.id)
        .maybeSingle();
      esito(
        `round ${n}: 🔴 la carta la vede anche l'altro, identica`,
        JSON.stringify(vedeAltro?.opzioni) === JSON.stringify(round.opzioni),
        `letta: ${JSON.stringify(vedeAltro?.opzioni)}`
      );

      // 🔴 Il turno non è contendibile: l'indice unico `(partita_id, numero)`
      // fa fallire il secondo che prova. È la difesa che rende innocuo il caso
      // in cui i due telefoni calcolassero il turno in modo diverso — non
      // succede (B-30), ma se succedesse non nascerebbero due round 1.
      const { error: eDoppio } = await altro.c
        .from('partita_round')
        .insert({ partita_id: partita.id, numero: n, opzioni: { tipo, chiave: 'intruso' } });
      esito(
        `round ${n}: 🔴 l'altro non può aprire lo stesso round`,
        eDoppio?.code === '23505',
        `codice=${eDoppio?.code ?? 'nessun errore'}`
      );

      // 🔴 **L'asserzione di D-13**: la riga del round non dice di chi era il
      // turno. `disegnatore_id` resta vuoto — come nel quiz, il soggetto si
      // deduce da `creata_da` e dal numero — quindi «chi ha passato di più» non
      // è una query che si possa scrivere, nemmeno volendo.
      esito(
        `round ${n}: 🔴 il round non registra di chi era il turno`,
        round.disegnatore_id === null,
        `disegnatore_id=${round.disegnatore_id}`
      );
    }

    const fatta = FATTE.has(n);
    if (fatta) attesi++;
    // Chiude **chi ha il turno**: è l'unico che sa se l'ha fatta o passata.
    const { data: dopo, error: eC } = await soggetto.c.rpc('chiudi_round', {
      p_round: round.id,
      p_esito: fatta ? 'vinto' : 'perso',
      p_punti: fatta ? 1 : 0,
    });
    esito(`round ${n}: ${fatta ? 'fatta' : 'passata'}`, !eC, eC?.message);
    esito(`round ${n}: il punteggio è ${attesi}`, dopo?.punti === attesi, `punti=${dopo?.punti}`);

    if (n === 3) {
      // ⚠️ Passare non toglie: `chiudi_round` prende `greatest(p_punti, 0)`, ma
      // il punto che conta è che una carta passata **non scala** il punteggio
      // della coppia. Un gioco che sottrae per un rifiuto è la pressione che
      // D-13 ha tolto dalla porta e non deve rientrare dalla finestra.
      const { data: negativo } = await soggetto.c.rpc('chiudi_round', {
        p_round: round.id,
        p_esito: 'perso',
        p_punti: -5,
      });
      esito(
        'una carta passata non scala il punteggio',
        negativo?.punti === attesi,
        `punti=${negativo?.punti}`
      );
    }
  }

  const { data: finale } = await a.c.from('partita').select('*').eq('id', partita.id).single();
  esito('dopo la decima carta la partita è conclusa', finale?.stato === 'conclusa', `stato=${finale?.stato}`);
  esito(`punteggio finale ${attesi}/10`, finale?.punti === attesi, `punti=${finale?.punti}`);

  // 🔴 La chiusura del ragionamento di D-13, letta dai dati: gli esiti dei dieci
  // round si contano, ma **non si possono attribuire**. Quattro carte passate su
  // dieci è un dato della coppia; «quattro passate da lui» non è ricostruibile.
  const { data: round10 } = await a.c
    .from('partita_round')
    .select('esito, disegnatore_id')
    .eq('partita_id', partita.id);
  const passate = (round10 ?? []).filter((r) => r.esito === 'perso').length;
  esito('le carte passate sono quattro', passate === 4, `passate=${passate}`);
  esito(
    '🔴 e nessuna di esse è attribuita a una persona',
    (round10 ?? []).every((r) => r.disegnatore_id === null),
    'un round porta il nome di chi aveva il turno: la graduatoria dei pass diventa calcolabile'
  );
}


// =============================================================================
// IL ROUND CHE NASCEVA A METÀ, E L'EVENTO CHE NON ARRIVAVA (B-43)
//
// Due sintomi riferiti dall'utente il 2026-09-02, **una causa sola**: la
// sequenza che apre un round veniva interrotta a metà, e ciò che era già
// arrivato al database non arrivava più a nessuno.
//
//   1. *«nel disegno la prima parola non viene mai caricata e il primo round va
//      perso»* — il round nasceva, la parola in `round_segreto` no. Chi disegna
//      è **l'unico che giudica i tentativi** (è l'unico che può leggerla), e
//      senza parola non giudica niente: il tempo scade e il round è perso.
//   2. *«negli altri giochi all'avvio si rompe e bisogna uscire e rientrare»* —
//      il round finiva nel database e lo stato locale non lo sapeva; l'altro
//      telefono lo avrebbe saputo dall'evento realtime, ma quell'evento è stato
//      emesso **prima** che il suo canale fosse attivo, e non si recupera.
//      Uscire e rientrare funzionava perché rientrare **rilegge**.
//
// 🔴 Questo blocco verifica le tre cose che rendono possibile la riparazione, e
// una che dimostra la causa. Non prova le schermate — quelle si provano su due
// telefoni — prova che il terreno su cui la correzione poggia esiste davvero.
// =============================================================================
console.log('\nIl round nato a metà (B-43)');
{
  await pulisci(a, coppia);
  const { data: partita } = await a.c
    .from('partita')
    .insert({ coppia_id: coppia, gioco: 'indovina_disegno', round_totali: 5 })
    .select('*')
    .single();
  await a.c.rpc('segna_pronto', { p_partita: partita.id });
  await b.c.rpc('segna_pronto', { p_partita: partita.id });

  // --- 1. lo stato rotto è raggiungibile: un round senza la sua parola -------
  const { data: mezzo, error: eM } = await a.c
    .from('partita_round')
    .insert({ partita_id: partita.id, numero: 1, disegnatore_id: a.id })
    .select('*')
    .single();
  esito('un round si crea anche senza scrivere la parola', !eM && !!mezzo, eM?.message);

  const { data: senza } = await a.c
    .from('round_segreto')
    .select('chiave')
    .eq('round_id', mezzo.id);
  esito(
    '🔴 e chi disegna si ritrova senza parola: nessuno può giudicare i tentativi',
    (senza ?? []).length === 0,
    `righe: ${(senza ?? []).length}`
  );

  // --- 2. la riparazione è permessa: la parola si può scrivere DOPO ----------
  //
  // È il presupposto del recupero nella schermata. Se `segreto_insert` avesse
  // preteso qualcosa che vale solo nell'istante della creazione, la riparazione
  // sarebbe **fallita in silenzio** — e un round rotto resterebbe rotto per
  // sempre, compresi quelli già nel database dell'utente.
  const { error: eRip } = await a.c
    .from('round_segreto')
    .insert({ round_id: mezzo.id, chiave: 'dog' });
  esito('🔴 chi disegna può scrivere la parola a round già aperto', !eRip, eRip?.message);

  const { data: riletta } = await a.c
    .from('round_segreto')
    .select('chiave')
    .eq('round_id', mezzo.id)
    .maybeSingle();
  esito('e la rilegge', riletta?.chiave === 'dog', `letta=${riletta?.chiave}`);

  // ⚠️ E vince ciò che è **nel database**, non ciò che si aveva in mano: la
  // seconda scrittura non passa. È la ragione per cui la riparazione rilegge
  // invece di fidarsi della parola che ha appena pescato — altrimenti chi
  // disegna avrebbe una parola che chi indovina non può azzeccare.
  const { error: eDoppia } = await a.c
    .from('round_segreto')
    .insert({ round_id: mezzo.id, chiave: 'cat' });
  esito(
    'una seconda parola sullo stesso round non passa',
    !!eDoppia,
    'due parole per un round: chi indovina non potrebbe vincere'
  );

  // --- 3. «chi perde la corsa rilegge», applicato alla corsa contro sé stessi -
  const { error: eBis } = await a.c
    .from('partita_round')
    .insert({ partita_id: partita.id, numero: 1, disegnatore_id: a.id });
  esito('riaprire lo stesso round dà un duplicato', eBis?.code === '23505', `codice=${eBis?.code}`);

  const { data: ritrovato } = await a.c
    .from('partita_round')
    .select('*')
    .eq('partita_id', partita.id)
    .eq('numero', 1)
    .maybeSingle();
  esito(
    '🔴 e il round si ritrova per numero: la partita non resta ferma su ciò che esiste',
    ritrovato?.id === mezzo.id,
    `ritrovato=${ritrovato?.id}`
  );

  // --- 4. la prova della causa: un evento emesso prima non arriva mai --------
  //
  // 🔴 È il difetto numero 2, riprodotto. B inserisce nulla: A crea il round 2
  // **prima** che B si iscriva. Poi B si iscrive e aspetta. Il realtime non ha
  // replay: quell'evento è perso per sempre, e chi si appoggia solo a lui non
  // scopre mai che il round esiste. La lettura, sì.
  await a.c.rpc('chiudi_round', { p_round: mezzo.id, p_esito: 'vinto', p_punti: 1, p_chiave: 'dog' });
  const { data: secondo } = await a.c
    .from('partita_round')
    .insert({ partita_id: partita.id, numero: 2, disegnatore_id: b.id })
    .select('*')
    .single();

  try {
    await b.c.realtime.setAuth(b.token);
  } catch {
    /* versioni diverse di realtime-js */
  }
  let risolviTardivo;
  const tardivo = new Promise((r) => (risolviTardivo = r));
  let iscritto2;
  const pronto2 = new Promise((r) => (iscritto2 = r));
  const canale2 = b.c
    .channel(`prova-round-tardivo:${partita.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partita_round', filter: `partita_id=eq.${partita.id}` },
      (m) => risolviTardivo(m)
    )
    .subscribe((stato) => {
      if (stato === 'SUBSCRIBED') iscritto2(true);
      if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(stato)) iscritto2(false);
    });

  const aspetta = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
  const ok2 = await Promise.race([pronto2, aspetta(10000, false)]);
  esito('B si iscrive al canale dei round (dopo)', ok2 === true, 'iscrizione non riuscita');

  // 🔴 **Qui NON si asserisce niente, e la ragione è la scoperta stessa.**
  //
  // La prima stesura asseriva che l'evento **non** arrivasse. Ha funzionato una
  // volta e la volta dopo è fallita: l'evento era arrivato. Non è un replay —
  // è che Realtime legge il WAL a lotti e li consegna ai canali iscritti **nel
  // momento della consegna**, non in quello della scrittura. Una riga scritta un
  // istante prima dell'iscrizione cade quindi in una lotteria: se il lotto viene
  // servito dopo che il canale è entrato, l'evento arriva; se prima, è perso.
  //
  // 🔑 Ed è precisamente il difetto: **a volte** l'altro telefono scopre il
  // round, a volte resta fermo. Un'asserzione che pretende uno dei due esiti
  // sarebbe un test che fallisce a caso — la cosa che B-41 e B-42 hanno appena
  // insegnato a non scrivere. Quindi qui si **osserva** e si stampa, e si
  // asserisce solo ciò che è certo: che leggendo lo si trova.
  const arrivatoTardi = await Promise.race([tardivo, aspetta(6000, null)]);
  console.log(
    `  ··  l'evento emesso prima dell'iscrizione, stavolta: ${
      arrivatoTardi ? 'ARRIVATO' : 'PERSO'
    } — è una lotteria, ed è la ragione per cui si rilegge`
  );

  const { data: letto } = await b.c
    .from('partita_round')
    .select('*')
    .eq('partita_id', partita.id)
    .eq('numero', 2)
    .maybeSingle();
  esito(
    '🔑 ma leggendo, B lo trova: è la rilettura alla sottoscrizione, non il canale',
    letto?.id === secondo.id,
    `letto=${letto?.id}`
  );
  await b.c.removeChannel(canale2);
}


// =============================================================================
// LA VERSIONE PERSONALIZZATA — il set lo scrive la coppia (D-19, migrazione 0028)
//
// ⚠️ **Questo blocco si salta da solo se la 0028 non è applicata**, e lo dice.
// Non è indulgenza: è il modo in cui questa suite diventa la verifica della
// migrazione. Applicata la 0028, `npm run test:partita` accende queste
// asserzioni senza che nessuno debba ricordarsi di una query da incollare — che
// è esattamente ciò che il 2026-09-01 non è successo con la publication della
// 0027, rimasta non verificata per un giorno.
//
// 🔴 Le due asserzioni che contano sono di autorizzazione, e nascono dalla
// stessa domanda: *cosa può fare un telefono al set dell'altro?* Se potesse
// scrivere carte a nome del partner, la preparazione finirebbe da sola e ci si
// troverebbe in partita con dieci carte che non si sono scritte.
// =============================================================================
console.log('\nLa versione personalizzata (0028)');
{
  const { error: eSonda } = await a.c
    .from('partita')
    .select('modo')
    .limit(1);
  const senza0028 = eSonda?.code === '42703' || /column .* does not exist/i.test(eSonda?.message ?? '');

  if (senza0028) {
    console.log('  ··  saltato: la migrazione 0028 non è applicata su questo progetto');
    console.log('  ··  applicala e rilancia: da lì in poi queste asserzioni girano da sole');
  } else {
    await pulisci(a, coppia);
    const { data: partita, error: eP } = await a.c
      .from('partita')
      .insert({
        coppia_id: coppia,
        gioco: 'obbligo_verita',
        modo: 'personalizzata',
        round_totali: 10,
      })
      .select('*')
      .single();
    esito('una partita nasce personalizzata', partita?.modo === 'personalizzata', eP?.message);

    // Il modo è uno dei due, e il vincolo lo dice invece di accettare refusi.
    const { error: eTerzo } = await a.c
      .from('partita')
      .insert({ coppia_id: coppia, gioco: 'telepatia', modo: 'mista', round_totali: 10 });
    esito('un modo inventato non passa', !!eTerzo, 'accettato un terzo modo');

    // --- ognuno scrive le proprie carte ------------------------------------
    const carta = (client, tipo, testo) =>
      client.c
        .from('domanda')
        .insert({
          coppia_id: coppia,
          partita_id: partita.id,
          gioco: 'obbligo_verita',
          tipo,
          lingua: 'it',
          testo,
        })
        .select('*')
        .single();

    const { data: miaA, error: eA } = await carta(a, 'obbligo', 'prova: canta il ritornello');
    esito('A scrive un obbligo', !eA && !!miaA, eA?.message);
    esito("e la riga porta il nome di chi l'ha scritta", miaA?.autore_id === a.id);

    const { data: miaB, error: eB } = await carta(b, 'verita', 'prova: la cosa che rimandi sempre');
    esito('B scrive una verità', !eB && !!miaB, eB?.message);

    // 🔴 L'asserzione per cui la policy `domanda_insert` ha una riga in più.
    const { error: ePerAltri } = await a.c.from('domanda').insert({
      coppia_id: coppia,
      partita_id: partita.id,
      gioco: 'obbligo_verita',
      tipo: 'obbligo',
      lingua: 'it',
      autore_id: b.id,
      testo: 'prova: scritta a nome del partner',
    });
    esito(
      '🔴 A non può scrivere una carta a nome di B',
      !!ePerAltri,
      'la preparazione dell’altro si potrebbe completare da soli'
    );

    // Le carte dell'altro **si leggono**, ed è una scelta: le vedranno comunque
    // una per round, e nascondere per due minuti una cosa che si mostrerà
    // costerebbe una funzione Postgres per proteggere una sorpresa.
    const { data: vedeB } = await b.c
      .from('domanda')
      .select('id')
      .eq('partita_id', partita.id);
    esito(
      'il set è leggibile da tutti e due',
      (vedeB ?? []).some((r) => r.id === miaA.id),
      `righe: ${(vedeB ?? []).length}`
    );

    // 🔴 Ma si cancella solo il proprio.
    const { error: eCanc } = await a.c.from('domanda').delete().eq('id', miaB.id);
    const { data: ancora } = await b.c.from('domanda').select('id').eq('id', miaB.id).maybeSingle();
    esito(
      '🔴 A non può cancellare la carta di B',
      !!ancora,
      eCanc ? eCanc.message : 'la riga è sparita: il set dell’altro è cancellabile'
    );

    const { error: eMia } = await a.c.from('domanda').delete().eq('id', miaA.id);
    const { data: sparita } = await a.c.from('domanda').select('id').eq('id', miaA.id).maybeSingle();
    esito('ma la propria sì', !eMia && !sparita, eMia?.message);

    // --- il realtime della preparazione -------------------------------------
    //
    // 🔴 Durante la preparazione ogni telefono deve vedere **quante carte ha
    // scritto l'altro**, o l'unica domanda che conta in quel momento — *stiamo
    // aspettando me o lui?* — resta senza risposta. Senza questo evento i due si
    // aspetterebbero a vicenda fissando due conteggi fermi.
    //
    // ⚠️ Si aspetta un istante dopo  e si riprova una volta: la
    // consegna di un evento emesso **sul confine** della sottoscrizione è una
    // lotteria (B-42, B-43), e un'asserzione che la ignora fallisce a caso.
    {
      try {
        await b.c.realtime.setAuth(b.token);
      } catch {
        /* versioni diverse di realtime-js */
      }
      let risolvi;
      const evento = new Promise((r) => (risolvi = r));
      let pronto;
      const iscritto = new Promise((r) => (pronto = r));
      const canale = b.c
        .channel(`prova-carte:${partita.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'domanda',
            filter: `partita_id=eq.${partita.id}`,
          },
          (m) => risolvi(m.new ?? true)
        )
        .subscribe((stato) => {
          if (stato === 'SUBSCRIBED') pronto(true);
          if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(stato)) pronto(false);
        });
      const att = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
      const ok2 = await Promise.race([iscritto, att(10000, false)]);
      esito('B si iscrive alla preparazione', ok2 === true, 'iscrizione non riuscita');
      await att(1500);
      await carta(a, 'obbligo', 'prova: annuncia il punteggio come un telecronista');
      let arrivato = await Promise.race([evento, att(8000, null)]);
      if (!arrivato) {
        await carta(a, 'obbligo', 'prova: dai un titolo a questa serata');
        arrivato = await Promise.race([evento, att(10000, null)]);
      }
      esito(
        '🔴 realtime: la carta scritta da A arriva a B mentre prepara',
        !!arrivato,
        'due scritture e nessun evento —  è nella publication supabase_realtime?'
      );
      await b.c.removeChannel(canale);
    }
    // --- la risposta scritta a mano, che è l'altra metà della 0028 ----------
    //
    // 🔴 `rivela_telepatia` leggeva **solo** `contenuto->>'chiave'`. Nel quiz
    // personalizzato la risposta è un testo scritto, e sta sotto `testo`: senza
    // il `coalesce` della 0028 la rivelazione tornerebbe due righe **vuote**, e
    // il confronto direbbe che avete risposto la stessa cosa — cioè un punto
    // regalato a ogni round.
    await pulisci(a, coppia);
    const { data: quiz } = await a.c
      .from('partita')
      .insert({
        coppia_id: coppia,
        gioco: 'quiz_preferenze',
        modo: 'personalizzata',
        round_totali: 10,
      })
      .select('*')
      .single();
    await a.c.rpc('segna_pronto', { p_partita: quiz.id });
    await b.c.rpc('segna_pronto', { p_partita: quiz.id });
    await a.c
      .from('partita_round')
      .insert({ partita_id: quiz.id, numero: 1, opzioni: { cartaId: 'prova' } });

    for (const [chi, testo] of [
      [a, 'il mare d’inverno'],
      [b, 'Il Mare d’inverno'],
    ]) {
      await chi.c.from('invio_sigillato').insert({
        partita_id: quiz.id,
        round: 1,
        natura: 'scelta',
        contenuto: { testo },
      });
    }

    const { data: rivelato } = await b.c.rpc('rivela_telepatia', {
      p_partita: quiz.id,
      p_round: 1,
    });
    esito(
      '🔴 la rivelazione restituisce le risposte scritte, non due vuoti',
      (rivelato ?? []).length === 2 && (rivelato ?? []).every((r) => !!r.scelta),
      `righe: ${JSON.stringify(rivelato)}`
    );
    // ⚠️ Le due risposte differiscono per maiuscole: il confronto tollerante
    // dell'app (`normalizza`) le considera uguali, e questo test controlla che
    // arrivino **distinte** fin qui — il confronto è dell'app, non del database.
    const testi = (rivelato ?? []).map((r) => r.scelta);
    esito(
      'e arrivano come sono state scritte',
      testi.includes('il mare d’inverno') && testi.includes('Il Mare d’inverno'),
      testi.join(' | ')
    );
  }
}


// =============================================================================
console.log('\nPulizia');
const restate = await pulisci(a, coppia);
esito(
  'la pulizia finale non lascia partite vive',
  restate === 0,
  `restano ${restate} — manca la policy di update su partita? (migrazione 0021)`
);

// I canali realtime aperti tengono vivo il processo: senza chiuderli il test
// arriva in fondo e non esce. Si chiudono **prima** del verdetto, così valgono
// anche quando il verdetto è «fallito».
a.c.realtime.disconnect();
b.c.realtime.disconnect();

console.log(`\n${ok}/${ok + ko} asserzioni passate`);
if (ko > 0) {
  console.error(`${ko} fallite.`);
  process.exit(1);
}
console.log('I quattro giochi girano contro il database vero.\n');
