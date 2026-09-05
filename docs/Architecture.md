# LifeCouple — Architecture

Architettura completa, con **trade-off** e **alternative scartate col loro costo**. Obblighi di contenuto: [`Rule/regole-sviluppo-sicuro.md`](../../../Rule/regole-sviluppo-sicuro.md) §1.2.

> **Stato al 2026-08-12**: architettura **progettata, non implementata**. Nessun componente esiste. Ciò che segue è il disegno da cui partirà il codice, non una descrizione di ciò che c'è.

---

## 1. Componenti e responsabilità

| Componente | Responsabilità | Dove gira |
|---|---|---|
| **App mobile** (React Native + Expo) | Interfaccia, cattura foto, inserimento luoghi, compressione lato client | Telefono dell'utente |
| **Auth** (Supabase Auth) | Registrazione, login, sessione, token | Supabase, regione UE |
| **Database** (Postgres con RLS) | Coppie, membri, eventi, luoghi, elementi delle liste, metadati foto | Supabase, regione UE |
| **Storage** (Supabase Storage) | File delle fotografie | Supabase, regione UE |
| **Policy RLS** | **Il controllo di autorizzazione vero**: chi vede quale riga | Dentro il database |
| **Macchina della partita** | Condivisa da **tutti e quattro** i giochi: partita → entrambi pronti → round → «continua» in due → conclusa, col punteggio. Scritta una volta (`usePartita`, migrazioni 0020 e 0027) | Database + app |
| **Invio sigillato** | Il congegno di **tre** giochi su quattro (quiz, telepatia, disegno): invio segreto di entrambi → **rivelazione solo quando entrambi hanno inviato**. Il confronto avviene in una **funzione Postgres**, mai nel client. ⚠️ «Obbligo o verità» **non lo usa** (D-86): la carta la devono leggere tutti e due, quindi non c'è nessun segreto da proteggere | Database |
| **Creatura — stato** | Punti di crescita, stadio derivato, umore. **Non sa come viene disegnata** | Database + app |
| **Creatura — disegno** | Riceve `stadio` e `umore`, restituisce il visivo. **Non sa da dove vengono** | App |

> **Il confine fra questi due ultimi componenti è una decisione di architettura, non un dettaglio di implementazione** (D-09). È ciò che rende sostituibile il disegno senza toccare la logica: si parte con `react-native-svg` + Reanimated e si arriva, quando ha senso, a file **Lottie** consegnati da un illustratore — stessa interfaccia, renderer diverso. Se la logica di crescita conoscesse le forme, la sostituzione costerebbe quanto rifare la funzione.
>
> **Vincolo collegato**: **~5-6 stadi discreti**, non una scala continua. Il costo dell'upgrade grafico cresce linearmente col numero di stati visivi: pochi stadi si possono far illustrare, molti no — e la versione elaborata non arriverebbe mai.

Non esiste un backend applicativo scritto da noi. L'app parla direttamente con Supabase, e **l'autorizzazione vive nel database**.

**Trade-off dichiarato**: senza un livello server nostro, ogni regola di autorizzazione che dimentichiamo di scrivere come policy RLS **non esiste** — non c'è un secondo strato che la recuperi. In cambio si eliminano un servizio da scrivere, da deployare e da mantenere (V1) e il suo costo (V2). Contropartita accettata: le policy RLS diventano l'artefatto più critico del progetto e vanno testate come tale (§7).

---

## 2. Confini di fiducia

Sono **tre**, e il secondo è quello che rende questa app diversa da un'app qualsiasi.

| # | Confine | Da cosa a cosa |
|---|---|---|
| **TB-1** | Utente ↔ backend | Il telefono è ostile per definizione: chiunque può parlare all'API con un token valido e chiedere righe non sue |
| **TB-2** | **Partner ↔ partner** | I due membri della coppia **non sono la stessa entità di fiducia**. Condividono contenuti ma non identità |
| **TB-3** | Coppia ↔ coppia | I dati di una coppia non devono essere raggiungibili da un'altra |

> ⚠️ **TB-2 è il confine caratteristico di questo prodotto, ed è quello che le app di coppia trattano peggio.** L'assunzione implicita di quasi tutte è *"sono una coppia, quindi si fidano"*. È vera finché è vera. L'architettura non deve dipendere da quell'assunzione: deve funzionare correttamente **anche quando smette di essere vera**, senza migrazioni d'emergenza su dati che nel frattempo sono diventati contesi.

---

## 3. Stack, con la motivazione di ogni scelta

| Scelta | Perché | Alternativa scartata e suo costo |
|---|---|---|
| **React Native + Expo** | Un codice per iOS e Android; accesso nativo a galleria, mappa e notifiche | **Web app**: zero store e zero review, ma niente push affidabili su iOS e niente accesso fluido alla galleria — e non insegna il passaggio "review dello store", che è parte dell'obiettivo. **Nativo separato**: due codebase per una persona sola su un progetto non core |
| **Supabase** (auth + Postgres + storage) | Tre pezzi in un servizio, piano gratuito iniziale, e la RLS come controllo di autorizzazione nel database | **AWS**: più controllo, IAM verificabile con `simulate-principal-policy`, coerenza con HeleoX — ma sproporzionato a quattro funzioni CRUD, e allunga i tempi (viola V1 e V2). **Locale peer-to-peer**: privacy per costruzione e costo zero, ma la sincronizzazione fra due dispositivi è il pezzo più difficile dell'intero progetto e non c'è backup |
| **Row Level Security come autorizzazione primaria** | Se la query applicativa è sbagliata, il dato **non esce lo stesso** | **Controllo solo nel codice dell'app**: gratis da scrivere, ma un client compromesso o una query dimenticata espone tutto. Inaccettabile con foto intime |
| **Regione UE** obbligatoria | Dati personali di residenti UE, e un trasferimento extra-UE aprirebbe un capitolo (clausole contrattuali tipo) sproporzionato al progetto | Regione USA: nessun vantaggio, costo di conformità reale |
| **Mappa: inserimento manuale** | Vedi `History.md` D-05 | Check-in automatico: più comodo, ma trasforma l'app in un tracker di persona |
| **Foto compresse lato client** | È l'unica funzione a costo non limitato (V2) | Caricamento dell'originale: qualità migliore, ma satura il piano gratuito in mesi |

