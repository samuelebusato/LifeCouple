# Registro delle attività di trattamento — LifeCouple

> Documento **interno**, redatto ai sensi dell'**art. 30 GDPR**. Bozza del 2026-08-31. Si esibisce al Garante su richiesta; non si pubblica.
>
> Adattato da [`Rule/registro-trattamenti.md`](../../../../Rule/registro-trattamenti.md), scritto per HeleoX. LifeCouple ha trattamenti **strutturalmente diversi**: nessun trattamento in qualità di responsabile, ma dati a sensibilità molto più alta.
>
> ⚠️ I punti marcati `[DA DECIDERE]` / `[DA VERIFICARE]` non sono stati riempiti con stime.

---

## Titolare

**F.R. di Busato Fausto** — titolare **Fausto Busato**
Novellara (RE) — P.IVA **01878620358** — REA **RE 232527**
PEC: fr-busato@pec.fr-busato.it
Contatto per gli interessati: **[DA DECIDERE: email dedicata all'app]**

**DPO**: non nominato. ⚠️ Valutazione da confermare con un professionista — vedi §D.

---

## Parte A — Trattamenti svolti in qualità di TITOLARE (art. 30.1)

### A1 — Gestione dell'account

| | |
|---|---|
| **Finalità** | Creazione dell'account, autenticazione, accesso al servizio |
| **Categorie di interessati** | Utenti dell'applicazione (persone fisiche, ≥14 anni) |
| **Categorie di dati** | Indirizzo email, identificativo utente, credenziali (gestite da Supabase Auth, mai nel nostro database) |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) |
| **Conservazione** | Durata del rapporto; cancellazione immediata su richiesta dell'utente dall'app |
| **Destinatari** | Supabase (responsabile) |
| **Trasferimenti extra-UE** | Nessuno — Francoforte (DE) |

### A2 — Legame di coppia

| | |
|---|---|
| **Finalità** | Erogazione del servizio, che per costruzione esiste solo fra due persone |
| **Categorie di dati** | Associazione fra due identificativi utente, data di ingresso, data di uscita |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) |
| **Conservazione** | Durata del rapporto |
| 🔴 **Nota di rischio** | Il legame **è un dato personale di entrambi**, e in alcuni contesti è **la cosa più sensibile dell'intero sistema**: può rivelare l'esistenza di una relazione sentimentale e, indirettamente, l'orientamento sessuale (art. 9). Non è un dato richiesto: è **dedotto dalla struttura del prodotto**. Vedi §D e [`conformita.md`](../conformita.md) §9 |

### A3 — Contenuti condivisi della coppia

| | |
|---|---|
| **Finalità** | Conservazione e condivisione dei ricordi fra i due membri |
| **Categorie di dati** | **Fotografie** · **luoghi** inseriti manualmente (desiderati e visitati, con date) · **eventi** del calendario condiviso · **voci di liste** con valutazioni e recensioni |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) |
| **Conservazione** | Durata del rapporto — vedi **[DA DECIDERE]** in §Manutenzione |
| **Destinatari** | Supabase (responsabile) |
| 🔴 **Sensibilità** | **Massima** per le fotografie (materiale privato e potenzialmente intimo) e **alta** per la cronologia dei luoghi: un elenco di luoghi con date rivela abitazione, orari e abitudini di due persone |
| **Misure specifiche** | Isolamento per riga · URL firmati a scadenza breve, mai file pubblici · **solo l'autore modifica o cancella** (D-21) · accesso revocato allo scioglimento (D-04) |

### A4 — Risposte ai giochi di affinità

| | |
|---|---|
| **Finalità** | Meccanica dei giochi, punteggio della coppia |
| **Categorie di dati** | Risposte a domande predefinite; **[futuro]** domande scritte liberamente dagli utenti (D-19, non ancora implementata) |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) |
| ⚠️ **Rischio art. 9** | Sono **confidenze scritte**, non preferenze. Il banco predefinito è **filtrato per escludere le categorie art. 9** (D-08). Per le domande libere la difesa è che **non le chiediamo noi**: un campo libero non è un trattamento *progettato* per raccoglierle — ma i dati arrivano comunque sui nostri server |
| **Misure** | Restano private della coppia: mai riusate nel banco comune, mai suggerite ad altri, mai aggregate · **nessuna analisi del contenuto** · risposte non leggibili dal partner prima della rivelazione (funzione Postgres, D-12) |

### A5 — Abbonamenti e adempimenti fiscali

| | |
|---|---|
| **Finalità** | Erogazione delle funzioni a pagamento; adempimenti contabili e fiscali |
| **Categorie di dati** | Stato e scadenza dell'abbonamento; dati contabili degli acquisti |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b); obbligo legale (art. 6.1.c) per i dati fiscali |
| **Conservazione** | Durata del rapporto; **10 anni** per i dati fiscali |
| **Destinatari** | Apple, Google **[+ RevenueCat se adottato]** |
| ⚠️ **Da verificare** | **Chi è il venditore verso l'utente finale.** Apple e Google agiscono da rivenditori nella UE: determina **chi versa l'IVA** e cambia gli obblighi fiscali dell'impresa |

### A6 — Registro delle azioni distruttive

