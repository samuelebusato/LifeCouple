// =============================================================================
// Il confine gratis/a pagamento (0042, D-135) — contro il progetto REALE.
//   node tests/confine.mjs   (oppure: npm run test:confine)
//
// Scritto PRIMA che la 0042 sia applicata: girando adesso deve FALLIRE, perche'
// senza trigger i limiti non esistono e tutto passa. E' la stessa disciplina
// della 0040 e della 0041 — un test che nasce verde non dimostra niente.
//
// ## Cosa si sta misurando, e perche' non basta guardare l'app
//
// 🔑 **Un limite disegnato e non imposto e' una porta chiusa con un cartello.**
//    L'app puo' nascondere il bottone; questo file parla all'API senza passare
//    da nessun bottone, che e' esattamente cio' che fa chi vuole scavalcare.
//    Se queste asserzioni passano, il muro e' reale; se passa solo l'interfaccia,
//    il muro e' un disegno.
//
// ⚠️ Scrive davvero: crea un evento, foto finte e partite su un utente di prova
//    (confine-1@example.com), e ripulisce alla fine. Stesso patto degli altri
//    test avversariali.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
);
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let falliti = 0;
const esito = (n, ok, d = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`);
  if (!ok) falliti++;
};
/** Vero se l'errore e' il NOSTRO rifiuto e non un guasto qualunque. */
const rifiutata = (e) => /piano gratuito/i.test(e?.message ?? '');

const c = createClient(URL_SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
let { data, error } = await c.auth.signInWithPassword({
  email: 'confine-1@example.com',
  password: 'Password-di-prova-1!',
});
if (error) ({ data, error } = await c.auth.signUp({ email: 'confine-1@example.com', password: 'Password-di-prova-1!' }));
if (error) throw new Error(`auth: ${error.message}`);
const mio = data.user.id;

/**
 * ⚠️ **Ogni giro parte da una coppia NUOVA, e non e' pigrizia.**
 *
 * Il conteggio delle partite del giorno non si puo' azzerare: `partita` ha
 * policy di `select`, `insert` e `update` ma **nessuna di `delete`** — ed e'
 * deliberato, perche' una partita non si cancella, si **abbandona** (0021).
 * Quindi una `delete` da client non fallisce: non fa niente, in silenzio.
 *
 * 🔑 Al secondo giro nello stesso giorno UTC l'asserzione «la prima partita
 * entra» fallirebbe per un motivo che non e' il suo. Sciogliere e ricreare la
 * coppia da' un contatore vergine, ed e' l'unica strada che il client ha.
 */
await c.rpc('sciogli_coppia');
const cid = (await c.rpc('crea_coppia')).data;
if (!cid) throw new Error('crea_coppia non ha restituito una coppia');

const creati = { foto: [], partite: [], eventi: [] };

async function nuovoEvento() {
  const { data: e, error: err } = await c.from('evento')
    .insert({ coppia_id: cid, titolo: `prova-confine ${Date.now()}`, inizio: new Date().toISOString() })
    .select('id').single();
  if (err) throw new Error(`insert evento: ${err.message}`);
  creati.eventi.push(e.id);
  return e.id;
}

/** Una riga `foto` finta: il trigger guarda la RIGA, non il file — ed e' il
 *  punto, perche' chi scavalca l'app inserisce righe, non carica file. */
async function inserisciFoto(eventoId) {
  const { data: f, error: err } = await c.from('foto')
    .insert({
      coppia_id: cid,
      evento_id: eventoId,
      chiave_storage: `prova-confine/${cid}/${Date.now()}-${Math.random()}`,
      byte: 1024,
    })
    .select('id').single();
  if (f) creati.foto.push(f.id);
  return err;
}

/**
 * ⚠️ **Il `gioco` va passato, e la seconda partita deve usarne uno DIVERSO.**
 * `partita_una_viva` (0020) e' un indice unico su `(coppia_id, gioco)` per le
 * partite vive: due partite dello stesso gioco sono gia' impedite, da prima e
 * per un'altra ragione — due schermate che si contendono lo stesso canale.
 *
 * 🔑 **Senza questa distinzione il test passerebbe per il motivo sbagliato**:
 * vedrebbe un rifiuto e lo attribuirebbe al limite giornaliero, mentre a
 * fermarlo sarebbe un vincolo del 2026-08. E' la stessa forma del `PASS D-04`
 * che misurava le righe invece dei file.
 */
async function inserisciPartita(gioco) {
  const { data: p, error: err } = await c.from('partita')
    .insert({ coppia_id: cid, gioco, modo: 'ufficiale', round_totali: 3 })
    .select('id').single();
  if (p) creati.partite.push(p.id);
  return err;
}

console.log('\nIl confine gratis/a pagamento — imposto o solo disegnato?');
console.log('='.repeat(60) + '\n');

const insieme = (await c.rpc('coppia_ha_insieme', { cid })).data;
esito('la coppia di prova NON ha Insieme (altrimenti il test non misura niente)',
  insieme === false, `coppia_ha_insieme=${insieme}`);

// --- Le foto ----------------------------------------------------------------
{
  const ev = await nuovoEvento();
  esito('la PRIMA foto di un evento entra', !(await inserisciFoto(ev)));

  const e2 = await inserisciFoto(ev);
  esito('la SECONDA foto dello stesso evento e RIFIUTATA', rifiutata(e2),
    e2?.message ?? '🔴 nessun errore: il limite non esiste');

  const e3 = await inserisciFoto(null);
  esito('una foto SENZA evento e RIFIUTATA', rifiutata(e3),
    e3?.message ?? '🔴 nessun errore: si scavalca dalla galleria');
}

// --- Le partite -------------------------------------------------------------
{
  esito('la PRIMA partita del giorno entra', !(await inserisciPartita('telepatia')));

  // Gioco DIVERSO: cosi' il rifiuto puo' venire solo dal limite giornaliero,
  // non da `partita_una_viva`. E prova anche cio' che l'utente ha chiesto —
  // una al giorno PER COPPIA, non una per gioco.
  const e2 = await inserisciPartita('quiz_preferenze');
  esito('la SECONDA partita del giorno, con un gioco DIVERSO, e RIFIUTATA', rifiutata(e2),
    e2?.message ?? '🔴 nessun errore: il limite non esiste');

  // 🔑 E la controprova: il rifiuto NON deve essere quello di partita_una_viva.
  esito('...e il rifiuto viene dal limite del piano, non da partita_una_viva',
    !/una_viva|duplicate key/i.test(e2?.message ?? ''), e2?.message ?? '(nessun errore)');
}

// --- Pulizia ----------------------------------------------------------------
// ⚠️ Le righe finte gonfiano il conteggio dei byte della coppia (trigger D-22):
//    lasciarle falserebbe il tetto di spazio in un giro futuro.
for (const id of creati.foto) await c.from('foto').delete().eq('id', id);
// ⚠️ Le partite NON si cancellano — nessuna policy di delete, di proposito.
// Restano sulla coppia di prova, che e' usa e getta per la ragione sopra.
for (const id of creati.eventi) await c.from('evento').delete().eq('id', id);

console.log('\n--- Dichiarati NON coperti (nessun gap silenzioso) ---');
console.log(`- 🔑 che CON «Insieme» tutti e cinque i casi sopra siano PERMESSI: e'
  l'asserzione che dimostra che il muro ha una porta e non e' solo un muro.
  Richiede di scrivere `+'`abbonamento`'+`, e nessun client puo' (0041): si prova
  insieme al webhook, con la stessa procedura del 2026-09-14.
- mappa, liste e creatura: non sono limiti di quantita', sono schermate. Non
  hanno trigger di proposito (vedi la testa della 0042) e si chiudono nell'app.
- il confine del GIORNO e' UTC: chi vive molto a est o a ovest vede la partita
  gratuita rinnovarsi a un'ora che non e' mezzanotte sua. Difetto noto,
  dichiarato nella 0042, condiviso coi ricordi della 0039.`);

console.log(`\n${falliti === 0 ? '✅ Il muro e imposto dal database, non solo disegnato.' : `🔴 ${falliti} TEST FALLITI`}\n`);
process.exit(falliti === 0 ? 0 : 1);