### 3-bis. Strato di sviluppo e UI (deciso il 2026-08-12)

Scelto sotto due vincoli espliciti dell'utente: **scrivere meno codice possibile** e **investire il tempo risparmiato sulla UI**.

| Strato | Scelta | Perché |
|---|---|---|
| Routing | **expo-router** | Routing per file: nessuna configurazione di navigazione da scrivere |
| Stile | **NativeWind** | Tailwind dentro React Native, compilato in anticipo (nessun costo a runtime) |
| Componenti | **React Native Reusables** | Porting diretto di **shadcn/ui** su RN, modello copia-e-incolla: entra solo ciò che si usa, e il codice è proprio da subito |
| Movimento | **Reanimated + Moti** | Moti è l'API dichiarativa sopra Reanimated: un'animazione è una prop |
| Creatura | **react-native-svg** + Reanimated | Vettoriale e sostituibile con Lottie senza cambiare interfaccia (D-09) |
| Tipi | **`supabase gen types typescript`** | I tipi si **generano dallo schema**: zero tipi a mano, e uno schema che cambia rompe il build invece dell'app |
| Dati e cache | **TanStack Query** | Toglie la gran parte del codice di stato: caricamento, errore, refetch, cache |
| Icone | **lucide-react-native** | Stesso set di shadcn: coerenza visiva senza lavoro |
| Mappa | **react-native-maps** | Apple Maps su iOS, Google Maps su Android, entrambi nativi |
| Foto | **expo-image-picker + expo-image-manipulator** | Compressione lato client richiesta dal vincolo di costo |
| Liste | **FlashList** | Sostituisce FlatList senza riscrivere nulla |

**Alternative scartate, col loro costo**

- **Tamagui** — tecnicamente il più forte: un compilatore appiattisce gli stili e sul native va quasi come React Native puro. Ma **il suo vantaggio è la prestazione, e la prestazione non è il vincolo qui**: quattro schermate CRUD e due utenti. In cambio chiede di imparare un'API di stile proprietaria e poco trasferibile. Contro V1 (meno tempo), perde.
- **gluestack-ui** — ottima seconda scelta, filosofia copia-e-incolla e base NativeWind identiche. Scartata per un motivo di **leva**, non di qualità: vedi sotto.

**Il motivo di fondo della scelta shadcn, che vale più della singola libreria**: l'ecosistema di UI generabile o riusabile (v0, 21st.dev, Tailwind UI, l'intero mondo shadcn) produce **React web + Tailwind**. Scegliendo mobile si perde quella leva. Adottare **la forma shadcn + Tailwind anche su native** ne recupera la maggior parte: stessi nomi di classe, stessi nomi di componente, stessa struttura — un componente trovato o generato non si incolla, ma **si traduce quasi meccanicamente** invece di essere riprogettato. È il vero motivo per preferire React Native Reusables a gluestack: non è più bello, è **più vicino a ciò che gli strumenti sanno produrre**.

**Dove va speso il tempo risparmiato** (decisione di progetto, non consiglio generico): componenti standard presi dalla libreria **senza toccarli** — form, bottoni, input, sheet — perché sono il 70% delle schermate e nessuno li guarda; tutto il tempo risparmiato su **tre schermate**: mappa dei ricordi, griglia foto, apertura. Più due cose che costano quasi nulla e cambiano la percezione più della libreria scelta: **token definiti prima** (una scala tipografica, una di spazio, due accenti) e un **font non di sistema** via `@expo-google-fonts`.


### 3-ter. Cosa è cambiato costruendolo davvero (verificato il 2026-08-27)

La tabella qui sopra è **la decisione del 2026-08-12**, presa prima di scrivere codice, e resta scritta com'era. Questa sezione dice **com'è andata**: tre librerie previste non sono mai entrate, e una quarta è stata usata in modo diverso da come era stata immaginata. Sono divergenze fra piano e realtà — dichiararle è obbligatorio (`regole-sviluppo-sicuro.md`, principio 7: nessun gap silenzioso), perché una tabella di stack che elenca librerie assenti fa perdere mezz'ora a chiunque la legga per capire dove sono.

