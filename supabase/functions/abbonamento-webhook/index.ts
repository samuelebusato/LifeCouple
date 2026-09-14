// =============================================================================
// abbonamento-webhook — il diritto a «Insieme» entra da qui, e da nessun'altra
// parte (D-133, 2026-09-14)
//
// La terza Edge Function del progetto, e la seconda che non nasce da un gesto
// di una persona: la chiama RevenueCat quando succede qualcosa a un acquisto.
//
// 🔑 **La regola che regge tutto: il client non scrive mai il diritto.** Chi
//    paga e' il telefono, ma il telefono e' ostile per definizione (TB-1). La
//    tabella `abbonamento` ha UNA policy, di sola lettura: nessun client puo'
//    concedersi «Insieme» nemmeno con un token valido. Questa funzione, con la
//    `service_role`, e' l'unica scrittura che esista.
//
// ⚠️ **E lo stato che l'SDK tiene sul telefono non decide niente.** Serve a
//    disegnare la schermata; il cancello sta nel database. Un'app modificata
//    che dichiara di avere il diritto non ottiene nulla (threat-model §4-ter).
//
// ## Il verso della scrittura e' D-124, non una comodita'
//
// Il diritto va sull'UTENTE che ha pagato, e si proietta sulla coppia in
// lettura con `coppia_ha_insieme()`. Su `coppia` sarebbe piu' semplice e
// sbagliato: sciogliendo sparirebbe anche a chi ha pagato un periodo gia'
// pagato.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

/** I tipi che CONCEDONO. Elenco esplicito: un tipo nuovo di RevenueCat non
 *  deve concedere niente solo perche' non lo conosciamo. */
const CONCEDONO = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
  'REFUND_REVERSED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'PRODUCT_CHANGE',
]);

/** I tipi che TOLGONO **subito**. ⚠️ Molto piu' corto di quanto sembri, e il
 *  perche' e' nel commento di `decidi()`. */
const TOLGONO = new Set(['EXPIRATION']);

type Evento = {
  id?: string;
  type?: string;
  event_timestamp_ms?: number;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number | null;
  cancel_reason?: string | null;
  store?: string;
};

const risposta = (corpo: unknown, stato: number) =>
  new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { 'content-type': 'application/json' },
  });

/** Confronto a tempo costante: su un segreto `===` perde informazione a ogni
 *  carattere sbagliato. Costa niente farlo bene. */
