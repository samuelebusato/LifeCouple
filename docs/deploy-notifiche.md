# Accendere le notifiche push — i quattro gesti, in ordine

> Scritto il 2026-09-14 insieme a **D-129**. Il codice dell'invio è completo; questo documento è **ciò che manca perché una notifica parta davvero**, ed è tutto lavoro che richiede credenziali — quindi lo fa una persona, non l'agente.

⚠️ **Fino a quando questi quattro passi non sono fatti, gli interruttori nelle impostazioni dell'app accendono qualcosa che non parte.** È lo stato in cui il progetto si trova dal 2026-09-10, e il motivo per cui `History.md` lo elencava come primo difetto da chiudere.

---

## 1. Applicare la migrazione `0039`

Dal pannello SQL di Supabase, incollando [`supabase/migrations/0039_notifiche_invio.sql`](../supabase/migrations/0039_notifiche_invio.sql) **dopo averla letta**.

Introduce: la colonna `lingua` su `dispositivo`, la tabella `notifica_in_coda`, il trigger su `luogo` e le due funzioni periodiche.

✅ **Come si verifica, e non è guardare l'app**: dopo l'applicazione,

```bash
npm run test:rls
```

Le quattro asserzioni che oggi dicono *«0039 non applicata»* devono diventare verdi. 🔑 **Sono state scritte prima della migrazione proprio per poterle vedere fallire**: un test che nasce verde non dimostra niente.

## 2. Pubblicare la Edge Function

```bash
npx supabase functions deploy invia-notifiche
```

## 3. Il segreto con cui si chiama

La funzione **non** si accontenta del JWT che Supabase verifica di suo: quel token è di *un utente qualunque*, e far girare il lavoro a comando significherebbe poter spedire notifiche a terzi. Serve un segreto dedicato.

🔴 **Non generarlo sulla riga di comando.** La forma `NOTIFICHE_CRON_SECRET="$(openssl rand -hex 32)"` funziona in bash e **fallisce in silenzio in `cmd.exe`**, che non conosce `$(...)`: imposta come segreto la stringa `$(openssl rand -hex 32)` alla lettera — ventiquattro caratteri, e per giunta **scritti in questo stesso documento**, quindi pubblici — mentre `secrets set` risponde `Finished` identico nei due casi. ⚠️ *È successo il 2026-09-14, e nessun messaggio lo ha segnalato: il difetto è stato trovato solo confrontando il digest.*

Genera il valore **in un file**: non dipende dalla shell, e non finisce nella cronologia dei comandi.

```bash
node -e "const f=require('fs'),p='.env.segreto.local';const v=f.existsSync(p)?f.readFileSync(p,'utf8'):'';if(/^NOTIFICHE_CRON_SECRET=/m.test(v)){console.error('esiste gia: non lo tocco');process.exit(1)}f.appendFileSync(p,(v&&!v.endsWith('\n')?'\n':'')+'NOTIFICHE_CRON_SECRET='+require('crypto').randomBytes(32).toString('hex')+'\n')"
```

> 🔴 **Questo comando APPENDE, e la versione precedente sovrascriveva — B-76.**
>
> Diceva `writeFileSync`, e lo stesso faceva [`pagamenti.md`](pagamenti.md) §3.1 **sullo stesso file**. ⚠️ *Il secondo dei due ha cancellato il primo*, e il 2026-09-15 `.env.segreto.local` conteneva solo `RC_WEBHOOK_SECRET`: il segreto del cron era sparito dalla macchina, e i segreti di Supabase non si rileggono.
>
> 🔑 **Il danno non è la copia persa, è il comando qui sotto**: `secrets set --env-file` pubblica **tutto ciò che il file contiene**, quindi quel file è inteso come l'elenco **completo** dei segreti del progetto. Sovrascriverlo non perde un appunto: fa pubblicare un sottoinsieme al giro successivo. *Fortunatamente `secrets set` è additivo lato server, quindi il segreto vecchio è sopravvissuto — ma per fortuna, non per costruzione.*
>
> ⚠️ Il comando nuovo si **rifiuta** se la chiave c'è già, invece di rigenerarla: rigenerare un segreto in uso significa spegnere il cron senza accorgersene.

```bash
npx supabase secrets set --env-file .env.segreto.local --project-ref <progetto>
```

> ⚠️ **Guarda il file prima di lanciarlo.** Questo comando pubblica *ogni* riga che ci trova: se una manca, quel segreto non viene aggiornato — e se una è di troppo, viene pubblicata.

⚠️ **Il nome del file non è arbitrario.** `.gitignore` ignora `.env` esatto e `.env*.local`: `.env.segreto.local` è coperto, `.segreto.env` **no** — e sarebbe un segreto committabile, cioè un rimedio peggiore del male. Verificalo con `git check-ignore .env.segreto.local` prima di scriverci dentro.

✅ **Poi verifica che sia arrivato quello giusto: `Finished` non lo dimostra.** Lo stesso digest che impedisce di rileggere il segreto permette di confrontarlo — l'API restituisce per ogni voce lo **sha256 del valore**, non il valore.

