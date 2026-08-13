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

### D-34 — Mappa, luoghi e foto: tutto ciò che serviva a chiudere il modello di D-33
**Implementati il 2026-08-13 (sera)** su richiesta dell'utente. Migrazioni `0009` e `0010`.

**La mappa** (`react-native-maps`, Apple Maps su iOS, inclusa in Expo Go: nessuna development build). I posti si segnano in **due modi, entrambi espliciti** — tocco lungo sul punto, o «segna dove sono adesso». *Perché conta*: la posizione non viene letta né all'avvio né in background, e **nessuno dei due può sapere dove si trova l'altro adesso**. È D-05, e vale più di qualunque funzione che potrebbe abilitare. Toccando un posto si aprono i suoi eventi, e da lì si entra nella pagina dell'evento.

**Il legame evento↔luogo** si sceglie nel foglio dell'evento, fra i posti già segnati. Non si creano luoghi da lì: *un posto nasce dove lo si tocca, non da un campo di testo che non sa dov'è*.

**Le foto**: bucket **privato**, indirizzi **firmati e a scadenza** (un indirizzo che non scade è una foto pubblica con un nome difficile), compressione prima del caricamento — l'originale resta sul telefono (D-06) — e tetto di 1 GB imposto dal trigger (D-22). Il confine passa dal **percorso** `<coppia_id>/<file>`: le policy dello storage leggono la prima cartella e chiamano `e_membro_attivo`, cioè la stessa regola di appartenenza delle tabelle. Se un giorno cambia, cambia in un posto solo.

### B-04 — Il trigger che doveva proteggere la cancellazione la impediva (2026-08-13, CHIUSO)
**Sintomo**: dopo aver applicato `0009`, il test *"dopo la rottura si può ancora cancellare il proprio (art. 17)"* è andato **rosso**: `Direct deletion from storage tables is not allowed. Use the Storage API instead.`

**Causa**: il trigger di `0009` cancellava il file con `delete from storage.objects` quando spariva la riga `foto`. Sembrava la strada più solida — il file segue la riga sempre, chiunque cancelli — ma Supabase vieta quella scrittura, e il rifiuto faceva fallire **l'intera transazione**: nessuno riusciva più a cancellare una foto.

**Correzione** (`0010`): trigger rimosso, il file si cancella dallo Storage API subito prima della riga. ⚠️ **Limite dichiarato**: se l'app muore fra i due passi resta un file orfano — invisibile, perché il bucket è privato e nessuna riga lo indica — che è il male minore rispetto a una riga che punta al vuoto. Si chiude davvero con la cancellazione dell'account, dove il bucket della coppia va svuotato per intero.

