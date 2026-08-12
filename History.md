# LifeCouple — History

Registro cronologico dello sviluppo e di **ogni** decisione, col **perché**, le alternative scartate e il loro costo. Formato e obblighi: [`Rule/regole-sviluppo-sicuro.md`](../../Rule/regole-sviluppo-sicuro.md) §1.1.

> Date sempre assolute `AAAA-MM-GG`. Un dato non noto si lascia `—` e si chiede: non si stima.

---

## 1. Scopo, contesto e vincoli (passo 1 del framework)

**Cosa fa**: app per coppie con quattro funzioni — calendario condiviso, mappa dei luoghi visitati, cartella condivisa di fotografie, liste di film e ristoranti (visti/provati con recensione, oppure da vedere/provare).

**A chi serve**: coppie. Utente singolo per installazione, due installazioni per unità di prodotto.

**Contesto di business dichiarato dall'utente il 2026-08-12**: *"è una prova. Mi piacerebbe lanciarla sul mercato per sondare il terreno e capire come lavorare. In ogni caso non è un prodotto core, quindi l'obiettivo sarebbe avere meno spese possibile."*

Da cui i **tre vincoli** che governano ogni scelta di questo progetto:

| # | Vincolo | Conseguenza operativa |
|---|---|---|
| V1 | **Non è core** | Non compete per la capacità di sviluppo con i progetti principali. Ogni scelta che allunga i tempi va giustificata due volte. |
| V2 | **Spesa minima** | Il costo ricorrente deve tendere a zero. È il criterio di arbitraggio quando due soluzioni sono equivalenti. |
| V3 | **Serve a imparare il processo** | Il valore atteso principale **non è il ricavo**: è percorrere per intero il ciclo idea → store → utenti veri → GDPR → ritiro o crescita. Va misurato di conseguenza. |

**Precedente da non perdere**: l'idea è stata valutata come business il **2026-08-06** e **sconsigliata**. Tre funzioni su quattro sono commodity presidiate (Cozi 396K valutazioni, TimeTree 67M utenti, Polarsteps 22M con condivisione già inclusa, Beli 75M recensioni); economia unitaria negativa di 3-7×, da raddoppiare per la doppia installazione. Analisi completa in [`workspace/nota-2026-08-06-app-di-coppia.md`](../../workspace/nota-2026-08-06-app-di-coppia.md). **Il verdetto non è stato riscritto**: il progetto parte *nonostante* quel verdetto, per la ragione V3, e questo è scritto qui perché fra sei mesi la domanda "perché l'abbiamo fatta?" abbia una risposta.

---

## 2. Log cronologico

### 2026-08-12 — Avvio del progetto

**Sessione**: [`workspace/sessione-2026-08-12.md`](../../workspace/sessione-2026-08-12.md).

**Fatto**: raccolti scopo, contesto e vincoli; scelte piattaforma e stack; creati i tre documenti obbligatori. **Nessuna riga di codice, nessuna risorsa cloud creata, nessun repo remoto.**

**Stato**: `Projects/LifeCouple/` esiste come cartella nel brain. **Non è ancora un repo git né un submodule** — sono azioni irreversibili e attendono conferma esplicita (`CLAUDE.md` §6).

---

## 3. Decisioni

### D-01 — Il progetto parte nonostante il verdetto negativo del 2026-08-06
**Contesto**: l'idea era registrata in `elenco-progetti.md` §Futuri come *sconsigliata come business*.
**Opzioni**: (a) non farla; (b) farla come progetto personale non pubblicato; (c) farla e pubblicarla come esperimento.
**Scelta**: (c).
**Perché**: l'obiettivo dichiarato è V3 — imparare il processo end-to-end. Per quello serve **pubblicare**, perché i passaggi che non si conoscono (review dello store, adempimenti privacy verso utenti terzi, cancellazione account, primo utente che scrive) stanno tutti **dopo** la pubblicazione. Un'app tenuta nel cassetto insegna solo la parte già nota.
**Costo accettato**: il verdetto di mercato resta valido — non ci si aspetta che questo prodotto generi ricavo. Se lo genera, è una sorpresa, non il piano.
**Alternativa scartata e suo costo**: (b) costa meno e rischia meno, ma **non produce il risultato cercato**: senza utenti terzi non scattano gli obblighi GDPR, che sono metà di ciò che si vuole imparare.

### D-02 — App mobile iOS + Android con React Native ed Expo
**Perché**: un solo codice per due piattaforme, e le tre funzioni non-testuali (mappa, fotocamera/galleria, notifiche) richiedono accesso nativo. Competenza riusata dallo stack già valutato per l'app calcistica.
**Alternative scartate**:
- **Web app responsive** — costo zero di store e nessuna review, ma perde le notifiche push affidabili su iOS e l'accesso fluido alla galleria; e non insegna la parte di processo che si vuole imparare (V3: la review dello store *è* uno dei passaggi da conoscere).
- **Nativo separato (Swift + Kotlin)** — due codebase per una persona sola su un progetto non core: viola V1.

### D-03 — Supabase con Row Level Security come backend
**Perché**: (1) il confine di fiducia principale di questa app è **fra coppie diverse**, e la RLS di Postgres è precisamente il controllo che lo impone **nel database** invece che nel codice applicativo — se la query è sbagliata, il dato non esce lo stesso; (2) auth, storage e database in un solo servizio riducono i pezzi da gestire (V1); (3) piano gratuito adeguato all'inizio (V2).
**Alternative scartate**:
- **AWS** (coerente con HeleoX, Terraform, KMS, IAM verificabile) — controllo maggiore, ma per quattro funzioni CRUD e due utenti per unità è sproporzionato e allunga i tempi: viola V1 e V2.
- **Tutto locale con sincronizzazione peer-to-peer** — privacy massima per costruzione e zero costo ricorrente, ma la sincronizzazione fra due dispositivi è la parte **più difficile da scrivere correttamente** di tutto il progetto, e non c'è backup: la coppia che perde il telefono perde le foto. Scartata perché il pezzo difficile non è quello che si vuole imparare.
**Rischio accettato**: dipendenza da un fornitore unico per auth, dati e file. Documentato in `Architecture.md` come debito di portabilità.

