# Accendere i pagamenti — App Store Connect, RevenueCat, webhook

> Scritto il 2026-09-14 insieme a **D-133** (RevenueCat) e **D-132** (solo iPhone). Lo schema esiste già (`0041`, applicata) e il webhook è scritto: questo documento è **ciò che manca perché un pagamento arrivi fino alla tabella**, ed è quasi tutto lavoro che richiede credenziali.
>
> Le decisioni di prodotto — prezzo, confine gratis/pagamento, pagamento a coppia — **non** vivono qui: stanno in [`Marketing/LifeCouple/monetizzazione.md`](../../../Marketing/LifeCouple/monetizzazione.md), e questo documento le presuppone. Il threat model della superficie è in [`docs/threat-model.md`](threat-model.md) §4-ter, scritto **prima** del codice.

⚠️ **Finché questi passi non sono fatti, «Insieme» non è acquistabile e `abbonamento` resta vuota.** Nessun utente può concedersi il diritto — è il punto della `0041` — quindi senza webhook nessuno lo ha, e questo è lo stato corretto.

---

## 🔴 Prima di tutto: due cose che non si possono disfare

**1. Gli identificativi dei prodotti sono per sempre.** Come il bundle identifier, un product ID usato una volta su App Store Connect **non è più riutilizzabile da nessuno**, nemmeno da noi, nemmeno se il prodotto viene eliminato. Sceglierli distrattamente è un errore che resta.

**2. Il gruppo di abbonamento va deciso adesso, non dopo.** Mensile e annuale devono stare nello **stesso gruppo**: è ciò che permette a una persona di passare dall'uno all'altro. In gruppi diversi diventerebbero due abbonamenti **contemporaneamente attivi**, e si pagherebbe due volte — un difetto che si scopre da un reclamo.

---

## 0. I due prerequisiti, se non ci sono gia'

I prodotti in-app si creano **dentro il record dell'app**, che a sua volta richiede l'**App ID registrato**. Se mancano, si parte da qui.

**0.1 L'App ID** — developer.apple.com → *Certificates, Identifiers & Profiles* → **Identifiers** → ＋ → App IDs → App. Bundle ID **Explicit**: `com.lifecouple.app`.

Fra le **Capabilities** si spunta **una casella sola**:

