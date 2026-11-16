# Le regole del progetto — LifeCouple

> **Generato** da `Code/genera-regole-progetto.mjs`, dal profilo (`docs/profilo.md`) e dal rulebook dello sviluppo del brain (`Rule/`). **Non si modifica a mano**: si cambia il profilo, o il rulebook, e si rigenera con `node Code/genera-regole-progetto.mjs Projects/LifeCouple`.
>
> Tre parti: **il flusso di lavoro**, da seguire; **le regole** che valgono per questo progetto, per momento; **gli ambienti**. Il rulebook completo resta la guida ideale: ogni regola ha l'ID che vi rimanda, e i rimandi puntano a `Rule/` del brain che contiene il progetto (aperto il progetto da solo, una regola si cerca per ID).

## Il profilo

| Asse | Valore |
|---|---|
| Dati | alto |
| Sicurezza | alto |
| Dove gira | il profilo C della manutenzione |
| Per chi | personale |
| Rigore | prodotto |

**Le cose che ha**: `backend`, `database`, `cloud`, `iac`, `asset-sensibile`, `dati-personali`, `dati-veri`, `usato-da-altri`. **Gli ambienti che usa**: produzione. **Il numero del cliente**: —.

## 1. Il flusso di lavoro

### Il ciclo di ogni funzione e di ogni correzione

Lo stesso a ogni rigore, qui alla profondità del rigore **prodotto** (la tabella del ciclo, §4 del framework). Una funzione grossa fa ogni passo per esteso, una piccola in poche righe, senza saltarne uno. Fra parentesi, le regole del passo, che sono nella parte 2.

1. **Discussione.** Si capisce che cosa serve e per chi, con chi lo chiede, leggendo il codice e i documenti che la funzione tocca. *(CF13)*
2. **Decisione.** Ciò che spetta all'utente si chiede all'utente; il resto lo decide chi sviluppa, e ogni decisione si scrive col perché e, quando contano, con le alternative scartate. *(P6, P9)*
3. **Documentazione, prima del codice.** Il dato nuovo entra nella classificazione; il confine di fiducia nuovo ha le sue righe nel threat model, prima del codice; il componente sensibile ha il suo threat model prima del codice; il design nasce con le mitigazioni, nell'`Architecture.md`. *(CF1, CF2, P1, CF3)*
4. **Criteri di accettazione.** L'analisi funzionale: che cosa deve fare e per chi, i criteri ognuno verificabile, i casi limite e i percorsi di fallimento. In una correzione, il primo criterio è il test che riproduce il difetto. *(CF0, CF12)*
5. **Sviluppo.** Il codice con le regole di scrittura; chi legge non scrive e chi scrive non legge ciò che altri producono; i segreti fuori dal codice e dai log; un flag di disattivazione per ogni funzione ad alto rischio. *(CF4, CF15, SG1)*
6. **Test.** I test automatici sulla logica, e un test per ogni difetto, che fallisce per il motivo che dichiara. **Al rigore prodotto**: in più migrazioni, database di prova, test delle rotte, matrice dei permessi, dove c'è la cosa (R2–R4). La CI giudica, a ogni push (R1). *(CF5, CF12, R1, R2, R3, R4)*
7. **Review.** Un passaggio separato, con occhi freschi, sulla correttezza, la sicurezza, la qualità e la coerenza coi documenti. **Al rigore prodotto**: su ogni funzione (CF10). *(CF10)*
8. **Correzione.** Ogni rilievo si corregge o si accetta per iscritto; una decisione nuova torna al passo della decisione. Un difetto serio porta la domanda della P10: le regole l'avrebbero evitato? *(CF10, P10)*
9. **Verifica dei criteri.** I criteri uno per uno, coi test e con una prova reale contro l'ambiente, coi percorsi di fallimento; un criterio non provato si dichiara; su un cloud, i permessi verificati sui ruoli reali; con l'infrastruttura come codice, il plan letto prima di ogni apply. **Qui**: la prova reale si fa contro l'ambiente online. *(CF9, CF8, P4, TV2, CF6, CF7)*
10. **Documentazione.** Il threat model, l'`Architecture.md` se cambia una scelta, il `History.md` col PUNTO DI RIPRESA; le promesse che nominano la voce chiusa; il resoconto a chi ha chiesto la funzione. *(CF11, CF14, DC7)*
11. **Ok.** Chi ha chiesto la funzione dice ok. Il rilascio è un passo a sé (§11). **Qui**: decide Samuele (FL19). *(P9)*

### Il ritmo

- **Che cos'è**: Qualcuno ci lavora davvero, e un errore gli costa tempo o soldi
- **Giri di stabilizzazione**: Dopo ogni funzione grossa (S2–S4)
- **Review periodica**: Ogni 8 sessioni (S7)
- **Prima installazione**: La review completa (S5, S6)
- **Il conteggio**: `node Code/review-periodica.mjs`, una review ogni 8 sessioni sul progetto.
- *(S0, S1, S2, S3, S4, S5, S6, S7)*

### Il percorso di una versione

1. **Sul dispositivo** si scrive il codice, e si guarda l'app mentre la si scrive; i test no (FL4).
2. **Nella CI, a ogni push**: lint, tipi e test, e il controllo dei segreti e dei dati; se falliscono, il rilascio si ferma (R1, FL6, SG6).
3. **Il pacchetto** lo costruisce la pipeline dal tag, e si installa per impronta (D2, D3).
4. **In produzione**: ogni rilascio con un backup subito prima, le migrazioni, la verifica dopo (FL16).
5. **Il comando del rilascio**: le build con EAS e la pubblicazione negli store, le migrazioni e le Edge Function su Supabase (docs/pubblicazione.md); la landing, che serve anche `apple-app-site-association`, con `terraform apply` e `s3 sync` (docs/deploy-landing.md).

## 2. Le regole

Ogni regola con la sua verifica. Prima il pavimento e le condizionate, che non si negoziano; poi le altre, per momento. Le regole degli ambienti sono nella parte 3.

### Il pavimento

Vale per ogni progetto; una sua regola si toglie solo con una deroga scritta di Samuele (PF2).

- **F1** La conferma esplicita prima di ogni azione irreversibile
  - **P9** · La conferma prima di ciò che non si annulla — *verifica*: nel diario della sessione o nel `History.md`, la conferma dell'utente precede l'azione.
- **F2** Nessun buco silenzioso: ciò che non si fa o non si verifica si scrive, e una regola tolta resta dichiarata
  - **P7** · Nessun buco silenzioso — *verifica*: ogni copertura parziale ha la sua riga scritta: nel risultato (uno stato come «non verificabile automaticamente»), nel `History.md` o nel threat model.
  - **R8** · Una rete che non si applica si dichiara — *verifica*: ogni rete della §10bis c'è nel progetto, o è dichiarata nell'`Architecture.md`.
