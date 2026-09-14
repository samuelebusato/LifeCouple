// =============================================================================
// invia-notifiche — il lavoro periodico che svuota la coda (2026-09-14)
//
// La seconda Edge Function del progetto, e la prima che **non** nasce da un
// gesto di una persona: la chiama un orologio. Fa tre cose, in quest'ordine:
//
//   1. chiede al database di calcolare le notifiche che dipendono dal tempo
//      (`accoda_ricordi`, `accoda_inviti_a_tornare`);
//   2. legge dalla coda cio' che e' pronto;
//   3. verifica **adesso** consenso e stato della coppia, poi spedisce.
//
// 🔑 **Perche' il passo 3 e' un passo a se' e non un filtro nella query.**
//    Il consenso vale nel momento in cui si tratta il dato, e il trattamento
//    qui e' l'invio — non l'accodamento. Fra i due possono passare ore: chi ha
//    spento `luogo_del_partner` nel frattempo non deve ricevere niente, e chi
//    ha sciolto la coppia ancora meno (D-128).
//
// ⚠️ **Ha la chiave `service_role`, come `cancella-account`.** E' il secondo
//    punto del progetto con quel potere, e il perche' e' lo stesso: i token di
//    una persona non sono leggibili da chi scatena l'evento — il partner che
//    segna un posto non puo', e non deve, poter leggere i dispositivi
//    dell'altro (policy della 0038, confine TB-2). Least privilege non dice di
//    evitare il potere: dice di restringerlo a cio' che solo lui puo' fare.
//
// 🔴 **Chi puo' chiamarla.** Il JWT che Supabase verifica di suo e' quello di
//    *un utente qualunque*: non basta, perche' far girare questa funzione a
//    comando significherebbe poter spedire notifiche a terzi. Serve un segreto
//    dedicato, `NOTIFICHE_CRON_SECRET`. ⚠️ *Deliberatamente NON la chiave
//    service_role*: chi pianifica il lavoro non ha motivo di possedere la
//    chiave che puo' fare tutto.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

/** Il servizio push di Expo. Accetta al massimo 100 messaggi per richiesta. */
const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';
const BLOCCO = 100;

/** Quante notifiche si trattano per giro. Un tetto serve: un giro che non
 *  finisce mai e' indistinguibile da un giro che non parte. */
const MAX_PER_GIRO = 500;

/** Dopo tanti tentativi falliti si smette e si scarta, invece di ritentare per
 *  sempre una notifica che nessuno ricevera' mai. */
const MAX_TENTATIVI = 5;

type Tipo = 'luogo_del_partner' | 'ricordi' | 'inviti_a_tornare';
type Lingua = 'it' | 'en';

type Coda = {
  id: string;
  destinatario_id: string;
  tipo: Tipo;
  coppia_id: string | null;
  dati: Record<string, unknown>;
  tentativi: number;
};

type Dispositivo = { id: string; utente_id: string; token: string; lingua: Lingua };

