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

### 1.1 ⟳ La cancellazione dell'account — costruita il 2026-08-31, **provata il 2026-09-14**

> ⟳ **Aggiornato il 2026-09-14 (3).** Il titolo diceva *«non esiste»* e ha continuato a dirlo per due settimane dopo che esisteva: la Edge Function [`cancella-account`](../supabase/functions/cancella-account/index.ts) è del 2026-08-31, `ACTIVE`, invocata da Impostazioni. 🔴 **Ma il muro non è caduto: si è spostato.** Quel che manca è la **prova end-to-end** — la tabella «Esito della prova» in [`legal/catena-cancellazione.md`](legal/catena-cancellazione.md) è vuota. ⚠️ *L'informativa §7 promette agli utenti una cancellazione «immediata e definitiva»: è la dichiarazione più impegnativa dell'intero corpo documentale, ed è l'unica che poggia su codice mai eseguito.* Tutto ciò che segue resta valido come racconto del perché la voce esiste.

> ✅ **E il muro è caduto il 2026-09-14 — ma questa sezione ha continuato a dire di no per tre giorni.** La tabella «Esito della prova» **non è vuota**: l'ha riempita `npm run test:cancellazione` lo stesso giorno in cui il riquadro qui sopra la dichiarava vuota, e il commit è `bf46342`. La prova end-to-end c'è su tutte e cinque le righe — accesso rifiutato, contenuti a zero, **bucket contato direttamente su `storage.objects`** invece che dedotto da un rifiuto (B-03), coppia sciolta, contenuti del partner conservati (D-04) — e al primo giro **ha trovato B-68**, cioè i due difetti per cui la cancellazione non funzionava affatto. 🔑 *Trovato scrivendo §7-quater il 2026-09-17: è la **quarta** volta in tre giorni che un documento dichiara «da fare» una cosa fatta altrove*, dopo B-78, B-79 e B-85. ⚠️ **E stavolta la riga falsa stava in §1, cioè in una delle due voci che questo documento chiama «muri»**: chi avesse letto solo questa sezione avrebbe rinviato la pubblicazione per un blocco che non esiste più.

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

## 2. Gli account — riscritta il 2026-08-31, poi di nuovo il 2026-09-15

> ⟳ **Due riscritture, e le versioni superate sono conservate** (§2.1-bis e §2.4): in questo progetto una decisione superata non si cancella, perché il ragionamento che conteneva di solito resta valido e cambia solo il fatto su cui poggiava.
>
> 🔴 **2026-09-15 (D-136) — cambia la persona che pubblica**: non più Fausto Busato ma **Samuele Busato**, persona fisica. ⚠️ *Il venditore perde in un colpo partita IVA, sede e PEC* — cioè proprio i dati che il DSA pretende. Dettaglio e domande aperte in **§2.1**.
>
> **2026-08-31 — cambiava il tipo di account**: la sezione diceva «va scelto organizzazione, il prezzo è il D-U-N-S» ed era sbagliata, perché per una ditta individuale il percorso «organizzazione» su Apple **non è aperto**. Quella conclusione regge ancora.

### 2.1 La decisione: si pubblica come INDIVIDUO, a nome **Samuele Busato** — RISCRITTA il 2026-09-15

**Decisa dall'utente il 2026-09-15 (D-136)**: l'app esce a nome **Samuele Busato**, persona fisica. La versione precedente — *«esce a nome Fausto Busato»*, decisa il 2026-08-31 con **D-81** — è conservata in **§2.1-bis**.

🔑 **La conclusione «individuo e non organizzazione» non cambia, e anzi si rafforza.** Apple ha due percorsi — *Individual / Sole Proprietor* e *Organization* — e quello «Organization» è per **entità legali separate** (S.r.l., S.p.A.), provate dal D-U-N-S. Una persona fisica non ha nemmeno quella porta: *l'unico percorso è Individual*. Cambiano i **dati**, non il tipo di account.

⚠️ **Ma cambia il soggetto giuridico del prodotto, e questo sì che pesa.** Venditore verso lo store, controparte contrattuale di chi paga e **titolare del trattamento** sono lo stesso soggetto. Finora era `F.R. di Busato Fausto` — P.IVA `01878620358`, REA `RE 232527`, Novellara (RE) — scritto in [`legal/registro-trattamenti.md`](legal/registro-trattamenti.md) e in [`legal/informativa-privacy.md`](legal/informativa-privacy.md) §1. **Tutti quei documenti dichiarano ora un titolare sbagliato**, comprese le due pagine già online su CloudFront.

🔴 **Tre domande che la decisione apre e non chiude** — e le prime due vengono **prima** dei termini d'uso (A4):

| # | Domanda | A chi |
|---|---|---|
| **Q1** | **Partita IVA a nome di Samuele, oppure l'app rinuncia a vendere?** Vendere abbonamenti in modo continuativo è attività commerciale: *«privato senza partita IVA»* non è una terza strada, e un'app senza acquisti è l'unica alternativa reale | **commercialista** |
| **Q2** | **Di chi è l'infrastruttura?** Progetto Supabase, dominio `lifecouple.heleox.it` ed email dei diritti `info@heleox.it` sono dell'**azienda**. Titolare e mezzi finirebbero su due soggetti diversi — e cambia **chi firma gli accordi art. 28** di A7 | utente, poi commercialista |
| **Q3** | Indirizzo e telefono da esporre (**A3**): ora sono di Samuele, non la sede di Novellara | utente |

> ⚠️ *Scrivere i termini d'uso prima di Q1 e Q2 significherebbe dichiarare una controparte contrattuale che potrebbe non esistere* — la stessa forma di B-66, un documento che descrive uno stato che nessuno ha verificato.

### 2.1-bis ~~La versione superata: «esce a nome Fausto Busato»~~ (2026-08-31, D-81)

Conservata per la stessa ragione di §2.4: il ragionamento resta utile, cambia il fatto su cui poggiava.

Diceva: l'app esce a nome **Fausto Busato**, non a nome F.R. di Busato Fausto — e per quella forma d'impresa non era nemmeno una scelta libera, perché Apple stabilisce che chi è **ditta individuale / impresa unipersonale si iscrive come individuo**, col proprio nome legale come venditore.

⚠️ **Una ditta individuale non è un soggetto distinto**: fiscalmente e giuridicamente, `F.R. di Busato Fausto` **è** `Fausto Busato`. È anche il motivo per cui D&B elenca le *sole proprietorships* fra le forme che non censisce — e quindi perché la ricerca del D-U-N-S sarebbe stata verosimilmente un vicolo cieco.

