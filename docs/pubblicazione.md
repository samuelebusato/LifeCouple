# LifeCouple — Pubblicazione su App Store e Play Store

> Scritto il **2026-08-29**. Piano operativo per portare LifeCouple sui due store, **con i pagamenti già dentro** (decisione dell'utente del 2026-08-29 — vedi [`Marketing/LifeCouple/monetizzazione.md`](../../../Marketing/LifeCouple/monetizzazione.md) §0-bis).
>
> **Cosa è questo file e cosa non è.** È il piano *operativo*: cosa va fatto, in che ordine, e perché quell'ordine. Le decisioni di prodotto — prezzo, confine gratis/pagamento, pagamento a coppia — **non** vivono qui: stanno in `monetizzazione.md`, e questo documento le presuppone. Le voci di lavoro vere stanno nel backlog di [`History.md`](../History.md), che resta la fonte di verità dello stato: qui c'è il ragionamento, lì c'è il conto di cosa è fatto.
>
> ⚠️ **Le regole degli store cambiano più in fretta della documentazione che le descrive.** Ogni requisito qui sotto va riverificato sulla documentazione ufficiale al momento in cui lo si affronta, e i costi ancora di più. Quanto scritto vale come mappa del terreno, non come normativa.

---

## 0. Lo stato di partenza, verificato il 2026-08-29

Non è un elenco di buoni propositi: è cosa c'è e cosa non c'è nel repo, controllato file per file.

> ⚠️ **Riverificato il 2026-08-31: quattro righe sono cambiate**, e sono segnate qui sotto. La tabella non è stata riscritta perché *lo stato superato dice qualcosa che lo stato attuale non dice* — ma leggerla senza queste correzioni porta a conclusioni sbagliate.
>
> 🔴 **E una correzione che vale più delle altre**: il PUNTO DI RIPRESA del 2026-08-29 diceva che sul server c'era una Edge Function «vecchia». **Non c'era nessuna Edge Function.** Verificato con `supabase functions list`, e provato dal deploy stesso (`version: 1`). Si credeva che «Elimina account» cancellasse *male*; in realtà **falliva del tutto**.

| | stato |
|---|---|
| `eas.json` | ~~❌ non esiste~~ → ✅ **creato il 2026-08-31** (D-79), tre profili. ⬜ Restano `eas init` e i secret |
| Edge Function (`supabase/functions`) | ~~❌ non esiste~~ → ✅ **`cancella-account` scritta il 29-08 e DEPLOYATA il 2026-08-31** (`ACTIVE`, `version 1`). 🔴 Mai provata end-to-end |
| Libreria di pagamenti | ❌ **nessuna** in `package.json` |
| Schermata cancellazione account | ~~❌ non esiste~~ → ✅ **esiste** (`app/impostazioni.tsx`, dal 2026-08-29) |
| `sciogli_coppia()` nel database | ✅ esiste dal 2026-08-12, **senza interfaccia** |
| Identificatori app | ✅ `com.lifecouple.app` su entrambe le piattaforme |
| Testi dei permessi | ⚠️ presenti in `app.json`, **solo in italiano**, mai visti da nessuno (B-20) |
| Chiavi API | ⚠️ Google Places e TMDB **dentro il bundle** |
| Documenti privacy | ⚠️ modelli in `Rule/`, **non adattati né pubblicati** |
| Regione UE del progetto Supabase | ~~⚠️ mai verificata~~ → ✅ **`eu-central-1` (Francoforte)** — verificato il 2026-08-31 con `supabase projects list`. **Nessun trasferimento extra-UE** per i dati degli utenti. Backlog aperto dal 2026-08-12, chiuso |
| Controlli sul nome | ⚠️ **mai fatti** (EUIPO cl. 9 e 42, store, dominio, handle) |

---

## 1. I due blocchi che non sono ritardi ma muri

### 1.1 ⟳ La cancellazione dell'account — costruita il 2026-08-31, **mai provata**

> ⟳ **Aggiornato il 2026-09-14 (3).** Il titolo diceva *«non esiste»* e ha continuato a dirlo per due settimane dopo che esisteva: la Edge Function [`cancella-account`](../supabase/functions/cancella-account/index.ts) è del 2026-08-31, `ACTIVE`, invocata da Impostazioni. 🔴 **Ma il muro non è caduto: si è spostato.** Quel che manca è la **prova end-to-end** — la tabella «Esito della prova» in [`legal/catena-cancellazione.md`](legal/catena-cancellazione.md) è vuota. ⚠️ *L'informativa §7 promette agli utenti una cancellazione «immediata e definitiva»: è la dichiarazione più impegnativa dell'intero corpo documentale, ed è l'unica che poggia su codice mai eseguito.* Tutto ciò che segue resta valido come racconto del perché la voce esiste.

Apple richiede che un'app che permette di **creare** un account permetta di **cancellarlo dall'app** — non per email, non dal sito. LifeCouple crea account. È fra i primi controlli del revisore, quindi non è un rischio: è un esito.

Google Play chiede la stessa cosa in altra forma: dichiarazione nel modulo *Data safety* **e** un percorso di cancellazione raggiungibile **anche via web**, senza installare l'app.

🔴 **E non è una schermata.** Eliminare una riga da `auth.users` richiede la chiave `service_role`: **dal client è impossibile**, per costruzione. Quindi questa voce è in realtà *la prima infrastruttura server del progetto* — Edge Function, secret, deploy — e va dimensionata come tale.

🔑 **Il lato buono, ed è il motivo per cui va fatta per prima**: la stessa infrastruttura serve subito dopo ad altre due cose — togliere le chiavi dal bundle e ricevere il webhook degli abbonamenti (§3.2). Costruita una volta, serve tre volte. Farla per prima non è solo urgenza: è l'ordine che costa meno.

⚠️ **Da progettare insieme, non dopo**: la cancellazione dell'account e lo **scioglimento della coppia** sono due atti diversi con conseguenze diverse già decise in **D-04** e **D-21** (lo scioglimento *revoca l'accesso*, non cancella; i contenuti condivisi si duplicano, i personali restano all'autore). L'interfaccia deve distinguerli, perché un utente che preme «cancella account» credendo di sciogliere la coppia fa una cosa irreversibile al posto di una reversibile.

### 1.2 🔴 TMDB è gratuito solo per uso non commerciale

Con gli abbonamenti attivi l'uso è **commerciale dal primo giorno**, indipendentemente dal fatto che il download sia gratis. Due strade, entrambe accettabili, nessuna ignorabile:

- ottenere la **licenza commerciale** TMDB;
- togliere le locandine (**D-69**) dal prodotto pubblicato.

⚠️ Fino al 2026-08-29 questo era registrato come *debito da verificare prima di attivare il listino*. Con la decisione di lanciare già a pagamento **è diventato un blocco alla pubblicazione**, e va risolto prima della sottomissione, non dopo.

> ✅ **Tolto dal percorso il 2026-09-10 con D-127**, e la distinzione conta: **non è risolto, è tolto**. Con la lista Film spenta l'app non chiama TMDB e non disegna locandine, quindi non c'è uso commerciale da licenziare. 🔴 **Riaccendere quella lista rimette il muro esattamente dov'era** — e le tre mosse per abbatterlo davvero (scrivere a TMDB, riprovare TheTVDB, togliere le locandine da fonte esterna) restano scritte nel backlog di `History.md` §6.

---

## 2. Gli account — RISCRITTA il 2026-08-31

> 🔴 **Questa sezione diceva «va scelto organizzazione, il prezzo è il D-U-N-S». Era sbagliata**, e la versione superata è conservata in **§2.4** perché il ragionamento che conteneva resta valido — cambia il fatto su cui poggiava.
>
> **Due cose l'hanno ribaltata**, verificate sulla documentazione ufficiale il 2026-08-31: che per una ditta individuale il percorso «organizzazione» su Apple **non è aperto**, e la decisione dell'utente di pubblicare **a nome proprio, non a nome dell'azienda**.

### 2.1 La decisione: si pubblica come INDIVIDUO

**Decisa dall'utente il 2026-08-31**: l'app esce a nome **Fausto Busato**, non a nome F.R. di Busato Fausto.

🔑 **E per questa forma d'impresa non è nemmeno una scelta libera su Apple.** Apple ha due percorsi — *Individual / Sole Proprietor* e *Organization* — e stabilisce che chi è **ditta individuale / impresa unipersonale si iscrive come individuo**, col proprio nome legale come venditore. Il percorso «Organization» è per **entità legali separate** (S.r.l., S.p.A.), e il D-U-N-S serve appunto a provare che quell'entità esiste come soggetto distinto dalla persona.

⚠️ **Una ditta individuale non è un soggetto distinto**: fiscalmente e giuridicamente, `F.R. di Busato Fausto` **è** `Fausto Busato`. È anche il motivo per cui D&B elenca le *sole proprietorships* fra le forme che non censisce — e quindi perché la ricerca del D-U-N-S sarebbe stata verosimilmente un vicolo cieco.

### 2.2 Cosa serve, per ciascuno store

| | **Apple Developer Program** | **Google Play Console** |
|---|---|---|
| Costo | ~99 $/**anno**, si rinnova | ~25 $ **una tantum** |
| D-U-N-S | ✅ **non serve** | ✅ **non serve** |
| Identità | Apple ID con **2FA** · **nome legale** in nome e cognome · email, telefono, indirizzo (⚠️ **niente caselle postali**) · documento | Account Google · documento · nome, indirizzo, email e telefono, **verificati con codice** |
| Tempi d'iscrizione | Giorni | Giorni |
| 🔴 **Vincolo aggiuntivo** | — | **Test chiuso: 12 tester per 14 giorni consecutivi** prima della produzione |

⚠️ **Nei campi nome e cognome va il nome legale personale, mai la denominazione dell'impresa.** Scriverci «F.R. di Busato Fausto» **fa ritardare l'approvazione**: Apple lo dice esplicitamente.

**Nome venditore visibile sugli store**: `Fausto Busato`. La denominazione dell'impresa non compare da nessuna parte.

⚠️ Costi e regole **da riverificare all'iscrizione**.

### 2.3 ~~🔴 Il test chiuso di Google è il vero prezzo di questa strada~~ — **non si paga più** (D-132)

> 🔑 **Caduta il 2026-09-14 con D-132: si pubblica da iPhone soltanto.** Questo requisito era di **Google**, e con esso cadono i **12 tester per 14 giorni** più i 7 di revisione — cioè **la coda più lunga dell'intero piano**, e l'unica che nessun lavoro poteva comprimere. ⚠️ *Il costo della scelta è dichiarato altrove* (in Italia Android ha la quota maggiore): qui conta che il cammino critico non esista più.
>
> ⚠️ **Ma una cosa che questa sezione diceva resta vera, e va salvata prima di archiviarla**: D-25 stabilisce che **l'app da soli non è collaudabile**. I 12 tester erano il requisito di Google *e* l'unico modo di collaudare il prodotto. Tolto il requisito, **il bisogno resta** — semplicemente non ha più una scadenza imposta da fuori, il che lo rende più facile da rimandare e non meno necessario.

L'analisi sotto resta come racconto della strada non più percorsa.

Vale per gli account personali **creati dopo il 13 novembre 2023**. Prima di poter pubblicare in produzione servono **almeno 12 tester**, iscritti **in modo continuativo per almeno 14 giorni** e **ancora attivi** al momento della richiesta; poi si chiede l'accesso alla produzione e Google risponde di norma entro sette giorni.

**Sono ~3 settimane, e non sono attesa passiva**: 12 persone vere con account Google vanno trovate e coordinate. Su un'app di coppia significa realisticamente **sei coppie**.

🔑 **Ma coincide con un bisogno che il progetto ha già**, ed è la ragione per cui non va vissuto come una tassa: **D-25** stabilisce che senza partner l'app non fa niente, quindi **non è collaudabile in altro modo**. Quelle 12 persone sono i beta tester che [`Marketing/LifeCouple/piano-marketing.md`](../../../Marketing/LifeCouple/piano-marketing.md) voleva comunque. Il requisito di Google e il collaudo del prodotto sono **lo stesso lavoro**, con una scadenza imposta da fuori.

⚠️ **Da controllare prima di creare un account nuovo**: un account Play personale **anteriore al 13/11/2023** sarebbe esente.

### 2.4 ~~La versione superata: «va scelto organizzazione»~~ (2026-08-29)

Conservata perché *una decisione giusta smette di esserlo quando cambia ciò su cui poggiava*, e cancellarla toglie l'informazione più utile delle due.

Diceva: **va scelto organizzazione**, per tre ragioni — (1) l'editore risulta F.R. di Busato Fausto, che per un'azienda vera è il dato corretto; (2) su Google evita il test chiuso con 12 tester; (3) separa la responsabilità dell'app da quella personale. *Il prezzo è il D-U-N-S* — codice di 9 cifre di Dun & Bradstreet, gratuito, da cercare prima di richiedere perché D&B lo assegna anche senza richiesta.

**Cosa è caduto di quel ragionamento:**

| Ragione | Esito |
|---|---|
| (1) Editore = l'azienda | ❌ **Non è più voluto**: l'utente ha deciso di pubblicare a nome proprio |
| (2) Evita il test chiuso | ✅ **Era vero e resta vero** — ed è il costo che si paga, §2.3 |
| (3) Separa la responsabilità | ❌ **Era illusorio**: con una ditta individuale si risponde col patrimonio personale **comunque**. Diventerebbe vero solo con una società di capitali |

🔑 **La lezione da tenere**: il punto (3) era un beneficio **dichiarato ma inesistente**, e nessuno se ne era accorto perché suonava ovvio. È la stessa classe di errore che questo progetto insegue da settimane — *uno stato scritto che nessuno ha verificato* — applicata però a un ragionamento invece che a un file.

⬜ **Se un giorno nascesse una S.r.l.**, il percorso organizzazione si riapre e il D-U-N-S torna necessario. E il trasferimento di un'app da un account individuale a uno aziendale **è previsto da entrambi gli store**: partire come individuo non è una porta che si chiude.

---

## 3. I pagamenti

### 3.1 Cosa impongono gli store

- **L'incasso passa da Apple e Google.** Per i contenuti digitali non si può usare Stripe o PayPal. È anche la ragione della trattenuta del 15–30%.
- **Serve una libreria**: `expo-in-app-purchases` è abbandonata. Restano `react-native-iap` e **RevenueCat**. ⚠️ Per una persona sola RevenueCat conviene — gestisce validazione delle ricevute e webhook per entrambe le piattaforme, e ha un piano gratuito con una soglia di fatturato che qui non verrà sfiorata. Il costo è una dipendenza da un terzo in mezzo al flusso del denaro: va scelto sapendolo.
- **Accordi Paid Apps** con dati bancari e fiscali dell'azienda, su entrambi gli store. Ore di compilazione, giorni di attesa.

**Tre rifiuti banali e frequentissimi, tutti evitabili a costo zero:**
- manca il pulsante **«Ripristina acquisti»**;
- la schermata non dice **prima** del pagamento cosa è incluso, quanto costa e per quanto dura;
- mancano i link a **termini e privacy** dentro quella stessa schermata.

⚠️ **E una che riguarda proprio questa app**: cancellare l'account **non** cancella l'abbonamento. Va detto all'utente nel momento in cui cancella, con l'indicazione di come disdire dalle impostazioni del telefono — altrimenti continua a pagare per un account che non esiste più.

### 3.2 ✅ L'abbonamento è della coppia, lo store vende a una persona — **costruito il 2026-09-14**

> ✅ **Risolto** con la migrazione `0041` e la Edge Function `abbonamento-webhook`: il diritto si scrive **sull'utente che ha pagato** (D-124) e si proietta sulla coppia in lettura con `coppia_ha_insieme()`, calcolata a ogni chiamata e **mai memorizzata**. Il perché della forma è in [`Architecture.md`](Architecture.md) §4.3-quater, la superficie in [`threat-model.md`](threat-model.md) §4-ter.
>
> ⚠️ **Questa sezione prescriveva «una colonna su `coppia`», cioè l'opposto di ciò che è stato costruito** — ed è stata corretta il 2026-09-14: su `coppia` il diritto sparirebbe allo scioglimento **anche a chi ha pagato un periodo già pagato**.

`monetizzazione.md` §1 decide che **il pagamento è a coppia**. Ma un abbonamento è intestato a un **Apple ID** o a un **account Google**: non esiste un abbonamento intestato a due. Uno paga, e il diritto va **esteso all'altro** — cosa che il telefono di chi non ha pagato non può fare, perché non ha ricevute da mostrare.

> 🔴 **Questa sezione è stata corretta il 2026-09-14: prescriveva l'opposto di ciò che è stato deciso.** Il testo sotto è del 2026-08-29 e diceva di scrivere il diritto «sulla riga della **coppia**, non dell'utente». **D-124 (2026-09-10) ha deciso il contrario**, e la domanda che questa sezione lasciava aperta non è più aperta.

**La decisione, da D-124:** *l'abbonamento resta a chi l'ha pagato* — quindi **il diritto si scrive sull'utente e si proietta sulla coppia, mai il contrario**.

🔑 **Il perché è lo scioglimento, ed è il motivo per cui il verso conta.** Se il diritto stesse su `coppia`, sciogliendo sparirebbe **per entrambi** — anche per chi ha pagato, e per un periodo che ha già pagato. Scritto sull'utente, chi ha pagato lo porta con sé (anche in una coppia futura) e l'altro semplicemente smette di vederne l'effetto. È lo stesso genere di domanda che **D-16** aveva già sciolto per la creatura, e la risposta qui è diversa perché diverso è l'oggetto: la creatura è **della coppia** e non sopravvive; l'abbonamento è **di una persona** e la sopravvive.

**Serve, in quest'ordine:**
1. il **webhook** di RevenueCat (**D-133**) verso il backend;
2. una **Edge Function** che scrive il diritto sulla riga dell'**utente** che ha pagato;
3. la proiezione sulla coppia in **lettura**: «questa coppia ha Insieme» significa *«almeno un membro attivo ha il diritto»*, calcolato, non memorizzato.

✅ **Non è una migrazione di dati contesi**: nessun dato esistente cambia significato, si aggiunge una colonna.

⚠️ **Resta però una decisione di prodotto aperta, che D-124 non copre**: se chi ha pagato esce dalla coppia, l'altro perde «Insieme» **da un istante all'altro**. Va deciso se la perdita è immediata o se si accompagna — e questa domanda nasce *dal* verso scelto, non lo mette in discussione.

---

## 4. La pipeline di build

1. **`eas.json`** con tre profili: `development` (build di sviluppo — è ciò che permette finalmente di provare i permessi), `preview` (APK interno), `production` (AAB per Play, IPA per App Store).
2. **Variabili d'ambiente come secret su EAS.** Il `.env` non è versionato, ed è esattamente il problema che si è manifestato il 2026-08-29: la chiave TMDB era su un dispositivo e non sull'altro. Su EAS si caricano una volta e valgono per ogni build, da qualunque macchina.
3. **`version` da `0.1.0` a `1.0.0`** in `app.json`, e i numeri di build che salgono a ogni caricamento.
4. **`eas build` → `eas submit`** per entrambe le piattaforme.
5. **TestFlight** (Apple) e **test interno** (Google): è lì che si prova sul dispositivo ciò che Expo Go non può provare.

### 4.1 ⚠️ Il primo build vero farà uscire cose

**B-20**: in Expo Go i dialoghi dei permessi usano l'`Info.plist` di Expo Go, non il nostro. Le tre frasi in `app.json` — calendario, posizione, foto — **non sono mai comparse a nessuno**. Al primo build di sviluppo si verificano tutte e tre, e nello stesso giro si chiude il **backlog 11-quater**: quelle frasi sono **solo in italiano** mentre l'app è bilingue per decisione esplicita (**D-18**), quindi su un telefono in inglese l'utente legge un dialogo di sistema in italiano.

---

## 5. 🔴 Il revisore è una persona sola, e questa app da soli non fa niente

È il punto che si scopre col rifiuto se non ci si pensa prima.

**D-25** decide che senza partner l'app non fa nulla — *«una partita da soli non è una partita meno bella, non è niente»*. Il revisore Apple è **una persona**: apre l'app, trova «invita il tuo partner», non ha nessuno da invitare, e chiude segnalando che l'app non funziona.

**Serve un account di prova già appaiato**, con dentro dati veri — eventi, foto, luoghi, una partita conclusa — fornito nelle note per la revisione.

> 🔴 **Al 2026-09-14 (3) l'account demo non esiste ancora** — ma è molto meno lavoro di quanto questa sezione dichiarasse: serve **crearlo e riempirlo**, non progettare un modo di entrarci (vedi il riquadro sopra). Corsia **A2** del piano in §7-ter.

~~🔴 **E qui c'è un ostacolo di codice, non di documentazione**: l'accesso è **via codice email**, e un revisore non può ricevere il nostro codice. Va deciso come farlo entrare — tipicamente un account demo con password fissa, esente dall'invio del codice. ⚠️ È una porta d'ingresso che aggira il meccanismo di autenticazione: va progettata guardando il threat model, non aggiunta di fretta la sera prima della sottomissione.~~

> ✅ **Falso dal 2026-08-29, corretto il 2026-09-14 (3) — vedi B-67.** L'accesso **non è** via codice email: è **email e password** (`signInWithPassword` in `app/(pubbliche)/accedi.tsx`). 🔑 *E non è una coincidenza: **D-74** ha cambiato il meccanismo di accesso **proprio per questo motivo**, e quella decisione cita questa sezione come la ragione per cui la password esiste.* Il codice via email è rimasto solo per **recuperare** la password (`recupera.tsx`), e da solo non fa entrare da nessuna parte.
>
> ⚠️ **Quindi nessuna porta dedicata va progettata, e nessuna superficie d'attacco va aggiunta**: l'account demo è un account normale con la sua password, consegnata nelle note per la revisione. Quel che resta da fare è **contenuto**, non architettura — la corsia **A2** di §7-ter dice cosa.

---

## 6. Documentazione e dichiarazioni

- **URL pubblico dell'informativa privacy** — un indirizzo web raggiungibile, non un allegato. ⟳ *Rivisto il 2026-09-10*: i documenti **esistono** (sei, in [`legal/`](legal/), scritti fra il 2026-08-31 e il 2026-09-10 — non più «modelli da adattare») e le **pagine web pure**, generate da `tools/genera-legale.mjs` in `landing/privacy-policy.html` e `landing/cookie-policy.html`. ✅ **E dal 2026-09-10 è pubblicata**: <https://d2ehd6ideoltsh.cloudfront.net/privacy-policy.html> (cookie policy su `/cookie-policy.html`), S3 + CloudFront nell'account di HeleoX — vedi [`deploy-landing.md`](deploy-landing.md). ⬜ Resta senza dominio: agli store basta un indirizzo raggiungibile, e i controlli sul nome (punto 7 qui sotto) non sono ancora stati fatti.
- **Schede store e testi legali sono in inglese** (**D-123**, 2026-09-10), e la voce «schede store in due lingue» qui sotto va riletta con quella decisione in mano: ⚠️ *se le schede escono anche in italiano mentre l'informativa collegata è solo in inglese, l'incoerenza la vede il revisore prima dell'utente.*
- **App Privacy** (Apple) e **Data safety** (Google). ⚠️ Devono corrispondere alla realtà: `threat-model.md` §1 mappa già quali dati esistono ed è la fonte da cui compilarle. Una dichiarazione che non corrisponde è motivo di rimozione **anche dopo** l'approvazione.
- **Classificazione per età**, su entrambi.
- **Schede store in due lingue** — nome, descrizione, screenshot. È la voce più sistematicamente sottostimata del piano.

---

## 7. L'ordine, e perché è questo

> 🔴 **Riscritto il 2026-08-31**: il passo 1 era «D-U-N-S», che con la strada individuo (§2) **non serve più**. Al suo posto entra il **reclutamento dei 12 tester**, che è la nuova voce a tempo lungo — con una differenza importante: il D-U-N-S era **attesa passiva**, i tester sono **lavoro** che si può iniziare subito e che serve comunque al collaudo.

1. 🔴 **Aprire i due account come individuo** (§2.2) — giorni, non settimane. **E far partire subito il reclutamento dei 12 tester** per Google: 14 giorni consecutivi di permanenza non si comprimono, quindi ogni giorno di ritardo qui è un giorno aggiunto in fondo. ⚠️ Sono anche i beta tester del piano marketing e l'unico modo di collaudare l'app (§2.3): **una lista sola, due scopi**.
2. **In parallelo**: ~~la prima Edge Function e~~ ✅ *(deployata il 2026-08-31)* la **prova** della cancellazione account su un account di prova — protocollo in [`legal/catena-cancellazione.md`](legal/catena-cancellazione.md). Sblocca il muro §1.1 con l'infrastruttura che serve altre due volte.
3. **`eas.json` + secret → primo build di sviluppo** → si provano finalmente i permessi e si traducono i dialoghi.
4. **Chiavi dietro Edge Function**, decisione su TMDB, account demo per il revisore.
5. **Pagamenti**: libreria, schermata, ripristino, prodotti sui due store, webhook e diritto a livello di coppia.
6. **Documenti privacy** adattati e pubblicati, dichiarazioni compilate.
7. **Controlli sul nome** — EUIPO classi 9 e 42, disponibilità sui due store, dominio, handle. ⚠️ Vanno fatti **prima di pubblicare ma non per ultimi in pratica**: scoprire che «LifeCouple» è occupato dopo aver prodotto gli screenshot in due lingue costa una settimana di rifacimento.
8. **TestFlight / test interno**, poi sottomissione.

---

## 7-bis. ~~Il piano operativo, aggiornato al 2026-09-10~~ — **superato da §7-ter**

> ⟳ **Superato il 2026-09-14 (3).** Era ancorato a una pubblicazione su **due** store: metà delle sue voci (i 12 tester, Play Billing, FCM, Data safety, l'account Play) sono cadute con **D-132**, e quattro delle sue «tre cose che hanno una coda dietro» sono state fatte fra il 10 e il 14 settembre. **Resta scritto** perché registra cosa si è chiuso e quando — il piano vivo è in **§7-ter**.

> §7 dice **perché** l'ordine è quello. Questa sezione dice **cosa fare**, nello stato in cui il progetto si trova stasera. Le voci barrate qui sotto sono chiuse oggi.

**Cosa è cambiato oggi, e cambia il piano:**

- ✅ **La landing è pubblicata** — gli URL di informativa e cookie policy esistono. Era una voce bloccante.
- ✅ 🔑 **Il muro §1.2 (TMDB) non si applica più.** Nascondendo la lista film (**D-127**) l'app non chiama TMDB e non disegna locandine: non c'è uso commerciale da licenziare. Non è risolto, è **tolto dal percorso** — che per pubblicare è la stessa cosa.
- ✅ **Abbonamento Apple Developer pagato** e **contratto Paid Apps firmato**.
- 🔴 Resta il muro §1.1: la cancellazione account è **costruita e mai provata**.

### Adesso — le tre cose che hanno una coda dietro

1. **Verificare che Paid Apps risulti ATTIVO**, non in attesa. ⚠️ La firma è uno dei tre pezzi: mancano spesso **banca** e **moduli fiscali**, e finché non è attivo gli abbonamenti non si creano né si vendono — quindi RevenueCat resta fermo comunque.
2. **Primo messaggio ai 12 tester di Google.** ~3 settimane non comprimibili (14 giorni di permanenza + fino a 7 di revisione): è la coda più lunga rimasta, e ogni giorno di ritardo si somma in fondo. 🔑 Sono anche gli unici che possono collaudare l'app, che da soli non è collaudabile.
3. **Registrare l'App ID `com.lifecouple.app` e creare la scheda app.** Non dipende da Paid Apps.
4. **Controlli sul nome** — EUIPO classi 9 e 42, disponibilità sui due store, handle. Prima degli screenshot, o si rifanno.

### Poi — la development build, che da sola ne sblocca tre

⚠️ **Prima dei build, i secret su EAS**: le chiavi API non stanno nel repo e non passano da qui.

```bash
npx eas secret:list
```

5. **Android per primo**, perché non chiede nient'altro (il profilo `development` produce un APK installabile direttamente):

```bash
npx eas build --profile development --platform android
```

6. **iOS**: il profilo ha `simulator: false`, quindi è un build per telefono vero e i dispositivi vanno registrati prima.

```bash
npx eas device:create
```

```bash
npx eas build --profile development --platform ios
```

**Con la build in mano si chiudono tre cose ferme da settimane:**

7. I **tre testi dei permessi** (**B-20**) — mai visti da nessuno, e scritti **solo in italiano** mentre l'app è bilingue (D-18). Si guardano e si traducono nello stesso giro.
8. L'**invito a valutare** sullo store (**D-122**), inerte in Expo Go per costruzione.
9. L'**SDK di RevenueCat**, che è nativo e in Expo Go non gira.

### I pagamenti, quando Paid Apps è attivo

10. **Gruppo di abbonamento** e prodotto «Insieme» con Product ID, prezzo, localizzazioni.
11. **In-App Purchase Key** (`.p8`) — 🔴 *si scarica una volta sola*; annotare Key ID e Issuer ID. Più l'**App-Specific Shared Secret**.
12. **RevenueCat**: progetto, app App Store, caricamento della chiave, prodotti → **entitlement** → **offering**.
13. **App Store Server Notifications** (v2, produzione **e** sandbox) con l'URL che dà RevenueCat.
14. La **schermata del listino**, con i tre rifiuti banali già evitati: «Ripristina acquisti», cosa/quanto/per quanto **prima** del pagamento, link a termini e privacy **dentro quella schermata**.
15. 🔴 **Il diritto a livello di coppia.** RevenueCat ragiona per *app user ID*: dirà che una persona ha l'entitlement, mai che «la coppia» ce l'ha. Estenderlo all'altro è logica in Supabase su webhook, e va progettata **insieme** allo scioglimento (D-04) e al rimborso — scritta dopo, è di nuovo un dato conteso da migrare (§3.2).

### Le prove che altrimenti le fa fallire il revisore

16. 🔴 **Cancellazione account end-to-end** su un account di prova — protocollo in [`legal/catena-cancellazione.md`](legal/catena-cancellazione.md). È fra i primi controlli di Apple: non è un rischio, è un esito.
17. 🔴 **Account demo già appaiato** per il revisore, che è **una persona sola** e con questa app da solo non fa niente. ⚠️ L'accesso è via codice email, che non può ricevere: serve una porta dedicata, progettata guardando il threat model.
18. 🔴 **B-62 sullo storage** — `0037` è applicata e non provata: su una coppia sciolta l'autore deve ottenere l'URL firmato della propria foto e non di quella dell'altro.

### Prima della sottomissione

19. 🔴 **Le icone dell'app** — sono ancora il segnaposto Expo su tutte e tre le piattaforme. Il marchio esiste (l'emblema), mancano le misure.
20. 🔴 **Indirizzo e telefono** per il DSA → sbloccano i **termini d'uso**, l'ultimo documento legale non reso.
21. **Screenshot** (dopo il punto 4), moduli **Data safety** e **App Privacy**.
22. **TestFlight / test chiuso**, poi invio.

> 🔴 **E la condizione di §9 resta in piedi**: l'app non è verificata. I 12 tester del punto 2 sono la cosa che risolve insieme il requisito di Google e questa condizione — *è la ragione per cui stanno in cima e non in fondo.*

---

## 7-ter. Il piano operativo, riorganizzato il 2026-09-14 (3)

> §7 dice **perché** l'ordine è quello e resta valido. Questa sezione dice **cosa fare**, nello stato in cui il progetto si trova stasera, e **chi può farlo** — perché metà delle voci rimaste richiede credenziali che l'agente non ha e non deve avere.

🔑 **Il cambiamento che vale più di ogni singola voce**: con **D-132** cade il test chiuso di Google, cioè **la coda più lunga del piano e l'unica che nessun lavoro poteva accelerare**. ⚠️ *Il collo di bottiglia non è più un'attesa: è lavoro nostro.* Non c'è più niente dietro cui aspettare — il che è insieme la buona e la cattiva notizia.

Il lavoro sta in **cinque corsie**. Dentro una corsia l'ordine conta; fra corsie no, si avanza in parallelo.

### Corsia A — I muri: senza, il revisore rifiuta o non si può vendere

| | Cosa | Chi | Dipende da |
|---|---|---|---|
| **A1** | ✅ **FATTA il 2026-09-14 (3)**, e non era una formalità: la cancellazione **non funzionava** — due difetti sovrapposti (**B-68**), corretti dalle migrazioni `0044` e `0045`, applicate. Ora la catena regge su tutti e cinque i controlli, **bucket compreso** | ✅ io | — |
| **A2** | 🔴 **Account demo già appaiato per il revisore**, con dentro contenuti veri: eventi, foto, luoghi, una partita conclusa. ⟳ **Ridimensionata il 2026-09-14 (3)**: non serve nessuna porta dedicata — si entra con email e password (**D-74**), e questa riga diceva il contrario per errore mio, ereditato da §5 (**B-67**). ⚠️ **Ma c'è una conseguenza nuova da decidere**: coi muri della `0042` un revisore senza «Insieme» trova mappa, liste e creatura **chiuse**, e il diritto lo scrive **solo il webhook** | io costruisco, **tu decidi contenuti e diritto** | le foto da usare |
| **A3** | 🔴 **Indirizzo e telefono del professionista (DSA)** — nel brain non esistono da nessuna parte | **solo tu** | — |
| **A4** | 🔴 **I termini d'uso entrano nell'app**: oggi il generatore si rifiuta di costruirli perché portano segnaposto, quindi **non sono resi a nessuno**. 🔑 *Senza, il paywall vende senza contratto* | io | **A3** |
| **A5** | 🔴 **B-66 — le due frasi del recesso** prima del pulsante, più il link ai documenti legali *dentro* il paywall | tu (o l'avvocato) decidi il testo, io lo monto. ⚠️ *Il commento che dichiara l'obbligo già soddisfatto lo correggo subito: è una riga e non richiede nessuno* | **A6**, o una formula tua |
| **A6** | ⏸️ **Rimandata a un secondo momento** — decisione dell'utente del 2026-09-14 (3). ⚠️ *Resta bloccante sulla pubblicazione e resta la coda più lunga*: può imporre una DPIA e cambiare la nomina del DPO (`conformita.md` §9), e due lavori la aspettano — la traduzione dei documenti (§5 di `History.md`) e le due frasi di **B-66** | **solo tu** | — |
| **A7** | 🔴 **Accordi art. 28** da accettare e archiviare: Supabase, Expo, Apple, Google, RevenueCat | **solo tu** | — |

### Corsia B — L'acquisto vero: l'unico anello mai percorso

| | Cosa | Chi |
|---|---|---|
| **B1** | ✅ **RISOLTO il 2026-09-14 (3)**: nessuna delle due cause ipotizzate. Mancavano **le localizzazioni** (gruppo *e* piani) e la **disponibilità era 0 paesi** — un prodotto disponibile in nessun paese non è servibile da nessuna parte. Configurate entrambe, i prezzi arrivano | ✅ fatto |
| **B2** | 🔴 **Un acquisto sandbox fino alla tabella**: `select` su `abbonamento` e `coppia_ha_insieme()` che si accende. 🔑 *Finché non succede, l'impianto è costruito e non dimostrato* | tu + io |
| **B3** | ⚠️ **App Store Server Notifications su Sandbox *e* Production**. *Se il webhook è collegato solo a Production, niente di ciò che provi arriva mai al database — e sembra un difetto del codice* | tu |
| **B4** | ✅ **FATTO il 2026-09-14 (3)**: con una chiave `test_…` l'SDK non si configura in una build non di sviluppo — il paywall dice «non disponibile» invece di vendere nel negozio di prova. ⬜ *Non se ne accorge prima del build: la chiave sta nei secret di EAS* | ✅ io |

### Corsia C — Le notifiche: arrivano, ma non partono da sole

| | Cosa | Chi |
|---|---|---|
| **C1** | ⏸️ **Non si revoca** — decisione dell'utente del 2026-09-14 (3), registrata come **rischio accettato** in `History.md` §5 col suo perimetro: la chiave tocca la superficie StoreKit, non il diritto, che lo scrive solo il webhook. ⚠️ *Da riconsiderare prima della pubblicazione* | — |
| **C2** | ✅ **FATTO il 2026-09-14 (3)** — riferito dall'utente, **non verificato dall'agente**. 🔑 *La prova che vale non è il pannello ma la coda che si svuota*: `"ok": true`, e a coda vuota i campi `lette`/`scartate` mancano invece di valere zero | ✅ tu |
| **C3** | 🔴 **Chiave APNs** (l'unica operazione che la API key non copre): serve alla build firmata | tu |
| **C4** | ⚠️ **Il `comment on function` che dice ancora «B-63»** nel database | io, una riga |

### Corsia D — La verifica: la condizione di §9

| | Cosa | Chi |
|---|---|---|
| **D1** | ✅ **FATTO il 2026-09-14 (3)** — `npm run test:copertura`: 30 tabelle, tutte con RLS, l'unica senza policy è dichiarata per nome. *Guardato fallire su quattro controprove.* ⚠️ Legge le migrazioni, non il catalogo | ✅ io |
| **D2** | ⚠️ **Registrare l'esito** di `test:abbonamento`, `test:webhook`, `test:confine`. 🔑 *Un test il cui esito non è scritto da nessuna parte è un ricordo, non una prova* | io |
| **D3** | ⚠️ **I punti di partite ed elementi di lista**, che hanno la stessa forma di B-64 e nessuna misura | io |
| **D4** | 🔴 **La lista dei controlli sul telefono, voce per voce.** *Il 2026-09-14 è stata percorsa una volta con esito positivo: è una passata complessiva, non una spunta* | tu col telefono, io la preparo |
| **D5** | 🔴 **I tre testi dei permessi** (B-20), mai visti da nessuno e **solo in italiano** su un'app bilingue. *La development build è la prima occasione* | io, appena la build è sul telefono |

### Corsia E — La confezione: ultima, e dipende dalle altre

| | Cosa | Chi | Dipende da |
|---|---|---|---|
| **E1** | **Controlli sul nome** — EUIPO classi 9 e 42, disponibilità, handle. ⚠️ *Prima degli screenshot, o si rifanno* | tu | — |
| **E2** | 🔴 **Pagine legali della landing online**: sono cambiate due volte il 2026-09-14 e non sono state caricate. *L'URL pubblico è obbligatorio* | io preparo, tu confermi il deploy | A4 |
| **E3** | **Screenshot** | io + tu | E1, D5 |
| **E4** | **App Privacy** compilata da `threat-model.md` §1. ⚠️ *Da rifare dopo i due sottosistemi del 2026-09-14*: notifiche e RevenueCat hanno cambiato l'elenco dei destinatari | io | — |
| **E5** | **TestFlight**, poi invio | tu | tutto |

### L'ordine dei prossimi giorni

1. **C1** — cinque minuti, e toglie un'esposizione reale. *Prima di tutto il resto.*
2. **A1** e **D1** — il muro più vicino a cadere e l'unico buco di misura che rende invisibili i guasti futuri.
3. **A3** e **A6** — sono tue e hanno una **coda**: chiederle tardi le fa costare settimane, non giorni.
4. **B1 → B2** — finché l'acquisto vero non è percorso, i pagamenti sono costruiti e non dimostrati.
5. **A2** — la voce che scivola sempre in fondo, e che fa rifiutare l'app.

### Cosa NON è in questo piano, e perché

- ⬜ **Android in ogni sua forma** (D-132). Torna solo se torna Android, e con esso i 12 tester.
- ⏸️ **La lista Film e TMDB** (D-127): spenta. *Riaccenderla rimette il muro §1.2 esattamente dov'era.*
- ⏸️ **Il ciclo mestruale** (D-07, P-02): dopo la prima pubblicazione, per non sommare gli errori in un lotto solo.

---

## 8. Tempi

⚠️ **Sono stime, non misure**, e non vanno riportate in `Projects/elenco-progetti.md` come date: quel file vuole date vere.

| | |
|---|---|
| Lavoro di pubblicazione | ~10–15 giorni-uomo |
| + pagamenti (libreria, schermata, ripristino, prodotti) | +3–5 |
| + diritto a livello di coppia (webhook, funzione, colonna, RLS) | +2–4 |
| + accordi Paid Apps | ore di lavoro, **giorni di attesa** |

~~**Da 2026-08-29 alla pubblicazione su entrambi gli store: 7–11 settimane**, assumendo D-U-N-S che non si impunta e nessun rifiuto grave.~~

> 🔴 **Ricalcolato il 2026-08-31 con la strada individuo (§2).** Il totale non cambia molto, ma **cambia da cosa dipende**, ed è quello che conta per decidere cosa fare per primo.

| Voce | Prima (organizzazione) | **Ora (individuo)** |
|---|---|---|
| D-U-N-S | 1–2 settimane di attesa | ✅ **eliminato** |
| Iscrizione agli account | dopo il D-U-N-S | **giorni**, si parte subito |
| Test chiuso Google | non richiesto | 🔴 **+3 settimane** (14 giorni di permanenza + fino a 7 di revisione) |
| Lavoro di pubblicazione | ~10–15 giorni-uomo | invariato |
| + pagamenti | +3–5 | invariato |
| + diritto a livello di coppia | +2–4 | invariato |
| Accordi Paid Apps | ore di lavoro, **giorni di attesa** | invariato |
| 🔴 **Licenza TMDB** | non contata | **attesa ignota** — è ora la sola coda fuori dal nostro controllo |

~~**Da 2026-08-31 alla pubblicazione su entrambi gli store: 6–10 settimane.**~~ Su **Apple** si può arrivare prima — il test chiuso riguarda solo Google, quindi **le due pubblicazioni possono sfasarsi**, ed è accettabile.

> 🔴 **Da ricalcolare, e qui NON si sostituisce con un numero (2026-09-14 (3)).** Quella stima era ancorata al **test chiuso di Google**, che con **D-132** non esiste più: la sua voce più grossa è sparita, quindi il totale non è «un po' meno» — **è un'altra cosa**, e scrivere un numero nuovo ora sarebbe una stima inventata su un piano riorganizzato lo stesso giorno (`CLAUDE.md` §6: non si riempie con una stima ciò che non si sa).
>
> **Da cosa dipende adesso**, che è l'informazione utile per decidere:
>
> | Voce | Natura |
> |---|---|
> | Corsie A, B, D del piano §7-ter | **lavoro nostro** — comprimibile lavorando di più |
> | Revisione dell'avvocato (**A6**) | **coda esterna**, e si avvia chiedendo: è la prima da far partire |
> | Dati DSA (**A3**) | dipende **solo da te**, e blocca i termini d'uso |
> | La revisione di Apple | coda esterna, una sola, e non più due store sfasati |
> | 🔴 **Quanta verifica si vuole fare prima** (§9) | **è una decisione, non una durata**: è la variabile che sposta di più il totale |
>
> 🔑 *L'ultima riga è quella che decide davvero.* Il resto sono giorni-uomo prevedibili; **quanto a fondo si collauda prima di pubblicare** è una scelta, e cambia il calendario più di tutte le altre voci messe insieme.

🔑 **Il collo di bottiglia si è spostato, e in meglio.** Prima era un'**attesa passiva** (il D-U-N-S: nessun lavoro lo accelerava). Ora è **lavoro coordinabile** — trovare 12 tester — che per giunta produce due risultati insieme: soddisfa Google e collauda l'app, che senza due persone non è collaudabile affatto.

⚠️ **Restano fuori dal nostro controllo due sole cose**: la **licenza TMDB** e le **revisioni** degli store. Sono le uniche che non accelerano lavorando di più.

## 9. 🔴 E una condizione che viene prima di tutto il piano

**L'app non è verificata.** Al 2026-08-29 sei difetti su sette dei giochi sono corretti e mai riprovati, e le Liste hanno decine di punti mai visti girare.

La prima partita vera ha fatto uscire **sette difetti in un colpo** (B-30 → B-36), e non c'è ragione di credere che le Liste si comportino diversamente. Pubblicare prima di aver esaurito quelle sorprese significa scoprirle con le recensioni a una stella — e su un'app a pagamento, con le richieste di rimborso.

> ⟳ **Stato al 2026-09-14 (3), e si è mosso in meglio.** I difetti dei giochi sono stati ripresi, l'app è stata percorsa **a mano su un iPhone** e non è saltato fuori niente; le notifiche sono arrivate davvero, i pagamenti hanno un impianto intero e le RLS hanno **89 asserzioni verdi**. ⚠️ **Ma la condizione non è caduta**: quella passata è stata *una* passata con esito positivo, **non una spunta voce per voce** — e tre cose non possono esserlo per costruzione (la posizione condivisa vuole due telefoni, B-50 distingue dito e bottone solo su iOS, i punti di partite e liste non hanno misura). La corsia **D** di §7-ter è la traduzione operativa di questa sezione.

*Il piano qui sopra dice come si pubblica. Non dice che sia il momento di farlo.*