```bash
node -e "const c=require('crypto'),f=require('fs');const v=f.readFileSync('.env.segreto.local','utf8').split('=')[1].trim();console.log('atteso:',c.createHash('sha256').update(v).digest('hex'))"
```

```bash
npx supabase secrets list --project-ref <progetto> --output json
```

I due valori per `NOTIFICHE_CRON_SECRET` devono coincidere. 🔑 *Se non coincidono, il segreto impostato non è quello che credi di avere* — ed è esattamente il caso in cui il comando è stato mangiato dalla shell.

🔴 **Infine annota il valore in un gestore di password e cancella il file.** Non lo rimostra né `secrets set` né il pannello: se lo perdi non si recupera, si sostituisce.

⚠️ **Deliberatamente NON la chiave `service_role`**: chi pianifica il lavoro non ha nessun motivo di possedere la chiave che può fare tutto. Se il segreto trapela, si spediscono notifiche di troppo; se trapelasse la `service_role`, si perde il database.

## 4. Pianificare l'esecuzione

Da **Integrations → Cron** nel pannello Supabase, un lavoro che chiama la funzione. Cadenza consigliata: **ogni ora**.

🔑 **La chiamata passa due cancelli in fila, e questo elenco ne conteneva uno solo.** La funzione è deployata con `verify_jwt` attivo: *prima* che il suo codice parta, la piattaforma pretende una API key; solo dopo la funzione controlla `x-cron-secret`. Servono **entrambi** gli header, e senza il primo la funzione non viene nemmeno eseguita.

⚠️ **Le chiavi di questo progetto sono del formato nuovo** (`sb_publishable_…`, non `eyJ…`): non essendo JWT vanno sull'header **`apikey`**, non su `Authorization: Bearer`. Si usa la **publishable** e non la secret — la publishable è già dentro l'app, e quel cancello non autentica nessuno: l'autenticazione vera è il segreto.

| Campo | Valore |
|---|---|
| Schedule | `0 * * * *` |
| Tipo | **Supabase Edge Function** → POST |
| URL | `https://<progetto>.supabase.co/functions/v1/invia-notifiche` |
| Header | `x-cron-secret: <il segreto del passo 3>` |

Scegliendo il tipo **Supabase Edge Function** il pannello precompila da sé `apikey` e `Content-Type`: resta da aggiungere solo `x-cron-secret`. Scegliendo *HTTP Request* vanno messi **tutti e tre** a mano.

⚠️ **Perché un'ora e non cinque minuti.** I «ricordi» si calcolano sul giorno, non sul minuto, e il trigger dei luoghi accoda comunque in tempo reale: girare più spesso non anticipa nulla di percepibile e moltiplica le chiamate. ⚠️ **E perché non una volta al giorno**: un invio fallito aspetterebbe 24 ore per il secondo tentativo.

🔑 **Il fuso orario è quello che decide a che ora arriva «N anni fa».** Il calcolo del giorno avviene in **UTC** (non esiste nessun fuso memorizzato, vedi la 0039), quindi conviene far girare il lavoro in un'ora in cui la notifica arriva a un orario civile per l'Italia.

---

## Come si capisce che funziona

La funzione risponde con un riepilogo, e **i numeri vanno letti insieme**.

⚠️ **Le forme sono due, non una.** A coda vuota esce prima, e i campi `lette`, `scartate` e `dispositivi_rimossi` **non ci sono affatto** — non valgono zero, mancano. Chi li cerca crede che la funzione sia rotta:

```json
{ "ok": true, "accodate": { "ricordi": 0, "inviti": 0 }, "inviate": 0 }
```

```json
{ "ok": true, "accodate": { "ricordi": 0, "inviti": 0 },
  "lette": 3, "inviate": 2, "scartate": 1, "dispositivi_rimossi": 0 }
```

| Cosa vedi | Cosa significa |
|---|---|
| nessun campo `lette` | la coda era vuota — normale la maggior parte delle ore |
| `scartate` > 0 | qualcosa **non doveva** partire: consenso spento, coppia sciolta, o nessun dispositivo. Il motivo è in `notifica_in_coda.motivo_scarto` |
| `inviate` < `lette` − `scartate` | qualche invio è fallito e **resta in coda**: `ultimo_errore` dice perché, `da_inviare_il` quando si riproverà |
| `dispositivi_rimossi` > 0 | qualcuno ha disinstallato o revocato il permesso: il token è stato tolto, ed è il comportamento giusto |

⚠️ **`scartate` non è un errore e non va «sistemato».** È la colonna che dimostra di non aver spedito promozioni a chi non le voleva: se un domani servisse provarlo, è lì che si guarda.

### 🔴 Ma prima: come ci si accorge che sta fallendo — B-83, 2026-09-15

⚠️ **Il pannello dei lavori pianificati dice `succeeded` anche quando la
chiamata viene respinta.** Non e' un difetto di Supabase: il comando e' un
`net.http_post` di **`pg_net`, che e' asincrono** — il cron riesce nel momento
in cui *accoda* la richiesta, e da li' in poi non sa piu' nulla dell'esito.

