// =============================================================================
// Revoca «Insieme» a degli account, passando dal webhook vero.
//   node tools/revoca-insieme.mjs <id-utente> [<id-utente> …]
//
// ## Perche' esiste (2026-09-15)
//
// `concedi-insieme.mjs` sapeva dare e non togliere. ⚠️ *Uno strumento che
// concede senza poter revocare lascia l'ambiente di prova sporco dopo il primo
// uso*: la prova successiva parte da uno stato che nessuno ha scelto, e il
// difetto che si cerca puo' essere coperto proprio dal diritto rimasto acceso.
//
// ## Perche' un evento e non un `delete`
//
// 🔑 **Il diritto lo scrive solo `abbonamento-webhook`** (0041), e vale in
//    entrambe le direzioni. Cancellare la riga con la `service_role` darebbe
//    lo stesso risultato **oggi** e uno diverso domani: la tabella perderebbe
//    la traccia dell'evento, e il primo evento vero di RevenueCat
//    ricostruirebbe uno stato che non ci si aspetta.
//
// ## La distinzione che questo script esercita
//
// Il webhook tratta due CANCELLATION in modo opposto, ed e' deliberato:
//
//   UNSUBSCRIBE              disdetta del rinnovo  -> NON toglie, il diritto
//                                                     resta fino alla scadenza
//                                                     gia' pagata
//   CUSTOMER_SUPPORT_REFUND  rimborso              -> toglie SUBITO
//
// Qui si usa il secondo, perche' l'intento e' *«questo diritto non doveva
// esserci»*, non *«non si rinnovera'»*.
//
// ⚠️ Richiede `.env.segreto.local` con `RC_WEBHOOK_SECRET`, come il gemello.
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
  console.error('Uso: node tools/revoca-insieme.mjs <id-utente> [<id-utente> …]');
  process.exit(2);
}

console.log(`\nRevoco «Insieme» a ${id.length} account, dal webhook\n`);
let falliti = 0;

for (const u of id) {
  // ⚠️ `event_timestamp_ms` **adesso**, e non e' un dettaglio: il webhook
  //    ignora gli eventi piu' vecchi di quello gia' registrato (protezione
  //    contro le consegne fuori ordine). Un timestamp arretrato qui farebbe
  //    rispondere «piu vecchio di quello registrato» e non toglierebbe nulla —
  //    con un `200` che sembra una riuscita.
  const ora = Date.now();
  const r = await fetch(`${URL_SB}/functions/v1/abbonamento-webhook`, {
    method: 'POST',
    // `connection: close`: senza, il pool keep-alive di undici tiene vivo il
    // processo per qualche secondo dopo l'ultima risposta. Vedi in fondo.
    headers: { authorization: SEGRETO, 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({
      event: {
        type: 'CANCELLATION',
        id: `revoca-${u}-${ora}`,
        app_user_id: u,
        event_timestamp_ms: ora,
        cancel_reason: 'CUSTOMER_SUPPORT_REFUND',
        expiration_at_ms: ora,
      },
    }),
  });
  const corpo = (await r.text()).slice(0, 120);
  // 🔑 `200` non basta: il webhook risponde 200 anche quando **ignora**
  //    l'evento. La riuscita e' `"azione":"togli"`, e va letta.
  const tolto = /"azione"\s*:\s*"togli"/.test(corpo);
  if (!r.ok || !tolto) falliti++;
  console.log(`${r.ok && tolto ? '✅' : '🔴'} ${u} — ${r.status} ${corpo}`);
}

console.log(`
⚠️ **La prova non e' questa risposta.** Si verifica dall'app: ricaricando, la
   riga di log \`[insieme] rpc ho_insieme\` deve dire \`"data":false\` e i muri
   devono tornare su. Dal dashboard, con lo stesso predicato di ho_insieme():

  select a.utente_id, a.attivo, a.scade_il
  from abbonamento a where a.utente_id in ('${id.join("','")}');
`);

// ⚠️ **`exitCode` e non `process.exit()`, ed e' una correzione del 2026-09-15.**
//    `process.exit()` tronca il processo **mentre `fetch` ha ancora dei socket
//    aperti**, e su Windows libuv se ne accorge:
//
//      Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\winsync.c
//
//    🔑 *Compariva DOPO che il lavoro era stato fatto* — la revoca era gia'
//    andata a buon fine — quindi non rompeva niente. Ma un errore stampato
//    sotto una riga di successo insegna a diffidare di quella riga, ed e'
//    esattamente cio' che uno strumento di prova non deve fare.
//
//    Assegnare `exitCode` lascia che Node esca da solo quando l'event loop e'
//    vuoto: stesso codice d'uscita, nessun handle troncato. Insieme a
//    `connection: close` sulla fetch — che impedisce al pool keep-alive di
//    tenere vivo il processo per qualche secondo — l'uscita e' immediata.
process.exitCode = falliti === 0 ? 0 : 1;
