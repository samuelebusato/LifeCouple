# LifeCouple — Pubblicazione su App Store e Play Store

> Scritto il **2026-08-29**. Piano operativo per portare LifeCouple sui due store, **con i pagamenti già dentro** (decisione dell'utente del 2026-08-29 — vedi [`Marketing/LifeCouple/monetizzazione.md`](../../../Marketing/LifeCouple/monetizzazione.md) §0-bis).
>
> **Cosa è questo file e cosa non è.** È il piano *operativo*: cosa va fatto, in che ordine, e perché quell'ordine. Le decisioni di prodotto — prezzo, confine gratis/pagamento, pagamento a coppia — **non** vivono qui: stanno in `monetizzazione.md`, e questo documento le presuppone. Le voci di lavoro vere stanno nel backlog di [`History.md`](../History.md), che resta la fonte di verità dello stato: qui c'è il ragionamento, lì c'è il conto di cosa è fatto.
>
> ⚠️ **Le regole degli store cambiano più in fretta della documentazione che le descrive.** Ogni requisito qui sotto va riverificato sulla documentazione ufficiale al momento in cui lo si affronta, e i costi ancora di più. Quanto scritto vale come mappa del terreno, non come normativa.

---

## 0. Lo stato di partenza, verificato il 2026-08-29

Non è un elenco di buoni propositi: è cosa c'è e cosa non c'è nel repo, controllato file per file.

| | stato |
|---|---|
| `eas.json` | ❌ **non esiste** — nessun build è mai partito |
| Edge Function (`supabase/functions`) | ❌ **non esiste** — nessun codice server |
| Libreria di pagamenti | ❌ **nessuna** in `package.json` |
| Schermata cancellazione account | ❌ **non esiste** (17 schermate in `app/`, nessuna di impostazioni) |
| `sciogli_coppia()` nel database | ✅ esiste dal 2026-08-12, **senza interfaccia** |
| Identificatori app | ✅ `com.lifecouple.app` su entrambe le piattaforme |
| Testi dei permessi | ⚠️ presenti in `app.json`, **solo in italiano**, mai visti da nessuno (B-20) |
| Chiavi API | ⚠️ Google Places e TMDB **dentro il bundle** |
| Documenti privacy | ⚠️ modelli in `Rule/`, **non adattati né pubblicati** |
| Regione UE del progetto Supabase | ⚠️ **mai verificata** (punto di backlog aperto dal 2026-08-12) |
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

## 2. Gli account: la scelta che decide due settimane

### 2.1 Individuo o organizzazione

| | Apple | Google |
|---|---|---|
| Programma | Apple Developer Program | Google Play Console |
| Costo indicativo | ~99 $/anno | ~25 $ una tantum |

⚠️ Costi e regole **da riverificare all'iscrizione**.

**Va scelto organizzazione**, e per tre ragioni concrete:
1. l'editore risulta **F.R. di Busato Fausto**, non una persona fisica — che per un'azienda vera è il dato corretto;
2. su Google evita la regola che impone agli account **personali** recenti un **test chiuso con 12 tester per 14 giorni consecutivi** prima della produzione;
3. separa la responsabilità dell'app da quella personale.

Il prezzo è il **D-U-N-S**.

### 2.2 Il D-U-N-S, e come non perderci settimane

È un codice di 9 cifre assegnato da **Dun & Bradstreet**, agenzia privata americana: l'identificativo internazionale di un'**impresa**. Non c'entra con partita IVA o Camera di Commercio — è uno standard privato che Apple e Google hanno adottato come prova che l'entità legale esiste. **È gratuito.**

🔑 **Prima di richiederlo, verificare se esiste già.** D&B assegna numeri anche **senza che l'azienda li chieda**, raccogliendo dati da registri pubblici: molte imprese registrate da anni ne hanno uno e non lo sanno. Se c'è già, l'attesa più lunga dell'intero piano si riduce a una ricerca.

⚠️ **L'errore che impantana le iscrizioni**: i dati inseriti su Apple devono combaciare **alla lettera** con il record D&B — ragione sociale, indirizzo, forma giuridica. Una punteggiatura diversa fa fallire la verifica, e il messaggio d'errore non dice quale campo non torna. Si legge prima il record, poi si compila.

🔴 **È l'unica voce del piano che si può far partire oggi**, senza che l'app sia pronta, e blocca tutto ciò che segue. Ogni giorno di ritardo qui è un giorno aggiunto in fondo, non in mezzo.

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

1. **D-U-N-S** (oggi, prima di tutto: è attesa pura e blocca gli account) → account Apple e Google come organizzazione.
2. **In parallelo**: la prima Edge Function e la cancellazione account. Sblocca il muro §1.1 e costruisce l'infrastruttura che serve altre due volte.
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

**Da 2026-08-29 alla pubblicazione su entrambi gli store: 7–11 settimane**, assumendo D-U-N-S che non si impunta e nessun rifiuto grave. Se il D-U-N-S risulta **già esistente**, togliere 1–2 settimane.

🔑 **Il collo di bottiglia non è il lavoro.** Il progetto è nato il 2026-08-12 e in 17 giorni ha prodotto 25 migrazioni, sei sezioni e due giochi: a quel ritmo i 15–24 giorni-uomo non sono il problema. Lo sono le **attese** (D-U-N-S, verifiche degli account, accordi fiscali) e le **revisioni**, che non accelerano lavorando di più.

## 9. 🔴 E una condizione che viene prima di tutto il piano

**L'app non è verificata.** Al 2026-08-29 sei difetti su sette dei giochi sono corretti e mai riprovati, e le Liste hanno decine di punti mai visti girare.

La prima partita vera ha fatto uscire **sette difetti in un colpo** (B-30 → B-36), e non c'è ragione di credere che le Liste si comportino diversamente. Pubblicare prima di aver esaurito quelle sorprese significa scoprirle con le recensioni a una stella — e su un'app a pagamento, con le richieste di rimborso.

*Il piano qui sopra dice come si pubblica. Non dice che sia il momento di farlo.*