- **F3** Ogni decisione col perché, e le alternative scartate quando contano
  - **P6** · Ogni decisione col perché — *verifica*: ogni decisione nel `History.md` ha la motivazione e le alternative; ogni rischio accettato ha la sua voce (DC3).
- **F4** Tutta la documentazione, in ogni progetto: i tre documenti, la classificazione dei dati, il piano di disaster recovery, il `MANUAL_SETUP.md`, il piano di manutenzione in ogni software, i documenti legali se ci sono dati personali. Il profilo decide quanto è profondo un documento, non se esiste
  - **DC1** · Tutta la documentazione, viva dal primo giorno — *verifica*: il piano di manutenzione c'è nel repository del progetto, in ogni caso; i tre file e i documenti della DC6 ci sono, salvo ciò che la §1.0 toglie ai progetti che nomina; il `History.md` ha una voce per l'ultima sessione sul progetto.
  - **DC6** · Gli altri documenti del pavimento — *verifica*: i documenti ci sono, o dicono in una riga perché una parte non si applica; la review completa (S6) e la periodica (S7) li cercano.
  - **DC7** · I documenti si aggiornano a ogni sessione — *verifica*: ogni sessione sul progetto tocca il `History.md`; una funzione che cambia la struttura o un confine tocca anche gli altri due (S1).
  - **MN15** · Il piano di manutenzione, in ogni software — *verifica*: `docs/manutenzione.md` c'è, con le sezioni che il profilo chiede (nei profili B e C, le otto), alla data della prima installazione.
- **F5** La verifica contro la realtà
  - **P4** · La verifica contro la realtà — *verifica*: ogni correzione di sicurezza, nel `History.md`, dice come è stata verificata, con il comando o la prova reale.
- **F6** Per ogni funzione, i criteri di accettazione prima e la verifica dopo, uno per uno
  - **CF0** · L'analisi funzionale, scritta prima del codice — *verifica*: nel `History.md`, l'analisi coi criteri precede il commit della funzione.
  - **CF9** · I criteri verificati uno per uno — *verifica*: nel `History.md`, ogni criterio ha il suo esito.
- **F7** Un test per ogni difetto, che fallisce per il motivo che dichiara
  - **CF12** · Una correzione parte dal test che riproduce il difetto — *verifica*: nel `History.md` della correzione, l'esito del test con la sola riga protetta tolta.
  - **SC11** · Un test per ogni difetto, che fallisce per il motivo che dichiara — *verifica*: la prova scritta nel `History.md`, o lo script delle mutazioni.
- **F8** Ogni progetto insegna qualcosa al rulebook
  - **P10** · Ogni progetto insegna qualcosa al framework — *verifica*: ogni difetto alto o critico nel `History.md` dice l'esito della domanda; quando una lezione passa alle regole, il `History.md` del progetto dice dove, e il registro nomina le regole in cui è entrata.
- **F9** Niente errori silenziosi né valori di ripiego
  - **R5** · Nessun errore silenzioso — *verifica*: per ogni ingresso sbagliato, un test che pretende l'errore.
  - **SC1** · Niente errori silenziosi, niente valori di ripiego — *verifica*: quella della R5: per ogni ingresso sbagliato, un test che pretende l'errore.
- **F10** Le abitudini di scrittura: una fonte per ogni valore, il commento col perché, si legge lo stato, i messaggi senza segreti, il codice morto si toglie, i limiti si dichiarano
  - **SC2** · Una regola, una fonte — *verifica*: una ricerca del valore trova una sola definizione; per le copie, un controllo che le confronta (come `genera-agenti.mjs --check`).
  - **SC3** · Il codice dice cosa, il commento dice perché — *verifica*: nella review, per ogni riga che un lettore nuovo non capirebbe, c'è il perché.
  - **SC4** · Si legge lo stato, non lo si suppone — *verifica*: un test, o una prova contro il sistema vero, per ogni formato letto.
  - **SC6** · I messaggi dicono cosa è successo e cosa fare, senza segreti né dettagli interni — *verifica*: un errore provocato apposta: al client il messaggio generico, nel log il dettaglio senza segreti.
  - **SC8** · Il codice morto si toglie — *verifica*: il lint, e nella review la domanda: chi chiama questo?
  - **SC9** · Ogni limite che salta un controllo si dichiara — *verifica*: un test con un ingresso appena oltre ogni limite.
- **F11** Una dipendenza nuova si sceglie
  - **PL9** · Una dipendenza nuova si sceglie, non si aggiunge — *verifica*: ogni dipendenza nuova del manifesto (per Node, `package.json`) ha la sua riga nel `History.md`; l'installazione della CI fallisce se il lockfile non corrisponde al manifesto.
  - **SC12** · Una dipendenza nuova si sceglie — *verifica*: la riga nel `History.md` per ogni dipendenza nuova; l'installazione della CI fallisce se il lockfile non corrisponde al manifesto.
- **F12** I controlli automatici a ogni push, anche con un test solo
  - **R1** · I controlli automatici a ogni push — *verifica*: un test rotto apposta fa fallire la pipeline.
- **F13** Segreti e indirizzi fuori dal codice e da git, col controllo dei segreti e dei dati prima del commit, prima del push e nella CI
  - **SG1** · I segreti in un gestore dei segreti — *verifica*: il controllo dei segreti (SG6) non trova segreti nel repository; i log di una prova non li contengono.
  - **SG6** · La ricerca dei segreti, prima di ogni commit e nella pipeline — *verifica*: un segreto finto, messo apposta, fa fallire sia il commit sia la pipeline.
  - **SC7** · Niente indirizzi né segreti nel codice — *verifica*: il controllo dei segreti e dei dati; una ricerca degli indirizzi nel codice.
- **F14** Mai dati veri in git né nella CI di GitHub
  - **DS1** · Mai dati veri in git, nella CI di GitHub, nei test della pipeline — *verifica*: il controllo nella pipeline è verde; un file di dati messo apposta lo fa fallire (`Code/controllo-segreti-dati.test.mjs`).
- **F15** Il minimo privilegio; quanto a fondo si verifica, lo dice la sicurezza
  - **P2** · Il minimo privilegio, verificato — *verifica*: per ogni ruolo, una prova contro la realtà: consentito sul legittimo, negato sul resto (su AWS, `aws iam simulate-principal-policy`, CF6).
