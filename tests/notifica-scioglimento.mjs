// =============================================================================
// La notifica di scioglimento arriva a ENTRAMBI (0049).
//
//   node tests/notifica-scioglimento.mjs
//
// ## Cosa prova, e perche' un test invece di una rilettura
//
// La `0049` accoda l'avviso con un trigger su `coppia`, quando lo stato passa
// a «sciolta» — e legge i destinatari da `membro_coppia`, dove `sciogli_coppia()`
// ha appena scritto `uscito_il`. 🔴 *Se un domani quei due passi venissero
// invertiti — prima lo stato della coppia, poi l'uscita dei membri — il filtro
// non troverebbe nessuno e **nessun errore lo direbbe**: `sciogli_coppia()`
// continuerebbe a rispondere che e' andato tutto bene, con la coda vuota.*
//
// ⚠️ **E non ci si aggancia a `registro_azioni`, che sarebbe stato il punto
//    ovvio**: la sua policy lascia scrivere a *qualunque membro attivo*, quindi
//    un client avrebbe potuto fabbricare una riga `azione: 'scioglimento'` e
//    far arrivare al partner l'avviso **a coppia viva**. `coppia` invece ha la
//    sola policy di `select`: quello stato lo cambia solo `sciogli_coppia()`.
//
// 🔑 E' la lezione di **B-78**: un commento che descrive una dipendenza si puo'
//    dimenticare, un test rosso no.
//
// ## Il confine di cio' che questo file puo' misurare da solo
//
// ⚠️ `notifica_in_coda` ha **RLS attiva e zero policy** (0039): nessun client
//    la legge, per costruzione. E' una delle cose che questo test verifica —
//    ed e' anche il motivo per cui il conteggio delle righe accodate **non**
//    e' raggiungibile con la chiave publishable.
//
// 🔑 **La `service_role` in questo repository non entra**, ed e' la stessa
//    regola che `tests/cancellazione.mjs` rispetta per `storage.objects`. Qui
//    si segue quella convenzione, con una porta in piu':
//
//   - se l'ambiente offre `SUPABASE_SERVICE_ROLE_KEY`, il conteggio si fa
//     **da solo** e la dipendenza dall'ordine dentro `sciogli_coppia()` e'
//     misurata;
//   - se non c'e', il test stampa la query da eseguire dal dashboard e
//     **dichiara** che quella riga non e' stata verificata — invece di tacere.
//
// ⚠️ *Il secondo caso non e' un successo a meta': e' un esito parziale detto ad
//    alta voce*, che e' l'unica forma onesta quando manca un permesso.
// =============================================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
);
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
const PASSWORD = 'prova-scioglimento-0049';

const nuovoClient = (chiave = ANON) =>
  createClient(URL_SB, chiave, { auth: { persistSession: false, autoRefreshToken: false } });

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

console.log('\nNotifica di scioglimento (0049) — arriva a entrambi?\n');

const A = await utente('scio-a@example.com');
const B = await utente('scio-b@example.com');

// Si parte puliti: un residuo di un giro precedente falserebbe il conteggio.
await A.c.rpc('sciogli_coppia');
await B.c.rpc('sciogli_coppia');

const { data: cid, error: eCoppia } = await A.c.rpc('crea_coppia');
esito('coppia di prova creata', !eCoppia && !!cid, eCoppia?.message);
const { data: token } = await A.c.rpc('crea_invito');
const { data: invito } = await B.c.rpc('apri_invito', { p_token: token });
const { error: eConf } = await A.c.rpc('conferma_invito', { p_invito_id: invito });
esito('partner appaiato', !eConf, eConf?.message);

// --- 🔴 il tentativo di abuso, PRIMA di sciogliere davvero --------------------
//
// La prima stesura della 0049 agganciava il trigger a `registro_azioni`, che
// **qualunque membro attivo puo' scrivere**: bastava questa riga per far
// arrivare al partner «lo spazio e' stato sciolto» a coppia viva.
//
// 🔑 *Il buco e' stato chiuso spostando il trigger su `coppia`, e questa
//    asserzione e' cio' che impedisce di riaprirlo per distrazione.* Se un
//    domani qualcuno rimettesse un trigger sul registro, qui diventa rosso.
const { error: eAbuso } = await B.c.from('registro_azioni').insert({
  coppia_id: cid,
  autore_id: B.id,
  azione: 'scioglimento',
  oggetto: {},
});
// ⚠️ L'insert **riesce**, ed e' giusto che riesca: il registro e' append-only
//    e per progetto ci si scrive. Cio' che non deve succedere e' che da quella
//    riga nasca una notifica — la coppia qui e' ancora viva.
esito("la riga fabbricata nel registro viene accettata (e' un registro, non uno stato)", !eAbuso, eAbuso?.message);

