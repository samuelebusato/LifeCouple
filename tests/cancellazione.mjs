// =============================================================================
// Catena di cancellazione — la prova end-to-end, eseguita davvero.
//   node tests/cancellazione.mjs   (oppure: npm run test:cancellazione)
//
// ## Perche' questo file esiste
//
// `docs/legal/catena-cancellazione.md` §Protocollo prescrive questa prova da
// prima della pubblicazione, e la sezione «Esito della prova» e' rimasta vuota
// dal 2026-08-31: la Edge Function esiste da allora e **non era mai stata
// eseguita su dati veri**. L'informativa §7 promette agli utenti una
// cancellazione «immediata e definitiva» — e' la dichiarazione piu' impegnativa
// dell'intero corpo documentale, ed era l'unica che poggiava su codice mai
// eseguito.
//
// 🔴 **Mai sull'account vero**, dice il protocollo. Questo file crea la sua
//    coppia di prova, la riempie, la cancella e ricontrolla.
//
// ## Cosa puo' provare, e cosa no — dichiarato prima di cominciare
//
// Gira con la sola chiave **publishable**: e' la stessa che ha l'app, ed e'
// giusto cosi' — misura quello che vede un client.
//
//   ✅ l'utente non riesce piu' ad autenticarsi → la riga di `auth.users` non c'e'
//   ✅ il partner non vede piu' i contenuti cancellati e conserva i propri
//   ✅ gli oggetti nel bucket non sono piu' raggiungibili
//   ❌ NON prova che l'oggetto nel bucket sia stato **rimosso**
//
// 🔑 **L'ultima riga e' la piu' importante, ed e' la lezione di B-03**: lo
//    storage non distingue «non c'e'» da «non puoi». Dopo la cancellazione la
//    coppia e' sciolta, quindi il partner riceverebbe un rifiuto **comunque**,
//    file o non file. La prova definitiva richiede la `service_role`, che in
//    questo repository non entra: il comando da eseguire dal dashboard e'
//    stampato in fondo, ed e' l'unico passo che resta a mano.
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
const nuovoClient = () =>
  createClient(URL_SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

let falliti = 0;
const esito = (nome, ok, dettaglio = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}${dettaglio ? ` — ${dettaglio}` : ''}`);
  if (!ok) falliti++;
};

async function utente(email) {
  const c = nuovoClient();
  let { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) ({ data, error } = await c.auth.signUp({ email, password: PASSWORD }));
  if (error) throw new Error(`auth ${email}: ${error.message}`);
  if (!data.session) throw new Error(`nessuna sessione per ${email}: «Confirm email» e' attivo?`);
  return { c, id: data.user?.id ?? data.session.user.id };
}

/** Un JPEG vero di 1x1 pixel: il bucket accetta solo immagini (0009). */
const JPEG_1x1 = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==',
  'base64'
);

console.log('\nCatena di cancellazione — prova end-to-end su account di prova\n');

// --- 1. La coppia di prova ----------------------------------------------------
const A = await utente('canc-a@example.com');
const B = await utente('canc-b@example.com');
await A.c.rpc('sciogli_coppia');
await B.c.rpc('sciogli_coppia');

const { data: cid, error: eCoppia } = await A.c.rpc('crea_coppia');
esito('coppia creata', !eCoppia, eCoppia?.message);
const { data: token } = await A.c.rpc('crea_invito');
const { data: invito } = await B.c.rpc('apri_invito', { p_token: token });
const { error: eConf } = await A.c.rpc('conferma_invito', { p_invito_id: invito });
esito('partner appaiato', !eConf, eConf?.message);

// --- 2. Riempirla davvero (passo 2 del protocollo) ----------------------------
// ⚠️ Tre eventi e non uno: il piano gratuito concede UNA foto per evento
// (`0042`), quindi tre foto su un evento solo verrebbero rifiutate — e il test
// fallirebbe per il listino invece che per la catena di cancellazione.
const chiavi = [];
for (let i = 1; i <= 3; i++) {
  const { data: ev } = await A.c
    .from('evento')
    .insert({ coppia_id: cid, titolo: `Serata di prova ${i}`, inizio: new Date().toISOString() })
    .select('id')
    .single();
  const chiave = `${cid}/cancellazione-${Date.now()}-${i}.jpg`;
  const { error: eUp } = await A.c.storage
    .from('foto')
    .upload(chiave, new Blob([JPEG_1x1], { type: 'image/jpeg' }), { contentType: 'image/jpeg' });
  if (eUp) esito(`foto ${i} caricata nel bucket`, false, eUp.message);
  const { error: eRiga } = await A.c
    .from('foto')
    .insert({ coppia_id: cid, chiave_storage: chiave, byte: JPEG_1x1.length, evento_id: ev?.id });
  if (eRiga) esito(`riga foto ${i}`, false, eRiga.message);
  chiavi.push(chiave);
}
esito('3 fotografie caricate (file + riga)', chiavi.length === 3);

