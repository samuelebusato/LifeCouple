// =============================================================================
// L'account demo per il revisore Apple — creato e riempito.
//   node tools/semina-demo.mjs   (oppure: npm run semina:demo)
//
// ## Perche' esiste
//
// **D-25**: senza partner questa app non fa niente — *«una partita da soli non
// e' una partita meno bella, non e' niente»*. Il revisore di Apple e' **una
// persona sola**: aprirebbe l'app, troverebbe «invita il tuo partner», non
// avrebbe nessuno da invitare, e la segnalerebbe come non funzionante.
// `docs/pubblicazione.md` §5 lo classifica come *«il punto che si scopre col
// rifiuto se non ci si pensa prima»*.
//
// ✅ **E NON serve nessuna porta d'ingresso speciale** (B-67): si entra con
//    email e password, ed e' la **D-74** — quella decisione e' stata presa
//    esattamente per poter consegnare un account alla revisione.
//
// ## La password non sta nel repository
//
// Vive in `.env.demo.local`, che `.gitignore` copre (`.env*.local`). Se il file
// non c'e', questo script ne genera una e la scrive li'. 🔑 *Generata in un file
// e non sulla riga di comando*: e' la correzione di **B-65**, e vale anche qui.
//
// ## Rieseguibile
//
// Se la coppia demo esiste gia', scioglie e rifa'. Cosi' si puo' rinfrescare il
// contenuto prima di una sottomissione senza pulire a mano.
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const leggiEnv = (f) =>
  Object.fromEntries(
    readFileSync(new URL(f, import.meta.url), 'utf8')
      .split('\n')
      .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
      .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
  );

const env = leggiEnv('../.env');
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_SB || !ANON) throw new Error('.env mancante o incompleto');

const FILE_PW = new URL('../.env.demo.local', import.meta.url);
if (!existsSync(FILE_PW)) {
  const pw = `Demo-${randomBytes(9).toString('base64url')}-1!`;
  writeFileSync(FILE_PW, `DEMO_PASSWORD=${pw}\n`, 'utf8');
  console.log(`\n🔑 Password generata e scritta in .env.demo.local (gitignorato).`);
}
const PASSWORD = leggiEnv('../.env.demo.local').DEMO_PASSWORD;

const EMAIL_REVISORE = 'revisore@lifecouple.app';
const EMAIL_PARTNER = 'partner.demo@lifecouple.app';

const nuovoClient = () =>
  createClient(URL_SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

async function utente(email) {
  const c = nuovoClient();
  let { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) ({ data, error } = await c.auth.signUp({ email, password: PASSWORD }));
  if (error) throw new Error(`auth ${email}: ${error.message}`);
  if (!data.session) throw new Error(`nessuna sessione per ${email}: «Confirm email» e' attivo?`);
  return c;
}

/** Fotografie: sfumature nei colori dell'app, generate qui. ⚠️ Sono segnaposto
 *  dichiarati — il revisore deve vedere una galleria piena, non finte persone. */
function jpegSfumato() {
  // Un JPEG 1x1: il bucket accetta solo immagini (0009) e a noi serve che la
  // galleria non sia vuota. Chi vuole una demo piu' bella carica foto vere
  // dall'app: questo script non le inventa.
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==',
    'base64'
  );
}

console.log('\nAccount demo per la revisione — semina\n');

const rev = await utente(EMAIL_REVISORE);
const par = await utente(EMAIL_PARTNER);

// Rieseguibile: si riparte da zero.
await rev.rpc('sciogli_coppia');
await par.rpc('sciogli_coppia');

const { data: cid, error: eC } = await rev.rpc('crea_coppia');
if (eC) throw new Error(`crea_coppia: ${eC.message}`);
const { data: token } = await rev.rpc('crea_invito');
const { data: inv } = await par.rpc('apri_invito', { p_token: token });
const { error: eConf } = await rev.rpc('conferma_invito', { p_invito_id: inv });
if (eConf) throw new Error(`conferma_invito: ${eConf.message}`);
console.log('✅ coppia formata e appaiata');

// «Insieme da»: una data che dia senso al contatore in home.
await rev.from('coppia').update({ insieme_dal: '2024-06-15' }).eq('id', cid);