🔑 **Cosa di questo resta vero anche adesso**: il ragionamento su individuo-vs-organizzazione, che vale a maggior ragione per una persona fisica. **Cosa cade**: che il venditore avesse già una partita IVA, una sede e una PEC — cioè esattamente i dati che il DSA chiede, e che ora **non esistono più nel brain** e vanno prodotti da zero.

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
  - ✅ **Il testo esiste dal 2026-09-15 (3)**: [`scheda-store.md`](scheda-store.md), con i limiti dei campi imposti da `npm run test:scheda`. 🔴 Restano gli **screenshot**.
  - 🔴 **Ed è scritto in DUE lingue, il che contraddice D-123 e la riga qui sopra — la decisione è dell'utente e non è ancora presa.** L'agente ha prodotto entrambe le versioni perché l'app è bilingue (D-18: la lingua la decide il telefono) e il mercato è l'Italia; ma la riga sopra avverte **esattamente** contro questa combinazione. Le tre strade:

| | Cosa si fa | Cosa costa |
|---|---|---|
| **a** | Si pubblica **solo l'inglese**, coerente con D-123 | Un utente italiano trova una scheda in inglese per un'app la cui interfaccia è in italiano. *Costa conversione, non rischio* |
| **b** | Si pubblicano **entrambe** e si accetta l'incoerenza | ⚠️ L'incoerenza **esiste già**: l'interfaccia è in italiano e i documenti legali no. La scheda italiana la rende più visibile, non la crea |
| **c** | Si pubblicano entrambe **e si traducono i documenti** | È il rimedio vero, ma **aspetta A6**: tradurre prima della revisione dell'avvocato significa tradurre due volte (§5 di `History.md`) |

  > 🔑 **Il punto da non confondere**: la scheda in italiano non è ciò che rende contestabile l'informativa in inglese — quella è già il rischio accettato del 2026-09-09, dichiarato e firmato. *Cambia solo quanto è facile accorgersene.*

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

## 7-ter. ~~Il piano operativo, riorganizzato il 2026-09-14 (3)~~ — **superato da §7-quater**

> ⟳ **Superato il 2026-09-17.** Era organizzato in **cinque corsie parallele**, ed era la forma giusta finché commercialista e avvocato tenevano aperte code che scorrevano da sole. **D-141 le ha chiuse tutte**: senza code da far scorrere in parallelo, le corsie descrivono un lavoro che ormai è una **fila**. **Resta scritto** perché registra cosa si è chiuso e quando — il piano vivo è in **§7-quater**.

> §7 dice **perché** l'ordine è quello e resta valido. Questa sezione dice **cosa fare**, nello stato in cui il progetto si trova stasera, e **chi può farlo** — perché metà delle voci rimaste richiede credenziali che l'agente non ha e non deve avere.

🔑 **Il cambiamento che vale più di ogni singola voce**: con **D-132** cade il test chiuso di Google, cioè **la coda più lunga del piano e l'unica che nessun lavoro poteva accelerare**. ⚠️ *Il collo di bottiglia non è più un'attesa: è lavoro nostro.* Non c'è più niente dietro cui aspettare — il che è insieme la buona e la cattiva notizia.

Il lavoro sta in **cinque corsie**. Dentro una corsia l'ordine conta; fra corsie no, si avanza in parallelo.

### Corsia A — I muri: senza, il revisore rifiuta o non si può vendere