| Previsto | Realtà al 2026-08-27 | Perché |
|---|---|---|
| **Moti** (API dichiarativa sopra Reanimated) | **Mai installato.** Si usa **Reanimated 4 direttamente**, più uno strato di movimento nostro | Moti risolve *«scrivere un'animazione in una prop»*. Il problema vero, emerso costruendo, era un altro: **far muovere tutta l'app allo stesso modo**. Una prop dichiarativa non impedisce a due schermate di usare due molle diverse; un file di token sì. Vedi D-53 |
| **TanStack Query** | **Mai installato.** I dati stanno in hook nostri (`lib/eventi.ts`, `lib/luoghi.ts`, `lib/preferiti.ts`, `lib/evento-dettaglio.ts`) | Non è stata una scelta: è successo. Ogni hook è nato per una schermata, e quando si è visto che facevano tutti la stessa cosa, funzionavano già. **È un debito, non un merito** — vedi §7.5 |
| **FlashList** | **Mai installata.** Si usa `FlatList` | Non è mai servita. Le liste vere hanno le decine di elementi, non le migliaia; l'unica lunga — la striscia dei giorni, 730 celle — regge benissimo con `getItemLayout`, che le dà le posizioni **senza misurare** (ed è ciò che ha chiuso B-06) |
| **`supabase gen types typescript`** | Usato, ma `lib/database.types.ts` ha **blocchi scritti a mano** per le migrazioni 0011→0016 | Debito noto e primo punto del PUNTO DI RIPRESA in `History.md`. Ogni migrazione nuova va aggiunta a mano finché non si rigenera |

**Lo strato di movimento** che ha preso il posto di Moti (D-53, 2026-08-27):

| File | Responsabilità |
|---|---|
| `lib/movimento.ts` | I **token**: tre molle (`tocco` rigida, `entrata` morbida, `scivolo` in mezzo), le durate per ciò che sfuma, la cascata col suo tetto, il riscontro tattile |
| `components/ui/premibile.tsx` | Il cedimento sotto il dito, uguale per ogni comando dell'app |
| `components/ui/comparsa.tsx` | Entrata **e uscita**, con smontaggio ritardato — la metà che manca sempre |

> **Perché sta in architettura e non solo in `History.md`**: è la stessa scelta di `lib/tema.ts` per i colori, e ha la stessa conseguenza strutturale. Un componente nuovo che si anima da sé è libero di divergere; uno che legge da qui non può. La regola operativa è: **nessun `withSpring` con numeri scritti sul posto** — se serve una molla nuova, si aggiunge a `lib/movimento.ts` con la sua ragione.

---

## 4. Il modello dati, e perché la sua forma è una decisione di sicurezza

> **Schema disegnato il 2026-08-12**, dopo la chiusura delle quattro decisioni bloccanti (D-14…D-17). Copre **tutte** le funzioni, creatura e giochi inclusi, anche se l'implementazione le rimanda in fondo (D-11).

### 4.1 Le tabelle

```mermaid
erDiagram
    coppia ||--o{ membro_coppia : "ha 2"
    coppia ||--o{ invito : genera
    coppia ||--|| creatura : possiede
    coppia ||--o{ punti_evento : accumula
    coppia ||--o{ evento : ""
    coppia ||--o{ luogo : ""
    coppia ||--o{ lista : ""
    coppia ||--o{ elemento_lista : ""
    coppia ||--o{ foto : ""
    coppia ||--o{ partita : ""
    luogo  ||--o{ foto : "ha foto"
    lista ||--o{ elemento_lista : "le voci di una wishlist"
    elemento_lista ||--o{ recensione : "una per membro"
    partita ||--o{ invio_sigillato : raccoglie
    partita ||--|| partita_risultato : produce
    domanda ||--o{ invio_sigillato : ""
```

> **Perché la locandina è un percorso TMDB e non un file nello storage** (0023): salvarla consumerebbe il tetto di 1 GB (D-22) per un'immagine che TMDB serve già da CDN in cinque formati. *Alternativa scartata*: scaricare e archiviare; costo: quota della coppia bruciata da copertine che non sono ricordi suoi. *Rischio accettato*: se TMDB cambia i percorsi le locandine si rompono insieme — tollerabile perché ripescabili.
>
> ⚠️ **E la fonte è TMDB, non Google**, che per i film non ha un'API: la richiesta originale diceva «da Google» ed è stata soddisfatta nella sostanza, non alla lettera.

> **Perché un posto desiderato e un posto visitato non stanno più nello stesso elenco** (D-70, 0024): hanno **cicli di vita diversi** — il primo si aggiunge, si rimanda e a volte si cancella; il secondo non cambia più. Tenerli insieme obbligava ogni schermata a filtrare, e ogni filtro dimenticato mostrava desideri fra i ricordi. *Alternativa scartata*: tenerli insieme e filtrare meglio; costo: la correttezza dipende dal fatto che chi scrive la prossima schermata si ricordi del filtro — cioè la stessa speranza che D-60 ha già smontato una volta.
>
> ⚠️ **Corretto il 2026-08-28 (D-72)**: la nota qui sopra descriveva anche il nascondere i desideri dalla mappa. Quella metà è stata **ritirata** — nascondere un posto desiderato lo rendeva invisibile proprio sulla superficie che serve a decidere dove andare. Resta vero il resto: i due cicli di vita sono diversi, e l'**elenco** continua a mostrare solo ciò su cui si può agire.
>
> ⚠️ **La promozione non è codice nuovo**: spuntare la riga di lista scrive già `luogo.stato` (dal 2026-08-13) e `aggiorna_ristoranti_visitati` spunta da sé le serate passate. Il confine è nel punto giusto proprio perché il passaggio esisteva già.

**Identità e legame**

| Tabella | Colonne che contano | Nota |
|---|---|---|
| `coppia` | `id`, `stato` (attiva/sciolta), `creata_il`, `sciolta_il`, `byte_foto_usati` | Il contatore serve a **imporre** il tetto foto, non solo a mostrarlo |
| `membro_coppia` | `coppia_id`, `utente_id`, `entrato_il`, **`uscito_il`** | ⚠️ L'appartenenza è un **intervallo**, non un fatto permanente (D-04) |
| `invito` | `coppia_id`, `creato_da`, **`token_hash`**, `scade_il`, `usato_il`, `aperto_da`, `stato` | ⚠️ Si salva **l'impronta del token, non il token**: se il database trapela, i link non sono utilizzabili. Stato: `emesso` → `aperto_in_attesa_conferma` → `accettato` / `scaduto` / `revocato` (D-14) |