// -----------------------------------------------------------------------------
// I testi.
//
// 🔑 Stanno QUI e non nel database perche' dipendono dalla lingua del
// dispositivo, che puo' cambiare fra l'accodamento e l'invio: la coda porta i
// dati (`{luogo}`, `{anni}`, `{titolo}`), la frase si compone all'ultimo momento.
//
// ⚠️ **Il corpo di queste notifiche compare sulla schermata di blocco**, cioe'
//    lo legge chiunque abbia il telefono in mano senza sbloccarlo. Per questo
//    non si nomina mai la persona — «il tuo partner» sarebbe piu' caldo e
//    direbbe a un terzo con chi si sta scrivendo — e il ricordo mostra il
//    titolo dell'evento e non la sua nota.
//
// 🔑 **E le due notifiche di servizio NON si comportano allo stesso modo**
//    (decisione dell'utente, 2026-09-14). La distinzione non e' di stile: e' di
//    quanto vale l'informazione per un terzo che guarda il telefono.
//
//    - `luogo_del_partner` racconta un posto segnato **adesso**, cioe' dove
//      siete stati di recente. 🔴 **Il nome NON compare**: per saperlo si apre
//      l'app. Il costo e' un tocco in piu'; il guadagno e' che un telefono
//      appoggiato su un tavolo non dice a nessuno dove siete appena stati.
//    - `ricordi` parla di un evento di **anni fa**. Il titolo compare, perche'
//      un ricordo vecchio non rivela i vostri movimenti — e senza titolo quella
//      notifica non avrebbe nessun contenuto.
//
// ⚠️ **La stessa regola vale per il `data` allegato, non solo per il testo.**
//    Il payload viaggia da Expo e da Apple/Google esattamente come il corpo:
//    togliere il nome dalla schermata di blocco e spedirlo nei metadati sarebbe
//    una mitigazione solo apparente. Per questo `DATI_DA_INVIARE` e' un elenco
//    esplicito e non uno `...dati` — cosi' un campo aggiunto un domani alla coda
//    non finisce fuori per distrazione.
// -----------------------------------------------------------------------------
const TESTI: Record<Tipo, Record<Lingua, (d: Record<string, unknown>) => { titolo: string; corpo: string }>> = {
  luogo_del_partner: {
    it: () => ({ titolo: 'Un posto in più', corpo: 'Apri l’app per scoprire qual è.' }),
    en: () => ({ titolo: 'One more place', corpo: 'Open the app to see which one.' }),
  },
  ricordi: {
    it: (d) => ({
      titolo: Number(d.anni) === 1 ? 'Un anno fa' : `${d.anni} anni fa`,
      corpo: String(d.titolo ?? ''),
    }),
    en: (d) => ({
      titolo: Number(d.anni) === 1 ? 'One year ago' : `${d.anni} years ago`,
      corpo: String(d.titolo ?? ''),
    }),
  },
  inviti_a_tornare: {
    it: () => ({ titolo: 'Dove andiamo?', corpo: 'È da un po’ che non aggiungete un posto nuovo.' }),
    en: () => ({ titolo: 'Where to next?', corpo: 'It’s been a while since you added a new place.' }),
  },
};

/**
 * Cosa si allega alla notifica, tipo per tipo. **Elenco esplicito, mai `...dati`.**
 *
 * 🔑 Serve all'app per aprire la schermata giusta quando si tocca la notifica,
 * e per questo bastano gli identificativi. ⚠️ `luogo` (il nome) sta nella coda
 * — che vive in UE — e **non entra qui**: se comparisse nel payload uscirebbe
 * dall'Unione insieme al resto, e la scelta di toglierlo dalla schermata di
 * blocco sarebbe cosmetica.
 */
const DATI_DA_INVIARE: Record<Tipo, (d: Record<string, unknown>) => Record<string, unknown>> = {
  luogo_del_partner: (d) => ({ luogo_id: d.luogo_id }),
  ricordi: (d) => ({ evento_id: d.evento_id }),
  inviti_a_tornare: () => ({}),
};

/** I default della 0038, ripetuti qui perche' la riga dei consensi puo' non
 *  esistere. ⚠️ Devono restare identici a quelli della migrazione e a
 *  `PREFERENZE_INIZIALI` di `lib/notifiche.ts`: se divergono, qualcuno riceve
 *  cio' che non ha chiesto e nessuno se ne accorge. */
const CONSENSO_PREDEFINITO: Record<Tipo, boolean> = {
  luogo_del_partner: true,
  ricordi: true,
  inviti_a_tornare: false,
};