| Capability | Cosa fare |
|---|---|
| **Push Notifications** | ☑️ **spuntare** — e' una capability vera, e chiude la voce aperta dal 2026-09-10 |
| **In-App Purchase** | ⚠️ **niente da fare**: per un App ID *esplicito* e' **gia' attiva e non modificabile** — compare spuntata e in grigio. (E' disattivata solo per gli App ID *wildcard*.) |

⚠️ **E una trappola collegata**: l'entitlement `com.apple.developer.in-app-purchase` **non esiste**. Se compare in un file di entitlements va tolto — e' la causa di errori di provisioning che sembrano riguardare gli acquisti e invece riguardano quella riga di troppo.

🔑 **Conviene fare i due gesti insieme**: la capability Push Notifications serve alle notifiche nella build firmata, ed e' l'unico pezzo che `docs/deploy-notifiche.md` dichiara fuori dalla propria portata. Registrando l'App ID adesso si chiudono due voci con un clic.

**0.2 Il record dell'app** — App Store Connect → *Apps* → ＋ → **New App**. Platform **iOS** soltanto (D-132), Bundle ID `com.lifecouple.app`, SKU interno a piacere. ⚠️ *Il nome e' unico su tutto l'App Store e lo prenoti qui.*

**0.3 Un tester sandbox** — *Users and Access → Sandbox → Testers* → ＋, con un'email **mai usata** per un Apple ID. Senza, non si puo' fare nemmeno un acquisto di prova: gli acquisti veri costano soldi veri.

---

## 1. I due prodotti su App Store Connect

Prima: **Business → Agreements, Tax, and Banking**, tutte e tre le righe `Active`. ⚠️ *Se il contratto è accettato ma i dati bancari o fiscali mancano, il prodotto resta in `Missing Metadata` e la causa non è indicata dove la cerchi.*

Poi **Monetization → Subscriptions**, un solo gruppo:

| | |
|---|---|
| Nome del gruppo | `Insieme` |
| Riferimento (interno) | `insieme` |

Dentro il gruppo, due abbonamenti:

| Product ID | Durata | Prezzo | Livello |
|---|---|---|---|
| `com.lifecouple.app.insieme.mensile` | 1 mese | **€7,99** | 1 |
| `com.lifecouple.app.insieme.annuale` | 1 anno | **€39,99** | 1 |

🔑 **Stesso livello per entrambi, ed è voluto.** Il livello serve a dire quale abbonamento vale *di più* in un gruppo con piani diversi; qui i due danno **esattamente le stesse funzioni** e cambiano solo la cadenza di pagamento. Livelli diversi direbbero ad Apple una cosa falsa sul prodotto, e cambierebbero il comportamento di upgrade e downgrade.

⚠️ **Il prezzo non è modificabile a piacere dopo che qualcuno ha comprato**: aumentarlo richiede il consenso degli abbonati esistenti, e chi non consente resta al prezzo vecchio. `€7,99 / €39,99` è la decisione dell'utente del 2026-09-14 (**D-134**), che sostituisce quella di `monetizzazione.md` §3 — non è un segnaposto.

⬜ **Periodo di prova gratuito: non deciso.** Non è stato scelto in nessun documento, e **non va aggiunto per abitudine**: cambia l'economia unitaria e le frasi legali della schermata d'acquisto. Se lo si vuole, si decide prima e si registra.

Ogni prodotto vuole anche: nome visibile, descrizione, e **una schermata di anteprima** della pagina d'acquisto. ⚠️ *Quella schermata non esiste ancora* — il prodotto resta in `Missing Metadata` finché non c'è, ed è normale a questo punto.

---

## 2. Il progetto RevenueCat

**2.1 App** — Project → Apps → aggiungi **App Store**. Serve il bundle `com.lifecouple.app` e la **App-Specific Shared Secret**, che sta su App Store Connect in *App → General → App Information → App-Specific Shared Secret*. 🔑 *Senza quella RevenueCat non può validare le ricevute, ed è l'errore più comune del primo collegamento.*

🔴 **E serve anche la In-App Purchase Key** (App Store Connect → *Users and Access → Integrations*). ⟳ **Corretto il 2026-09-14 (3): questa riga diceva «conviene caricare anche», ed era un eufemismo.** La documentazione di RevenueCat è esplicita — *«Make sure you have added **both** your App-Specific Shared Secret **and** your In-App Purchase Key… These are required for validating subscriptions **and fetching offerings/products**. Missing either of these credentials can prevent products and offerings from being fetched in your app.»*

⚠️ **Quindi non è un comodo** — e il sintomo non nomina le credenziali: dice *«nessuno dei prodotti registrati su RevenueCat è stato recuperato da App Store Connect»*, che manda a cercare nei prodotti.

> ⟳ **Precisazione aggiunta poche ore dopo, guardando il pannello (2026-09-14 (3)) — e correggo me stesso.** La frase «servono entrambe» viene dalla pagina di troubleshooting, ma **il pannello di RevenueCat dice una cosa più precisa**: la *App-specific shared secret* è marcata **(Legacy)** e serve *«to validate transactions if your app is targeting iOS 15 or below, or is configured to use StoreKit 1»*. 🔑 **Con `react-native-purchases` 10.x si usa StoreKit 2, quindi la credenziale che conta è la In-App Purchase Key** — e la shared secret può restare vuota. ⚠️ *Verificato sul progetto reale: la shared secret **è** vuota, la IAP Key è caricata con Key ID e Issuer ID, e non è questo il motivo per cui i prodotti non si recuperavano.*

⬜ **Resta invece davvero da caricare la App Store Connect API key** (`AuthKey_….p8`, sezione *App Store Connect API* della stessa scheda): senza, RevenueCat **non riesce a leggere lo stato dei prodotti** e nella tabella Products scrive *«Could not check»*. Non blocca il recupero dal telefono, ma toglie l'unico modo di vedere dal pannello se un prodotto è pronto — cioè proprio la diagnosi che serve quando succede quello che è successo.

**2.2 Entitlement** — uno solo:

| Identificativo | **`lifecouple_pro`** |
|---|---|

⟳ **Era `insieme` quando questo documento e' nato (D-133); l'utente ha scelto `lifecouple_pro` il 2026-09-14**, dopo averlo gia' configurato nel pannello. Il documento e' stato allineato al pannello, non viceversa.

⚠️ **Questo nome vive in due posti che nessun controllo confronta fra loro**: qui, e la costante `ENTITLEMENT` in [`lib/acquisti.ts`](../lib/acquisti.ts). 🔑 *Se divergono, l'app non concede mai niente e non lo dice* — il paywall si chiude con un successo apparente e il diritto resta spento. E' il tipo di guasto che sembra un problema di pagamento e non lo e'.

⚠️ **Il nome del prodotto NON e' cablato nel codice**, ed e' voluto: l'app legge le Offerings da RevenueCat, quindi i `product_id` si cambiano dal pannello senza toccare l'app. L'unico identificativo condiviso e' l'entitlement.

**2.3 Prodotti e offering** — associa i due product ID all'entitlement **`lifecouple_pro`**, e mettili in un offering `default` con due package, `$rc_monthly` e `$rc_annual`.

> ⚠️ **Questa riga ha detto `insieme` fino al 2026-09-14 (3)**, cioè il nome vecchio, mentre §2.2 due paragrafi sopra dichiarava già `lifecouple_pro`. 🔑 *Un runbook che si contraddice al suo interno è peggio di uno incompleto*: chi lo segue con le credenziali in mano configura il nome sbagliato, e il guasto che ne esce — l'app che non concede mai niente **senza dirlo** — sembra un problema di pagamenti e non lo è.

**2.4 Chiavi** — serve la **public SDK key** per iOS (`appl_…`). ✅ *È pubblica per costruzione, va nel bundle dell'app e non è un segreto.* ⚠️ Non confonderla con la **secret key** dell'API v2, che non deve entrare nel repo e qui **non serve**.

---

## 3. Il webhook

**3.1 Il segreto.** 🔴 **Non generarlo sulla riga di comando**: la forma `"$(openssl rand -hex 32)"` funziona in bash e **fallisce in silenzio in cmd.exe**, impostando come segreto la stringa stessa. È successo il 2026-09-14 (**B-65**), e `secrets set` risponde `Finished` identico nei due casi.

```bash
node -e "require('fs').writeFileSync('.env.segreto.local','RC_WEBHOOK_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
```

⚠️ Il nome del file non è arbitrario: `.gitignore` copre `.env*.local` e **non** `.segreto.env`. Verificalo con `git check-ignore` prima di scriverci dentro.

```bash
npx supabase secrets set --env-file .env.segreto.local --project-ref uegayflvtjfhjrmbibdz
```

✅ **Poi verifica il digest, perché `Finished` non dimostra niente**: l'API restituisce lo sha256 del valore, quindi il confronto è possibile.

```bash
node -e "const c=require('crypto'),f=require('fs');const v=f.readFileSync('.env.segreto.local','utf8').split('=')[1].trim();console.log('atteso:',c.createHash('sha256').update(v).digest('hex'))"
```

```bash
npx supabase secrets list --project-ref uegayflvtjfhjrmbibdz --output json
```

I due valori per `RC_WEBHOOK_SECRET` devono coincidere. Poi **annota il segreto nel gestore di password e cancella il file**: non si rilegge.

**3.2 Pubblicare la funzione — 🔴 con `--no-verify-jwt`, e non e' un dettaglio.**

```bash
npx supabase functions deploy abbonamento-webhook --no-verify-jwt --project-ref uegayflvtjfhjrmbibdz
```

⚠️ **Senza quel flag il webhook non arriva MAI**, e l'errore manda a cercare nel posto sbagliato. Le Edge Function nascono con `verify_jwt` attivo: la piattaforma pretende un JWT (o una API key) **prima** che il nostro codice parta. RevenueCat manda solo l'header `Authorization` col nostro segreto — che non e' un JWT — e non puo' mandare un `apikey`. Provato il 2026-09-14, ed e' questa la risposta:

```
401 {"code":"UNAUTHORIZED_INVALID_JWT_FORMAT","message":"Auth header is not 'Bearer {token}'"}
```

🔑 **Nel pannello RevenueCat vedresti «401» e daresti la colpa al segreto.** Le altre due funzioni del progetto tengono `verify_jwt = true` e fanno bene: `cancella-account` la chiama un utente col suo token, e il cron di `invia-notifiche` l'`apikey` puo' mandarla. Un terzo che parla al nostro sistema no — ed e' il motivo per cui l'autenticazione vera **e' il segreto**, non il cancello.

**3.3 Collegare RevenueCat** — Project → Integrations → Webhooks:

| Campo | Valore |
|---|---|
| URL | `https://uegayflvtjfhjrmbibdz.supabase.co/functions/v1/abbonamento-webhook` |
| Authorization header | *il segreto del passo 3.1, nudo — senza `Bearer`* |
| Environment | **Sandbox e Production** entrambi |

🔑 **«Nudo, senza `Bearer`»** perché la funzione confronta l'header per intero: qualunque prefisso lo fa fallire, e l'errore sarebbe un `401` indistinguibile da un segreto sbagliato.

⚠️ **Sandbox serve quanto Production**: gli acquisti di prova da TestFlight passano da lì, e se il webhook è collegato solo a Production **niente di ciò che provi arriva mai al database** — e sembrerebbe un difetto del codice.

**3.4 Collegare Apple a RevenueCat** — ⚠️ **sezione aggiunta il 2026-09-15, e la sua assenza era il difetto.**

> 🔑 **Questo documento descriveva una catena a due anelli e ne ha tre.** §3.3 collega *RevenueCat → noi*, ed era l'unico anello documentato. Ma RevenueCat viene a sapere di rinnovi, rimborsi e disdette **da Apple**, e quel primo anello va configurato a mano in App Store Connect: se manca, RevenueCat non ha nulla da inoltrarci e il nostro webhook resta muto **pur essendo configurato bene**. ⚠️ *Il piano di pubblicazione chiamava tutto questo «B3 — App Store Server Notifications su Sandbox e Production», e chi leggeva §3.3 credeva di averlo già fatto.*

Dove si prende l'URL: pannello RevenueCat → **Apps → `lifecouple (App Store)`** → *Apple Server to Server notification settings* → **Apple Server Notification URL**. 🔑 *Si copia col pulsante, non si trascrive*: è lungo ~139 caratteri e un carattere sbagliato dà **lo stesso sintomo dell'assenza**, mandando a cercare nel posto sbagliato.

Dove si incolla: **App Store Connect → l'app → Informazioni sull'app → «Notifiche del server dell'App Store»**, in **entrambi** i campi:

| Campo | Valore |
|---|---|
| URL del server di produzione | l'URL di RevenueCat |
| **URL del server di sandbox** | **lo stesso URL** |

✅ **Fatto il 2026-09-15.** Prima di allora entrambi i campi erano vuoti — e RevenueCat lo diceva, accanto al proprio URL: **«No notifications received»**. 🔑 *Quella dicitura è il modo più rapido di sapere se questo anello esiste*, e va guardata lì e non su App Store Connect, che mostra solo cosa hai scritto e non se qualcuno ti ha mai risposto.

⚠️ **La conferma vera non arriva dal salvataggio ma dal primo acquisto**: Apple manda notifiche sugli **eventi**, non quando configuri l'URL. Finché non si fa l'acquisto sandbox di **B2**, quella scritta resta «No notifications received» ed è corretto che lo sia.

---

## 🔴 Quando l'app dice «None of the products could be fetched»

Capitato il 2026-09-14 (3) sulla prima development build. 🔑 **La cosa da sapere prima di cercare, perché sposta il posto in cui si guarda: quei prodotti li chiede il TELEFONO, non RevenueCat.** RevenueCat passa all'SDK solo la *lista di identificativi*; a interrogare l'App Store è **StoreKit sul dispositivo**. Nessuna modifica nel pannello RevenueCat può quindi far comparire un prodotto che App Store Connect non sta servendo.

⚠️ **E «nessuno» esclude il refuso su un singolo identificativo**: se un solo ID non combaciasse, l'altro prodotto arriverebbe lo stesso. Un guasto che li prende tutti è **di account o di stato**, non di nome.

### ✅ RISOLTO la sera stessa — i prezzi arrivano (2026-09-14 (3))

Dopo localizzazioni, disponibilità e screenshot, il paywall sul telefono **mostra i prezzi**. 🔑 *Nessun altro intervento*: né la App Store Connect API key, né «Aggiungi alla verifica», né una submission.

⚠️ **Cosa esattamente lo abbia sbloccato non è attribuibile con certezza**, perché sono state cambiate quattro cose insieme e nel frattempo è passato del tempo (la propagazione di Apple arriva a ore). 🔑 **Ma una delle quattro non poteva in nessun caso funzionare: la disponibilità era `0 paesi`.** Un prodotto disponibile in nessun paese non è servibile da nessuna parte — le localizzazioni mancanti erano il secondo candidato, e il resto è propagazione.

⚠️ **E lo stato è rimasto «In preparazione per l'invio» anche dopo**: quindi — contro quanto dice la guida di RevenueCat — **StoreKit ha servito prodotti che non erano in «Pronto per l'invio»**. *È un fatto osservato su questo progetto, e vale più della regola scritta.*

### La causa, riga per riga (2026-09-14 (3))

**Nessuna delle due localizzazioni esisteva.** In App Store Connect:

| Cosa | Stato trovato |
|---|---|
| Gruppo `Insieme` | 🔴 **zero localizzazioni** — la sezione *Localizzazione* del gruppo era vuota, col solo pulsante «Crea» |
| `Insieme mensile` e `Insieme annuale` | 🔴 **zero localizzazioni** — nessun nome e nessuna descrizione da mostrare sull'App Store |
| Disponibilità per paese | 🔴 da configurare («Configura la disponibilità») |
| Stato risultante | 🟡 **«In preparazione per l'invio»** per entrambi, **non** «Pronto per l'invio» |

🔑 **E lì si chiude il cerchio**: StoreKit serve solo i prodotti in `Pronto per l'invio` o `Approvato`. Finché il nome localizzato manca, il prodotto non raggiunge quello stato, quindi il telefono chiede due identificativi e **non riceve niente** — che è esattamente il messaggio dell'SDK.

⚠️ **Le localizzazioni sono DUE cose distinte e si dimentica la prima**: quella del **gruppo** (il nome che l'utente vede fra gli abbonamenti nelle impostazioni del telefono) e quella di **ogni piano** (nome + descrizione sull'App Store). Riempirne una sola non basta.

✅ **Quel che invece era già a posto**, e vale la pena saperlo per non rifare il giro: identificativi corretti in entrambi i pannelli, offering `default` con `$rc_monthly` e `$rc_annual` legati ai due prodotti giusti, entitlement `lifecouple_pro` attaccato a tutti e due, chiave `appl_…` giusta per la piattaforma, bundle ID coerente ovunque, In-App Purchase Key caricata.

⚠️ **Una divergenza trovata di passaggio, da decidere**: i due abbonamenti stanno su **livelli diversi** (mensile = 1, annuale = 2), mentre §1 di questo documento prescrive **lo stesso livello per entrambi** — danno le stesse funzioni e cambiano solo la cadenza. Livelli diversi cambiano il comportamento di upgrade e downgrade.

#### Cosa è stato configurato il 2026-09-14 (3), e con quali testi

Fatto dall'agente nel pannello, letto e confermato a schermo:

| Dove | Cosa |
|---|---|
| Gruppo `Insieme` | localizzazioni **Italiano** e **Inglese (Stati Uniti)**, nome visualizzato `Insieme`, nome dell'app `LifeCouple` |
| `Insieme mensile` | 🇮🇹 *Insieme mensile* — «Mappa, liste, Philippe, foto e giochi.» · 🇬🇧 *Insieme Monthly* — «Map, lists, Philippe, photos and games.» |
| `Insieme annuale` | 🇮🇹 *Insieme annuale* — stessa descrizione · 🇬🇧 *Insieme Yearly* — stessa descrizione |
| Disponibilità | **175 paesi** su entrambi (era **0**) |

🔑 **Perché tutti i paesi e non la sola Italia**: il revisore di Apple lavora da uno storefront che non è il nostro, e un prodotto non disponibile lì non lo vedrebbe. *Si restringe quando si vuole, in un minuto.*

⚠️ **Sull'annuale ci sono DUE disponibilità, e ne è stata configurata una sola**: il *pagamento anticipato di 1 anno*, che è **D-134**. La seconda — *fatturazione mensile con impegno di 12 mesi* — è deliberatamente lasciata vuota: è un'altra offerta commerciale, non decisa.

⚠️ **I testi delle descrizioni sono vincolati a D-135 e non sono pubblicità**: dicono *mappa, liste, Philippe, foto e giochi* perché sono esattamente le cose che il piano a pagamento concede. 🔑 *Non dicono «foto senza limiti»*, che sarebbe falso: il tetto di 1 GB (D-22) vale per tutti — è lo stesso motivo per cui tre voci erano state scartate dal paywall.

✅ **E lo screenshot di verifica è stato caricato su entrambi i piani** (stessa sera). ⚠️ **Due cose imparate caricandolo, che valgono per la prossima volta:**
- 🔴 **Apple rifiuta le misure sbagliate**, con il messaggio *«le dimensioni di uno o più screenshot non sono corrette»*. L'immagine passata da **WhatsApp era 736×1600** — ricompressa e ridimensionata — e viene respinta. *Serve lo screenshot originale del telefono, o un ridimensionamento a una misura valida*: qui è stato portato a **1290×2796** (iPhone 15 Pro Max) e accettato.
- 🔑 **Il campo si salva da sé**: dopo l'upload non serve premere «Salva», e il file sopravvive al ricaricamento della pagina.

⬜ *Quello caricato è un segnaposto*: mostra il paywall col messaggio «non riusciamo a caricare i prezzi» e la barra di debug. **Va sostituito con uno pulito prima della revisione** — il campo resta modificabile fino alla submission.

🔴 **E nemmeno questo è bastato.** Con localizzazioni, disponibilità, prezzo e screenshot a posto, entrambi i piani restano **«In preparazione per l'invio»**, e l'unico comando rimasto è **«Aggiungi alla verifica»**. Il banner di Apple dice il perché: *«il tuo primo gruppo di abbonamenti dev'essere inviato con una nuova versione dell'app»*.

⚠️ **Quindi il primo abbonamento di un'app ha una dipendenza che nessuna checklist di configurazione nomina: la prima submission dell'app.** Se dopo «Aggiungi alla verifica» lo stato passa a «Pronto per l'invio», StoreKit dovrebbe servire i prodotti; se non passa, il recupero dei prezzi resta bloccato fino a che la versione 1.0 non viene inviata — *e allora l'ordine di tutto il piano di pubblicazione cambia, perché provare l'acquisto smette di essere un prerequisito della submission e ne diventa una conseguenza.*

### L'ordine in cui guardare, se ricapita

L'ordine dal più probabile — è la checklist ufficiale di RevenueCat ristretta al nostro caso:

| # | Controllo | Perché proprio questo |
|---|---|---|
| 1 | **In-App Purchase Key** caricata su RevenueCat, con Key ID e Issuer ID | ⚠️ *La shared secret è legacy (StoreKit 1) e con la 10.x può restare vuota* — vedi §2.1. Una credenziale mancante colpirebbe tutti i prodotti insieme, che è il sintomo, ma **non era questo** |
| 2 | **Stato dei prodotti** in ASC: `Pronto per l'invio` o `Approvato` | 🔑 **È stata questa la causa la prima volta.** In `In preparazione per l'invio` non vengono serviti, e ciò che li teneva fermi erano le **localizzazioni mancanti** — quella del gruppo *e* quella di ogni piano, che sono due cose diverse |
| 3 | **Bundle ID** uguale in tre posti: pannello RevenueCat, App Store Connect, `app.json` | ⚠️ Fa distinzione fra maiuscole e minuscole. Il nostro è `com.lifecouple.app` |
| 4 | **Agreements, Tax and Banking** tutte e tre attive | Possono **scadere**, e la propagazione dopo la firma arriva a **24 ore** |
| 5 | **Identificativi** dei prodotti, carattere per carattere | `com.lifecouple.app.insieme.mensile` e `.annuale` |
| 6 | **Propagazione** | Prodotti nuovi: fino a **24 ore**. Se 1-5 quadrano, l'unica mossa giusta è **aspettare**, non toccare altro |

⬜ **Due controlli della lista ufficiale non ci riguardano**: il file *StoreKit Configuration* di Xcode (qui non esiste — il prebuild avviene su EAS) e la chiave di piattaforma sbagliata (la nostra è `appl_…`, verificato).

⚠️ **Per l'acquisto, non per il recupero**, serve anche essere autenticati con un **Apple Account sandbox** sul telefono — *Impostazioni → App Store → Sandbox Account*. Non serve per far comparire i prezzi.

---

## Come si capisce che funziona

La funzione risponde sempre in JSON, e i codici hanno un significato preciso:

| Risposta | Significato |
|---|---|
| `200 {"ok":true,"azione":"concedi",...}` | il diritto è stato scritto |
| `200 {"ok":true,"azione":"ignorato",...}` | ⚠️ **non è un errore**: un tipo di evento che non concede né toglie, o un `app_user_id` che non è un utente nostro |
| `200 {"ok":true,"azione":"gia visto"}` | stesso evento consegnato due volte — l'idempotenza ha funzionato |
| `401 {"errore":"non autorizzato"}` | l'header non corrisponde. ⚠️ *Identico per segreto assente e segreto errato, di proposito* |
| `500` | guasto nostro, e **RevenueCat riproverà**: fino a cinque volte, con attese di 5, 10, 20, 40 e 80 minuti |

🔑 **Perché quasi tutto risponde 200.** RevenueCat considera fallimento qualunque codice fuori dai 2xx. Rispondere `4xx` a un evento che abbiamo deciso di ignorare produrrebbe quattro tentativi inutili e poi la rinuncia — cioè rumore che somiglia a un guasto. Il `500` è riservato ai casi in cui **riprovare ha senso davvero**.

La prova vera, dopo un acquisto sandbox:

```sql
select utente_id, attivo, prodotto, scade_il, evento_il from public.abbonamento order by aggiornato_il desc limit 5;
```

E dal lato dell'app, che è ciò che conta per l'utente:

```sql
select public.coppia_ha_insieme('<id della coppia>');
```

---

## Cosa resta fuori da questo documento

> ⟳ **Rivisto il 2026-09-14 (3)**: tre delle quattro voci qui sotto sono state fatte **nel pomeriggio dello stesso giorno in cui questo documento è nato**, e continuavano a essere elencate come mancanti.

- ✅ **L'SDK nell'app e la schermata del listino** — fatti il 2026-09-14: `react-native-purchases`, `lib/acquisti.ts`, `app/paywall.tsx`, i muri e il Customer Center. È servito il **prebuild**, come questa riga prevedeva (**D-133**), e la prima development build è su EAS.
- 🔴 **Le due frasi legali prima del pulsante che paga**: consenso espresso e presa d'atto della perdita del recesso. **Restano l'unica voce aperta delle quattro**, ed è **B-66**: ⚠️ *il paywall porta le informazioni che pretende Apple — rinnovo, come disdire, prezzo alla scadenza — e un commento nel codice dichiara che bastino a far decadere il recesso.* Non bastano. Senza, restano quattordici giorni esercitabili su ogni acquisto.
- ⟳ **Informativa, registro art. 30 e accordo art. 28 per RevenueCat**: ✅ informativa (§3/§4/§5) e registro **fatti**, 🔴 **accordo art. 28 no** — e non solo per RevenueCat: nessuno dei terzi ne ha uno archiviato. ⚠️ *«Nello stesso giro» non è successo*: l'SDK è entrato prima, i documenti dopo, a lacuna già aperta — la quarta volta dopo B-60, B-62 e le notifiche.
- ✅ **Avvisare chi cancella l'account che l'abbonamento NON si cancella con esso** — fatto: l'avviso compare nel momento della cancellazione e dice come disdire dalle impostazioni del telefono.