**Contenuti** — tutti con `coppia_id` **e** `autore_id`

| Tabella | Colonne che contano |
|---|---|
| `evento` | `titolo`, `inizio`, `fine`, `tutto_il_giorno`, `nota` |
| `luogo` | `nome`, `lat`, `lng`, **`stato`** (desiderato/visitato), **`visitato_il`**, `nota` — la mappa li mostra **tutti** e li distingue con **tre icone** (**D-72**); il filtro «solo visitati o con evento» di D-70 è rimasto **solo nell'elenco** |
| `lista` | `nome`, `pastello`, **`tipo`** (voce/film/luogo), **`predefinita`** (le tre di partenza: un trigger ne vieta la cancellazione, 0025), `creata_il` — le **wishlist create dalla coppia** (0022/0023). Nasce con la coppia via trigger, come la creatura. `update`/`delete` **solo-autore** |
| `elemento_lista` | **`tipo`** (film/luogo/voce), `titolo`, **`stato`** (desiderato/fatto), **`fatto_il`**, **`lista_id`**, **`tmdb_id`** + **`locandina`** (0023) |
| `recensione` | `elemento_id`, `autore_id`, `voto`, `testo` — **una per membro**, vincolo unico su (elemento, autore) |
| `foto` | `chiave_storage`, **`luogo_id`** (facoltativo), `scattata_il`, `byte` |

> **Perché le voci di una wishlist stanno in `elemento_lista` e non in una tabella loro** (0022): perché `elemento_lista` ha già la transizione `desiderato → fatto`, ed è quella transizione che alimenta la creatura (D-15) tramite un trigger. Una tabella separata avrebbe richiesto un **secondo trigger dei punti**, cioè due strade per guadagnarli — e due strade che fanno la stessa cosa divergono al primo ritocco (è la lezione di B-19, qui applicata allo schema invece che al codice). *Alternativa scartata*: `voce_wishlist` autonoma; costo: trigger duplicato, recensioni irraggiungibili, e la creatura che si nutre solo di metà delle cose fatte.
>
> ⚠️ **Conseguenza da conoscere**: `elemento_lista.lista_id` è **nullable**, e il null significa *«questa riga è un luogo della mappa»* (D-46), non *«dato mancante»*. È il prezzo del riuso: una colonna che è obbligatoria per metà tabella e vietata per l'altra metà. Il vincolo che la renderebbe `not null` **non si può mettere**, ed è scritto nella migrazione perché nessuno ci provi credendo di sistemare una svista.

> **Perché `recensione` è una tabella separata e non due colonne su `elemento_lista`**: sono **due persone** e possono avere due opinioni sullo stesso film. Metterle nell'elemento costringerebbe a un'unica recensione di coppia — che è la cosa meno interessante che si possa fare in un'app per due. Alternativa scartata: campo unico condiviso; costo: si perde il confronto, che è metà del divertimento.

**Creatura e punteggio** (D-15, D-16)

| Tabella | Colonne | Nota |
|---|---|---|
| `creatura` | `coppia_id` (chiave), `punti`, `creata_il` | ⚠️ **Nessun `autore_id`**: è l'unico oggetto senza autore, ed è il motivo per cui allo scioglimento si cancella invece di essere revocata (D-16) |
| `stadio_soglia` | `stadio`, `punti_minimi` | Lo **stadio si deriva dai punti**, non si salva. Tabella e non costante nel codice: le soglie si tarano senza migrazione |
| `punti_evento` | `coppia_id`, `tipo`, `riferimento_id`, `punti`, `creato_il` | ⚠️ **Vincolo unico su (coppia, tipo, riferimento)**: è la guardia che impedisce di fabbricare punti togliendo e rimettendo lo stesso elemento (D-15) |

**Giochi** (D-12, D-19)