function risposta(corpo: unknown, stato: number) {
  return new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Confronto a tempo costante: su un segreto, `===` perde informazione a ogni
 *  carattere sbagliato. Costa niente farlo bene. */
function segretoCorretto(dato: string, atteso: string): boolean {
  if (dato.length !== atteso.length) return false;
  let diff = 0;
  for (let i = 0; i < dato.length; i++) diff |= dato.charCodeAt(i) ^ atteso.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return risposta({ errore: 'metodo non ammesso' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const segreto = Deno.env.get('NOTIFICHE_CRON_SECRET');
  if (!url || !service || !segreto) {
    return risposta({ errore: 'configurazione incompleta' }, 500);
  }

  const presentato = req.headers.get('x-cron-secret') ?? '';
  if (!segretoCorretto(presentato, segreto)) {
    // Volutamente lo stesso corpo e lo stesso codice di una chiamata senza
    // header: chi prova non deve imparare se il segreto esiste o e' sbagliato.
    return risposta({ errore: 'non autorizzato' }, 401);
  }

  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- 1. Cio' che dipende dal tempo, calcolato dal database ------------------
  // Sta in SQL e non qui perche' e' una domanda sui dati, e perche' li' gira in
  // una transazione sola: la chiave di deduplica impedisce i doppioni anche se
  // due giri si sovrapponessero.
  const { data: nRicordi, error: eRicordi } = await db.rpc('accoda_ricordi');
  const { data: nInviti, error: eInviti } = await db.rpc('accoda_inviti_a_tornare');
  if (eRicordi || eInviti) {
    return risposta(
      { errore: eRicordi?.message ?? eInviti?.message, fase: 'accodamento' },
      500
    );
  }

  // --- 2. Cosa c'e' di pronto ------------------------------------------------
  const { data: coda, error: eCoda } = await db
    .from('notifica_in_coda')
    .select('id, destinatario_id, tipo, coppia_id, dati, tentativi')
    .is('inviata_il', null)
    .is('scartata_il', null)
    .lte('da_inviare_il', new Date().toISOString())
    .order('creata_il', { ascending: true })
    .limit(MAX_PER_GIRO);

  if (eCoda) return risposta({ errore: eCoda.message, fase: 'lettura-coda' }, 500);

  const inCoda = (coda ?? []) as Coda[];
  if (inCoda.length === 0) {
    return risposta({ ok: true, accodate: { ricordi: nRicordi, inviti: nInviti }, inviate: 0 }, 200);
  }

  // --- 3. Consenso e stato della coppia, letti ADESSO ------------------------
  const destinatari = [...new Set(inCoda.map((n) => n.destinatario_id))];
  const coppie = [...new Set(inCoda.map((n) => n.coppia_id).filter((c): c is string => !!c))];

  const { data: preferenze } = await db
    .from('preferenze_notifiche')
    .select('utente_id, luogo_del_partner, ricordi, inviti_a_tornare')
    .in('utente_id', destinatari);

  const consensi = new Map<string, Record<Tipo, boolean>>();
  for (const p of preferenze ?? []) {
    consensi.set(p.utente_id, {
      luogo_del_partner: p.luogo_del_partner,
      ricordi: p.ricordi,
      inviti_a_tornare: p.inviti_a_tornare,
    });
  }

  const coppieAttive = new Set<string>();
  if (coppie.length > 0) {
    const { data: righe } = await db.from('coppia').select('id, stato').in('id', coppie);
    for (const c of righe ?? []) if (c.stato === 'attiva') coppieAttive.add(c.id);
  }

  const { data: dispositivi } = await db
    .from('dispositivo')
    .select('id, utente_id, token, lingua')
    .in('utente_id', destinatari);

  const perUtente = new Map<string, Dispositivo[]>();
  for (const d of (dispositivi ?? []) as Dispositivo[]) {
    const elenco = perUtente.get(d.utente_id) ?? [];
    elenco.push(d);
    perUtente.set(d.utente_id, elenco);
  }

  // --- 4. Si compone, scartando cio' che non deve partire --------------------
  type Messaggio = { to: string; title: string; body: string; sound: null; data: Record<string, unknown> };
  const messaggi: Messaggio[] = [];
  /** Per ogni messaggio, da quale riga di coda e da quale dispositivo viene:
   *  i biglietti di Expo tornano nello stesso ordine, ed e' l'unico modo di
   *  ricollegare un errore al telefono che lo ha causato. */
  const origine: { notifica: Coda; dispositivo: Dispositivo }[] = [];
  const scarti: { id: string; motivo: string }[] = [];

  for (const n of inCoda) {
    const consenso = consensi.get(n.destinatario_id) ?? CONSENSO_PREDEFINITO;
    if (!consenso[n.tipo]) {
      scarti.push({ id: n.id, motivo: 'consenso assente al momento dell invio' });
      continue;
    }
    // 🔴 D-128: su una coppia sciolta non parte niente, per nessuno dei due.
    if (n.coppia_id && !coppieAttive.has(n.coppia_id)) {
      scarti.push({ id: n.id, motivo: 'coppia sciolta fra accodamento e invio' });
      continue;
    }
    const telefoni = perUtente.get(n.destinatario_id) ?? [];
    if (telefoni.length === 0) {
      // Non e' un errore da ritentare: senza dispositivi non lo sara' mai.
      scarti.push({ id: n.id, motivo: 'nessun dispositivo registrato' });
      continue;
    }

    for (const d of telefoni) {
      const lingua: Lingua = d.lingua === 'it' ? 'it' : 'en';
      const { titolo, corpo } = TESTI[n.tipo][lingua](n.dati ?? {});
      messaggi.push({
        to: d.token,
        title: titolo,
        body: corpo,
        sound: null, // ricordi e cortesie, non allarmi (D-128)
        data: { tipo: n.tipo, ...DATI_DA_INVIARE[n.tipo](n.dati ?? {}) },
      });
      origine.push({ notifica: n, dispositivo: d });
    }
  }

  for (const s of scarti) {
    await db
      .from('notifica_in_coda')
      .update({ scartata_il: new Date().toISOString(), motivo_scarto: s.motivo })
      .eq('id', s.id);
  }

  // --- 5. L'invio, a blocchi di cento ---------------------------------------
  const falliteDaNotifica = new Map<string, string>();
  const riuscitePerNotifica = new Set<string>();
  const tokenDaDimenticare: string[] = [];

  for (let i = 0; i < messaggi.length; i += BLOCCO) {
    const fetta = messaggi.slice(i, i + BLOCCO);
    let biglietti: { status: string; message?: string; details?: { error?: string } }[] = [];

    try {
      const r = await fetch(EXPO_PUSH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(fetta),
      });
      if (!r.ok) throw new Error(`Expo ha risposto ${r.status}`);
      const corpo = await r.json();
      biglietti = corpo?.data ?? [];
    } catch (e) {
      // ⚠️ Tutto il blocco resta in coda e si ritentera': e' esattamente il
      // motivo per cui la coda esiste. Non si segna niente come inviato.
      const motivo = e instanceof Error ? e.message : 'errore di rete';
      for (let k = 0; k < fetta.length; k++) {
        falliteDaNotifica.set(origine[i + k].notifica.id, motivo);
      }
      continue;
    }

    for (let k = 0; k < fetta.length; k++) {
      const biglietto = biglietti[k];
      const { notifica, dispositivo } = origine[i + k];

      if (biglietto?.status === 'ok') {
        riuscitePerNotifica.add(notifica.id);
        continue;
      }

      const errore = biglietto?.details?.error ?? biglietto?.message ?? 'esito sconosciuto';

      // 🔑 `DeviceNotRegistered` e' l'unico errore che va trattato togliendo la
      // riga: il telefono ha disinstallato l'app o revocato il permesso, e
      // ritentare su quel token fallira' per sempre. Expo chiede esplicitamente
      // di smettere — continuare fa finire il progetto fra i mittenti puniti.
      if (biglietto?.details?.error === 'DeviceNotRegistered') {
        tokenDaDimenticare.push(dispositivo.token);
        continue;
      }
      falliteDaNotifica.set(notifica.id, String(errore));
    }
  }

  if (tokenDaDimenticare.length > 0) {
    await db.from('dispositivo').delete().in('token', tokenDaDimenticare);
  }

  // --- 6. Si scrive l'esito, distinguendo i tre casi -------------------------
  const adesso = new Date().toISOString();
  let inviate = 0;

  for (const n of inCoda) {
    if (scarti.some((s) => s.id === n.id)) continue;

    const errore = falliteDaNotifica.get(n.id);
    // Riuscita se almeno un telefono l'ha presa: una persona con due telefoni
    // di cui uno spento ha comunque ricevuto la notifica.
    if (riuscitePerNotifica.has(n.id)) {
      await db.from('notifica_in_coda').update({ inviata_il: adesso, ultimo_errore: errore ?? null }).eq('id', n.id);
      inviate++;
      continue;
    }
    if (errore) {
      const tentativi = n.tentativi + 1;
      if (tentativi >= MAX_TENTATIVI) {
        await db
          .from('notifica_in_coda')
          .update({
            tentativi,
            ultimo_errore: errore,
            scartata_il: adesso,
            motivo_scarto: `falliti ${MAX_TENTATIVI} tentativi`,
          })
          .eq('id', n.id);
      } else {
        // Ritardo crescente: riprovare subito su un servizio in difficolta'
        // peggiora le cose per tutti.
        const fraMinuti = 5 * Math.pow(2, tentativi);
        await db
          .from('notifica_in_coda')
          .update({
            tentativi,
            ultimo_errore: errore,
            da_inviare_il: new Date(Date.now() + fraMinuti * 60_000).toISOString(),
          })
          .eq('id', n.id);
      }
    }
  }

  return risposta(
    {
      ok: true,
      accodate: { ricordi: nRicordi, inviti: nInviti },
      lette: inCoda.length,
      inviate,
      scartate: scarti.length,
      dispositivi_rimossi: tokenDaDimenticare.length,
    },
    200
  );
});
