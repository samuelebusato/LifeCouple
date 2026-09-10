# Cookie policy e strumenti di memorizzazione — LifeCouple

> 🔴 **DOCUMENTO DI LAVORO — NON È IL TESTO UFFICIALE.** Dal **2026-09-10** la documentazione ufficiale di LifeCouple è **in inglese** (**D-123**): il testo in vigore è [`en/cookie-policy.md`](en/cookie-policy.md), reso dentro l'app e pubblicato sulla landing. Questo file **non è reso a nessuno**. ⚠️ **In caso di divergenza vince l'inglese, sempre** — si corregge questo file, mai quello.
>
> **Versione `cookie-1.0` — bozza del 2026-08-31, rivista il 2026-09-09, non ancora in vigore.** Redatta secondo le *Linee guida cookie e altri strumenti di tracciamento* del Garante privacy (provv. 10 giugno 2021) e l'**art. 122 del Codice Privacy** (D.lgs. 196/2003).
>
> 🔑 **Revisione del 2026-09-09 — la tabella è stata verificata contro il codice, non contro la memoria.** Elencava una preferenza di lingua **che non esiste** (la lingua si legge dal telefono a ogni avvio, `lib/i18n.ts`) e ometteva **tre** valori realmente memorizzati. È il controllo che il documento stesso metteva fra le cose da chiudere prima della pubblicazione: fatto una volta, va rifatto ogni volta che si aggiunge una libreria che scrive sul dispositivo.
>
> ✅ **Dal 2026-09-10 il sito che la ospita esiste**: `landing/cookie-policy.html`, generato dalla versione inglese, accanto all'informativa. *(Diceva «non dentro l'app»: dal 2026-09-09 è resa **anche** dentro l'app — le due cose non si escludono, e gli store chiedono l'URL pubblico comunque.)*
>
> ⚠️ Adattata da [`Rule/cookie-policy-app.md`](../../../../Rule/cookie-policy-app.md), che riguarda un'**applicazione web**. LifeCouple è un'**app nativa**: non usa cookie di browser, ma strumenti equivalenti di memorizzazione locale — ed è la differenza che questo documento deve spiegare, non nascondere.

---

## Titolare

**F.R. di Busato Fausto**, Novellara (RE) — P.IVA 01878620358 — **info@heleox.it** *(scelta il 2026-09-10, D-121)*

## In breve

LifeCouple è un'applicazione per telefono. **Non usa cookie**, perché non è un sito web. Usa gli **strumenti di memorizzazione locale del dispositivo**, e li usa **esclusivamente per scopi tecnici** necessari a farla funzionare.

🔑 **Non utilizza alcuno strumento di profilazione, analisi statistica, pubblicità o tracciamento**, né proprio né di terze parti. Non c'è nulla che segua l'utente, dentro o fuori dall'applicazione.

Per questo motivo **non viene mostrato alcun banner di consenso**: l'art. 122 del Codice Privacy non lo richiede per gli strumenti tecnici, che si limitano a consentire l'erogazione del servizio espressamente richiesto dall'utente.

## Cosa viene memorizzato sul dispositivo

| Strumento | Finalità | Durata |
|---|---|---|
| **Token di sessione e di autenticazione** | Mantenerti autenticato fra un avvio e l'altro, senza doverti far accedere ogni volta. Senza, l'applicazione non è utilizzabile | Fino alla scadenza della sessione o alla disconnessione |
| **Se hai acceso la condivisione della posizione** | Ricordare, sul tuo telefono, se la condivisione è accesa o spenta, così la ritrovi come l'hai lasciata. ⚠️ Se la memoria locale non risponde, l'applicazione riparte da **spenta**: il valore prudente non è «come l'ultima volta» | Fino alla disinstallazione o alla cancellazione dei dati dell'app |
| **Cosa questo telefono ti ha già mostrato** della creatura che cresce con voi (l'ultimo stadio e i punti visti) | Mostrare l'evoluzione **a ciascuno dei due sul proprio telefono**: se il ricordo stesse sul server, chi apre per primo lo consumerebbe anche per l'altro, che non vedrebbe mai la sua | Fino alla disinstallazione o alla cancellazione dei dati dell'app |
| **La scelta di entrare rimandando la creazione dello spazio di coppia** | Non riproporti a ogni avvio una schermata che hai già superato | Fino alla disinstallazione o alla cancellazione dei dati dell'app |
| **Dati temporanei di funzionamento** (cache delle immagini già scaricate) | Evitare di riscaricare ogni volta le stesse fotografie: velocità e consumo di dati | Gestita dal sistema operativo |

Le tre voci centrali sono memorizzate **per singolo utente**: sullo stesso telefono possono entrare persone diverse, e le scelte di una non sono le scelte dell'altra.

🔑 **La lingua non compare in questa tabella perché non viene memorizzata**: l'applicazione legge quella impostata sul telefono a ogni avvio e non conserva nessuna preferenza linguistica.

Nessuno di questi strumenti consente di seguirti su altre applicazioni o siti, né di costruire un profilo.

## Come rimuoverli

Puoi cancellare in qualsiasi momento i dati memorizzati dall'applicazione:

- **disconnettendoti** dall'app — rimuove i token di sessione;
- dalle **impostazioni del telefono**, alla voce dell'applicazione, cancellando i dati dell'app;
- **disinstallando** l'applicazione.

⚠️ **Nessuna di queste operazioni cancella il tuo account né i tuoi contenuti dai nostri server.** Per quello esiste la funzione **«Elimina account»** dentro l'app — vedi l'[informativa privacy](informativa-privacy.md) §7.

## Servizi di terze parti

L'applicazione interroga due servizi esterni **solo quando cerchi qualcosa**:

- **Google Places**, quando cerchi un luogo;
- **TMDB**, quando cerchi un film.

Ricevono **il testo che digiti nella ricerca**, non i tuoi contenuti né la tua identità. Non impostano strumenti di tracciamento sul tuo dispositivo attraverso la nostra applicazione. Dettagli e garanzie sui trasferimenti: [informativa privacy](informativa-privacy.md) §4 e §5.

## Se qualcosa cambierà

Se in futuro venissero introdotti strumenti di analisi, di misurazione o di terze parti, questa policy sarà aggiornata **prima** della loro attivazione e, ove necessario, sarà richiesto il **consenso preventivo** con blocco degli strumenti fino a quel momento.

## Riferimenti

Per il trattamento dei dati personali si rinvia all'**[Informativa privacy](informativa-privacy.md)**.

---

## ⚠️ Da chiudere prima della pubblicazione

1. ✅ **L'email di contatto** — **chiusa il 2026-09-10**: `info@heleox.it`, la stessa dell'informativa §1.
2. ✅ **Elenco verificato contro il codice il 2026-09-09** — cercando ogni scrittura su `AsyncStorage` invece di rileggere la tabella. Esito: una riga di troppo (la lingua, che non si memorizza) e tre mancanti. ⚠️ **Il controllo va rifatto alla sottomissione**: se venisse aggiunta una libreria che memorizza altro sul dispositivo, questa tabella tornerebbe incompleta — e una cookie policy incompleta è una dichiarazione inesatta.
3. ✅ **Traduzione inglese** — **fatta il 2026-09-09** ed è diventata **il testo ufficiale** il 2026-09-10 (**D-123**). Da qui in avanti la voce è il contrario: tenere *questo* file allineato all'inglese.
