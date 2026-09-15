# Registro delle attività di trattamento — LifeCouple

> Documento **interno**, redatto ai sensi dell'**art. 30 GDPR**. Bozza del 2026-08-31. Si esibisce al Garante su richiesta; non si pubblica.
>
> 🔑 **Resta in italiano di proposito** (**D-123**, 2026-09-10): la documentazione *user-facing* di LifeCouple è ufficialmente in inglese, ma questo documento non lo vede nessun utente — si esibisce al **Garante**, che è l'autorità italiana. Tradurlo renderebbe più difficile un'ispezione senza nessun vantaggio. ⚠️ *Non è una dimenticanza dell'allineamento: è l'allineamento.*
>
> Adattato da [`Rule/registro-trattamenti.md`](../../../../Rule/registro-trattamenti.md), scritto per HeleoX. LifeCouple ha trattamenti **strutturalmente diversi**: nessun trattamento in qualità di responsabile, ma dati a sensibilità molto più alta.
>
> ⚠️ I punti marcati `[DA DECIDERE]` / `[DA VERIFICARE]` non sono stati riempiti con stime.

---

## Titolare

**Samuele Busato** — persona fisica, residente in Italia
Contatto per gli interessati: **info@heleox.it** *(scelta il 2026-09-10, D-121)*

> 🔴 **Riscritto il 2026-09-15 (D-136).** Diceva *«F.R. di Busato Fausto — titolare Fausto Busato, Novellara (RE), P.IVA 01878620358, REA RE 232527, PEC fr-busato@pec.fr-busato.it»*. ⚠️ **Il registro dei trattamenti è il documento di accountability**: se il titolare che dichiara non è quello vero, non prova niente — è il primo campo che il Garante guarda, e l'unico che non si può correggere a posteriori senza che si veda.
>
> ⬜ **Indirizzo, telefono e PEC mancano perché non esistono ancora per questo soggetto** (vedi `pubblicazione.md` **A3**). *Non si stimano*: un registro con un indirizzo inventato è peggio di uno con un campo vuoto.

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
| **Categorie di dati** | Associazione fra due identificativi utente, data di ingresso, data di uscita. ⟳ **Dal 2026-09-15**: il **token d'invito**, di cui il database conserva **l'impronta e non il valore**, e che resta sul telefono di chi è stato invitato finché non lo usa |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) |
| **Conservazione** | Durata del rapporto |
| **Destinatari** | Supabase (responsabile). ⟳ **Dal 2026-09-15 anche AWS**, e solo in un caso: se chi riceve l'invito apre il link **senza avere l'app**, la richiesta — token compreso — arriva alla rete di distribuzione che serve le pagine pubbliche. Vedi Parte C |
| ⟳ **Nota del 2026-09-15 (D-137)** | L'invito viaggia ora su un **indirizzo web pubblico** (`https://lifecouple.heleox.it/invito/<token>`) invece che su uno schema privato dell'app. ⚠️ *Il canale è più esposto — si indicizza, si inoltra, compare nell'anteprima di una notifica* — ma **la difesa non è la segretezza del link**: il legame non si forma finché **chi ha invitato non conferma** (`0003`). Il link apre, non unisce |
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
| **Destinatari** | Apple, Google, **RevenueCat** (adottato il 2026-09-14, D-133) |
| ⚠️ **Da verificare** | **Chi è il venditore verso l'utente finale.** Apple e Google agiscono da rivenditori nella UE: determina **chi versa l'IVA** e cambia gli obblighi fiscali dell'impresa |

### A6 — Registro delle azioni distruttive

| | |
|---|---|
| **Finalità** | Accountability (art. 5.2): poter stabilire chi ha cancellato cosa — la minaccia *«non sono stato io»* di [`threat-model.md`](../threat-model.md) TB-2 |
| **Categorie di dati** | Autore, tipo di azione, data e ora |
| **Base giuridica** | Legittimo interesse alla prova (art. 6.1.f) |
| **Stato** | ⚠️ **Parziale**: oggi solo `sciogli_coppia()` scrive in `registro_azioni` |

---

### A7 — Questionario di profilo della coppia ⏸️ **SOSPESO dal 2026-09-05**

