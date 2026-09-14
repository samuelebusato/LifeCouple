// =============================================================================
// Concede «Insieme» a degli account, passando dal webhook vero.
//   node tools/concedi-insieme.mjs <id-utente> [<id-utente> …]
//
// ## Perche' dal webhook e non con una insert
//
// 🔑 **Il diritto lo scrive solo `abbonamento-webhook`** (0041): la tabella ha
//    una sola policy, di lettura, e nessun client puo' toccarla. Con la
//    `service_role` si potrebbe scrivere a mano — e sarebbe la strada
//    sbagliata: creerebbe una riga che nessun evento sostiene, e il primo
//    evento vero di RevenueCat la riscriverebbe senza che nessuno se lo
//    aspetti. ⚠️ *Passare di qui esercita anche la catena*: se il webhook e'
//    rotto, questo script lo scopre invece di nasconderlo.
//
// ## Prende ID, non email — e non e' pigrizia
//
// Risolvere un'email richiede di leggere `auth.users`, che la chiave
// publishable non vede: servirebbe far lanciare la CLI a Node, e su Windows
// quella strada si rompe in modo istruttivo (la shell spezza l'SQL sugli spazi
// e l'errore parla di «unexpected positional arguments», cioe' manda a cercare
// un problema di CLI dove c'e' un problema di quoting).
//
// 🔑 Gli id si prendono con **una riga**, e si vede cosa si sta per fare:
//
//   npx supabase db query --linked --project-ref <ref> \
//     "select id, email from auth.users where email in ('a@x','b@y')"
//
// ## A chi va concesso
//
// Basta **un membro per coppia**: `coppia_ha_insieme()` e' una proiezione —
// *«esiste un membro attivo con un diritto valido?»*. Concederlo a entrambi
// serve quando si vuole che restino «pro» anche separandosi, perche' il diritto
// e' della **persona** e non della coppia (D-124).
//
// ⚠️ Richiede `.env.segreto.local` con `RC_WEBHOOK_SECRET`: vive solo sulla
//    macchina che ha impostato il segreto, e non e' nel repository.
// =============================================================================
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()])
);
const URL_SB = env.EXPO_PUBLIC_SUPABASE_URL;
const SEGRETO = readFileSync(new URL('../.env.segreto.local', import.meta.url), 'utf8')
  .split('=')[1]
  .trim();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const id = process.argv.slice(2);
if (id.length === 0 || !id.every((x) => UUID.test(x))) {
  console.error(`Uso: node tools/concedi-insieme.mjs <id-utente> [<id-utente> …]

Gli id si prendono cosi':
  npx supabase db query --linked --project-ref uegayflvtjfhjrmbibdz \\
    "select id, email from auth.users where email in ('tizio@x.it','caio@y.it')"`);
  process.exit(2);
}

// Un anno: e' una concessione di cortesia, non un acquisto. **Scade**, e va bene
// cosi' — un diritto senza scadenza non si distingue da un difetto.
const SCADENZA = Date.now() + 365 * 24 * 3600 * 1000;

console.log(`\nConcedo «Insieme» a ${id.length} account, dal webhook\n`);
let falliti = 0;

for (const u of id) {
  const r = await fetch(`${URL_SB}/functions/v1/abbonamento-webhook`, {
    method: 'POST',
    headers: { authorization: SEGRETO, 'content-type': 'application/json' },
    body: JSON.stringify({
      event: {
        type: 'INITIAL_PURCHASE',
        id: `concessione-${u}-${Date.now()}`,
        app_user_id: u,
        event_timestamp_ms: Date.now(),
        product_id: 'com.lifecouple.app.insieme.annuale',
        expiration_at_ms: SCADENZA,
      },
    }),
  });
  const corpo = (await r.text()).slice(0, 100);
  if (!r.ok) falliti++;
  console.log(`${r.ok ? '✅' : '🔴'} ${u} — ${r.status} ${corpo}`);
}

console.log(`
⚠️ **La prova non e' questa risposta, e' la proiezione.** Cio' che l'app guarda
   non e' la riga di \`abbonamento\` ma \`coppia_ha_insieme()\`, e quella funzione
   ha un cancello: chiamata fuori da una sessione utente torna sempre false.
   Dal dashboard, con lo stesso predicato della funzione:

  select m.coppia_id,
         exists(select 1 from membro_coppia m2
                join abbonamento a on a.utente_id = m2.utente_id
                where m2.coppia_id = m.coppia_id and m2.uscito_il is null
                  and a.attivo and (a.scade_il is null or a.scade_il > now())) as ha_insieme
  from membro_coppia m where m.utente_id in ('${id.join("','")}')
  group by 1, 2;
`);

process.exit(falliti === 0 ? 0 : 1);