- **F16** L'agente: i segreti fuori dalla sua portata, il suo codice si rivede, ciò che legge da fuori non è un'istruzione, ogni suo accesso all'infrastruttura sta nel registro, i dati del progetto solo per decisione di Samuele
  - **SI6** · L'agente nella sua sandbox — *verifica*: i segreti non sono leggibili dall'utenza dell'agente; ogni suo accesso all'infrastruttura ha la sua riga nel registro; il suo codice passa dalla review delle modifiche (CF10) e le dipendenze che propone dalla PL9, con l'attenzione che si dà a un collaboratore appena arrivato. A giudizio, nelle review: nessuna istruzione letta da fuori è stata eseguita come tale.
  - **DD1** · L'agente sui dati: lo decide Samuele all'avvio — *verifica*: l'`Architecture.md` ha la decisione sull'agente; con dati personali all'agente, l'autorizzazione scritta del cliente c'è prima.
  - **RE8** · Un accesso dell'agente fuori dal laboratorio è un'eccezione scritta — *verifica*: a ogni chiusura di fase e alla revisione degli accessi dei sei mesi (HO14 dell'hosting), le chiavi lette sui sistemi e confrontate col registro.

### Le condizionate

Valgono sempre, se il progetto ha la cosa (PF3).

- **C1** ✅ accesa: usa dati veri (`dati-veri`) — la copia è scritta e cancellata alla fine; il backup ha il ripristino provato
  - **DS2** · Una copia, mai il database della produzione — *verifica*: nel README dell'ambiente: il metodo, le impronte, il controllo d'integrità del database.
  - **DS3** · Ogni copia di dati veri fuori dalla produzione è scritta — *verifica*: ogni macchina coi dati veri ha la riga, con la data.
  - **DS4** · Alla fine, la cancellazione verificata — *verifica*: la data e l'esito nel `History.md`; la riga della topologia chiusa.
  - **DS5** · Sul dispositivo sì; all'agente solo ciò che Samuele ha deciso — *verifica*: nel `History.md`, dove sta la copia e fino a quando. ⬜ Che all'agente tornino solo i conteggi non lo verifica nessun controllo: vale la regola.
  - **DD22** · Il cancello — *verifica*: nella topologia, una macchina con «dati veri: sì» su cui il cliente lavora ha la data dell'ultimo backup riuscito. Le copie del laboratorio (MP1) non hanno backup per regola, e il cliente non ci lavora. Le altre condizioni del cancello, cioè le condizioni firmate, la chiave dell'agente e `sa`, si controllano a mano. ⬜ `Code/infrastruttura-check.mjs` non legge ancora la data dell'ultimo backup: quando la leggerà, una riga senza quella data sarà rossa.
  - **DD23** · Fino al cancello, la copia è di consultazione — *verifica*: a giudizio: il `History.md` dice quando la copia passa da consultazione a lavoro, cioè quando passa il cancello.
  - **DD24** · Un'eccezione al cancello la decide solo Samuele, con una data massima — *verifica*: ogni eccezione ha la sua data massima nel `History.md` e nella topologia; alla data, o le condizioni ci sono, o l'ambiente è chiuso al cliente.
  - **RS5** · Un piano vale solo se provato — *verifica*: il resoconto del ripristino provato, con la durata, nel `History.md`.
- **C2** ✅ accesa: tratta dati personali di altri (`dati-personali`) — il GDPR
  - **GD1** · Il doppio ruolo, riconosciuto presto — *verifica*: i documenti ci sono, e il registro nomina ogni sub-fornitore col suo DPA.
  - **GD3** · Le misure dell'art. 32 — *verifica*: quelle dei controlli della §7 e della RS5.
  - **GD4** · La procedura per le violazioni, pronta prima del bisogno — *verifica*: la procedura c'è (la [procedura per le violazioni dei dati](../../../Rule/procedura-data-breach.md) o quella del progetto), e la detection è attiva.
  - **GD5** · La conservazione dichiarata è quella praticata — *verifica*: per ogni scadenza dell'informativa, la configurazione che la impone.
  - **GD6** · La cancellazione dell'account è una catena verificata — *verifica*: la prova end-to-end, dopo una cancellazione, non trova niente dell'account in nessun archivio.
- **C3** ✅ accesa: è un'applicazione web con un database (`backend` e `database`) — le cinque basi
  - **WB0** · Le basi valgono per ogni applicazione web con un database — *verifica*: il threat model ha una riga per ognuna delle cinque basi, col suo stato.
  - **WB1** · Ogni query con i parametri — *verifica*: una ricerca nel codice delle query costruite unendo stringhe trova solo costanti e nomi validati; un test con `'` e `;--` nei campi di testo non cambia la query.
  - **WB2** · Ciò che scrive l'utente si mostra come testo, mai come codice — *verifica*: un test con `<script>` e `<b>` in ogni campo che finisce in una pagina o in una stampa: esce come testo.
  - **WB3** · La sessione non si lascia rubare, né usare da un altro sito — *verifica*: le intestazioni del cookie lette nella risposta del login; una richiesta che cambia i dati, mandata da un'altra origine, è rifiutata.
  - **WB4** · Gli errori non raccontano l'interno — *verifica*: un errore del database provocato apposta risponde col messaggio generico, e il log ha il dettaglio.
  - **WB5** · Ogni ingresso lo controlla il server, e ha un limite — *verifica*: una richiesta oltre il limite si rifiuta prima di essere elaborata; un parametro non ammesso è un errore.
- **C4** ✅ accesa: tocca un asset sensibile (`asset-sensibile`) — il threat model di quel componente prima del codice
  - **P1** · Il threat model prima del codice — *verifica*: nel `History.md`, le righe del threat model del componente sono anteriori al suo primo commit.
- **C5** — spenta: usa un modello AI (`ai`) — non scrive direttamente sui dati — P3
- **C6** ✅ accesa: lo usano altri (`usato-da-altri`) — il rilascio parte da un tag della pipeline, la versione si vede e il ritorno indietro è scritto prima
  - **R7** · Il rilascio è un pacchetto costruito da un tag — *verifica*: la versione dichiarata dall'applicazione è quella del tag; la verifica dopo il rilascio è verde; col passo finto che fallisce, l'installazione resta identica.
  - **D2** · Ogni artefatto lo costruisce la pipeline, dal tag — *verifica*: nelle istruzioni di rilascio non c'è nessun comando di build o di push da eseguire a mano; l'artefatto dichiara il suo commit (per un'immagine, l'etichetta `org.opencontainers.image.revision`).
  - **D3** · Si pubblica e si installa per impronta, mai per nome — *verifica*: una pubblicazione con un'impronta diversa da quella appena costruita si ferma; la configurazione d'esercizio contiene un digest o una versione.
  - **D4** · Il rilascio parte solo dopo i controlli dello stesso commit — *verifica*: un tag su un commit rosso si ferma prima della build.
  - **D6** · Un rilascio manuale è un'approvazione, non una sequenza di comandi — *verifica*: il registro della pipeline mostra chi ha approvato ogni rilascio. Finché il rilascio parte da un dispositivo (la D5 con l'eccezione; la decisione 13 del piano della rete, [flusso di sviluppo](../../../Rule/flusso-di-sviluppo.md) §3.2), la decisione di Samuele è scritta nel `History.md`, con la versione e l'impronta, prima dell'installazione.
- **C7** — spenta: sostituisce un sistema esistente (`sostituisce`) — il vecchio fa da oracolo — R9

### All'avvio, e quando il progetto cambia