| | |
|---|---|
| **Finalità** | Accountability (art. 5.2): poter stabilire chi ha cancellato cosa — la minaccia *«non sono stato io»* di [`threat-model.md`](../threat-model.md) TB-2 |
| **Categorie di dati** | Autore, tipo di azione, data e ora |
| **Base giuridica** | Legittimo interesse alla prova (art. 6.1.f) |
| **Stato** | ⚠️ **Parziale**: oggi solo `sciogli_coppia()` scrive in `registro_azioni` |

---

## Trattamenti che NON vengono svolti — e vale la pena scriverlo

| Trattamento | Stato |
|---|---|
| **Posizione geografica** | ❌ Letta una volta all'apertura della mappa per centrarla, **mai registrata, mai trasmessa, mai condivisa** (D-05). Non costituisce trattamento da parte del titolare: il dato non lascia il dispositivo |
| **Dati sanitari / ciclo mestruale** | ❌ Funzione **rimandata** dopo la prima pubblicazione (D-07). Nessun dato art. 9 richiesto |
| **Profilazione, analytics, pubblicità** | ❌ Nessuno strumento, né proprio né di terze parti |
| **Comunicazioni promozionali** | ❌ Non previste in questa versione |

---

## Parte B — Trattamenti in qualità di RESPONSABILE (art. 30.2)

**Nessuno.** A differenza di HeleoX, LifeCouple non tratta dati per conto di altri titolari.

---

## Parte C — Responsabili e sub-responsabili

| Fornitore | Ruolo | Dati ricevuti | Collocazione | Accordo art. 28 |
|---|---|---|---|---|
| **Supabase** | Infrastruttura: database, autenticazione, storage, funzioni server | Tutti | ✅ **eu-central-1 (Francoforte, DE)** — verificato il 2026-08-31 | ⚠️ **[DA FARE]** — DPA da accettare/archiviare |
| **Google (Places)** | Ricerca di luoghi | Solo il **testo digitato** nella ricerca e il luogo selezionato | USA | ⚠️ **[DA FARE]** — SCC / DPF |
| **TMDB** | Ricerca di film | Solo il **testo digitato** nella ricerca | USA | 🔴 **[DA FARE]** — e serve licenza **commerciale**, vedi [`pubblicazione.md`](../pubblicazione.md) §1.2 |
| **Apple** | Distribuzione e pagamenti | Dati dell'acquisto | — | Accordi di programma |
| **Google Play** | Distribuzione e pagamenti | Dati dell'acquisto | — | Accordi di programma |
| **[RevenueCat]** | Normalizzazione ricevute, webhook | Identificativo utente, stato abbonamento | USA | ⚠️ **[SE ADOTTATO]** |

🔑 **Nessun contenuto degli utenti esce dall'UE.** I soli trasferimenti verso gli USA riguardano il testo delle ricerche di luoghi e film — non fotografie, non account, non contenuti.

---

## Parte D — Misure di sicurezza (art. 32)

- **Cifratura** in transito e a riposo (fornita dalla piattaforma).
- **Isolamento per riga** (RLS): ciascuna coppia accede ai soli propri dati; le policy leggono l'appartenenza **attiva**, non quella storica (D-04).
- **Autore imposto dal database** (`auth.uid()`), mai accettato dal client: impedisce l'attribuzione falsa.
- **Fotografie** dietro collegamenti firmati a scadenza breve, mai oggetti pubblici.
- **Privilegio minimo**: un solo componente possiede la chiave `service_role`, e fa una cosa sola — cancellare la riga di `auth.users` di chi ha appena dimostrato di essere sé stesso.
- **Catena di cancellazione** documentata e ordinata: [`catena-cancellazione.md`](catena-cancellazione.md).
- **Threat model** STRIDE documentato, con un confine di fiducia dedicato al rapporto **partner ↔ partner** — che in questo prodotto è l'attaccante più probabile.

🔴 **Limiti dichiarati, non nascosti:**
1. **Molte mitigazioni sono costruite ma non verificate.** Il threat model è stato scritto prima del codice, e nessuna prova end-to-end è stata eseguita.
2. **Nessuna misura protegge dall'accesso di chi conosce le credenziali o usa il telefono sbloccato** del partner. È un gap dichiarato, mitigabile solo parzialmente.
3. **Il registro delle azioni distruttive è parziale.**

---

## Manutenzione

| Voce | Stato |
|---|---|
| **[DA DECIDERE] Conservazione a termine** | Non esiste. Lo scioglimento revoca ma non cancella: i dati restano finché l'account esiste. È una **decisione di prodotto**, e va presa **prima** di scrivere un termine nell'informativa — dichiararlo senza applicarlo sarebbe falso |
| **[DA VERIFICARE] Retention dei backup** | Va letta nel pannello Supabase; il numero finisce nell'informativa §7 |
| **[DA DECIDERE] Email per l'esercizio dei diritti** | Dedicata all'app o aziendale |
| **[DA FARE] Accordi art. 28** | Supabase, Google, TMDB — da accettare e archiviare |
| 🔴 **[DA VALUTARE con un professionista]** | Un'app che registra l'esistenza di una relazione fra due persone può, per certi utenti, rivelare l'**orientamento sessuale** — categoria art. 9 **dedotta dalla struttura del prodotto**, non richiesta all'utente. Non si risolve togliendo una funzione. Se la valutazione conferma il rischio, cambiano: la nomina del DPO, l'eventuale necessità di una **DPIA** (art. 35), e il testo dell'informativa. Vedi [`conformita.md`](../conformita.md) §9 |

**Revisione**: a ogni modifica sostanziale del prodotto, e comunque prima della pubblicazione sugli store.
