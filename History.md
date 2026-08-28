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

### 2026-08-28 — Il primo giro sull'iPhone, e l'hub dei giochi

**Chiesto dall'utente**: aprire l'app sull'iPhone e chiudere i difetti rimasti; poi implementare **solo l'hub dei giochi**, ispirato a due riferimenti (lo stile «toon» del primo, l'organizzazione a carte scorrevoli del secondo), con «Classifica» e «Gioca» sotto, e animazioni di scorrimento e di zoom.

**Il giro sull'iPhone — il primo davvero fatto.** Esito riferito dall'utente, punto per punto:
- ✅ **i commenti funzionano** (D-57) e ✅ **il caricamento delle foto è migliorato**;
- ✅ **B-15 non si ripresenta**: la scomparsa del riquadro della barra «ora si è risolta»;
- ❌ **il vetro del pannello «aggiungi un luogo» è ancora in ombra**, malgrado D-55;
- ❌ **all'avvio manca il riquadro del «+»** della mappa: resta l'icona, il tondo no.

🔑 **I due difetti rimasti erano la conferma di D-55, non la sua smentita**: quella decisione aveva descritto *esattamente* questi due modi di rompersi del vetro, e aveva sbagliato solo il modo di applicarli — a carico di chi chiama invece che dedotto dall'albero. Da lì **D-60** e **D-61**, e le due voci **B-16** e **B-17**.

**Fatto**: **D-60** (il contesto del vetro: la base non si dichiara più a mano, e niente vetro dentro il vetro), **D-61** (niente materiale nativo creato a opacità zero), **D-62** (l'hub dei giochi). Trovato e **non** corretto **B-17**, che è di ieri e sta nella testata del calendario.

**Secondo giro, dopo che l'utente ha guardato l'hub sull'iPhone**: *«nell'interfaccia mappa dei luoghi non riesco ad aggiungere luoghi: scrivo ma non mi si apre la tendina con i consigli»*, e *«la parte bassa dell'hub giochi mi sembra un po' schiacciata»*.

🔑 **La prima non era un guasto, ed è stato utile chiederlo invece di indovinarlo.** L'API Google risponde 200 e la chiave è nei bundle: l'utente stava scrivendo nel pannello **«Un posto nuovo»** della mappa, dove una tendina non c'è mai stata — la ricerca per nome era stata spostata in Elenco il 2026-08-27. Alla domanda diretta ha risposto *«vorrei che avesse lo stesso funzionamento di aggiungi luogo in elenco»*: da lì **D-63**. Se avessi tirato a indovinare avrei corretto la schermata sbagliata.

**Fatto nel secondo giro**: **D-63** (la ricerca dentro il pannello del «+», e la parità di risultato con l'elenco), **B-18** (il campo di ricerca che taceva), **B-19** (la mappa scriveva una riga di lista più povera dell'elenco), più la spaziatura dell'hub — registrata in coda a **D-62**.

**Quarto giro**: *«come gioco aggiungi anche "indovina il disegno"»* → **D-65**, che promuove la proposta 1 di P-04 da idea a gioco previsto, e la mette nel backlog come **voce 11-ter**.

**Terzo giro, e la richiesta che chiude il tema**: *«rimuovi la parte "come lo chiamate". Voglio che il funzionamento di aggiungere un luogo sia normalizzato come quello dell'aggiunta dall'elenco»*. Da lì **D-64**: una schermata sola, una funzione sola, e la rimozione del «segna dove sono». 🔑 D-63, scritta poche ore prima, si è rivelata **una tappa e non un approdo**: aveva messo la ricerca *accanto* al vecchio pannello invece che *al posto suo*, e quindi aveva lasciato in piedi le due strade che B-19 aveva appena mostrato essere il problema.

⚠️ **Non verificato**: l'hub non è stato visto girare. La preview web non ci arriva — il cancello di sessione porta alla schermata d'ingresso e l'accesso è via codice email — quindi restano `tsc`, `eslint`, e i due bundle (iOS 15,2 MB e web 12,3 MB, entrambi 200) coi nuovi simboli verificati per stringa.

**Sessione**: —.

### 2026-08-27 (seconda sessione) — Via il tocco lungo, e l'app impara a muoversi

**Sessione**: [`workspace/sessione-2026-08-27-movimento.md`](../../workspace/sessione-2026-08-27-movimento.md).

**Chiesto dall'utente**: togliere dalla mappa la funzione «tieni premuto per aggiungere un posto» e la scritta che la spiegava; e migliorare la UX con delle animazioni, «effetti spostamento per esempio».

**Fatto, primo giro**: **D-52** (via il tocco lungo) e **D-53** (uno strato di movimento condiviso, invece di animazioni sparse).

**Fatto, secondo giro** — dopo che l'utente ha guardato l'app sull'iPhone: **D-54** (il calendario si muove, e nella vista agenda si scorre di un giorno), **D-55** (la base sotto il vetro: una prop, e la regola che chiude il «sembra in ombra»), **D-56** (la pagina evento si sfoltisce, e il tag si cambia dall'ingranaggio), più **B-15** — il riquadro della barra che spariva, mitigato senza aver isolato la causa.

**Fatto, terzo giro**: **D-57** — la vista «Eventi» diventa **«Diario»** (rinominata anche nel tipo `Vista`, non solo nell'etichetta), e i **commenti tornano** sugli eventi col loro nome vero. Nessuna migrazione: la tabella era stata lasciata intatta apposta in D-56. Tre file nuovi: [`lib/movimento.ts`](lib/movimento.ts) — i token di molle, durate e cascate, che stanno a `tema.ts` come il movimento sta al colore — [`components/ui/premibile.tsx`](components/ui/premibile.tsx) e [`components/ui/comparsa.tsx`](components/ui/comparsa.tsx).

**Dove si vede**: ogni comando di vetro dell'app ora **cede sotto il dito** e vibra sull'azione (prima non davano riscontro di nessun tipo) · il bottone pieno **si accende** in magenta invece di scattarci · sulla mappa la pillola Mappa/Elenco **scivola**, il «+» e l'anteprima **entrano ed escono** invece di apparire e sparire, e l'anteprima **guizza** quando cambia contenuto · home e liste entrano **a onda**.

**Verificato**: `tsc` pulito, `eslint` senza errori, bundle web di **3221 moduli** senza errori, console del browser pulita, e — contro la realtà, non contro «compila» — il `transform` di Reanimated **davvero applicato** al nodo del bottone (`matrix(1,0,0,1,0,0)` a riposo, non `none`) con geometria **identica** a prima dell'incapsulamento (344×58 a x=32, invariata). Questa era la lezione di B-08: uno stile che si dà per applicato e non lo è.

⚠️ **Non verificato: le animazioni in movimento.** Nella preview il pannello del browser non componeva fotogrammi, quindi `requestAnimationFrame` era fermo e sul web Reanimated non poteva girare: 0 fotogrammi campionati. Sul telefono l'animazione gira sul thread della UI, che è un'altra implementazione. **Serve il giro sull'iPhone** — vedi il PUNTO DI RIPRESA.

---

### 2026-08-27 — Il giro di design sui riferimenti, e la modalità unica

**Sessione**: [`workspace/sessione-2026-08-27.md`](../../workspace/sessione-2026-08-27.md).

**Fatto**: modalità unica (D-39) · barra in basso con la lente di vetro che viaggia (D-40) · calendario rifatto sullo shot Exyte — testata sfumata, pillole, agenda a fasce orarie (D-41) · pagina evento rifatta sullo shot Shakuro — hero a tutto schermo e foglio (D-42) · pin della mappa e anteprima in sovraimpressione (D-43). **B-02 chiuso**, ma non per la ragione che sembrava. Nuovi componenti: `testata-calendario`, `pillola-evento`, `griglia-mese`, `agenda-giorno`, `anteprima-evento`.

**Fatto di passaggio**: la maschera dei campi di Google Places è ora **doppia** — `places.photos` si chiede solo cercando ristoranti, che sono gli unici a usarne la foto. Google fattura al SKU più alto fra i campi chiesti, quindi chiederle sempre alzava il conto anche per la mappa, che le foto non le guarda.

**Verificato**: `tsc` pulito, `eslint` senza errori, bundle **web** di 2767 moduli e bundle **iOS** di 3527 moduli — il secondo conta, perché è l'unico che compila `mappa-vera.native.tsx` e `vetro-nativo.native.ts`, che il web non vede mai. In console la palette unica con **zero** regole `prefers-color-scheme`. **Non verificato**: l'aspetto vero delle schermate — serve il giro sull'iPhone.

**Poi, provando il design sull'iPhone**, sono emersi **B-08** (gli stili-funzione su `Pressable` non arrivano — tre correzioni fallite prima di trovarne la causa nella sorgente di NativeWind) e una serie di difetti di layout: griglia del mese sotto la barra, foglio dell'evento tagliato, liste orizzontali senza altezza dichiarata. Rifatto il visore foto come componente **unico** per evento e galleria, con zoom, filmstrip e chiusura trascinando in giù.

**Poi il progetto Supabase è risultato in pausa** (l'app diceva solo «network request failed»), ed è stato ripristinato dall'utente: stesso ref, quindi dati e schema intatti — verificate tutte e 18 le tabelle. Rientrando a controllare che lo schema fosse sopravvissuto è saltato fuori **B-07**, un difetto di permessi vivo dal 2026-08-12 che i 54 test non vedevano — anzi, da cui **tre di essi dipendevano**. Corretto con `0014`, applicata e verificata: suite a **60 asserzioni, tutte verdi**.

---

### 2026-08-12 — Avvio del progetto

**Sessione**: [`workspace/sessione-2026-08-12.md`](../../workspace/sessione-2026-08-12.md).

**Fatto**: raccolti scopo, contesto e vincoli; scelte piattaforma e stack; creati i tre documenti obbligatori. **Nessuna riga di codice, nessuna risorsa cloud creata, nessun repo remoto.**

**Stato**: `Projects/LifeCouple/` esiste come cartella nel brain. **Non è ancora un repo git né un submodule** — sono azioni irreversibili e attendono conferma esplicita (`CLAUDE.md` §6).

---

## 3. Decisioni

### D-67 — I due giochi costruiti: chi decide cosa, e cosa non tocca mai il database
**Fatto il 2026-08-28**, dopo che l'utente ha applicato la migrazione 0020. Versione **ufficiale** di «indovina il disegno» (5 round) e «telepatia» (10 round).

🔑 **La regola che tiene in piedi una partita a due: ogni cosa la decide UNO SOLO.** In un gioco a due telefoni, ogni decisione presa da entrambi può essere presa **in due modi diversi**, e ciò che ne esce non è un errore ma un *disaccordo* — molto più difficile da leggere. Le responsabilità sono divise senza sovrapposizioni:
- **disegno**: chi disegna crea il round, pesca la parola, tiene il tempo e chiude; chi indovina manda tentativi e basta;
- **telepatia**: chi ha creato la partita apre e chiude tutti i round; l'altro sceglie e basta;
- **il turno non si negozia**: chi ha creato la partita disegna nei round dispari, l'altro nei pari. È una funzione del numero di round, quindi i due telefoni ci arrivano alla stessa risposta **senza scambiarsi un messaggio**.

🔑 **Il tentativo si giudica sul telefono di chi disegna**, ed è il punto in cui la regola del gioco e il confine di sicurezza **coincidono**: il telefono di chi indovina *non ha la parola* — la policy di `round_segreto` glielo impedisce — quindi non potrebbe giudicare nemmeno volendo. Quando il confine tecnico cade dove cade quello del gioco, è il segno che è nel posto giusto.

**I tratti viaggiano normalizzati fra 0 e 1**, non in punti-schermo. Un iPhone SE e un Pro Max differiscono di un terzo in larghezza: con coordinate assolute il disegno arriverebbe **tagliato o rimpicciolito in un angolo**. In frazioni di tela la stessa casa è la stessa casa su qualunque schermo. E vanno nel canale **broadcast**: non si salvano, non si rileggono, non pesano su D-22.

⚠️ **La telepatia interroga a intervalli invece di ascoltare**, ed è voluto: `invio_sigillato` non sta nella pubblicazione realtime e non ci starebbe bene, perché la sua RLS nasconde la riga dell'altro — l'evento non arriverebbe comunque a chi aspetta. La domanda ripetuta a `rivela_telepatia` è la strada onesta, e dura solo i secondi fra la prima scelta e la seconda.

⚠️ **Tre secondi di pausa fra un round e il successivo** (`PAUSA_FRA_ROUND`), correzione fatta prima che il difetto si vedesse: chiuso un round, chi apre il successivo lo avrebbe creato nel fotogramma dopo, e la riga «era: cane» sarebbe comparsa e sparita prima che l'occhio ci arrivasse. **Il round finito è il momento per cui si sta giocando**, e mangiarselo per fretta toglie al gioco la sua unica soddisfazione.

**Sessanta secondi per disegnare**, non novanta: chi disegna smette di aggiungere dettagli utili molto prima, e chi indovina ha già detto tutto. Un timer lungo non allunga il gioco, allunga *l'attesa dentro il gioco*.

**I due punteggi si chiamano «Intesa» (disegni) e «Sintonia» (telepatia)** e sostituiscono la Classifica, chiudendo il problema aperto in D-62. Nessuna frase di fine partita dice «hai perso»: il punteggio è **della coppia**, quindi non c'è nessuno che ha perso contro nessuno — e una frase da pagella sarebbe l'app che emette un verdetto sulla relazione, cioè ciò che P-03 vieta.

### D-66 — L'impianto dei due giochi: banco nell'app, chiavi nel database, disegni effimeri
**Chiesto dall'utente il 2026-08-28**: sviluppare **telepatia** e **indovina il disegno** (versione ufficiale). Entrambi partono quando **tutti e due premono «avvia partita»**; 5 round per i disegni, 10 per la telepatia; banchi da **500 parole** ciascuno; punteggio finale con una piccola animazione.

**Tre decisioni reggono tutto il resto.**

🔑 **1. Il banco delle parole sta nell'app, non nel database.** Ogni voce è `[chiave inglese, testo italiano]`; nel database viaggia **solo la chiave**, che è neutra rispetto alla lingua. Conseguenza che è anche la ragione della scelta: **due partner con il telefono in lingue diverse giocano la stessa identica partita** — stesso round, stessa parola, stessi punti — vedendo ognuno la propria lingua. Per un'app di coppia la coppia mista non è un caso di scuola.
   *Alternativa scartata*: le mille voci nella tabella `domanda`, che ha già una colonna `lingua`. Costava un viaggio di rete per ogni parola mostrata, un passo di semina in ogni ambiente, e soprattutto rendeva **possibile che le due liste divergessero** — 500 righe italiane e 499 inglesi è un difetto che si scopre al round 500.

🔑 **2. È il client di turno a pescare la parola.** Chi disegna pesca la propria; chi avvia un round di telepatia pesca il tema e le quattro opzioni. ⚠️ **Non è un rilassamento di «l'autorizzazione sta nel database»** (D-12): quella regola esiste dove c'è **un avversario**. Qui non c'è — il punteggio è *della coppia*, non di uno contro l'altro — e barare significherebbe rubare punti a sé stessi. L'unica cosa che va davvero protetta è che **chi indovina non legga la parola**, e quella sta nel database, con la sua policy.
   ⚠️ E sta in una **tabella a parte** (`round_segreto`), non in una colonna: la RLS di Postgres decide quali *righe* si leggono, non quali *colonne*. Chi indovina la riga del round deve leggerla — contiene il numero e chi disegna — quindi la parola non poteva starci dentro.

🔑 **3. I disegni non si salvano.** I tratti viaggiano nel canale broadcast e muoiono con la partita. P-04 aveva lasciato aperte tre domande — se un disegno sia contenuto personale o condiviso (D-04/D-21), se si conservi, se pesi sul tetto di 1 GB (D-22): **non salvandolo, le tre domande non esistono più**. È la scelta che toglie problemi invece di risolverli, ed è anche la ragione per cui questo gioco costa molto meno di quanto P-04 temesse.

**Il ciclo di vita** sostituisce quello di D-12 (`invito → deposito → tentativi`), che descriveva una partita a domande: ora è `attesa → in_corso → conclusa`, e l'attesa finisce **da sola** quando la seconda persona è pronta. La prontezza è una riga per persona in `partita_pronto` e non due colonne booleane, perché «puoi scrivere solo la tua colonna» in RLS si esprime male, mentre `utente_id = auth.uid()` si legge da solo.

**Cosa di D-12 resta e serve ancora**: `invio_sigillato` e la sua policy «l'altro non legge mai» sono **esattamente** ciò che vuole la telepatia, dove scegliere sapendo la scelta dell'altro non è barare, è non giocare. La funzione `rivela_telepatia` è quella che il commento del 2026-08-12 prometteva (*«arriverà coi giochi»*). ⚠️ Finché manca una delle due scelte **non restituisce niente** — non «la tua sì e la sua no»: rispondere a metà direbbe *quando* l'altro ha scelto, che è già un'informazione di troppo.

**I punteggi al posto della Classifica.** L'utente ha chiesto due punteggi invece di una graduatoria, *«essendo giochi di coppia»*. 🔑 **Quell'intuizione chiude da sola il problema aperto in D-62**: P-03 vieta che il punteggio diventi un verdetto sulla relazione, e una classifica *fra i due* lo sarebbe. Un punteggio **della coppia** non lo è — non c'è nessuno che vince contro nessuno. Nomi proposti: **Sintonia** (telepatia: avete scelto la stessa cosa) e **Intesa** (disegni: ti bastano quattro linee per farti capire). Descrivono i due insieme, che è precisamente ciò che li rende ammissibili.

### D-65 — «Indovina il disegno» entra fra i giochi, e porta con sé un secondo meccanismo
**Chiesto dall'utente il 2026-08-28**: *«come gioco aggiungi anche "indovina il disegno"»*.

**Non è un'idea nuova**: è la **proposta 1 di P-04**, registrata il 2026-08-12 e analizzata lì. Questa decisione la **promuove** da *possibile gioco futuro* a *gioco previsto*, e nell'hub è già una carta come le altre. Ciò che P-04 aveva scritto resta vero e va tenuto in vista, perché è il costo:

🔑 **Non è un quarto gioco: è un secondo meccanismo.** Gli altri tre — quiz, obbligo o verità, telepatia — sono **lo stesso** congegno, il sigillo D-12: *ognuno manda in segreto, si rivela quando hanno mandato entrambi*. Questo è *uno produce, l'altro indovina*, che il progetto **non ha**. È il singolo motivo per cui non costa un quarto di quanto sono costati gli altri tre insieme, ma parecchio di più.

🔴 **P-04 aveva già scritto la strada più economica per arrivarci, e vale la pena ripeterla qui**: la proposta 2, *«indovina la parola dell'altro»*, è **lo stesso meccanismo senza il disegno** — nessuna superficie da disegno, nessun file, nessuno spazio consumato. Farla prima verifica se il formato piace **al costo di una schermata**. Non è una decisione presa oggi: è l'avvertenza da avere sul tavolo quando si aprirà il cantiere.

⚠️ **Tre vincoli già esistenti che questo gioco tocca**, e nessuno dei tre è una rifinitura:
- **D-04 / D-21**: un disegno è **un contenuto con un autore**, come una foto. Va deciso se allo scioglimento resta a chi l'ha fatto o è condiviso — la decisione non c'è ancora.
- **D-22**: se i disegni si conservano, occupano spazio, e il tetto di 1 GB imposto dal database li riguarda.
- **D-08** non c'entra: un disegno non è un banco di domande. *È l'unico dei quattro di P-04 che non ha un problema di categorie particolari.*

**Nell'hub oggi non costa nulla** — è una carta, un emblema e due stringhe per lingua — e sta **in fondo** al carosello di proposito: è il meno pronto dei quattro, e l'ordine del carosello dice anche questo. Il colore è il **verde** dei pastelli (`vacanza`), l'ultimo libero della famiglia già in uso: nessuna tinta nuova da tarare.

⚠️ **L'emblema mostra UNA cosa sola** — un foglio e una matita — mentre gli altri tre ne mostrano **due** simmetriche (due fumetti, due teste, la bottiglia che gira in mezzo). Non è un vezzo: è la differenza fra i due meccanismi resa visibile prima di leggere il titolo. Negli altri tre agite insieme; qui uno fa e l'altro aspetta.

### D-64 — Un posto si aggiunge in **un modo solo**, e il «segna dove sono» sparisce
**Chiesto dall'utente il 2026-08-28**: *«rimuovi la parte "come lo chiamate". Voglio che il funzionamento di aggiungere un luogo sia normalizzato come quello dell'aggiunta dall'elenco»*.

**Cosa c'era**: due porte che creavano la stessa entità in due modi diversi. Da **Liste** si cercava un posto vero e nasceva completo — identità Google, copertina, genere. Dalla **mappa** si prendeva la posizione attuale, si scriveva un nome a mano e nasceva più povero. **B-19** aveva già mostrato che le due righe non erano uguali; D-63 aveva corretto il *risultato* ma lasciato le *due strade*.

🔑 **Normalizzare non è stato togliere un campo, è stato togliere una delle due strade** — e a tre livelli, perché a fermarsi al primo si sarebbe ricostruita la divergenza al primo ritocco:
1. **Una schermata sola**: [`components/foglio-aggiungi-luogo.tsx`](components/foglio-aggiungi-luogo.tsx), usata da Liste **e** dalla mappa. Prima erano due blocchi di JSX quasi identici in due file.
2. **Una funzione sola**: `creaLuogo` in [`lib/preferiti.ts`](lib/preferiti.ts), estratta da dentro l'hook proprio perché la mappa non poteva chiamarla — aveva il suo `useLuoghi` con la sua `aggiungi`. Chi ha una lista da rinfrescare ci mette sopra la sua `ricarica`; il resto è identico per costruzione.
3. **La seconda funzione è stata cancellata**, non lasciata inutilizzata. ⚠️ Una strada che nessuno percorre è **peggio** di una in uso: non viene aggiornata quando cambia lo schema, e chi la trova fra sei mesi la ricollega credendola equivalente. Al suo posto, in `lib/luoghi.ts`, resta un commento che dice cosa c'era e perché non c'è più.

🔴 **Cosa si perde, e va detto senza sconti**: **non si può più segnare un punto che su Google non esiste** — la panchina, il belvedere senza nome, «casa della nonna». È il prezzo della normalizzazione, non un effetto collaterale trascurabile. È però coerente con **D-37**, che aveva già deciso che *un luogo si sceglie fra quelli veri*: la mappa era rimasta l'ultima porta da cui lo si poteva inventare. Se un giorno servisse di nuovo, la strada giusta non è rimettere il pannello: è aggiungere «segna questo punto» **dentro l'unico foglio**, sotto la ricerca — così la porta resta una.

**Con «segna dove sono» spariscono anche** il permesso di posizione chiesto in fase di aggiunta (resta quello di D-59, che serve a centrare la mappa), l'interruttore «ci siamo già stati» — un posto cercato nasce «da visitare», come in Liste — e cinque stringhe per lingua.

⚠️ **Conseguenza che vale la pena notare**: D-63 era stata scritta **quattro ore prima** ed è già in parte superata. Non è lavoro sprecato — è stata la mossa che ha reso visibile il problema vero: mettere la ricerca accanto al pannello vecchio ha mostrato, guardandoli affiancati, che il pannello vecchio non serviva più. *Alcune decisioni si prendono bene solo dopo aver visto la versione intermedia.*

### D-63 — La ricerca torna sulla mappa, ma dentro il pannello e non sopra la mappa
**Chiesto dall'utente il 2026-08-28**: *«ero in mappa dopo il "+", allora in questo caso vorrei che avesse lo stesso funzionamento di aggiungi luogo in elenco»*.

**Il conflitto apparente con il 2026-08-27**, e perché non è un dietrofront: quel giorno era stata tolta **la barra di ricerca fissa sopra la mappa**, per due ragioni che restano valide — era un campo di testo permanente addosso a una schermata che di spazio ha bisogno tutto, ed era un **secondo ingresso** per una cosa che ne aveva già uno in Liste. Qui la ricerca sta **dentro il pannello che si apre dopo il «+»**: non toglie un pixel alla mappa, e non è un secondo ingresso — è la seconda metà dell'unico ingresso, quello che finora sapeva dire soltanto «dove sono adesso». *Una decisione si rovescia quando cade la ragione che l'aveva motivata; qui la ragione regge, ed è il caso d'uso a essere diverso.*

**Scegliere un suggerimento sostituisce anche le coordinate**: non stai più segnando dove sei, stai segnando quel posto. E il posto nasce **«da visitare»** invece che «ci siamo stati», come in Elenco — chi cerca un posto per nome di norma non ci è ancora stato, e chi sì ha l'interruttore lì sotto.

⚠️ **Il campo del nome resta, e perde `autoFocus`.** Resta perché il nome è l'etichetta che date **voi** al posto — «da noi», non «Via Roma 14». Perde il fuoco automatico perché con due campi nello stesso foglio, aprire la tastiera su quello sbagliato manda a scrivere un nome a chi voleva cercare.

🔑 **E il pannello ora si apre PRIMA di chiedere il permesso di posizione, non dopo.** Prima un permesso negato faceva `return` e il pannello non compariva affatto: il «+» della mappa era un bottone che non fa niente. Da oggi quel pannello contiene anche una strada che la posizione non la usa, quindi legarlo al permesso avrebbe chiuso l'unica porta d'ingresso della mappa a chi il permesso lo ha negato una volta. Si apre al **centro della mappa** — ciò che l'utente sta guardando, quindi il default meno sbagliato — e la posizione vera, se arriva, corregge; se non arriva **il pannello lo dice**, invece di lasciar credere che il punto sia giusto.

**Alternativa scartata**: rimettere la barra di ricerca sopra la mappa, cioè annullare la decisione di ieri. Costava lo spazio che ieri si era deciso di non spendere e riportava i due ingressi. Il pannello li tiene tutti e due nello stesso posto senza costare niente alla mappa.

### D-62 — L'hub dei giochi: un carosello, e due comandi che non si spostano
**Chiesto dall'utente il 2026-08-28**, con due riferimenti visivi: da uno lo stile **«toon»**, dall'altro **l'organizzazione a carte** che si scorrono. Più: sotto, «Classifica» e «Gioca» (che fa scegliere fra versione ufficiale e personalizzata), e le animazioni di scorrimento e di **zoom della carta alla pressione di un comando**.

**Cosa si è preso dei riferimenti, e cosa no.** Dal primo la **grammatica** del toon — forme piene e grasse, nessuno spigolo, un riflesso bianco per volume, una sfumatura per volume — e **non la tavolozza**: quei viola accanto a "Quarzo rosa" avrebbero fatto sembrare l'app due app. I colori dei tre giochi sono i **pastelli dei tipi di evento** già in `lib/tema.ts`. *Non è riuso per pigrizia: è lo stesso problema — distinguere a colpo d'occhio pochi elementi di pari rango — e con due famiglie di colori vicine si vede subito quale è arrivata dopo.*

**Carosello e non griglia.** La griglia di tre icone era più corta da scrivere. Il carosello vince perché i giochi sono **tre e resteranno pochi** (P-04 ne propone altri quattro, non altri quaranta): con pochi elementi la griglia spreca lo schermo e li mostra tutti alla stessa distanza dall'occhio, mentre il carosello ne sceglie **uno alla volta** e può quindi permettersi, di ognuno, un disegno grande e una frase intera invece di due parole sotto un'icona.

⚠️ **La carta è larga il 74% dello schermo, non il 100%**: le vicine devono sporgere. Un carosello a pagina piena non si legge come un mazzo, si legge come una schermata che ogni tanto cambia contenuto — e nessuno prova a scorrerla, perché niente dice che ci sia dell'altro.

🔑 **I due comandi restano due, sempre gli stessi, fermi in fondo.** È la parte del riferimento che valeva la pena prendere. Se ogni carta avesse i suoi bottoni, cambiare gioco sposterebbe anche i comandi, e ogni scorrimento costringerebbe a ritrovarli.

**Le carte non sono di vetro**, ed è una scelta contro l'abitudine dell'app: qui il contenuto *è* la carta, e tre vetri affiancati su fondo chiaro diventano tre rettangoli lattiginosi distinguibili solo dal titolo — l'opposto di ciò che serve a un carosello, dove **si deve capire dove si è senza leggere**. Il vetro resta ai due comandi, che sopra una carta colorata hanno finalmente qualcosa da lasciar trasparire. Di passaggio si evita il vetro-dentro-il-vetro di D-60.

**Il movimento**: ogni carta legge la stessa `x` dello scorrimento e ne ricava la propria distanza dal centro; da quella discendono scala, opacità, quota e una **piccola rotazione** (5 gradi — a 10 sembrava un mazzo buttato sul tavolo: su un'app di coppia il registro è *giocoso*, non *sciatto*, e la differenza sta in quanti gradi si concede). Lo **zoom** resta su finché il foglio è aperto invece di essere un lampo: così non è un effetto sul bottone, è la carta che **viene avanti** perché il foglio parla di lei.

**Le due sorgenti di domande** dietro «Gioca» sono D-19 / backlog 11-bis, non due giochi: in schema è la colonna `domanda.coppia_id` (NULL = banco comune).

⚠️ **L'hub non finge.** Le partite non esistono ancora — manca la voce 8, il sigillo D-12 — quindi i comandi si aprono davvero e mostrano ciò che mostreranno, **e dicono cosa manca**. È la regola di `SezioneInArrivo` applicata a una schermata ormai troppo piena per essere un cartellino.

⚠️ **Il cartellino «serve il partner» sostituisce i comandi, non la schermata.** Chi è ancora solo vede lo stesso i tre giochi e capisce cosa lo aspetta; quello che non può fare è avviarli. Coerente con la scelta del 2026-08-13: *si blocca ciò che senza due persone non esiste, non ciò che senza due persone è solo meno bello.*

**Aggiornamento del 2026-08-28, dopo il primo sguardo sull'iPhone** — riferito: *«la parte bassa (pulsanti, barra di scorrimento e toolbar) mi sembra un po' schiacciata e troppo vicina tra loro»*. Esatto, e la causa era una sola: **l'altezza del carosello non era decisa da me**. La `ScrollView` non aveva altezza e se la prendeva dal contenuto, allungandosi dentro la colonna `flex-1`; il risultato è che lo spazio finiva tutto in un vuoto sopra i puntini, e ciò che veniva dopo si stringeva in fondo. *In una colonna elastica lo spazio non sparisce: si accumula dove nessuno lo ha assegnato.*

Correzione: altezza esplicita della pista (`ALTEZZA + 48`) e `flexGrow: 0`. I 48 punti non sono aria — sono il posto in cui la carta si **ingrandisce con lo zoom** (1,07 su 390 fanno 27 punti) e in cui cade la sua ombra: una `ScrollView` ritaglia ai propri bordi, e senza quel margine premere «Gioca» avrebbe tagliato la carta proprio mentre la si guarda venire avanti. Poi: i puntini più vicini a ciò che indicano (`mt-2`) e più lontani da ciò che li segue, e in fondo `SPAZIO_BARRA + 26` invece di `SPAZIO_BARRA` — ⚠️ quella costante misura il **minimo per non finire sotto la barra**, non la distanza a cui una riga di testo smette di sembrarle addosso.

🔴 **Una cosa NON è decisa, e va decisa prima di riempire la Classifica di numeri.** L'utente ha chiesto che mostri «chi ha vinto più volte». P-03 e l'avvertenza su P-04 dicono che il punteggio non deve diventare *un verdetto che resta sulla relazione*, e una graduatoria di partite vinte fra le due persone **è** una classifica persistente fra loro. Il conteggio si fa; **come** si formula — vittorie dell'ultima partita o totale di sempre, per gioco o complessivo — è ciò che separa un gioco da una pagella. Rimandata a quando le partite esisteranno: oggi la schermata dice solo che non avete ancora giocato, quindi la decisione non è stata presa di nascosto scrivendo codice.

### D-61 — Niente vetro di sistema creato dentro un livello a opacità zero
**Contesto**: il «+» della mappa senza il suo tondo **appena avviata l'app**, e solo allora (B-16).

**La causa**: su iOS il Liquid Glass è una vista **nativa** che campiona ciò che ha dietro. Creata dentro un livello a opacità 0 non cattura niente, e quando l'opacità torna a 1 **l'effetto non si ripresenta da solo**: restano i figli — l'icona — e la superficie no. Il «+» stava dentro due livelli che al montaggio partivano da zero: la `Comparsa` che lo avvolge, e la dissolvenza di scena della mappa.

**Scelta, in due punti**:
1. `Comparsa` guadagna `entraAlMontaggio`. Con `false` l'elemento parte già presente. Vale anche senza il vetro: **un elemento che c'è già quando la schermata compare non ha nulla da cui entrare** — sta entrando la schermata, e l'entrata dentro l'entrata si legge come uno scatto.
2. La dissolvenza fra le due viste della mappa gira **solo sui cambi**, non al montaggio. All'avvio non c'è nessuna scena precedente da cui dissolvere: era un lampo di vuoto.

**E resta la rete**: `TondoVetro` prende `fondo="sicuro"` di default. ⚠️ Quel valore era stato scritto il 2026-08-27 **proprio per questo caso** e non era mai stato messo su nessun componente. *Una rete di sicurezza progettata e non collegata è esattamente come non averla* — ed è la seconda volta in due giorni che D-55 fallisce non per l'idea ma per l'applicazione (vedi D-60).

**Alternativa scartata**: far ricreare il vetro dopo l'entrata (un `key` che cambia a fine animazione). Scartata perché scommette sulla diagnosi: se la causa fosse un'altra non resterebbe niente, mentre non-nascere-a-zero e la base chiara reggono comunque.

### D-60 — La base sotto il vetro si deduce dall'albero, non si dichiara a mano
**Contesto**: il 2026-08-27 D-55 aveva introdotto la prop `fondo` e la regola *«vetro dentro un foglio ⇒ `fondo="pieno"`»*, a carico di chi scrive la schermata. Il 2026-08-28 l'utente ha riferito che il pannello «aggiungi un luogo» **è ancora in ombra**.

🔑 **La regola era giusta e il modo di applicarla no.** Con **cento** punti di chiamata del vetro, la disciplina al punto di chiamata non regge — e non ha retto: la carta del pannello *aveva* la sua base, ma i **bottoni dentro** no. In `cerca-luogo.tsx` c'era anche scritto il perché non poteva essere altrimenti: *«un componente non sa in che albero è stato montato»*. **Era falso**: il contesto di React serve esattamente a saperlo, ed è quella frase ad aver fatto sopravvivere il difetto un giorno intero.

**Scelta**: un contesto `ContestoNienteSotto`. Chi mette una velatura scura lo dichiara **una volta** (`Foglio` lo fa da sé); un `Vetro` lo dichiara ai propri figli senza che nessuno glielo dica — *sotto un vetro c'è il vetro, non il contenuto*. Il valore passato a mano vince sempre: il contesto è il default giusto, non un'imposizione.

**E fa la seconda metà del lavoro: niente vetro dentro il vetro.** Su iOS 26 annidare un Liquid Glass dentro un altro non gli fa campionare il vetro che lo contiene, gli fa campionare lo sfondo di entrambi — cioè la velatura scura del modale. **È così che il bottone dentro il foglio diventava scuro.** Quando siamo dentro si usano i tre strati, che sopra una base chiara opaca danno la stessa superficie senza chiedere al sistema una composizione che non supporta.

⚠️ **Terza esclusione, e chiude il caso senza indovinarlo**: niente materiale di sistema neanche quando `fondo === 'pieno'`. Sotto c'è una base **opaca**: non c'è niente da attraversare, quindi niente da guadagnare, e resta solo il rischio che il materiale campioni il buio invece della base. *Un vetro a cui si è tolto l'«attraverso» non è più vetro: è una superficie chiara, ed è meglio disegnarla noi che chiederla al sistema.* Serve perché non era accertato **quale** dei due strati fosse il colpevole — la carta o i bottoni: così l'esito non dipende dalla diagnosi.

⚠️ **Conseguenza da non perdere**: `BottoneVetro` decideva il colore del testo da `VETRO_NATIVO`, che dice se **il sistema** ha il Liquid Glass, non se **quel** bottone lo sta usando. Dentro un foglio ora non lo usa, e il bianco pensato per il vetro tinto sarebbe finito su una velatura rosa chiara — un'etichetta illeggibile. La domanda giusta non è «il sistema ha il vetro?» ma «che superficie ho sotto i piedi io?».

**Lezione**, che vale oltre il vetro: **una regola che dipende dalla memoria di chi scrive la prossima schermata non è una regola, è una speranza.** Se il dato che serve è deducibile dalla posizione nell'albero, si deduce.

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

### D-59 — La mappa chiede il permesso di posizione, e lo richiede a ogni apertura
**Chiesto dall'utente il 2026-08-27**: *«quando apro la mappa vorrei fosse posizionata sulla posizione attuale»*.

**Contesto — la funzione c'era già e non funzionava per nessuno.** Il centraggio sulla posizione era stato scritto il 2026-08-27 insieme alla modifica di D-05, ma dietro un cancello: si leggeva la posizione **solo se il permesso era già stato concesso**, e l'unico modo di concederlo era premere «segna dove sono adesso». Chi quel bottone non l'aveva mai toccato vedeva la mappa aprirsi a Milano — cioè vedeva il comportamento di *prima* della funzione, senza niente che glielo spiegasse.
🔑 **È il modo di fallire peggiore di tutti**: non un errore, ma una funzione che tace. Il codice sembrava a posto rileggendolo, e infatti nessuno se n'era accorto in due sessioni.

**Opzioni presentate all'utente**: (a) una schermata di spiegazione prima del dialogo di sistema, una volta sola; (b) il dialogo di sistema e basta; (c) lasciare com'era.
**Scelta dell'utente**: **(b)**, *«io userei il permesso iOS. Se poi viene rifiutato e accettato in un secondo momento dalle impostazioni allora torna il funzionamento normale»*.
**Costo accettato, ed era l'argomento di (a)**: un permesso chiesto senza un motivo davanti si nega più spesso, e su iOS il dialogo si presenta **una volta sola**. La ragione per cui il costo è accettabile è tutta nella seconda metà della richiesta: la strada del recupero esiste ed è stata resa funzionante.

🔑 **La parte che vale più del dialogo: si rilegge il permesso a ogni apertura, non una volta sola.**
Il permesso può essere negato e concesso **dopo, dalle Impostazioni di iOS**. È un pezzo di stato che *una cosa fuori dall'app* può cambiare mentre la schermata resta montata — ed è **esattamente la forma di B-09/B-13**, *due copie dello stesso stato di cui una non viene aggiornata*, con iOS al posto dell'altra schermata. La regola scritta il 2026-08-27 (*se una schermata legge dati che un'altra può scrivere, deve rileggere al focus*) si applica identica: da `React.useEffect` a **`useFocusEffect`**. Senza questo, «lo concedo dalle Impostazioni e torno» avrebbe richiesto di **riavviare l'app**, e nessuno l'avrebbe collegato al permesso.

**Dettaglio che non è una rifinitura**: si guarda `canAskAgain` prima di chiedere. Dopo un rifiuto, su iOS `requestForegroundPermissionsAsync` **non mostra più niente** e ritorna subito negato: chiamarlo a ogni focus girerebbe a vuoto invece di riprovare. Il recupero passa dalle Impostazioni, non da una seconda richiesta.

**Un centraggio solo per sessione di schermata** (`centrataQui`, una ref): dalla seconda volta in poi la telecamera è dove l'utente l'ha lasciata, e riportarla addosso a ogni ritorno sarebbe uno strappo, non un aiuto.

**Nessun impatto su D-05**, che era già stata modificata il 2026-08-27 e non cambia qui: la posizione **non viene scritta, non viene mandata a nessuno, non esce dal telefono** — decide dove puntare la telecamera e muore con la schermata. Cambia *quando si chiede il permesso*, non cosa se ne fa.

### D-58 — Il calendario si apre sul Diario, non sul mese
**Chiesto dall'utente il 2026-08-27**, subito dopo D-57 che il Diario l'aveva creato.

**Perché**: il mese risponde a *«quando succede?»*, ed è la vista giusta mentre si **organizza**. Ma la maggior parte delle aperture non organizza niente: guarda **cosa c'è stato**. Per quella domanda il mese è la peggiore delle quattro viste — mostra pallini colorati e chiede un tocco in più per arrivare a una riga di testo che il Diario mostra da sola.
**Perché ora e non prima**: prima di D-57 questa vista si chiamava «Eventi» e sembrava *una lista fra le altre*. Rinominarla in «Diario» ha reso evidente che è **il modo principale di guardare i propri ricordi**, non una quarta opzione — ed è la seconda volta in due giorni che un nome sbagliato faceva prendere decisioni sbagliate sulla cosa che nominava (la prima è «Parole», in D-57).
**Conseguenza da tenere d'occhio**: la vista Diario carica le **anteprime delle foto** degli eventi, che il mese non chiede. Aprire il calendario ora costa quelle richieste **sempre**, non solo quando si va sul Diario. Sul dispositivo dell'utente non è stato misurato: se l'apertura risultasse lenta, è il primo posto dove guardare.
**Alternativa scartata**: ricordare l'ultima vista usata. Costa una preferenza da salvare e leggere, e rende l'apertura imprevedibile — la stessa app si apre diversa a seconda di cosa hai fatto la volta prima.

### D-57 — «Eventi» diventa «Diario», e i commenti tornano col loro nome
**Chiesto dall'utente il 2026-08-27**, poche ore dopo D-56.

#### La vista si chiama Diario

*«Invece di "eventi" chiama la parte "diario"».* Il nome nuovo non è solo più bello: **«eventi» descriveva il contenuto della lista**, che è esattamente ciò che mostrano anche le altre tre viste — e quindi non distingueva niente. **«Diario» descrive il modo di guardarli**: tutti in fila, senza griglia, dal più vicino al più lontano. Ed è la parola che l'app usa di sé stessa fin dalla schermata di benvenuto («il vostro diario condiviso»), quindi il titolo della vista è ora *«Il vostro diario»* invece di *«Tutti gli eventi»*.

⚠️ **Rinominato anche nel codice**, non solo l'etichetta: `Vista` è `'giorni' | 'mese' | 'anno' | 'diario'`. Una vista che l'utente chiama "diario" e il codice chiama "eventi" costringe a tradurre a ogni lettura, ed è il tipo di divergenza che dopo tre mesi nessuno ricorda più. Essendo un'unione di stringhe, **il compilatore ha trovato da solo tutti i punti da cambiare** — che è la ragione per cui una rinomina del genere costa dieci minuti invece di essere un rischio.

#### I commenti tornano

*«Agli eventi voglio che ci sia la possibilità di lasciare dei commenti da parte di entrambi i partner».*

🔑 **È la stessa sezione che poche ore prima, in D-56, era stata tolta perché si chiamava «Parole».** Vale la pena scriverlo per intero, perché la lezione non è sull'indecisione dell'utente: **era il nome a essere sbagliato.** "Parole" non diceva che quello fosse il posto dove scriversi qualcosa, quindi toglierla è sembrata una potatura di una sezione decorativa invece che la rimozione dei commenti. Un nome che non dice cosa fa una cosa non è un problema estetico: **fa prendere decisioni sbagliate su di essa.** Ora si chiama «Commenti».

**Ripristino a costo quasi zero**, ed è il dividendo della scelta fatta in D-56: la tabella `commento`, le sue policy e le funzioni `commenta`/`cancellaCommento` erano state lasciate dov'erano. Nessuna migrazione, nessun dato perso, e i commenti eventualmente già scritti sono ancora lì. *Se avessi cancellato anche il resto, questa richiesta sarebbe costata una migrazione e i vecchi commenti sarebbero spariti per sempre.*

**«Da parte di entrambi i partner» era già vero, e non per gentilezza di questa schermata: per il database.** La policy `commento_insert` della migrazione `0008` chiede `e_membro_attivo(coppia_id)` — cioè *un* membro della coppia, non l'autore dell'evento — e `autore_id = auth.uid()`, che rende impossibile scrivere a nome dell'altro. È una differenza voluta e vale la pena enunciarla:

> **L'evento è di chi l'ha scritto, i commenti sono di tutti e due.** Modificare o eliminare l'evento resta dell'autore (policy di `0001`); commentarlo no. Cancellare un commento, invece, torna a essere solo i propri (`commento_delete`), e il cestino compare di conseguenza — non per nascondere un errore, ma per non offrire un gesto che il database rifiuterebbe.

⚠️ **Il campo si svuota solo se l'invio è riuscito.** Svuotarlo comunque perderebbe ciò che era stato scritto proprio nel caso in cui serve di più — quando la rete non c'è — e non ci sarebbe nessun modo di riaverlo.

⚠️ **Il vuoto dice chi può scrivere**, e lo dice solo quando non c'è ancora niente: *«Potete scrivere tutti e due, quando volete.»* È l'unico momento in cui quell'informazione serve. Una riga fissa che spiega la funzione sarebbe un'istruzione permanente addosso alla schermata — la stessa cosa tolta dalla mappa poche ore prima con D-52.

### D-56 — La pagina dell'evento si sfoltisce, e il tag si cambia
**Chiesto dall'utente il 2026-08-27**, guardandola sull'iPhone. Tre cose, e due sono **sottrazioni**.

**Via la pillola del posto dai «Dettagli».** Il posto sta già **sotto il titolo**, in cima alla pagina, con la sua icona e il tocco che porta alla mappa. Ripeterlo trenta righe più in basso, in mezzo a data, ora e «l'hai messo tu», non aggiungeva un'informazione: costringeva a chiedersi se le due righe dicessero la stessa cosa. Dicevano la stessa cosa.

> È il secondo doppione tolto oggi, dopo il cartellino del tocco lungo. Il filo è lo stesso: **due modi di dire la stessa cosa non sono ridondanza utile, sono un dubbio da risolvere ogni volta che si guarda la schermata.**

**Via la sezione «Parole»** — il filo di commenti in fondo, col suo campo di scrittura.

> ⚠️ **Superata poche ore dopo da [D-57](#d-57--eventi-diventa-diario-e-i-commenti-tornano-col-loro-nome)**: l'utente ha chiesto i commenti sugli eventi, che erano esattamente questa sezione sotto un nome che non lo diceva. È tornata, col nome «Commenti». Questa decisione resta scritta perché la lezione è nella coppia: **un nome che non dice cosa fa una cosa fa prendere decisioni sbagliate su di essa** — e perché è il motivo per cui non aver cancellato la tabella è servito davvero.

⚠️ **Cosa non è stato toccato, e va saputo**: la tabella `commento`, le sue politiche RLS e le funzioni `commenta`/`cancellaCommento` in [`lib/evento-dettaglio.ts`](lib/evento-dettaglio.ts) **restano dove sono**. Nessuna migrazione. È sparita la schermata, non il dato: i commenti già scritti sono ancora nel database e tornerebbero visibili rimettendo la sezione. *Perché non ho cancellato anche il resto*: una tabella si svuota in un momento e non si riempie mai più, e nessuno ha chiesto di buttare via quello che c'era dentro.

**Il tag si cambia dall'ingranaggio.** Nuova voce «Cambia tag» e un foglio con i tre tag, **ognuno col suo colore e la sua icona presi da `aspetto()`** invece che riscritti lì: è la stessa funzione che colora le pillole del calendario e i pin della mappa, quindi il verde della vacanza è un verde solo in tutta l'app. Una seconda tabella di colori sarebbe divergente al primo ritocco.

⚠️ **La vacanza ha una forma diversa dagli altri tag**, e il foglio lo sa: non è un istante ma un **intervallo a giornate intere** (vedi `salva()` in `app/(tabs)/calendario.tsx`). Passando a vacanza si porta dietro il minimo che la renda coerente — una fine, che in mancanza d'altro è il giorno stesso, e `tutto_il_giorno`. La data di ritorno vera si mette poi con «Cambia data».

⚠️ **Uscendo da vacanza non si cancella niente.** La fine resta dov'è. Azzerarla sarebbe distruggere una data che l'utente aveva scelto, per un cambio di tag — e ricambiare idea non la riporterebbe indietro. **Una modifica che sembra reversibile non deve avere effetti che non lo sono.**

### D-55 — Una base sotto il vetro, e la regola che ne segue
**Da due difetti riferiti dall'utente il 2026-08-27**, che sembravano diversi ed erano **lo stesso**: *«alcune parti sembrano in ombra — la tendina di ricerca dei luoghi e il pop up per aggiungere luoghi»* e *«il riquadro della toolbar sparisce lasciando solo le icone»*.

**La causa comune**: il vetro mostra ciò che ha sotto. È la sua ragione d'essere, ed è anche il suo modo di rompersi.

1. **Dentro un foglio modale sotto il vetro non c'è contenuto**: c'è la **velatura scura** del modale (`rgba(20,8,14,0.4)`). La sfocatura mescola quel buio, e una superficie pensata chiara si legge sporca. Non è un difetto della sfocatura: è vetro messo dove non c'era niente di bello da guardarci attraverso.
2. **Se il materiale non viene disegnato, sotto non resta nulla** — perché non c'era nulla. Gli elementi sopra restano, la superficie no. Su iOS il vetro è una vista **nativa**: ha i suoi motivi per non disegnarsi, e non risponde a noi.

**La correzione** è una prop `fondo` su `Vetro`, che mette qualcosa sotto e **decide come il vetro fallisce invece di scoprirlo**:

- `'pieno'` — base chiara opaca, per il vetro dentro un foglio. Il buio non arriva più. Con la base opaca la sfocatura non ha più niente da sfocare e **si salta**: una vista nativa in meno per ogni foglio aperto.
- `'sicuro'` — velatura chiarissima (0,16–0,22 di bianco). Invisibile quando il materiale c'è; è tutto ciò che resta quando non c'è.

🔑 **La regola che ne esce, e che vale per ogni schermata futura**: **vetro dentro un foglio ⇒ `fondo="pieno"`**. Sta scritta nel commento di `CartaVetro`, non nella testa di chi scriverà la prossima schermata.

> È la stessa idea già applicata a `components/ui/comparsa.tsx` poche ore prima: *il modo in cui una decorazione fallisce va deciso, non scoperto.* Qui vale il doppio, perché il vetro è codice di sistema e non nostro.

**Applicata a**: la tendina di `components/cerca-luogo.tsx` (con una prop `dentroUnFoglio`, perché lo stesso componente vive in due posti diversi e solo uno è dentro un foglio — un componente non può sapere in che albero è stato montato), le carte dei fogli in `app/(tabs)/mappa.tsx`, `components/elenco-elementi.tsx` e `app/evento/[id].tsx`, e la barra volante in versione `'sicuro'`.

### D-54 — Il calendario si muove, e nella vista agenda si scorre di un giorno
**Chiesto dall'utente il 2026-08-27**: *«aggiungi delle animazioni anche al calendario […] in particolare per quanto riguarda l'header»* e *«nella sezione giorni vorrei che scrollando verso destra/sinistra si passasse al giorno successivo/precedente»*.

**La testata.** La pillola del selettore delle viste **scivola** invece di riaccendersi dall'altra parte — terza volta che si applica la stessa idea, dopo la lente della barra in basso e l'interruttore della mappa, e ormai è il modo in cui questa app dice «ho cambiato scelta». I tondi e le frecce cedono sotto il dito come ogni altro comando (`Premibile`, D-53), al posto dell'opacità fatta a mano che avevano. Nella striscia dei giorni il tondo bianco della selezione **si posa** invece di accendersi.

⚠️ Il disco della selezione è **una vista a parte dietro il numero**, non il colore di fondo della cella: un fondo che va da `transparent` a bianco **passa per il grigio**, mentre un disco bianco che cresce resta bianco per tutto il tragitto. La differenza si vede, ed è sporca.

**Il titolo arriva dal lato giusto.** Cambiando periodo il contenuto sotto scivolava già, e il titolo si sostituiva sul posto: due elementi che raccontano lo stesso movimento, uno in movimento e uno fermo.

⚠️ **L'animazione è legata alla stringa, non al gesto**, ed è il dettaglio che la rende giusta invece che fastidiosa: scorrendo un giorno per volta il titolo dice l'intervallo della *settimana*, che per sei giorni su sette **non cambia**. Se seguisse il gesto, si agiterebbe per non dire niente di nuovo.

**Lo scorrimento a giorni.** Il gesto orizzontale era **spento** nella vista agenda (`vista !== 'giorni'`), col ragionamento che appartenesse alla striscia dei giorni. Il ragionamento era sbagliato di un piano: la striscia sta nella **testata**, il gesto sta sul **corpo**, e sono due aree che non si toccano. Il risultato era che nell'unica vista dove scorrere di lato ha il significato più ovvio — un giorno avanti — non succedeva niente.

Ora il passo cambia con la vista: **un giorno** nell'agenda, il periodo intero altrove. Le frecce in testata continuano a saltare la **settimana**, ed è voluto: è la stessa divisione che questa schermata segue già per la striscia — *le frecce saltano la settimana, il dito va dove gli pare*.

⚠️ **La striscia ora scorre invece di teletrasportare**, ma solo **dopo la prima volta**. B-06 imponeva il salto secco: all'apertura la striscia deve *essere già* sul giorno giusto, e un'animazione al primo fotogramma o non parte o si vede partire da 60 giorni fa. Ma con il giorno che cambia a ogni trascinamento, lo stesso salto secco faceva sobbalzare la striscia mentre il contenuto sotto scivolava dolcemente. Primo posizionamento secco, successivi animati.

### D-53 — Il movimento diventa uno strato, non una decorazione sparsa
**Chiesto dall'utente il 2026-08-27** («rendi la UX migliore aggiungendo delle animazioni, come effetti spostamento per esempio»).

**Il problema vero non era la mancanza di animazioni: era la mancanza di riscontro.** Prima di questa sessione, un `BottoneVetro` premuto non faceva **nulla** — nessuna scala, nessun colore, nessuna vibrazione. Su un'interfaccia fatta di vetro, che per definizione non ha un rilievo da schiacciare, questo si legge come *«il tocco non è arrivato»*, e la reazione istintiva è **toccare una seconda volta**. Un'app che si fa toccare due volte per ogni azione sembra lenta anche quando è velocissima.

**Perché uno strato condiviso e non animazioni caso per caso.** Le molle stanno tutte in [`lib/movimento.ts`](lib/movimento.ts) per lo stesso motivo per cui i colori stanno in `tema.ts` — ma con una ragione **più forte**: due magenta leggermente diversi si notano solo se stanno vicini, due molle leggermente diverse si notano sempre, perché il confronto avviene col ricordo di trenta secondi fa. Una carta che sale con `damping 18` e un'altra con `damping 24` non sembrano due scelte: sembrano un difetto.

**I tre pezzi**:
- `lib/movimento.ts` — tre molle (`tocco` rigidissima, `entrata` morbida, `scivolo` in mezzo), le durate per ciò che sfuma, e la **cascata col tetto**.
- `components/ui/premibile.tsx` — il cedimento sotto il dito, in un posto solo perché è l'unico modo perché tutti i comandi cedano della stessa quantità.
- `components/ui/comparsa.tsx` — entrata **e uscita**, con lo smontaggio ritardato.

**Le regole che ne sono uscite, e che valgono da qui in avanti**:

1. **L'uscita è la metà che manca sempre.** Quasi ovunque nell'app l'entrata esisteva in qualche forma e l'uscita no: al giro dopo la condizione diventava falsa e React smontava. Il risultato è un movimento asimmetrico — entra con un peso, sparisce come un fotogramma tagliato — che si legge come un salto, e nel caso peggiore come un errore (*«è sparito? l'ho chiuso io?»*). Il pezzo che serviva non era l'animazione: era **smontare dopo invece che prima**.
2. **L'uscita è più corta dell'entrata, e senza molla.** Chi entra ha un peso da mostrare; chi esce si sta solo togliendo di mezzo, e chi l'ha chiuso guarda già altrove. Una molla in uscita fa *rimbalzare via* l'oggetto: sembra scherzoso, ed è il classico dettaglio che fa sembrare un'app poco seria.
3. **Il tatto conferma un fatto, non un contatto.** La vibrazione sta su `onPress` e non su `onPressIn`: sfiorando una scheda per iniziare a scorrere, `onPressIn` scatta comunque, e l'app vibrerebbe a ogni scorrimento per un'azione mai avvenuta. La scala, che invece è riscontro del *contatto*, resta su `onPressIn`, dove deve stare per sembrare immediata.
4. **Le cascate hanno un tetto.** Con 45ms di ritardo e venti schede, l'ultima parte quasi un secondo dopo: chi scorre subito vede righe accendersi **sotto il dito**, che non si legge come cura ma come un'app che non sta dietro. Oltre sei elementi il ritardo si ferma.
5. 🔑 **Il modo in cui una decorazione fallisce va deciso, non scoperto.** `Comparsa` parte da opacità zero: se l'animazione non partisse, ciò che avvolge resterebbe **invisibile per sempre**, e sulla home sarebbe la schermata principale in bianco. Non è un'ipotesi di scuola — **è esattamente la forma di B-14**, un foglio che non compariva e la cui causa non è mai stata trovata. Perciò c'è una rete: passato abbondantemente il tempo dell'entrata, se il valore non è arrivato a 1 ci arriva di colpo. **Si perde l'animazione, non il contenuto.**

**Alternative scartate**:
- *Animare col `pressed` di `Pressable`*: impossibile qui — in questo progetto uno stile passato come **funzione** a `Pressable` non viene applicato (B-08). Reanimated non è un ripiego: il movimento gira sul thread della UI e non si inceppa mentre React monta ciò che il tocco ha aperto.
- *Far scorrere lateralmente le due viste della mappa*, che su un interruttore sembra la cosa ovvia. Scartata per due motivi che portano allo stesso posto: la mappa è una **vista nativa** e traslarne il contenitore si comporta diversamente fra iOS e Android; e l'elenco ha già il suo movimento — le schede che salgono. Un contenitore che scivola da destra mentre il contenuto sale dal basso sono **due direzioni diverse nello stesso istante**, e non si legge come più ricco: si legge come confuso.
- *Portare i due `Modal` della mappa dentro `components/foglio.tsx`*, che sarebbe la scelta coerente visto che `Foglio` esiste proprio per togliere la brusca animazione di sistema. **Scartata per B-14**: quel componente ha un modo di fallire non spiegato, e infilarlo in altre due schermate significherebbe moltiplicare un difetto che non sappiamo riconoscere. L'incoerenza dichiarata di B-14 resta, e resta debito.
- *Animare i pin della mappa*: scartata per `tracksViewChanges` — con i marker disegnati da noi, react-native-maps ne ridisegna la texture a ogni fotogramma finché è acceso, e un pin animato lo terrebbe acceso per sempre.

### D-52 — La mappa non aggiunge più un posto col tocco lungo
**Chiesto dall'utente il 2026-08-27.** ⚠️ **Modifica D-50**, che sulla mappa lasciava «i due gesti che parlano di questo punto: il tocco lungo e "segna dove sono"». I gesti restano **uno**.

**Perché il gesto non meritava di restare**, al di là della richiesta:

- **Era invisibile.** L'unico modo di scoprirlo era il cartellino che lo spiegava — cioè un'istruzione **permanente** appiccicata sopra la mappa. Un gesto che ha bisogno di un'etichetta fissa accanto non è *scoperto*: è *tollerato*. E l'etichetta costava spazio a una schermata che di spazio ne ha bisogno tutto.
- **Litigava col mezzo.** Su una mappa il dito ci resta sopra di continuo — per trascinare, per zumare, per fermarsi un attimo a leggere. Un tocco fermo un istante di troppo apriva un foglio *«un posto nuovo»* che nessuno aveva chiesto: un falso positivo su un gesto che nessuno stava facendo apposta.

**Cosa resta, e perché basta**: il **«+»** in basso a destra, che aggiunge il punto in cui sei — l'unico modo di aggiungere che parli davvero di *questo posto* — e la **ricerca per nome** nell'elenco, a un tocco dall'interruttore. Due ingressi espliciti al posto di uno esplicito più uno segreto.

**Toccato**: rimossi `onLongPress` e la prop `onPuntoNuovo` da `components/mappa-vera.native.tsx` — la prop serviva **solo** a quel gesto, e lasciarla sarebbe stata un'API morta che il prossimo lettore prende per viva; allineato lo stub web `components/mappa-vera.tsx` (i due tipi si tengono uguali a mano, lo dice il file stesso); tolti il cartellino e la stringa `comeSiAggiunge` da `lib/i18n.ts` in **entrambe** le lingue.

> Con quel cartellino se n'è andata **l'ultima scritta fissa sopra la mappa**. Non era l'obiettivo, ma è il risultato che conta di più: la mappa ora mostra solo la mappa.

### D-51 — L'elenco dei luoghi diventa la seconda vista della mappa
**Chiesto dall'utente il 2026-08-27.**

Un elenco di posti e una mappa di posti sono **due modi di guardare la stessa cosa**. Tenerli in due sezioni diverse obbligava a ricordare in quale delle due si fosse messo un posto, e a spostarsi fra sezioni per una domanda sola: *«dove siamo stati?»*. Ora è un interruttore in cima alla mappa — **Mappa / Elenco** — e Liste resta la sezione dei soli film.

**Come è stato fatto, e perché è costato poco**: la schermata era già generica sul tipo — il tipo era uno *stato interno* scelto da un selettore. È bastato farlo diventare una **prop** ed estrarre il componente (`components/elenco-elementi.tsx`, più `components/scheda-elemento.tsx` per la scheda). Non c'è stato niente da riscrivere, solo da spostare.

> Se il tipo fosse stato intrecciato col resto della schermata, questo passaggio sarebbe stato una riscrittura — con i suoi difetti nuovi. È il dividendo, pagato mesi dopo, di aver scritto una schermata generica quando i tipi erano due.

⚠️ Il componente estratto **non porta più `Fondo` né `SafeAreaView`**: quelli li mette chi lo ospita, che è la schermata vera. Lasciarli dentro avrebbe prodotto due sfondi sovrapposti e una doppia area sicura — cioè un margine in alto che si somma a se stesso.

**Il tondo in basso a destra della mappa diventa un «+».** Fa la stessa cosa di prima — segna il posto in cui sei — ma l'icona era un mirino, e in tutte le altre schermate quel tondo è un «+». Il gesto che si cerca in quell'angolo è *aggiungere*, non *localizzare*: un'icona diversa per lo stesso posto e lo stesso scopo costringe a ricordare che lì è un'eccezione. Per nome si aggiunge dall'elenco, che ora è a un tocco.

### D-50 — Un «+» invece di un campo, e la mappa smette di fare due mestieri
**Chiesto dall'utente il 2026-08-27.**

**Nelle Liste, i luoghi si aggiungono con un «+» che galleggia**, non più con un bottone a tutta larghezza in fondo. La differenza col tab dei film non è capriccio: un film si **scrive**, quindi il campo di testo deve stare a portata di pollice ed è giusto che occupi una riga stabile; un luogo si **sceglie** fra quelli veri (D-37), quindi il gesto è *«apri la ricerca»* — un'azione, non un campo. Un bottone largo quanto lo schermo per una sola azione ruba una riga all'elenco a ogni scorrimento; un tondo non ruba niente.

**Via la barra di ricerca dalla mappa.** Cercare un posto per nome è un'azione da *lista*, e in Liste c'è ora il suo «+»: tenerne una copia anche qui erano due ingressi per la stessa cosa, e soprattutto un campo di testo permanente addosso a una schermata che di spazio ne ha bisogno tutto. Sulla mappa restano i due gesti che **solo lì** hanno senso, perché parlano di *questo punto*: il tocco lungo e «segna dove sono».

> ⚠️ **Superata in parte da [D-52](#d-52--la-mappa-non-aggiunge-più-un-posto-col-tocco-lungo)** (2026-08-27, stessa giornata): il tocco lungo è stato **tolto**, e i gesti sulla mappa sono ora uno solo. Il resto di questa decisione — via il campo di ricerca, il «+» al posto del bottone largo — resta valido. La riga qui sopra si legge come *era*, non come *è*.

⚠️ La ricerca resta nel **ripiego web**, dove non esiste una mappa da toccare e sarebbe l'unico modo di aggiungere un posto.

**Il foglio del posto nuovo ora sale con la tastiera.** Mancava il `KeyboardAvoidingView`: il campo del nome apre la tastiera da solo (`autoFocus`), e i tasti coprivano l'interruttore «ci siamo stati» e i due bottoni — cioè tutto quello che serve per finire. È lo stesso difetto già corretto nel form dell'evento il 2026-08-13, ricomparso in un foglio scritto dopo: **una correzione applicata a un punto non protegge gli altri**, e in questo progetto i fogli sono sei.

### D-49 — Foto già nel form dell'evento, caricamento in parallelo, mappa sulla posizione
**Chiesto dall'utente il 2026-08-27.**

**Le foto si scelgono creando l'evento.** Chi registra una serata passata — una cena di ieri, un viaggio — ha le foto in mano *in quel momento*, e doverle aggiungere aprendo l'evento appena creato era un passaggio che nessuno chiedeva. Restano in attesa nel form e si caricano al salvataggio: una foto si attacca a un evento, e l'evento prima deve esistere. Caricarle subito avrebbe voluto dire o lasciarle orfane se poi si annulla, o **creare l'evento appena si sceglie la prima immagine** — cioè decidere al posto di chi sta ancora compilando.

Se il caricamento fallisce l'evento resta: metà del lavoro salvata è meglio di niente, e le foto si riaggiungono dalla sua pagina.

**Il caricamento era in fila indiana**, ed è il «molto lente a caricarsi»: dieci foto volevano dire dieci cicli comprimi-carica uno dopo l'altro, e l'attesa era la loro somma. Ora vanno a **tre per volta** — la compressione usa la CPU e il caricamento la rete, quindi mentre una comprime un'altra può già star salendo. Tre e non dieci: oltre si contendono banda e memoria (ogni immagine decompressa sta in RAM per intero) senza che il totale migliori. E l'avanzamento si dice: *«Carico le foto… 3 di 10»*, perché un'attesa muta sembra un blocco.

⚠️ Un errore non ferma le foto del blocco già partite, ma ferma i blocchi successivi: se il tetto di 1 GB è pieno, insistere altre sette volte produce sette errori identici.

### 🔴 La mappa parte dalla posizione attuale — e questo modifica D-05

D-05 dice: *«la posizione non viene mai letta da sola»*. Questa funzione la legge da sola, quindi la decisione va presa esplicitamente invece che presa e basta.

**Cosa NON cambia**, ed è tutto ciò per cui D-05 esisteva: la posizione **non viene scritta da nessuna parte, non viene mandata a nessuno, non esce dal telefono**. Serve solo a decidere dove puntare la telecamera della mappa e muore con la schermata. Nessun tracciamento, nessuna lettura in background, nessuna posizione condivisa col partner — il rischio che D-05 nominava (*«nessuno dei due può sapere dove si trova l'altro»*) resta chiuso.

**Cosa cambia**: la lettera. *«mai letta da sola»* diventa *«mai registrata o condivisa da sola»*.

⚠️ **Non si chiede il permesso solo per questo**: si guarda se è già stato concesso (per «segna dove sono adesso»), altrimenti la mappa parte dove partiva prima. Un'app che chiede la posizione appena apri una schermata, senza che tu abbia chiesto niente, insegna a negare il permesso — e il permesso serve davvero alla funzione che lo giustifica.

### D-48 — Un pin solo, un elenco solo, uno stato solo
**Chiesto dall'utente il 2026-08-27**, in un giro di tre correzioni che hanno la stessa forma: *lo stesso fatto raccontato in due posti che potevano divergere*.

- **Un pin solo sulla mappa.** Per qualche ora colore e icona seguivano il genere di Google — ambra e posate dove si mangia, magenta e stella altrove. Distingueva, ma spezzava la mappa in categorie che nessuno aveva chiesto: guardando la mappa conta *dove siete stati*, non se in quel posto si mangiasse. Il genere resta nel dato, e chi vuole distinguere lo fa in lista. Il pin continua a dire l'unica cosa che cambia il modo di leggerlo: **se lì è successo qualcosa**.
- **Un elenco solo nel campo "dove".** C'erano *due* file di pillole — i "posti" dalla mappa e i "ristoranti" dalla lista — che dopo 0017 erano gli stessi posti scritti due volte, con due selezioni separate che potevano perfino contraddirsi. Ora la fila è una e sceglierne uno imposta **entrambi** i legami dell'evento.
- **Uno stato solo.** Il «pulsante visitato/non visitato non funziona bene» era questo: `elemento_lista.stato` e `luogo.stato` sono lo stesso fatto in due righe (0012), e le due funzioni ne scrivevano una a testa. Si spuntava un posto in lista e sulla mappa restava da visitare. Non era il bottone a non funzionare — funzionava a metà, ed è peggio, perché sembra casuale.

⚠️ Sul `luogo` la transizione **non** tocca `visitato_il`: quella la mette il trigger dei punti (D-15), ed è ciò che impedisce di fabbricare punti spuntando e despuntando.

**La copertina dei posti nati sulla mappa**: hanno nome e coordinate ma nessuna identità Google, quindi nessuna immagine possibile. Ora si cerca l'identità **per nome**. ⚠️ Solo il nome, nessuna coordinata: mandare anche il punto migliorerebbe molto la precisione, ma da lì esce solo testo (D-05), e quella regola non si piega per una copertina. Conseguenza dichiarata: su un nome generico la corrispondenza può essere sbagliata o assente — e allora è meglio nessuna immagine che quella di un altro posto.

### D-47 — «Preferiti» diventa «Liste»
**Deciso con l'utente il 2026-08-27**, dopo che gli avevo chiesto se il problema fosse il comportamento o il nome: *«Preferiti è una denominazione che può essere cambiata, non si riferisce a un sottogruppo»*.

Il nome era **sbagliato, non solo brutto**: la sezione non contiene un sottoinsieme scelto, contiene *tutto* — ogni film segnato e ogni posto in cui siete stati o volete andare, compresi quelli che ci finiscono da soli attaccandoli a un evento (D-44). Chiamare "preferito" ciò che entra in automatico **promette una selezione che non esiste**, e chi legge si chiede dove sia finito il resto.

«Liste» dice quello che è: due elenchi, Film e Luoghi, ciascuno col suo "da fare / fatto". L'icona passa da una **stella** — che dice "i miei preferiti" — a una **lista con le spunte**, che dice "le cose da fare e quelle fatte".

**Debito dichiarato**: la rotta resta `/(tabs)/preferiti` e i file `preferiti.tsx` / `lib/preferiti.ts` conservano il vecchio nome. Rinominarli avrebbe toccato ogni `router.push` verso quella schermata per un guadagno solo estetico, e in una giornata in cui le modifiche meccaniche hanno già prodotto tre errori di sintassi non è il momento. Il nome interno e quello a schermo divergono, ed è scritto qui invece che scoperto fra sei mesi.

### D-46 — Ogni posto della mappa è anche un luogo in lista, e la copertina si ripara da sé
**Chiesto dall'utente il 2026-08-27.** Migrazione `0017`.

**Il disallineamento**: un posto poteva nascere in due modi che non producevano la stessa cosa — dal campo "dove" di un evento nascevano *entrambe* le righe (`luogo` e `elemento_lista`), dalla mappa *solo* `luogo`. Finché la lista si chiamava "ristoranti" la differenza aveva senso; da D-45 la lista è dei **luoghi**, e un posto che sta sulla mappa ma non in lista è semplicemente un posto che manca — senza copertina, senza recensioni, senza "da fare / fatto". Da 0017 il rapporto è **uno a uno**, e `useLuoghi.aggiungi` crea entrambe le righe.

Se l'inserimento in lista fallisce **non si annulla il luogo**: un posto sulla mappa senza riga in lista è un difetto lieve e riparabile (0017 sa rifarlo), mentre cancellare un posto appena segnato è una perdita.

**La copertina di Google che non arrivava** aveva una causa precisa e istruttiva: per qualche ora, quel giorno, la maschera dei campi della ricerca generica **non chiedeva le foto** — l'ottimizzazione poi annullata in D-45. I luoghi aggiunti in quella finestra hanno `google_place_id` valorizzato e `foto_google` nullo, e ci restano: la ricerca non si rifà, e il dato non torna da solo.

> 🔑 **Un'ottimizzazione che toglie un campo a una scrittura lascia dietro dati incompleti anche dopo essere stata annullata.** Il codice torna com'era; le righe scritte nel frattempo no. È il costo che non si vede quando si valuta un risparmio sulle chiamate.

La riparazione va a prendere il nome-foto da **Place Details**, che accetta l'id. Costa una chiamata per luogo rotto, **una volta sola** — e un `Set` di quelli già tentati impedisce che un posto senza foto su Google resti per sempre nell'insieme dei "rotti", cioè una richiesta a pagamento in un ciclo che non converge.

**Toccando un luogo** si apre ora l'elenco completo delle sue serate. Le pillole dentro la scheda restano e portano a **un** evento; l'elenco li mostra **tutti**, con la data — che è l'informazione che serve quando sono cinque.

### D-45 — I "ristoranti" diventano **luoghi**, e un luogo mostra le foto delle sue serate
**Chiesto dall'utente il 2026-08-27.** Migrazione `0016`.

**L'allargamento**: `ristorante` **diventa** `luogo`, non gli si affianca. Due tipi che si comportano allo stesso modo — posto scelto da Google, identità, copertina, "da fare / fatto", recensioni di entrambi — sono un tipo solo con un attributo diverso; tenerli separati avrebbe voluto dire due elenchi e due percorsi di aggiunta che divergono alla prima modifica. Il tipo di Google resta in `genere`, che è **più ricco** di quel che si perde: prima "ristorante o no", ora `museum`, `city_park`, `fine_dining_restaurant`.

**Le quattro regole del luogo**, come le ha dette l'utente:
1. **non ancora visitato → immagine di Google**;
2. **al luogo sono associate tutte le immagini di tutti i suoi eventi**;
3. **se ha immagini, si vede l'immagine** (non quella di Google);
4. **toccandolo si vedono i suoi eventi**.

La 2 era il pezzo mancante, e non era ovvio: `copertinePerElemento` guardava le foto legate **direttamente** all'elemento (la copertina scelta a mano), mentre le foto di una serata nascono attaccate all'**evento**. Un posto dove eravate stati tre volte, con venti foto, mostrava ancora l'immagine di Google. `fotoDegliEventiPerElemento` percorre il legame `foto → evento → elemento` in **due letture in tutto** (PostgREST non fa sottoquery), non due per luogo: con dieci posti la differenza è fra 2 e 20 richieste.

Ne esce una precedenza a tre livelli per la copertina: **scelta a mano** (è una decisione) → **ultima foto delle vostre serate** → **Google** (vale finché non ci siete ancora stati).

**Ricadute che il cambio ha imposto, e che non erano nella richiesta**:
- 🔴 **Doppio pin sulla mappa.** Un posto crea due righe — una in `luogo`, una in lista — e finché solo i ristoranti finivano in lista la sovrapposizione era l'eccezione. Diventata la regola, **ogni posto avrebbe avuto due pin sovrapposti**: uno col conto degli eventi e uno senza. La mappa ora salta i `luogo` già disegnati come luoghi della lista.
- **Annullata un'ottimizzazione di poche ore prima**: avevo diviso il field mask di Google per non chiedere le foto sulle ricerche generiche, sulla premessa «solo i ristoranti diventano preferiti, quindi solo loro hanno bisogno di copertina». Il passaggio a "luoghi" ha eliminato la premessa: ora ogni posto ha bisogno della foto, e un risparmio pagato con elementi senza immagine non è un risparmio. **Un'ottimizzazione vive finché vive la premessa che la giustifica**, ed è il tipo di legame che nessuno rilegge quando cambia il modello.
- Il pin segue il `genere`: ambra con le posate dove si mangia, magenta con la stella altrove.

**Debito dichiarato**: dentro `app/(tabs)/mappa.tsx` è rimasta l'etichetta interna `tipo: 'ristorante'` nel tipo `Toccato`, e `RistoranteSuMappa` si chiama ancora così. Sono nomi locali che non toccano il database — ma sono stantii, e stanno qui invece che nascosti.

### D-44 — Il ristorante si collega da solo all'evento, e si segna da solo quando la serata è passata
**Chiesto dall'utente il 2026-08-27.** Migrazione `0015`.

Scegliere un posto nel campo **"dove"** del nuovo evento può voler dire tre cose, e distinguerle è ciò che evita di rifare a mano altrove un lavoro appena fatto:

1. **è un ristorante già nei preferiti** → si seleziona e basta. Riconosciuto per `google_place_id`, non per nome: due locali possono chiamarsi uguale, e lo stesso locale può essere stato salvato con un nome leggermente diverso;
2. **è un ristorante nuovo** → entra da solo nei preferiti, con la foto di Google come copertina, e resta selezionato. Prima bisognava aprire i preferiti e cercarlo una seconda volta;
3. **non è un posto dove si mangia** → si crea solo il luogo, come prima.

Per distinguere il caso 2 serve il **tipo** del posto, quindi `places.primaryType` entra nel field mask. È un campo in più e i campi sono il prezzo: si paga perché senza, l'aggiunta automatica non è possibile. Le **foto** restano invece solo sulla ricerca dei ristoranti, che è l'unica a usarle. `eRistorante()` accetta l'intera famiglia (`bar`, `cafe`, `*_restaurant`…) e non il solo `restaurant`, che avrebbe lasciato fuori proprio i casi più comuni di una serata.

**Il passaggio automatico a "visitato"** è una funzione, non un trigger, e la ragione è che non c'è niente da intercettare: al momento in cui un evento diventa passato **nessuno scrive** — è il tempo che passa. Restavano un lavoro pianificato o una passata fatta quando qualcuno guarda; si è scelta la seconda, perché aggiornare la riga alle 3 di notte non vale più che aggiornarla un istante prima che venga letta, e costa un pezzo di infrastruttura in più.

È `security definer` perché la policy di `elemento_lista` è **solo-autore** ma la serata può averla messa in calendario il partner: coi privilegi del chiamante il ristorante si aggiornerebbe a volte sì e a volte no, senza che si possa capire perché. La funzione è delimitata da `e_membro_attivo`, ed è il primo controllo che fa. Permessi chiusi in partenza con `revoke ... from public, anon` — la lezione di B-07 applicata prima e non dopo.

**Scrive due tabelle**: `elemento_lista.stato` per i preferiti e `luogo.stato` per la mappa. Sono lo stesso fatto in due posti da 0012, e lasciarne indietro uno darebbe un ristorante "provato" nella lista e ancora "da visitare" sulla mappa. **Non torna mai indietro**: se qualcuno rimette a mano un ristorante su "da provare", la passata dopo non lo ri-segna — guarda `fatto_il`, che è già valorizzato. Una correzione manuale disfatta da sola sarebbe peggio del problema.

**Tolta la riga barrata** sui preferiti fatti: sbarrare un ristorante dove si è stati lo racconta come una voce cancellata da una lista di cose da fare, mentre è l'opposto — è un ricordo. Che sia fatto lo dicono già la spunta e la data.

**Le copertine da Google erano già a posto** e non è stato necessario toccarle: `preferiti.tsx` usa `copertine[id] ?? urlFotoGoogle(foto_google)` da D-37 — la foto messa a mano vince, altrimenti c'è quella di Google. Aspettava solo la chiave.

### D-43 — I pin della mappa dicono cosa è successo, e l'anteprima non copre la mappa
**Chiesto dall'utente il 2026-08-27**: *"sulla mappa devono comparire i luoghi associati a un evento pinnati e premendo sul pin si deve aprire in sovraimpressione una piccola preview dell'evento."*

- **I pin li disegniamo noi** (`components/mappa-vera.native.tsx`). Prima erano le puntine di sistema, distinte solo dal colore; ora un posto **con** eventi è un tondo pieno col numero addosso, uno **senza** è vuoto. Cambia il lavoro della mappa: da elenco di coordinate a mappa di cose accadute.
- **Anteprima in sovraimpressione al posto del foglio** (`components/anteprima-evento.tsx`). *Perché è meglio*: un foglio modale copre la mappa, cioè toglie il contesto proprio nel momento in cui il contesto è il motivo per cui si sta guardando la mappa. La carta galleggia e lascia vedere dove sta quel posto rispetto agli altri. Se il posto ha più eventi, le frecce li scorrono senza chiudere niente.
- **Il foglio non sparisce**: resta dietro il "…" dell'anteprima, perché contiene le **azioni sul posto** (segna visitato, elimina) — che sono un'altra cosa dal guardare cosa ci è successo. Sui ristoranti il "…" non c'è: un ristorante non si segna visitato, e un secondo posto da cui cancellarlo sarebbe un errore in attesa.
- ⚠️ **Una lettura sola per tutti i pin, non una per tocco.** È obbligata: i pin devono sapere *prima* se hanno eventi, altrimenti sono tutti uguali. Chiedere al tocco avrebbe voluto dire pin indistinguibili più un'attesa a ogni apertura.
- ⚠️ **`tracksViewChanges` va spento, ma non subito.** Con marker disegnati da noi, `react-native-maps` ridisegna la texture del pin a ogni fotogramma finché è acceso, e con dieci pin la mappa scatta. Spegnerlo al primo render però rischia il pin vuoto (texture presa prima che icone e testo abbiano misurato). Si lascia acceso 900 ms e poi si spegne: è il compromesso noto di questa libreria, ed è scritto qui perché fra sei mesi sembrerà un timeout arbitrario.

### D-42 — La pagina evento: immagine a tutto schermo e foglio che la taglia
**Riferimento**: lo shot *"Hotel Booking Mobile App Concept"* (Shakuro), portato dall'utente il 2026-08-27.

🔴 **Rovescia metà di D-38.** D-38 aveva messo l'hero dell'evento **dentro una card** arrotondata coi margini (riferimento: lo yacht). Il riferimento nuovo fa l'opposto — l'immagine arriva ai bordi, e sotto le sale addosso un foglio bianco arrotondato che la taglia. Si è scelto il secondo, e la ragione non è "l'ultimo screenshot vince":
- l'immagine di un evento è **un ricordo**, e un ricordo dentro una cornice coi margini si legge come una figurina; a tutto schermo si legge come *"eri lì"*;
- la card resta invece giusta dove l'elemento è **uno fra tanti** in un elenco (le schede dei preferiti, le righe evento): lì la cornice serve a separare, e non si è toccata.

Il resto del riferimento, adottato: **maniglia** in cima al foglio (due punti di altezza, ed è l'unico segnale che distingue il pannello dall'immagine senza aggiungere un bordo) · **striscia di miniature** con l'ultima velata che porta il conto delle altre, al posto della griglia a due colonne — su una pagina che ha già un'immagine grande in testa, una seconda griglia di immagini raddoppia il peso visivo senza aggiungere informazione · **i fatti come pillole col bordo** invece che righe icona+testo impilate: le righe occupavano una riga a testa e spingevano foto e commenti sotto la piega, mentre i fatti di un evento sono quattro parole ciascuno e stanno su due righe in tutto.

**Sul foglio bianco il vetro non serve più**: i commenti diventano carte tenui col bordo. Un vetro sopra il bianco non ha niente da lasciar trasparire — è la stessa regola per cui le schermate usano `Fondo` invece di `bg-background`, applicata al contrario.

### D-41 — Il calendario: testata sfumata, pillole al posto dei pallini, agenda a fasce orarie
**Riferimento**: lo shot *"Calendar Mobile App – Animated Version"* (Exyte), portato dall'utente il 2026-08-27.

- **Testata sfumata che si arrotonda sul bianco** (`components/testata-calendario.tsx`). Prima titolo, frecce, selettore di vista e iniziali dei giorni erano quattro righe che galleggiavano sullo stesso bianco del contenuto, e la griglia cominciava senza che niente dicesse dove. Il blocco colorato **è** il bordo superiore della griglia: sopra i comandi, sotto il calendario.
- **Pillole invece di pallini** (`components/pillola-evento.tsx`). Un pallino dice *che c'è qualcosa*, una pillola dice **cosa**. Su un mese intero è la differenza fra toccare quindici giorni per ricordarsi cosa c'era e leggerlo scorrendo. Il fondo pastello viene dal **tipo** dell'evento, quindi il colore resta informazione e non decorazione.
- **La griglia si misura, non si indovina**: quante pillole entrano in una cella dipende dall'altezza dello schermo. `GrigliaMese` fa `onLayout` e ne ricava riga e capienza; l'avanzo diventa "+N". Un numero fisso avrebbe tagliato sui telefoni piccoli e lasciato buchi su quelli grandi.
- **La vista "giorni" diventa un'agenda a fasce orarie** (`components/agenda-giorno.tsx`), non più un elenco piatto. Un elenco dice *cosa* c'è; una fascia oraria dice **quando**, e soprattutto dice cosa c'è **in mezzo** — i buchi liberi del pomeriggio sono l'informazione che due persone cercano davvero in un calendario condiviso, e un elenco non può darla.
- **Via l'elenco sotto la griglia del mese**: ripeteva ciò che ora sta nelle celle, e rubava alla griglia metà schermo.
- Tre cose che nell'agenda non erano ovvie: **ciò che non ha un'ora non sta nella fascia** (metterlo alle 00:00 sarebbe una bugia leggibile: sta in una striscia sopra); **gli impegni sovrapposti si dividono la larghezza** per grappoli, altrimenti due cose alle 20:00 si coprono e una semplicemente non esiste a schermo; **la riga rossa dell'ora c'è solo se il giorno è oggi**.
- ⚠️ **Il testo sulla testata è prugna, non bianco, e qui il riferimento non si copia.** Nello shot il titolo è bianco, ma il suo gradiente è molto più scuro del nostro: sui nostri pastelli il bianco dava circa 2:1 di contrasto, sotto il minimo perfino per il testo grande. Si è tenuta la *struttura* del riferimento e si è cambiato ciò che sul nostro colore non funzionava.
- ⚠️ **Il selettore delle viste resta a parole, non a icone** — al contrario della barra in basso (D-40). "Mese" e "anno" sono due griglie, e due icone di griglia accanto non si distinguono. La regola vera non è "icone" o "parole": è *quante voci ci sono e quanto sono distinguibili*.

### D-40 — La barra in basso: una lente di vetro che viaggia
**Riferimento**: il video portato dall'utente il 2026-08-27 — una barra a pillola dove il segnalino della voce attiva non compare e sparisce, ma **scivola**, e mentre viaggia si deforma come una goccia.

**Due strade, come per tutto il vetro di questa app:**
1. **iOS 26 → `GlassContainer`** di `expo-glass-effect`: è la scatola che fa *fondere fra loro* i vetri che contiene quando si avvicinano. Pillola e lente sono due `GlassView` dentro lo stesso contenitore, quindi la deformazione a goccia la fa il sistema, con la rifrazione vera. Non è un'imitazione dell'effetto del video: è lo stesso effetto.
2. **Altrove → una lastra chiara** con riflesso e bordo. **Non** un secondo vetro sfocato: due sfocature a schermo intero costano il doppio e sul ripiego non aggiungono niente che si veda.

Il movimento è nostro in entrambi i casi: **una sola vista che si sposta**, non sei alonate che si accendono a turno — è la differenza fra *"è cambiata la selezione"* e *"la selezione si è spostata"*, e su sei voci quell'informazione vale più di qualunque animazione decorativa. Lo **stiramento è una molla a parte**, non una derivata della velocità: Animated non espone la velocità di una molla, e leggerla dal ponte JS a ogni fotogramma avrebbe buttato via `useNativeDriver`.

⚠️ **Tolte le etichette.** Il riferimento non ne ha, e sotto una lente che si sposta un testo da 10 punti diventa rumore. **Il costo è reale e accettato**: con sei icone astratte non tutte si spiegano da sole — `Sparkles` per "Giochi" e `Star` per "Preferiti" non sono ovvie a chi apre l'app la prima volta. `accessibilityLabel` resta su ogni voce, quindi VoiceOver continua a leggerle per nome, e rimetterle è una riga. Se all'uso reale la barra risulta illeggibile, è questa la decisione da rovesciare per prima.

### D-39 — Una modalità sola: il tema scuro non esiste più
**Chiesto dall'utente il 2026-08-27**: *"NON ci deve essere modalità dark e light."*

Tolti: il blocco `@media (prefers-color-scheme: dark)` da `global.css`, la palette gemella e il flag `scuro` da `lib/tema.ts`, i rami condizionali nei sei file che li leggevano; `userInterfaceStyle` passa a `light` in `app.json`; `GlassView` prende `colorScheme="light"` **fisso** — senza, su un telefono in modalità notte iOS 26 renderebbe vetro scuro sotto un'interfaccia chiara.

**Il guadagno vero non è meno codice**: è che le tinte scelte sono le uniche che qualcuno vedrà davvero. Fino a ieri metà del lavoro di taratura — quattro palette in un giorno, D-35/36/37/38 — finiva su schermate che nessuno stava guardando.

**Verificato** nella console del browser il 2026-08-27: `--css-interop-darkMode` vale `class dark`, la radice non ha la classe `dark`, e nel CSS generato le regole `prefers-color-scheme` sono **zero**.

⚠️ Non ha però chiuso **B-02** da sé, che era l'ipotesi di partenza: vedi la voce di B-02 per la causa vera.

---

### D-38 — Quarta taratura: la palette "Barbie" e l'hero a card
**Chiesto dall'utente il 2026-08-13 (notte), con due screenshot come riferimento.**

- **Palette dallo screenshot "GLOW LIKE"**: magenta pieno (322 78% 52%) per le azioni, **due pastelli** come comprimari — azzurro (`secondary`) e rosa (`accent`) — e il bianco per il contenuto. Il fondo delle schermate attraversa i due pastelli **in diagonale** (azzurro in alto, rosa in basso), come lo sfondo del riferimento. Quarta tinta in un giorno: la lezione cumulativa è che la palette su token rende ogni ripensamento un cambio di valori, non un refactor.
- **Hero dell'evento a card** (screenshot yacht): l'immagine non è più a tutto schermo ma una carta arrotondata (raggio 40) coi margini, col bottone di ritorno dentro l'immagine. **Scorrendo verso il basso si ingrandisce un po'** (scala fino a 1.12, dentro il ritaglio) oltre allo stiramento sul tiro verso il basso — un'unica interpolazione, animazione nativa.
- **Preferiti**: la riga di aggiunta stava sotto la pillola di vetro (`SPAZIO_BARRA - 40`); ora rispetta l'ingombro intero.

### D-37 — I ristoranti si scelgono, non si scrivono — e la ricerca passa a Google
**Chiesto dall'utente il 2026-08-13 (sera, secondo giro di feedback).** Migrazione `0013`.

**Il vincolo**: un ristorante non è testo libero — si **seleziona** fra quelli veri (Google Places, `includedType: restaurant`) e la sua **foto su Google diventa la copertina** in app. Dal risultato nascono insieme il luogo (mappa), l'elemento (lista) e l'identità (`google_place_id`, `foto_google`): un ingresso solo, niente ristoranti a metà. I film restano testo libero: un film non deve stare su una mappa.

**Google al posto di Photon/OSM** è decisione esplicita dell'utente, che ribalta la scelta del pomeriggio (fatta quando l'alternativa era "nessuna chiave, nessun costo"). Ora la chiave serve: `EXPO_PUBLIC_GOOGLE_PLACES_KEY` nel `.env` — **infrastruttura pronta, chiave dell'utente in arrivo**; finché manca, la ricerca **dice che manca** invece di tacere. Restano ferme due cose: **esce solo il testo digitato** (mai la posizione — D-05 sopravvive al cambio di fornitore) e la foto si chiede a Google **al momento di mostrarla** (nome-risorsa salvato, mai copie — è ciò che le condizioni Places prevedono).

**Terza taratura del design, dallo stesso giro di feedback**: palette **bianca** (il colore vive solo sugli accenti — colorare le superfici era ciò che faceva sembrare l'app "rosa ovunque"), angoli più dolci (raggi 20→40), toolbar con larghezze esplicite a ogni livello dopo che lo stretch si era rotto su **due** percorsi diversi (BlurView e GlassView), striscia giorni ad **altezza fissa** (contendeva lo spazio verticale e i numeri finivano coperti), `mapPadding` sulla mappa (logo e callout uscivano sotto la barra), header dell'evento **elastico** (si allarga tirando giù) e **visore a pagine** (tocco sulla foto → schermo pieno → scorri le altre col dito).

### D-36 — Il ristorante entra nel modello: sulla mappa, e dentro l'evento
**Chiesto dall'utente il 2026-08-13 (sera).** Migrazione `0012`.

**I due legami**: un ristorante può avere un **posto** (`elemento_lista.luogo_id` — è ciò che lo disegna sulla mappa, in ambra) e un evento può avere un **ristorante** (`evento.elemento_id` — la cena da qualche parte). Toccare il ristorante — dalla mappa o dai preferiti — porta **all'evento**: è D-33 esteso, l'evento resta il centro e il ristorante è la quarta strada per arrivarci.

**Il posto si aggancia dalla scheda del preferito** con la stessa ricerca della mappa, e **la ricerca supera una regola di D-34** ("un luogo nasce dove lo si tocca, non da un campo di testo che non sa dov'è"): la ragione di quella regola era che il campo di testo non aveva coordinate — il risultato della ricerca le ha, quindi la regola cade insieme al motivo che la reggeva. Il tocco lungo resta per i posti senza indirizzo.

⚠️ **Vincolo scoperto rileggendo le policy**: `evento`, `elemento_lista` e `foto` hanno update **solo-autore** (0001). Conseguenze rese esplicite: l'ingranaggio della pagina evento mostra le azioni di modifica solo all'autore; "sposta in cartella" solo sulle proprie foto; e gli update ora chiedono il **conteggio** delle righe toccate — RLS non vieta, *filtra*, e zero righe in silenzio è il fallimento peggiore.

### D-35 — "Quarzo rosa" seconda taratura, e la pagina evento con l'ingranaggio
**Feedback dall'iPhone reale, 2026-08-13 (sera).** Il primo giro del redesign, giudicato sul telefono: palette percepita **viola** (tonalità 336-344, tema scuro prugna), toolbar con le voci ammassate su un lato, "nessun effetto liquid glass", ricerca luoghi muta, giorni nascosti nel calendario.

- **Palette**: tutte le tinte salgono a 347-351 (rosa caldo), neutri desaturati, tema scuro bruno-rosa. La lezione: **una tonalità si giudica sullo schermo OLED del telefono, non sul monitor** — a saturazione alta e luce bassa il magenta vira al viola.
- **Liquid glass vero**: `expo-glass-effect` (GlassView, iOS 26) quando c'è, tre strati come ripiego — col **velo dimezzato**: la prima taratura (0.74 di opacità) copriva la sfocatura, e un vetro che non lascia intuire cosa ha sotto è plastica.
- **Pagina evento** rifatta sullo stile chiesto: hero con la prima foto, righe di dettaglio con icone, foto che **si allargano al tocco**, e l'**ingranaggio** in basso a destra con le cinque azioni (aggiungi foto / descrizione / elimina / cambia data / cambia luogo). Ogni azione è un foglio che tocca **un campo**: il form completo resta nel calendario, così i due non divergono — la ragione di "la modifica vive in un posto solo" sopravvive alla nuova forma.
- **Toolbar**: la riga dentro la pillola prendeva la larghezza del contenuto, non del contenitore — `width: '100%'` esplicito e `flexBasis: 0` per voce.
- ⚠️ **Ricaduta dell'inciampo di `mappa-vera`, per intero**: l'import "difensivo" di `expo-glass-effect` dentro un try/catch **ha rotto il bundle web** — Metro risolve i require staticamente, il try/catch protegge solo il runtime. Stessa cura: file per piattaforma (`vetro-nativo.native.ts` / `vetro-nativo.ts`). La lezione era già scritta nel commento di mappa-vera; è servito ricascarci per impararla.

### B-06 — La striscia dei giorni restava ferma a 60 giorni fa (2026-08-13, CHIUSO)
**Sintomo riferito**: "la sezione giorni nasconde i giorni". **Causa**: lo `scrollTo` di posizionamento partiva in un `setTimeout(0)`, cioè **prima** che lo ScrollView orizzontale fosse misurato sul telefono: non faceva nulla, e la striscia restava all'inizio — due mesi prima di oggi. Sul web la corsa non si vedeva quasi mai: è un difetto che esiste solo dove il layout è asincrono. **Correzione**: FlatList con `getItemLayout` + `initialScrollIndex` — le posizioni sono note *senza* misurare, lo scroll è deterministico al primo fotogramma. Di passaggio la striscia copre ora ±365 giorni (la FlatList monta solo ciò che si vede) e la ricerca Photon ha perso `lang=it`, che il servizio **rifiuta con un 400** ("Supported are: default, de, en, fr") — ogni digitazione falliva, e sembrava che la ricerca non esistesse.

### B-05 — Dopo la rottura, le copie puntavano a righe invisibili (2026-08-13, CHIUSO con `0012`)
**Latente da `0008`, trovato progettando `0012`.** Quando `sciogli_coppia` copiava un evento per il membro m, `luogo_id` restava quello **originale**: se il posto era dell'altro, m ne riceveva sì una copia, ma il suo evento continuava a puntare all'originale — che dopo la rottura non può più leggere. Risultato: eventi con il posto "sparito", visibile solo alla prima rottura vera. **Nessun test lo copriva**: i test di scioglimento verificavano la visibilità delle righe, non la **raggiungibilità dei riferimenti** fra loro. **Correzione**: tabelle di mappatura vecchio→nuovo per membro, e ogni copia che punta a una riga copiata viene ricucita sulla copia; l'ordine dei blocchi ora conta (luoghi → elementi → eventi). ⚠️ **Da estendere i test avversariali** su questo caso — dichiarato, non ancora fatto.

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

### B-22 — «Avvia partita» e «Gioca» sembravano disattivati (2026-08-28, CORRETTO)

**Sintomo, riferito dall'utente**: *«il pulsante avvia partita sembra "disattivato", così come il pulsante "gioca"»*. Non lo erano: lo **sembravano**.

**La causa**: `BottoneVetro variante="accento"` sul vetro **nativo** di iOS 26 è vetro tinto di rosa al **28%** con il testo **bianco**. Sopra lo sfondo chiaro dell'app quel 28% non basta a fare da fondo, e resta bianco su quasi bianco.

🔑 **E l'app aveva insegnato a leggerlo come "spento"**: in tutta la libreria l'unica variazione di opacità significa *disabilitato* (`opacity: 0.45` quando `disabled`). Chi la usa impara quel codice, e poi lo applica a **qualunque** cosa sbiadita — anche a ciò che sbiadito lo è per un altro motivo. *Un vocabolario visivo, una volta insegnato, viene letto anche dove non lo si è scritto.*

**Correzione**: le due azioni primarie passano a `BottonePieno`, che il colore se lo porta. La lezione è più larga del bottone: **un'azione primaria non può dipendere da un materiale che decide il sistema.** Il vetro tinto rende benissimo sopra una foto o una mappa e sparisce sopra il bianco — e quale delle due situazioni capiti non lo decide chi scrive il bottone.

⚠️ Si perde l'icona nel «Gioca» (`BottonePieno` prende solo testo): fra un'azione leggibile e un'icona, in fondo a una schermata con due soli comandi, l'icona è quella che si può perdere.

### B-21 — La migrazione 0020 è fallita due volte: dati vecchi, poi l'ordine delle mosse (2026-08-28, CORRETTO — riscontrato dall'utente)

**Sintomo**, riferito dall'utente mentre applicava la migrazione:
```
ERROR: 23514: check constraint "partita_stato_check" of relation "partita" is violated by some row
```

**La causa immediata**: avevo scritto la migrazione dando per scontato che `partita` fosse vuota — «nessuna partita è mai stata giocata». Vero per il *prodotto*, falso per il *database*: [`tests/rls.avversariali.mjs`](tests/rls.avversariali.mjs) crea una partita per provare il sigillo di D-12 (righe 211 e 325) e **non la cancella mai**. Ogni esecuzione della suite ne lascia indietro una, con lo stato predefinito `invito` — che il vincolo nuovo non ammette.

🔑 **La lezione, che vale oltre questo file**: *una migrazione che stringe un vincolo deve prima sistemare i dati che il vincolo nuovo non accetta.* Il vincolo descrive il futuro; le righe vengono dal passato, e non si aggiornano da sole. «La tabella è vuota» non è una cosa che si sa: è una cosa che si verifica, o di cui si fa a meno scrivendo la migrazione perché regga comunque.

**Correzione, in tre parti** — la seconda non era stata riferita e sarebbe morsa subito dopo:
1. Un `update` che porta a `abbandonata` ogni riga con uno stato del vecchio ciclo. **Non si cancella niente**: sono dati di prova e verrebbe la tentazione di buttarli, ma una migrazione che cancella righe è una migrazione che un giorno cancella le righe sbagliate. `abbandonata` e non `attesa` perché quelle partite non hanno round né righe di prontezza: **non sono riprendibili**, e dire che aspettano sarebbe falso. Di passaggio risolve anche l'indice unico `partita_una_viva`, che con più residui sulla stessa coppia sarebbe fallito subito dopo.
2. ⚠️ **La migrazione è stata resa ripetibile.** Una migrazione che fallisce a metà va rieseguita su un database che ne ha già digerito un pezzo — e `create policy` in Postgres **non ha** `if not exists`: le otto policy sarebbero morte alla seconda esecuzione. Ora ognuna si butta prima di essere ricreata. *Il primo fallimento non è quello che costa: è quello che rende impossibile riprovare.*

**E poi è fallita una seconda volta**, con l'errore rovesciato:
```
ERROR: 23514: new row for relation "partita" violates check constraint "partita_stato_check"
DETAIL:  Failing row contains (…, telepatia, abbandonata, …, 2026-08-12 13:52:07+00)
```

🔑 **La riga rifiutata conteneva il valore nuovo**, ed è tutta la diagnosi: a rifiutarlo era **il vincolo vecchio**, ancora in vigore. Avevo messo l'`update` in testa al file, prima del `drop constraint` — cioè stavo chiedendo al database di scrivere `abbandonata` mentre il vincolo che vieta `abbandonata` era ancora attaccato alla tabella.

La sequenza giusta è **togli, sistema, rimetti**. La regola generale, che è la parte che vale: *un vincolo protegge lo stato finale, non le mosse che servono per arrivarci* — e una migrazione è fatta di mosse intermedie che, prese da sole, sono tutte illegali secondo lo schema di partenza o quello di arrivo. La data della riga (2026-08-12) conferma da dove veniva: la sessione in cui furono scritti i test.

⚠️ **Nota di metodo su come è stata trovata la seconda volta**: il primo errore diceva *«violata da qualche riga»* (dati vecchi), il secondo *«nuova riga viola»* (una scrittura in corso). Sono due messaggi diversi per due guasti diversi, e leggerli come «di nuovo il solito problema» avrebbe portato a rimettere mano ai dati invece che all'ordine.

**Aperto, e non corretto qui**: 🔴 **i test avversariali non ripuliscono ciò che creano.** Non è un difetto del prodotto ma della suite, e ha appena prodotto un guasto vero. Finché resta, ogni esecuzione lascia righe in `partita` e `invio_sigillato`, e la prossima migrazione che tocca quelle tabelle inciamperà allo stesso modo.

**Verificato**: solo staticamente — delimitatori di funzione pari, otto `create policy` e otto `drop policy if exists` appaiati. ⚠️ Su questa macchina non c'è un Postgres (niente Docker, niente `psql`): **la prova vera è l'esecuzione**, e la fa l'utente.

### B-20 — Il testo del permesso di posizione stava sulla chiave sbagliata, e si vedrà solo in un build vero (2026-08-28, CORRETTO)

**Trovato** rispondendo a una domanda dell'utente — *«è possibile scaricare in locale una versione dell'app su iPhone/Android?»* — mentre si guardava cosa serve per un build. Non è stato riferito da nessuno e **non era osservabile in Expo Go**.

**Il difetto, in due strati.**

1. `app.json` valorizzava **solo** `locationAlwaysAndWhenInUsePermission`. Ma l'app chiama `requestForegroundPermissionsAsync`, cioè chiede **When In Use** — e quella chiave è un'altra. Letto nel plugin (`node_modules/expo-location/plugin/build/withLocation.js`): tutte e tre le chiavi hanno un **default**, `'Allow $(PRODUCT_NAME) to access your location'`. Quindi in un build vero il dialogo che l'app apre davvero avrebbe mostrato **la frase generica in inglese**, mentre la frase italiana scritta con cura era attaccata a un permesso che l'app non chiede mai.
2. E quella frase **descriveva «segna dove sono»**, funzione rimossa poche ore prima con D-64. Un testo di permesso che parla di un gesto inesistente non è un refuso: è ciò che Apple legge in revisione, ed è ciò che legge l'utente nel momento in cui decide se fidarsi.

🔑 **Perché Expo Go non poteva mostrarlo**: in Expo Go il dialogo usa l'`Info.plist` **di Expo Go**, non il nostro. Tutta la configurazione dei permessi è quindi **invisibile finché non si fa un build** — ed è una categoria di difetti che il giro sull'iPhone, per quanto accurato, non può intercettare. *Un banco di prova che non esercita un pezzo non dice niente su quel pezzo: dice solo che non lo ha guardato.*

**Correzione**: si valorizza `locationWhenInUsePermission` — la chiave che l'app usa davvero — con un testo che dice ciò che l'app fa oggi (centrare la mappa), e si mettono a `false` le due chiavi *Always*, che il plugin allora **cancella** dal plist. È **least privilege applicato al plist**: l'app non chiede mai la posizione in background, quindi non deve nemmeno dichiararla — e finora la dichiarava, con una descrizione generica in inglese.

**Verificato**: leggendo l'implementazione del plugin (la mappatura chiave→plist e il fatto che `false` faccia `delete infoPlist[permission]`), e ricaricando la configurazione con `npx expo config`, che la legge senza errori. ⚠️ **Non** verificato su un `Info.plist` prodotto: servirebbe un prebuild, che creerebbe le cartelle native e cambierebbe la natura del progetto. È il livello di prova disponibile senza fare quel passo, e va detto invece di lasciar credere altro.

### B-19 — Lo stesso posto nasceva diverso a seconda di dove lo aggiungevi (2026-08-28, CHIUSO)

**Trovato** mentre si implementava D-63, non riferito da nessuno.

La mappa e l'elenco creano entrambi un posto, ma la mappa scriveva la riga di `elemento_lista` **senza** `google_place_id`, `foto_google` e `genere` — perché un posto segnato col «dove sono adesso» un'identità Google non ce l'ha. Corretto per il caso suo; sbagliato appena il posto arriva da una ricerca, cioè da D-63 in poi.

**Conseguenza**: lo stesso identico locale, aggiunto dalla mappa invece che dall'elenco, finiva in lista **senza copertina e senza genere**. È il tipo di difetto che non si nota il giorno in cui nasce: si scopre settimane dopo, guardando una lista in cui alcune schede hanno la foto e altre no, e a quel punto le righe scritte nel frattempo restano rotte (⚠️ è **esattamente** la lezione già scritta in `fotoDiUnPosto`: *il codice torna com'era, le righe scritte nel frattempo no*).

**Correzione**: `aggiungi` in [`lib/luoghi.ts`](lib/luoghi.ts) accetta i tre campi e li scrive, `?? null` quando mancano — la colonna deve **dire** che non c'è identità, non restare assente.

🔑 **La lezione sta nel modo in cui è stato trovato**: la richiesta era *«lo stesso funzionamento di aggiungi luogo in elenco»*, e la lettura pigra è «la stessa tendina». Quella giusta è **lo stesso risultato**. Due strade che creano la stessa entità in due modi diversi sono un difetto, anche quando entrambe funzionano.

### B-18 — Il campo di ricerca dei luoghi taceva, e il silenzio si legge come un guasto (2026-08-28, CHIUSO)

**Sintomo, riferito dall'utente**: *«scrivo ma non mi si apre la tendina con i consigli»*.

⚠️ **La segnalazione riguardava un'altra schermata** (vedi D-63: l'utente era nel pannello della mappa, dove una tendina non c'era mai stata) — **ma il difetto esisteva davvero**, nel campo di Liste, e sarebbe rimasto lì a fare danni. *Una segnalazione che punta al posto sbagliato può comunque essere vera.*

**Il difetto**: la tendina compariva **solo** con dei risultati o con un errore. In tutti gli altri casi non compariva niente — e "niente" è lo stesso fotogramma che si vede quando un'app è rotta. I casi che producevano il nulla erano **tre**, e nessuno dei tre è un guasto:
1. **meno di tre lettere** — la soglia serve a non pagare una chiamata a Google per ogni tasto, ma era **invisibile**: chi scrive «Bar» non ha modo di sapere che a due lettere non succede niente *per scelta*;
2. **sto ancora cercando** — c'era la rotella dentro il campo, che è piccola e sta dove il dito la copre mentre scrive;
3. **Google non ha trovato niente** — indistinguibile da un guasto.

**Correzione**: il pannello si apre sempre che ci sia qualcosa da dire, e ognuno dei tre stati ha la sua riga.

🔑 **È la lezione di [`components/ui/premibile.tsx`](components/ui/premibile.tsx) applicata a un campo di testo**: un comando che non risponde non si legge come *«non c'è ancora nulla da dire»*, si legge come *«non ha funzionato»* — e la reazione è riprovare, poi smettere di usarlo. Uno stato costa una riga di testo; il dubbio costa la funzione.

**Verificato**: che l'API risponda è stato provato **davvero**, chiamando Places con la chiave del `.env` — HTTP 200 con risultati veri — prima di cercare il difetto nell'interfaccia. Senza quella prova la diagnosi sarebbe partita dal posto sbagliato.

### B-17 — La testata del calendario legge un `ref` dentro un worklet (2026-08-28, APERTO — trovato, non corretto)

**Sintomo**: nei log di Metro, a ogni apertura dell'app sull'iPhone, `WARN [Worklets] Tried to modify key `current` of an object which has been already passed to a worklet`.

**Dove**: [`components/testata-calendario.tsx`](components/testata-calendario.tsx) — `direzione` è un `React.useRef`, viene **letto dentro `useAnimatedStyle`** (`translateX: (1 - cambio.value) * 22 * direzione.current`) e **mutato** sul thread JS poche righe sopra.

🔑 **Il commento accanto alla dichiarazione dice già la cosa giusta** — *«il verso al momento del cambio: letto qui, non nello stile animato»* — ed è il codice a contraddirlo. È il tipo di difetto che una rilettura non trova, perché il commento rassicura.

**Conseguenza**: il worklet tiene una **copia serializzata** del ref, quindi il verso che usa può essere **vecchio** — cioè il titolo del calendario può entrare **dal lato sbagliato**. È esattamente la funzione introdotta ieri con D-54 («titolo che entra dal lato giusto»), e resta fra le cose *non verificate sul telefono*.

**Non corretto oggi**: è di ieri, non è fra i due difetti riferiti, e la sessione era già su altro. **La correzione è piccola**: `direzione` deve essere un `useSharedValue`, non un `ref` — è l'unico modo perché il worklet ne veda il valore corrente.

**Perché è stato trovato**: leggendo il log di Metro mentre si verificava altro. ⚠️ E la prima occorrenza è **precedente** alle modifiche di oggi, il che è l'unica ragione per cui non è stato scambiato per una regressione: quando si trova un avviso, la prima domanda è *da quando c'è*, non *cosa ho appena toccato*.

### B-16 — Il «+» della mappa senza il suo tondo, ma solo appena avviata l'app (2026-08-28, CORRETTO — causa isolata)

**Sintomo, riferito dall'utente**: *«appena avvio l'applicazione non c'è il riquadro del pulsante "+" per l'aggiunta di luoghi sull'interfaccia mappa»*. Restava l'icona, spariva la superficie.

**È il modo di rompersi n. 2 di D-55**, quello che quella decisione aveva descritto e per cui aveva scritto `fondo="sicuro"` — un valore **mai messo su nessun componente**. La rete c'era, sulla carta.

🔑 **Ma stavolta la causa è stata isolata, non aggirata**, e la chiave è il *«solo appena avvio l'app»*. Il «+» sta dentro una `Comparsa`, che al montaggio parte da **opacità 0**, dentro la dissolvenza di scena della mappa, che al montaggio **partiva anch'essa da 0**. Su iOS una vista di vetro creata a opacità zero non cattura il suo sfondo, e quando l'opacità torna **non si ridisegna da sola**. Dopo l'avvio il componente si rimonta a schermo già acceso, e il tondo c'è: ecco perché il difetto aveva quella finestra così stretta.

**Correzione**: **D-61** — il vetro non nasce più dentro un livello a opacità zero (in due punti), e `TondoVetro` prende comunque `fondo="sicuro"`, così **il modo in cui fallisce resta deciso** anche se la diagnosi fosse incompleta.

⚠️ **Verificato solo per costruzione e per stringa** (`tsc`, `eslint`, i simboli nuovi presenti nel bundle iOS). Sul telefono **non ancora**: è la prima cosa del prossimo giro, e il caso di prova è preciso — *chiudere del tutto l'app e riaprirla*, non ricaricare.

### B-01 — `assegna_punti` chiamabile via RPC da chiunque, anon compreso (2026-08-12)
**Trovato**: con una chiamata di prova dall'esterno (`POST /rest/v1/rpc/assegna_punti` con la sola anon key), subito dopo l'applicazione di 0001. La chiamata è **entrata nella funzione** ed è stata fermata solo dal vincolo di chiave esterna, perché il `coppia_id` era inventato. Con un id reale, un utente poteva **auto-assegnarsi punti** saltando i trigger — violazione diretta di D-15.
**Causa**: Postgres concede `EXECUTE` a **PUBLIC** su ogni funzione nuova; il `revoke ... from anon` di 0001 non rimuove il grant a PUBLIC, e anon lo eredita da lì.
**Correzione**: migrazione `0002_permessi_funzioni.sql` — `revoke ... from public, anon, authenticated` su `assegna_punti` (la chiamano solo i trigger, che non ricontrollano il privilegio dopo la creazione); stessa chiusura su `crea_coppia`, la cui guardia interna aveva retto ma non deve essere l'unico strato (principio 5). `e_membro_attivo` resta eseguibile da tutti **di proposito**: le policy la invocano col ruolo del chiamante.
**Verificato il 2026-08-12**, dopo l'applicazione di 0002, ripetendo **la stessa identica chiamata**: risponde `42501 permission denied for function assegna_punti` invece di entrare nella funzione. Verificato insieme che `crea_coppia` da anon è ora bloccata al livello dei permessi (la guardia interna resta come secondo strato) e che le tabelle rispondono ancora `[]` ad anon — cioè `e_membro_attivo` continua a servire le policy.
**Lezione**: due erano già scritte nel processo — la verifica si fa **dall'esterno contro la realtà**, e la seconda riga di difesa (il FK, la guardia interna) è ciò che contiene il danno quando la prima manca. La nuova: **su Postgres, "revoke from anon" senza "revoke from public" non revoca niente.**

### B-02 — Errore NativeWind "Cannot manually set color scheme" nella preview web (2026-08-12, CHIUSO il 2026-08-27)
**Sintomo**: nella console del browser, ripetuto a ogni render, `Error: Cannot manually set color scheme, as dark mode is set via a media query. Please use StyleSheet.setFlag('darkMode', 'class')`.
**Cosa NON è**: non blocca il rendering. Verificato con gli stili calcolati che i token si applicano **correttamente in entrambe le modalità** — chiaro: carta crema `rgb(248,246,241)` + inchiostro `rgb(52,39,29)`; scuro: crema `rgb(237,232,222)` su marrone. Le route rendono, il font Fraunces si carica, la rete è pulita (200).
**Causa**: interazione **web-only** fra `userInterfaceStyle: "automatic"` (che serve all'app **nativa** per seguire la modalità notte del sistema) e NativeWind in dark-mode `media` sul web: Expo prova a riflettere lo schema via `Appearance.setColorScheme`, e NativeWind lo rifiuta. Escluso StatusBar come fonte (reso solo-nativo, l'errore resta).
**Perché lasciato aperto e non risolto stasera**: il web è **solo preview di sviluppo**; l'app vera è nativa, dove `Appearance` è nativo e questo errore NativeWind-web non si presenta. La correzione pulita (passare a dark-mode `class` e gestire il toggle da `useColorScheme`, riscrivendo `global.css` da `@media` a selettore `.dark`) è un refactoring del theming, non un lavoro di fine serata.
✅ **Chiuso il 2026-08-27**, e la strada per arrivarci vale più della correzione.

**Prima ipotesi, sbagliata**: tolta la modalità scura (D-39) l'errore doveva sparire da sé, visto che nasceva "dall'interazione fra `userInterfaceStyle: automatic` e il dark-mode a media query". Cancellati tutti i token scuri, messo `userInterfaceStyle: "light"`, riavviato Metro: **l'errore era identico**. Avere due modalità non c'entrava niente.

**Causa vera**: `darkMode` di NativeWind era al predefinito **`media`**, e in quella modalità `react-native-css-interop` **rifiuta ogni impostazione manuale** dello schema (`runtime/web/color-scheme.js`: `if (darkMode === "media") throw`). Expo ne fa una a ogni render sul web, riflettendo `userInterfaceStyle` — quale che sia il suo valore.

**Correzione**: `darkMode: 'class'` in `tailwind.config.js`. Non riapre la modalità notte: la classe `dark` non la mette nessuno, e in `global.css` non esistono più token scuri da applicare.

⚠️ **Serve svuotare la cache di Metro**: il flag viaggia dentro il CSS generato, che Metro tiene in cache. Due riavvii "normali" hanno mostrato l'errore ancora, e sembrava che la correzione non funzionasse.

**Verificato il 2026-08-27** nella console del browser, con un marcatore stampato prima del reload per non farsi ingannare dal buffer cumulativo — dopo il marcatore l'errore non compare più. Il flag `--css-interop-darkMode` vale `class dark`.

**Due lezioni**. La prima: la spiegazione scritta il 2026-08-12 era *plausibile e sbagliata*, e sarebbe passata per vera se non si fosse riaperta la console **dopo** la correzione — una causa scritta con sicurezza in un documento non diventa vera per il fatto di essere scritta lì. La seconda: è quasi passata due volte, perché le prime riletture mostravano l'errore **vecchio** — il buffer della console non si svuota al reload. Una verifica che legge uno stato accumulato deve prima marcare dove comincia il pezzo che le interessa.

### B-15 — Il riquadro della barra spariva, restavano le icone (2026-08-27, MITIGATO — causa non isolata)

**Sintomo, riferito dall'utente**: *«in alcuni casi (come quando apro poi richiudo il pulsante per aggiungere luoghi) il riquadro della toolbar sparisce lasciando solo le icone»*.

**Cosa si sa per certo**: la superficie della barra e le sue icone sono **due viste sorelle**, non annidate. Il difetto colpisce solo la prima, che è anche l'unica **nativa** (`GlassContainer`/`GlassView` su iOS 26, `BlurView` altrove). Le icone sono React puro, e infatti non ne risentono. Questo restringe il problema al vetro, non al resto della barra.

**Il sospetto**: fino a oggi la barra faceva `if (aperta) return null` — a tastiera aperta veniva tolta di scena, e con lei le viste native del vetro venivano **distrutte e ricreate**. Il pannello dei luoghi ha un campo con `autoFocus`, quindi apre la tastiera, quindi passava esattamente di lì. Un materiale di sistema che non si ridisegna dopo essere stato ricreato è un classico su iOS.

**Cosa è stato fatto — due cose, e la seconda non dipende dalla prima**:

1. **La barra si sposta invece di sparire.** Scende con una molla e torna; il vetro **resta montato tutto il tempo**, quindi non c'è più niente da ricreare. Se il sospetto è giusto, il difetto non ha più occasione di verificarsi. Come effetto secondario è anche molto meglio da guardare: prima la barra non se ne andava, *cessava di esistere* in un fotogramma — proprio mentre l'occhio è in basso, dove sta salendo la tastiera.
2. 🔑 **Un piano di riserva sotto il vetro**, che vale **anche se il sospetto è sbagliato**: una velatura chiarissima e un anello di luce, sempre presenti, sotto il materiale di sistema. Quando il vetro viene disegnato non si distinguono — 0,16 di bianco sotto un vetro è invisibile. Quando **non** viene disegnato sono tutto quello che resta, e la barra passa da «sparita» a «un po' meno bella».

⚠️ **Perché è segnato MITIGATO e non CHIUSO**: la causa non è stata isolata su un dispositivo, e non lo sarà finché il difetto non si ripresenta — o resta assente abbastanza a lungo da poterlo dire. Segnarlo chiuso sarebbe dichiarare una cosa che non è stata verificata.

**Aggiornamento 2026-08-28** — primo giro vero sull'iPhone: l'utente riferisce che *«la "scomparsa del riquadro" ora si è risolta»*. ⚠️ **Resta MITIGATO**, e non è pedanteria: una prova su una sessione dice che il difetto non si è presentato, non che la causa fosse quella. Il valore di questa riga sta nel fatto che il sospetto — le viste native distrutte e ricreate a tastiera aperta — è **compatibile** con quanto scoperto in B-16 sullo stesso materiale, e le due cose insieme cominciano a somigliare a una spiegazione sola: *il vetro di sistema non sopravvive ai cambi di stato del livello che lo contiene*. Si chiude quando lo si è visto reggere per più sessioni.

**Lezione**, ed è la stessa di B-14 applicata **prima** invece che dopo: due correzioni ragionevoli che non si possono verificare valgono meno di una che rende il fallimento innocuo. Più in generale: una superficie **nativa** non risponde a noi. Ovunque una vista di sistema sia l'unico strato fra il contenuto e il nulla, quel nulla è un esito possibile, e va deciso in anticipo.

### B-13 — Le schermate a tab non rileggono: la mappa teneva i pin cancellati (2026-08-27, CHIUSO)

**Sintomo**: cancellando un luogo dalle Liste, la mappa continuava a disegnarne il pin.

**Causa**: la terza occorrenza della **stessa forma** — in un navigatore a tab le schermate restano montate, e ognuna ha la propria copia degli hook. La mappa ha il suo `useLuoghi`, che rilegge solo quando cambia `coppiaId`; la cancellazione avveniva in un'altra schermata, e questa non aveva motivo di accorgersene.

Era già stato B-09 (i preferiti che non vedevano i luoghi aggiunti dal form dell'evento) e, in altra veste, B-03 (la home che raccontava uno spazio che non esisteva più). **Tre schermate, tre volte lo stesso difetto**, perché la causa non è in nessuna delle tre: è che *«lo stato di questa schermata è aggiornato»* non è mai vero in un'app dove più schermate vivono insieme e scrivono sugli stessi dati.

**Correzione**: `useFocusEffect` con `ricarica` — la callback dipende dal solo `coppiaId`, quindi è stabile e non innesca il ciclo di B-10.

**Regola per le prossime schermate**: se una schermata legge dati che **un'altra schermata può scrivere**, deve rileggere al focus. Non è un'ottimizzazione da valutare, è la condizione perché mostri il vero.

### B-14 — Il foglio delle serate non si apriva, e la diagnostica ha escluso metà delle ipotesi (2026-08-27, AGGIRATO)

**Sintomo**: nelle Liste, toccando un luogo non si apriva l'elenco delle sue serate.

Dopo due tentativi a vuoto — prima si sospettava il bersaglio invisibile, poi la mancanza di eventi collegati (che era B-12, reale ma diverso) — si è messa una riga di log sul tocco. È stata **decisiva in un colpo**:

```
[luogo] toccato Londra — serate: 0
[luogo] toccato Londra — serate: 1     ← dopo aver collegato il luogo
```

Il tocco **arrivava**, il conteggio era **giusto**, lo stato veniva impostato. Quindi il difetto non era in nessuno dei posti dove lo si era cercato: era nel `Foglio` che non compariva.

**Non è stata trovata la causa.** `components/foglio.tsx` funziona nel form del nuovo evento e non qui, e la differenza non è emersa. Si è scelto di **aggirare invece di insistere**: la schermata usa il `Modal` normale, che in quello stesso file apre già altri quattro fogli senza problemi.

⚠️ **Resta un'incoerenza dichiarata**: due modi di aprire un foglio nella stessa app. È debito, non soluzione — ed è scritto qui perché chi lo troverà sappia che è una scelta e non una svista.

**Lezione, la seconda oggi sullo stesso tema**: due correzioni ragionevoli di fila che non cambiano niente sono il segnale di smettere di correggere e mettere una misura. La riga di log è costata trenta secondi e ha escluso metà dello spazio delle ipotesi; le due correzioni prima ne erano costati molti di più senza escludere nulla.

### B-12 — Un evento punta al posto in **due** modi, e ne guardavamo uno solo (2026-08-27, CHIUSO)

🔑 **Una causa sola dietro tre sintomi diversi**, che sembravano tre bug indipendenti:

* toccando un luogo non si apriva l'elenco delle serate (ne risultavano zero, quindi la riga non compariva nemmeno);
* i luoghi non mostravano le foto delle serate, e restavano sull'immagine di Google;
* sulla mappa un posto con serate alle spalle aveva il pin **vuoto**.

**Causa**: un `evento` può puntare al posto con `elemento_id` — la scheda in lista, da 0012 — **oppure** con `luogo_id` — il posto sulla mappa, da 0008. Le tre query filtravano tutte per il primo (`.not('elemento_id','is',null)`, `.in('elemento_id', …)`), e **tutti gli eventi creati prima** che il campo "dove" impostasse entrambi hanno solo il secondo. Non è che i dati mancassero: si guardava dove non stavano.

**Correzione**: le tre letture seguono ora entrambi i legami e li uniscono, con `elemento_id` che vince quando ci sono tutti e due — è il legame esplicito, l'altro è il ripiego storico.

**Lezione**: quando si **aggiunge** un secondo modo di esprimere una relazione, il codice che legge il primo continua a funzionare — e resta corretto per i dati nuovi. Il difetto vive solo sui dati vecchi, cioè si vede tardi e sembra casuale: «a volte non compare». Un secondo legame introdotto senza una lettura che li unisca è un difetto a scoppio ritardato.

### B-11 — I «luoghi che non esistono»: cancellati dalla mappa, sopravvivevano in lista (2026-08-27, CHIUSO)

**Sintomo, riferito dall'utente**: nella lista dei luoghi compaiono posti che non esistono più.

**Causa**: `elemento_lista.luogo_id` ha `on delete set null`. Cancellando un posto dalla **mappa**, la riga in lista non spariva — le si azzerava il riferimento e restava lì. Non un dato sbagliato: un dato **sopravvissuto**.

`set null` era la scelta giusta quando è stata fatta, e resta giusta per le **foto** — una foto sopravvive al posto, è un ricordo e non un riferimento. Ma per la riga di lista, che del posto è la *scheda*, non lo è: da 0017 le due tabelle sono uno a uno, e una cancellazione che ne tocca una sola rompe l'invariante appena stabilito.

**Correzione, in entrambi i versi**: cancellare dalla mappa toglie anche la riga in lista, cancellare dalla lista toglie anche il posto. La simmetria va tenuta da entrambe le parti — una regola che vale in una direzione sola non è una regola, è un caso particolare che qualcuno dimenticherà.

L'ordine conta e non è simmetrico: si toglie prima la riga che dipende, poi quella da cui si dipende. Se la seconda cancellazione fallisce resta un posto senza scheda — riparabile, e comunque il male minore rispetto a una scheda che punta al vuoto.

**I residui già in archivio** li ripulisce [`0018`](supabase/migrations/0018_pulizia_luoghi_fantasma.sql), con un criterio volutamente stretto: va via solo una riga che ha **solo un nome** e nient'altro (nessun posto, nessun evento, nessuna recensione, nessuna foto, nessun id Google). Un posto scritto a mano e mai collegato sopravvive se ha almeno una di quelle cose. Il file porta in fondo la stessa condizione in sola lettura: **si guarda prima di applicare**, perché cancella dati e non si torna indietro.

**Lezione**: un `on delete set null` scelto per una tabella viene ereditato da tutte le altre che quella chiave la riusano, e continua a sembrare corretto anche quando il modello attorno è cambiato. Qui l'invariante uno-a-uno è arrivato **quattro migrazioni dopo** la chiave esterna che lo contraddiceva.

### B-10 — "Maximum update depth exceeded" nei preferiti (2026-08-27, CHIUSO)

**Introdotto da me** poche ore prima, correggendo B-09: avevo aggiunto `ricarica()` dentro il `useFocusEffect` che già chiamava `caricaCopertine()`.

**Il ciclo**:

```
ricarica()  →  nuovo array `elementi`
            →  `caricaCopertine` cambia identità (dipende da `elementi`)
            →  cambia la callback del focus
            →  l'effetto riparte  →  ricarica()  →  …
```

Prima l'effetto chiamava **solo** `caricaCopertine`, che non tocca `elementi`: nessun anello. È stato aggiungere l'altra chiamata a chiuderlo.

**Correzione**: separare i due lavori secondo cosa li fa scattare. All'apertura della schermata `ricarica()` e `sincronizzaVisitati()`, che dipendono solo da `coppiaId` e quindi non si auto-rialimentano; in un `useEffect` normale `caricaCopertine()`, che reagisce agli elementi ed è la sua condizione naturale.

**La regola**: *in un effetto di focus non vanno funzioni che dipendono da ciò che l'effetto stesso modifica.*

**Verificato che non fosse altrove**: gli altri due `useFocusEffect` del progetto (`galleria`, `home`) dipendono da callback legate al solo `coppiaId`. Era solo il mio.

### B-09 — «I luoghi non vengono aggiunti ai preferiti» — venivano aggiunti, non si vedevano (2026-08-27, CHIUSO)

**Sintomo**: scegliendo un posto nel campo "dove" del nuovo evento, il luogo non compariva nella lista dei preferiti.

**Riprodotto contro il database reale** con uno script che rifà esattamente le due scritture di `aggiungiLuogoPreferito`: luogo inserito, elemento inserito, riletto, tutto corretto. **Il backend era innocente.**

**Causa**: `usePreferiti` rilegge l'elenco solo quando cambia `coppiaId`, e in un navigatore a **tab le schermate restano montate**. Il form dell'evento ha la *sua* istanza dell'hook e ricaricava quella; la schermata dei preferiti, montata da chissà quando, non rileggeva mai e mostrava l'elenco di quando era stata aperta la prima volta.

**Correzione**: `ricarica()` dentro il `useFocusEffect` della schermata.

**Lezione, che è la terza volta oggi che si presenta**: *non lo vedo* raccontato come *non c'è*. È stato B-03 (la home che raccontava uno spazio inesistente), è stato il conteggio dei membri dopo lo scioglimento in B-07, ed è questo. La forma ricorrente: **due copie dello stesso stato, di cui una non viene aggiornata** — e chi guarda non ha modo di distinguerla da un dato che manca davvero.

### B-08 — Gli stili passati come funzione a `Pressable` non arrivano mai (2026-08-27, CHIUSO)

🔑 **Il difetto più costoso finora: ha fatto fallire tre correzioni di fila, e ogni volta la diagnosi sembrava plausibile.**

**Sintomi**, tutti sulla barra in basso, tutti sullo stesso componente:
1. le sei voci **ammassate a sinistra** a larghezza di contenuto → diagnosticato come `flexGrow` che non si propaga dentro una vista nativa. Corretto con `width` esplicito;
2. **ancora ammassate** → diagnosticato come misura sbagliata da `onLayout`. Corretto calcolando la larghezza dallo schermo, senza misurare;
3. **impilate in colonna** lungo il bordo sinistro.

Il terzo sintomo è quello che ha risolto il caso. `flexDirection` predefinito di React Native è **`column`**: sei elementi in colonna sono esattamente ciò che si ottiene quando lo stile **non viene applicato affatto**. Non era il flex, non era la misura, non era la vista nativa: era che lo stile non arrivava.

**Causa, trovata nella sorgente della libreria** e non per deduzione — `node_modules/react-native-css-interop/dist/runtime/components.js:7`:

```js
cssInterop(Pressable, { className: "style" });
```

NativeWind **avvolge `Pressable`** (e `View`, `Text`, `Image`, `ScrollView`…) per far funzionare `className`, e lo fa mappando le classi **dentro `props.style`**. Nel farlo tratta `props.style` come un oggetto (`props.style?.width`, riga 327) e ci scrive dentro: uno `style` passato come **funzione** viene sovrascritto e non raggiunge mai il `Pressable` di React Native.

**Dove faceva danno, e dove no** — ed è il motivo per cui è sopravvissuto tanto:

| componente | cosa portava lo stile-funzione | visibile? |
|---|---|---|
| `barra-volante` | geometria delle sei voci | 🔴 rompeva tutto |
| `TondoTestata` | il cerchio dietro l'icona | 🔴 tondi mai comparsi |
| `Tondo` del visore | il cerchio scuro e l'area da premere | 🔴 «pulsanti troppo piccoli» |
| `TondoVetro`, `BottoneVetro` | solo l'opacità del tocco | ⚪️ invisibile |

Le ultime due nascondevano il difetto rendendolo innocuo dove si guardava di più.

**Correzione**: nessuno `style` come funzione, in tutto il repo. **La geometria e l'aspetto stanno su una `View` con stile-oggetto**, il `Pressable` ci vive dentro senza stile, e il riscontro del tocco si fa con `onPressIn`/`onPressOut` più uno stato.

**Lezione, che vale oltre React Native**: tre diagnosi diverse, tutte plausibili, tutte sbagliate, perché tutte davano per scontato che *lo stile venisse applicato* e discutevano solo di cosa contenesse. Il sintomo che ha sciolto il caso — la colonna — era informazione sul **valore predefinito**, cioè su cosa succede quando il proprio contributo è **assente**. Quando due correzioni ragionevoli di fila non cambiano niente, l'ipotesi da mettere in discussione non è il contenuto: è che il contenuto arrivi.

### B-07 — Le funzioni di appaiamento erano eseguibili da un anonimo (2026-08-27, CHIUSO E VERIFICATO)

**Trovato** mentre si verificava che lo schema fosse sopravvissuto alla pausa del progetto Supabase. Chiamando le funzioni RPC con la sola **chiave pubblicabile** e nessun utente, `crea_coppia` e `sciogli_coppia` rispondevano `42501 permission denied` — cioè fermate ai permessi, come devono. Ma le altre no:

| funzione | risposta ad anon | cosa significa |
|---|---|---|
| `crea_invito()` | `P0001` «non sei in una coppia…» | è **entrata** nella funzione |
| `apri_invito(text)` | `P0001` «non autenticato» | è entrata |
| `conferma_invito(uuid)` | `P0001` «solo chi ha invitato…» | è entrata |
| `revoca_invito(uuid)` | `P0001` «solo chi ha invitato…» | è entrata |
| `ha_coppia_attiva(uuid)` | `false` | **ha risposto** |
| `n_membri_attivi(uuid)` | `0` | **ha risposto** |

**Causa**: è **B-01 allo specchio**. B-01 era *«revoke from anon senza revoke from public non revoca niente»*, perché Postgres concede EXECUTE a PUBLIC su ogni funzione nuova. La 0003 ha applicato quella lezione — c'è scritto nel suo commento, «revoke from public (non da anon)» — ma il difetto qui ha la forma opposta: Supabase imposta anche `alter default privileges … grant all on functions to anon, authenticated`, quindi ogni funzione nuova riceve un grant **diretto** ad anon, che `revoke from public` non tocca. Le due revoche vanno fatte **entrambe**, sempre.

**Gravità, dichiarata onestamente e senza gonfiarla**:
- Sulle quattro dell'invito **non c'è escalation**: le guardie interne reggono, tutte le strade finiscono in un raise. Il difetto è che la guardia diventa **l'unico strato**, che è precisamente il principio violato — quello scritto in `Rule/regole-sviluppo-sicuro.md` e ripetuto chiudendo B-01. Una guardia è una riga che un domani si riscrive; un permesso negato è una proprietà del database.
- Sulle due di lettura è **una lettura non autenticata vera**. Sono `security definer`, quindi scavalcano la RLS per costruzione, e rispondevano a chiunque: *«questa persona sta in una coppia?»*, *«quanti membri ha questa coppia?»*. Serve un uuid valido, che non si indovina — ma un `utente_id` non è un segreto come un token: compare negli `autore_id` dei contenuti condivisi. **Rischio basso, ma reale, e di una categoria che non deve esistere.**

**Correzione**: [`supabase/migrations/0014_permessi_inviti.sql`](supabase/migrations/0014_permessi_inviti.sql) — revoca esplicita `from public, anon` sulle quattro, e `from public, anon, authenticated` sulle due di lettura (le chiamano solo altre funzioni `security definer`, che girano coi privilegi del proprietario; il client non le ha mai chiamate — verificato, compaiono solo in `database.types.ts`). `e_membro_attivo` **non si tocca**, ed è deliberato: le policy RLS la invocano col ruolo del chiamante, e revocarla spegnerebbe la RLS invece di rafforzarla; per di più risponde solo sul chiamante, quindi a un anonimo dice sempre `false`, che non è un'informazione.

✅ **Applicata dall'utente il 2026-08-27 e verificata contro il progetto reale.** Le sei funzioni rispondono ora `42501 permission denied` dove prima entravano o rispondevano. Verificata anche la **controprova che contava di più**: le tabelle continuano a rispondere `200 []` a un anonimo, cioè `e_membro_attivo` serve ancora le policy — una revoca troppo larga avrebbe spento la RLS invece di rafforzarla, ed è lo stesso controllo fatto chiudendo B-01.

🔑 **Sistemando i test è emersa la cosa più interessante di tutta la vicenda.** Applicata la migrazione, **tre asserzioni sono diventate rosse**: usavano `n_membri_attivi` per contare i membri di una coppia. Cioè il test si appoggiava esattamente alla scorciatoia che il difetto apriva — verificava il dominio *attraverso un privilegio che non doveva esistere*. Un test può dipendere da un difetto senza che nessuno se ne accorga, e allora è quel difetto a tenerlo verde.

Due delle tre sono state riscritte **più forti**: contano con una `select` normale su `membro_coppia`, che è la strada dell'app, quindi verificano insieme il dato e la policy che lo protegge. La terza — *"dopo lo scioglimento la coppia non ha membri attivi"* — **non è più asseribile**, ed è giusto così: `sciogli_coppia` fa uscire entrambi, quindi da fuori `0` significa sia «non ci sono» sia «non li vedo» (è B-03 di nuovo). Prima le distingueva solo grazie al difetto. Ora asserisce ciò che si vede davvero, e il residuo è **dichiarato** fra i casi non coperti, insieme alla ragione: servirebbe la `service_role`, che in questo repo non entra. Le conseguenze che contano restano coperte — dopo la rottura l'ex non legge, non scrive e non invita.

**Suite: 60 asserzioni, tutte verdi** (erano 54).

**Perché i 54 test non l'hanno visto**, che è la parte che vale di più. Il test copriva `anon non puo chiamare crea_coppia` — e passava, perché la 0002 revocava esplicitamente `from public, anon`. Le altre sei non erano coperte affatto. Ma c'è di peggio: un test scritto come *«la chiamata deve fallire»* sarebbe passato **verde sul difetto**, perché falliva davvero — solo con `P0001` invece che con `42501`. I casi aggiunti ora controllano il **codice**, non il fallimento, e il commento nel file spiega perché.

**Lezione**: *fallisce* e *è vietata* non sono la stessa cosa, e un test che non le distingue certifica la prima credendo di aver verificato la seconda.

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

✅ **Identificativo del pacchetto deciso: `com.lifecouple.app`** (D-20). *(Diceva `it.frbusato.lifecouple`: era il primo dei due passaggi di D-20, rimasto qui quando la decisione è cambiata. Corretto il 2026-08-27 — `app.json` e D-20 dicevano entrambi `com.lifecouple.app`.)* L'utente è stato avvisato che non si cambia dopo la pubblicazione e ha scelto di legarlo comunque al nome del prodotto: è invisibile agli utenti, quindi un eventuale cambio di nome visualizzato non produce alcun danno — solo un identificativo che non combacia più, e questa nota spiega perché.

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
7-bis. [x] **Hub dei giochi** — fatto il 2026-08-28 (**D-62**): carosello delle tre carte, «Classifica» e «Gioca», e dietro «Gioca» le due sorgenti di domande di 11-bis. È **solo l'ingresso**: nessuna partita, per esplicita richiesta dell'utente («partiamo implementando solo l'hub game»).
    - 🔴 **Aperta la formulazione della classifica** — vedi D-62: *chi ha vinto più volte* è una graduatoria persistente fra le due persone, e P-03 dice che il punteggio non deve diventare un verdetto sulla relazione. Da decidere **prima** di scriverne il conteggio, non dopo.
8. [ ] **Meccanismo di invio sigillato** (D-12) — la macchina a stati condivisa dai tre giochi: invito → accettazione → invio segreto di entrambi → rivelazione
9. [ ] **Gioco 1 — quiz sulle preferenze del partner**: (a) uno invita, l'altro accetta; (b) fase di deposito, entrambi inseriscono le **proprie** risposte corrette su una lista di domande; (c) a turno ciascuno risponde cercando di indovinare quelle dell'altro; vince chi indovina di più
10. [ ] **Gioco 2 — obbligo o verità**, con la regola del pass secondo **D-13** e il banco filtrato (D-08 + le due esclusioni specifiche)
11. [x] **Gioco 3 — telepatia** — fatta il 2026-08-28 (**D-67**), versione ufficiale, 10 round. ⚠️ Mai giocata da due persone vere. Descrizione originale: stesse opzioni mostrate a entrambi, selezione contemporanea, si vince se coincidono. È il caso che richiede il **tempo reale** (presenza dell'altro, e rivelazione simultanea) — Supabase Realtime
11-bis. [ ] **Modalità «personalizza i giochi»** — la coppia scrive il **proprio** set di domande (**D-19**). *Aggiunta al backlog il 2026-08-27: la decisione esisteva dal 2026-08-12 ma non compariva come voce di lavoro, quindi rischiava di restare una decisione senza esecutore.*
    - **Non è un gioco nuovo**: è una sorgente di domande alternativa per i giochi 9-11. Lo schema c'è già dal primo giorno — `domanda.coppia_id` *nullable* (`NULL` = banco comune, valorizzato = della coppia) e le tre policy RLS che ne discendono: si **legge** il comune più il proprio, si **scrive** e si **cancella** solo il proprio. Nessuno può inserire nel banco comune.
    - **Va costruito insieme al meccanismo dell'item 8, non dopo.** Se le partite nascono sapendo leggere solo il banco comune, aggiungere la seconda sorgente dopo significa rimettere le mani sulla selezione delle domande di tre giochi già scritti.
    - **Quattro cose che la funzione deve avere**, e sono mitigazioni di D-19, non rifiniture: (a) le domande restano **private della coppia** — mai riusate nel banco comune, mai suggerite ad altri, mai aggregate; (b) **nessuna analisi del contenuto**; (c) **avviso al primo uso** — «è un campo per giocare, non per informazioni delicate»; (d) dentro la catena di cancellazione e dentro D-04 per lo scioglimento.
    - ⚠️ **È il punto in cui D-08 cambia natura**, ed è la ragione per cui questa voce non può essere trattata come una schermata qualsiasi: finché il banco lo scriviamo noi, «nessun dato di categoria particolare» è garantito **per costruzione**; con le domande scritte dagli utenti diventa **mitigato**, perché le persone scriveranno di sesso, salute e religione. La distinzione che regge è che *quei dati non li chiediamo noi* — ma i dati arrivano sui nostri server lo stesso.
    - **Non ancora deciso** (`—`): l'avviso al primo uso è una schermata o una riga sopra il campo; se una domanda personalizzata sia modificabile o solo cancellabile e riscritta; se le domande della coppia si mescolino al banco comune o siano una modalità separata scelta a inizio partita.
11-ter. [x] **Gioco 4 — «indovina il disegno»** — fatto il 2026-08-28 (**D-67**), 5 round, tela coi tratti in tempo reale. ⚠️ Mai giocato da due persone vere. Note originali (**D-65**, promosso da P-04 proposta 1).
    - 🔴 **Richiede un secondo meccanismo**, *uno produce e l'altro indovina*, che il sigillo D-12 non fornisce. È la ragione per cui questa voce non sta accanto alle 9-11: quelle tre condividono la voce 8, questa no.
    - ⚠️ **Prima di aprirlo, rileggere P-04 proposta 2** («indovina la parola»): è lo stesso meccanismo **senza** superficie di disegno, file e spazio — il modo più economico per scoprire se il formato piace.
    - **Da decidere, e non c'è ancora niente di deciso** (`—`): se il disegno sia contenuto personale o condiviso (D-04/D-21), se si conservi o si butti a fine partita, e in quale caso pesi sul tetto di D-22.
11-quater. [ ] **Tradurre i dialoghi di sistema** — *aperto il 2026-08-28, rispondendo alla domanda «se domani viene scaricata in America c'è la versione inglese?»*.
    - **L'interfaccia sì**, ed è stato verificato: cercando stringhe italiane fuori da `lib/i18n.ts` in tutto `app/`, `components/` e `lib/` non ne resta nessuna su un percorso visibile all'utente (le uniche quattro sono due `select` Supabase, una riga di diagnostica in console e un errore da `.env` mancante, che vede solo chi sviluppa).
    - 🔴 **I dialoghi di sistema no.** Le tre descrizioni dei permessi in `app.json` — calendario, posizione, foto — sono **solo in italiano**. Un utente americano riceverebbe la richiesta di accesso alle foto **in italiano**, ed è anche ciò che legge un revisore Apple.
    - **Come si risolve**: il campo `expo.locales` di `app.json` (funzione documentata di Expo, verificata nello schema `@expo/config-types`) mappa una lingua a un file JSON che sovrascrive le chiavi dell'`Info.plist`. Costa tre stringhe per lingua e un file.
    - ⚠️ **Non è verificabile prima di un build** (vedi **B-20**): in Expo Go i dialoghi usano l'`Info.plist` di Expo Go. Va fatto insieme al primo build, non prima e non dopo.
12. [ ] **Creatura** (P-01): stato, stadi, disegno in `react-native-svg` (D-09)

> **Le partite completate alimentano la creatura** (P-03): la ricompensa è la crescita condivisa, **non** un punteggio di compatibilità che resta.
> **Dettaglio emerso il 2026-08-12 sulla mappa**: ogni luogo può avere **foto associate**. Lo schema lo prevede dal primo giorno — una foto può appartenere a un luogo — anche se l'interfaccia arriva dopo.

### La chiave di Google Places — aggiunto il 2026-08-27
- [ ] **Tetto di quota giornaliero + avviso di budget** su Google Cloud. Da fare **subito**, non prima di pubblicare: finché la chiave sta nel bundle è l'unica cosa che impedisce davvero un conto a sorpresa.
- [ ] 🔴 **Spostare la chiave dietro una Edge Function di Supabase**, prima di utenti veri. Oggi vive in `EXPO_PUBLIC_GOOGLE_PLACES_KEY`, cioè **dentro il bundle**: chiunque scarichi l'app può estrarla, e `urlFotoGoogle` la mette anche nella *query string* delle immagini, dove finisce in cache e log. Le "application restrictions" di Google non chiudono il buco per una `fetch` scritta a mano — valgono per gli SDK nativi, che mandano da soli gli header d'identità, e chi ha copiato la chiave può fabbricarli. Con la funzione la chiave sta in un secret, si può limitare per utente autenticato, e si spegne senza ripubblicare l'app.

### Dopo l'MVP, non prima
- [ ] Rimettere le etichette nella barra in basso, **se** all'uso reale le sei icone risultano illeggibili (D-40)
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
> ✅ **Promossa a gioco previsto il 2026-08-28** (**D-65**, backlog **11-ter**). L'analisi qui sotto resta valida ed è il suo preventivo.
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

**Aggiornato al 2026-08-28 (primo giro sull'iPhone, D-60→D-66, B-16→B-20).**

✅ **Migrazione 0020 applicata dall'utente** dopo due fallimenti (**B-21**), e **verificata contro il database vero**: le quattro tabelle nuove rispondono, le quattro colonne nuove di `partita` esistono, e le tre funzioni girano — interrogate via `/rest/v1/rpc` hanno risposto con le **nostre** eccezioni, che è la prova che esistono e che le firme sono giuste.

✅ **I due giochi sono scritti** (**D-67**): «indovina il disegno» (5 round) e «telepatia» (10 round), versione ufficiale. Con loro: i due punteggi **Intesa** e **Sintonia** al posto della Classifica, l'anello del punteggio finale, e i banchi da 500 voci verificati con `npm run test:parole`.

✅ **Le due partite sono state giocate davvero** — non su due telefoni, ma da due giocatori simulati con due sessioni vere contro il database reale: `npm run test:partita`, **41 asserzioni su 41**. Sono provati: la partita che non parte con un solo pronto e parte col secondo, i cinque round coi ruoli che si invertono, il punteggio (3/5, scelto perché né tutto né niente), la conclusione all'ultimo round, e il round telepatia intero.

🔴 **E sono provate le due cose che a mano non si possono provare**:
- **chi indovina non legge la parola** — zero righe da `round_segreto` interrogando l'API col proprio token, verificato su tutti e cinque i round. Sul telefono si vedrebbe solo che *l'interfaccia non la mostra*, che è un'affermazione molto più debole;
- **la rivelazione della telepatia tace** con una sola scelta, né a chi ha scelto né a chi non ha scelto — e il partner non legge il sigillo dell'altro.

⚠️ **Resta non provato ciò che è esperienza, non meccanica**: nessuna partita è mai stata giocata **da due persone su due telefoni**. Che i tratti arrivino fluidi, che il tempo scorra uguale sui due schermi, che il round passi quando deve — quello lo dice solo una partita vera. Il modo praticabile senza una seconda persona è **telefono + preview web** con i due account, che sono entrambi dell'utente.

**Cosa guardare alla prima partita vera, in ordine di quanto è probabile che sia rotto**:
1. **La partita parte?** Entrambi premono «avvia» e la schermata deve cambiare **da sola** su tutti e due. Se resta ferma su uno, il sospetto è il realtime su `partita_pronto`.
2. **I tratti arrivano?** Chi indovina deve vedere il disegno **mentre** viene fatto, non alla fine. Se arriva a scatti o non arriva, è il canale broadcast.
3. ⚠️ **Il tentativo giusto viene riconosciuto?** Lo giudica il telefono di **chi disegna**. Se un tentativo palesemente giusto non passa, guardare `normalizza` in `lib/parole.ts` prima di sospettare la rete.
4. **Il round passa dopo tre secondi**: non subito, e non mai.
5. **La telepatia rivela solo quando hanno scelto in due**, e chi sceglie per primo **non deve vedere niente** finché l'altro non ha scelto. È il sigillo D-12: se trapelasse, è il difetto più grave dei due giochi.
6. **A fine partita** l'anello si riempie e il numero sale.

✅ **Il confine nuovo è coperto**, da `tests/partita.mjs` e non dai test avversariali — che restano quelli di RLS e non sanno niente di partite. ⚠️ Il nuovo test **ripulisce ciò che crea**, a differenza di `rls.avversariali.mjs`: quella mancanza è ciò che ha fatto fallire la migrazione 0020 (B-21), e non valeva la pena ripeterla.

**Fatto e verificato oggi sui giochi**: i due banchi da 500 voci in `lib/parole.ts`, con `npm run test:parole` (15 controlli verdi: nessuna chiave doppia, nessuna voce vuota, 25 temi da 20, e il normalizzatore dei tentativi provato su casi veri). **Non fatto**: le due schermate di gioco, il canale realtime, il timer, l'animazione del punteggio finale e i due punteggi al posto della Classifica.

✅ **L'app è stata aperta sull'iPhone**, finalmente, e il giro ha prodotto quattro risposte: commenti **funzionanti**, caricamento foto **migliorato**, B-15 **non riprodotto**, e due difetti confermati sul vetro — poi corretti con D-60 e D-61.

🔴 **Cosa guardare al prossimo giro, in ordine.** Sono tutte cose corrette o scritte **oggi e mai viste girare**:
1. **Il pannello «aggiungi un luogo»** (D-60): la carta e **i due bottoni dentro** devono essere chiari. Erano i bottoni il colpevole più probabile — nidificati nel vetro della carta — ma la correzione copre anche il caso in cui fosse la carta, quindi *se è ancora in ombra la diagnosi è sbagliata in pieno*, non a metà.
2. **Il «+» della mappa** (D-61 / B-16). ⚠️ Il caso di prova è preciso: **chiudere del tutto l'app e riaprirla**, non ricaricare — il difetto aveva quella finestra sola.
3. **L'hub dei giochi**, ora a **quattro** carte (D-65: «indovina il disegno» in fondo, verde): la parte bassa **respira** ora (D-62, coda) — puntini, comandi, riga di stato e barra non devono più toccarsi — e ⚠️ lo **zoom** non deve essere tagliato sopra e sotto premendo «Gioca»: è il motivo dei 48 punti di pista in più. Poi il resto, mai visto: scorrimento fra le carte, puntini che si allungano, i due fogli, e il cartellino «serve il partner» al posto dei comandi se si è soli.
4. **L'aggiunta di un posto, che ora è una sola** (D-64). Il «+» della mappa apre **lo stesso foglio** di Liste: non c'è più «Come lo chiamate?», non c'è più «segna dove sono». Da provare, in ordine: *(a)* il «+» **della mappa** e il «+» **di Liste** devono aprire la stessa identica cosa; *(b)* tre lettere → **la tendina**, e sotto le tre la riga che dice di scriverne ancora (B-18); *(c)* scelto un posto, deve comparire **subito il pin** sulla mappa (è la `ricarica` passata al foglio); *(d)* ⚠️ **e in Liste quello stesso posto deve avere la copertina** — è B-19, ed è l'unica metà che sulla mappa non si vede.
5. **Tutto il resto del 2026-08-27**, che il primo giro non ha coperto: il calendario (pillola allineata, titolo direzionale — ⚠️ vedi **B-17**, potrebbe entrare dal lato sbagliato, ed è un difetto vero non ancora corretto —, scorrimento a giorni), la pagina evento, «Cambia tag», il cedimento dei bottoni, la cascata della home, D-58/D-59.

⚠️ **I permessi non si provano in Expo Go** (B-20): il dialogo usa l'`Info.plist` di Expo Go, non il nostro. Tutto ciò che sta nei `plugins` di `app.json` — testi dei permessi, chiavi dichiarate — resta **non verificato** finché non si fa un build vero. È la prima cosa da ricontrollare il giorno in cui se ne farà uno.

⚠️ **B-17 è aperto e la correzione è nota**: `direzione` in `components/testata-calendario.tsx` dev'essere un `useSharedValue` e non un `React.useRef`, perché oggi un worklet ne legge una copia serializzata.

🔴 **Non deciso, e blocca il prossimo pezzo dei giochi**: **come si formula la Classifica** (D-62). *Chi ha vinto più volte* è una graduatoria persistente fra le due persone, e P-03 dice che il punteggio non deve diventare un verdetto sulla relazione. Va deciso prima di scriverne il conteggio.

⚠️ **Il bundle web si compila solo da un Metro fresco.** Il 2026-08-28 il processo su :8081 è rimasto impiantato al 99,9% e non ha mai emesso una riga `Web Bundled`; un secondo Metro sulla porta 8082 ha prodotto lo stesso bundle in **7 secondi**. Non è un difetto del codice — ma se un giorno il bundle web «non finisce mai», la prima cosa da provare è **riavviare Metro**, non cercare il modulo colpevole.

✅ **Chiave Google Places inserita nel `.env`** (terza sessione del 2026-08-27) e **verificata nel bundle iOS**, insieme a URL e anon key. Questo chiude il punto 1 della lista qui sotto e accende la ricerca luoghi/ristoranti di D-37.
⚠️ **E rende attuale un debito che era teorico**: la chiave ora vive nel bundle. Il **proxy dietro una Edge Function** e il **tetto di quota + avviso di budget** su Google Cloud vanno fatti **prima di utenti veri**, non prima della pubblicazione.

✅ **D-58** — il calendario si apre sul **Diario**, non sul mese. ⚠️ Conseguenza non misurata: il Diario carica le anteprime delle foto, quindi ora quelle richieste partono a **ogni** apertura del calendario. Se l'apertura è lenta sul telefono, è il primo posto dove guardare.
✅ **D-59** — la mappa **chiede** il permesso di posizione (dialogo iOS diretto, scelta dell'utente) e lo **rilegge a ogni focus**, così concederlo dalle Impostazioni dopo un rifiuto funziona senza riavviare. ⚠️ Il caso di prova vero è stretto: iOS di solito riavvia l'app quando si cambia un permesso dalle Impostazioni, e il riavvio maschererebbe il merito di `useFocusEffect` — per vederlo bisogna tornare **senza** che l'app si sia riavviata.
🔑 **Perché D-59 esisteva già e non funzionava per nessuno**: leggeva la posizione solo se il permesso era *già* concesso, e l'unico modo di concederlo era «segna dove sono adesso». Non un errore — **una funzione che tace**, sopravvissuta a due sessioni e a una rilettura del codice.

**Stato**: progetto **inizializzato e funzionante**. Esistono i tre documenti, il repo su GitHub, il submodule nel brain e un'app Expo che parte. Zero risorse cloud, zero costi sostenuti.

**Cosa è deciso**: le sei funzioni · i tre giochi da implementare per primi · lo stack completo (D-10) · l'ordine di implementazione (D-11) · la creatura geometrica ora e sostituibile poi (D-09) · il ciclo mestruale rimandato (D-07) e il divieto di reintrodurre art. 9 da altre porte (D-08) · le regole di scioglimento (D-04), posizione (D-05), invio sigillato (D-12) e pass (D-13).

✅ **Repo, submodule e inizializzazione fatti il 2026-08-12.** Il progetto è su GitHub (`samuelebusato/LifeCouple`), agganciato al brain come submodule, e **l'app parte e rende**: verificata nella preview web con 1153 moduli compilati, nessun errore in console, navigazione fra le tab funzionante.

**Configurazione applicata**: `name` LifeCouple · `slug` lifecouple · `version` **0.1.0** (1.0.0 su un progetto senza codice sarebbe una bugia) · `scheme` **`lifecouple`** — serve ai link di invito di D-14, è ciò che fa aprire l'app quando si tocca il link su WhatsApp · `ios.bundleIdentifier` e `android.package` **`com.lifecouple.app`** (D-20) · `supportsTablet: false`, perché un'app di coppia sul telefono non ha motivo di farsi recensire anche su iPad.

**Comando per lavorarci**: `npm install` (il 2026-08-27 `node_modules` era rimasto indietro di due pacchetti — `expo-blur` e `expo-glass-effect` erano in `package.json` ma non installati), poi `npm run web` dentro `Projects/LifeCouple` (o la configurazione `lifecouple-web` in `.claude/launch.json` del brain).

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

✅ **Redesign "Quarzo rosa" col vetro liquido** (D-35, 2026-08-13 sera): palette rosa-bianco su token (prima taratura giudicata viola sull'iPhone e corretta), vetro nativo iOS 26 con ripiego a tre strati, toolbar volante che sparisce a tastiera aperta, galleria stile Foto con **cartelle** (`0011`), pagina evento con hero, foto che si allargano e ingranaggio a cinque azioni, ricerca luoghi **Photon/OSM** (senza posizione, per scelta), striscia giorni a scorrimento libero (B-06). Ristoranti sulla mappa e dentro gli eventi (D-36, `0012`), che corregge anche B-05.

✅ **Quinto giro di design, sui riferimenti portati dall'utente** (2026-08-27, D-39/D-43): **una modalità sola** — il tema scuro non esiste più, e con lui se n'è andata metà della fatica di taratura · **barra in basso con la lente di vetro che viaggia**, su `GlassContainer` dove iOS 26 c'è · **calendario** con testata sfumata, pillole al posto dei pallini e agenda a fasce orarie · **pagina evento** con immagine a tutto schermo e foglio bianco che la taglia · **pin della mappa** che dicono quanti eventi hanno, e anteprima dell'evento in sovraimpressione invece del foglio. **B-02 chiuso** — la causa non era quella scritta il 2026-08-12.

⚠️ **Tutto questo è verificato solo a compilazione**: `tsc` pulito, `eslint` senza errori, bundle web di 2763 moduli, palette unica confermata in console. **L'aspetto vero non l'ha visto nessuno**: le schermate rifatte stanno dietro il login, la mappa sul web non esiste e il vetro di sistema è solo iOS 26. È il primo punto della lista qui sotto per questo motivo.

**Cosa manca** (in ordine):
0. **Rigenerare i tipi**: `lib/database.types.ts` ha blocchi scritti a mano per 0011→0016 (`genere`, `aggiorna_ristoranti_visitati`). È la prima cosa: ogni migrazione nuova richiede di aggiungerli a mano finché non si fa.

**Cosa è successo il 2026-08-27** (giornata lunga, tutto provato sull'iPhone con l'utente): design rifatto sui riferimenti (D-39→D-43), poi il modello dei luoghi riscritto tre volte sotto il feedback — da "ristoranti" a **luoghi** (D-45), ogni posto anche in lista (D-46), un pin/elenco/stato solo (D-48), e infine l'elenco dei luoghi **dentro la mappa** (D-51). Chiave Google Places attiva e verificata. Migrazioni 0014→0019 applicate.

**Difetti chiusi**: B-07 (permessi), B-08 (stili-funzione su `Pressable`), B-09/B-13 (schermate a tab che non rileggono), B-10 (ciclo di render), B-11 (luoghi fantasma), B-12 (i due legami evento→luogo). B-14 **aggirato**, non risolto.

⚠️ **Non ancora guardato sull'iPhone**: l'ultimo giro (D-50, D-51) — il «+» nelle Liste, la mappa senza barra di ricerca, l'interruttore Mappa/Elenco. Compila e i controlli passano, ma nessuno l'ha visto.

**Cosa è successo nella seconda sessione del 2026-08-27**, in due giri.

*Primo giro*: tolto il **tocco lungo** dalla mappa e il cartellino che lo spiegava (**D-52**), e introdotto uno **strato di movimento condiviso** (**D-53**) — `lib/movimento.ts`, `components/ui/premibile.tsx`, `components/ui/comparsa.tsx`. Ogni comando di vetro ora cede sotto il dito e vibra sull'azione; sulla mappa la pillola Mappa/Elenco scivola, il «+» e l'anteprima entrano ed escono; home e liste entrano a onda.

*Secondo giro*, dopo che l'utente ha guardato l'app sull'iPhone: **D-54** (il calendario si muove — testata, titolo direzionale, striscia — e nella vista agenda si scorre di **un giorno** per trascinamento), **D-55** (la prop `fondo` sotto il vetro, che chiude il «sembra in ombra» dei fogli), **D-56** (via la pillola del posto e la sezione «Parole» dalla pagina evento; il tag si cambia dall'ingranaggio) e **B-15** (il riquadro della barra che spariva).

*Terzo giro*: **D-57** — la vista «Eventi» si chiama **«Diario»** (rinominata anche nel tipo `Vista`) e i **commenti tornano** sugli eventi. Nessuna migrazione: la tabella `commento` era stata lasciata intatta apposta, e questa richiesta è il motivo per cui è stato giusto.

🔴 **Da guardare sull'iPhone, in questo ordine.** Nessuna di queste cose è stata vista muoversi: nella preview il pannello del browser non componeva fotogrammi, quindi `requestAnimationFrame` era fermo e Reanimated sul web non poteva girare.

   a. **I due difetti riferiti dall'utente, per primi** — sono gli unici punti in cui si sa che qualcosa era rotto: il pannello «aggiungi luoghi» e la tendina di ricerca dentro «aggiungi evento» **non devono più sembrare in ombra**; e aprendo/richiudendo quel pannello **il riquadro della barra deve restare**. Se sparisse ancora, vedi B-15: la causa non è isolata, ma il piano di riserva dovrebbe lasciare una pillola chiara invece del nulla — quindi il sintomo cambierebbe forma, e *come* cambia è l'informazione che serve.
   b. **Il calendario**: la pillola del selettore scivola e si ferma allineata; il titolo entra dal lato giusto cambiando mese; nella vista **Giorni** il trascinamento orizzontale sposta di **un giorno** e la striscia lo segue scorrendo.
   c. **La pagina evento**: fra i «Dettagli» non c'è più la pillola del posto; in fondo c'è la sezione **«Commenti»**, che deve accettare la scrittura **da tutti e due** (provarla con entrambi gli account: è la cosa nuova, ed è l'unica che tocca il database in scrittura da una policy diversa dalle solite); l'ingranaggio ha **«Cambia tag»** con i tre tag colorati. Provare anche il passaggio **a vacanza** su un evento che non ha una fine: deve diventare a giornate intere senza rompersi.
   c-bis. **Il calendario, quarta voce**: si chiama **Diario** e il suo titolo è «Il vostro diario».
   d. **Il cedimento dei bottoni** ovunque, e la vibrazione **una volta sola** sull'azione — mai scorrendo un elenco.
   e. **La cascata della home**: i cinque riquadri arrivano a onda e restano **larghi metà schermo** (il 50% è passato dal `Pressable` al contenitore animato: è il punto che più facilmente si rompe).

⚠️ **Se qualcosa comparisse vuoto o invisibile**, il primo sospetto è `components/ui/comparsa.tsx` — è l'unico pezzo nuovo che parte da opacità zero. Ha una rete che lo forza a 1 dopo 1,2s (D-53, regola 5), quindi il sintomo sarebbe «compare in ritardo e di colpo», non «non compare mai». Il secondo sospetto è B-14, che ha la stessa forma e non è mai stato spiegato.

1. 🔴 **Guardare il design nuovo sull'iPhone.** È il primo punto perché è l'unico che può invalidare i cinque successivi: cinque schermate rifatte sono state scritte e non ancora viste. Da controllare in quest'ordine — la **lente della barra** (su iOS 26 dovrebbe fondersi con la pillola; altrove è la lastra chiara), la **capienza delle celle del mese** (`GrigliaMese` misura da sé, ma il calcolo non è mai girato su uno schermo vero), l'**agenda a fasce orarie** con due impegni sovrapposti, il **foglio della pagina evento** sopra l'immagine, i **pin** e l'anteprima in sovraimpressione. La domanda su cui l'utente deve pronunciarsi: **le sei icone senza etichetta si capiscono?** (D-40 dice come rimetterle).
1. ✅ **Chiave `EXPO_PUBLIC_GOOGLE_PLACES_KEY` inserita** nel `.env` il 2026-08-27 (terza sessione) e verificata dentro il bundle iOS: la ricerca luoghi/ristoranti di D-37 ora ha di che cercare. ⚠️ **Resta da fare la metà che protegge**: il tetto di quota e l'avviso di budget su Google Cloud, più il proxy dietro una Edge Function prima di utenti veri — vedi il backlog §6, "La chiave di Google Places". La chiave è nel bundle: era un rischio annunciato, ora è un rischio attivo.
2. **Rigenerare i tipi**: `lib/database.types.ts` ha ancora blocchi scritti a mano (0011, 0012, 0013).
3. **Estendere i test avversariali** al caso di B-05 (raggiungibilità dei riferimenti dopo la rottura), oggi dichiarato e non coperto. ✅ La suite gira e passa: **60 asserzioni verdi** il 2026-08-27, `0014` compresa.
4. **Decidere la forma del link d'invito** fra le tre strade qui sopra. Se (b) o (c), serve la route `app/invito/[token].tsx`.
5. **Schermata di scioglimento e cancellazione account** (Apple): la funzione database c'è (`0004`→`0012`), il bottone no.
6. Le funzioni nell'ordine di D-11 (invio sigillato, giochi, creatura).

⚠️ **Il progetto Supabase gratuito va in pausa se resta fermo**, e mentre è in pausa **il suo DNS sparisce** — l'app non dice «backend in pausa», dice «network request failed», che è indistinguibile da un guasto di rete. Successo il 2026-08-27 dopo quattordici giorni di inattività; ripristinato dal dashboard senza perdere niente. È **R-02 che si materializza** nella sua forma più mite: il costo è stato basso solo perché lo schema vive in 14 migrazioni nel repo e non nei clic di qualcuno.

⚠️ **Prima di utenti veri** (invariato): riaccendere "Confirm email", strategia d'accesso definitiva, eliminare gli utenti di test, confermare la regione UE.
Gli utenti di prova da eliminare dal dashboard sono ora: `rls-*@example.com`, più `diagnosi-invito@`, `solo-test@`, `duo-x@`, `duo-y@` (`@example.com`), creati il 2026-08-12 per la diagnosi del link e la verifica di D-25, e `diagnosi-solo-2@` … `diagnosi-solo-5@` e `prova-coppia-1@` / `prova-coppia-2@` (`@example.com`), creati il 2026-08-13 per riprodurre B-03 e provare D-26 e D-29. Diversi di questi hanno anche una **coppia** che resta nel database — `prova-coppia-*` ne ha una completa, con data di inizio e relativo evento.

⚠️ **Prima di utenti veri**: riaccendere "Confirm email" nel dashboard (spenta per i test), e scegliere la strategia d'accesso definitiva — probabilmente magic link o OAuth, non password. Gli utenti `rls-*@example.com` di prova si eliminano dal dashboard.

**Le decisioni già prese da non rimettere in discussione senza motivo**, perché vincolano lo schema e cambiarle dopo significa migrare dati già scritti: **D-04** (lo scioglimento revoca l'accesso, non cancella; `autore_id` su ogni contenuto), **D-05** (nessuna posizione in tempo reale), **D-09** (stato separato dal disegno), **D-11** (la creatura si progetta subito anche se si implementa per ultima).

**Il filo che lega quasi tutti gli errori evitati finora**, e che vale la pena rileggere prima di ogni nuova funzione: *questo campo si può aggiungere dopo, o dopo sarebbe una migrazione di dati contesi?*
