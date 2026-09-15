// =============================================================================
// L'account demo e' in uno stato che regge una revisione? — misurato.
//   node tools/verifica-demo.mjs   (oppure: npm run test:demo)
//
// ## Perche' esiste
//
// 🔑 **Perche' il 2026-09-15 la demo era rotta e nessuno se n'era accorto**:
//    `semina-demo.mjs` caricava quattro JPEG da 1x1, dichiarati segnaposto in un
//    commento, e il revisore avrebbe aperto un'app che vende la cartella
//    condivisa di fotografie trovando quattro riquadri vuoti. ⚠️ *Sarebbe stato
//    un rifiuto per App Completeness, e lo si sarebbe scoperto dal rifiuto.*
//
// 🔑 **E il seminatore non poteva accorgersene**: lui carica e stampa `✅`, che
//    e' vero — il caricamento riesce. Quello che nessuno guardava e' **cosa** e'
//    stato caricato. *Un controllo che misura l'esito di un comando non misura
//    il risultato che quel comando doveva produrre.*
//
// ## Cosa misura
//
// Lo stato in cui il revisore trovera' l'account, voce per voce: appaiato,
// pieno, con foto vere e senza «Insieme». ⚠️ **L'ultima e' voluta**: senza il
// muro il revisore non puo' percorrere l'acquisto in sandbox, che e' proprio
// cio' che Apple vuole vedere.
//
// ## Cosa NON misura
//
// Che le immagini siano *belle* o che i testi abbiano senso. Misura che non
// siano segnaposto — il resto e' un giudizio umano, e va fatto guardando.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const leggiEnv = (f) =>
  Object.fromEntries(
    readFileSync(new URL(f, import.meta.url), 'utf8')
      .split('\n')
      .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
      .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
  );

const env = leggiEnv('../.env');
const FILE_PW = new URL('../.env.demo.local', import.meta.url);
if (!existsSync(FILE_PW)) {
  console.log('\n🔴 .env.demo.local non esiste: la demo non e\' mai stata seminata su questo dispositivo.');
  console.log('   Esegui prima: npm run semina:demo\n');
  process.exit(1);
}

const EMAIL = 'revisore@lifecouple.app';
const c = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const { error: eA } = await c.auth.signInWithPassword({
  email: EMAIL,
  password: leggiEnv('../.env.demo.local').DEMO_PASSWORD,
});
if (eA) {
  console.log(`\n🔴 Accesso fallito per ${EMAIL}: ${eA.message}`);
  console.log('   La password in .env.demo.local non corrisponde? Riesegui: npm run semina:demo\n');
  process.exit(1);
}

console.log('\nAccount demo — lo stato in cui lo trovera\' il revisore\n');

let errori = 0;
const misura = (etichetta, valore, atteso, nota = '') => {
  const ok = typeof atteso === 'function' ? atteso(valore) : valore === atteso;
  if (!ok) errori++;
  console.log(`  ${ok ? '✅' : '🔴'} ${etichetta.padEnd(28)} ${String(valore).padStart(8)}${nota ? '   ' + nota : ''}`);
};

// --- La coppia ATTIVA, e solo quella -----------------------------------------
//
// ⚠️ **Tutto va filtrato per `coppia_id`, e non e' pignoleria.** L'appartenenza
//    a una coppia e' un INTERVALLO (`membro_coppia.uscito_il`, D-04) e lo
//    scioglimento **revoca l'accesso senza cancellare**: chi riesegue il
//    seminatore continua quindi a vedere i propri contenuti delle coppie
//    precedenti. 🔑 *Contarli tutti insieme misura la storia dell'account, non
//    lo stato in cui il revisore lo trovera'.*
const { data: { user } } = await c.auth.getUser();
const { data: appartenenze } = await c
  .from('membro_coppia')
  .select('coppia_id')
  .eq('utente_id', user.id)
  .is('uscito_il', null);

if (!appartenenze?.length) {
  console.log("  🔴 nessuna coppia attiva: il revisore vedrebbe solo la schermata d'invito (D-25)");
  process.exit(1);
}
const CID = appartenenze[0].coppia_id;

const { data: coppia } = await c.from('coppia').select('insieme_dal').eq('id', CID).single();
const { data: membri } = await c
  .from('membro_coppia')
  .select('utente_id')
  .eq('coppia_id', CID)
  .is('uscito_il', null);
misura('membri attivi', membri?.length ?? 0, 2, '(appaiata)');
misura('«insieme dal» impostato', coppia?.insieme_dal ? 'sì' : 'no', 'sì');

// --- Il contenuto della coppia attiva ---------------------------------------
const conta = async (tabella) =>
  (await c.from(tabella).select('id').eq('coppia_id', CID)).data?.length ?? 0;
misura('eventi nel calendario', await conta('evento'), (n) => n >= 4);
misura('luoghi sulla mappa', await conta('luogo'), (n) => n >= 4);
misura('voci di lista', await conta('elemento_lista'), (n) => n >= 2);

const { data: partite } = await c
  .from('partita')
  .select('id')
  .eq('coppia_id', CID)
  .eq('stato', 'conclusa');
misura('partite concluse', partite?.length ?? 0, (n) => n >= 1);

// --- Le fotografie: il punto per cui questo controllo esiste -----------------
const { data: foto } = await c.from('foto').select('byte, evento_id').eq('coppia_id', CID);
misura('fotografie', foto?.length ?? 0, (n) => n >= 4);

// 🔑 La soglia non e' arbitraria: un PNG 1x1 sta sotto il kilobyte, le
//    illustrazioni di foto-demo.mjs stanno intorno al megabyte. Qualunque cosa
//    sotto i 100 KB a 1080x1440 e' un segnaposto, non un'immagine.
const segnaposto = (foto ?? []).filter((f) => f.byte < 100_000).length;
misura('di cui segnaposto (<100 KB)', segnaposto, 0, segnaposto ? '🔴 riquadri vuoti per il revisore' : '');
misura('di cui senza evento', (foto ?? []).filter((f) => !f.evento_id).length, 0);

// --- Il muro, che deve esserci ----------------------------------------------
const { data: haInsieme } = await c.rpc('ho_insieme');
misura('«Insieme» attivo', haInsieme ? 'sì' : 'no', 'no', '(voluto: serve per provare l\'acquisto)');

console.log(
  errori
    ? `\n🔴 ${errori} voci non a posto. Riesegui: npm run semina:demo\n`
    : '\n✅ L\'account demo regge una revisione.\n'
);
process.exit(errori ? 1 : 0);