**Lezione**: una funzione scritta **per** proteggere la catena di cancellazione la stava spezzando, e non si vedeva leggendo il codice — solo eseguendolo. È il terzo caso in due giorni in cui il test avversariale trova ciò che la lettura non trova (B-01, la rieseguibilità dell'invito, questo).

### D-33 — L'evento è il centro: calendario, mappa e recap sono **tre viste della stessa cosa**
**Deciso dall'utente il 2026-08-13 (sera).** Migrazione `0008`.

**Il modello**: un evento ha un momento, e può avere **un luogo**, **delle foto** e **dei commenti**. Il calendario lo guarda nel tempo, la mappa nello spazio, il recap in elenco — ma la cosa guardata è sempre la stessa, e tutte e tre le strade portano alla **pagina dell'evento** (`app/evento/[id].tsx`), dove c'è tutto quello che di quel momento è rimasto.

**Perché è una semplificazione e non un'aggiunta**: prima mappa e calendario sarebbero state due funzioni con due modelli di dati paralleli — luoghi da una parte, eventi dall'altra, e le foto in un terzo posto. Così invece c'è **una** entità e tre proiezioni: meno codice, e soprattutto nessuna domanda del tipo "questa foto appartiene al luogo o alla serata?".

**Luogo e foto restano facoltativi**: un impegno di lavoro non ha un posto da ricordare, una foto può vivere da sola nella galleria. Renderli obbligatori costringerebbe a inventare dati per far entrare la realtà nello schema.

⚠️ **I commenti sono personali** (D-21): alla rottura restano a chi li ha scritti, non si duplicano. Un commento è il pensiero di una persona su un momento — duplicarlo significherebbe lasciare all'ex le parole dell'altro. *La sorte segue la sensibilità*, come per foto e recensioni.

⚠️ **Lo scioglimento è stato riscritto insieme allo schema**, non dopo: senza, dopo la rottura le foto legate a un evento altrui sarebbero rimaste appese a una riga invisibile al loro autore, e i commenti attaccati alla copia sbagliata. Ora ogni legame nuovo — foto→evento, commento→evento, evento→luogo — viene ricucito sulla copia del proprio autore. *Il punto generale*: **una funzione che duplica dati deve essere aggiornata nello stesso commit in cui nascono i dati nuovi**, altrimenti il buco si scopre alla prima rottura vera, quando è tardi.

**La modifica vive in un posto solo**: la pagina dell'evento rimanda al foglio del calendario (`?modifica=<id>`) invece di avere un secondo form. Due form sullo stesso oggetto divergono sempre, e il secondo si dimentica di un campo.

**Anteprime nella vista eventi** (2026-08-13): se un evento ha una foto, nell'elenco compare la **miniatura al posto dell'icona** del tipo — l'immagine dice di cosa si trattava molto meglio di un simbolo. Le foto si chiedono **in blocco per tutto l'elenco** e solo in quella vista: su una schermata che si scorre, una richiesta per riga sono N attese, e nelle altre viste sarebbero immagini che nessuno guarda. Fra piu' foto vince la prima caricata.

**Verificato**: dalla vista eventi si apre la pagina, il commento si scrive e compare firmato e datato (*"l'hai messo tu · 13 ago"*). ⚠️ **Le foto no**: il collegamento c'è nel database, ma manca lo **storage** su Supabase — la pagina lo dice invece di mostrare una griglia vuota.

### D-32 — Sei sezioni nella barra fin da subito, anche quelle vuote — e riquadri che non inventano numeri
**Chiesto dall'utente il 2026-08-13 (sera).**

**La barra**: Noi · Calendario · Giochi · Mappa · Preferiti · Galleria. Le sezioni ci sono **tutte da ora**, anche dove dentro non c'è ancora la funzione. *Perché mostrarle vuote invece di nasconderle*: una sezione vuota **che dice cosa manca** è onesta e orienta chi guarda; una nascosta lascia credere che l'app sia finita così. È la stessa regola del "nessun gap silenzioso" applicata all'interfaccia invece che alla documentazione — e ogni schermata in arrivo dichiara *cosa* manca perché esista (il meccanismo del sigillo per i giochi, il componente mappa, lo storage per la galleria).

**La home a riquadri**: giorni insieme, prossimo impegno in calendario, posti visitati, ultimo film, ultima partita, un ricordo dalla galleria. Ogni riquadro mostra **un dato vero o niente**: dove la funzione non esiste ancora dice "mai giocato", "nessuna foto", non uno zero che sembra un dato. Su una schermata che si guarda ogni giorno, un numero inventato è peggio di un vuoto onesto — è la stessa lezione di B-03 (*non lo so* non è *non c'è*) portata in home.

⚠️ **Trovato provando**: le schede della barra restano **montate** quando si passa dall'una all'altra, quindi i riquadri mostravano i dati di quando l'app era stata avviata — segnavo un film come visto e la home continuava a dire "ancora nessuno". Risolto ricaricando il riepilogo a ogni ritorno sulla scheda (`useFocusEffect`). *Vale oltre questo caso*: in un'app a schede, "l'ho letto al mount" significa "l'ho letto una volta sola, forse ore fa".

⚠️ **Scostamento dichiarato dalla richiesta**: il riquadro chiesto era "**paesi** visitati", ma `luogo` non ha un campo paese e ricavarlo dalle coordinate richiederebbe un servizio esterno di geocodifica — cioè mandare fuori le posizioni della coppia, che è esattamente ciò che D-05 evita. Il riquadro conta quindi i **posti visitati**, dato che esiste già. Se il paese serve davvero, si aggiunge come campo da compilare quando si segna un luogo, e si conta `distinct` — nessuna chiamata esterna.

### D-31 — L'importazione dal calendario del telefono è **selettiva**, e non potrebbe essere altrimenti
**Chiesta dall'utente il 2026-08-13**, con la forma confermata dopo aver messo in chiaro la conseguenza.

**Cosa fa**: legge i calendari del telefono — che includono già gli account collegati (Google, iCloud), senza che l'app parli con nessun servizio esterno — mostra le voci da un mese fa a un anno avanti, e importa **solo quelle spuntate**. Il tipo viene indovinato (un volo o un hotel → vacanza; il resto → impegno) e resta modificabile: la macchina propone, la persona decide.

⚠️ **Perché selettiva e non "importa tutto"**: quello che entra finisce nel calendario **condiviso**, e per D-21 la visibilità è totale — il partner lo vede tutto, per sempre. Un'importazione in blocco trascinerebbe dentro il colloquio di lavoro, la visita medica, la cena con chi non c'entra. **La selezione non è una comodità in più: è la mitigazione.** Per la stessa ragione **nessuna spunta è attiva all'apertura**: si parte da zero e si aggiunge, invece di partire da tutto e togliere — una spunta dimenticata, qui, mostra al partner una cosa che non avresti mostrato.

**Il permesso si chiede aprendo la schermata**, non all'avvio dell'app: chiedere l'accesso al calendario a chi non ha ancora deciso di importare niente è il modo migliore per farselo negare, e per meritarselo.

**Anche per categoria** (chiesto il 2026-08-13, migrazione `0007`): nel telefono le categorie — festività, compleanni, casa, lavoro, famiglia — non sono un'etichetta dentro l'evento, sono **calendari distinti** dentro l'account. Quindi le voci si mostrano raggruppate per calendario, con "Tutti / Nessuno" su ciascun gruppo: prendere tutti i compleanni in un tocco resta una scelta consapevole, perché la categoria la nomini tu, e non è il "prendi tutto" che la selezione esiste per evitare. Il nome del calendario resta scritto sull'evento (`categoria`) e compare nella riga: senza, venti compleanni importati sarebbero venti impegni indistinguibili. È testo libero e non un elenco chiuso — i nomi dei calendari li decide chi li ha creati, e cambiano da telefono a telefono e da lingua a lingua. Non va confusa col **tipo** (D-30), che è la classificazione nostra e vale per tutti gli eventi.

**Ripetibile senza doppioni**: ogni riga importata ricorda da dove viene (`origine_esterna`), e l'unicità è **per coppia** — se entrambi importano lo stesso compleanno dai rispettivi telefoni resta un evento solo, perché sul calendario condiviso il doppione è rumore. Per i ricorrenti l'identificativo include la data, così il compleanno di quest'anno e quello del prossimo restano due righe distinte.

### D-30 — Tre tipi di evento, e la vacanza che occupa i giorni invece di un istante
**Chiesti dall'utente il 2026-08-13.** Migrazione `0006`.

**I tre tipi**: *impegno* (il default), *romantico*, *vacanza*. Un `check`, non una tabella: sono tre valori decisi da noi, non un elenco che gli utenti estendono. Ognuno ha icona e colore propri — il mese si legge a colpo d'occhio, e i pallini sotto ai giorni sono colorati per tipo.

**La vacanza usa `fine`**, che esisteva dallo schema iniziale senza significato: non serviva una colonna nuova, serviva dargliene uno. Ed è l'unico tipo che **attraversa** i giorni invece di stare in uno: `eventiDelGiorno` include gli intervalli che coprono la data. *Perché conta*: guardando solo la data d'inizio, una settimana in montagna comparirebbe il giorno della partenza e sparirebbe per tutti gli altri — cioè proprio nei giorni in cui la si sta vivendo. Un vincolo impedisce a un ritorno di precedere la partenza: è un errore di inserimento, non un dato.

**Le quattro viste, dopo la revisione del 2026-08-13 (sera)**: **giorni · mese · anno · eventi**. La prima si chiama *Giorni* e non *Settimana* perché è quello che fa: si naviga fra i giorni, e la settimana è solo la finestra che se ne vede. L'ultima — **Eventi** — mostra le cose senza il calendario intorno: quelle che devono venire in ordine di arrivo, quelle passate dalla più recente, ognuna con **quanto manca** o **quanto è passata** (*"fra 4 giorni"*, *"2251 giorni fa"*). È la domanda vera quando si guarda un elenco così, e nessuna griglia la risponde. Una vacanza resta "in arrivo" finché non è **finita**, non finché non è cominciata.

**Ogni evento si apre**: toccarlo mostra un pop-up con tipo, data per esteso, nota, categoria e autore — e da lì si **modifica**. Prima l'unico modo di correggere un refuso era cancellare e riscrivere. Modifica e cancellazione restano dell'autore soltanto (D-21); agli altri il pop-up resta una scheda di lettura.

**Le tre viste originarie**: settimana · mese · anno. La vista *giorno* è stata **tolta**: apriva un giorno alla volta facendo il lavoro che ora fa il foglio di dettaglio — meglio, e raggiungibile da ovunque. Al suo posto l'**anno**, che serve a una cosa diversa dalle altre due: non sapere *cosa succede* ma **ritrovare** — in che mese cadeva quella cosa, dove stanno le vacanze. Dodici riquadri con il peso di ogni mese (quante cose, e di che colore); toccarne uno porta alla vista mese.

**Navigazione**: in mese e anno si trascina per cambiare periodo; in **settimana** il gesto orizzontale appartiene a una **striscia continua** di quattro mesi, che scorre giorno per giorno invece che di sette in sette — la settimana è un ritaglio comodo, non una gabbia. La striscia è ancorata a *oggi* e non al giorno scelto, così non si ricostruisce sotto il dito a ogni tocco.

**Tocco sul giorno — due comportamenti, perché sono due gesti diversi**: nella **griglia del mese** il primo tocco sceglie e il secondo **apre il foglio** di dettaglio (convenzione dei calendari veri). Nella **striscia** invece si *naviga fra i giorni*: toccarne uno lo sceglie e il suo programma compare **sotto, nella stessa schermata**. Un foglio che si apre e si chiude sarebbe un passaggio di troppo per un gesto che si ripete decine di volte — la striscia è fatta per scorrere fra i giorni, non per aprirli uno alla volta.

⚠️ **Corretto dopo la prova sul telefono**: nella striscia i giorni degli altri mesi erano sbiaditi al 40% come nella griglia mensile — ma una striscia li attraversa tutti, quindi metà dei numeri risultava illeggibile. Sbiadire ha senso solo dove esiste un "fuori": in una griglia che rappresenta *un* mese, non in un nastro continuo. Il primo giorno di ogni mese ora mostra il nome del mese al posto dell'iniziale del giorno, così scorrendo si sa sempre dove si è.

⚠️ **Inciampo registrato**: `contentOffset` sulla striscia veniva ignorato al primo render e la settimana partiva da due mesi prima. Sostituito con uno `scrollTo` esplicito in un effetto, che vale anche quando il giorno cambia dalle frecce.

### D-29 — La data da cui si sta insieme: si chiede quando la coppia si forma, e diventa un segno sul calendario
**Chiesto dall'utente il 2026-08-13.** Migrazione `0005`.

**Cosa fa**: appena il partner accetta l'invito, la home chiede *"da quando state insieme?"*. Da quel giorno partono i **giorni insieme** — il riquadro grande della home — e il giorno stesso viene **segnato sul calendario** come evento di tutto il giorno.

**Perché passa da una funzione e non da una scrittura diretta**: `coppia` non ha policy di INSERT/UPDATE, quindi dal client è **impossibile** scriverci. È la stessa regola che regge l'intero impianto di autorizzazione (nessun insert diretto su `coppia` e `membro_coppia`, D-14/D-25): aggiungere una policy di UPDATE per una data avrebbe aperto in scrittura la tabella su cui poggiano tutte le altre policy, per comodità.

**Il titolo dell'evento arriva dal client** — il database non sa in che lingua parla l'utente (D-24), e resta scritto nella lingua di chi lo imposta: è un contenuto come gli altri.

**Un solo evento, non un anniversario che torna ogni anno**: lo schema non ha ricorrenze, e simularle creando dodici eventi finti sarebbe debito travestito da funzione. Quando arriveranno le ricorrenze, questo diventerà il primo caso d'uso.

**Dettagli che sembrano minuzie e non lo sono**: l'evento è fissato a **mezzogiorno UTC**, non a mezzanotte — l'ora non si vede (dura tutto il giorno) ma così il giorno resta quello giusto in ogni fuso, mentre una mezzanotte UTC diventerebbe *il giorno prima* per chi sta a ovest. E i giorni si contano fra **giorni civili**, non fra istanti: alle 23:00 e alle 07:00 il numero dev'essere lo stesso.

**Verificato dal lato del partner**, non di chi ha impostato la data: coppia formata fra due utenti di prova, data 14 giugno 2020 → il riquadro conta **2251 giorni**, e il **partner** legge sia `insieme_dal` sia l'evento "Il nostro inizio" nel proprio calendario.

**Limite dichiarato**: un client può comunque inserire per conto suo un evento con `speciale = 'insieme_dal'` — le policy guardano coppia e autore, non le singole colonne. Il danno si ferma al proprio calendario e l'indice unico impedisce che ne esistano due.

### D-28 — Il calendario si usa **anche da soli**, e il primo appuntamento fa nascere lo spazio
**Deciso il 2026-08-13** implementando la prima funzione vera (D-11 punto 3).

**Scelta**: il calendario **non** mostra il cartellino "serve il partner". Chi entra prima segna i suoi appuntamenti e li ritrova quando l'altro arriva. Il cartellino resta per i **giochi**, che da soli non hanno proprio senso — lì manca l'altro giocatore, non solo la compagnia.

**Perché**: un calendario condiviso usato da soli è un calendario, cioè utile lo stesso; un quiz sulle preferenze del partner senza partner non è niente. La regola generale che ne ricavo per le funzioni che arrivano: **si blocca ciò che senza due persone non esiste, non ciò che senza due persone è solo meno bello.** Mappa, liste e foto seguiranno il calendario; i tre giochi seguiranno il cartellino.

**Il primo appuntamento crea la coppia**, come già fa "Invita" (D-26): `assicuraCoppia` sta prima dell'inserimento. Chiedere *"prima crea il tuo spazio"* davanti al primo evento sarebbe di nuovo il cancello, solo spostato più avanti.

**Conseguenza già nota, ora concreta**: quando il partner entra, vede **anche il pregresso** — gli appuntamenti scritti prima che arrivasse. È coerente con D-21 (visibilità totale) ed è la conseguenza che D-25 aveva lasciato aperta; resta da decidere se avvisare al momento dell'invito.

**Verificato nel browser**, con un utente che non aveva ancora uno spazio: il primo evento lo ha creato al volo, l'evento "tutto il giorno" perde l'ora nella riga, l'ordinamento tiene, l'eliminazione funziona. Più **3 asserzioni nuove** sul confine di coppia applicato agli eventi: l'avversario non li legge e non li cancella (54 verdi in tutto).

⚠️ **Falso allarme registrato perché non si ripeta**: il modale sembrava non chiudersi. Due cause sovrapposte, **nessuna dell'app**: la scheda del browser non componeva frame (`document.hidden`, `requestAnimationFrame` fermo), quindi l'animazione di uscita non finiva mai; e la mia verifica leggeva il DOM nello stesso tick del clic, prima che React committasse. Sul web l'animazione del modale ora è disattivata — lì è preview di sviluppo — e le verifiche si leggono in una chiamata separata. *Lezione*: **uno strumento di verifica che altera le condizioni può inventare bug che non esistono**, e costa quanto uno vero.

### D-27 — Lo scioglimento è **unilaterale**, e i giochi si cancellano mentre i ricordi restano
**Deciso il 2026-08-13** implementando `sciogli_coppia` (migrazione `0004`). Sono due scelte che D-04/D-16/D-21 non coprivano.

**Unilaterale**: chi scioglie non ha bisogno del consenso dell'altro, e l'altro non può impedirlo né rinviarlo. *Perché*: una conferma a due mani trasformerebbe l'uscita in una trattativa, e chi ha più bisogno di uscire è proprio chi non è in condizione di trattare — è il confine di fiducia TB-2 (partner contro partner), lo scenario che l'app deve prendere sul serio. Il costo è la rottura per impulso, che è reversibile riformando la coppia; il costo opposto sarebbe restare legati contro la propria volontà.

**Partite, invii sigillati, risultati e domande personalizzate vengono cancellati**; i contenuti no. *Perché la linea cade qui*: dopo lo scioglimento nessuno è più membro attivo, e quelle tabelle si leggono **solo** per appartenenza alla coppia — resterebbero righe che nessuno può né vedere né cancellare, dati orfani che sopravvivono a chi li ha generati (contro `Rule/catena-cancellazione.md`). I contenuti invece hanno un `autore_id`, e le policy li lasciano al loro autore: hanno qualcuno che li tiene. **La regola generale per il futuro**: si conserva ciò che ha un proprietario dopo la rottura, si cancella ciò che ne resterebbe senza.

**Il pezzo che è costato più codice — la ricucitura**: duplicare i condivisi non basta. La recensione che ho scritto sul film aggiunto da lui è **mia** (personale, resta a me) ma punta a una riga che dopo la rottura non vedo più; stessa cosa per una mia foto legata a un suo luogo. Alla duplicazione ogni legame viene spostato sulla **copia del proprio autore**. Senza questo passaggio si otterrebbero contenuti formalmente conservati e praticamente irraggiungibili — la peggiore delle due cose, perché sembra che funzioni.

**Verificato**: 12 asserzioni nuove contro il database reale (51 in tutto, tutte verdi). Costruiscono una coppia vera con evento, luogo, film, recensione e foto, la rompono e vanno a vedere **cosa resta in mano all'ex**: zero foto dell'altro, una copia propria di ogni condiviso, i legami sulle copie giuste, creatura sparita per entrambi, scrittura chiusa, cancellazione del proprio ancora possibile (art. 17 non decade con la relazione).

**Effetto collaterale utile**: è anche la via d'uscita dal vincolo di D-26 — chi ha creato lo spazio da solo e poi riceve un invito può sciogliere il proprio e accettare.

**Trovato applicandolo**: il blocco di test sull'invito **non era rieseguibile** — passava solo il giorno in cui è stato scritto, perché al secondo giro trovava gli utenti già appaiati e su una coppia completa non si generano inviti. Prima di `sciogli_coppia` non c'era modo di riportarli indietro. Ora ogni blocco si ripulisce da sé.

### D-26 — Si entra **senza creare niente**: la schermata di scelta resta, ma non è più un cancello
**Deciso dall'utente il 2026-08-13**, fra tre opzioni nominate, dopo la prova sull'iPhone.

**Com'era**: D-25 aveva tolto l'attesa del partner, ma *creare lo spazio* restava obbligatorio per vedere l'app. La prima cosa dopo il login era ancora una domanda — "crea" oppure "ho un invito" — a cui bisognava rispondere prima di poter guardare qualsiasi cosa.

**Com'è ora**: la schermata di scelta resta (chi ha ricevuto un invito deve poterlo aprire subito), ma ha una terza via — **"Entra e decidi dopo"** — che porta in app senza coppia. Lo spazio **nasce al primo gesto che lo richiede**: premere "Invita il tuo partner" crea la coppia e genera il link in un colpo solo. La scelta di rimandare viene **ricordata sul dispositivo** (`lib/preferenze.ts`, chiave per utente): senza memoria si sarebbe ripresentata a ogni avvio, cioè sarebbe rimasta il cancello che si voleva togliere.

**Perché questa e non le altre due**: (a) *creare lo spazio automaticamente al login* è più lineare da raccontare, ma chi riceve un invito si ritroverebbe già dentro una coppia vuota, e il database vieta di stare in due coppie — servirebbe una migrazione che chiuda la coppia vuota all'accettazione, più i relativi test avversariali: lavoro sul pezzo più delicato dell'impianto (D-14) per un guadagno di forma; (b) *lasciare tutto com'era* mantiene la domanda che ha dato fastidio. La via scelta non tocca il database: nessuna policy, nessuna funzione, nessuna migrazione.

**Conseguenza dichiarata, non risolta**: chi crea lo spazio — esplicitamente o premendo "Invita" — **non può più accettare l'invito di qualcun altro** finché non esiste lo scioglimento (D-04/D-21). Era già vero prima; ora è più facile incapparci, perché lo spazio può nascere da un gesto laterale. Per questo il bottone "Ho ricevuto un invito" in home **sparisce appena la coppia esiste**, invece di restare lì e fallire.

**Verificato nel browser** su quattro utenti nuovi: senza coppia si entra e la home lo dice; "Invita" crea lo spazio e produce il token; riavviando l'app chi ha rimandato **non rivede** la schermata di scelta; "Ho ricevuto un invito" porta direttamente al ramo giusto.

### D-25 — L'invito non blocca l'ingresso: si entra da soli, si invita quando si vuole
**Deciso dall'utente il 2026-08-12** (seconda sessione serale), guardando l'app sull'iPhone.

**Com'era**: dopo aver creato lo spazio si restava fermi sulla schermata di invito, in attesa che il partner aprisse il link e che chi aveva invitato confermasse. Fino ad allora l'app era inaccessibile.

**Com'è ora**: creata la coppia, si entra. Il partner si invita dalla home quando si vuole. Le funzioni che richiedono due persone mostrano un cartellino — *"invita il tuo partner per continuare"* — invece di essere nascoste o disabilitate in silenzio.

**Perché**: l'attesa era **un muro nel punto peggiore**, subito dopo la registrazione e prima di aver visto qualunque cosa. Chiedeva di coordinarsi con un'altra persona *prima* di sapere se l'app valesse la pena. Chi installa la sera tardi, o il cui partner non risponde, restava fuori da un prodotto che non aveva ancora visto.

**Perché la sicurezza non cambia**: lo spazio esiste già come coppia da un membro — `crea_coppia()` inserisce la riga in `membro_coppia`, quindi `e_membro_attivo()` risponde e **tutte le policy RLS funzionano identiche**. Non è stato toccato nessun controllo di autorizzazione: è cambiato solo *quando* si mostra l'app.

⚠️ **Il vincolo che questa decisione ha rischiato di rompere, e come è stato tenuto**: la **conferma di chi invita** è, delle quattro condizioni di D-14, l'unica che *interrompe* l'ingresso di un estraneo che ha aperto un link inoltrato — le altre tre lo rendono solo improbabile. Quella conferma viveva nella schermata di onboarding, cioè proprio la schermata che ora si può lasciare. Se fosse rimasta lì, chi entra da solo non avrebbe più potuto confermare, e D-14 sarebbe stata svuotata **senza che nessun test se ne accorgesse**. Per questo il ciclo dell'invito è stato estratto in `lib/invito.ts` e la conferma compare **anche in home**.

**Conseguenza da tenere presente quando arriveranno le funzioni** (non risolta qui, va decisa a quel punto): chi entra da solo può creare contenuti *prima* che il partner arrivi, e al momento dell'unione **il partner vede tutto il pregresso**. Con D-21 (visibilità totale) è coerente, ma è una cosa che l'utente non si aspetta necessariamente: va valutato se avvisarlo al momento dell'invito.

**Verificato contro il database reale**, non solo nell'interfaccia: chi è solo vede 1 riga in `membro_coppia` (`completa=false`, funzioni di coppia chiuse); dopo il flusso completo invito → apertura → conferma, entrambi ne vedono 2 e per entrambi la coppia risulta la stessa.

### D-24 — La lingua segue il dispositivo, non un selettore nell'app
**Deciso dall'utente il 2026-08-12.** **Modifica D-18**, che diceva *"a scelta dell'utente"*.

**Scelta**: italiano a chi ha il telefono in italiano, inglese a tutti gli altri. Nessun selettore.

**Perché**: la lingua del telefono è già la dichiarazione di preferenza dell'utente, fatta una volta per tutte le app. Un selettore in più chiede di nuovo una cosa che il sistema operativo sa già, e va costruito, salvato e ricordato: è codice e schermate in cambio di niente, contro V1 (scrivere meno codice possibile).

**Costo accettato**: chi vive all'estero col telefono in inglese ma è italiano vedrà l'inglese, e non potrà cambiarlo. Un selettore si aggiunge in seguito se qualcuno lo chiede — è un'aggiunta *di fianco*, non una migrazione di dati, quindi rimandarlo non costa nulla (stessa regola generale di D-11).

**Implementazione**: `lib/i18n.ts`, dizionario italiano e inglese senza librerie di i18n — due lingue non giustificano il peso di i18next. Il dizionario italiano **definisce il tipo**, quindi una chiave aggiunta in una lingua e dimenticata nell'altra **non compila**. Provato togliendone una: `tsc` la segnala.

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
⟳ **Modificata lo stesso giorno da D-24**: il bilinguismo resta, la *scelta dell'utente* no — la lingua la decide il dispositivo. Leggere D-24 prima di agire su questa.
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

### B-01 — `assegna_punti` chiamabile via RPC da chiunque, anon compreso (2026-08-12)
**Trovato**: con una chiamata di prova dall'esterno (`POST /rest/v1/rpc/assegna_punti` con la sola anon key), subito dopo l'applicazione di 0001. La chiamata è **entrata nella funzione** ed è stata fermata solo dal vincolo di chiave esterna, perché il `coppia_id` era inventato. Con un id reale, un utente poteva **auto-assegnarsi punti** saltando i trigger — violazione diretta di D-15.
**Causa**: Postgres concede `EXECUTE` a **PUBLIC** su ogni funzione nuova; il `revoke ... from anon` di 0001 non rimuove il grant a PUBLIC, e anon lo eredita da lì.
**Correzione**: migrazione `0002_permessi_funzioni.sql` — `revoke ... from public, anon, authenticated` su `assegna_punti` (la chiamano solo i trigger, che non ricontrollano il privilegio dopo la creazione); stessa chiusura su `crea_coppia`, la cui guardia interna aveva retto ma non deve essere l'unico strato (principio 5). `e_membro_attivo` resta eseguibile da tutti **di proposito**: le policy la invocano col ruolo del chiamante.
**Verificato il 2026-08-12**, dopo l'applicazione di 0002, ripetendo **la stessa identica chiamata**: risponde `42501 permission denied for function assegna_punti` invece di entrare nella funzione. Verificato insieme che `crea_coppia` da anon è ora bloccata al livello dei permessi (la guardia interna resta come secondo strato) e che le tabelle rispondono ancora `[]` ad anon — cioè `e_membro_attivo` continua a servire le policy.
**Lezione**: due erano già scritte nel processo — la verifica si fa **dall'esterno contro la realtà**, e la seconda riga di difesa (il FK, la guardia interna) è ciò che contiene il danno quando la prima manca. La nuova: **su Postgres, "revoke from anon" senza "revoke from public" non revoca niente.**

### B-02 — Errore NativeWind "Cannot manually set color scheme" nella preview web (2026-08-12, APERTO)
**Sintomo**: nella console del browser, ripetuto a ogni render, `Error: Cannot manually set color scheme, as dark mode is set via a media query. Please use StyleSheet.setFlag('darkMode', 'class')`.
**Cosa NON è**: non blocca il rendering. Verificato con gli stili calcolati che i token si applicano **correttamente in entrambe le modalità** — chiaro: carta crema `rgb(248,246,241)` + inchiostro `rgb(52,39,29)`; scuro: crema `rgb(237,232,222)` su marrone. Le route rendono, il font Fraunces si carica, la rete è pulita (200).
**Causa**: interazione **web-only** fra `userInterfaceStyle: "automatic"` (che serve all'app **nativa** per seguire la modalità notte del sistema) e NativeWind in dark-mode `media` sul web: Expo prova a riflettere lo schema via `Appearance.setColorScheme`, e NativeWind lo rifiuta. Escluso StatusBar come fonte (reso solo-nativo, l'errore resta).
**Perché lasciato aperto e non risolto stasera**: il web è **solo preview di sviluppo**; l'app vera è nativa, dove `Appearance` è nativo e questo errore NativeWind-web non si presenta. La correzione pulita (passare a dark-mode `class` e gestire il toggle da `useColorScheme`, riscrivendo `global.css` da `@media` a selettore `.dark`) è un refactoring del theming, non un lavoro di fine serata.
⚠️ **Da fare prima di dichiararlo chiuso**: (1) verificare sull'**iPhone reale** che l'errore non compaia e che la modalità notte segua il sistema; (2) se si vuole la console web pulita, il refactoring dark-mode `class`. **Nessun gap silenzioso**: è dichiarato, non nascosto.

### B-03 — La home raccontava uno spazio che non esisteva, e "Esci" non usciva (2026-08-13, CHIUSO)
**Sintomo, riferito dall'utente dopo il login sull'iPhone**: la home diceva *"Il tuo spazio è pronto — invita il tuo partner per continuare"*, ma premendo **Invita** rispondeva `non sei in una coppia: creane una prima di invitare`; **Esci** sembrava non fare nulla.

**Riprodotto nel browser**, con utenti di prova e sessione iniettata: dopo il logout la pagina **resta** su `/home` e mostra esattamente quella schermata; il bottone produce esattamente quell'errore. Il backend è risultato innocente: `crea_coppia` e `crea_invito` usano la **stessa identica condizione** (`membro_coppia` con `uscito_il is null`), verificate chiamandole contro il progetto reale.

**Tre cause distinte, tutte corrette**:
1. **Il gate di routing viveva solo sulla route `/`** (`app/index.tsx`). Se la sessione cadeva altrove — uscita volontaria, token scaduto, refresh fallito — nessuno riportava indietro: l'uscita *avveniva* (misurata: la chiave sparisce da `localStorage`) ma la schermata restava sotto gli occhi. Corretto con `GuardiaSessione` in `app/_layout.tsx`, viva su tutte le schermate.
2. **La home distingueva due stati invece di tre**: guardava solo `completa` e mai `coppiaId`, così l'assenza di coppia veniva raccontata come *"il tuo spazio è pronto"* e offriva un gesto destinato a fallire.
3. **`useCoppia` scartava l'errore della query** (`const { data } = ...`): una lettura fallita per rete o permessi era **indistinguibile** da "non hai una coppia". Ora `errore` è un terzo stato dichiarato, con schermata e "Riprova".

**Lezione, che vale oltre questo caso**: *non lo so* non è *non c'è*. Un'interfaccia che collassa i due casi mente proprio quando le cose vanno male — e mente con sicurezza, perché la schermata che mostra è una schermata legittima. Vale anche l'altra metà: **una decisione presa una volta sola (il gate all'avvio) non protegge uno stato che cambia nel tempo** (la sessione). È la stessa forma del difetto di `sync-brain.mjs` del 2026-08-12: una verifica fatta in un istante, usata come se valesse sempre.

**Trovato di passaggio e corretto**: premendo "Invita", `ricarica()` rimetteva `loading` a `true` e smontava la schermata sotto le dita, perdendo il link appena generato; ora solo la **prima** lettura è un'attesa a schermo intero. E `Share.share` senza `try/catch` lasciava un'eccezione non gestita dove la condivisione non esiste (browser) o viene chiusa male: ora il link resta a schermo, copiabile a mano.

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

1. [x] Autenticazione e **appaiamento della coppia** — fatto il 2026-08-12/13 (OTP email, invito con conferma, D-25/D-26)
2. [x] **Scioglimento della coppia** secondo D-04 — lato database il 2026-08-13 (`0004`, D-27). ⚠️ Manca la **schermata**: la funzione esiste, il bottone no — andrà nelle impostazioni insieme alla cancellazione account (punto 7)
3. [x] **Calendario condiviso** — fatto il 2026-08-13 (D-28): elenco in arrivo/passati, aggiunta con selettore nativo, "tutto il giorno", eliminazione del proprio
4. [x] **Mappa dei luoghi visitati** — fatta il 2026-08-13 (D-34): mappa nativa, posti segnati a mano (tocco lungo o «segna dove sono»), eventi del luogo
5. [x] **Cartella foto condivisa** — fatta il 2026-08-13 (D-34/`0009`/`0010`): bucket privato, indirizzi firmati, compressione, tetto 1 GB dal database
6. [x] **Liste film e ristoranti** — fatte il 2026-08-13 (D-32): da fare / già fatti, una recensione per persona con voto e testo
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

#### P-04 — Altri quattro giochi proposti dall'utente il 2026-08-12
Registrati come **possibili giochi futuri**, non decisi. Nessuno entra nell'MVP: l'ordine di D-11 resta.

🔑 **L'osservazione che conta per il costo, ed è il motivo per cui vale la pena averli scritti insieme: non sono quattro lavori, sono due famiglie.**
I tre giochi già previsti (quiz, telepatia, obbligo o verità) sono **un solo meccanismo** — *ognuno invia in segreto, si rivela quando hanno inviato entrambi* — che è il sigillo D-12 già in schema. Delle quattro proposte:
- **una ci ricade dentro** e costa quasi nulla: è un nuovo tipo di domanda, non un gioco nuovo;
- **due chiedono un secondo meccanismo**, diverso e non ancora previsto: *uno produce, l'altro indovina, a turni*. Costruito una volta, però, le serve entrambe;
- **una non è un gioco**: è un tema di contenuto, ed è quella che tocca una decisione già presa.

**1. Indovina cosa ha disegnato l'altro** — meccanismo *produci → indovina*, a turni.
È la più cara delle quattro: serve una superficie di disegno sul telefono, e il disegno va salvato e trasmesso. ⚠️ Un disegno è **un contenuto con un autore**, quindi ricade su D-04 e D-21 come le foto: va deciso se conta come contenuto personale (resta a chi l'ha fatto) o condiviso. E se i disegni si conservano, consumano spazio — il tetto di D-22 li riguarda.

**2. Indovina la parola dell'altro** — stesso meccanismo del punto 1, ma **solo testo**.
Se si costruisce la macchina *produci → indovina*, questa è di gran lunga la strada più economica per provarla: nessuna superficie di disegno, nessun file, nessuno spazio. **Conviene farla prima del disegno**, non dopo: verifica se il formato piace, al costo di una schermata.

**3. Chi è più propenso a…** — meccanismo **già previsto**: entrambi rispondono in segreto, si confronta.
È il candidato più forte dei quattro, perché non è un gioco nuovo ma **una variante di contenuto del sigillo D-12**: si scrive il banco e funziona. ⚠️ Vale però il vincolo di P-03 sul linguaggio: risultato della singola sessione, mai un punteggio che resta — *"chi è più propenso a"* scivola con naturalezza in una classifica fra le due persone, e una classifica persistente è di nuovo *l'app che emette un verdetto sulla relazione*.

**4. Domande sulla vita sessuale / di coppia** — 🔴 **qui il nome nasconde due cose diverse, e vanno separate.**
- **"Vita di coppia"** (come vi siete conosciuti, cosa vi piace fare insieme, ricordi): nessun problema, è il banco normale.
- **"Vita sessuale"**: è **categoria particolare dell'art. 9 GDPR**, e **D-08 la esclude esplicitamente dal banco domande** — insieme a salute, religione, opinioni politiche, origine etnica e appartenenza sindacale.

⚠️ **Perché non basta dire "la mettiamo dopo"**: D-08 non è una regola di stile, è il **contrappeso a D-07**. Il calendario del ciclo è stato rimandato *proprio perché* art. 9; un gioco che chiede della vita sessuale raccoglie **la stessa categoria di dati**, e D-08 esiste testualmente per impedire che rientri "dalla porta di servizio" senza che nessuno se ne accorga, perché un quiz non si presenta come funzione sanitaria.

⚠️ **E non è coperta da D-19** (le domande scritte dalla coppia): quella distinzione regge perché *non le chiediamo noi* — un campo libero non è un trattamento progettato per raccogliere categorie particolari. Un gioco che noi costruiamo con un banco a tema sessuale **è esattamente** un trattamento progettato per raccoglierle: è il caso che la distinzione di D-19 escludeva, non uno che ci rientra.

**Cosa serve per farla, se la si vuole davvero** (è una decisione dell'utente, non un divieto): la stessa impalcatura di P-02 — consenso esplicito e separato, funzione spenta finché non è concesso, e la consapevolezza che il dato passa dai nostri server dentro il confine di fiducia TB-2. Ragionevole trattarla **insieme** a P-02 dopo la prima pubblicazione: sono lo stesso problema, e affrontarli in un lotto solo è la logica con cui D-07 è stata presa.

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

**Aggiornato al 2026-08-13.**

**Stato**: progetto **inizializzato e funzionante**. Esistono i tre documenti, il repo su GitHub, il submodule nel brain e un'app Expo che parte. Zero risorse cloud, zero costi sostenuti.

**Cosa è deciso**: le sei funzioni · i tre giochi da implementare per primi · lo stack completo (D-10) · l'ordine di implementazione (D-11) · la creatura geometrica ora e sostituibile poi (D-09) · il ciclo mestruale rimandato (D-07) e il divieto di reintrodurre art. 9 da altre porte (D-08) · le regole di scioglimento (D-04), posizione (D-05), invio sigillato (D-12) e pass (D-13).

✅ **Repo, submodule e inizializzazione fatti il 2026-08-12.** Il progetto è su GitHub (`samuelebusato/LifeCouple`), agganciato al brain come submodule, e **l'app parte e rende**: verificata nella preview web con 1153 moduli compilati, nessun errore in console, navigazione fra le tab funzionante.

**Configurazione applicata**: `name` LifeCouple · `slug` lifecouple · `version` **0.1.0** (1.0.0 su un progetto senza codice sarebbe una bugia) · `scheme` **`lifecouple`** — serve ai link di invito di D-14, è ciò che fa aprire l'app quando si tocca il link su WhatsApp · `ios.bundleIdentifier` e `android.package` **`com.lifecouple.app`** (D-20) · `supportsTablet: false`, perché un'app di coppia sul telefono non ha motivo di farsi recensire anche su iPad.

**Comando per lavorarci**: `npm run web` dentro `Projects/LifeCouple` (o la configurazione `lifecouple-web` in `.claude/launch.json` del brain).

✅ **Schema disegnato** il 2026-08-12 — 16 tabelle, regole RLS e le due funzioni Postgres, in [`Architecture.md`](docs/Architecture.md) §4.

✅ **Strato UI montato e verificato** il 2026-08-12: NativeWind 4.2 + Tailwind 3.4 (fissata: la v4 di Tailwind è incompatibile con NativeWind) · componenti base in stile React Native Reusables **posseduti nel repo** (`components/ui/text.tsx` col `TextClassContext`, `components/ui/button.tsx` con cva) · `lib/utils.ts` (cn) · token shadcn neutri in `global.css` come segnaposto — la direzione visiva vera arriverà nella fase di design, e sarà un cambio di variabili · lucide + react-native-svg · schermate demo del template rimosse, `app/index.tsx` segnaposto che esercita l'intera catena.
**Verifica fatta contro la realtà, non contro "compila"**: stili calcolati letti nel browser — `text-3xl font-bold` → 30px/700; bottone `rgb(229,52,93)` = `hsl(346 77% 55%)`, cioè il token `--primary` **in variante scura** (il tema scuro risponde); il testo del bottone ha preso `--primary-foreground` dal contesto senza classi esplicite. `tsc --noEmit` pulito.
⚠️ **Inciampo registrato**: un `babel.config.js` esplicito rompe la risoluzione di `babel-preset-expo` (annidato dentro `expo` nel template) → installato esplicitamente `~54.0.10`. Sintomo: `Cannot find module 'babel-preset-expo'` a ogni bundle.

✅ **App verificata sull'iPhone reale** il 2026-08-12 sera (Expo Go via QR): D-23 chiusa sul dispositivo, non solo in preview. Sbloccata di passaggio la execution policy PowerShell dell'utente (`npm.cmd` come workaround, `RemoteSigned -Scope CurrentUser` come correzione, eseguita dall'utente).

✅ **Migrazione SQL scritta** il 2026-08-12 sera — [`supabase/migrations/0001_schema_iniziale.sql`](supabase/migrations/0001_schema_iniziale.sql): le 16 tabelle, RLS su ognuna, `e_membro_attivo()` security definer (evita la ricorsione RLS su `membro_coppia`), `crea_coppia()` atomica (nessun insert diretto su coppia/membri: l'unico ingresso è la funzione o il futuro invito), trigger dei punti sulla transizione (D-15), trigger del tetto foto che **impone** il GB (D-22), creatura creata insieme alla coppia, `invio_sigillato` leggibile solo dall'autore (D-12). Valori punti e soglie stadi **dichiarati provvisori**. Non ancora applicata: manca il progetto Supabase.
✅ **Client Supabase pronto**: `lib/supabase.ts` (AsyncStorage su nativo, localStorage su web), `.env.example` col formato delle chiavi, `.env` aggiunto al `.gitignore` **prima** che esista. Nessuna schermata lo importa ancora: l'app gira anche senza `.env`. `tsc` pulito.

✅ **Progetto Supabase creato dall'utente**, `.env` compilato (anon key; URL corretto togliendo il suffisso `/rest/v1/` che l'utente aveva incluso). `.env` fuori da git. Regione UE **da confermare** nel dashboard (l'header CF-RAY dice solo il nodo Cloudflare, non la regione del progetto).
✅ **Migrazione applicata** (0001 + 0002 per B-01). **Tipi TypeScript generati** dallo schema reale in `lib/database.types.ts` (18 relazioni) e il client è ora `createClient<Database>`.
✅ **Test avversariali RLS scritti e verdi** — `tests/rls.avversariali.mjs` (`npm run test:rls`), **23 asserzioni contro il progetto reale** con la coppia B come avversario: confine coppia↔coppia in lettura e scrittura, `autore_id` non falsificabile, punti solo alla transizione e non ri-fabbricabili, regressione di B-01, sigillo dei giochi, solo-append del registro, tetto per-file. Tre casi **dichiarati non coperti** con la ragione (servono `sciogli_coppia`/`accetta_invito`): nessun gap silenzioso.

✅ **Appaiamento via link lato database** (D-14) — migrazione `0003_appaiamento.sql`: `crea_invito` (token 192 bit, scadenza 72h, solo l'impronta sha256 nel DB, un solo invito vivo per coppia), `apri_invito` (mette in **attesa di conferma**, non fa entrare), `conferma_invito` (**solo chi ha invitato**, è il passo che interrompe l'ingresso di un estraneo), `revoca_invito`. Permessi chiusi con la lezione di B-01 (`revoke from public`).
✅ **Test estesi a 37 asserzioni, tutte verdi**: il caso che D-14 esiste per fermare è provato — **un estraneo apre il link intercettato e la coppia resta a 1 membro**; il flusso corretto forma la coppia a 2; token monouso e revocabile. Sbloccato e coperto il **sigillo D-12 fra due membri veri** della stessa coppia (prima non testabile).

✅ **UI di onboarding costruita** (2026-08-12) nella direzione **"Diario intimo"** (scelta dell'utente fra tre): carta crema, inchiostro terra, accento terracotta, titoli in **Fraunces** (serif). Token in `global.css`, chiaro e scuro. Schermate: `benvenuto` (hero con l'emblema dei due cuori intrecciati), `accedi` (**OTP via email**, senza password — decisione tecnica registrata), `onboarding` (crea coppia · genera e condividi link · apri invito · conferma, con polling dello stato), `home` (segnaposto). Provider di sessione (`lib/auth.tsx`) e gate di routing (`app/index.tsx`) che smista fra login/appaiamento/app. **Verificato nel browser**: le tre route rendono, Fraunces caricato, token giusti in chiaro e scuro a 375px, `tsc` pulito, rete 200. Unico neo: **B-02** (errore darkMode web-only, non bloccante, aperto).

✅ **L'invito non blocca più l'ingresso** (D-25) e **l'app è bilingue davvero** (D-24), il 2026-08-12 in terza sessione. Nuovi file: `lib/i18n.ts` (dizionario it/en, lingua dal dispositivo), `lib/invito.ts` (ciclo dell'invito condiviso fra onboarding e home, **perché la conferma di D-14 dev'essere raggiungibile anche da chi entra da solo**), `components/serve-partner.tsx` (il cartellino da mettere nelle funzioni di coppia quando si è soli). `useCoppia` ora distingue *lo spazio esiste* da *il partner è dentro*. Verificato contro il database reale e nel browser in entrambe le lingue; `tsc` pulito.

🔴 **Diagnosi chiusa sul link d'invito che "non arriva"**: il backend è a posto (`crea_invito` restituisce il token, l'invito è in tabella). Il problema è che dentro **Expo Go** `Linking.createURL` non produce `lifecouple://…` ma **`exp://<ip-locale>:8081/--/invito/<token>`**: in Expo Go `resolveScheme` ignora lo `scheme` dell'app e torna sempre `exp` (`node_modules/expo-linking/build/Schemes.js`, ramo StoreClient). Conseguenze: WhatsApp e Messaggi **non lo rendono cliccabile** (rendono solo http/https), l'indirizzo vale solo sulla stessa Wi-Fi, e comunque la route che dovrebbe riceverlo non esiste. **Non ancora deciso** come risolverlo — le tre strade sono: (a) condividere il **codice** invece del link, che funziona subito e non tocca D-14 perché il segreto è lo stesso; (b) route + development build; (c) **universal link https** con dominio proprio, l'unica che dà un link cliccabile, da fase di pubblicazione.

✅ **Accesso OTP funzionante sull'iPhone** (2026-08-13): il template email è configurato e il codice arriva davvero. Lo si è scoperto da un bug d'uso — *"non mi fa inserire abbastanza numeri"* — perché la lunghezza dell'OTP di Supabase è configurabile (6-10) e il campo era fisso a 6 (`app/accedi.tsx`, `maxLength` 10 e filtro non-numeri).

✅ **Si entra senza creare lo spazio** (D-26) e **B-03 chiuso**, il 2026-08-13. Nuovi file: `lib/preferenze.ts` (memoria locale della scelta di rimandare, chiave per utente), `GuardiaSessione` in `app/_layout.tsx`. `useCoppia` ora ha **tre** stati (`coppiaId` / `completa` / `errore`) e `ricarica()` **restituisce** lo stato letto, così chi crea al volo decide subito senza aspettare il render. `ServePartner` crea lo spazio se manca, prima di invitare. **Verificato nel browser** su quattro utenti nuovi, stato per stato, con `tsc` pulito — resta da confermare sull'iPhone.

✅ **Scioglimento della coppia** (D-04/D-16/D-21/D-27) — migrazione `0004_scioglimento.sql`, applicata dall'utente il 2026-08-13 e provata con **12 asserzioni nuove**: 51 verdi in tutto. Nessuna policy toccata: erano già scritte per reggere la rottura. Manca solo la schermata da cui invocarlo.

✅ **Calendario condiviso** (D-28), la prima funzione vera, il 2026-08-13 — `app/(tabs)/calendario.tsx` + `lib/eventi.ts` + `lib/date.ts`. Tre viste (**giorno · settimana · mese**), frecce che scorrono di un giorno / una settimana / un mese, tocco sul titolo per tornare a oggi, pallino sui giorni con impegni, elenco del giorno scelto sotto la griglia. Selettore data **nativo** (`@react-native-community/datetimepicker`, incluso in Expo Go per SDK 54: nessuna development build); sul web un campo testo `AAAA-MM-GG HH:MM`, perché lì il componente non esiste e il web è solo preview.

✅ **Barra delle funzioni** (2026-08-13) — le schermate stanno in `app/(tabs)/` e si raggiungono da una toolbar (`Noi` · `Calendario`) invece che l'una dentro l'altra col tasto "Indietro". Le funzioni che arrivano prendono posto lì.

✅ **Giorni insieme** (D-29) — `components/insieme.tsx`: alla formazione della coppia si sceglie la data, il riquadro grande della home conta i giorni, e il giorno finisce sul calendario. Verificato dal lato del partner.

✅ **La tastiera non copre più il form** del nuovo appuntamento (`KeyboardAvoidingView` + contenuto scorrevole). ⚠️ Provato solo nel codice: sul web non c'è tastiera di sistema, la conferma arriva dall'iPhone.

✅ **Tipi di evento, vacanze e navigazione col dito** (D-30) e **importazione selettiva dal calendario del telefono** (D-31), il 2026-08-13 — migrazione `0006`, `lib/importa.ts`, `app/importa.tsx`, `components/riga-evento.tsx`. La coppia reale (`samuele.busato03@` + `samuelebusato96@`) è formata e ha `insieme_dal` al **2026-01-01**.

**Cosa manca** (in ordine):
1. **Verificare sull'iPhone reale**: la tastiera sul nuovo appuntamento, lo **scorrimento col dito** e la **striscia della settimana**, i selettori data nativi e soprattutto l'**importazione**, che sul web non esiste per definizione (`expo-calendar` è un modulo nativo — incluso in Expo Go, quindi nessuna development build). È anche l'occasione per chiudere B-02 (l'errore darkMode è web-only: va confermato che su iOS non compaia).
2. **Decidere la forma del link d'invito** fra le tre strade qui sopra, e implementarla. Se si sceglie (b) o (c), serve la route `app/invito/[token].tsx`.
3. **Scioglimento** (D-04/D-16/D-21): `sciogli_coppia`. ⚠️ **Decisione implementativa aperta**: D-21 vuole i contenuti **condivisi** (liste, luoghi, eventi) *duplicati una copia a ciascuno*, i **personali** (foto, recensioni) solo all'autore, la creatura cancellata. La duplicazione dei condivisi non è banale e va ragionata. Sblocca l'ultimo test non coperto.
4. Le funzioni nell'ordine di D-11.

⚠️ **Prima di utenti veri** (invariato): riaccendere "Confirm email", strategia d'accesso definitiva, eliminare gli utenti di test, confermare la regione UE.
Gli utenti di prova da eliminare dal dashboard sono ora: `rls-*@example.com`, più `diagnosi-invito@`, `solo-test@`, `duo-x@`, `duo-y@` (`@example.com`), creati il 2026-08-12 per la diagnosi del link e la verifica di D-25, e `diagnosi-solo-2@` … `diagnosi-solo-5@` e `prova-coppia-1@` / `prova-coppia-2@` (`@example.com`), creati il 2026-08-13 per riprodurre B-03 e provare D-26 e D-29. Diversi di questi hanno anche una **coppia** che resta nel database — `prova-coppia-*` ne ha una completa, con data di inizio e relativo evento.

⚠️ **Prima di utenti veri**: riaccendere "Confirm email" nel dashboard (spenta per i test), e scegliere la strategia d'accesso definitiva — probabilmente magic link o OAuth, non password. Gli utenti `rls-*@example.com` di prova si eliminano dal dashboard.

**Le decisioni già prese da non rimettere in discussione senza motivo**, perché vincolano lo schema e cambiarle dopo significa migrare dati già scritti: **D-04** (lo scioglimento revoca l'accesso, non cancella; `autore_id` su ogni contenuto), **D-05** (nessuna posizione in tempo reale), **D-09** (stato separato dal disegno), **D-11** (la creatura si progetta subito anche se si implementa per ultima).

**Il filo che lega quasi tutti gli errori evitati finora**, e che vale la pena rileggere prima di ogni nuova funzione: *questo campo si può aggiungere dopo, o dopo sarebbe una migrazione di dati contesi?*