| Tabella | Colonne | Nota |
|---|---|---|
| `domanda` | **`coppia_id` che può essere NULL**, `gioco`, `lingua`, `testo`, e dal 2026-09-02 `partita_id`, `autore_id`, `tipo` | 🔑 `NULL` = banco comune scritto da noi (D-08 garantito); valorizzato = **contenuto di quella coppia** (D-19, non controllabile — vedi R-06). Il banco comune non ci è mai entrato: vive in `lib/parole.ts` perché è bilingue e immutabile, quindi qui dentro ci sono **solo** le righe scritte dai due. `partita_id` è la decisione rimandata resa visibile (D-88): oggi si legge filtrando per partita, e il giorno che si decidesse per un banco della coppia che cresce basta togliere il filtro — la strada opposta non si recupera. `autore_id` serve a due cose: contare quante ne ha scritte l'altro durante la preparazione, e impedire di cancellare le sue |
| `partita` | `coppia_id`, `gioco`, `modo`, `stato`, `round_totali`, `round_corrente`, `punti` | `modo` (**0028**): `ufficiale` o `personalizzata`, sulla **riga della partita** e non nello stato dell'app — i due telefoni non si accordano, chi arriva secondo si aggancia, quindi lo decide chi apre e l'altro lo trova scelto (D-88). Stati **dal 2026-08-28** (migrazione 0020): `attesa` → `in_corso` → `conclusa`, più `abbandonata`. I vecchi (`invito` → `deposito` → `tentativi`) descrivevano una partita a domande e non reggevano né «entrambi premono avvia» né i round |
| `partita_pronto` | `partita_id`, `utente_id` | Una riga per persona. **Non due colonne booleane**: «puoi scrivere solo la TUA colonna» in RLS si esprime male, `utente_id = auth.uid()` si legge da solo |
| `partita_round` | `partita_id`, `numero`, `disegnatore_id`, `opzioni`, `chiave_rivelata`, `esito`, `punti` | `opzioni` è **ciò che i due devono vedere uguale**: le quattro scelte della telepatia, la domanda e le quattro risposte del quiz, la carta di obbligo o verità (`{tipo, chiave}`). `chiave_rivelata`: la parola del disegno, scritta solo **a round finito**. ⚠️ `disegnatore_id` lo riempie **solo** il disegno: quiz e obbligo o verità deducono il turno da `creata_da` e dal numero (B-30), e non registrarlo è ciò che rende non calcolabile «chi ha passato di più» (D-87) |
| `round_pronto` | `round_id`, `utente_id` | **Dal 2026-09-01** (migrazione 0027): «sono pronto ad andare avanti», una riga per persona **per round**. Stessa forma di `partita_pronto` un piano più in basso, e non la stessa tabella perché questa risposta **scade a ogni round**: riusarla avrebbe voluto dire cancellarne le righe, cioè distruggere l'informazione che fa partire la partita |
| `round_segreto` | `round_id`, `chiave` | 🔴 **La parola che chi indovina non legge.** Sta in una tabella a parte e non in una colonna di `partita_round` per una ragione tecnica precisa: **la RLS decide quali righe si leggono, non quali colonne** — e la riga del round a chi indovina serve, perché contiene numero e ruoli |
| `invio_sigillato` | `partita_id`, `round`, `autore_id`, `natura` (verità/tentativo/scelta), `domanda_id`, `contenuto` | 🔴 **La tabella che l'altro non legge mai** |
| `partita_risultato` | `partita_id`, `esito`, `punti_assegnati`, `rivelato_il` | Ciò che diventa visibile a entrambi **dopo** la rivelazione |
| `profilo_coppia` | `coppia_id` (chiave primaria), `conosciuto_da`, `fascia_eta`, `convivenza`, `interesse`, `consenso_il` | **Dal 2026-09-04** (migrazione 0029, D-98). 🔴 **L'unica tabella del sistema che non serve a erogare il servizio**: sono risposte facoltative che servono a noi, e la loro base giuridica è il **consenso** (art. 6.1.a), non il contratto. Tre conseguenze nella forma: **ogni colonna è `null`** (nessuna domanda obbligatoria), **non esiste una colonna `ha_acconsentito`** — la riga esiste solo se il consenso c'è stato, e revocarlo significa cancellarla, così lo stato «risposte presenti, consenso falso» non è nemmeno rappresentabile — e la chiave è la **coppia**, non l'utente, così la riga muore con la coppia per `on delete cascade` senza una regola speciale allo scioglimento. Le risposte sono a scelta chiusa con `check`, mai testo libero, e restano dentro «vita di coppia» per **D-08** |
| `registro_azioni` | `coppia_id`, `autore_id`, `azione`, `oggetto`, `creato_il` | Solo-append: risponde al *"non sono stato io a cancellarle"* (TB-2, categoria R) |

### 4.1-bis Le partite dei giochi, come sono costruite davvero (2026-08-28)

**Il banco delle 1000 parole non è nel database**: sta in `lib/parole.ts`, e nel database viaggiano **solo le chiavi** (`dog`, `red`…), neutre rispetto alla lingua. È ciò che permette a due partner con il telefono in lingue diverse di giocare la **stessa** partita vedendo ognuno la propria. *Alternativa scartata*: le voci nella tabella `domanda` — costava un viaggio di rete per ogni parola mostrata, una semina per ambiente, e rendeva possibile che le due liste divergessero.

🔑 **Conseguenza: è il client di turno a pescare la parola**, non una funzione Postgres. Non è un rilassamento di «l'autorizzazione sta nel database»: quella regola esiste dove c'è **un avversario**, e in un gioco di coppia il punteggio è condiviso — barare significa rubare punti a sé stessi. L'unica cosa da proteggere è che chi indovina non legga la parola, e **quella** sta nel database con la sua policy.

**I tratti del disegno non toccano il database.** Viaggiano nel canale **broadcast** di Supabase Realtime, normalizzati fra 0 e 1 (non in punti-schermo: due telefoni di larghezza diversa riceverebbero il disegno tagliato), e non si salvano da nessuna parte. Conseguenza voluta: **le tre domande aperte da P-04 — contenuto personale o condiviso (D-04/D-21), conservazione, tetto di 1 GB (D-22) — non esistono più**, invece di essere risolte.

**In publication realtime** stanno `partita`, `partita_pronto`, `partita_round`, `round_pronto` (0027) e `domanda` (0028, per vedere la preparazione dell'altro mentre scrive): i cambi di stato, la prontezza, i round e i «continua». ✅ Che `round_pronto` ci sia davvero è stato **verificato il 2026-09-02**, e non leggendo `pg_publication_tables` (con la chiave dell'app non è leggibile) ma facendo arrivare l'evento a un secondo client dentro `tests/partita.mjs`: il catalogo dice che la tabella è *dichiarata*, l'evento dice che il meccanismo *funziona*. ⚠️ **Non** `invio_sigillato`, e non è una dimenticanza: la sua RLS nasconde la riga dell'altro, quindi l'evento non arriverebbe comunque a chi aspetta. Per questo la telepatia **interroga `rivela_telepatia` a intervalli** invece di ascoltare.