⚠️ **La funzione è stata rimossa dall'applicazione** lo stesso giorno in cui era stata introdotta: nessuna risposta viene più raccolta e la tabella `profilo_coppia` resta vuota. La voce **resta scritta** perché la migrazione è applicata e la funzione tornerà in una versione rifatta; finché non torna, **questo trattamento non avviene**.

| | |
|---|---|
| **Finalità** | Analisi statistica sul prodotto: capire **chi usa** l'applicazione (canale di scoperta, fascia d'età, situazione abitativa, interesse prevalente) |
| **Categorie di interessati** | Coppie che scelgono di rispondere |
| **Categorie di dati** | Quattro risposte a scelta chiusa, nessun testo libero. Nessun dato di categoria particolare (art. 9): vedi **D-08** |
| 🔴 **Base giuridica** | **Consenso (art. 6.1.a)** — ed è **l'unico trattamento del sistema che non si regge sull'esecuzione del contratto**. Queste risposte non servono a erogare il servizio: servono al titolare |
| **Conservazione** | Fino alla revoca del consenso o allo scioglimento della coppia (`on delete cascade`) |
| **Destinatari** | Supabase (responsabile). Nessuna comunicazione a terzi |
| **Trasferimenti extra-UE** | Nessuno — Francoforte (DE) |
| **Modalità del consenso** | Prestato con l'invio esplicito delle risposte; **la riga esiste solo se il consenso è stato prestato**, e non esiste un campo che possa dire il contrario. Nessuna risposta è obbligatoria e saltare non ha conseguenze: un consenso necessario a proseguire non sarebbe libero (art. 4.11) |
| **Revoca** | Dalle impostazioni, in due tocchi, senza motivazione (art. 7.3). La revoca **cancella** le risposte, non le disattiva |
| **Riferimenti** | Migrazione `0029_questionario_profilo.sql` · `app/questionario.tsx` · `lib/profilo.ts` |

### A8 — Posizione condivisa fra i membri della coppia