// --- Il calendario ------------------------------------------------------------
const giorno = (scarto) => {
  const d = new Date();
  d.setDate(d.getDate() + scarto);
  return d.toISOString();
};
const eventi = [
  ['La prima cena insieme', -120],
  ['Weekend a Bologna', -35],
  ['Cinema, poi gelato', -12],
  ['Compleanno di lei', 9],
];
const idEventi = [];
for (const [titolo, scarto] of eventi) {
  const { data } = await rev
    .from('evento')
    .insert({ coppia_id: cid, titolo, inizio: giorno(scarto) })
    .select('id')
    .single();
  if (data) idEventi.push(data.id);
}
console.log(`✅ ${idEventi.length} eventi nel calendario`);

// --- La mappa ------------------------------------------------------------------
await rev.from('luogo').insert([
  { coppia_id: cid, nome: 'Trattoria da Amerigo', lat: 44.4949, lng: 11.3426, stato: 'visitato' },
  { coppia_id: cid, nome: 'Spiaggia di Vasto', lat: 42.1116, lng: 14.7053, stato: 'visitato' },
  { coppia_id: cid, nome: 'Lago di Braies', lat: 46.6946, lng: 12.0852, stato: 'desiderato' },
]);
await par
  .from('luogo')
  .insert({ coppia_id: cid, nome: 'Parco della Cittadella', lat: 44.6913, lng: 10.6316, stato: 'visitato' });
console.log('✅ 4 luoghi sulla mappa (3 di uno, 1 dell’altro)');

// --- Le liste -------------------------------------------------------------------
await rev.from('elemento_lista').insert([
  { coppia_id: cid, tipo: 'voce', titolo: 'Imparare a fare il pane' },
  { coppia_id: cid, tipo: 'voce', titolo: 'Vedere l’aurora', stato: 'desiderato' },
]);
console.log('✅ 2 voci di lista');

// --- Le fotografie ---------------------------------------------------------------
const JPEG = jpegSfumato();
let foto = 0;
for (let i = 0; i < idEventi.length; i++) {
  const chiave = `${cid}/demo-${Date.now()}-${i}.jpg`;
  const { error: eUp } = await rev.storage
    .from('foto')
    .upload(chiave, new Blob([JPEG], { type: 'image/jpeg' }), { contentType: 'image/jpeg' });
  if (eUp) continue;
  const { error: eR } = await rev
    .from('foto')
    .insert({ coppia_id: cid, chiave_storage: chiave, byte: JPEG.length, evento_id: idEventi[i] });
  if (!eR) foto++;
}
console.log(`✅ ${foto} fotografie (una per evento: e' il limite del piano gratuito, 0042)`);

// --- Una partita ------------------------------------------------------------------
const { data: partita } = await rev
  .from('partita')
  .insert({ coppia_id: cid, gioco: 'quiz_preferenze' })
  .select('id')
  .single();
if (partita) {
  const { error } = await rev.from('partita').update({ stato: 'conclusa' }).eq('id', partita.id);
  console.log(error ? `⚠️ partita non conclusa: ${error.message}` : '✅ 1 partita conclusa');
}

// --- Cosa consegnare ad Apple ------------------------------------------------------
console.log(`
--- Da incollare nelle note per la revisione (App Store Connect) ---

  Demo account (già appaiato con un secondo account):
    Email:    ${EMAIL_REVISORE}
    Password: ${PASSWORD}

  The app is built for two people: an account that is not paired shows an
  invitation screen and nothing else. This account is already paired, so the
  calendar, the map, the lists and the game are populated.

⚠️ Le fotografie sono segnaposto di 1 pixel: servono a non lasciare la galleria
   vuota, non a mostrare foto vere. Per una demo migliore, carica 3-4 foto
   dall'app con questo account.

⬜ L'account NON ha «Insieme»: mappa, liste e creatura sono dietro il muro.
   E' voluto — cosi' il revisore puo' provare l'acquisto in sandbox, che e'
   quello che Apple vuole vedere. Se preferisci che sia gia' abbonato, il
   diritto lo scrive solo il webhook (0041): si concede da li'.
`);