🔑 **Il 2026-09-15 questo ha tenuto nascosto un guasto per un giorno intero**:
23 esecuzioni verdi in fila, e sotto **sei `401` consecutivi**. Il cron era stato
creato come *HTTP Request* con il solo `x-cron-secret`, quindi senza `apikey`:
la piattaforma lo fermava **prima** che la funzione esistesse, e infatti le
notifiche in coda avevano `tentativi = 0` — nessuno le aveva mai guardate.

**Le tre tabelle, e solo la terza dice la verita':**

| Dove guardi | Cosa ti dice | Quanto ti fidi |
|---|---|---|
| `cron.job` | che il lavoro esiste ed e' attivo | dice se c'e', non se funziona |
| `cron.job_run_details` | che l'SQL e' riuscito | 🔴 **`succeeded` = richiesta accodata**, non consegnata |
| `net._http_response` | lo **status code vero** e il corpo della risposta | ✅ e' questa |

```sql
-- l'esito reale delle ultime chiamate del cron
select status_code, left(content, 200), created
from net._http_response order by created desc limit 5;

-- e la prova che conta davvero: la coda si svuota?
select tipo, count(*) filter (where inviata_il is null) as in_attesa,
       count(*) filter (where tentativi > 0) as almeno_un_tentativo
from notifica_in_coda group by tipo;
```

🔑 **`tentativi = 0` su una coda che non si svuota e' la firma di questo
guasto**: distingue *«la funzione non e' stata chiamata»* da *«la funzione ha
provato e non ce l'ha fatta»*, che si diagnosticano in posti opposti.

### Quando invece risponde 401 — e sono due 401 diversi

🔑 **Il corpo dice quale dei due cancelli ti ha fermato.** Senza questa distinzione si cerca nel posto sbagliato: il primo caso non nomina nemmeno il segreto.

| Risposta | Chi ti ha fermato | Cosa manca |
|---|---|---|
| `{"code":"UNAUTHORIZED_NO_AUTH_HEADER"}` | la piattaforma, **prima** della funzione | l'header `apikey` |
| `{"errore":"non autorizzato"}` | il codice della funzione | `x-cron-secret` assente **o** sbagliato |
| `{"errore":"configurazione incompleta"}` (500) | la funzione | il segreto non è impostato sul progetto |

⚠️ **I due casi di `{"errore":"non autorizzato"}` sono indistinguibili di proposito**: chi prova non deve imparare se il segreto esiste. Se sei tu a essere bloccato, confronta il digest come al passo 3 — è l'unico modo di sapere quale dei due è.

## Le due cose che restano fuori da questo documento

- ✅ **La capability *Push Notifications* sull'App ID e la chiave APNs su EAS — FATTE il 2026-09-15.** ⚠️ *Questa riga diceva «richiedono l'account Apple Developer, che il progetto non ha ancora», ed era falsa dal 2026-09-14*, quando la prima development build su EAS ha creato certificato, profilo e dispositivo registrato.
  - Chiave **`LifeCouple APNs`** · Key ID **`T9YBQQ859L`** · Team ID **`8C8FJLJBB8`** · `Sandbox & Production` · `Team Scoped (All Topics)`.
  - La capability sull'App ID `com.lifecouple.app` era **già attiva**: l'aveva accesa EAS con quella build.
  - 🔑 **Il valore predefinito di Apple per l'ambiente è `Sandbox`, e non è modificabile dopo il salvataggio.** Lasciandolo, le notifiche avrebbero funzionato in TestFlight e sarebbero **morte alla pubblicazione** — senza errore, senza log, e con l'unico rimedio di revocare la chiave e rifarla. *Apple ne concede 2 per team: gli errori qui si contano.*
  - ⚠️ Apple consiglia **chiavi separate per ambiente**. Non si è seguito il consiglio, di proposito: sono pensate per chi gestisce un server push proprio con pipeline distinte, mentre qui instrada **Expo**, che ne vuole una sola — e due chiavi ambiente-specifiche occuperebbero **entrambi** gli slot, senza scorta.
  - ⬜ Il file `.p8` **non è nel repository e non deve entrarci**: si scarica una volta sola e la copia sul server di Apple viene rimossa.
- ⚠️ **Una prova nella build finale.** In Expo Go il token si ottiene e la notifica **arriva davvero**, ma il comportamento non è identico a quello della build firmata: è la stessa decisione sul prebuild ferma da **B-20**.

✅ **E una cosa che questo documento dava per impossibile e non lo è** (verificato il 2026-09-14): su **iPhone in Expo Go le notifiche push arrivano**, senza account Apple Developer. La rimozione del push da Expo Go nella SDK 53 riguarda **solo Android** — `node_modules/expo-notifications/src/warnOfExpoGoPushUsage.ts` lancia un errore se `Platform.OS === 'android'` e su iOS si limita a un avviso in console. Il token viene emesso contro il certificato APNs di Expo Go, e APNs ha restituito ricevuta `ok`. 🔑 *Serve per provare la catena, non per pubblicare*: la capability sull'App ID resta necessaria per la build tua.