### 4.2 Le regole di accesso (policy RLS)

Due funzioni di supporto, e tutto il resto ne discende:
- `e_membro_attivo(coppia_id)` → l'utente corrente ha una riga in `membro_coppia` con `uscito_il IS NULL`
- `e_autore(riga)` → `autore_id = auth.uid()`

**Due assi indipendenti, e tenerli separati è ciò che rende semplice il modello** (precisazioni dell'utente del 2026-08-12):

- **Visibilità: tutto è di entrambi.** Ogni contenuto della coppia è visibile a entrambi i membri attivi, senza eccezioni per tipo. La galleria generale mostra **tutte** le foto della coppia — quelle di lui e quelle di lei; un luogo mostra **tutte** le foto legate a quel luogo, di entrambi; un elemento mostra **entrambe** le recensioni.
- **Cancellazione e modifica: sempre e solo l'autore.** Una regola sola, per ogni tabella di contenuto. Chi carica, comanda su ciò che ha caricato.

| Azione | Regola |
|---|---|
| Leggere un contenuto | `e_membro_attivo(coppia_id)` |
| Crearlo | `e_membro_attivo(coppia_id)` **e** `autore_id = auth.uid()` **imposto dal database** — mai accettato dal client |
| Modificarlo o cancellarlo | **Solo `e_autore`** — per **ogni** tipo di contenuto |
| `invio_sigillato` | **SELECT solo sulle proprie righe.** Nessuna eccezione, in nessuna fase |
| `registro_azioni` | INSERT sì, UPDATE e DELETE **nessuna policy** = impossibili |
| `domanda` | Leggibile se `coppia_id IS NULL` **oppure** `e_membro_attivo(coppia_id)`. 🔴 Dalla **0028** si **scrive e si cancella solo per sé** (`autore_id = auth.uid()`): senza, un telefono potrebbe riempire il set a nome del partner e far partire la partita da solo, o svuotare il suo. Nessuna policy di `update`: una carta si cancella e si riscrive, perché correggerla dopo che è stata giocata cambierebbe il passato di una partita |
| `profilo_coppia` | **SELECT** ai membri attivi della coppia (serve a rileggere le proprie risposte, art. 15). 🔴 **Nessuna policy di scrittura**: si passa da `salva_profilo_coppia()` e `cancella_profilo_coppia()`, come per `coppia` e `membro_coppia`. La seconda **è la revoca del consenso** (art. 7.3) e cancella la riga, non la disattiva |

> **Le foto legate a un luogo non sono una collezione separata**: `foto.luogo_id` è facoltativo, la galleria generale è *tutte le foto della coppia* e la vista di un luogo è *le foto con quel `luogo_id`*. Una foto sta in entrambe le viste perché è **una sola riga**, non due — nessuna duplicazione, nessuna sincronizzazione da mantenere.

**Piccolo costo accettato**: se un membro aggiunge un film sbagliato, l'altro **non può correggerlo**. È il prezzo della regola unica, ed è preferibile all'alternativa — dare a entrambi il potere di cancellare renderebbe possibile svuotare per ritorsione ciò che l'altro ha costruito.

### 4.2-bis Cosa succede allo scioglimento — qui, e **solo** qui, i contenuti si dividono

La cancellazione ha una regola sola (§4.2). Lo scioglimento no: **due classi**, e la linea non è chi può cancellare ma **quanto è sensibile il contenuto**.

| Classe | Sorte | Perché |
|---|---|---|
| **Personale** (`foto`, `recensione`) | Resta **solo all'autore** | È il caso per cui D-04 esiste: una copia permanente di materiale intimo a un ex è **il danno**, non la soluzione |
| **Condiviso** (`elemento_lista`, `luogo`, `evento`) | **Duplicato: una copia a ciascuno**, e il legame è reciso | Sono esperienze fatte insieme: conservarle **non rivela all'altro niente che non sapesse già**, ed è il test che distingue i due casi. Le foto legate a un luogo seguono la **loro** classe: la copia di chi non le ha caricate contiene il luogo, non le foto altrui |
| **Creatura** | **Sparisce per entrambi** | Non ha autore (D-16) |

*Il principio, in una riga*: **la sorte segue la sensibilità, non la condivisione.** La domanda che decide ogni caso futuro è — *conservarne una copia rivela all'ex qualcosa che non aveva già?*

**Costo della duplicazione**: è un'operazione una tantum dentro la funzione di scioglimento, non una complicazione permanente dello schema. **Alternativa scartata**: lasciare i contenuti condivisi visibili a entrambi in sola lettura — costa meno codice, ma **lascia i due account legati per sempre**, che è esattamente ciò che uno scioglimento deve evitare.

⚠️ **Regola di progetto**: *nessuna tabella senza RLS*, verificata da un test che fallisce se una tabella ne è priva. È il debito n. 1 di §7: senza un livello applicativo nostro, una policy dimenticata è un'esposizione diretta.

### 4.3 Le due funzioni che il client non può sostituire

Sono l'unica logica che **non** può stare nell'app, perché il client è ostile per definizione:

0. **`segna_pronto(partita_id)`** e **`chiudi_round(...)`** (0020) — la prima fa partire la partita quando la **seconda** persona è pronta; la seconda chiude un round e, all'ultimo, la partita. ⚠️ `chiudi_round` è **idempotente**: un round già chiuso torna senza fare nulla, perché i due telefoni possono chiuderlo insieme e i punti raddoppierebbero. Verificato con un'asserzione dedicata in `tests/partita.mjs`.

0-bis. **`rivela_telepatia(partita_id, round)`** (0020) — è la funzione che questo elenco prometteva. Restituisce **niente** finché manca una delle due scelte: non «la tua sì e la sua no», niente — rispondere a metà direbbe *quando* l'altro ha scelto, e in un gioco in cui si sceglie al buio anche quello è un'informazione di troppo.

1. **`rivela_partita(partita_id)`** — verifica che **entrambi** abbiano inviato, poi confronta e scrive `partita_risultato`. Finché uno solo ha inviato, non restituisce nulla. È ciò che rende il sigillo reale invece che grafico (D-12).
2. **`assegna_punti(coppia_id, tipo, riferimento_id)`** — inserisce in `punti_evento` rispettando il vincolo unico e incrementa `creatura.punti`. Chiamata da trigger sulla **transizione** `desiderato → visitato/fatto`, mai sull'inserimento (D-15).

**Rischio accettato su `assegna_punti`**: cancellare del tutto un luogo e ricrearlo genera un nuovo riferimento, quindi nuovi punti. Non lo si impedisce: è un gioco **cooperativo senza classifica**, quindi l'unico effetto è ingannare sé stessi. Se un domani nascesse un confronto fra coppie, questa riga andrebbe rivista **prima**.

### 4.4 Perché il ciclo mestruale non è nello schema, e non è un'incoerenza

D-11 impone di prevedere **subito** creatura e giochi anche se si implementano per ultimi. Il ciclo (D-07) è rimandato **anche nello schema**, e la differenza è precisa: creatura e giochi **toccano altre tabelle** — i punti nascono dalle transizioni di luoghi ed elementi, quindi quelle tabelle devono nascere con le colonne giuste. Il ciclo invece è **una tabella isolata** che non tocca nulla: aggiungerla domani non è una migrazione di dati contesi, è una tabella in più.

*La regola generale, riusabile*: si anticipa nello schema ciò che **modifica tabelle esistenti**; si rimanda ciò che **si aggiunge di fianco**.

> **"Scioglimento" — definizione, perché il termine ricorre ovunque nei documenti.** È **l'azione con cui uno dei due chiude il legame fra i due account**, non necessariamente una rottura sentimentale. Copre quattro casi reali: la coppia si lascia · ci si è appaiati con **la persona sbagliata** (link finito a chi non doveva, o una prova) · uno **smette di usare l'app** e non vuole lasciare i propri dati visibili all'altro · uno vuole uscire **per ragioni di sicurezza personale**.
> È una funzione obbligatoria: senza, l'unica uscita da uno spazio condiviso sarebbe cancellare il proprio account. Nell'interfaccia avrà un nome più umano (*"non condividere più con…"*); "scioglimento" è il termine preciso della documentazione.

**Due campi portano tutto il peso**, e sono i due che è facile non mettere:

- **`autore_id` su ogni contenuto.** Senza, non si può rispondere a *"di chi è questa foto?"* — e quella domanda diventa obbligatoria il giorno della rottura, e obbligatoria per legge quando un utente esercita l'art. 17 GDPR. Aggiungerlo dopo significa attribuire retroattivamente contenuti già contesi: non si può fare correttamente.
- **`uscito_il` su `membro_coppia`.** L'appartenenza alla coppia è un **intervallo**, non un fatto permanente. È ciò che rende esprimibile in una policy RLS la frase *"vedi i contenuti della coppia finché ne fai parte"*.

**Regola di accesso** (da tradurre in policy RLS, una per tabella, sia in lettura sia in scrittura):

| Azione | Chi può |
|---|---|
| Leggere un contenuto della coppia | Chi è membro **attivo** della coppia |
| Creare un contenuto | Chi è membro attivo; `autore_id` = chiamante, **imposto dal database**, non dal client |
| Modificare / cancellare un contenuto | **Solo l'autore** |
| Leggere dopo lo scioglimento | Solo i contenuti di cui si è **autori** |

**Conseguenza voluta di D-04**: lo scioglimento **revoca l'accesso, non cancella**. Ciascuno conserva ciò che ha caricato; ciò che ha caricato l'altro sparisce dalla sua vista. Nessuna copia silenziosa a nessuno dei due.

**Alternative scartate col loro costo**:
- *Tutto in comune e alla rottura si cancella tutto* — semplice, ma distrugge irreversibilmente i ricordi di **entrambi** per decisione di **uno**.
- *Tutto in comune e alla rottura entrambi tengono copia* — è la peggiore per la privacy: consegna a un ex-partner una copia permanente di materiale intimo dell'altro, con l'app come complice tecnico.

---

## 5. Flussi di dati

1. **Appaiamento** — `—` **da decidere** (codice di invito, link, email). È il primo attraversamento di TB-2 e determina lo schema: finché non è deciso, le policy RLS non si possono scrivere. È la voce più bloccante del backlog.
2. **Foto**: scatto o scelta dalla galleria → **compressione sul telefono** → caricamento nello storage → riga di metadati nel database con `autore_id` e `coppia_id`. Il file non passa mai da un nostro server, perché non ne esiste uno.
3. **Luogo**: l'utente cerca o tocca un punto sulla mappa → si salva **coordinata e nota**, mai una posizione rilevata dal dispositivo (D-05).
4. **Cancellazione account**: obbligatoria in-app per Apple. Ordine deliberato — **prima i file nello storage, poi le righe indice**, perché l'ordine inverso lascia file orfani che nessuna query trova più. È lo stesso errore già trovato e corretto su HeleoX (`Rule/catena-cancellazione.md`), e va **verificato end-to-end**, non assunto.

---

## 6. Eccezioni di costo e scala (scelte consapevoli, non omissioni)

| Cosa non c'è | Perché | Quando si riconsidera |
|---|---|---|
| Backend applicativo proprio | Nessuna logica che debba girare in un posto fidato: sono quattro CRUD | Se nasce logica che il client non può eseguire (pagamenti, moderazione) |
| Cifratura end-to-end delle foto | Costo di complessità alto (gestione chiavi fra due dispositivi, recupero dopo cambio telefono) sproporzionato a V1 | Se il prodotto smette di essere un esperimento — è **il primo upgrade di sicurezza** da fare |
| Piano a pagamento del backend | Il gratuito basta all'inizio (V2) | Al superamento del tetto foto |
| Monitoraggio e allarmi | Nessun utente, nessun ricavo | Ai primi utenti reali fuori dalla cerchia |
| Disaster recovery formale | I dati sono di esperimento; l'utente ha gli originali delle foto sul telefono | Se qualcuno ci mette dentro ricordi che non ha altrove — **momento in cui il rischio diventa reale e non tecnico** |

### Costo ricorrente reale (verificato il 2026-08-12)

| Voce | Costo |
|---|---|
| **Expo** — piano gratuito: **30 build al mese** (max 15 iOS), 1.000 utenti attivi su EAS Update | **0 €** |
| **Supabase** — piano gratuito: 500 MB database, **1 GB file**, 50.000 utenti attivi | **0 €** |
| **Mappa** — SDK nativo su entrambe le piattaforme | **0 €** — ⚠️ ma **ricerca luoghi e geocodifica si pagano a chiamata**: va tenuta d'occhio se si aggiunge la ricerca per nome |
| Apple Developer | 99 €/anno |
| Google Play | 25 $ una tantum |

**Ricorrente in fase di sviluppo e primi utenti: ~99 €/anno.**

⚠️ **Due soglie fanno passare Supabase al piano Pro (25 $/mese, ~300 €/anno), e vale la pena conoscerle prima di incontrarle:**

1. **Lo spazio**: il piano gratuito ha **1 GB di file in totale**, che è esattamente il tetto di una singola coppia (D-22). Il consumo *reale* atteso è però ~150 MB a coppia con la compressione lato client, quindi la soglia si incontra intorno alle **5-7 coppie**, non alla prima.
2. ⚠️ **La pausa per inattività**: i progetti gratuiti **si sospendono dopo una settimana senza attività**. Per un'app pubblicata è un rischio concreto proprio nella fase iniziale — un'app appena uscita con pochissimi utenti *può* restare ferma una settimana, e il primo che torna trova errori. Con un'attività anche minima non succede, ma è il motivo per cui il piano gratuito è adatto allo sviluppo e discutibile per la pubblicazione.

**Quindi**: ~99 €/anno finché è un esperimento fra poche coppie; **~400 €/anno** se diventa un'app pubblicata che vuole essere affidabile. Il salto è dovuto tanto alla pausa quanto allo spazio.

### Ordine di implementazione (deciso il 2026-08-12)

L'utente ha deciso di implementare **la creatura per ultima**. Sequenza che ne deriva: autenticazione e appaiamento → calendario → mappa → foto → liste → **giochi di affinità → creatura**.

⚠️ **Ma lo schema del database deve prevederla dal primo giorno.** Punti di crescita, stadio e le risposte dei giochi non si aggiungono a posteriori senza migrare dati già scritti: è lo stesso vincolo di `autore_id` (D-04) e della separazione stato/disegno (D-09). **Si progetta subito, si implementa per ultima** — sono due cose diverse e vanno tenute separate.

---

## 7. Debiti tecnici noti, dichiarati alla nascita

1. **Le policy RLS sono un punto di guasto singolo.** Senza un secondo strato applicativo, una policy sbagliata è un'esposizione diretta. → **Test avversariali obbligatori**: due coppie di prova, e la verifica esplicita che l'utente A non legga nulla della coppia B, e che un ex-membro non legga i contenuti dell'altro. È verifica *contro la realtà*, non "la query sembra giusta" (`regole-sviluppo-sicuro.md` principio 4).
2. **Portabilità**: auth, dati e file su un solo fornitore. Migrare significa riscrivere l'autorizzazione, non solo spostare righe.
3. **Nessuna moderazione dei contenuti.** Un'app che ospita foto private caricate da utenti terzi ha, prima o poi, un problema di contenuti. Oggi non esiste alcun meccanismo: è un gap **dichiarato**, non risolto.
4. **Il tetto di spazio foto non è fissato** (`—`). Finché non lo è, il costo massimo del progetto è ignoto — cioè V2 non è verificabile.
5. **Lo stato del server è in hook scritti a mano**, non in una libreria di data-fetching (§3-ter). Ogni hook rifà a modo suo caricamento, errore, ricarica e invalidazione: da qui vengono B-09, B-10 e B-13 — tre difetti con la **stessa forma**, *due copie dello stesso stato di cui una non viene aggiornata*. La regola che li tiene a bada — «se una schermata legge dati che un'altra può scrivere, deve rileggere al focus» — è **disciplina, non struttura**: vale finché qualcuno se la ricorda. È il debito con la probabilità più alta di produrre il prossimo difetto.
6. **La sezione «Commenti» è tornata dopo essere stata tolta nella stessa giornata** (D-56 → D-57). Non è un debito di codice ma di **nomi**: si chiamava «Parole», e un nome che non dice cosa fa una cosa fa prendere decisioni sbagliate su di essa. Vale come promemoria per ogni etichetta futura.