### D-04 — La rottura della coppia è un requisito di progettazione, non un caso limite
**Contesto**: emerso durante il threat model. L'unità di autorizzazione di questa app è **la coppia**, ed è l'unica unità di autorizzazione che **può cessare di esistere mentre i dati restano**.
**Perché è una decisione e non un dettaglio**: alla rottura si scontrano due diritti reali — il partner A vuole cancellare le proprie foto (diritto ex art. 17 GDPR), il partner B vuole conservare i ricordi che considera anche suoi. Nessuna scrittura di codice è neutra rispetto a questo: chi conserva, chi cancella e chi vede cosa **è deciso dallo schema del database**, e cambiarlo dopo significa migrare dati che nel frattempo sono diventati contesi.
**Scelta**: ogni contenuto ha un **autore** (chi l'ha caricato) e una **visibilità di coppia**. Lo scioglimento **revoca l'accesso** all'altro, non cancella. Ciascuno conserva ciò che ha caricato; ciò che è stato caricato dall'altro **sparisce dalla sua vista**. Nessuna copia silenziosa.
**Alternative scartate**: (a) *tutto in comune, alla rottura si cancella tutto* — semplice ma distruttivo e irreversibile per entrambi; (b) *tutto in comune, alla rottura entrambi tengono copia di tutto* — è la scelta peggiore per la privacy, perché consegna a un ex-partner una copia permanente di materiale intimo dell'altro.
**Dettaglio**: `threat-model.md` §3 e `Architecture.md` §4.

### D-05 — Nessuna posizione in tempo reale, mai
**Perché**: è la mitigazione che rende questa app **non utilizzabile come strumento di sorveglianza del partner**. La mappa registra luoghi **inseriti a posteriori dall'utente**, non tracciati. La differenza in prodotto è quasi nulla (la mappa dei ricordi non ha bisogno del tempo reale); la differenza in rischio è totale.
**Alternativa scartata**: geolocalizzazione automatica con check-in — più comoda, ma trasforma un'app di ricordi in un tracker di persona, con tutto ciò che ne consegue in caso di relazione non sana. Costo della rinuncia: **zero funzionalità perse** rispetto allo scopo dichiarato.

### D-06 — Le foto sono la sola funzione a costo non limitato, e viene limitata
**Perché**: database e liste crescono in kilobyte, le foto in gigabyte. È l'unica voce che può far passare il progetto dal piano gratuito a un canone, cioè l'unica che minaccia V2.
**Scelta**: compressione lato client prima del caricamento, **tetto di spazio per coppia** dichiarato nell'interfaccia, originale che resta sul telefono. Il tetto esatto è `—`: si fissa quando si conosce il consumo reale, non prima.

### D-07 — Il calendario del ciclo mestruale si fa **dopo** la prima pubblicazione
**Deciso dall'utente il 2026-08-12.**
**Perché**: il dato è di categoria particolare (art. 9 GDPR) e la sua condivisione col partner cade esattamente sul confine di fiducia TB-2. L'obiettivo dichiarato del progetto è **imparare il processo**: farlo la prima volta *senza* dati di categoria particolare, e aggiungerli quando il resto funziona, **separa gli errori in due lotti invece di sommarli**. Il primo giro di pubblicazione insegna già abbastanza.
**Cosa resta valido da subito**: i vincoli scritti in P-02 e in `threat-model.md` §3-bis non decadono, si applicheranno quando la funzione entrerà. In particolare la **revoca silenziosa** e il **linguaggio mai fertilità/contraccezione**.
**Conseguenza da rispettare nel frattempo** → vedi D-08: se il ciclo è rimandato per motivi di art. 9, **nessun'altra funzione deve reintrodurre dati di art. 9 dalla porta di servizio**.

### D-23 — Si parte su Expo **SDK 54**, non sull'ultima
**Deciso il 2026-08-12**, dopo una verifica dell'utente che ha ribaltato una mia scelta.

**Il vincolo**: **Expo Go supporta una sola versione di SDK alla volta**, e la versione sull'App Store è ferma alla **54** (confermato dall'utente sul proprio iPhone). Un progetto su SDK 57 **non partirebbe** sul suo telefono.

**Cronaca, perche' l'errore e' istruttivo**: avevo generato il progetto sull'ultima versione (57) ragionando che *"allinearlo dopo e' un comando solo"*, dopo aver letto un changelog di **maggio** che dava lo store fermo alla 54 e averlo considerato probabilmente superato. Era vero il contrario. **Il costo e' stato nullo solo perche' non c'era ancora codice**: e' esattamente la ragione per cui l'inizializzazione va fatta *prima* di scrivere, e la verifica sul dispositivo reale *prima* dell'inizializzazione.

**Cosa si perde restando su 54** — verificato leggendo i changelog di 55 e 56:
- **55**: Legacy Architecture abbandonata, Expo UI rifinita, Colors API, transizione Apple Zoom, `Stack.Toolbar`.
- **56**: build iOS oltre 50% piu' veloci, avvio a freddo Android ~40% piu' veloce, primo render ~33% piu' veloce (interop Swift/C++ diretto al posto dello strato Objective-C++), aggiornamenti OTA piu' piccoli, Expo Router v56, componenti universali.
- **57**: non ne ho letto il changelog, quindi non lo riassumo.

→ **Niente di tutto questo serve a LifeCouple**: sono prestazioni e comodita' di sviluppo, non capacita', e qui ci sono quattro schermate CRUD e due utenti. **Restare indietro non costa nulla, e salire dopo costa poco**: l'unico breaking change che ci toccherebbe (import da `@react-navigation/*` a `expo-router/react-navigation`) ha un codemod.

**Versioni effettive**: `expo ~54.0.35` · `react-native 0.81.5` · `react 19.1.0` · `expo-router ~6.0.24`.