| | Cosa | Chi | Dipende da |
|---|---|---|---|
| **A1** | ✅ **FATTA il 2026-09-14 (3)**, e non era una formalità: la cancellazione **non funzionava** — due difetti sovrapposti (**B-68**), corretti dalle migrazioni `0044` e `0045`, applicate. Ora la catena regge su tutti e cinque i controlli, **bucket compreso** | ✅ io | — |
| **A2** | ✅ **FATTO il 2026-09-15**: `tools/semina-demo.mjs` crea la coppia appaiata e la riempie — 4 eventi, 4 luoghi, 2 voci, 4 foto, 1 partita conclusa. Credenziali in `.env.demo.local`, note per Apple stampate dallo script. ⟳ **Le foto non sono più segnaposto di 1 px** (2026-09-15 (3)): [`tools/foto-demo.mjs`](../tools/foto-demo.mjs) genera **quattro illustrazioni 1080×1440**, una per evento. ⚠️ *Quattro riquadri vuoti in un'app che vende la cartella condivisa di foto sono un rifiuto per **App Completeness***, e lo si sarebbe scoperto dal rifiuto. ⬜ Restano meglio 3-4 **foto vere** caricate dall'app. ✅ **E dal 2026-09-15 (3) lo stato della demo è misurato**, non guardato: `npm run test:demo` verifica coppia, contenuto, foto a piena risoluzione e assenza di «Insieme». 🔑 *Al primo giro ha trovato **B-87***: il seminatore stampava `✅` su due cose mai riuscite — `insieme_dal` e le voci di lista | ✅ io | — |
| **A8** | ⏹️ **SALTATA il 2026-09-15 (3) — D-141.** L'utente rinuncia al passaggio dal commercialista. ⚠️ *La domanda resta senza risposta, non risolta*: il soggetto è una persona fisica **senza partita IVA** e il servizio ha piani a pagamento. Rischio accettato in `History.md` §5 | ⏹️ decisa | — |
| **A9** | ✅ **CHIUSA il 2026-09-15, poche ore dopo essere nata.** L'utente: *«è tutta roba mia — il software è stato progettato e sviluppato da me, l'infrastruttura è mia»*. Titolare e mezzi **coincidono**, e **A7 lo firma lui**. ⚠️ *Resta solo la coda della coda*, ed è **A11**: le due superfici pubbliche portano il marchio di un altro prodotto | ✅ | — |
| **A11** | ✅ **RIDOTTA a una riga il 2026-09-15**: `heleox.it` è **intestato a Samuele Busato** come persona fisica (riferito dall'utente). Quindi dominio ed email sono già del titolare e **non c'è niente da cambiare**. ⚠️ *Resta però che l'informativa §1 spiega `info@heleox.it` con «è l'indirizzo di un altro prodotto della stessa azienda — coerente sul piano giuridico»*, e quella frase ora è **falsa**: va corretta dentro **A10**, non separatamente | io, dentro A10 | **A8** |
| **A10** | ✅ **FATTA il 2026-09-15, deploy compreso.** Titolare cambiato in **Samuele Busato, persona fisica** su: informativa (`en/privacy-policy.md` + italiana), cookie policy (entrambe), **registro dei trattamenti**, termini d'uso (entrambi), il piè di pagina di `tools/genera-legale.mjs` e `landing/index.html`. Derivati rigenerati; `test:legale` verde, `tsc` 0. **Pubblicata coi tre comandi del runbook**, invalidazione `IAETTFLOM8WPY62T3N5D0W9OFH`. ✅ *Verificato in linea, non dedotto*: le tre pagine rispondono `200`, nominano Samuele Busato e **non contengono più P.IVA né il soggetto precedente** | ✅ io | — |
| **A3** | ⏹️ **CHIUSA PER RINUNCIA il 2026-09-15 (3) — D-141.** Indirizzo e telefono **non verranno inseriti**, e i due segnaposto sono stati **rimossi** dai termini (`terms-1.3`) invece che riempiti. ⚠️ **Togliere il segnaposto non toglie l'obbligo: toglie il promemoria.** Il DSA continua a chiederli e Apple li raccoglie come *trader*, esponendoli sulla **scheda pubblica** dell'app. 🔑 *La conformità non cambia; cambia dove si scopre il problema* — ora è il modulo, non il documento. Rischio accettato in `History.md` §5. ⬜ *Se un giorno si riapre*: non serve l'abitazione, basta una domiciliazione e un numero dedicato | ⏹️ decisa | — |
| **A4** | ✅ **RESI il 2026-09-15 (3) SENZA SEGNAPOSTO** (`terms-1.3`). Soggetto nuovo, venditore chiuso (Apple), Google rimosso, §7-§8 rifatte contro `0042` (**B-69**), e tolte **due righe diventate false**: quella che prometteva la revisione di un avvocato, e quella che dichiarava i termini non raggiungibili dalla registrazione (**B-86**). ✅ **Verificato misurando**: **zero** occorrenze di segnaposto in `lib/legale/testi.ts` e nelle tre pagine, `tsc` **0**, `test:legale` **0**. ✅ **PUBBLICATE il 2026-09-15 (3)**, quattro comandi del runbook più l'invalidazione. **Verificato in linea**: `terms-of-use.html` risponde `200` a **`terms-1.3`**, zero segnaposto, e sparite entrambe le frasi false; `apple-app-site-association` torna `application/json` | ✅ io | — |
| **A5** | ⏹️ **CHIUSA COM'È il 2026-09-15 (3) — D-141.** Le due frasi restano **testo sopra il pulsante**, e i link ai documenti sono nel paywall. ⚠️ *La scelta fra testo e casella da spuntare non sarà validata da nessuno*: l'avvocato è saltato. Rischio accettato in `History.md` §5 | ⏹️ decisa | — |
| **A6** | ⏹️ **SALTATA il 2026-09-15 (3) — D-141.** Non rimandata: **saltata**. ⚠️ *Restano senza risposta professionale* la forma del recesso (**A5**), la domanda sull'**art. 9** (`conformita.md` §9) e se sia dovuta una **DPIA**. Rischio accettato in `History.md` §5. ⟳ 🔑 **Ma sblocca le traduzioni**: cadeva con essa l'argomento «tradurre prima della revisione significa tradurre due volte», che era l'unica ragione per cui i documenti restavano in solo inglese | ⏹️ decisa | — |
| **A7** | 🔴 **Accordi art. 28** da accettare e archiviare: Supabase, Expo, Apple, Google, RevenueCat — ⟳ **e AWS, sesto, aggiunto il 2026-09-15 (5)**: ospita le pagine pubbliche dal 2026-09-10 e non era mai stato contato. Vedi `legal/registro-trattamenti.md` Parte C | **solo tu** | — |

### Corsia B — L'acquisto vero: l'unico anello mai percorso

| | Cosa | Chi |
|---|---|---|
| **B1** | ✅ **RISOLTO il 2026-09-14 (3)**: nessuna delle due cause ipotizzate. Mancavano **le localizzazioni** (gruppo *e* piani) e la **disponibilità era 0 paesi** — un prodotto disponibile in nessun paese non è servibile da nessuna parte. Configurate entrambe, i prezzi arrivano | ✅ fatto |
| **B2** | ✅ **FATTA il 2026-09-15 — l'anello mai percorso è percorso.** La prova è una riga scritta da un evento **non generato da noi**: `prodotto: …insieme.mensile` (i nostri strumenti concedono sempre *annuale*), `evento_il 09:35:11 → aggiornato_il 09:35:12`, un secondo dall'acquisto al database. I muri sono caduti **da soli**. 🔑 *Sei anelli insieme per la prima volta*: Apple → Server Notifications (B3) → RevenueCat → Edge Function → `abbonamento` → `ho_insieme()` → schermo. ⬜ Visto anche il **rinnovo** (ogni 5 minuti in sandbox). ⚠️ *Per arrivarci sono usciti cinque difetti* — **B-71 → B-75**, il più grave dei quali teneva chiusi i muri **a chiunque non avesse una coppia** | ✅ |
| **B3** | ✅ **FATTA il 2026-09-15 — ed erano due cose, non una.** 🔑 *Questa voce ne comprimeva due in una riga, e la metà documentata era già a posto*: il webhook **RevenueCat → la nostra funzione** era già su `Both Production and Sandbox`. Mancava del tutto l'anello **Apple → RevenueCat**, che `pagamenti.md` non descriveva: entrambi i campi di *«Notifiche del server dell'App Store»* erano vuoti, e RevenueCat lo diceva accanto al proprio URL — **«No notifications received»**. Ora produzione e sandbox puntano all'endpoint RevenueCat. Procedura scritta in `pagamenti.md` **§3.4**, che prima non esisteva. ⚠️ *La conferma vera arriva da B2*: Apple manda notifiche sugli eventi, non al salvataggio | ✅ |
| **B4** | ✅ **FATTO il 2026-09-14 (3)**: con una chiave `test_…` l'SDK non si configura in una build non di sviluppo — il paywall dice «non disponibile» invece di vendere nel negozio di prova. ⬜ *Non se ne accorge prima del build: la chiave sta nei secret di EAS* | ✅ io |

### Corsia C — Le notifiche: arrivano, ma non partono da sole

| | Cosa | Chi |
|---|---|---|
| **C1** | ⏸️ **Non si revoca** — decisione dell'utente del 2026-09-14 (3), registrata come **rischio accettato** in `History.md` §5 col suo perimetro: la chiave tocca la superficie StoreKit, non il diritto, che lo scrive solo il webhook. ⚠️ *Da riconsiderare prima della pubblicazione* | — |
| **C2** | ✅ **FATTO il 2026-09-14 (3)** — riferito dall'utente, **non verificato dall'agente**. 🔑 *La prova che vale non è il pannello ma la coda che si svuota*: `"ok": true`, e a coda vuota i campi `lette`/`scartate` mancano invece di valere zero | ✅ tu |
| **C3** | ✅ **FATTA il 2026-09-15.** Chiave **`LifeCouple APNs`** creata su Apple — Key ID **`T9YBQQ859L`**, Team ID **`8C8FJLJBB8`**, `Environment: Sandbox & Production`, `Key Restriction: Team Scoped (All Topics)`. Caricata su EAS e assegnata al progetto *(riferito dall'utente, non verificato dall'agente)*. ✅ **La capability sull'App ID era già attiva, verificata di persona**: l'aveva accesa EAS con la development build del 14. 🔴 **Il default di Apple era `Sandbox`, e non si cambia dopo il salvataggio** — salvandolo così le notifiche avrebbero funzionato in TestFlight e sarebbero morte **alla pubblicazione**, in silenzio e senza possibilità di correggere la chiave | ✅ |
| **C4** | ✅ **ERA GIÀ FATTA, e questa riga era stale.** La migrazione `0043` si dichiara *«APPLICATA il 2026-09-14 (4) con `supabase db query` … Verificata: il commento comincia con B-64»*. 🔑 *Questa tabella è stata scritta nella sessione (3), la migrazione applicata nella (4)*: il piano non è stato riaperto, non il contrario. ⚠️ **Non verificata in prima persona**: la CLI `supabase` non è installata su questo dispositivo e PostgREST non espone `obj_description` — resta la parola del registro, che qui è di chi l'ha eseguita | ✅ |

### Corsia D — La verifica: la condizione di §9

| | Cosa | Chi |
|---|---|---|
| **D1** | ✅ **FATTO il 2026-09-14 (3)** — `npm run test:copertura`: 30 tabelle, tutte con RLS, l'unica senza policy è dichiarata per nome. *Guardato fallire su quattro controprove.* ⚠️ Legge le migrazioni, non il catalogo | ✅ io |
| **D2** | ✅ **FATTA il 2026-09-15 — eseguiti, non ricordati.** `test:abbonamento` **4/4**, `test:webhook` **13/13** (compresi: evento doppio riconosciuto, evento più vecchio che non riporta indietro lo stato, disdetta che non toglie e rimborso che toglie subito), `test:confine` **7/7**. Esiti per esteso in `History.md`, 2026-09-15 | ✅ io |
| **D3** | ✅ **MISURATI il 2026-09-15, e hanno trovato B-70.** `tests/punti.mjs` esteso: elementi di lista e partite ora hanno misura diretta. **La stessa forma era anche lo stesso buco** — un elemento creato già «fatto» vale **0 punti invece di 10**. 🔑 *Una partita nata già «conclusa» vale 0 ed è **giusto**: premiarla darebbe punti per una partita mai giocata* — l'asserzione è rovesciata apposta. ✅ **`0046` applicata dall'utente il 2026-09-15**: `test:punti` è passato da 9/10 a **10/10**, e le due guardie tengono | ✅ |
| **D4** | ⏹️ **CHIUSA PER DICHIARAZIONE il 2026-09-15 (3) — D-140.** L'utente: *«le funzionalità dell'applicazione possiamo darle come testate»*. La lista **non verrà percorsa**, e con essa cade **§9**. ⚠️ *Cosa si accetta, per nome*: paywall rifatto, **B-80** e **B-81** non sono mai stati visti girare su un telefono, e B-80 si prova solo rallentando apposta il webhook. La lista resta scritta — [`verifica-sul-telefono.md`](verifica-sul-telefono.md), 18 voci — perché **serve dopo la pubblicazione** quanto prima. 🔑 *Chiusa, non fatta: la differenza sta in `History.md` 2026-09-15 (11) e deve restare leggibile* | ⏹️ decisa |
| **D5** | ✅ **FATTO il 2026-09-15**: `locales/it.json` e `locales/en.json`, agganciati da `app.json`. ⬜ *Vederli richiede una build nuova* — la parte scrivibile di B-20 è chiusa | ✅ io |

### Corsia E — La confezione: ultima, e dipende dalle altre

| | Cosa | Chi | Dipende da |
|---|---|---|---|
| **E1** | ✅ **FATTO il 2026-09-15 (3), e misurato.** App Store IT/US/GB: **nessuna app** con questo nome. TMview, tutti gli uffici: **un solo marchio al mondo** — `LIFECOUPLE`, USPTO `88492568`, **classe 9**, **«Terminato»**; in due parole, zero. ✅ **In UE non esiste nulla**, né in classe 9 né in 42. ⚠️ *Quel marchio decaduto copriva app per coppie*: qualcuno c'è già passato e l'ha lasciata cadere. ⚠️ **Non è un parere di disponibilità**: TMview dichiara di non essere un registro ufficiale, e i marchi **simili** non sono stati cercati — serve un avvocato solo se si vuole **depositare**, non per pubblicare. ⬜ Restano gli **handle** social | ✅ io · ⬜ handle: tu | — |
| **E2** | ✅ **FATTO il 2026-09-15**: `privacy-policy.html` e `cookie-policy.html` sono online su CloudFront, HTTP 200 verificato, e la versione pubblicata nomina RevenueCat | ✅ io | — |
| **E3** | ⟳ **METÀ FATTA il 2026-09-15 (3)**: [`scheda-store.md`](scheda-store.md) — sottotitolo, testo promozionale, parole chiave, descrizione, categorie, età e note per la revisione, **nelle due lingue**. Era l'unica cosa richiesta dal modulo d'invio che **non esisteva da nessuna parte** (§6: *«la voce più sistematicamente sottostimata del piano»*). I limiti dei campi sono **imposti** da `npm run test:scheda`, non ricordati — e al primo giro ha trovato due difetti. 🔴 **Gli screenshot sono stati tentati il 2026-09-15 (3) e vanno rifatti.** ✅ *La misura è risolta*: `1206 × 2622 PNG` nativi (iPhone 16 Pro), arrivati da iCloud — il primo giro era passato da WhatsApp e li aveva ridotti a `942 × 2048 JPEG`. 🔴 *Il contenuto no*: **tre schermate su sei mostrano stati vuoti** («Still empty», «Nothing ahead», «Never played»), c'è un **pulsante di sistema che galleggia in tutte e sei** (AssistiveTouch), la batteria è al **18% in rosso**, e tre scatti sono presi **a metà animazione**. ⚠️ **E l'app sul telefono è in inglese**: se la scheda esce anche in italiano servono **due set** — è il costo in lavoro della decisione di §6 | ✅ testo mio · 🔴 scatti tuoi | E1 ✅, D5 ✅ |
| **E4** | ⟳ **SCRITTA il 2026-09-15**: [`docs/app-privacy.md`](app-privacy.md) — dieci righe pronte da ricopiare, con **Tracking = No** ovunque (nessun SDK pubblicitario, di analytics o di diagnostica nel `package.json`), e le esclusioni motivate una per una. Rifatta sui destinatari nuovi: token del dispositivo (Expo) e cronologia acquisti (RevenueCat). ✅ **COMPLETA dal 2026-09-15 (3)**: l'ultima riga, *«Sensitive Info»*, è **No**, e non per opinione ma per una proprietà dello schema — **nessuna tabella raccoglie genere, sesso o pronomi**, e l'unico `genere` che esiste è il *tipo di un luogo* (`0016`). La deduzione descritta da `conformita.md` §9 **richiede un dato che il sistema non possiede**. 🔴 *E una correzione*: questa riga e quella dell'**art. 9** non sono «la stessa domanda in due sedi» — Apple chiede *cosa raccogli*, l'art. 9 riguarda il *trattamento che rivela*, che comprende l'inferenza. La seconda resta aperta, come rischio accettato | ✅ io | — |
| **E5** | ⟳ **BUILD AVVIATA dall'utente il 2026-09-15 (3), alle 18:51** — `94dd41b7`, profilo `production`, distribuzione **`store`**. 🔑 **Va lanciata da un terminale interattivo e questo non cambierà**: `--non-interactive` si ferma su *«Distribution Certificate is not validated for non-interactive builds»*, perché la distribuzione App Store impone a EAS di validare il certificato **con Apple**, e quella validazione chiede **Apple ID e 2FA** — le credenziali che l'agente non ha e non deve avere. ✅ Riusato il certificato esistente (`L48VT5A4PT`, team `8C8FJLJBB8`, scade 2027-09-14) e generato il profilo **App Store**, che è nuovo: il precedente era **ad-hoc** e vincolava gli UDID. ✅ **Build `finished`**, con l'`.ipa` firmato per lo store. ✅ **`ascAppId` = `6811948208` scritto in `eas.json`** (`submit.production.ios`): non era registrato da nessuna parte, serve a ogni invio, e ora non blocca più. 🔴 **Resta però un secondo muro interattivo**: *«App Store Connect API Keys cannot be set up in --non-interactive mode»* — EAS non ha una chiave API di ASC per questo progetto. 🔑 *Stesso confine della build: le credenziali Apple sono dell'utente.* ⬜ **Configurata una volta in interattivo, i caricamenti successivi tornano automatici** | **solo tu** la prima volta | — |

### L'ordine dei prossimi giorni

> ⟳ **Riscritto il 2026-09-15.** L'ordine precedente apriva con C1, A1, D1, B1 e A2: tutte chiuse o decise fra il 14 e il 15. **E D-136 ha messo davanti a tutto una domanda che prima non esisteva.**

1. **A8** — *il commercialista, e prima di ogni altra cosa.* Con quale forma si vende. ⚠️ Da qui discendono **A3** (quale indirizzo esiste), **A4** (chi è la controparte nei termini) e **A10** (chi è il titolare nei documenti): finché è aperta, scriverne uno significa scrivere un soggetto che potrebbe non esistere.
2. **A6** — l'avvocato. È tua e ha una **coda**: chiederla tardi la fa costare settimane, non giorni, ed è ancora la coda più lunga del piano. *(A9 è nata e morta il 2026-09-15: l'infrastruttura è dell'utente, e questo la chiude.)*
3. **A3**, poi **A10** e **A4** — appena A8 dà una risposta, questi tre si sbloccano in fila e sono per lo più lavoro mio.
4. ✅ ~~**B2 → B3** — l'acquisto vero~~ **fatti entrambi il 2026-09-15.** *L'impianto dei pagamenti non è più costruito-e-non-dimostrato: è percorso.*
5. ⏹️ ~~**D4** — la verifica voce per voce sul telefono~~ **chiusa per dichiarazione il 2026-09-15 (3)** (D-140), e con essa §9.

> ⟳ **Riscritto una seconda volta il 2026-09-15 (3), e cambia la natura di ciò che resta.** Con D4 chiusa, E1 fatto e il testo della scheda scritto, **non c'è più nessuna voce che dipenda da lavoro mio o da un telefono**, tranne gli screenshot.
>
> ⟳ **Riscritto una terza volta il 2026-09-15 (3), dopo D-141.** Con commercialista e avvocato **saltati**, la corsia A si chiude per intero: **A3, A5, A6 e A8 sono decise**, A4 è resa, e **E4 è completa**. *Non resta nessuna coda esterna in tutto il piano.*
>
> 🔑 **Tutto ciò che separa dal pulsante «Invia» è ora lavoro, e nessuna attesa.**
>
> | | Cosa | Chi | Costo |
> |---|---|---|---|
> | ✅ | ~~Deploy della landing~~ — **fatto e verificato in linea il 2026-09-15 (3)**: `terms-1.3` è online | ✅ io | — |
> | 1 | **A7** — sei accordi art. 28 da accettare e archiviare | solo tu | minuti |
> | 2 | **C1** — la chiave esposta | solo tu | cinque minuti |
> | 3 | **La lingua della scheda** (§6) | solo tu | una riga |
> | 4 | **E3** — screenshot | io + tu, su un telefono | — |
> | 5 | **E5** — build `production`, caricamento, invio | tu | — |
>
> ⬜ **E una voce che D-141 ha SBLOCCATO invece di chiudere**: le **traduzioni** dei tre documenti pubblici. Restavano ferme solo perché *«tradurre prima della revisione dell'avvocato significa tradurre due volte»*; quella revisione non arriverà, quindi l'argomento è caduto. 🔑 *È ora la cosa più economica che riduca il rischio accettato più grande del progetto*, ed è lavoro interno senza code.
>
> ⚠️ **E il punto in cui si scopre se bastano i dati che abbiamo non è la risposta di Apple: è il modulo.** I dati *trader* sono un campo da compilare **prima** della revisione. L'utente ha scelto di procedere e vederlo lì — *«se la documentazione non va bene Apple me lo farà presente»* — e le scelte sono registrate in `History.md` **D-140** e **D-141**.

### Cosa NON è in questo piano, e perché

- ⬜ **Android in ogni sua forma** (D-132). Torna solo se torna Android, e con esso i 12 tester.
- ⏸️ **La lista Film e TMDB** (D-127): spenta. *Riaccenderla rimette il muro §1.2 esattamente dov'era.*
- ⏸️ **Il ciclo mestruale** (D-07, P-02): dopo la prima pubblicazione, per non sommare gli errori in un lotto solo.

---

## 7-quater. Il piano di pubblicazione, scritto il 2026-09-17

> §7 dice **perché** l'ordine è quello e resta valido. §7-ter organizzava il lavoro in **cinque corsie parallele**, ed era la forma giusta finché c'erano code esterne da far scorrere insieme. **Non ce ne sono più** (D-141), quindi questa sezione riscrive lo stesso lavoro nella forma che ha adesso: una **fila**, più tre voci che non dipendono da niente.

⚠️ **Fra il 2026-09-15 e oggi non è cambiato nulla nel progetto**: due giorni interamente assorbiti dall'università. Lo stato di partenza è quello della nota `History.md` **2026-09-15 (11)**, ricontrollato riga per riga scrivendo questo piano.

### La sola dipendenza vera che resta

🔑 **La lingua della scheda decide quanti set di screenshot servono, e gli screenshot sono la voce più cara del piano.** L'app sul telefono è in inglese: se la scheda esce **anche in italiano**, il telefono va rimesso in italiano e le sei schermate vanno **riscattate una seconda volta**. *È l'unica voce che, presa nell'ordine sbagliato, fa buttare via lavoro già fatto* — ed è per questo che la decisione di §6 sta **prima** degli scatti e non dopo.

Tutto il resto è indipendente: si fa in qualsiasi ordine, purché prima del passo che lo richiede.

### Fuori fila — tre voci che non bloccano nessuno

| | Cosa | Chi | Costo | Peggiora aspettando? |
|---|---|---|---|---|
| 🔴 **C1** | **Revoca della chiave `SubscriptionKey_T3HLB536G3`** — App Store Connect → *Users and Access → Integrations*, revoca, nuova chiave, caricamento su RevenueCat | solo tu | 5 minuti | 🔴 **sì, ed è l'unica del piano** |
| **A7** | I **sei accordi art. 28** — Supabase, Expo, Apple, Google, RevenueCat, **AWS**. Da accettare e archiviare; l'elenco è in [`legal/registro-trattamenti.md`](legal/registro-trattamenti.md) Parte C | solo tu | minuti | no |
| **Chiave API di ASC** | `eas submit` non sa crearla in `--non-interactive`. Una volta sola, poi i caricamenti tornano automatici | solo tu | una volta | no, ma **blocca la Fase 4** |

🔑 **C1 va prima di tutto per una ragione che non è l'urgenza ma l'asimmetria**: chiuderla costa cinque minuti e quel costo non cambia mai; il rischio invece cresce, e cresce in silenzio — *una chiave esposta resta esposta e non se ne accorge nessuno finché non serve*. Il rischio accettato in `History.md` §5 diceva *«da riconsiderare prima della pubblicazione, quando gli abbonamenti diventano veri e la superficie smette di essere teorica»*. ⚠️ **La build `production` è firmata dal 2026-09-15: quel momento non sta arrivando, è passato.**

### Fase 1 — La lingua della scheda (tua, una riga, e viene prima)

Le tre strade sono in **§6** e non le ripeto. Quel che è cambiato da quando furono scritte: **la strada (c) non aspetta più niente.** Era bloccata da A6 — *«tradurre prima della revisione dell'avvocato significa tradurre due volte»* — e **D-141 ha saltato l'avvocato**, quindi quell'argomento è caduto.

**Raccomandazione: strada (a) — solo inglese — per la prima pubblicazione**, e le traduzioni subito dopo. Le ragioni, in ordine:

1. È **la decisione già in vigore** (D-123). Non chiede di prenderne una nuova: chiede di non disfarne una.
2. Costa **un set di screenshot invece di due**, e gli screenshot sono la voce che §6 stesso chiama *«la più sistematicamente sottostimata del piano»*.
3. **V3** dice che il valore atteso del progetto è percorrere il ciclo, non massimizzare la conversione. §6 dice che la strada (a) costa *«conversione, non rischio»*: è esattamente il tipo di costo che V3 autorizza a pagare.

⚠️ **Ma il conto che rende buona questa raccomandazione non è stato verificato**, e va detto invece di lasciarlo implicito: si assume che aggiungere la localizzazione italiana **dopo** sia una modifica dei soli **metadati** e non una revisione nuova del binario. 🔴 **Va confermato prima di contarci** — se costasse una revisione piena, la strada (b) o (c) fatta **subito** diventerebbe più conveniente, non meno.

### Fase 2 — Gli screenshot (io + tu, sul telefono) — la voce più grossa

È l'unica cosa rimasta che richiede **entrambi** e un telefono vero.

✅ **Il problema della misura è risolto e non va ripensato**: servono `1206 × 2622 PNG` nativi (iPhone 16 Pro), trasferiti **via iCloud**. ⚠️ *Il primo giro è passato da WhatsApp, che li ha ridotti a `942 × 2048 JPEG`* — e un difetto così non si vede finché non lo rifiuta il modulo.

#### Quali sei schermate, da quale account, e cosa non va nei sette scatti del 2026-09-15

> ⟳ **Riscritto il 2026-09-17, dopo aver GUARDATO gli scatti.** Fino a qualche ora prima questo riquadro diceva che l'account demo era quello da cui scattare, poi che serviva una decisione su come procurarsi un account con «Insieme». **Erano due errori consecutivi, e il secondo l'ho scritto io.** Guardare gli otto file li ha sciolti entrambi in un colpo: l'account usato il 2026-09-15 **ha già «Insieme»**.

**Le sei schermate sono le sei schede della barra**: `home` (Philippe), `calendario` (gli eventi), `galleria` (le foto), `mappa` (i luoghi), `giochi` (le partite), `preferiti` (le liste).

⚠️ **Tre schede su sei sono chiuse dietro «Insieme»** — `home` mostra `MuroCreatura` al posto della creatura, `mappa` e `preferiti` mostrano `Muro` (`components/muro.tsx`, diritto letto da `ho_insieme()`, `0047`). 🔑 **Quindi l'account demo non va bene per scattare, e non è un difetto della demo**: `tools/verifica-demo.mjs` verifica apposta che sia *senza* abbonamento, perché *«senza il muro il revisore non può percorrere l'acquisto in sandbox, che è proprio ciò che Apple vuole vedere»*.

✅ **Ma la domanda è già risolta e non serve nessuna decisione**: negli scatti del 2026-09-15 **Philippe si vede, la mappa è aperta e le liste pure**. L'account personale ha il diritto, ed è quello da cui si è scattato e da cui si riscatterà. *Restano due account distinti con due scopi distinti — il personale per la vetrina, la demo per la revisione — e nessuno dei due va toccato per somigliare all'altro.*

#### Cosa c'è che non va, scatto per scatto

I sette file del 2026-09-15 (più `IMG_2902`, di un altro giorno e di un altro telefono) coprono tutte e sei le schede, `calendario` due volte. ✅ **La misura è giusta**: `1206 × 2622` su tutti e sette. 🔴 **Il resto no.**

**Quattro difetti sono in tutti e sette insieme**, e si tolgono tutti prima di premere il tasto:

| | Difetto | Come si evita |
|---|---|---|
| 1 | 🔴 **La Dynamic Island mostra una diretta calcistica** — due stemmi di club e un orario. *Non era mai stato scritto da nessuna parte*, ed è l'elemento più vistoso dopo il pulsante: **è il marchio di qualcun altro nella propria vetrina** | Chiudere la diretta prima di scattare |
| 2 | 🔴 **Un pulsante di sistema (AssistiveTouch) galleggia a metà destra**, sopra il contenuto: sulla foto di New York, sulla Bosnia, sulla carta del quiz, sulla cena | Spegnerlo nelle impostazioni del telefono |
| 3 | 🔴 **Batteria al 18%, in rosso** | Telefono in carica |
| 4 | ⚠️ **Orologio 20:45** | Apple mette **9:41** su ogni suo materiale: non è un obbligo, è la convenzione che fa sembrare lo scatto voluto invece che catturato |

**E poi uno per schermata**, che è la parte che la tabella generica non poteva dire:

| Scheda | File | Cosa non va |
|---|---|---|
| `home` | `IMG_0151` | 🔴 **«Nothing ahead»** e **«Never played»**, uno accanto all'altro. ⚠️ *E il conto non torna con la mappa*: qui dice «3 places visited», la mappa ne mostra 2 |
| `galleria` | `IMG_0152` | ✅ Sei foto **vere** e belle — è il secondo scatto migliore. 🔴 Ma **metà schermo è bianco vuoto** sotto la griglia |
| `mappa` | `IMG_0153` | 🔴 **Il peggiore.** Inquadra mezza Europa per mostrare **2 segnaposti**; preso **a metà transizione** (il selettore *Map/List* e la barra in basso sono entrambi translucidi e mossi); l'orologio di sistema finisce **sopra i nomi delle città**; e la carta è **scura** mentre l'app è chiara |
| `giochi` | `IMG_0154` | ✅ Contenuto buono. 🔴 Preso **a metà scorrimento**: la carta è fuori centro e si vede il bordo della successiva |
| `preferiti` | `IMG_0155` | 🔴 **«Restaurants · 0 items · Still empty»**. Anche questo a metà scorrimento |
| `calendario` → *Diary* | `IMG_0156` | ✅ **Il migliore dei sei**: foto vere, *«Dinner»*, *«Sicily · In love»*. 🔴 Ma le carte sono **aperte in modifica** e mostrano **«Delete» in rosso, due volte** — la parola più vistosa dello scatto è quella che distrugge un ricordo |
| `calendario` → *Month* | `IMG_0157` | 🔴 **Il titolo è troncato: «September 2…»** — ⚠️ *questo non è un difetto dello scatto ma dell'app*, e va corretto nel codice, non col telefono. Più mezzo mese vuoto |

🔑 **E il file più bello non è nessuno dei sette.** `IMG_2902` è la **pagina di un evento** — *Sicily · Syracuse · Holiday*, foto grande, quattro miniature, le date, *«In love»*, i commenti — e vende l'app meglio di qualunque scheda della barra. 🔴 **Ma è `1170 × 2532`**, cioè un altro telefono, quindi inutilizzabile com'è. ⬜ **Da rifare sul 16 Pro**: *una schermata di dettaglio non è nella barra, e le schermate dello store non devono essere schede.*

#### Cosa mettere nell'account prima di riscattare

Tre vuoti, tutti sull'account personale, tutti riempibili in pochi minuti:

| | Cosa manca | Dove si vede |
|---|---|---|
| 1 | **Un evento futuro** | `home` dice «Nothing ahead», `Month` ha la seconda metà vuota |
| 2 | **Una partita giocata** | `home` dice «Never played» |
| 3 | **Qualche voce nelle liste** | `preferiti` dice «0 items · Still empty» |

⚠️ **E prima di scattare la mappa**, decidere l'inquadratura: *stretta sui segnaposti che esistono*, non su mezza Europa.

🔴 **Resta valida la scadenza dell'account demo**, che riguarda la revisione e non gli scatti: il seminatore crea l'unico evento futuro a **+9 giorni** da quando gira — seminato il 2026-09-15, *«Compleanno di lei»* cade il **2026-09-24**. ⚠️ **Dopo quella data il calendario che vedrà il revisore non ha più niente davanti.** 🔑 *Si evita rieseguendo il seminatore prima dell'invio: ricalcola le date da `new Date()`.*

#### ⏹️ Il secondo giro, e la decisione di fermarsi qui (2026-09-17)

**Sette scatti nuovi il 2026-09-17 alle 08:32**, tutti `1206 × 2622`, stesse sei schede (`calendario` due volte). ✅ **Quattro difetti su quattro dell'ambiente sono caduti**: niente diretta calcistica nella Dynamic Island, niente AssistiveTouch, batteria all'80% invece che al 18% in rosso, e la carta dei giochi finalmente centrata.

⏹️ **E qui l'utente ha deciso di fermarsi: «gli screen vanno bene questi».** La decisione è sua e va registrata **con ciò che comprende**, non come una spunta — è lo stesso schema di **D-140**, dove *chiusa* non voleva dire *fatta*.

**Cosa si accetta, per nome:**

| | Cosa resta nello scatto | Perché era stato segnalato |
|---|---|---|
| 1 | `home` dice **«Nothing ahead»** e **«Never played»** | ⚠️ *Sono le stesse parole che l'app dice a chi la installa adesso*: in una vetrina raccontano un prodotto che nessuno ha usato |
| 2 | `preferiti` dice **«0 items · Still empty»** | idem |
| 3 | Il Diary mostra **«Delete» in rosso, due volte** | La parola più vistosa dello scatto è quella che distrugge un ricordo |
| 4 | La mappa inquadra **mezza Europa per due segnaposti**, a metà transizione | È lo scatto che somiglia meno al prodotto |
| 5 | Il mese dice **«September 2…»** | 🔴 *Difetto dell'app, non dello scatto*: resta da correggere comunque, indipendentemente dalla vetrina |
| 6 | Un **disco grigio** sull'icona della scheda attiva | ⏹️ **Attribuito dall'utente al proprio telefono.** ⚠️ Il codice ne disegna uno **chiaro** — bianco al 48%, anello bianco, magenta al 9% ([`barra-volante.tsx`](../components/barra-volante.tsx)) — e il 2026-09-15 si vedeva chiaro. *Non è lo stato «premuto»*: il `Pressable` è stato tolto il 2026-09-01. La causa **non è stata accertata** |

🔑 **E accettare questo set decide anche la Fase 1, senza che nessuno l'abbia dichiarata.** Gli scatti sono di un'app **in inglese**: una scheda anche in italiano ne vorrebbe un secondo set, cioè rifare da capo il lavoro appena chiuso. *Da qui in avanti la strada (a) di §6 non è più la raccomandazione: è la strada su cui ci si trova.* Resta possibile cambiarla, al prezzo di riscattare.

⚠️ **E i sette file vivono solo sul Desktop di un dispositivo**, fuori dal repository: non sono in git, non sono su nessun altro computer, e non c'è niente che avvisi se spariscono. *Non è una proposta di metterli nel repo — pesano più di 30 MB — è il fatto che una copia sola non è una copia.*

### Fase 3 — Il modulo d'invio

**Tutto il testo esiste già.** È la parte del piano in cui non c'è niente da inventare:

| Cosa chiede il modulo | Dove sta, già scritto |
|---|---|
| Nome, sottotitolo, testo promozionale, parole chiave, descrizione, categorie, età | [`scheda-store.md`](scheda-store.md) — i limiti dei campi sono **imposti** da `npm run test:scheda`, non ricordati |
| **App Privacy**, dieci righe | [`app-privacy.md`](app-privacy.md) — da ricopiare. `Tracking = No` ovunque, esclusioni motivate una per una |
| URL di informativa e cookie policy | Online su CloudFront dal 2026-09-10, risposta `200` verificata |
| Note per la revisione | Credenziali dell'account demo, stampate da `tools/semina-demo.mjs` |

🔴 **E un campo che non ha una risposta pronta: i dati *trader*.** È il punto che il registro segnala da due giorni — **il muro non è la risposta di Apple, è il modulo**: quei dati si compilano *prima* della revisione. **A3** ha rinunciato a indirizzo e telefono pubblici (D-141) e il DSA continua a chiederli — *togliere il segnaposto ha tolto il promemoria, non l'obbligo*. Qui si scopre se la rinuncia passa. ⬜ *Se non passa*: non serve l'abitazione, bastano una domiciliazione e un numero dedicato — è già scritto in A3.

### Fase 4 — Caricamento e invio

`eas submit`, profilo `production`. ✅ L'`ascAppId` **`6811948208`** è in `eas.json` e non blocca più. 🔴 Richiede la **chiave API di ASC** fra le voci fuori fila.

⚠️ **Va lanciato da un terminale interattivo, e questo non cambierà**: la distribuzione App Store impone a EAS di validare il certificato con Apple, e quella validazione chiede **Apple ID e 2FA** — credenziali che l'agente non ha e non deve avere. *Stesso confine della build.*

### Dopo l'invio, non prima

- ⬜ **[`verifica-sul-telefono.md`](verifica-sul-telefono.md), 18 voci.** **D4 è chiusa per dichiarazione, non fatta** (D-140): il paywall rifatto il 2026-09-15 — **B-80** e **B-81** compresi — non è mai stato visto girare su un telefono, e B-80 si prova solo rallentando apposta il webhook. 🔑 *Quella lista è il posto da cui ripartire alla prima segnalazione di un utente vero*, e serve dopo la pubblicazione quanto sarebbe servita prima.
- ⬜ **Le traduzioni dei tre documenti pubblici.** D-141 le ha **sbloccate, non chiuse**: è la cosa più economica che riduca il rischio accettato più grande del progetto, ed è lavoro interno senza code.
- ⬜ Gli **handle** social, coda di **E1**.

### Cosa NON entra in questo piano

Le tre esclusioni di §7-ter restano valide parola per parola: **Android** (D-132), **la lista Film e TMDB** (D-127), **il ciclo mestruale** (D-07, P-02). *Riaccendere la lista Film rimette il muro §1.2 esattamente dov'era.*

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

> ⏹️ **QUESTA CONDIZIONE È STATA TOLTA il 2026-09-15 (3), per decisione dell'utente — D-140.** *«Le funzionalità dell'applicazione possiamo darle come testate»*. La corsia **D** si chiude, e con essa §9.
>
> ⚠️ **Tolta non vuol dire risolta, e la differenza va lasciata leggibile.** L'argomento di questa sezione non è cambiato: la prima partita vera fece uscire sette difetti in un colpo, e il paywall rifatto il 2026-09-15 — **B-80** e **B-81** compresi — non è mai stato visto girare su un telefono. *B-80 si prova solo rallentando apposta il webhook*, quindi non sarebbe emerso nemmeno da un uso normale.
>
> 🔑 **Il rischio ha cambiato forma, non dimensione**: prima era *«pubblichiamo senza sapere»*, adesso è *«pubblichiamo sapendo di non sapere»*. La seconda è una posizione difendibile — la prima no — ed è per questo che sta scritta qui e in `History.md` invece di essere una spunta.
>
> ⬜ **La lista resta**: [`verifica-sul-telefono.md`](verifica-sul-telefono.md) serve dopo la pubblicazione quanto prima, e le sue 18 voci sono il posto da cui ripartire alla prima segnalazione di un utente vero.