await A.c.from('luogo').insert([
  { coppia_id: cid, nome: 'Posto di prova 1', lat: 44.84, lng: 10.62, stato: 'visitato' },
  { coppia_id: cid, nome: 'Posto di prova 2', lat: 44.85, lng: 10.63, stato: 'desiderato' },
]);
await A.c.from('elemento_lista').insert({ coppia_id: cid, tipo: 'voce', titolo: 'Voce di prova' });
const { data: partita } = await A.c
  .from('partita')
  .insert({ coppia_id: cid, gioco: 'quiz_preferenze' })
  .select('id')
  .single();
if (partita) await A.c.from('partita').update({ stato: 'conclusa' }).eq('id', partita.id);

// Un contenuto del PARTNER, che deve sopravvivere: e' la meta' di passo 6.
const { data: suoLuogo } = await B.c
  .from('luogo')
  .insert({ coppia_id: cid, nome: 'Posto del partner', lat: 45.0, lng: 11.0, stato: 'visitato' })
  .select('id')
  .single();

// --- 3. Annotare PRIMA (passo 3 del protocollo) -------------------------------
const conta = async (c, tabella, colonna = 'autore_id', valore = A.id) => {
  const { count } = await c.from(tabella).select('*', { count: 'exact', head: true }).eq(colonna, valore);
  return count ?? 0;
};
const prima = {
  foto: await conta(A.c, 'foto'),
  evento: await conta(A.c, 'evento'),
  luogo: await conta(A.c, 'luogo'),
  elemento_lista: await conta(A.c, 'elemento_lista'),
};
const { data: firmaPrima } = await A.c.storage.from('foto').createSignedUrl(chiavi[0], 60);
esito('il file e leggibile PRIMA della cancellazione', !!firmaPrima?.signedUrl);

console.log(
  `\n  Prima: ${prima.foto} foto · ${prima.evento} eventi · ${prima.luogo} luoghi · ` +
    `${prima.elemento_lista} voci di lista · ${chiavi.length} oggetti nel bucket\n`
);

// --- 4. Cancellare l'account (passo 4) ----------------------------------------
const { data: risposta, error: eFun } = await A.c.functions.invoke('cancella-account');
esito('la Edge Function risponde', !eFun, eFun ? String(eFun.message ?? eFun) : JSON.stringify(risposta));

// --- 5. Ricontrollare (passo 5) -----------------------------------------------
const riprova = nuovoClient();
const { error: eLogin } = await riprova.auth.signInWithPassword({
  email: 'canc-a@example.com',
  password: PASSWORD,
});
esito(
  '🔑 l’utente non riesce piu ad autenticarsi (auth.users)',
  !!eLogin,
  eLogin?.message ?? 'ATTENZIONE: l’accesso e ancora possibile'
);

const dopo = {
  foto: await conta(B.c, 'foto'),
  evento: await conta(B.c, 'evento'),
  luogo: await conta(B.c, 'luogo'),
  elemento_lista: await conta(B.c, 'elemento_lista'),
};
esito(
  'nessun contenuto dell’utente cancellato e piu visibile',
  dopo.foto === 0 && dopo.evento === 0 && dopo.luogo === 0 && dopo.elemento_lista === 0,
  `foto=${dopo.foto} eventi=${dopo.evento} luoghi=${dopo.luogo} voci=${dopo.elemento_lista}`
);

const { data: firmaDopo, error: eFirma } = await B.c.storage.from('foto').createSignedUrl(chiavi[0], 60);
esito(
  'gli oggetti nel bucket non sono piu raggiungibili',
  !firmaDopo?.signedUrl,
  eFirma?.message ?? 'ATTENZIONE: la firma viene ancora rilasciata'
);

// --- 6. L’effetto sul partner (passo 6) ---------------------------------------
const { data: coppieB } = await B.c.from('membro_coppia').select('coppia_id').is('uscito_il', null);
esito('il partner non e piu in coppia', (coppieB?.length ?? 0) === 0, `coppie attive=${coppieB?.length ?? 0}`);

const { data: suoi } = await B.c.from('luogo').select('id').eq('id', suoLuogo?.id ?? '');
esito(
  '⚠️ il partner conserva i PROPRI contenuti',
  (suoi?.length ?? 0) === 1,
  (suoi?.length ?? 0) === 1
    ? ''
    : 'il luogo del partner non e piu leggibile: lo scioglimento REVOCA, non cancella (D-04)'
);

// --- 7. Cio che resta a mano --------------------------------------------------
console.log('\n--- 🔴 L’unico controllo che questo file NON puo fare ---');
console.log(`Serve la service_role, e in questo repo non entra. Dal dashboard Supabase:

  select name from storage.objects where name in (
    '${chiavi.join("',\n    '")}'
  );

  → deve restituire ZERO righe. Se ne restituisce, i file sono rimasti orfani
    ed e' esattamente il difetto invisibile che l'ordine «prima i file, poi le
    righe» esiste per evitare (Rule/catena-cancellazione.md).

🔑 Perche' non basta il rifiuto qui sopra: dopo la cancellazione la coppia e'
   sciolta, quindi il partner riceverebbe un rifiuto COMUNQUE — file o non file.
   Lo storage non distingue «non c'e'» da «non puoi» (B-03).`);

console.log(
  `\n${falliti === 0 ? '✅ La catena regge, per tutto cio che un client puo osservare.' : `🔴 ${falliti} TEST FALLITI`}\n`
);
process.exit(falliti === 0 ? 0 : 1);