**Condizione di riesame**: quando l'Expo Go dello store passera' a una SDK piu' recente, o quando servira' comunque un development build (cioe' quando arrivera' l'account Apple).

### D-22 — Tetto foto: 1 GB per coppia
**Deciso dall'utente il 2026-08-12.**

**Cosa vale 1 GB in pratica**: con compressione lato client a ~400-500 KB per immagine (un JPEG a 1600 px di lato lungo, indistinguibile su un telefono), **1 GB ≈ 2.000-2.500 foto**. Una coppia che lo riempie è un caso eccezionale, non quello tipico.

⚠️ **Ma il piano gratuito di Supabase offre esattamente 1 GB di archiviazione file — in totale, non per coppia.** Verificato il 2026-08-12: piano gratuito = 500 MB di database, **1 GB di file**, 50.000 utenti attivi. Il piano **Pro costa 25 $/mese** e include 8 GB di database e **100 GB di file**.

**La distinzione che risolve la tensione**: **un tetto non è un'allocazione.** Il costo segue il consumo **reale**, non il tetto dichiarato. Se il consumo tipico è 100-200 MB a coppia, il tetto da 1 GB non costa nulla finché nessuno lo riempie: serve a fermare il caso patologico, non a prenotare spazio.
→ **Il numero da usare per pianificare è il consumo atteso (~150 MB), non il tetto.** Sul piano Pro, 100 GB reggono ~100 coppie nel caso peggiore e diverse centinaia nel caso realistico — più di quante questo esperimento ne vedrà.

**Conseguenza operativa**: la **compressione lato client è ciò che rende il tetto generoso e la realtà economica**. Senza, ogni foto pesa 3-5 MB e il tetto si riempie in 250 scatti. Non è un'ottimizzazione: è la condizione perché D-22 abbia senso.

✅ **Questione dello spazio chiusa dall'utente il 2026-08-12**: *"non credo che nessuna coppia arriverà mai a 1 GB… forse non arriveremo nemmeno a 1 GB di contenuto totale"*. **Concordato e parcheggiato** — i numeri lo confermano, e non va riaperto senza un dato reale di consumo. Il tetto resta scritto come guardia, non come previsione.

⚠️ **Ciò che invece NON è risolto dal ragionamento sul volume, perché non dipende dal volume**: la **sospensione dei progetti gratuiti dopo una settimana di inattività**. Un'app appena pubblicata con pochissimi utenti può restare ferma una settimana anche avendo 3 MB di dati. La conseguenza è **indisponibilità finché non ci si accorge e si riattiva il progetto** dalla console — non perdita di dati. Per un esperimento è un costo accettabile; **va però saputo prima di scoprirlo da un utente**. Resta l'unico motivo residuo per passare a Pro, ed è indipendente da quanto contenuto ci sia.

### D-21 — Visibilità totale, proprietà individuale, e le due classi valgono **solo** allo scioglimento
**Definita in due passaggi con l'utente il 2026-08-12.** Prima formulazione: *"le recensioni sono una per persona, ma film e ristoranti sono condivisi"* — da cui avevo dedotto che sui contenuti condivisi potessero cancellare entrambi. Seconda precisazione dell'utente: *"le foto sono singole… ma possono essere viste da entrambi… gli elementi possono essere cancellati solo da chi li carica"*. **La deduzione era sbagliata**, e la forma corretta è più semplice.

**Due assi indipendenti, e tenerli separati è ciò che rende il modello semplice:**

| Asse | Regola |
|---|---|
| **Visibilità** | **Tutto è di entrambi.** Galleria generale = tutte le foto della coppia; vista di un luogo = tutte le foto di quel luogo, di entrambi; un elemento mostra entrambe le recensioni |
| **Modifica e cancellazione** | **Sempre e solo l'autore**, per ogni tipo di contenuto. Una regola sola |
| **Scioglimento** | **Qui sì, due classi** — e la linea non è chi cancella, ma **quanto è sensibile il contenuto** |

**Le due classi, e solo per lo scioglimento**:
- **Personale** (`foto`, `recensione`) → resta **solo all'autore**.
- **Condiviso** (`elemento_lista`, `luogo`, `evento`) → **duplicato, una copia a ciascuno**, legame reciso.

**Il principio che decide anche i casi futuri**: **la sorte segue la sensibilità, non la condivisione.** Domanda da porsi su ogni nuovo tipo di contenuto — *conservarne una copia rivela all'ex qualcosa che non aveva già?* Per una foto scattata da uno solo: sì, ed è il danno che D-04 esiste per impedire. Per un ristorante in cui siete stati insieme: no, c'era anche lui.

**Nota di modellazione**: le foto legate a un luogo **non sono una collezione separata** — `foto.luogo_id` è facoltativo, e la stessa riga compare nella galleria generale e nella vista del luogo. Nessuna duplicazione, nessuna sincronizzazione da mantenere.

**Alternative scartate**:
- *Entrambi possono cancellare i contenuti condivisi* (la mia deduzione intermedia) — renderebbe possibile **svuotare per ritorsione** ciò che l'altro ha costruito. Scartata dall'utente, e correttamente.
- *Contenuti condivisi visibili a entrambi in sola lettura dopo lo scioglimento* — costa meno codice della duplicazione, ma **lascia i due account legati per sempre**, l'opposto di ciò che uno scioglimento deve ottenere.

**Piccolo costo accettato**: se un membro aggiunge un film sbagliato, l'altro non può correggerlo. È il prezzo della regola unica, e vale meno del rischio che elimina.

### D-20 — Identificativo del pacchetto: `com.lifecouple.app`
**Deciso dall'utente il 2026-08-12**, in due passaggi: prima legarlo al nome del prodotto, poi **svincolarlo dall'azienda**.
**Perché svincolato regge**: il prodotto è un esperimento e non è detto che resti nel perimetro di F.R. di Busato; un identificativo indipendente lascia aperta la possibilità di spostarlo, cederlo o abbandonarlo senza che porti addosso il nome dell'azienda.
**Costo accettato consapevolmente**: l'identificativo **non si cambia dopo la pubblicazione** — se un domani l'app cambia nome, resterà `com.lifecouple.app`. È **invisibile agli utenti**, quindi il costo pratico è nullo: la nota serve solo perché fra un anno nessuno si chieda perché non combacia col nome visualizzato.
**Da impostare** all'inizializzazione del progetto Expo, non dopo.

### D-14 — Appaiamento tramite link condivisibile
**Deciso dall'utente il 2026-08-12**: si genera un link da inviare per messaggio, WhatsApp o qualunque altro canale.
**Perché regge**: è la forma a minor attrito, e il canale lo sceglie l'utente invece di essere imposto dall'app.
⚠️ **Ma il canale non è fidato**: un link su WhatsApp si inoltra, si legge da una notifica su schermo bloccato, resta in una chat di gruppo. **Chi lo apre per primo entra nella coppia** — cioè nei dati più sensibili del sistema.
**Quattro condizioni, tutte necessarie**: token a entropia sufficiente (mai sequenziale o indovinabile) · **scadenza breve** · **monouso** · **conferma esplicita di chi ha invitato** prima che il legame diventi effettivo (*"qualcuno ha aperto il tuo invito: sei tu che l'hai mandato a questa persona?"*). Più la possibilità di **revocare** un link non ancora usato.
*Perché la conferma è la condizione che conta*: le altre tre riducono la probabilità, la conferma è l'unica che **interrompe** l'ingresso di un estraneo invece di renderlo improbabile.

### D-15 — La crescita della creatura si nutre delle altre funzioni
**Deciso dall'utente il 2026-08-12**: punteggio. Un luogo nella lista dei desideri che diventa un luogo visitato dà punti; un film nella lista da vedere che viene visto dà punti; i giochi danno punti in base al risultato.

**Perché è la scelta migliore fatta finora su questo prodotto**, e va detto: la creatura **non è una quinta funzione**, è il **collante** delle altre. Il punteggio non premia l'uso dell'app, premia la **chiusura del cerchio fra intenzione e realtà** — volevate andare a New York, ci siete andati. Le quattro funzioni "commodity" smettono di essere quattro elenchi separati e diventano l'ingresso di un'unica meccanica. È esattamente ciò che nessuno dei concorrenti fa: FurTwo ha la creatura senza le liste, gli altri hanno le liste senza la creatura.

**Conseguenze da rispettare nello schema**:
- Il punto si assegna alla **transizione** (desiderato → fatto), non alla presenza in lista. Serve registrare il **cambio di stato con la sua data**.
- **Assegnazione una sola volta**: togliere e rimettere un elemento non deve fabbricare punti. È una guardia da scrivere, non una proprietà che si ottiene da sé.
- **Nessuna verifica dell'avvenuto**: che la coppia sia andata davvero a New York è autodichiarato, e **va bene così** — il gioco è cooperativo, non c'è nessuno da battere. ⚠️ Ma proprio per questo il punteggio **non deve mai diventare classifica o confronto fra coppie**: sarebbe una gara vinta da chi mente. Si lega alla regola già scritta in P-03: la ricompensa è la crescita, non un numero da esibire.

### D-16 — Allo scioglimento la creatura sparisce per entrambi
**Deciso dall'utente il 2026-08-12.**
**È l'unica eccezione a D-04** in tutto il sistema: ovunque lo scioglimento **revoca l'accesso**, qui **distrugge**. Il motivo per cui l'eccezione è corretta: la creatura **non ha un autore** — è l'unico oggetto di cui nessuno dei due è proprietario, e una copia a testa sarebbe un ricordo falso, cresciuto insieme e conservato da soli.

⚠️ **Vincolo che ne discende, e che una sessione futura potrebbe "migliorare" facendo danno**: **lo scioglimento deve restare unilaterale.** Distruggere la creatura tocca anche l'altra persona, e la tentazione ovvia è chiedere il consenso di entrambi. **Non si fa.** Richiedere l'accordo dell'altro per uscire da una coppia significa **intrappolare chi vuole uscire** — ed è precisamente lo scenario che il confine di fiducia TB-2 esiste per proteggere. Chi vuole uscire esce, subito e da solo. Il costo è la creatura, e si dichiara con un avviso chiaro **prima**, non dopo.

### D-17 — Fra gli stadi cambia la crescita della figura
**Deciso dall'utente il 2026-08-12**: la differenza fra uno stadio e l'altro è che la figura **cresce**.
**Perché va bene**: è la semantica più economica possibile per il brief al designer — un solo asse invece di accessori, ambienti o evoluzioni di specie — e mantiene i 5-6 stadi alla portata di una commissione.
**Nota per il brief**: se la crescita è **solo** dimensione, cinque stadi rischiano di sembrare cinque volte la stessa cosa. Chiedere al designer che la crescita porti con sé **un po' di complessità** (qualche elemento in più, non un ridisegno) costa poco e rende visibile il progresso. Da valutare col designer, non deciso.

### D-18 — L'app è bilingue: italiano e inglese, a scelta dell'utente
**Deciso dall'utente il 2026-08-12.**
**Perché ora e non dopo**: è la stessa decisione già presa per l'app calcistica — internazionalizzare dal primo giorno costa giorni, farlo a ritroso costa settimane.
**Costo da mettere in conto**: il **banco domande va scritto due volte**, e le schede degli store pure. Non è traduzione meccanica: una domanda divertente in italiano tradotta parola per parola smette di esserlo.

### D-19 — Set di domande personalizzato, e il limite che introduce in D-08
**Deciso dall'utente il 2026-08-12**: nei giochi a domande la coppia può creare un **proprio set** di domande.
**Perché è buono per il prodotto**: risolve l'esaurimento del banco (il problema di ogni gioco a domande), e le domande scritte dalla coppia valgono più di quelle scritte da noi.

⚠️ **Ma cambia la natura di D-08, e va scritto o D-08 sembrerà più forte di quanto è.** D-08 dice *"nessun dato di categoria particolare nell'MVP"*, ed era **garantito per costruzione** finché il banco lo scrivevamo noi. Con le domande personalizzate **non lo è più**: le persone scriveranno domande su sesso, salute, religione: categorie dell'art. 9, quelle per cui abbiamo rimandato il ciclo mestruale (D-07).

**La differenza che regge, e che va documentata come tale**: quei dati **non li chiediamo noi**. Un campo libero in cui l'utente scrive spontaneamente non è un trattamento *progettato* per raccogliere categorie particolari, che è invece esattamente ciò che sarebbe il calendario del ciclo. La distinzione è reale, ma **non è un'assoluzione**: i dati arrivano sui nostri server lo stesso.

**Mitigazioni**:
- Le domande personalizzate restano **private della coppia**: mai riusate nel banco comune, mai suggerite ad altri, mai aggregate.
- **Nessuna analisi del contenuto** delle domande scritte dagli utenti.
- **Avviso al primo uso**: è un campo per giocare, non per informazioni delicate.
- Rientrano nella **catena di cancellazione** come ogni altro contenuto, e in D-04 per lo scioglimento.
- ⚠️ **D-08 resta valido per il banco che scriviamo noi**, e va riletto così: *garantito dove controlliamo il contenuto, mitigato dove non lo controlliamo.*

### D-12 — I tre giochi sono **un solo meccanismo**: invio sigillato, rivelazione quando entrambi hanno inviato
**Contesto**: l'utente ha specificato il 2026-08-12 i tre giochi da implementare per primi (dettaglio nel backlog).

**L'osservazione che li unisce**: tutti e tre sono la stessa cosa — **ognuno invia in segreto, e si scopre solo quando hanno inviato entrambi**.
- *Quiz sulle preferenze*: prima ciascuno deposita le **proprie risposte corrette** (che l'altro non deve vedere), poi ciascuno tenta di indovinare quelle dell'altro.
- *Telepatia*: entrambi scelgono, e nessuno deve vedere la scelta dell'altro prima di aver scelto.
- *Obbligo o verità*: stessa infrastruttura di turni e stato condiviso.

→ **Si costruisce un meccanismo solo e si ottengono tre giochi.** È il singolo guadagno più grande rispetto al vincolo "scrivere meno codice possibile": tre schermate diverse sopra la stessa macchina a stati.

⚠️ **E il sigillo non può stare nel client.** Se la riga con la risposta di A è leggibile da B prima della rivelazione, il gioco è rotto — e **non basta non mostrarla nell'interfaccia**: chiunque con il proprio token può interrogare direttamente l'API. La RLS da sola non esprime bene *"nascondi questa riga finché non si verifica una condizione"*.
**Scelta**: le risposte stanno in una tabella che **l'altro non può leggere in nessun caso**, e il confronto avviene in una **funzione Postgres** che restituisce il risultato **solo quando entrambi hanno inviato**. L'autorizzazione sta nel database, non nell'app — coerente con la scelta di fondo del progetto.

### D-13 — In "obbligo o verità" il pass non fa perdere, e il banco è filtrato
**Proposta dell'utente**: *chi preme più pass perde*.

⚠️ **Il problema**: una meccanica che **punisce il rifiuto** è, in un'app di coppia, l'app che si schiera dalla parte della pressione — proprio sul confine di fiducia TB-2 che questo threat model ha già identificato come quello caratteristico del prodotto. Su contenuti leggeri è innocuo; su contenuti intimi diventa uno strumento per insistere.

**Scelta**: la sicurezza non viene dal togliere la competizione ma **dal contenuto**. Il banco resta leggero per costruzione — **D-08** esclude già le categorie dell'art. 9 (vita sessuale, salute, religione, opinioni politiche) — e si aggiungono due esclusioni specifiche di questo gioco: **nessun obbligo che comporti atti fisici**, e **nessuna verità su dettagli di relazioni precedenti**. Con quel banco, "chi passa di più perde" resta un gioco.
**Alternativa considerata e scartata**: togliere del tutto la condizione di sconfitta. Scartata perché **toglie la tensione che rende il gioco un gioco**, mentre il filtro sul contenuto risolve il problema vero senza costare nulla.

### D-10 — Strato di sviluppo e UI: Expo + NativeWind + React Native Reusables
**Approvato dall'utente il 2026-08-12.** Dettaglio completo, con tutte le alternative scartate e il loro costo, in [`Architecture.md`](docs/Architecture.md) §3-bis.

**In sintesi**: expo-router · NativeWind · React Native Reusables (shadcn portato su RN) · Reanimated + Moti · `supabase gen types` · TanStack Query · lucide · react-native-maps · expo-image-picker/manipulator · FlashList · react-native-svg per la creatura.

**Il perché che conta più della singola libreria**: l'ecosistema di UI generabile o riusabile produce **React web + Tailwind**; scegliendo mobile si perde quella leva, e adottare la **forma shadcn + Tailwind anche su native** ne recupera la maggior parte. È il motivo per preferire React Native Reusables a gluestack (equivalente per qualità) e a Tamagui (superiore per prestazione, che però **non è il vincolo di questo progetto**).

**Costo ricorrente verificato: ~99 €/anno** (Apple Developer). Expo, Supabase e le mappe native stanno nei piani gratuiti; le uniche voci a consumo sono lo storage foto e — se si aggiunge — la ricerca luoghi.

### D-11 — La creatura si implementa per ultima, ma si progetta per prima
**Deciso dall'utente il 2026-08-12**: la creatura è l'ultima funzione a essere implementata.
**Sequenza**: autenticazione e appaiamento → calendario → mappa → foto → liste → giochi di affinità → creatura.
**Perché regge**: l'obiettivo del progetto è **imparare il processo** (V3), e la parte che lo insegna è l'impianto — appaiamento, RLS, cancellazione, pubblicazione. La creatura è la più cara e ha senso affrontarla quando il resto funziona.

⚠️ **Ma "per ultima" vale per l'implementazione, non per lo schema.** Punti di crescita, stadio e risposte dei giochi devono essere **nello schema dal primo giorno**: aggiungerli dopo significa migrare dati già scritti. Stesso vincolo di `autore_id` (D-04) e della separazione stato/disegno (D-09). *Si progetta subito, si implementa per ultima.*

⚠️ **Trappola di misurazione da mettere a verbale**: la creatura è **l'unica funzione non-commodity** del prodotto (P-01, P-03) — le altre quattro sono precisamente quelle bocciate dall'analisi del 2026-08-06. Se si pubblica prima di averla e l'app non attecchisce, **il risultato non dice niente sull'idea**: si sarà pubblicata la parte che già si sapeva non funzionare. Va ricordato al momento di leggere i numeri, non dopo.

### D-09 — La creatura parte come forme geometriche animate, e il disegno resta sostituibile
**Deciso dall'utente il 2026-08-12**: si parte con forme geometriche animate, con l'intenzione di sostituirle in seguito con qualcosa di più elaborato.

**Perché serve una decisione e non basta l'intenzione**: *"lo sostituiremo dopo"* è vero solo se **stato** e **disegno** sono separati dal primo giorno. Se la logica di crescita conosce le forme (*"al livello 3 aggiungi un triangolo"*), sostituire il disegno significa riscrivere la logica — cioè il "secondo momento" costa quanto rifarlo. È lo stesso schema di `autore_id` (D-04): un confine che si mette all'inizio o non si mette più.

**Scelta**:
- **Lo stato è astratto**: punti di crescita (continui) → **stadio** (discreto) + umore. Nessun riferimento a forme, colori o parti del corpo.
- **Il disegno è un componente che riceve solo `stadio` e `umore`** e non sa nient'altro. Sostituirlo è cambiare un file.
- **Implementazione iniziale**: `react-native-svg` + Reanimated — vettoriale, scalabile, già nello stack per il resto del movimento. Nessuna dipendenza nuova rilevante.
- **Percorso di sostituzione previsto**: un illustratore consegna file **Lottie**, uno per stadio, e il componente cambia renderer mantenendo la stessa interfaccia.

⚠️ **Il vincolo che decide il costo futuro: pochi stadi.** Il costo dell'upgrade grafico **cresce linearmente col numero di stati visivi**, perché ognuno va disegnato e animato. Cinque o sei stadi si possono far illustrare; cinquanta no, e la versione elaborata non arriverà mai. → **~5-6 stadi discreti**, non una scala continua. La crescita continua vive nei punti, non nel disegno.

### D-08 — Nessun dato di categoria particolare nell'MVP, da nessuna funzione
**Perché è una decisione a sé e non un corollario ovvio di D-07**: le domande intime di un gioco di coppia toccano con naturalezza **vita sessuale, salute, religione, opinioni politiche** — che sono tutte categorie dell'art. 9 esattamente come il ciclo. Rimandare il ciclo per motivi di art. 9 e poi introdurre un questionario che raccoglie le stesse categorie **annullerebbe la decisione senza che nessuno se ne accorga**, perché la seconda non si presenta come una funzione sanitaria.
**Regola operativa, verificabile**: il banco delle domande **esclude** vita sessuale, salute, religione, opinioni politiche, origine etnica e appartenenza sindacale. È un controllo sul contenuto, da fare una volta sul banco e a ogni aggiunta.

---

## 4. Bug trovati e come sono stati verificati

_(nessuno: non è stata scritta una riga di codice al 2026-08-12)_

---

## 5. Rischi accettati esplicitamente

| # | Rischio | Perché accettato | Condizione di riesame |
|---|---|---|---|
| R-01 | **Mercato sfavorevole** — tre funzioni su quattro sono commodity presidiate (analisi 2026-08-06) | L'obiettivo è V3 (imparare il processo), non il ricavo | Se compaiono utenti paganti non previsti |
| R-02 | **Dipendenza da fornitore unico** (Supabase per auth, dati e file) | Proporzionato a V1/V2; l'alternativa costa più di quanto il progetto valga | Se il progetto smette di essere un esperimento |
| R-03 | **Nessuna revisione legale professionale** dei testi privacy alla partenza | I documenti si adattano da quelli già scritti per HeleoX, rivisti da persona non legale | Prima della pubblicazione pubblica sugli store |
| R-04 | **Costi di pubblicazione ricorrenti** — Apple Developer 99 €/anno, Google Play 25 $ una tantum | Sono il prezzo minimo di V3: senza store non si impara la parte che si vuole imparare | Se l'app viene ritirata |
| R-05 | **22 segnalazioni di `npm audit`** (12 alte, 10 moderate) sul progetto appena inizializzato | Risalgono a **tre soli pacchetti**: `image-size` e `postcss` (dentro **Metro**, il bundler) e `uuid` (dentro `xcode` → `@expo/config-plugins`). Tutte le altre voci compaiono come *effetto* perché dipendono da questi. Sono **strumenti di build**: non finiscono nel bundle che arriva sul telefono, e sfruttarle richiederebbe di dare in pasto al bundler un input malevolo — cioè avere già accesso al codice. ⚠️ **`npm audit fix --force` NON va eseguito**: cambierebbe le versioni maggiori di `expo` e `react-native`, rompendo il vincolo SDK 54 di D-23 | Al prossimo aggiornamento di SDK, oppure se una segnalazione tocca una dipendenza **runtime** invece della toolchain |

---

## 6. Backlog / roadmap

> Qui vanno **tutti** gli sviluppi futuri interni a questo progetto, brevi e lunghi (`CLAUDE.md` §3.4). Un progetto *nuovo* va invece in `Projects/elenco-progetti.md`.

### Prima di scrivere codice — ✅ tutte decise il 2026-08-12
- [x] **Modello di appaiamento** → **link condivisibile** (D-14), con le quattro condizioni
- [x] **Economia della crescita** → **punteggio sulla chiusura del cerchio** desiderato → fatto (D-15)
- [x] **Significato dei 5-6 stadi** → **la figura cresce** (D-17)
- [x] **Sorte della creatura allo scioglimento** → **sparisce per entrambi**, e lo scioglimento resta **unilaterale** (D-16)

### Prima di pubblicare — non bloccano il codice
- [x] **Lingua** → **bilingue italiano/inglese a scelta dell'utente** (D-18)
- [x] **Tetto di spazio foto** → **1 GB per coppia** (D-22), con la compressione lato client come condizione perché il numero abbia senso
- [ ] Adattare i documenti privacy dai modelli in `Rule/`. ⚠️ **Il documento si redige alla fine (scelta dell'utente), ma tre suoi contenuti sono decisioni di schema e vanno prese prima**: (1) **quanto si conserva** ogni tipo di dato — `regole-sviluppo-sicuro.md` §13 impone che *retention dichiarata = retention praticata*, quindi ogni scadenza scritta deve avere una configurazione che la applica; (2) la **catena di cancellazione** (prima i file, poi le righe indice); (3) **quali dati esistono davvero**, che è già mappato in `threat-model.md` §1. Scritti quelli, il documento a fine lavori è una redazione, non una scoperta.
- [ ] Verificare che il progetto Supabase sia creato in **regione UE**.
- [ ] Scrivere il **banco domande** dei tre giochi, in **due lingue** (D-18), filtrato secondo D-08 e D-13. Quante domande servono per partire è `—`. Si redige in fase di sviluppo (scelta dell'utente).

### Nome — deciso di non decidere (2026-08-12)
Si parte come **"LifeCouple"**, con l'intenzione di cambiarlo eventualmente in corso d'opera. I quattro controlli (EUIPO classi 9 e 42, App Store, Play, dominio, handle) **restano da fare prima della pubblicazione**, non prima del codice.

✅ **Identificativo del pacchetto deciso: `it.frbusato.lifecouple`** (D-20). L'utente è stato avvisato che non si cambia dopo la pubblicazione e ha scelto di legarlo comunque al nome del prodotto: è invisibile agli utenti, quindi un eventuale cambio di nome visualizzato non produce alcun danno — solo un identificativo che non combacia più, e questa nota spiega perché.

### Avatar — piano dichiarato dall'utente il 2026-08-12
L'utente cercherà **un designer che realizzi l'avatar in 5-6 stadi**. Non cambia D-09: la separazione stato/disegno resta, e il lavoro del designer entra come **renderer sostituibile**.

**Cosa deve contenere il brief** (da preparare prima di cercare la persona):
- il **significato dei 5-6 stadi** (voce bloccante qui sopra) — senza, il designer non sa cosa disegnare;
- **formato Lottie**, un file per stadio, più le transizioni se previste;
- **stile coerente fra gli stadi** e leggibile a dimensioni piccole;
- eventuali **stati di umore** se si vogliono (moltiplicano il lavoro: stadi × umori).

⚠️ **Trappola contrattuale da non saltare**: commissionare un'illustrazione **non trasferisce automaticamente i diritti**. In Italia il trasferimento dei diritti di utilizzazione economica **deve essere provato per iscritto** (art. 110 l. 633/1941): senza un accordo scritto di cessione, l'avatar dell'app resta dell'illustratore, e ce se ne accorge nel momento peggiore — quando serve registrarlo come marchio o difenderlo. **Si concorda prima del lavoro, non alla consegna.**

### MVP — in ordine di implementazione (D-11)
> Lo **schema del database** copre tutte le voci **dal primo giorno**, creatura e giochi inclusi. L'ordine qui sotto riguarda l'implementazione, non la progettazione.

1. [ ] Autenticazione e **appaiamento della coppia** (modello ancora `—`: è il primo blocco)
2. [ ] **Scioglimento della coppia** secondo D-04 — subito dopo l'appaiamento, perché è la stessa logica vista dall'altro lato
3. [ ] Calendario condiviso
4. [ ] Mappa dei luoghi visitati (inserimento manuale, mai automatico — D-05)
5. [ ] Cartella foto condivisa con tetto di spazio
6. [ ] Liste film e ristoranti: visti/provati con recensione, e da vedere/provare
7. [ ] **Cancellazione account in-app** (richiesta obbligatoria da Apple) con catena di cancellazione verificata
8. [ ] **Meccanismo di invio sigillato** (D-12) — la macchina a stati condivisa dai tre giochi: invito → accettazione → invio segreto di entrambi → rivelazione
9. [ ] **Gioco 1 — quiz sulle preferenze del partner**: (a) uno invita, l'altro accetta; (b) fase di deposito, entrambi inseriscono le **proprie** risposte corrette su una lista di domande; (c) a turno ciascuno risponde cercando di indovinare quelle dell'altro; vince chi indovina di più
10. [ ] **Gioco 2 — obbligo o verità**, con la regola del pass secondo **D-13** e il banco filtrato (D-08 + le due esclusioni specifiche)
11. [ ] **Gioco 3 — telepatia**: stesse opzioni mostrate a entrambi, selezione contemporanea, si vince se coincidono. È il caso che richiede il **tempo reale** (presenza dell'altro, e rivelazione simultanea) — Supabase Realtime
12. [ ] **Creatura** (P-01): stato, stadi, disegno in `react-native-svg` (D-09)

> **Le partite completate alimentano la creatura** (P-03): la ricompensa è la crescita condivisa, **non** un punteggio di compatibilità che resta.
> **Dettaglio emerso il 2026-08-12 sulla mappa**: ogni luogo può avere **foto associate**. Lo schema lo prevede dal primo giorno — una foto può appartenere a un luogo — anche se l'interfaccia arriva dopo.

### Dopo l'MVP, non prima
- [ ] Notifiche push
- [ ] Esportazione dei propri dati (portabilità, art. 20 GDPR)
- [ ] Ricerca e filtri nelle liste
- [ ] Disaster recovery: verificare i backup effettivi del piano in uso

### Proposte dall'utente il 2026-08-12, in valutazione — non ancora decise

#### P-01 — Creatura condivisa che cresce completando sfide
**È la funzione competitivamente più forte dell'intero progetto**, e l'unica non-commodity: il verdetto del 2026-08-06 colpiva calendario, mappa e liste, non questa. Motivi:
- **Il meccanismo è dimostrato**: una creatura che dipende da te batte quasi ogni altra meccanica di ritenzione. **Finch** (compagno per l'auto-cura) lo prova su larga scala legando le avventure del pet al completamento di compiti quotidiani.
- **È l'unica funzione che richiede entrambi**, quindi difende la premessa "app di coppia" invece di subirla: calendario, mappa e foto funzionerebbero identici in un'app per singoli.
- **Dà una ragione di aprire l'app ogni giorno**, che le altre quattro funzioni non hanno.

⚠️ **Ma esiste già, ed è quasi identica**: **FurTwo — Couples Virtual Pet** (App Store) — *"un pet allevato insieme, responsabilità divise, il pet prospera quando entrambi ci sono"*, con sfide quotidiane di coppia. Differenza rispetto ai casi precedenti: **non è un incumbent radicato**, è un'app recente. Non è "lo fanno tutti", è "lo fa uno, da poco".

🔴 **Il costo è il problema, ed è esattamente contro il vincolo dichiarato**: una creatura è un **gioco** — asset grafici, stati, animazioni, più una libreria di sfide da scrivere. È di gran lunga la cosa più cara da costruire di tutto il progetto, e l'utente ha chiesto *"perderci meno tempo possibile e scrivere meno codice possibile"*. È lo stesso problema delle clip dell'app calcistica: l'aspetto distintivo non è a catalogo.

⚠️ **Rischio di progettazione emotiva, da decidere prima di scrivere codice**: una creatura che **deperisce** quando la coppia non la cura applica una punizione a una relazione. Se la coppia sta attraversando un periodo difficile, l'app aggiunge senso di colpa nel momento peggiore. → **La creatura cresce e basta: non muore, non deperisce, non rimprovera.** L'assenza rallenta la crescita, non la distrugge.
⚠️ **E si lega a D-04**: cosa succede alla creatura allo scioglimento? Va deciso insieme al resto, non dopo.

#### P-03 — Giochi di affinità di coppia che fanno crescere la creatura
Proposta dall'utente il 2026-08-12. **Non è una terza funzione: è il carburante di P-01**, ed è ciò che ne rende sostenibile il costo.

**Perché la composizione conta più delle due parti**:
- P-01 ha bisogno di **sfide**, cioè di contenuto. I giochi di affinità *sono* quel contenuto, e sono **testo**: costano quasi nulla a produrre rispetto agli asset grafici. Un banco di domande è un file, non un progetto artistico.
- Il ciclo diventa coerente: **si gioca → la creatura cresce**. La creatura è l'accumulatore, il gioco è l'ingresso.
- Il formato "rispondiamo separatamente e poi confrontiamo" produce un **risultato di sessione**, cioè un artefatto condivisibile.

**Il mercato, verificato il 2026-08-12**: il formato è popolato — *Couples Quiz Relationship Game* (22 quiz), la **domanda quotidiana di Paired**, *CouplesQuiz.app*, il quiz di **Gottman**, e **Lovy**, che fa esattamente *"si risponde separatamente e si confronta per vedere la percentuale di affinità"*.
→ **Preso da solo, il gioco è commodity.** Quello che non risulta fatto da nessuno è **legarlo alla crescita di una creatura condivisa**: FurTwo ha la creatura, gli altri hanno i quiz. La composizione è lo spazio.

⚠️ **La percentuale di affinità è il "voto al partner" con un altro vestito, e va evitata.** L'analisi del 2026-08-06 aveva bocciato il voto a stelle al partner come controindicato da Gottman e da uno studio su 7.000 coppie in 13 anni. Un punteggio di compatibilità **persistente** è la stessa cosa: **un'app che emette un verdetto su una relazione**. Che Lovy lo faccia non lo rende giusto — copiarlo copierebbe l'errore.
**Forma corretta**:
- Risultato **della singola sessione**, non un punteggio globale che resta.
- Linguaggio di **scoperta**, non di giudizio: *"avete scoperto tre cose che non sapevate"*, mai *"siete compatibili al 47%"*.
- **Nessun grafico di andamento** nel tempo: un punteggio di coppia che scende è la cosa peggiore che un'app possa mostrare a due persone.
- **La ricompensa è la crescita della creatura**, non il numero. Sposta il rinforzo da *giudizio sulla relazione* a *risultato ottenuto insieme*.

⚠️ **Vincolo di contenuto** → vedi **D-08**: il banco domande esclude le categorie dell'art. 9.
⚠️ **Diritti sul contenuto**: i mazzi di Gottman sono protetti; le "36 domande" di Aron (1997) provengono da un articolo scientifico. **Scrivere un banco proprio** è più sicuro e costa poco — è la stessa logica delle clip dell'app calcistica, ma qui il contenuto è testo, quindi il problema è di un ordine di grandezza più piccolo.
⚠️ **Le risposte sono contenuto condiviso** e ricadono sotto D-04: hanno un autore, e allo scioglimento seguono la stessa regola di foto e luoghi.

#### P-02 — Calendario del ciclo mestruale con calcolo automatico dei giorni
> ✅ **Deciso il 2026-08-12: rimandato dopo la prima pubblicazione** (D-07). L'analisi sotto resta valida e si applicherà quando la funzione entrerà.

🔴 **È la singola decisione che alza di più il profilo di rischio dell'intero progetto**, e va presa sapendolo.

- **Il dato è di categoria particolare, art. 9 GDPR.** Il trattamento è **vietato** salvo eccezione, e l'eccezione praticabile qui è il **consenso esplicito**, separato da ogni altro consenso e revocabile. Non è il consenso generico all'uso dell'app.
- **Sulla MDR la notizia è buona**: la MDR **non** include le app di benessere come i tracker mestruali *"a meno che non forniscano una funzione diagnostica"*. Un calendario che stima la prossima mestruazione a fini informativi **non è un dispositivo medico**. **Natural Cycles lo è** — ed è certificato — perché è commercializzato per la **contraccezione**.
  → **La riga da non superare è lessicale prima ancora che funzionale**: mai *fertilità*, *ovulazione*, *concepimento*, *contraccezione*, *"giorni sicuri"*. Sono quelle parole a spostare la classificazione, con lo stesso meccanismo Snitem già applicato due volte nel brain.
- ⚠️ **Il problema vero non è il tracker: è la condivisione col partner.** Qui non è un'app di ciclo, è un'app di ciclo **visibile a un'altra persona** — cioè dato sanitario di A leggibile da B, dentro il confine di fiducia TB-2 già identificato come quello caratteristico del prodotto. Esiste letteratura dedicata agli *intimate harms* dei tracker mestruali, e circa **l'80% delle app FemTech risulta inadempiente sul consenso specifico**.

**Progettazione che risolve la maggior parte del rischio** (da confermare):
1. **Consenso esplicito e separato**, con schermata dedicata; funzione **spenta** finché non è concesso.
2. **Privato per impostazione predefinita**: i dati sono di chi li inserisce. La condivisione col partner è un **interruttore a parte, spento**, revocabile in ogni momento.
3. ⚠️ **La revoca deve essere silenziosa.** Se disattivare la condivisione notifica il partner, la revoca diventa essa stessa un segnale, e il consenso smette di essere *libero* nel senso dell'art. 4(11) GDPR: chi teme la reazione non revoca. È il punto meno ovvio dell'intera funzione e va progettato adesso, perché una notifica aggiunta "per trasparenza" lo distrugge.
4. **Nessuna analitica di terze parti** su quelle schermate.
5. **Linguaggio informativo**, mai predittivo-sanitario.

**Sequenza raccomandata**: rimandare P-02 **dopo** il primo ciclo completo di pubblicazione. L'obiettivo dichiarato del progetto è imparare il processo; farlo la prima volta **senza** dati di categoria particolare, e aggiungerli quando il resto funziona, separa gli errori da fare in due lotti invece di sommarli.

### Rimandato con motivo
- **Monetizzazione** — non è l'obiettivo (V3), e introdurla presto obbligherebbe a gestire pagamenti e fatturazione su un progetto non core.
- **Vista web** — nessuna domanda dimostrata; si valuta se emerge dall'uso reale.

---

## 7. PUNTO DI RIPRESA

**Aggiornato al 2026-08-12.**

**Stato**: progetto **inizializzato e funzionante**. Esistono i tre documenti, il repo su GitHub, il submodule nel brain e un'app Expo che parte. Zero risorse cloud, zero costi sostenuti.

**Cosa è deciso**: le sei funzioni · i tre giochi da implementare per primi · lo stack completo (D-10) · l'ordine di implementazione (D-11) · la creatura geometrica ora e sostituibile poi (D-09) · il ciclo mestruale rimandato (D-07) e il divieto di reintrodurre art. 9 da altre porte (D-08) · le regole di scioglimento (D-04), posizione (D-05), invio sigillato (D-12) e pass (D-13).

✅ **Repo, submodule e inizializzazione fatti il 2026-08-12.** Il progetto è su GitHub (`samuelebusato/LifeCouple`), agganciato al brain come submodule, e **l'app parte e rende**: verificata nella preview web con 1153 moduli compilati, nessun errore in console, navigazione fra le tab funzionante.

**Configurazione applicata**: `name` LifeCouple · `slug` lifecouple · `version` **0.1.0** (1.0.0 su un progetto senza codice sarebbe una bugia) · `scheme` **`lifecouple`** — serve ai link di invito di D-14, è ciò che fa aprire l'app quando si tocca il link su WhatsApp · `ios.bundleIdentifier` e `android.package` **`com.lifecouple.app`** (D-20) · `supportsTablet: false`, perché un'app di coppia sul telefono non ha motivo di farsi recensire anche su iPad.

**Comando per lavorarci**: `npm run web` dentro `Projects/LifeCouple` (o la configurazione `lifecouple-web` in `.claude/launch.json` del brain).

✅ **Schema disegnato** il 2026-08-12 — 16 tabelle, regole RLS e le due funzioni Postgres, in [`Architecture.md`](docs/Architecture.md) §4.

✅ **Strato UI montato e verificato** il 2026-08-12: NativeWind 4.2 + Tailwind 3.4 (fissata: la v4 di Tailwind è incompatibile con NativeWind) · componenti base in stile React Native Reusables **posseduti nel repo** (`components/ui/text.tsx` col `TextClassContext`, `components/ui/button.tsx` con cva) · `lib/utils.ts` (cn) · token shadcn neutri in `global.css` come segnaposto — la direzione visiva vera arriverà nella fase di design, e sarà un cambio di variabili · lucide + react-native-svg · schermate demo del template rimosse, `app/index.tsx` segnaposto che esercita l'intera catena.
**Verifica fatta contro la realtà, non contro "compila"**: stili calcolati letti nel browser — `text-3xl font-bold` → 30px/700; bottone `rgb(229,52,93)` = `hsl(346 77% 55%)`, cioè il token `--primary` **in variante scura** (il tema scuro risponde); il testo del bottone ha preso `--primary-foreground` dal contesto senza classi esplicite. `tsc --noEmit` pulito.
⚠️ **Inciampo registrato**: un `babel.config.js` esplicito rompe la risoluzione di `babel-preset-expo` (annidato dentro `expo` nel template) → installato esplicitamente `~54.0.10`. Sintomo: `Cannot find module 'babel-preset-expo'` a ogni bundle.

**Cosa manca** (in ordine):
1. **Verificare l'app sull'iPhone vero** con Expo Go — è il passo che chiude D-23, e nessuna preview web può sostituirlo.
2. **Committare lo strato UI** nel repo del progetto e aggiornare il puntatore nel brain (ordine progetto → super-repo) — da proporre, mai eseguire senza conferma.
3. **Creare il progetto Supabase in regione UE** e generare i tipi dallo schema.
4. **Tradurre lo schema in migrazione SQL** — tutte le tabelle in una volta, creatura e giochi inclusi (D-11).
5. **Scrivere le policy RLS** e i **test avversariali** che le verificano (`Architecture.md` §7 debito 1) — non è opzionale: senza un livello applicativo nostro, una policy dimenticata è un'esposizione diretta.

**Le decisioni già prese da non rimettere in discussione senza motivo**, perché vincolano lo schema e cambiarle dopo significa migrare dati già scritti: **D-04** (lo scioglimento revoca l'accesso, non cancella; `autore_id` su ogni contenuto), **D-05** (nessuna posizione in tempo reale), **D-09** (stato separato dal disegno), **D-11** (la creatura si progetta subito anche se si implementa per ultima).

**Il filo che lega quasi tutti gli errori evitati finora**, e che vale la pena rileggere prima di ogni nuova funzione: *questo campo si può aggiungere dopo, o dopo sarebbe una migrazione di dati contesi?*