- **RB1** · Fra due documenti vale la regola più restrittiva — *verifica*: una differenza trovata compare nel diario della sessione, segnalata, finché non è corretta in uno dei due documenti.
- **DC2** · Una deroga vale solo per ciò che dice — *verifica*: i progetti senza i tre documenti sono tutti e soli quelli nominati in §1.0.
- **DC3** · Il `History.md` — *verifica*: ogni sessione sul progetto ha una voce datata; il PUNTO DI RIPRESA è l'ultima sezione; ogni difetto corretto dice come è stato verificato.
- **DC4** · L'`Architecture.md` — *verifica*: ogni voce dell'elenco c'è; le eccezioni di costo e i debiti tecnici, se non ce ne sono, lo dicono; ogni decisione strutturale ha almeno un'alternativa scartata, col suo costo.
- **DC5** · Il `threat-model.md` — *verifica*: ogni confine di fiducia dell'`Architecture.md` ha la sua tabella; ogni mitigazione esistente dice come è stata verificata.
- **PR2** · Prima il threat model — *verifica*: a giudizio, nelle review: ogni controllo scelto risponde a una riga del threat model.
- **PR3** · Prima del codice, lo scopo — *verifica*: la sezione «scopo» c'è nel `History.md` o nell'`Architecture.md`, scritta prima del primo commit di codice.
- **TM1** · Il metodo — *verifica*: ogni confine dell'`Architecture.md` ha le sue righe, e ogni riga ha una decisione e uno stato.
- **CL1** · Ogni dato ha la sua sensibilità — *verifica*: ogni dato dei flussi dell'`Architecture.md` ha la sua riga; la conseguenza di ogni minaccia cita la sensibilità.
- **FL2** · L'avvio, prima di ogni riga di codice — *verifica*: il profilo ha i due livelli, e l'`Architecture.md` lo scopo, la decisione sull'agente e dove sta la prova, con date anteriori al primo commit di codice.
- **FL3** · Il controllo dei segreti e dei dati, dall'avvio — *verifica*: quella della SG6 e della DS1: un segreto finto fa fallire il commit e la pipeline.
- **FL19** · Chi fa che cosa — *verifica*: a giudizio: nel `History.md`, ogni decisione della tabella è presa da chi la tabella dice.
- **FL20** · Finché non c'è un sostituto, le decisioni di Samuele aspettano lui — *verifica*: nessuna di quelle decisioni, nel `History.md`, è presa da altri.
- **DD2** · Il livello lo sceglie Samuele, e il cliente conferma la classificazione — *verifica*: il profilo ha il livello, con la data, chi l'ha scelto e il perché; l'`Architecture.md` rimanda al profilo e non scrive un livello suo; la classificazione dice chi l'ha confermata per il cliente.
- **DD3** · I livelli sono linee guida — *verifica*: ogni regola tolta ha la sua riga nel profilo, col perché, e la sua decisione nell'`Architecture.md`; le review non la ripropongono.
- **DD4** · Un livello per tutti i dati del progetto — *verifica*: ogni parte separata ha il suo livello scritto nel profilo; ogni cambio di livello ha la sua voce nel `History.md`.
- **SI1** · Il livello lo sceglie Samuele, in progettazione — *verifica*: il profilo ha il livello, con la data, chi l'ha scelto e il perché; l'`Architecture.md` rimanda al profilo e non scrive un livello suo.
- **SI2** · I livelli sono linee guida — *verifica*: ogni direttiva tolta ha la sua riga nel profilo, col perché, e la sua decisione nell'`Architecture.md`; le review non la ripropongono.

### A ogni funzione