| | |
|---|---|
| **Finalità** | Mostrare a ciascun membro dove si trova l'altro e la distanza fra i due |
| **Categorie di interessati** | Membri di una coppia che accendono la condivisione |
| **Categorie di dati** | **Dati di geolocalizzazione** (latitudine, longitudine, precisione, ora dell'ultimo aggiornamento) |
| 🔴 **Base giuridica** | **Consenso (art. 6.1.a)**, prestato accendendo la condivisione. Spenta per impostazione predefinita |
| **Conservazione** | 🔑 **Solo il dato corrente.** Una riga per persona, sovrascritta a ogni aggiornamento: **nessuno storico degli spostamenti esiste o può essere ricostruito**. Cancellata allo spegnimento della condivisione e allo scioglimento della coppia (trigger dedicato) |
| **Destinatari** | Supabase (responsabile) e **l'altro membro della coppia** |
| **Trasferimenti extra-UE** | Nessuno — Francoforte (DE) |
| 🔴 **Nota di rischio** | **È il trattamento a rischio più alto dell'intero sistema.** La geolocalizzazione di una persona nota, condivisa con il partner, è il dato tipico dello *stalkerware*. Il rischio non è ipotetico: `threat-model.md` lo nominava già come **intimate partner surveillance** — e fino al 2026-09-05 la mitigazione era **non avere la funzione** (D-05) |
| **Misure specifiche** | Spenta di default · accensione esplicita · spegnimento dalle impostazioni, e **il proprio punto sulla mappa compare solo mentre si condivide** (indicatore di stato che non richiede di aprire nessuna schermata) · 🔑 **lo spegnimento non è notificato e non è distinguibile** da GPS spento, app chiusa o batteria scarica · nessuno storico · scadenza a 15 minuti · scrittura consentita solo sulla propria riga (RLS) · cancellazione allo scioglimento |
| **Riferimenti** | Migrazione `0031_posizione_condivisa.sql` · `lib/posizione.ts` · **D-100** (che ribalta **D-05**) |

### A9 — Data di nascita

| | |
|---|---|
| **Finalità** | Due, distinte: (1) mostrare il **compleanno** sul calendario condiviso della coppia; (2) **verificare l'età minima** di 14 anni prevista dall'art. 8 GDPR |
| **Categorie di interessati** | Tutti gli utenti registrati: il dato è richiesto alla registrazione |
| **Categorie di dati** | Data di nascita (giorno, mese, anno) |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) per il compleanno; **obbligo legale** (art. 6.1.c, in relazione all'art. 8) per la verifica dell'età |
| **Conservazione** | Durata del rapporto; cancellata con l'account (`on delete cascade`) |
| **Destinatari** | Supabase (responsabile) e **l'altro membro della coppia**, che vede il compleanno sul calendario condiviso |
| **Trasferimenti extra-UE** | Nessuno — Francoforte (DE) |
| 🔑 **Nota** | **Chiude un buco che era aperto**: l'età minima era dichiarata nell'informativa da sempre e **non esisteva nessun meccanismo** per applicarla. Ora la registrazione rifiuta chi dichiara meno di 14 anni. ⚠️ Resta una dichiarazione, non una verifica documentale |
| **Misure specifiche** | Scrivibile **solo dall'interessato** (RLS `utente_id = auth.uid()`); leggibile dal partner solo finché **entrambi** sono membri attivi — allo scioglimento la lettura cessa da sé, senza bisogno di cancellare niente. Il dato **non muore con la coppia**: appartiene alla persona (D-04) |
| **Riferimenti** | Migrazione `0032_data_di_nascita.sql` · `lib/compleanni.ts` |

### A10 — Notifiche push

| | |
|---|---|
| **Finalità** | Quattro, e **non hanno la stessa natura**: (1) avvisare che il partner ha segnato un luogo come visitato; (2) ricordare un anniversario di un evento della coppia («N anni fa»); (3) 🔴 **sollecitare a inserire nuovi viaggi** — che è promozionale; (4) ➳ **avvisare che la coppia è stata sciolta** — aggiunta il 2026-09-15 con la `0049`. 🔑 *L'ultima non è né ingaggio né cortesia: è la comunicazione di un fatto che riguarda i propri dati*, ed è per questo l'unica insieme a (1) e (2) a nascere **accesa** |
| **Categorie di interessati** | Solo gli utenti che hanno concesso il permesso di notifica sul telefono e non l'hanno revocato |
| **Categorie di dati** | Token push (identificativo di **installazione**, non di persona), piattaforma, **lingua del telefono**, data dell'ultimo accesso, preferenze di consenso, e il testo della notifica — che per la sola finalità (2) **contiene il titolo di un evento**. ⚠️ La finalità (1) **non nomina il luogo**, né nel testo né nel payload: viaggia solo l'identificativo, e il nome si legge aprendo l'app. ✅ **E la (4) non nomina nulla**: né chi ha sciolto, né cosa conteneva la coppia — il payload è vuoto, nemmeno l'identificativo della coppia |
| **Base giuridica** | Esecuzione del contratto (art. 6.1.b) per le finalità (1) e (2), che raccontano qualcosa che la coppia ha fatto; 🔴 **consenso (art. 6.1.a)** per la (3), che nasce **spenta** e si accende solo con un gesto esplicito |
| **Conservazione** | Il token finché il dispositivo non viene rimosso, l'app disinstallata o l'account cancellato (`on delete cascade` su `auth.users`). Le righe in coda restano come prova di cosa è stato inviato e cosa è stato **scartato** |
| **Destinatari** | Supabase (responsabile), **Expo** (instradamento), **Apple (APNs) / Google (FCM)** (consegna) |
| **Trasferimenti extra-UE** | 🔴 **Sì, verso gli USA**, e solo per questo trattamento esce un contenuto della coppia: il **titolo dell'evento** dentro il ricordo di un anniversario. ✅ *Il nome del luogo NON esce*: la notifica sul posto appena segnato porta il solo identificativo. Non escono fotografie, note, diario, posizione né account |
| 🔑 **Nota** | **Il partner non vede i dispositivi dell'altro.** Ovunque nello schema le policy dicono `e_membro_attivo(coppia_id)`; qui no, solo `utente_id = auth.uid()`. Un token dice quanti telefoni ha una persona e `visto_il` **quando li ha usati l'ultima volta**: è il confine TB-2 applicato a un dato che sembra infrastruttura e non contenuto |
| **Misure specifiche** | Consenso verificato **al momento dell'invio** e non dell'accodamento (chi spegne nel frattempo non riceve) · 🔴 **dopo lo scioglimento non parte nulla, per nessuno dei due** · testo senza nomi di persona, perché compare sulla schermata di blocco · 🔑 **il posto appena segnato non viene nominato**, perché direbbe a un terzo dove siete stati di recente, mentre il ricordo di anni fa sì — e la stessa distinzione vale per il payload, non solo per il testo · nessun suono · `notifica_in_coda` con RLS attiva e **zero policy**: nessun client la legge e nessuno ci scrive · invio dietro segreto dedicato, **non** con la chiave `service_role` · token `DeviceNotRegistered` rimossi automaticamente |
| **Riferimenti** | Migrazioni `0038_notifiche_push.sql` e `0039_notifiche_invio.sql` · `supabase/functions/invia-notifiche/` · `lib/notifiche.ts` · **D-128**, **D-129** |

## Trattamenti che NON vengono svolti — e vale la pena scriverlo

| Trattamento | Stato |
|---|---|
| **Tracciamento della posizione in background e cronologia degli spostamenti** | ❌ Nessuno, e resta il confine che non si supera: l'app non legge la posizione quando non è in primo piano e **non conserva nessuno storico**. ⚠️ **La riga precedente diceva «mai trasmessa, mai condivisa» e dal 2026-09-05 non è più vera**: esiste la condivisione della posizione **corrente** col partner (**A8**, D-100), su consenso e spenta di default. È stata corretta invece di essere lasciata a smentire A8 |
| **Dati sanitari / ciclo mestruale** | ❌ Funzione **rimandata** dopo la prima pubblicazione (D-07). Nessun dato art. 9 richiesto |
| **Analytics automatici, pubblicità, profilazione individuale** | ❌ Nessuno strumento, né proprio né di terze parti. Nessun comportamento nell'app viene osservato o misurato. ⚠️ **Dal 2026-09-04 esiste però una raccolta dichiarata**: il questionario di **A7**, che è su base consenso, a risposte chiuse e **fornito dall'utente**, non osservato. La riga precedente diceva «nessuno strumento» senza distinguere, e sarebbe diventata falsa: è stata corretta invece che lasciata a smentire A7 |
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
| **RevenueCat** | Normalizzazione ricevute, webhook | Identificativo utente, stato abbonamento | USA | ⚠️ **copia da chiedere e archiviare** — adottato il 2026-09-14 (D-133), non più «se adottato» |
| **Expo** | Servizio push: instrada le notifiche verso Apple e Google | Token del dispositivo, lingua del telefono, testo della notifica | USA | ⚠️ **[DA FARE]** — SCC / DPF |
| **Apple (APNs) / Google (FCM)** | Consegna della notifica al telefono | Token del dispositivo, testo della notifica | Vedi §5 | Accordi di programma |
| **Amazon Web Services** (S3 + CloudFront) | Hosting delle **pagine pubbliche**: informativa, cookie policy, landing, 404, e il file che iOS legge per aprire i link d'invito | **Nessun dato inserito nell'app.** Riceve la richiesta HTTP: indirizzo IP e indirizzo richiesto. ⚠️ Dal 2026-09-15 quell'indirizzo **può contenere il token d'invito**, quando chi lo riceve non ha l'app installata | Edge **Europa e Nord America** (`PriceClass_100`, verificato in [`infra/main.tf`](../../infra/main.tf)) | ⚠️ **[DA FARE]** — DPA di AWS, parte del Customer Agreement |

> 🔴 **AWS mancava da questa tabella, e la lacuna è del 2026-09-10 — non del 15.** La landing è pubblica da allora, e da allora un fornitore riceveva richieste per conto nostro senza comparire qui. ⚠️ *Il 2026-09-15 l'ha solo aggravata*: con l'universal link (**D-137**) il token d'invito entra nell'URL, quindi ciò che transita non è più solo «qualcuno ha aperto una pagina pubblica».
>
> ✅ **Due cose che riducono il peso, entrambe verificate nel codice dell'infrastruttura e non supposte**: i **log di accesso non sono attivi** (nessun `logging_config` in `infra/main.tf`), quindi non si raccoglie per nostro conto nessun registro di chi ha aperto cosa; e `PriceClass_100` limita gli edge a **Europa e Nord America**, così una richiesta dall'Italia è servita normalmente dall'Europa.
>
> 🔑 *È la quarta volta che questa forma si presenta* (B-60, B-62, e il registro del 2026-09-14): **una dichiarazione corretta quando è stata scritta, resa incompleta da qualcosa costruito altrove.** Qui il «qualcosa» è stato pubblicare delle pagine, che non sembra un trattamento — ed è esattamente perché non lo sembra che è passato.

> ⟳ **Le parentesi tolte il 2026-09-14, ed è bene dire esattamente perché.** Il 2026-09-10 le due righe erano state scritte fra parentesi perché l'invio non esisteva: nessun token lasciava il database, quindi non c'era nessun destinatario da dichiarare. **Oggi l'invio esiste** — migrazione `0039`, Edge Function `invia-notifiche` (**D-129**) — e la regola scritta allora era *«le parentesi si tolgono nello stesso giro in cui parte la prima notifica, non dopo»*.
>
> ⚠️ **Stato reale, per non sostituire una imprecisione con un'altra**: il codice è completo, ma perché una notifica parta davvero servono ancora tre gesti dell'utente — applicare la `0039`, pubblicare la funzione, pianificarne l'esecuzione. Finché non avvengono, queste due righe dichiarano un destinatario che non ha ancora ricevuto nulla. 🔑 *È l'errore giusto da fare*: dichiarare in anticipo non danneggia nessuno, dichiarare in ritardo è un destinatario taciuto.

🔴 **Un contenuto degli utenti esce dall'UE, e da oggi va detto.** Fino al 2026-09-13 questa riga diceva *«nessun contenuto degli utenti esce dall'UE»*, ed era vero: verso gli USA andava solo il testo delle ricerche di luoghi e film. Il ricordo «N anni fa» **porta con sé il titolo dell'evento**, che è contenuto della coppia, e lo fa passare da Expo e poi da Apple o Google.

✅ **La notifica sul posto appena segnato invece non nomina il luogo**, per decisione dell'utente del 2026-09-14: esce il solo identificativo, e il nome si legge aprendo l'app. 🔑 *La distinzione non è di stile ma di quanto vale l'informazione per un terzo*: un posto segnato oggi dice dove siete stati di recente, un evento di anni fa no.

⚠️ *Questa frase era corretta quando è stata scritta ed è stata resa falsa da una funzione aggiunta altrove* — la stessa forma di **B-60** e di **B-62**. Restano fuori, e continuano a non uscire mai: fotografie, note, contenuto del diario, posizione, account.

🔑 **E resta vero che si può azzerare**: chi spegne le notifiche dalle impostazioni non fa uscire niente, perché la coda scarta la notifica prima di spedirla e nessun testo raggiunge Expo.

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
| ✅ **Email per l'esercizio dei diritti** | **Chiusa il 2026-09-10**: `info@heleox.it` |
| ⟳ **[DA FARE] Accordi art. 28 — precisato il 2026-09-15** | 🔑 *Non mancano gli accordi: manca la **copia archiviata***. Per **Apple** e **Google** le clausole vivono dentro contratti già firmati (Developer Program License Agreement, Data Processing Terms delle API); per **Supabase**, **Expo** e **RevenueCat** dentro i termini di servizio accettati usando il prodotto. ⚠️ L'art. 5(2) chiede di poter **dimostrare**, e una clausola dentro i termini di qualcun altro non si esibisce: serve un PDF in cartella. Da prendere: DPA Supabase dal pannello · copia del DPLA Apple · Data Processing Terms Google · copia a richiesta da Expo e RevenueCat |
| 🔴 **[DA VALUTARE con un professionista]** | Un'app che registra l'esistenza di una relazione fra due persone può, per certi utenti, rivelare l'**orientamento sessuale** — categoria art. 9 **dedotta dalla struttura del prodotto**, non richiesta all'utente. Non si risolve togliendo una funzione. Se la valutazione conferma il rischio, cambiano: la nomina del DPO, l'eventuale necessità di una **DPIA** (art. 35), e il testo dell'informativa. Vedi [`conformita.md`](../conformita.md) §9 |

**Revisione**: a ogni modifica sostanziale del prodotto, e comunque prima della pubblicazione sugli store.
