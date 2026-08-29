// =============================================================================
// cancella-account — la prima Edge Function del progetto (2026-08-29)
//
// Esiste per UNA cosa che dal telefono è impossibile per costruzione: togliere
// la riga da `auth.users`. Tutto il resto — sciogliere la coppia, e quindi
// duplicare i contenuti condivisi secondo D-21 — lo fa la funzione Postgres
// `prepara_cancellazione_account()`, che gira **con i permessi dell'utente**.
//
// 🔑 PERCHÉ LA DIVISIONE È QUESTA, e non "tutto qui dentro perché è più comodo".
//
// Questa funzione ha la chiave `service_role`: può fare qualsiasi cosa a
// chiunque, e la RLS non la ferma. È l'unico punto dell'intero progetto con
// quel potere. Least privilege (`regole-sviluppo-sicuro.md`) non dice di
// evitarlo — dice di **restringerlo a ciò che solo lui può fare**. Qui: una
// riga di `auth.users`, di un utente che ha appena dimostrato di essere sé
// stesso presentando il proprio token.
//
// ✅ **E cancella i file dallo Storage** (aggiunto il 2026-08-29), che era il
// buco che `threat-model.md` §2 chiamava già per nome: *«si cancellano le righe
// indice ma i file restano nello storage → violazione dell'art. 17 GDPR
// invisibile»*.
//
// 🔑 **L'ordine è quello imposto da `Rule/catena-cancellazione.md`: prima i
// file, poi le righe.** E la ragione è meccanica, non formale: il nome del file
// vive **dentro la riga** (`foto.chiave_storage`). Cancellando prima le righe
// si perdono i puntatori, e i file diventano irraggiungibili invece che
// cancellati — che è esattamente lo stato che l'art. 17 vieta, con l'aggravante
// che da fuori sembra tutto a posto.
//
// ⚠️ Il trigger `foto_pulisci_storage` (0009) toglie già la riga da
// `storage.objects` quando la riga di `foto` sparisce, e la cascata della 0026
// lo fa scattare. Ma togliere la riga da `storage.objects` **non è cancellare
// l'oggetto**: rende il file irraggiungibile e lascia il binario in attesa
// della pulizia degli orfani. La 0009 lo scriveva e rimandava — *«il resto lo
// farà la cancellazione dell'account»*. Questo è il resto.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function risposta(corpo: unknown, stato: number) {
  return new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return risposta({ errore: 'metodo non ammesso' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) {
    // Non si prosegue con metà configurazione: una cancellazione a metà è
    // peggio di una cancellazione che non parte.
    return risposta({ errore: 'configurazione incompleta' }, 500);
  }

  const autorizzazione = req.headers.get('Authorization');
  if (!autorizzazione) return risposta({ errore: 'non autenticato' }, 401);

  // --- 1. Chi sei? Lo decide il token, non il corpo della richiesta ---------
  //
  // 🔑 La regola che rende sicura tutta la funzione: **l'id da cancellare non
  // si accetta MAI dal chiamante.** Si ricava dal token. Se lo prendessimo dal
  // corpo, chiunque abbia un account potrebbe cancellare quello di chiunque
  // altro — e con la chiave service_role in mano a questa funzione, ci
  // riuscirebbe.
  const comeUtente = createClient(url, anon, {
    global: { headers: { Authorization: autorizzazione } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: utente, error: erroreUtente } = await comeUtente.auth.getUser();
  if (erroreUtente || !utente?.user) return risposta({ errore: 'non autenticato' }, 401);
  const id = utente.user.id;

  // --- 2. I FILE, prima di qualunque riga ----------------------------------
  //
  // Si leggono adesso perché adesso i puntatori esistono ancora: dopo lo
  // scioglimento e la cancellazione, `foto.chiave_storage` non c'è più e i
  // binari resterebbero senza nome, cioè invisibili invece che cancellati.
  //
  // ⚠️ Solo le foto di cui l'utente è **autore**. Le foto sono personali e non
  // vengono duplicate dallo scioglimento (D-21): quelle del partner restano
  // sue, e portarsele via sarebbe la ritorsione che TB-2 esiste per impedire.
  const { data: mieFoto, error: erroreFoto } = await comeUtente
    .from('foto')
    .select('chiave_storage')
    .eq('autore_id', id);

  if (erroreFoto) {
    // Non si prosegue: cancellare l'account senza aver potuto leggere l'elenco
    // dei file lascerebbe binari che nessuno può più nominare.
    return risposta({ errore: erroreFoto.message, fase: 'lettura-file' }, 500);
  }

  const amministratore = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const chiavi = (mieFoto ?? []).map((f: { chiave_storage: string }) => f.chiave_storage);
  if (chiavi.length > 0) {
    // A blocchi: `remove` accetta un elenco, ma un utente con migliaia di foto
    // produrrebbe una richiesta che non passa.
    const BLOCCO = 100;
    for (let i = 0; i < chiavi.length; i += BLOCCO) {
      const { error } = await amministratore.storage.from('foto').remove(chiavi.slice(i, i + BLOCCO));
      if (error) {
        return risposta({ errore: error.message, fase: 'cancellazione-file' }, 500);
      }
    }
  }

  // --- 3. Scioglie la coppia, con i permessi dell'utente --------------------
  //
  // Passa da `comeUtente`, non dal client amministrativo: così le regole di
  // D-04/D-21 si applicano a chi le ha chieste, e un difetto qui non può
  // sciogliere la coppia di qualcun altro.
  const { error: erroreScioglimento } = await comeUtente.rpc('prepara_cancellazione_account');
  if (erroreScioglimento) {
    // ⚠️ Ci si ferma **prima** di toccare l'account. Meglio un utente che
    // riprova fra un minuto che un account cancellato dentro una coppia
    // rimasta intera, con contenuti che nessuno può più né vedere né togliere.
    return risposta({ errore: erroreScioglimento.message, fase: 'scioglimento' }, 500);
  }

  // --- 4. L'unico passo che richiede la chiave segreta ----------------------
  //
  // La cascata della 0026 porta via, con l'utente, tutte le righe di cui era
  // autore — e con le righe di `foto` scatta il trigger della 0009, che
  // ripulisce anche eventuali `storage.objects` rimasti.
  const { error: erroreCancellazione } = await amministratore.auth.admin.deleteUser(id);
  if (erroreCancellazione) {
    return risposta({ errore: erroreCancellazione.message, fase: 'cancellazione' }, 500);
  }

  // --- 5. Si rilegge, invece di fidarsi ------------------------------------
  //
  // 🔑 È la lezione di B-23, applicata al posto più pericoloso in cui potesse
  // servire: *dopo una scrittura che dipende da un permesso, si rilegge*. Qui
  // un falso «riuscito» direbbe all'utente che i suoi dati non ci sono più
  // mentre ci sono ancora.
  const { data: verifica } = await amministratore.auth.admin.getUserById(id);
  if (verifica?.user) {
    return risposta({ errore: "l'account risulta ancora esistente", fase: 'verifica' }, 500);
  }

  return risposta({ ok: true }, 200);
});