// --- lo scioglimento, fatto da B ---------------------------------------------
const { error: eScio } = await B.c.rpc('sciogli_coppia');
esito('coppia sciolta da B', !eScio, eScio?.message);

// ⚠️ Regressione della 0039, e vale anche per il tipo nuovo: la coda non e'
//    leggibile da nessun client, nemmeno per le proprie righe.
const { data: dalClient } = await A.c.from('notifica_in_coda').select('id');
esito(
  'il client NON legge la coda, nemmeno la propria (0039)',
  (dalClient ?? []).length === 0,
  `viste=${(dalClient ?? []).length}`
);

// --- il conteggio, se e solo se qualcuno ci ha dato il permesso ---------------
if (SERVICE) {
  const s = nuovoClient(SERVICE);
  const { data: righe } = await s
    .from('notifica_in_coda')
    .select('destinatario_id, dati')
    .eq('coppia_id', cid)
    .eq('tipo', 'scioglimento');

  const trovate = righe ?? [];
  // 🔑 **L'asserzione che regge tutto.** Rossa significa una cosa fra due: la
  //    0049 non e' applicata, oppure qualcuno ha spostato il cambio di stato
  //    della coppia PRIMA dell'uscita dei membri — e allora il filtro
  //    `uscito_il >= sciolta_il` non trova piu' nessun destinatario.
  esito(
    'accodate DUE notifiche, una per membro (rosso = 0049 non applicata, o ordine dentro sciogli_coppia() cambiato)',
    trovate.length === 2,
    `trovate=${trovate.length}`
  );
  esito(
    'chi ha sciolto riceve la ricevuta (autore=true)',
    trovate.find((r) => r.destinatario_id === B.id)?.dati?.autore === true
  );
  esito(
    "chi lo subisce riceve l'avviso (autore=false)",
    trovate.find((r) => r.destinatario_id === A.id)?.dati?.autore === false
  );

  // 🔴 **L'asserzione che dimostra che il buco e' chiuso.** Le notifiche
  //    devono essere DUE: quelle dello scioglimento vero. Se fossero tre o
  //    quattro, la riga fabbricata sopra ne avrebbe generata una — cioe' il
  //    trigger sarebbe tornato su una tabella che l'utente puo' scrivere.
  esito(
    'la riga fabbricata NON ha generato notifiche (il trigger sta su coppia, non sul registro)',
    trovate.length === 2,
    `totali=${trovate.length}, attese=2`
  );

  await s.from('notifica_in_coda').delete().eq('coppia_id', cid);
} else {
  console.log(`
--- 🔴 La riga che questo file NON ha potuto verificare ---
Serve la service_role, e in questo repo non entra. Dal dashboard Supabase:

  select destinatario_id, dati->>'autore' as autore
  from notifica_in_coda
  where coppia_id = '${cid}' and tipo = 'scioglimento';

  → devono essere **esattamente** DUE righe — tre significherebbe che la riga
    fabbricata a mano nel registro ne ha generata una, cioe' che il trigger e'
    tornato su una tabella scrivibile dall'utente: '${B.id}' con autore=true (ha sciolto lui)
    e '${A.id}' con autore=false.

  Zero righe significa una cosa fra due: la 0049 non e' applicata, oppure
  l'ordine dentro sciogli_coppia() e' cambiato e lo stato della coppia passa a
  «sciolta» PRIMA che i membri escano — nel qual caso il trigger cerca chi e'
  uscito con questo scioglimento e non trova nessuno, senza un errore.

  Per farlo misurare da solo:  SUPABASE_SERVICE_ROLE_KEY=… npm run test:scioglimento`);
}

console.log(`
--- Dichiarati NON coperti (nessun gap silenzioso) ---
- che la notifica venga SPEDITA: serve invia-notifiche, il segreto del cron e
  un dispositivo registrato. Qui si misura che la coda si riempia.
- che il testo sia quello giusto: vive nella Edge Function, non nel database.
- il rispetto del consenso 'scioglimento': lo applica invia-notifiche leggendo
  preferenze_notifiche, ed e' la stessa riga che filtra gli altri tre tipi.`);

process.exitCode = falliti === 0 ? 0 : 1;
console.log(
  falliti === 0
    ? `\n✅ Lo scioglimento si annuncia${SERVICE ? ', e a tutti e due' : ' — conteggio in coda da confermare a mano'}.\n`
    : `\n🔴 ${falliti} asserzioni rosse.\n`
);
