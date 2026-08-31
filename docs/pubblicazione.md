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

### 1.1 🔴 La cancellazione dell'account non esiste, ed è un rifiuto automatico

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

### 2.3 🔴 Il test chiuso di Google è il vero prezzo di questa strada

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

### 3.2 🔴 L'abbonamento è della coppia, lo store vende a una persona

`monetizzazione.md` §1 decide che **il pagamento è a coppia**. Ma un abbonamento è intestato a un **Apple ID** o a un **account Google**: non esiste un abbonamento intestato a due. Uno paga, e il diritto va **esteso all'altro** — cosa che il telefono di chi non ha pagato non può fare, perché non ha ricevute da mostrare.

**Serve, in quest'ordine:**
1. il **webhook** dello store (o del servizio che li normalizza) verso il backend;
2. una **Edge Function** che scrive il diritto sulla riga della **coppia**, non dell'utente;
3. una colonna su `coppia` e le policy RLS che la leggono.

✅ **Non è una migrazione di dati contesi**: nessun dato esistente cambia significato, si aggiunge una colonna. Si può costruire dopo — purché si sappia **prima** che l'abbonato è la coppia, perché è quello a decidere *dove* va scritto il diritto.

⚠️ **Da decidere prima di scrivere il codice**, e non è ovvio: cosa succede al diritto **quando la coppia si scioglie**? Chi ha pagato lo conserva? Lo perde chi non ha pagato? La risposta cambia la colonna — se sta su `coppia`, allo scioglimento sparisce per entrambi. È lo stesso genere di domanda che **D-16** ha già dovuto sciogliere per la creatura.

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

🔴 **E qui c'è un ostacolo di codice, non di documentazione**: l'accesso è **via codice email**, e un revisore non può ricevere il nostro codice. Va deciso come farlo entrare — tipicamente un account demo con password fissa, esente dall'invio del codice. ⚠️ È una porta d'ingresso che aggira il meccanismo di autenticazione: va progettata guardando il threat model, non aggiunta di fretta la sera prima della sottomissione.

---

## 6. Documentazione e dichiarazioni

- **URL pubblico dell'informativa privacy** — un indirizzo web raggiungibile, non un allegato. ⚠️ In `Rule/` i modelli esistono già (`informativa-privacy-app.md`, `cookie-policy-app.md`, `registro-trattamenti.md`, `catena-cancellazione.md`, `procedura-data-breach.md`): vanno **adattati**, non scritti. E per ospitarli ci sono già due siti nel brain, `fr-busato` e `heleox-landing`.
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

**Da 2026-08-31 alla pubblicazione su entrambi gli store: 6–10 settimane.** Su **Apple** si può arrivare prima — il test chiuso riguarda solo Google, quindi **le due pubblicazioni possono sfasarsi**, ed è accettabile.

🔑 **Il collo di bottiglia si è spostato, e in meglio.** Prima era un'**attesa passiva** (il D-U-N-S: nessun lavoro lo accelerava). Ora è **lavoro coordinabile** — trovare 12 tester — che per giunta produce due risultati insieme: soddisfa Google e collauda l'app, che senza due persone non è collaudabile affatto.

⚠️ **Restano fuori dal nostro controllo due sole cose**: la **licenza TMDB** e le **revisioni** degli store. Sono le uniche che non accelerano lavorando di più.

## 9. 🔴 E una condizione che viene prima di tutto il piano

**L'app non è verificata.** Al 2026-08-29 sei difetti su sette dei giochi sono corretti e mai riprovati, e le Liste hanno decine di punti mai visti girare.

La prima partita vera ha fatto uscire **sette difetti in un colpo** (B-30 → B-36), e non c'è ragione di credere che le Liste si comportino diversamente. Pubblicare prima di aver esaurito quelle sorprese significa scoprirle con le recensioni a una stella — e su un'app a pagamento, con le richieste di rimborso.

*Il piano qui sopra dice come si pubblica. Non dice che sia il momento di farlo.*