function segretoCorretto(dato: string, atteso: string): boolean {
  if (dato.length !== atteso.length) return false;
  let diff = 0;
  for (let i = 0; i < dato.length; i++) diff |= dato.charCodeAt(i) ^ atteso.charCodeAt(i);
  return diff === 0;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cosa fare di un evento.
 *
 * 🔴 **`CANCELLATION` NON e' qui dentro fra quelli che tolgono, ed e' la
 *    decisione piu' importante di questo file.** Per RevenueCat quel tipo
 *    copre due casi opposti: chi ha spento il rinnovo — e continua ad avere
 *    accesso **fino alla scadenza che ha pagato** — e chi ha ottenuto un
 *    rimborso, che lo perde subito. Toglierlo a entrambi significherebbe
 *    togliere a qualcuno cio' che ha gia' pagato, ed e' il genere di errore
 *    che si scopre da un reclamo, non da un log.
 *
 * ⚠️ **`BILLING_ISSUE` nemmeno**: la documentazione stessa dice di trattarlo
 *    con cautela, perche' durante il periodo di grazia l'accesso e' ancora
 *    concesso e il pagamento spesso va a buon fine al secondo tentativo.
 *
 * 🔑 **La soluzione a entrambi e' la stessa, ed e' gia' nella 0041**: la
 *    verita' su «vale adesso?» non e' `attivo`, e' **`scade_il`**, che
 *    `coppia_ha_insieme()` confronta con `now()` a ogni chiamata. Quindi qui si
 *    registra cio' che si sa e si lascia **scadere** da se': non serve
 *    indovinare il momento in cui togliere, perche' lo dice la data.
 *
 * L'unica eccezione e' il rimborso, che e' una `CANCELLATION` con `cancel_reason`
 * esplicito: li' l'accesso finisce davvero adesso, e va tolto adesso.
 */
function decidi(e: Evento): 'concedi' | 'togli' | 'ignora' {
  const tipo = e.type ?? '';
  if (CONCEDONO.has(tipo)) return 'concedi';
  if (TOLGONO.has(tipo)) return 'togli';
  if (tipo === 'CANCELLATION') {
    const motivo = (e.cancel_reason ?? '').toUpperCase();
    // Rimborso o storno: l'accesso finisce subito. Disdetta del rinnovo: no.
    return motivo.includes('REFUND') || motivo.includes('BILLING_ERROR') ? 'togli' : 'ignora';
  }
  return 'ignora';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return risposta({ errore: 'metodo non ammesso' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const segreto = Deno.env.get('RC_WEBHOOK_SECRET');
  if (!url || !service || !segreto) {
    return risposta({ errore: 'configurazione incompleta' }, 500);
  }

  // 🔴 Senza questo controllo chiunque conosca l'indirizzo si regala il
  //    prodotto, e la riga risultante sarebbe indistinguibile da un acquisto
  //    vero. Stesso schema di `invia-notifiche`, compresa la risposta identica
  //    per segreto assente ed errato: chi prova non deve imparare se esiste.
  const presentato = req.headers.get('authorization') ?? '';
  if (!segretoCorretto(presentato, segreto)) {
    return risposta({ errore: 'non autorizzato' }, 401);
  }

  let evento: Evento;
  try {
    const corpo = await req.json();
    evento = (corpo?.event ?? {}) as Evento;
  } catch {
    // ⚠️ 400 e non 500: un corpo illeggibile non migliora riprovando, e
    //    RevenueCat ritenta cinque volte prima di arrendersi.
    return risposta({ errore: 'corpo non leggibile' }, 400);
  }

  const azione = decidi(evento);
  const utente = evento.app_user_id ?? '';

  // ⚠️ Da qui in poi, ogni uscita che NON e' un guasto nostro risponde 200.
  //    RevenueCat considera fallimento qualunque codice fuori dai 2xx e
  //    ritenta con attese crescenti fino a cinque volte: rispondere 4xx a un
  //    evento che abbiamo deciso di ignorare produrrebbe quattro tentativi
  //    inutili e poi la rinuncia — cioe' rumore che somiglia a un guasto.
  if (azione === 'ignora') {
    return risposta({ ok: true, azione: 'ignorato', tipo: evento.type }, 200);
  }
  if (!UUID.test(utente)) {
    // L'App User ID non e' un utente nostro: acquisto anonimo, o di prova.
    // Non c'e' niente da scrivere e riprovare non cambierebbe nulla.
    return risposta({ ok: true, azione: 'ignorato', motivo: 'app_user_id non e un utente' }, 200);
  }

  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const eventoIl = new Date(evento.event_timestamp_ms ?? Date.now()).toISOString();

  // --- Idempotenza e ordinamento --------------------------------------------
  // 🔑 Due problemi diversi che si risolvono con la stessa lettura. Un webhook
  //    puo' consegnare DUE VOLTE (stesso `id`) e puo' consegnare FUORI ORDINE
  //    (il rinnovo prima dell'acquisto, perche' i tentativi hanno attese
  //    crescenti). Il secondo e' il piu' insidioso: applicato alla lettera
  //    riporterebbe indietro una scadenza gia' aggiornata.
  const { data: esistente, error: eLettura } = await db
    .from('abbonamento')
    .select('evento_id, evento_il')
    .eq('utente_id', utente)
    .maybeSingle();

  if (eLettura) return risposta({ errore: eLettura.message, fase: 'lettura' }, 500);

  if (esistente?.evento_id && esistente.evento_id === evento.id) {
    return risposta({ ok: true, azione: 'gia visto', evento: evento.id }, 200);
  }
  if (esistente?.evento_il && esistente.evento_il >= eventoIl) {
    return risposta({ ok: true, azione: 'piu vecchio di quello registrato' }, 200);
  }

  // --- La scrittura ----------------------------------------------------------
  // ⚠️ `scade_il` si scrive SEMPRE, anche quando si toglie: e' la data che
  //    decide, e tenerla aggiornata vale piu' del booleano.
  const scadeIl = evento.expiration_at_ms
    ? new Date(evento.expiration_at_ms).toISOString()
    : null;

  const { error: eScrittura } = await db.from('abbonamento').upsert(
    {
      utente_id: utente,
      attivo: azione === 'concedi',
      prodotto: evento.product_id ?? null,
      scade_il: scadeIl,
      evento_id: evento.id ?? null,
      evento_il: eventoIl,
      aggiornato_il: new Date().toISOString(),
    },
    { onConflict: 'utente_id' }
  );

  if (eScrittura) {
    // 500 di proposito: qui riprovare ha senso, ed e' cio' che RevenueCat fa.
    return risposta({ errore: eScrittura.message, fase: 'scrittura' }, 500);
  }

  return risposta(
    { ok: true, azione, utente, tipo: evento.type, scade_il: scadeIl },
    200
  );
});