- **P5** · La difesa in profondità — *verifica*: a giudizio, nel threat model e nelle review (CF10, S6).
- **CF1** · Si classifica l'asset — *verifica*: ogni dato nuovo della funzione compare nella classificazione.
- **CF2** · Il threat model del confine nuovo — *verifica*: le righe nuove del threat model vengono prima del codice della funzione: in un commit precedente, o nell'analisi del `History.md` che precede il codice.
- **CF3** · Il design con le mitigazioni già dentro — *verifica*: l'`Architecture.md` ha il design, le alternative e i punti del codice.
- **CF4** · I permessi asimmetrici — *verifica*: con la verifica dei permessi (P2, CF6), il componente che legge si vede negare la scrittura.
- **CF5** · I test automatici — *verifica*: i test nuovi girano nella pipeline (R1), verdi.
- **CF6** · La verifica dei permessi su AWS — *verifica*: l'esito della simulazione, nel `History.md`.
- **CF7** · La verifica dell'infrastruttura — *verifica*: a giudizio: il `History.md` della modifica cita il plan letto.
- **CF8** · Il rilascio mirato e la prova end-to-end — *verifica*: il resoconto della prova, coi percorsi di fallimento, nel `History.md`.
- **CF10** · La review da occhi freschi — *verifica*: i rilievi della review nel `History.md`, ciascuno corretto o accettato.
- **CF11** · Si documenta e si riferisce — *verifica*: i tre documenti toccati nello stesso giro della funzione (S1).
- **CF13** · Per che cosa vale il ciclo, e con quale profondità — *verifica*: a giudizio, nelle review: nel `History.md` ogni funzione ha ogni passo, anche in una riga.
- **CF14** · Chiudendo una voce, si cercano le promesse che la nominano — *verifica*: alla chiusura della voce, `grep -rn "<voce>" docs/` (e il documento derivato, se vive fuori dal repository), con l'esito scritto nel `History.md`.
- **CF15** · Il kill-switch — *verifica*: col flag spento la funzione non parte; riaccesa, riprende senza dati persi.
- **CT1** · Un ruolo per componente, coi permessi minimi — *verifica*: la simulazione dei permessi di ogni ruolo (CF6).
- **CT2** · Il controllo di proprietà su ogni rotta — *verifica*: la matrice ruoli × rotte (R4).
- **CT3** · Una rotta non si aggiunge senza protezione — *verifica*: una rotta nuova senza protezione fa fallire la matrice (R4); un token con un'altra audience è rifiutato.
- **CT4** · MFA e step-up — *verifica*: un amministratore senza MFA non entra; un'azione ad alto impatto senza il secondo fattore fresco è rifiutata dal server.
- **CT5** · Il limite alle richieste, a due livelli — *verifica*: oltre il tetto, la richiesta è rifiutata; un test con richieste concorrenti non lo supera.
- **CT6** · La cifratura dello storage — *verifica*: la configurazione dello storage ha le tre protezioni (la scansione dell'IaC, PL1, le controlla); la scelta della chiave è nell'`Architecture.md`.
- **CT7** · Il registro di audit non si altera — *verifica*: con l'utenza dell'applicazione, la modifica o la cancellazione di una riga del registro è rifiutata.
- **CT8** · La rete del cloud — *verifica*: gli endpoint privati nella configurazione; l'uscita aperta, se c'è, è scritta nell'`Architecture.md` come rischio accettato.
- **CT10** · Le eccezioni di costo e di scala si scrivono — *verifica*: ogni controllo della §7 assente ha la sua motivazione scritta.
- **SG2** · Le credenziali di terzi, l'asset più sensibile — *verifica*: con la verifica dei permessi (CF6), solo il componente giusto legge il prefisso; l'ingresso dell'orchestrazione e i log di una prova non contengono il valore.
- **SG3** · I permessi asimmetrici sui segreti — *verifica*: con la verifica dei permessi (P2; su AWS, CF6).
- **SG4** · I segreti fuori dall'IaC si scrivono — *verifica*: ogni segreto letto dal codice sta nell'IaC o nel `MANUAL_SETUP.md`.
- **SG5** · Rotazione e confronto a tempo costante — *verifica*: nel codice, i confronti dei token usano la funzione a tempo costante (per Node, `crypto.timingSafeEqual`).
- **TV1** · Due livelli di verifica, tutti e due obbligatori — *verifica*: i test girano nella pipeline (R1); i resoconti delle verifiche contro la realtà stanno nel `History.md`.
- **TV2** · Che cosa si verifica contro la realtà — *verifica*: il resoconto di ciascuna, nel `History.md` della funzione o del rilascio.
- **R0** · La rete c'è dal primo commit — *verifica*: nella storia del repository, le reti che si applicano ci sono prima del commit della prima funzione che scrive dati.
- **R2** · Lo schema cambia solo con le migrazioni — *verifica*: lo schema ricreato da zero è identico a quello vero; una migrazione già applicata e poi modificata viene rifiutata.
- **R3** · Un database di prova usa e getta — *verifica*: un test che scrive si rifiuta di partire su un database non marcato come di prova.
- **R4** · La matrice ruoli × rotte — *verifica*: una rotta resa accessibile apposta fa fallire la matrice.
- **R6** · I riferimenti non restano orfani — *verifica*: la cancellazione di un oggetto in uso è rifiutata con l'elenco; una riga orfana scritta direttamente è rifiutata dal database.
- **S0** · Funzioni e stabilizzazione si alternano, dall'inizio — *verifica*: nel `History.md`, un giro dopo ogni funzione grossa (S2), o la dichiarazione del prototipo.
- **S1** · Una funzione è finita solo con la sua rete — *verifica*: la pipeline è verde, e la funzione compare nei tre documenti della §1.
- **S2** · Dopo ogni funzione grossa, un giro di stabilizzazione — *verifica*: nel `History.md`, per ogni giro, la lista, le date e i criteri spuntati; nella storia del repository del periodo, solo correzioni.
- **S3** · Nel giro va per ultimo ciò che una funzione può disfare — *verifica*: a giudizio: nella lista del giro (S2), quelle voci stanno in fondo.
- **S4** · Il giro si chiude con una versione installabile — *verifica*: il tag, e il resoconto della prova nel `History.md`.
- **S5** · Il passaggio in produzione ha criteri scritti prima — *verifica*: i criteri scritti, e il registro dell'affiancamento.
- **S6** · Prima della prima installazione ufficiale, una review completa — *verifica*: il rapporto `docs/review-AAAA-MM-GG.md` nel repository, e nessun rilievo critico o alto aperto alla data del passaggio.
- **S7** · La review periodica, con la cadenza del rigore — *verifica*: `node Code/review-periodica.mjs` conta le sessioni dai diari, con la cadenza del profilo del progetto; il rapporto è `docs/review-periodica-AAAA-MM-GG.md`; nel diario, `review:` fatta o saltata.
- **FL4** · Sul dispositivo si scrive, nel laboratorio si prova — *verifica*: sul dispositivo `docker ps` non mostra container dei progetti; nel `History.md` l'esito di ogni test dice dove è girato, e il posto è la `dev`.
- **FL6** · La CI giudica, senza dati veri — *verifica*: un test rotto apposta e un segreto finto fanno fallire la pipeline prima della build.
- **DD6** · L'assenza batte il controllo — *verifica*: a giudizio, nel threat model e nelle review: per ogni dato in una zona esposta, la risposta scritta a «deve essere qui?».
- **DD7** · Il raggio d'esplosione, scritto — *verifica*: l'`Architecture.md` ha, per ogni zona esposta, il raggio d'esplosione scritto.
- **DD21** · Al livello alto, le parti della §5 che servono — *verifica*: il profilo aggiunge, per ID, le regole della §5 scelte, e le regole generate del progetto (PF4) le hanno.
- **SI3** · Aperto solo ciò che serve, e dietro un proxy — *verifica*: da fuori rispondono solo le porte del proxy o del servizio gestito; la risposta ha TLS e le intestazioni.
- **SI4** · Le utenze del database coi soli diritti che servono — *verifica*: l'utenza del programma, provata, si vede negare ciò che il codice non usa; nessuna stringa di connessione dei programmi usa `sa`.
- **SI28** · Il limite ai tentativi di accesso — *verifica*: oltre il limite, i tentativi successivi sono rifiutati o rallentati.
- **SI5** · I registri dell'applicazione — *verifica*: un'operazione fatta apposta compare nel registro.
- **SI11** · La CSP bloccante, e chi amministra entra dalla VPN — *verifica*: la CSP c'è nella risposta; da fuori dalla VPN, nessuna porta d'amministrazione risponde.
- **SI15** · Login falliti e azioni amministrative registrati — *verifica*: un login fallito fatto apposta compare nel registro.
- **SI17** · La risposta agli incidenti, nel dettaglio — *verifica*: la sezione c'è nel piano di manutenzione.
- **SI7** · Il threat model riletto a ogni giro — *verifica*: nel `History.md`, ogni giro di stabilizzazione ha la data della rilettura.
- **SI9** · MFA per chi vede dati alti — *verifica*: un utente coi dati di livello alto, senza MFA, non entra.
- **SI10** · La matrice dei privilegi del database, nella pipeline — *verifica*: la matrice gira nella pipeline, e una casella cambiata la fa fallire.
- **SI12** · La frontiera e i dati separati — *verifica*: dalla frontiera il database non si raggiunge; le API senza il certificato giusto rifiutano.
- **SI13** · La scansione dinamica, e un revisore diverso — *verifica*: il rapporto della scansione dinamica per ogni rilascio; il nome del revisore nel rapporto della S6.
- **SI16** · Gli allarmi sugli accessi, a una persona — *verifica*: un accesso anomalo fatto apposta fa arrivare l'allarme alla persona.
- **SI18** · La procedura per gli incidenti, provata una volta — *verifica*: il resoconto dell'esercitazione nel `History.md`.
- **SI20** · L'agente sui dati: di regola in sola lettura — *verifica*: con l'utenza dell'agente, una scrittura fallisce, se Samuele non ha deciso altro.
- **SI22** · Il controllo d'esercizio a calendario — *verifica*: il rapporto del controllo d'esercizio con la data, prodotto dal calendario.
- **SI24** · Al livello alto, le parti della §3 che servono — *verifica*: il profilo aggiunge, per ID, le regole della §3 scelte, e le regole generate del progetto (PF4) le hanno.
- **SC5** · Uno script d'installazione è idempotente — *verifica*: il secondo giro non scrive niente (`--check` di Ansible senza differenze).
- **SC10** · Uguale su Windows e su macOS — *verifica*: il controllo gira sui due sistemi, o nella CI su Linux e sul dispositivo su Windows.

### Al rilascio

- **PL1** · La scansione dell'IaC — *verifica*: la scansione gira sulle modifiche all'IaC; ogni eccezione ha il suo motivo.
- **PL2** · La scansione delle dipendenze — *verifica*: la configurazione (per esempio `.github/dependabot.yml`) ha tutti gli ecosistemi del repository.
- **PL3** · L'analisi statica per ultima — *verifica*: se il SAST non c'è, l'`Architecture.md` o il `History.md` dice perché.
- **PL4** · Le azioni fissate a una versione — *verifica*: nessun `uses:` dei workflow punta a un ramo.
- **PL5** · Le credenziali della pipeline — *verifica*: i workflow assumono un ruolo con OIDC; dove restano chiavi statiche, la loro policy nomina solo le risorse interessate.
- **PL6** · I workflow protetti come il codice — *verifica*: a giudizio: le modifiche ai workflow passano dalla stessa review del codice (CF10).
- **PL7** · Si installa ciò che è stato rivisto — *verifica*: quelle di D2 e D3.
- **PL8** · Le scansioni girano dove serve — *verifica*: i workflow di scansione hanno il filtro sui percorsi.
- **PL10** · Un repository di sistema entra con la sua chiave — *verifica*: a giudizio: il confronto è scritto dove si installa il repository (il `History.md` o il manuale della macchina).
- **D1** · La piattaforma d'esercizio è scritta — *verifica*: la tabella c'è, e ogni job di build della pipeline corrisponde a una sua riga.
- **D5** · Le credenziali di rilascio non stanno sui portatili — *verifica*: la trust policy limita `sub` al repository e ai tag; l'utente di deploy non ha chiavi d'accesso (`aws iam list-access-keys` vuoto); il rilascio da portatile rifiuta un pacchetto con un'impronta diversa da quella registrata dalla pipeline.
- **D7** · Tutto come codice, tranne ciò che non può — *verifica*: ogni risorsa del cloud sta nell'IaC o nell'elenco del `MANUAL_SETUP.md`.
- **D8** · Il rilascio mirato, dopo il plan — *verifica*: a giudizio: il `History.md` della modifica cita il plan letto.
- **D9** · Il deploy automatico solo per i nostri siti statici — *verifica*: i workflow con un deploy automatico sono solo quelli dei nostri siti statici; ogni altro rilascio ha un'approvazione.
- **GD2** · La conformità come cancello del rilascio — *verifica*: alla data dell'apertura, i documenti ci sono, e l'informativa compare nel punto della raccolta.
- **GD7** · Il consenso — *verifica*: il registro del click-wrap ha versione e ora; il consenso al marketing è un campo a sé.
- **GD8** · I cookie — *verifica*: l'elenco dei cookie che il sito imposta davvero, letto dal browser, è tutto tecnico.

### In esercizio

- **RS1** · RTO e RPO prima dei meccanismi — *verifica*: RTO e RPO scritti nel piano di DR, con una data anteriore ai meccanismi scelti.
- **RS2** · L'inventario e gli scenari — *verifica*: il piano ha l'inventario e una riga per scenario.
- **RS3** · Prima le misure a costo quasi zero — *verifica*: sono attive nella configurazione, e il piano le elenca.
- **RS4** · Il piano comprende le risorse manuali — *verifica*: ogni risorsa del `MANUAL_SETUP.md` ha il suo passo nel piano.
- **RS6** · I rischi rimandati si scrivono — *verifica*: ogni scenario senza mitigazione ha la sua voce di rischio accettato nel `History.md`.
- **IR1** · La detection sui segnali d'attacco — *verifica*: un segnale provocato apposta fa scattare l'allarme.
- **IR2** · Un allarme arriva a un canale reale — *verifica*: un allarme di prova arriva alla persona.
- **IR3** · Chi fa cosa, in caso di compromissione — *verifica*: la sezione «chi fa cosa» c'è, nel piano di manutenzione o in un documento del progetto. Finché manca, la regola non è soddisfatta: il buco si dichiara (P7), ma resta aperto.
- **GV1** · Un'autovalutazione leggera contro NIST CSF — *verifica*: il documento dell'autovalutazione, e una voce del backlog per ogni colonna debole.
- **MN9** · Quando comincia l'esercizio — *verifica*: dal primo uso reale, M5 e M7 hanno la loro riga nel `History.md`; il piano c'è alla data dell'installazione.
- **MN10** · Quando finisce l'esercizio — *verifica*: la voce dello spegnimento nel `History.md`, con l'elenco delle risorse chiuse.
- **MN13** · Profilo C: le frequenze strette e il monitoraggio — *verifica*: il calendario del piano ha le frequenze del profilo C; un allarme fatto scattare apposta arriva.
- **MN1** · La manutenzione ha un calendario, non aspetta un guasto — *verifica*: il calendario della §8 c'è nel piano, e il `History.md` ha le sue righe alle date previste.
- **MN2** · Si controlla ciò che gira, non solo ciò che è nel repository — *verifica*: quelle di M3 e M7.
- **MN3** · Ogni componente ha un responsabile scritto — *verifica*: la matrice dei ruoli (MN40) è compilata, senza righe vuote.
- **MN4** · Un segnale che non arriva a una persona non esiste — *verifica*: quella di M8.
- **MN5** · Si mantiene una versione sola, l'ultima rilasciata — *verifica*: il contratto ha il tempo di accettazione; in esercizio gira l'ultima versione rilasciata, o il `History.md` dice perché no.
- **MN6** · Si aggiorna poco e spesso, un cambiamento alla volta — *verifica*: a giudizio: nel `History.md`, ogni rilascio di manutenzione ha un cambiamento importante al più.
- **MN7** · Il controllo è proporzionato al rischio — *verifica*: a giudizio, nella rilettura annuale del piano.
- **MN8** · Nessun buco silenzioso — *verifica*: il piano ha le righe che non si applicano, col motivo.
- **M1** · Le dipendenze controllate nella pipeline, anche quando nessuno lavora — *verifica*: fra le esecuzioni della pipeline ce n'è una a calendario per ogni settimana. Una dipendenza vulnerabile messa apposta su un ramo fa fallire il controllo, e un'eccezione scaduta lo fa tornare rosso.
- **M2** · Gli aggiornamenti proposti da soli, e decisi — *verifica*: il file di configurazione ha tutti gli ecosistemi e i gruppi, e le proposte di sicurezza sono attive. Nessuna proposta resta aperta oltre il controllo del mese successivo senza una decisione scritta.
- **M3** · Si controlla anche la versione installata — *verifica*: il rapporto del controllo d'esercizio (M7) dice quale tag ha controllato, ed è quello che dichiara l'applicazione.
- **M4** · Runtime, sistema e database sotto controllo — *verifica*: il rapporto elenca ogni componente dell'inventario con la versione e la fine del supporto; nessun componente è oltre la fine del supporto.
- **M5** · Ogni scadenza ha una data scritta e un avviso in tempo — *verifica*: un certificato di prova vicino alla scadenza fa scattare l'avviso senza riavviare nulla; il rapporto mostra la data di ogni voce dell'elenco.
- **M6** · Il backup si ripristina, a calendario — *verifica*: data ed esito dell'ultima prova nel log del `History.md`; oltre i sei mesi, il rapporto la segna ⚠️.
- **M7** · Il controllo d'esercizio, un comando solo — *verifica*: il rapporto del mese c'è, con la sua riga nel log; ogni controllo ha il suo test.
- **M8** · Le notifiche arrivano, e sono provate — *verifica*: nel piano (§2), la data dell'ultima prova di ogni canale; un canale non ancora provato è ⚠️.
- **MN17** · Prima la domanda: la raggiunge? Poi i tempi — *verifica*: per ogni vulnerabilità del periodo, il `History.md` ha la risposta alla domanda e la data della correzione, dentro i tempi.
- **MN18** · Quando la correzione non esiste, un rischio accettato con una data — *verifica*: ogni rischio accettato su una vulnerabilità ha la sua data, e alla data c'è la sua riga nel `History.md`.
- **MN19** · La correzione si verifica con la rete di sempre — *verifica*: la pipeline verde sul rilascio correttivo; per i cambi di comportamento, il ciclo della §4 nel `History.md`.
- **MN20** · Le correzioni e le versioni minori delle librerie — *verifica*: il rilascio di manutenzione ha la pipeline verde.
- **MN21** · Le versioni maggiori delle librerie — *verifica*: nel `History.md`, ogni versione maggiore ha il suo ciclo; nessuna libreria in uso è fuori supporto.
- **MN22** · Il runtime — *verifica*: il rapporto di M4 mostra il runtime dentro il supporto; nel `History.md`, il passaggio alla versione a supporto lungo successiva ha la sua data, entro il primo anno di quella versione, e un rilascio suo.
- **MN23** · Il sistema operativo — *verifica*: il rapporto di M4: gli aggiornamenti automatici attivi, nessun riavvio richiesto da troppo tempo, il sistema dentro il supporto.
- **MN24** · Il server del database — *verifica*: il rapporto di M4 mostra il livello d'aggiornamento; ogni aggiornamento ha la prova sulla copia nel `History.md`.
- **MN25** · Le azioni della pipeline — *verifica*: nessun `uses:` dei workflow punta a un ramo.
- **MN26** · Un aggiornamento importante non esce con una funzione nuova — *verifica*: nel `History.md`, nessun rilascio porta insieme un aggiornamento importante e una funzione nuova.
- **MN27** · Durante un giro di stabilizzazione, solo gli aggiornamenti di sicurezza — *verifica*: nella storia del repository del periodo del giro, solo correzioni e aggiornamenti di sicurezza.
- **MN28** · Il rilascio di manutenzione è un rilascio come gli altri — *verifica*: il rilascio di manutenzione ha nel `History.md` le stesse voci di ogni rilascio.
- **MN29** · La tabella delle notifiche, nel piano — *verifica*: la tabella c'è nel piano, coi nomi e con la data della prova di ogni riga.
- **MN30** · Un filtro nella posta — *verifica*: a giudizio: il filtro c'è, e la pipeline rossa arriva fuori dal rumore.
- **MN31** · Le esecuzioni sulle proposte di Dependabot non avvisano — *verifica*: le notifiche della pipeline escludono le esecuzioni di Dependabot; il controllo del mese ne riporta l'esito.
- **MN32** · Che cosa guarda il controllo d'esercizio — *verifica*: il rapporto ha una riga per ogni area.
- **MN33** · In sola lettura, con l'accesso minimo — *verifica*: l'utenza del controllo, provata, non ha diritti di scrittura; il rapporto non contiene segreti.
- **MN34** · Dove gira il controllo — *verifica*: nel profilo B, sul server non c'è niente del controllo.
- **MN35** · Il rapporto in due forme — *verifica*: il controllo produce le due forme; con un ❌ esce con un codice diverso da zero.
- **MN36** · Il rapporto completo non si versiona — *verifica*: nel repository non ci sono rapporti completi; il `History.md` ha la riga.
- **MN37** · I controlli del controllo hanno i loro test — *verifica*: ogni controllo ha un test che, con la risposta finta, lo fa diventare rosso.
- **MN38** · Il calendario — *verifica*: il `History.md` ha le righe del calendario alle loro date.
- **MN39** · Il calendario si segue anche quando tutto sembra a posto — *verifica*: il `History.md` ha le righe del calendario anche nei mesi senza guasti.
- **MN40** · Chi aggiorna e chi controlla, nel piano e nel contratto — *verifica*: la matrice compilata nel piano, e il contratto che la riprende.
- **MN41** · I tempi di risposta si promettono solo se si mantengono — *verifica*: a giudizio: i tempi del contratto sono compatibili col calendario; dopo un rilascio rotto, il `History.md` mostra prima il ritorno indietro.
- **MN42** · L'assistenza ha un costo, e il contratto la copre — *verifica*: il contratto di assistenza c'è, e copre le attività del calendario.
- **MN43** · Ogni controllo lascia una riga, e ogni rilievo diventa qualcosa — *verifica*: ogni ⚠️ o ❌ del rapporto ha la sua voce nel `History.md`.
- **MN44** · Il registro degli interventi sta nel `History.md` — *verifica*: ogni rilascio di manutenzione ha la sua voce nel `History.md`.
- **MN45** · Il rapporto al cliente, ogni tre mesi — *verifica*: il rapporto del trimestre c'è, senza versioni, indirizzi né utenze.
- **MN46** · Il Cyber Resilience Act si valuta a parte — *verifica*: l'`Architecture.md` dice se il progetto rientra nel Cyber Resilience Act, e se sì, dove sta la valutazione.

## 3. Gli ambienti

### La produzione

**Come ci si arriva**:
- **Il rilascio**: le build con EAS e la pubblicazione negli store, le migrazioni e le Edge Function su Supabase (docs/pubblicazione.md); la landing, che serve anche `apple-app-site-association`, con `terraform apply` e `s3 sync` (docs/deploy-landing.md)

**Le regole**:
- **FL1** · Ogni versione nuova ripassa dalla prova — *verifica*: nel `History.md`, ogni versione in produzione è passata prima dalla prova, salvo i nostri siti statici.
- **FL16** · Ogni rilascio in produzione — *verifica*: nel `History.md`, per ogni rilascio, il backup, la versione e l'esito della verifica.
- **FL18** · Lo spegnimento si fa per intero — *verifica*: la voce dello spegnimento nel `History.md`, con l'elenco delle cose chiuse, e la riga della topologia tolta.

### Altre regole che valgono

- **DD15** · Dove sta la prova lo decide Samuele all'avvio — *verifica*: l'`Architecture.md` dice dove sta la prova, chi l'ha deciso e quando.

### Che cosa manca nelle fonti

Il generatore non inventa i fatti che non trova (F2):

- ⬜ la prova: il progetto va in produzione senza un ambiente di prova, e la FL1 chiede che ogni versione nuova ci ripassi

## Le regole che non si applicano

Dichiarate, perché una regola che non si applica non si salta in silenzio (F2). Accanto a ciascuna, il suo «si applica», o il perché del profilo.

- **Il framework** ([`regole-sviluppo-sicuro.md`](../../../Rule/regole-sviluppo-sicuro.md)): RB2, PF1, PF2, PF3, PF4, PR1, AP1, AP2, AP3, AP4 (`rulebook`: vale per chi cambia il rulebook e il brain); P3 (`c'è ai`); P8, CL2, CT9, GD9 (`c'è analisi-di-terzi`); CF16, TV3, S8, S9 (`rigore = critico`); R9 (`c'è sostituisce`)
- **Il flusso di sviluppo** ([`flusso-di-sviluppo.md`](../../../Rule/flusso-di-sviluppo.md)): FL5, FL7 (`usa laboratorio`); FL8, FL9 (`usa prova e c'è ospitato`); FL10, FL11 (`usa prova`); FL12, FL13 (`per = cliente`); FL14 (`dove = B`); FL15 (`usa prova e usa produzione e c'è database`); FL17 (`usa prova e usa produzione`)
- **Le regole per i dati sensibili** ([`regole-dati-sensibili.md`](../../../Rule/regole-dati-sensibili.md)): DD5, DD26 (`rulebook`: vale per chi cambia il rulebook e il brain); DD8, DD11 (`dati ≥ medio e c'è dati-veri e usa laboratorio`); DD9 (`dati = alto e c'è dati-veri e usa laboratorio`); DD10 (`dati = altissimo e c'è dati-veri e usa laboratorio`); DD12 (`dati ≤ medio e usa prova e c'è ospitato`); DD13 (`dati = alto e usa prova e c'è ospitato`); DD14 (`dati = altissimo e usa prova e c'è ospitato`); DD16 (`dati = basso e usa prova`); DD17 (`dati ≥ medio e usa prova`); DD18 (`dati ≥ medio e usa prova e c'è ospitato`); DD19 (`dati = basso e usa prova e c'è ospitato`); DD20 (`dati = altissimo e c'è dati-veri e usa prova`); L2a, L2b, L2c, L2d, L2e, L2f, L2g, L2h, L2i, L2j, L2k, L2l, L2m, L2n, L3a, L3b, L3c, L3d, L3e, L3f, L3g, L3h, L3i, L3j, L3k, L3l, L4a, L4b, L4c, L4d, L4e, L4f, L4g, L4h, L8a, L8b, L8c, L8d, L8e, L8f, L8g, L8h, L8i, L8j, L8k, L10a, L10b, L10c, L10d, L10e, L10f, L10g, L10h, L10i, L10j, L12a, L12b, L12c, L12d, L12e, DD25 (`dati = altissimo`)
- **Le direttive di sicurezza** ([`direttive-sicurezza.md`](../../../Rule/direttive-sicurezza.md)): SI8, SI14, SI19, SI21, SI23, L1a, L1b, L1c, L1d, L1e, L1g, L5a, L5b, L5c, L5f, L5g, L5h, L6a, L6b, L6c, L6d, L6e, L6f, L6g, L6h, L6i, L7a, L7b, L7c, L7d, L7e, L7f, L7g, L9a, L9b, L9c, L9d, L9e, L9f, L11a, L11b, L11c, L11d, L11e, L11f, L11g, L11h, L11i, L11j, L11k, L11l, L11m, L11n, PV1, PV2, SI25, SI26 (`sicurezza = altissimo`); L1f, L5d, L5e, L5i (`sicurezza = altissimo e c'è database`); SI27 (`rulebook`: vale per chi cambia il rulebook e il brain)
- **Le regole di scrittura del codice** ([`regole-scrittura-codice.md`](../../../Rule/regole-scrittura-codice.md)): SC13 (`rulebook`: vale per chi cambia il rulebook e il brain)
- **Il manuale del laboratorio** ([`manuale-laboratorio.md`](../../../Rule/manuale-laboratorio.md)): LB7, LB8, LB9, LB10, LB11, LB12, MP1, MP2, MP3, MP4, MP6, MP7, MP8, LB1, LB5, LB13, LB14 (`usa laboratorio`); MP5 (`usa laboratorio e c'è dati-veri`); LB2, LB3, LB4, LB6 (`infrastruttura`: vale per chi costruisce o cambia l'infrastruttura condivisa, coi suoi manuali); LB15, LB16, LB17 (`rulebook`: vale per chi cambia il rulebook e il brain)
- **Il manuale di rete** ([`manuale-rete.md`](../../../Rule/manuale-rete.md)): RE1, RT1, RT2, RT10, RT3, RT4, RT5, RT9, RE2, RE3, RE4, RT6, RT7, RT8, AM2, AM3, AM6, AM8 (`infrastruttura`: vale per chi costruisce o cambia l'infrastruttura condivisa, coi suoi manuali); AM1, AM4, AM5, AM7, AM9, RE5, RE6, RE7 (`c'è ospitato`); RE9, RE10, RE11, RE12 (`rulebook`: vale per chi cambia il rulebook e il brain)
- **Le regole dell'hosting** ([`regole-hosting.md`](../../../Rule/regole-hosting.md)): HO1, HO18 (`per = cliente`); HO2 (`per = cliente e c'è cloud`); HP1, HP2, HP3, HP4, HP5, HP6, HP7, HO10, H1, H2, H3, H4, H6, H7, H8, H9, H10, H11, H12, H13, H14, H15, H16, H18, H19, H22, H21, HO11, HO13, HO14 (`c'è ospitato`); HO3, HO9, HO12, HO15, HO16, HO17 (`c'è ospitato e dove = C`); HO4, HO5, HO7, HO8 (`infrastruttura`: vale per chi costruisce o cambia l'infrastruttura condivisa, coi suoi manuali); HO6 (`usa prova e c'è ospitato`); H5, H17, H20 (`c'è ospitato e usa produzione`)
- **Le regole di manutenzione** ([`regole-manutenzione.md`](../../../Rule/regole-manutenzione.md)): MN11 (`rigore = prototipo e dove = dispositivo`); MN12 (`dove = B`); MN14, MN16 (`dove = A`); MN47 (`rulebook`: vale per chi cambia il rulebook e il brain)
