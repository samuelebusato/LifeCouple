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

### 2026-09-04 (3) — Le locandine cambiano casa, e tornano indietro in giornata

**Deciso dall'utente**: *«passa a thetvdb»*, dopo la seconda ricerca sulle alternative.

**Fatto**: migrazione `0030` (rinomina `tmdb_id` → `id_esterno`, nuova colonna `fonte`), riscritto [`lib/ricerca-film.ts`](lib/ricerca-film.ts) sull'API v4 di TheTVDB, estesa la riparazione automatica in `lib/preferiti.ts` perché rigeneri anche le locandine ancora TMDB, aggiornati `components/cerca-film.tsx` (attribuzione **premibile**, com'è richiesto), `lib/database.types.ts`, `.env.example` e le due stringhe che nominavano la chiave. **D-99**.

🔑 **La cosa che il prezzo non lasciava prevedere**: TMDB accettava la chiave nell'URL, TheTVDB pretende un `POST /login` e un **bearer token che dura un mese**. Il cambio di fornitore ha quindi portato dentro uno **stato** che prima non c'era — token da conservare, rinnovare e invalidare — e non una semplice sostituzione di URL. È il tipo di costo che si scopre leggendo l'API, non il listino.

🔴 **E poi tutto ritirato, poche ore dopo**: l'utente ha riferito che **TheTVDB ha problemi con la creazione di nuovi account**, quindi la chiave non era ottenibile. Ripristinati i cinque file toccati solo dal cambio (`git checkout`), rimossa la `0030`, e riportati a mano i tre file che contenevano **anche** lavoro della sessione — `lib/database.types.ts`, `lib/i18n.ts`, `docs/Architecture.md` — che un ripristino secco avrebbe azzerato insieme al questionario e all'ingresso. `tsc` pulito dopo il ritiro.

🔑 **La lezione di giornata, che vale più del cambio mancato**: la fattibilità di una migrazione di fornitore non si esaurisce nel confronto fra licenze e prezzi. Qui la licenza era migliore, l'API documentata, il codice scritto e compilante — e si è fermata su **una registrazione che non funziona**. Un fornitore alternativo non è *disponibile* finché non si è ottenuta la chiave: è il primo passo da fare, non l'ultimo.

⚠️ **Il blocco TMDB torna quindi aperto**, ed è la cosa da non perdere di vista: non è stato risolto, è stato rimandato.


### 2026-09-04 (2) — L'ingresso: un saluto che si apre, quattro pagine che spiegano, e il primo dato chiesto per noi

**Chiesto dall'utente**, in due riprese: un **questionario di onboarding** alla creazione dell'account, la **data di inizio relazione modificabile dalle impostazioni**, e poi — con due schermate di riferimento — *«pagine dedicate alla spiegazione del funzionamento»* con animazioni, una **welcome page** come quella allegata ma con la palette dell'app, e che *«passando dalla welcome page alla prima dell'onboarding lo sfondo diventi uniforme tramite un'animazione di riempimento partendo dalla parte già colorata»*.

**Fatto**: nuovo ingresso a due fasi in `app/(pubbliche)/benvenuto.tsx` con `components/ingresso-fondo.tsx` e `components/ingresso-illustrazioni.tsx` (**D-97**); questionario facoltativo — migrazione `0029`, `lib/profilo.ts`, `app/questionario.tsx` — con l'aggiornamento dei due documenti legali che dichiaravano il contrario (**D-98**); e la correzione della data d'inizio dalle impostazioni.

🔑 **La data non è costata niente, e il motivo merita di essere scritto**: `imposta_insieme_dal` (migrazione `0005`, D-29) faceva **già** `on conflict … do update` sull'evento del calendario, e il suo commento diceva a lettere *«permette di ritrovarlo e spostarlo se la data viene corretta»*. Il lavoro è stato solo estrarre il selettore da `components/insieme.tsx` e chiamarlo da un secondo posto: **nessuna migrazione**. È il dividendo di una funzione scritta il 2026-08-13 prevedendo un caso che allora non serviva.

⚠️ La voce sta nelle impostazioni **fuori** dalle «cose senza ritorno», ed è deliberato: cambiare la data non distrugge niente e si può rifare, mentre metterla accanto allo scioglimento le darebbe una gravità che non ha. Ma il testo avverte **prima** di premere che il cambio sposta anche «Il nostro inizio» sul calendario **dell'altro**: la stessa azione tocca due cose, e chi crede di correggere un numero non si aspetta di veder cambiare una data nel diario condiviso.

**Verificato nel browser** (Expo web, viewport 375×812), fase per fase: il saluto con la curva al posto giusto, il riempimento che arriva a sfondo uniforme, le quattro pagine con le loro illustrazioni, e l'ultima che porta a «Crea il tuo account». `tsc` pulito; `eslint` non aggiunge errori (i tre avvisi nuovi sono `set-state-in-effect`, lo stesso modello già presente in `lib/coppia.ts` e `lib/riepilogo.ts`).

🔴 **Non ancora verificato contro il database vero**: la migrazione `0029` **non è stata applicata**. Finché non lo è, `salva_profilo_coppia` e `cancella_profilo_coppia` non esistono su Supabase e il questionario fallisce all'invio. Il resto dell'ingresso non la usa e funziona comunque.

⚠️ **E resta aperto un fronte che questa sessione non ha toccato**: i controlli mirati su SDK 57 sul telefono — B-49 e le sei conferme — che aspettano dalla nona sessione.

### 2026-09-04 — La lontra: una mascotte prima che ci sia una creatura da vestire

**Chiesto dall'utente**: partendo da uno sticker kawaii di una **lontra** fornito in chat, prima *«rappresentare questo soggetto da cucciolo»*, poi *«anche come più adulta, è importante che rimanga ugualmente tenera»*, e infine — la frase che ha cambiato la natura del lavoro — *«tutte queste immagini e prompt servono per creare una mascotte e animarla per lifecouple»*.

**Fatto**: scritto [`docs/mascotte.md`](docs/mascotte.md) — identità visiva del personaggio (tavolozza, tratti invariabili) e gli script per **Nano Banana 2** che ne generano gli stadi. Creata `assets/mascotte/` col suo `LEGGIMI.txt`. **Nessuna riga di codice toccata, nessuna immagine generata**: il file è lo script, non il risultato.

**Perché sta nel repo del progetto e non in `Marketing/LifeCouple/`.** Perché la richiesta è *«animarla»*, e animare vuol dire codice dell'app. Se si scoprisse che serve solo per i contenuti social, la casa giusta sarebbe l'altra — ed è la prima delle domande aperte del documento.

🔑 **La cosa che vale la pena aver capito, e che il documento porta a verbale**: **l'età di un personaggio sta nelle proporzioni e nella postura, non nella durezza del viso.** Chiesto un personaggio animale «adulto», un modello generativo lo rende *figo* — corpo slanciato, mascella squadrata, occhi socchiusi — e la tenerezza sparisce. Il prompt dell'adulta perciò tiene **due blocchi separati**: uno che invecchia (rapporto testa/corpo 1:2,4, arti e coda più lunghi, orecchie più alte) e uno che *difende la tenerezza* (occhi grandi e rotondi, sagoma di sole curve, niente mascella). Il secondo non è decorativo: senza, il risultato contraddice la richiesta.

⚠️ **E la conseguenza sul costo, che è la ragione per cui il documento è fatto così**: l'età è parametrizzata su **una sola manopola numerica**, il rapporto testa/corpo. Gli stadi intermedi si ottengono muovendo quel numero, non riscrivendo il prompt. Serve perché **D-09 fissa ~5-6 stadi discreti**, e cinque prompt scritti a mano sarebbero cinque personaggi leggermente diversi.

**Tre cose sono state lasciate aperte invece di deciderle**, perché erano dell'utente e non mie. **Due hanno avuto risposta in giornata**:

- ✅ **la mascotte è la creatura di P-01** — risposto dall'utente lo stesso giorno, **D-95**. Da lì discende tutto il resto: la lontra ricade sotto D-09 e D-11, il materiale resta nel repo del progetto, e il vincolo *«cresce e basta, non deperisce»* di P-01 diventa un vincolo **sul disegno**.
- ✅ **gli stadi sono tre** — **D-96**, sempre il 2026-09-04, insieme al file di riferimento (ora `assets/mascotte/riferimento.jpg`, che **è** lo stadio 2). Sotto il tetto di ~5-6 di D-09, e i tre coincidono col materiale già prodotto: **non resta nessuno stadio da inventare**.
- ❓ **quanti umori**: non sono mai stati contati, e il conto delle immagini è `3 × umori`. È l'ultima cosa che separa il documento dalla produzione.
- 🔴 **come si anima un PNG** (§9 del documento): Nano Banana produce **raster**, mentre D-09 prevedeva `react-native-svg` e un percorso di sostituzione **Lottie**, che è vettoriale. Tre strade, con costi diversi, nessuna scelta. La meno cara (raster + trasformazioni con Reanimated) non chiude nessuna porta, proprio perché D-09 aveva separato stato e disegno.

⚠️ **Questo lavoro non anticipa niente: è D-11 applicata** — *«si progetta subito, si implementa per ultima»*. Progettare il disegno mentre il resto si costruisce è ciò che quella decisione chiede, e non sposta di un giorno l'implementazione, che resta ultima.

### 2026-09-03 (terza parte) — La domanda prima di buttare via, e l'importazione del calendario che era rotta

**Chiesto dall'utente**: *«vorrei che quando si elimina un evento/qualcosa in generale uscisse un messaggio che chiede conferma. Inoltre controlla l'import del calendario dal dispositivo»*.

**Le conferme (D-94).** Nel progetto c'erano **nove** cancellazioni e solo tre chiedevano qualcosa — le due foto e il «togli dall'evento» — più i fogli di lista e account. Le altre sei partivano al primo tocco: l'**evento dal calendario** (il caso citato), la **cartella** della galleria, il **commento**, il **posto** dalla mappa, il **posto o la voce** dalle liste, la **carta** in preparazione di una partita personalizzata. 🔑 Non per distrazione: perché la regola non aveva un posto dove vivere, e ogni schermata nuova ripartiva dalla memoria di chi la scriveva — la forma esatta di **D-60** e **D-85**. Ora vive in `lib/conferma.ts`, e per gli eventi e le schede sta **nel componente che possiede il bottone** (`riga-evento.tsx`, `scheda-elemento.tsx`), non nel punto di chiamata: così una schermata nuova che li usi non può perderla.

⚠️ **Le note dicono cosa si porta via, e sono state verificate contro lo schema, non scritte a orecchio**: le foto di una cartella cancellata **restano** (`on delete set null`, 0011); un posto cancellato se ne va **anche dalle liste** (`lib/luoghi.ts`, la correzione del 2026-08-30); una voce di lista no. La scheda dice due frasi diverse a seconda che sia un posto o un film, perché una frase sola sarebbe stata falsa per metà dei casi.

🔴 **E lungo la strada è saltato fuori che `Alert.alert` sul web è una funzione vuota** — in `react-native-web` è letteralmente `class Alert { static alert() {} }`. Senza accorgersene, le sei conferme nuove avrebbero reso **morti nella preview** tutti quei comandi, e le due conferme sulle foto lo erano **già da prima**, in silenzio. Ripiego con `confirm` del browser, in un punto solo: è il vantaggio di aver fatto un modulo invece di sei copie.

**L'importazione del calendario (B-49): era rotta, e l'aggiornamento a SDK 57 l'aveva rotta.** Le tre funzioni che `lib/importa.ts` usa — `requestCalendarPermissionsAsync`, `getCalendarsAsync`, `getEventsAsync` — in `expo-calendar` 57 esistono ancora **nei tipi** ma a runtime **lanciano**: sono state spostate dietro `expo-calendar/legacy`. 🔑 Ecco perché `tsc` non ha visto niente: i tipi ci sono, con un `@deprecated` che non è un errore. È il buco esatto che il PUNTO DI RIPRESA dichiarava — *«verificato a compilazione, non su un telefono»* — e stava in una schermata che nessuno dei controlli mirati toccava.

⚠️ **E il sintomo sarebbe stato il peggiore possibile**: in `app/importa.tsx` la chiamata al permesso era **fuori** dal `try`, quindi l'eccezione non la prendeva nessuno e lo stato restava `'attesa'` — la schermata avrebbe **caricato per sempre**, senza un errore da leggere. Corretti tutti e due: import da `expo-calendar/legacy`, e il permesso dentro il `try`.

🔑 **Perché `legacy` e non la nuova API a oggetti**, che è la migrazione "giusta": `getCalendars()` e `listEvents()` **non esistono in Expo Go** — lo stub `ExpoGoCalendarNextStub` lancia *«Calendar@next functionality is not available in Expo Go»*. Migrare lì oggi vorrebbe dire un'importazione che non si può provare fino al primo development build, cioè scambiare una funzione rotta con una non verificabile. Nel backlog, per quando ci sarà il build.

**Verificato**: `tsc` pulito, `eslint` 0 errori (65 avvisi, gli stessi di prima), bundle web compilato — che è anche la prova che `expo-calendar/legacy` si risolve — con dentro le stringhe nuove, l'app che carica nella preview senza errori in console, e le tre suite Node verdi (`parole` 31/31, `rls`, `partita` 183/183). ⚠️ **Nessuna delle sei conferme è stata vista su un telefono**, e l'importazione nemmeno: è la prima voce del PUNTO DI RIPRESA.

### 2026-09-03 (seconda parte) — Da SDK 54 a SDK 57, un passo alla volta

**Chiesto dall'utente**, dopo l'ok al commit di D-91: *«poi aggiorniamo a sdk 57 adesso»*. Il perché è nella voce qui sotto: l'Expo Go dell'App Store è alla 57.0.9 e include un solo SDK, quindi su SDK 54 l'iPhone non apriva più il progetto.

**Come**: tre passi, 54 → 55 → 56 → 57, come chiede la guida ufficiale, e a ogni passo la stessa scala: `npm install expo@^N` → `npx expo install --fix` → `expo-doctor` → `tsc` → `eslint` → bundle web. Il codice è stato toccato **solo dove un controllo lo chiedeva**, e ogni tocco è registrato in **D-92**.

**Passo 55** (RN 0.83, React 19.2). ⚠️ `npx expo install --fix` si è fermato su un conflitto di peer che non esiste: `@react-native-community/datetimepicker` dichiara `react-native-windows` come peer *opzionale*, e npm nel calcolare l'albero ha provato a soddisfarlo lo stesso, trovando una React Native diversa. Il pacchetto non è installato. Risolto con `--legacy-peer-deps`, passato a Expo dopo il `--`; il giudice che conta è poi `expo-doctor`. Tolte da `app.json` `newArchEnabled` ed `edgeToEdgeEnabled`, che SDK 55 non accetta più (la nuova architettura è l'unica, l'edge-to-edge è obbligatorio). `expo-blur`: il nuovo `BlurTargetView` è dichiarato non-breaking, non toccato. Verde: doctor 20/20, `tsc`, `eslint`, bundle web.

**Passo 56** (RN 0.85, TypeScript 6.0). Tre cose vere:
1. `expo-router` non dipende più da react-navigation. Il codemod ufficiale ha cambiato **una riga** (`components/barra-volante.tsx`: `BottomTabBarProps` da `expo-router/js-tabs`), e i tre `@react-navigation/*` di `package.json` — con `@expo/vector-icons`, mai importato — sono stati **disinstallati**: nessuno li richiede più, nemmeno come transitivi.
2. `expo/fetch` è diventato il `fetch` globale. Nel suo sorgente non c'è alcuna gestione di `file://`, e su Android la richiesta passa da OkHttp, che apre solo http/https: `fetch(piccola.uri)` in `lib/foto.ts` — la lettura della foto compressa prima del caricamento — sarebbe stato **un caricamento foto rotto su Android**, e solo lì. Sostituito con `new File(uri).arrayBuffer()` di expo-file-system, la stessa API già usata in `lib/esporta.ts`, invece di spegnere `expo/fetch` per tutta l'app con `EXPO_PUBLIC_USE_RN_FETCH=1`. ⚠️ **Non verificato su un telefono**: è nel PUNTO DI RIPRESA.
3. `StyleSheet.absoluteFillObject` non esiste più in React Native 0.85: 15 punti in 8 file, tutti → `absoluteFill`, che in 0.85 è tipizzato come oggetto (`AbsoluteFillStyle`) e quindi regge anche negli otto punti con lo spread. `tsc` è tornato pulito da solo.
Ed `eslint` è passato da 0 a **63 errori** senza che una riga fosse cambiata: `eslint-config-expo` 56 accende tre regole del React Compiler (`set-state-in-effect` 27, `refs` 19, `immutability` 17). Portate ad **avviso** in `eslint.config.js`, con la ragione scritta lì. `expo-doctor` ha segnalato la regressione di memoria di Hermes V1 — attesa, si chiude col 57.

**Passo 57** (RN 0.86.3, reanimated 4.5.1, worklets 0.10.1): nessun breaking change dichiarato e nessuno trovato. `expo` alla **57.0.19**, sopra la 57.0.9 che chiude la regressione di Hermes. Verde: doctor **21/21**, `tsc`, `eslint` (0 errori, 65 avvisi), bundle web che **contiene le stringhe dell'insegna**, e le tre suite Node — `test:parole` 31/31, `test:rls` tutti verdi, `test:partita` 183 asserzioni verdi — che provano che il backend non è stato toccato.

⚠️ **Tutto questo è verificato a compilazione e contro il database, non su un telefono.** Le cose che solo un telefono può dire sono nel PUNTO DI RIPRESA, in ordine di probabilità che siano rotte: il vetro (`expo-glass-effect` da 0.1 a 57.0), NativeWind su RN 0.86, il selettore data (da 8.4 a **9.1**, un major), le mappe (1.20 → 1.27), il caricamento foto con `File`, l'edge-to-edge su Android.

**Poi, sul telefono (terza parte).** L'utente ha avviato Expo Go e ha ricevuto *«There was a problem running the requested project: you need to be signed in to Expo Go and Expo CLI to open your project»*. Non è un difetto dell'aggiornamento: è l'Expo Go 57 che, per aprire un progetto da un tunnel pubblico, vuole un manifest **firmato**. E firmato vuol dire due cose insieme, lette nel codice del CLI (`@expo/cli/build/src/utils/codesigning.js`, `getExpoRootDevelopmentCodeSigningInfoAsync`): il **login** al CLI *e* un **progetto EAS collegato** (`extra.eas.projectId` in `app.json`); senza il secondo il CLI torna in silenzio al manifest anonimo e non firmato. Il solo login non è bastato — verificato chiedendo il manifest attraverso il tunnel con l'header `expo-expect-signature` che manda Expo Go: scope key `@anonymous/…` e nessun `Expo-Signature`. Dopo `eas init` (eseguito dall'utente, collegato al team `samududjhdnss-team`, **D-93**): scope key `@samududjhdnss-team/lifecouple` e header `Expo-Signature` presente, per iOS e Android. **L'app si è aperta su iPhone**, e l'utente riferisce che *«funziona tutto»* — un giro d'uso; i controlli mirati (vetro, foto, selettore data, mappe, insegna) restano nel PUNTO DI RIPRESA.

⚠️ **Tre cose vere sul tunnel, da sapere la prossima volta**:
1. In modalità `CI=1` il CLI **non stampa** né QR né indirizzo. L'host si legge da `hostUri` nel manifest servito in locale (`curl -H "expo-platform: ios" http://localhost:8081/`), ed è `<urlRandomness>-<utente>-8081.exp.direct`, con la casualità in `.expo/settings.json`. Il QR si genera in locale (`qrcode` da npm, fuori dal progetto).
2. **Il primo avvio dopo aver ucciso un server precedente fallisce** con `failed to start tunnel — session closed`: la sessione ngrok vecchia è ancora viva e chiude la nuova; su conflitto di sottodominio il CLI **azzera la casualità** (`5r3A908` → `xjAQxrg`), quindi l'host cambia. Il secondo avvio di fila va. E `preview_start` perde i log quando il processo muore: la diagnosi è venuta da un `expo start --tunnel` lanciato in una shell in background con l'output su file.
3. `npm` da PowerShell è bloccato dalla policy sugli script (`npm.ps1`): nel `.claude/launch.json` del brain le due configurazioni dei telefoni ora usano `npm.cmd`, che non tocca impostazioni di sistema.

⚠️ **`eas init` ha riscritto `app.json`** oltre a `projectId` e `owner`: una lista esplicita di permessi Android (calendario, posizione, `RECORD_AUDIO`), quattro plugin in più (`expo-image`, `expo-sharing`, `expo-status-bar`, `expo-web-browser`) ed `extra.router: {}`. Coerenti con ciò che l'app usa, ma **non scelti da nessuno**: nel backlog, da rileggere prima del primo build. Il bundle web di RN 0.86 segnala anche due deprecazioni (`pointerEvents` come prop, `shadow*` → `boxShadow`): avvisi, in backlog.

### 2026-09-03 — Il quiz dice grande chi risponde e chi indovina (D-91)

**Chiesto dall'utente**: *«ieri ho giocato ai giochi e mi sembrava funzionare tutto. Quello che vorrei però è che nel gioco "indovina cosa risponde l'altro" fosse più chiaro e più evidente a chi tocca rispondere e a chi inserire la risposta corretta. Questo vale sia per il gioco ufficiale che la versione personalizzata. Vorrei che fosse molto più evidente»*.

**La prima frase vale da sola.** I cinque difetti del 2026-09-02 (B-44→B-48) sono stati giocati e non hanno dato sintomi. ⚠️ È un giro d'**uso**, non l'esecuzione dei cinque casi di prova stretti del PUNTO DI RIPRESA — la stessa distinzione del 2026-08-28 — quindi i cinque restano «corretti, non visti singolarmente»; ma dalla prova non è uscito **niente di nuovo**, ed è la prima sessione dal 2026-09-01 in cui succede.

**La richiesta.** Il quiz aveva già una pillola del ruolo (2026-09-01) e una riga d'istruzione sotto la domanda: dodici punti di maiuscolo in un ovale, più testo grigio. Dopo due giorni di partite vere non bastava. 🔑 E rileggendo la richiesta la parola che pesa è *«a chi»*: non «cosa devo fare io», ma **chi dei due** sta dando la risposta giusta e chi la sta cercando — il ruolo di **entrambi**, che la pillola non diceva.

**Fatto**: `components/insegna-ruolo.tsx`, nuovo, e la testata di `app/gioco/quiz.tsx` riscritta attorno (**D-91**). Un blocco a tutta larghezza tinto col ruolo — rosa quando rispondi per te, ambra quando indovini, la stessa coppia di colori della pillola ingrandita — con un'icona, un titolo a corpo grande («Rispondi per te» / «Indovina tu»), una riga che nomina anche l'altro, e **due cartellini** affiancati (*Tu: la risposta vera* · *Partner: indovina*) col proprio pieno e quello dell'altro bianco. Sopra le quattro carte e sopra il riquadro della personalizzata una didascalia ripete il ruolo **dove si preme**. La testata è una per i due modi, quindi «vale per entrambi» è vero per costruzione. Dizionario aggiornato in italiano e inglese (`lib/i18n.ts`); `tsc` ed `eslint` puliti; bundle web compilato da Metro.

⚠️ **Non vista su un telefono**: è una schermata, e la suite non la esercita. È in cima al PUNTO DI RIPRESA.

⚠️ **Un inciampo di strumenti, da ricordare**: il working tree è **misto** — `lib/i18n.ts`, `app/gioco/quiz.tsx` e questo file sono CRLF, `components/carta-gioco.tsx` è LF — con `core.autocrlf=true` che normalizza al commit. Un `grep` di Git Bash su `\r` **non lo vede** e dice «LF»; lo ha detto Node. Uno script che sostituisce testo deve leggere i fine riga del file e riscriverli uguali, o la prima sostituzione non trova niente.

🔴 **A fine sessione, dall'utente**: *«expo go è stato aggiornato e ora supporta fino a sdk 57.0.0»*. Verificato sulle fonti, non dedotto: **ogni build di Expo Go include un solo SDK** («Each build of Expo Go includes one Expo SDK version», docs.expo.dev), e l'App Store distribuisce la **57.0.9** dal 2026-09-02. «Fino a» in pratica vuol dire «solo»: un progetto su SDK 54 **non si apre più** nell'Expo Go dell'App Store. Su iOS non esiste una via indietro senza account sviluppatore Apple (`eas go` + TestFlight); su Android sì (`npx expo-go install --sdk 54 --platform android`). La conseguenza è nel PUNTO DI RIPRESA e nel backlog («Aggiornare a SDK 57», con ciò che tocca questo progetto): l'aggiornamento in tre passi è diventato la **precondizione** per vedere qualunque cosa su iPhone — D-91 compresa. Decisione rimandata all'utente.

### 2026-09-02 (seconda sessione) — La prova sui telefoni, finalmente, e quattro sintomi con tre cause

**Chiesto dall'utente**: avviare il server per provare l'app da iPhone e Android. Poi, dalla prova: quattro sintomi riferiti uno dopo l'altro, con la richiesta esplicita di risolverli **tutti**.

**Il server.** `expo start` in LAN non era mai arrivato ai telefoni, e stavolta si è capito perché: sul PC è attiva una VPN (NordLynx) più due adattatori VMware, e non esiste nessuna regola firewall per la 8081 né per `node.exe`. L'URL della sessione precedente (`exp://10.1.0.147:8081`) era con ogni probabilità l'interfaccia della VPN, irraggiungibile da qualunque telefono — causa probabile, non dimostrata a posteriori. Si è passati al **tunnel** (`--tunnel`, `@expo/ngrok` già in `node_modules`), verificato scaricando il manifest **attraverso il tunnel** con `expo-platform: ios` e `android`: HTTP 200, LifeCouple 1.0.0, SDK 54. ⚠️ Il processo moriva da solo dopo un paio di minuti; regge con `CI=1`, che però **spegne il watch di Metro**: ogni modifica al codice richiede un riavvio del server. La causa della morte è **attribuita, non dimostrata** (la UI interattiva senza stdin): si sa che con `CI=1` regge, non perché prima cadeva. Le due configurazioni (`lifecouple-telefoni-tunnel`, `lifecouple-telefoni-lan` con l'IP del Wi-Fi forzato) stanno nel `.claude/launch.json` del brain.

**I quattro sintomi**, con le cause:

1. *«apro un gioco, premo Gioca, chiudo, premo Gioca su un altro gioco e mi riapre quello precedente»* → **B-44**: l'hub aggiornava il gioco selezionato solo in `onMomentumScrollEnd`, che scatta solo se c'è inerzia.
2. *«a volte mi apre direttamente il gioco senza farmi scegliere fra ufficiale e personalizzata»* → **stessa causa** (B-44): l'hub credeva fosse al centro la telepatia, l'unico gioco che entra diretto.
3. *«nella versione personalizzata del quiz esce scritto obbligo o verità»* → **B-45**: l'etichetta della carta senza tipo ricadeva su `scegliCarta`, la stringa del round di un altro gioco.
4. *«premo versione ufficiale e mi apre la personalizzata»* → **B-46**: uscire dall'anticamera lasciava la partita in `attesa`, e la volta dopo ci si rientrava col suo modo. Da qui **D-90**.

🔑 Tre sintomi su quattro sono usciti **al primo uso vero** di funzioni scritte ieri e verificate solo contro il database: una schermata provata su nessun telefono non è provata. Ed è la seconda volta in due giorni che due sintomi riferiti come due difetti erano uno solo (B-43 ieri, B-44 oggi).

**Poi un quinto sintomo, giocando davvero**: *«stavo giocando al gioco dei disegni in versione personalizzata e si è bloccato anche se entrambi i giocatori hanno premuto continua»* → **B-47**: la schermata «che cosa disegni?» compariva solo se non c'era un esito da mostrare — vero al primo round e mai più. Il round nuovo lo crea quella schermata, quindi dal secondo round nessuno lo creava. 🔑 Era esattamente ciò che il PUNTO DI RIPRESA della prima sessione chiedeva di provare per primo (0-ter), ed è uscito al secondo round.

**E un sesto**: *«indovina il disegno parte dal round 2»* → con ogni probabilità **non un round saltato**: la partita bloccata da B-47 era rimasta `in_corso` col round 1 già chiuso, e «Gioca» l'ha ripresa da lì — perché **una partita in corso non si poteva abbandonare da dentro**: la X tornava solo indietro, e l'anticamera con «Annulla la partita» non si vede più una volta partiti. **B-48**: la X ora chiede — resta, esci lasciando la partita, annulla la partita — in tutti e quattro i giochi. ⚠️ Causa probabile, non verificata sui dati (la RLS non lascia leggere le partite della coppia dall'esterno); l'alternativa — il round 1 chiuso all'istante da un telefono con l'orologio avanti di un minuto, visto che il tempo del round è ancorato a `iniziato_il` del server — è possibile ma improbabile, ed è scritta nel PUNTO DI RIPRESA come cosa da riconoscere se ricapita.

🔑 **Su richiesta esplicita dell'utente, commit e push di progetto e brain sono stati eseguiti senza conferme intermedie**, per questa volta sola: non è un cambio della regola di `CLAUDE.md` §6.

`npm run test:partita` sale a **183 asserzioni** (da 174) con il blocco di B-46. `tsc` e `lint` puliti.

⚠️ **Android**: l'utente riferisce che «non funziona», senza ancora un sintomo preciso. Il manifest Android è servito dal tunnel, quindi il problema è a valle del server: da capire al prossimo giro.

### 2026-09-02 — Il quarto gioco, e due test che accusavano il file sbagliato

**Chiesto dall'utente**: prima i test automatici del quiz sulle preferenze (l'unico dei tre giochi coperto solo da una partita giocata a mano), poi l'implementazione di `obbligo_verita`, l'ultimo gioco mancante.

🔑 **Il filo della giornata è lo stesso di ieri, spostato di un piano.** Ieri il collaudo su due sistemi aveva fatto uscire quattro difetti che tre giri su un solo telefono non vedevano. Oggi sono uscite **due verifiche che non verificavano**: una rossa da un giorno senza che nessuno lo sapesse, l'altra verde o rossa a caso. In entrambi i casi il test non diceva *«non so leggere»*, diceva *«il tuo banco è sbagliato»* e *«manca la publication»* — cioè mandava a cercare un difetto dove non era. È la famiglia di **B-36**, ed è la terza volta.

**I test del quiz** (`npm run test:partita`, ora **152 asserzioni** contro il database vero, da 42). Dieci round giocati per intero da due client con due sessioni vere, ruoli alternati come in partita. Le due asserzioni che valgono il gioco stanno nei primi due round, uno per verso:

- 🔴 **chi indovina non legge la risposta vera**, nemmeno interrogando l'API col proprio token;
- 🔴 **e non se la fa dire nemmeno dalla rivelazione**, che con un solo invio tace (`rivela_telepatia`, D-12).

⚠️ Nel quiz quella policy vale più che nella telepatia, e la differenza è scritta nel test: là la risposta giusta non ce l'ha nessuno dei due e leggere in anticipo è un vantaggio; **qui la verità è in tasca a uno**, e chi la leggesse non starebbe più giocando — indovinerebbe sempre, e il punteggio racconterebbe il falso su una coppia vera.

✅ **E da qui è passata la verifica della publication realtime di `round_pronto`**, che il punto di ripresa di ieri lasciava aperta come «prima cosa da guardare». Con la chiave dell'app `pg_publication_tables` non è leggibile, quindi la query in coda alla migrazione `0027` da lì non si può eseguire — ma la domanda per cui esiste sì: *l'evento arriva all'altro telefono?* B si iscrive, A preme «continua», l'evento **arriva**. La publication c'è.

🔑 **Ed è la migliore delle due verifiche, non un ripiego**: il catalogo dice che la tabella è *dichiarata*, l'evento dice che il meccanismo *funziona*. Se divergessero conterebbe il secondo — è la lezione del 2026-08-31, quando un documento dichiarava sul server una funzione che non c'era.

**Il controllo dei banchi** (`npm run test:parole`, ora **31 controlli**, da 15) copriva ancora due giochi su tre: né le domande del quiz né le carte nuove. Estendendolo è venuto fuori **B-41** — era rosso da ieri. Aggiunti, fra gli altri, due controlli che nascono da come funziona il codice e non da come è fatta la lista: nessun **titolo di domanda doppio** (la regola «una domanda non si ripete» identifica la domanda dal titolo, quindi due titoli uguali la confonderebbero) e nessuna **chiave in comune fra obblighi e verità** (la schermata tiene le carte già uscite in un insieme solo).

**Il quarto gioco, `obbligo_verita`** (**D-86**, **D-87**): dieci carte, i ruoli si alternano cinque e cinque, chi ha il turno sceglie obbligo o verità, legge la carta — che vedono tutti e due — e la fa o la passa. Nessuna migrazione. Trenta obblighi e trenta verità bilingui in `lib/parole.ts`, col filtro di D-08 e le due esclusioni di D-13.

Con questo **i quattro giochi del catalogo hanno tutti una partita dietro**, e l'hub non ha più carte «in arrivo».

**Poi l'utente ha riferito due difetti** che si trascinavano da giorni: nel disegno *«la prima parola non viene mai caricata e il primo round va perso»*, e in tutti i giochi *«all'avvio si rompe e bisogna uscire e rientrare»*. Sono **un difetto solo** (**B-43**): l'effetto che apre il round si rimontava a ogni evento e abbandonava il lavoro a metà — nel disegno fra la creazione del round e la scrittura della parola, cioè lasciando un round che nessuno può giudicare — mentre l'altro telefono non lo scopriva perché l'evento realtime era stato emesso **prima** che il suo canale fosse attivo.

🔑 **E la corsa era già stata vista, il giorno prima, dentro un test** (B-42): fu diagnosticata come un difetto del test e non come una domanda sul prodotto. *Quando una corsa si presenta in un test, la prima domanda è se il codice vero ce l'ha* — qui la risposta era sì, in tre schermate.

**Poi la versione personalizzata, ripresa e finita** (**D-88**, **D-89**, migrazione `0028`): il modo sta sulla partita e non nell'app, il set della coppia vive nella tabella `domanda` — vuota dalla 0001, nata per questo — e la preparazione riusa `segna_pronto` invece di inventarsi uno stato. Con questo la riga «personalizzata» dell'hub **fa** qualcosa: era stata segnalata per tre sessioni di fila come l'unico comando dell'app che prometteva una differenza inesistente.

✅ **La `0028` è stata applicata dall'utente in giornata, e la suite l'ha verificata**: il blocco che si saltava da solo si è acceso e passa — vincolo sul modo, le tre policy, il `coalesce` di `rivela_telepatia` e il realtime sulla preparazione. 🔑 È il modello opposto a quello del 2026-09-01, quando la publication della 0027 restò non verificata per un giorno perché la verifica era una query da ricordarsi: qui la verifica **è** il test, e applicare la migrazione la accende da sola.

⚠️ E andava applicata prima di usare questa versione, non è una raccomandazione: da ora l'app scrive `modo` quando crea una partita, quindi senza la colonna **nessuna partita si apre più** (`PGRST204`, verificato contro il server). Il blocco nuovo di `tests/partita.mjs` si salta da solo finché la migrazione manca, e lo dice: applicarla accende le sue asserzioni senza che nessuno debba ricordarsi di una query — che è ciò che il 2026-09-01 non è successo con la publication della 0027.

⚠️ **Ciò che di oggi NON è verificato, e va detto**: `obbligo_verita` non è mai stato giocato. È coperto da 35 asserzioni contro il database, che è più di quanto avessero gli altri tre alla nascita, ma *nessuno l'ha visto girare su un telefono*. La lezione di ieri vale al contrario: una schermata provata su zero dispositivi non è provata.

✅ **E in coda alla giornata, `expo-sharing`**: era dichiarato in `package.json` (~14.0.8) e non installato in `node_modules`, quindi `tsc` era rosso su `lib/esporta.ts`. Durante il giorno è stato segnalato due volte, sempre come nota di secondo piano.

🔑 **Non era di secondo piano.** Al momento di avviare il server per provare sull’iPhone, Expo si è **rifiutato di partire**: *«expo-sharing is added as a dependency in your project’s package.json but it doesn’t seem to be installed»*. Risolto con `npm install`; il `package-lock.json` **non è cambiato** — la versione era già bloccata a 14.0.8 — quindi nel repo non entra niente. Da lì `npx tsc --noEmit` è **completamente pulito** per la prima volta.

⚠️ La lezione, terza di oggi della stessa famiglia: *una segnalazione che si ripete e resta in fondo all’elenco non è una nota, è un difetto che non ha ancora incontrato il momento in cui morde.* Qui il momento era la prima prova su dispositivo — cioè proprio la cosa che serviva per verificare tutto il resto della giornata.



### 2026-08-28 (seconda sessione) — Il giro di verifica, e le liste che si creano

**Chiesto dall'utente**: nessuno sviluppo. Un giro di verifica sull'iPhone di tutte le novità del 2026-08-27 e del 2026-08-28, e l'aggiornamento della documentazione con l'esito.

**Esito, riferito dall'utente**: *«eccezion fatta per i giochi, ho controllato tutte le novità direttamente da iPhone e sembra funzionare tutto correttamente»*.

Cadono quindi i punti **1, 2, 4 e 5** della lista «cosa guardare al prossimo giro» del PUNTO DI RIPRESA del 2026-08-28:
- ✅ **il pannello «aggiungi un luogo»** non è più in ombra (**D-60**). E la diagnosi era giusta **in pieno**, non a metà: la correzione copriva sia il caso dei bottoni nidificati nel vetro della carta sia il caso della carta stessa, e restava scritto che *se fosse rimasto in ombra la lettura di D-55 sarebbe stata sbagliata alla radice*. Non è rimasto.
- ✅ **il «+» della mappa** ha il suo tondo (**B-16**, corretto con **D-61**): il vetro non nasce più dentro un livello a opacità zero.
- ✅ **l'aggiunta di un posto è una sola** (**D-64**): stesso foglio dal «+» della mappa e dal «+» di Liste, il campo di ricerca non tace più (**B-18**) e il posto nasce identico dalle due strade (**B-19**).
- ✅ **tutto il resto del 2026-08-27**, che il primo giro non aveva coperto: calendario, pagina evento, «Cambia tag», il cedimento dei bottoni, la cascata della home, **D-58** e **D-59**. E con loro **B-17**, il verso del titolo del calendario.

🔴 **Restano fuori i giochi**, ed è ora l'**unico** fronte dell'app mai visto girare: né l'hub (**D-62**, **D-65**) né le due partite (**D-66**, **D-67**).

⚠️ **Che verifica è, e che verifica non è.** È un giro d'uso: l'app è stata usata e non si è visto niente di rotto. Non è l'esecuzione punto per punto dei casi di prova stretti — e per quattro difetti quei casi erano scritti apposta, perché un giro normale **non li attraversa**: **B-16** voleva l'app *chiusa del tutto e riaperta*, non ricaricata; **B-19** voleva il controllo *in Liste*, che è la metà che sulla mappa non si vede; **B-17** voleva *due mesi avanti e due indietro*; **D-59** voleva un rientro *senza che iOS abbia riavviato l'app*. Sono stati chiesti esplicitamente e non è arrivata risposta, quindi restano **non confermati singolarmente**.

*La conseguenza pratica, che è l'unica che conta*: se uno di questi quattro si ripresenta, **non va letto come una regressione**. È la finestra stretta che il giro non ha attraversato, e la prima mossa è riprovarla col suo caso di prova — non cercare una causa nuova in codice che nel frattempo nessuno ha toccato.

🔑 **La lezione è quella di ieri, applicata dal lato opposto.** Il 2026-08-28 il difetto era stato scrivere «verificato» dove era stato *scritto* e non provato (**B-23**). Oggi la tentazione rovesciata è scrivere «verificato» dove è stato *usato* e non *esercitato*. È la stessa scorciatoia con due facce: **la parola «verificato» vale quanto il caso di prova che ha dietro**, e quando il caso di prova non si conosce si dichiara, non si arrotonda.

**Poi, nella stessa sessione: le wishlist** (**D-68**, migrazione **0022**). «Liste» era rimasta una categoria decisa da noi — un elenco solo, i film, dopo che D-51 aveva portato i luoghi nella mappa. Ora le liste le crea la coppia, col carosello dell'hub dei giochi e una carta «+» in fondo.

Le tre cose che è valsa la pena decidere, e non erano nella richiesta:
- **dove mettere le voci** — dentro `elemento_lista` e non in una tabella nuova, per non duplicare il trigger dei punti;
- **cosa fanno i comandi sulla carta «+»** — restano nella stessa posizione e diventano uno solo, perché la regola di D-62 parla di *dove si preme*, non di come si chiama;
- **cosa dice la conferma di cancellazione** — quante voci porta via e di chi, invece di «sei sicuro?».

⚠️ **Verificato solo a compilazione**: `tsc` e `eslint` puliti, bundle web 12,5 MB con i simboli nuovi presenti. La migrazione **non è applicata** e la schermata **non è stata vista girare** — la preview web si ferma al cancello di sessione.

**Sessione**: [`workspace/sessione-2026-08-28-verifica-iphone.md`](../../workspace/sessione-2026-08-28-verifica-iphone.md).

### 2026-08-28 — Il primo giro sull'iPhone, e l'hub dei giochi

**Chiesto dall'utente**: aprire l'app sull'iPhone e chiudere i difetti rimasti; poi implementare **solo l'hub dei giochi**, ispirato a due riferimenti (lo stile «toon» del primo, l'organizzazione a carte scorrevoli del secondo), con «Classifica» e «Gioca» sotto, e animazioni di scorrimento e di zoom.

**Il giro sull'iPhone — il primo davvero fatto.** Esito riferito dall'utente, punto per punto:
- ✅ **i commenti funzionano** (D-57) e ✅ **il caricamento delle foto è migliorato**;
- ✅ **B-15 non si ripresenta**: la scomparsa del riquadro della barra «ora si è risolta»;
- ❌ **il vetro del pannello «aggiungi un luogo» è ancora in ombra**, malgrado D-55;
- ❌ **all'avvio manca il riquadro del «+»** della mappa: resta l'icona, il tondo no.

🔑 **I due difetti rimasti erano la conferma di D-55, non la sua smentita**: quella decisione aveva descritto *esattamente* questi due modi di rompersi del vetro, e aveva sbagliato solo il modo di applicarli — a carico di chi chiama invece che dedotto dall'albero. Da lì **D-60** e **D-61**, e le due voci **B-16** e **B-17**.

**Fatto**: **D-60** (il contesto del vetro: la base non si dichiara più a mano, e niente vetro dentro il vetro), **D-61** (niente materiale nativo creato a opacità zero), **D-62** (l'hub dei giochi). Trovato **B-17**, che è di ieri e sta nella testata del calendario — corretto poi a fine giornata, su richiesta dell'utente.

**Secondo giro, dopo che l'utente ha guardato l'hub sull'iPhone**: *«nell'interfaccia mappa dei luoghi non riesco ad aggiungere luoghi: scrivo ma non mi si apre la tendina con i consigli»*, e *«la parte bassa dell'hub giochi mi sembra un po' schiacciata»*.

🔑 **La prima non era un guasto, ed è stato utile chiederlo invece di indovinarlo.** L'API Google risponde 200 e la chiave è nei bundle: l'utente stava scrivendo nel pannello **«Un posto nuovo»** della mappa, dove una tendina non c'è mai stata — la ricerca per nome era stata spostata in Elenco il 2026-08-27. Alla domanda diretta ha risposto *«vorrei che avesse lo stesso funzionamento di aggiungi luogo in elenco»*: da lì **D-63**. Se avessi tirato a indovinare avrei corretto la schermata sbagliata.

**Fatto nel secondo giro**: **D-63** (la ricerca dentro il pannello del «+», e la parità di risultato con l'elenco), **B-18** (il campo di ricerca che taceva), **B-19** (la mappa scriveva una riga di lista più povera dell'elenco), più la spaziatura dell'hub — registrata in coda a **D-62**.

**Quarto giro**: *«come gioco aggiungi anche "indovina il disegno"»* → **D-65**, che promuove la proposta 1 di P-04 da idea a gioco previsto, e la mette nel backlog come **voce 11-ter**.

**Terzo giro, e la richiesta che chiude il tema**: *«rimuovi la parte "come lo chiamate". Voglio che il funzionamento di aggiungere un luogo sia normalizzato come quello dell'aggiunta dall'elenco»*. Da lì **D-64**: una schermata sola, una funzione sola, e la rimozione del «segna dove sono». 🔑 D-63, scritta poche ore prima, si è rivelata **una tappa e non un approdo**: aveva messo la ricerca *accanto* al vecchio pannello invece che *al posto suo*, e quindi aveva lasciato in piedi le due strade che B-19 aveva appena mostrato essere il problema.

⚠️ **Non verificato**: l'hub non è stato visto girare. La preview web non ci arriva — il cancello di sessione porta alla schermata d'ingresso e l'accesso è via codice email — quindi restano `tsc`, `eslint`, e i due bundle (iOS 15,2 MB e web 12,3 MB, entrambi 200) coi nuovi simboli verificati per stringa.

**Sessione**: [`workspace/sessione-2026-08-28.md`](../../workspace/sessione-2026-08-28.md).

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

### D-99 — Le locandine dovevano passare a TheTVDB: scritta, e ritirata lo stesso giorno (2026-09-04)
🔴 **DECISIONE RIBALTATA, e resta scritta.** L'utente aveva deciso *«passa a thetvdb»* dopo aver visto i numeri; poche ore dopo ha riferito che **TheTVDB ha problemi con la creazione di nuovi account**, quindi la chiave non si poteva ottenere e si è tornati a TMDB. Il codice, la migrazione `0030` e la rinomina sono stati **ritirati**; questa voce **no**.

**Perché non si cancella**: la ricerca che l'ha prodotta vale ancora tutta, il ragionamento è corretto, e l'unica cosa che l'ha fermata è un impedimento **temporaneo e altrui**. Cancellarla significherebbe rifare fra un mese lo stesso lavoro per arrivare alla stessa conclusione. È la stessa regola già applicata in `Marketing/LifeCouple/monetizzazione.md` §0-bis: *non si cancella una decisione superata, si dice cosa la sostituisce e perché.*

⚠️ **E il problema che questa decisione risolveva torna aperto**: TMDB resta gratuito solo per uso non commerciale, e con gli abbonamenti attivi l'uso è commerciale dal primo giorno. Il blocco alla pubblicazione **non è stato rimosso, è stato rimandato**. Vedi il backlog per le mosse rimaste.

**Cosa era stato deciso, e resta valido se TheTVDB si sblocca:**

**Il perché in una riga**: TMDB è gratuito solo per uso **non commerciale**, e dal 2026-08-29 LifeCouple nasce con gli abbonamenti attivi — quindi commerciale dal primo giorno. Il listino TMDB è **149 $/mese**; col prezzo di 34,99 €/anno a coppia e al netto della commissione dello store, sono **fra le 50 e le 70 coppie abbonate per l'anno intero solo per pagare l'API**. TheTVDB concede licenza **gratuita sotto i 50.000 $/anno di ricavi**, in cambio di un'attribuzione con link.

**Le alternative valutate e scartate**, perché la scelta non fosse per esclusione mancata: **TVmaze** è gratis davvero (CC BY-SA) ma indicizza **solo serie TV**; **Wikidata** è CC0 e copre i film ma **non ha le locandine** (su Wikipedia stanno in fair use, non ridistribuibile); **OMDb** è CC BY-NC e vieta il commerciale a prescindere dal piano; **Simkl** e **Watchmode** sono gratuiti solo per uso non commerciale, cioè hanno lo stesso problema di TMDB. TheTVDB è l'unica insieme gratuita, con i film, e con le copertine.

🔑 **La differenza architetturale che il cambio porta con sé, e che non era prevedibile dal prezzo**: TMDB accettava la chiave **nell'URL** di ogni GET; TheTVDB no — si fa `POST /login` con la chiave e si riceve un **bearer token valido un mese**. Quindi ora c'è uno stato che prima non esisteva: un token da conservare, rinnovare, e da buttare quando viene rifiutato. Sta in `AsyncStorage` e non solo in memoria, perché un login a ogni avvio sarebbe una richiesta di rete prima della prima ricerca — e una richiesta che può fallire trasforma un'app aperta offline in un'app che sembra rotta. Si rinnova dopo **tre settimane** invece che a un mese: senza margine, la scadenza cadrebbe addosso a una ricerca qualunque.

**`tmdb_id` è stata rinominata in `id_esterno`, e non era evitabile.** La scorciatoia era lasciare il nome e metterci l'id di TheTVDB: tipo compatibile, una riga di codice. È **esattamente** la scorciatoia che la 0023 aveva rifiutato quando si trattava di infilare l'identità TMDB dentro `google_place_id`, e la ragione è la stessa parola per parola — *chi legge `tmdb_id` fra sei mesi si aspetta un id TMDB e trova altro*. Una colonna che mente costa più di una migrazione.

**E c'è una colonna nuova, `fonte`**, perché le due sorgenti **non hanno lo stesso formato di locandina**: TMDB salva un percorso (`/abc.jpg`) da comporre con la sua CDN, TheTVDB restituisce un URL. Senza `fonte`, l'unico modo di distinguerle sarebbe **dedurlo dalla stringa** — *«se comincia per http allora è TheTVDB»* — cioè indovinare un dato da un indizio. È il caso di `lista.tipo` nella 0023: *se il dato serve, lo si dichiara.* ⚠️ `urlLocandina` riconosce comunque **entrambe le forme**, perché chi disegna un elenco non sempre ha la fonte sotto mano e una copertina che sparisce è peggio di un controllo in più.

🔴 **Il debito che resta aperto, e va chiuso prima della pubblicazione**: le locandine già salvate **non sono state cancellate**. Sparirebbero tutte insieme, e per l'utente sarebbe una perdita senza spiegazione. Ma una copertina TMDB continuata a mostrare dentro un'app che incassa **è uso commerciale** — cioè esattamente ciò da cui si sta uscendo. La riparazione automatica di `lib/preferiti.ts` è stata quindi estesa: prima raccoglieva i film **senza** locandina, ora prende anche quelli con `fonte = 'tmdb'` e li rigenera su TheTVDB. Finché non ha girato su tutte le righe, il problema è **ridotto, non risolto**.

⚠️ **Due cose che il cambio NON risolve e che vanno tenute a mente:**

- **La locandina è un'opera dello studio**, non di TheTVDB né di TMDB. Quello che si ottiene è il diritto di usare la loro piattaforma, non l'opera: si è cambiato quale licenza si sta rispettando, non il rischio a monte.
- **TheTVDB nasce come database televisivo**, e sui film la copertura è inferiore a TMDB — che resta la fonte di fatto del settore. 🔴 **Va misurata su titoli veri**, e finché non lo è, questa decisione è presa su un vantaggio economico certo e una qualità ignota.

🔑 **Quello che questo tentativo ha comunque prodotto, e che non va perso**: il costo del cambio **non era il prezzo, era il login**. TMDB accetta la chiave nell'URL; TheTVDB pretende un `POST /login` e un token da conservare, rinnovare e invalidare. Scoprirlo è costato una riscrittura del modulo, ed è la ragione per cui una migrazione di fornitore non si stima dal listino. Se un domani si riprova, quel lavoro è descritto qui e non va reinventato.

⚠️ **Mai verificato contro l'API vera**: nessuna chiamata è stata fatta, quindi resta ignoto sia se `image_url` sia assoluto o relativo, sia — la cosa che più contava — **quanto bene TheTVDB copra i film**, visto che nasce come database televisivo.

### D-98 — Il questionario di profilo: il primo dato che chiediamo e che non serve a chi lo dà (2026-09-04, migrazione 0029)
**Chiesto dall'utente**: un questionario di onboarding. Alla domanda su cosa dovessero servire le risposte ha scelto **«capire chi sono gli utenti»** — cioè analisi di prodotto — e come momento **la formazione della coppia**.

**Perché è una decisione e non una schermata in più**: ogni altro dato del sistema sta nel database perché **il servizio non funzionerebbe senza**, e ha base giuridica «esecuzione del contratto» (art. 6.1.b). Queste quattro risposte no: **non tornano all'utente in nessuna forma**, non cambiano niente nell'app, e servono a noi. Cambia la base giuridica, e con essa tre cose che non sono negoziabili:

- **Consenso (art. 6.1.a)**, quindi libero, specifico, informato e **revocabile con la stessa facilità con cui è stato prestato** (art. 7.3). Da qui `cancella_profilo_coppia()` e la voce nelle impostazioni: non sono cortesie.
- **Il consenso è la riga stessa.** Nessuna colonna `ha_acconsentito`: la riga esiste solo se hanno acconsentito, e revocare significa cancellarla. Un booleano avrebbe reso rappresentabile lo stato «risposte presenti, consenso falso», che è esattamente il dato che non deve poter esistere.
- **Saltare non deve costare niente.** Nessuna domanda obbligatoria, un invito in home che si chiude per sempre al primo «non adesso», e il questionario che non blocca nulla. Un consenso necessario per proseguire non è libero (art. 4.11), e quindi non è un consenso.

🔴 **E ha reso false due righe che erano scritte nei documenti legali.** Il registro dei trattamenti dichiarava *«Profilazione, analytics, pubblicità — nessuno strumento, né proprio né di terze parti»*, e l'informativa elencava trattamenti tutti su base contrattuale. **Sono stati aggiornati nello stesso giro** (A7 nel registro, riga nuova e nota in §3 dell'informativa), non dopo: una tabella che raccoglie dati che l'informativa nega è peggio di nessuna tabella, ed è precisamente il caso che **D-80** esiste per impedire — *i documenti legali dichiarano ciò che il sistema fa*.

⚠️ **La distinzione tenuta nel registro**, perché la riga vecchia non era del tutto sbagliata: continua a non esistere **nessun analytics osservativo** — nessun comportamento nell'app viene misurato. Ciò che è cambiato è che esiste una raccolta **dichiarata e fornita dall'utente**. Le due cose non sono la stessa, e cancellare la riga invece di correggerla avrebbe perso l'informazione più importante.

**Le risposte stanno sulla coppia e non sull'utente**: l'unità del prodotto è la coppia (l'abbonamento lo è, il punteggio lo è), «convivete?» ha una risposta sola per due persone, e così la riga muore con la coppia per `on delete cascade` — senza nessuna regola speciale allo scioglimento, che è il tipo di caso particolare che D-04 costringe altrimenti a inventare.

⚠️ **La fascia d'età parte da 14** perché 14 è l'età minima dichiarata nell'informativa (§11, art. 8 GDPR in Italia). Una soglia diversa nel questionario avrebbe fatto divergere due documenti che devono dire la stessa cosa.

⚠️ **D-08 resta intatta e va riletta prima di aggiungere una quinta domanda**: esclude i dati di categoria particolare *da ogni funzione*, e nomina il questionario come il modo in cui quella decisione verrebbe annullata senza che nessuno se ne accorga. Le quattro domande scelte stanno tutte dentro «vita di coppia». Una su orientamento, salute o fede sarebbe art. 9 e **non si può aggiungere**, per quanto innocua sembri in un elenco di opzioni.

**Il questionario è anche entrato nell'export** di `lib/esporta.ts`: sono dati personali di chi esporta, e l'art. 20 non guarda a chi ha premuto il bottone.

### D-97 — L'ingresso è una schermata sola con due fasi, perché lo chiede il movimento (2026-09-04)
**Chiesto dall'utente**: che passando dal benvenuto alla spiegazione *«lo sfondo diventi uniforme tramite un'animazione di riempimento partendo dalla parte già colorata»*.

🔑 **Quella richiesta esclude due route, e non è un dettaglio implementativo.** `expo-router` smonta la schermata che si lascia e monta quella che arriva: il colore della seconda **non è** il colore della prima che cresce, è un colore nuovo che compare. Il riempimento non partirebbe da niente, e si vedrebbe un lampeggio. Perché il movimento parta davvero da ciò che si sta guardando, il fondo dev'essere **un solo elemento che vive attraverso i due momenti** — quindi due fasi dentro una schermata, non due schermate.

**Alternativa scartata**: le transizioni condivise di `expo-router`. Avrebbero potuto reggere il caso, ma richiedono che l'elemento condiviso esista identico nelle due route e non danno controllo sull'*altezza* che cresce mentre una curva sfuma — che è tutto ciò che questa animazione fa. Il costo del controllo perso era più alto del beneficio di avere due file.

**Tre cose imparate facendola:**

- ⚠️ **La collina bianca doveva sfumare, non solo scendere.** Sta a cavallo del bordo inferiore del blocco, quindi scende con lui; ma a riempimento finito si sarebbe trovata **in fondo allo schermo, ancora visibile** — una gobba bianca sul colore pieno, cioè l'opposto dello sfondo uniforme richiesto. Sparisce entro il 60% del percorso, quando sotto c'è già colore.
- ⚠️ **`flex` non sa dov'è il colore.** Il primo tentativo posizionava il testo con `flex-[0.56]`, gemello del `height * 0.56` del fondo: il testo è finito **sopra** il colore, perché `flex` divide lo spazio interno all'area sicura mentre il fondo misura lo schermo. La frazione è ora **una costante esportata** (`FRAZIONE_SALUTO`) e il layout misura in punti col margine di sistema recuperato dentro. Due righelli diversi per lo stesso bordo è un difetto che ricompare a ogni telefono con un notch diverso.
- ⚠️ **`withTiming` e non una molla**, contro la regola generale di `lib/movimento.ts`: una molla rimbalza, e un fondo che rimbalza dopo aver riempito lo schermo si legge come un errore — non c'è nessun oggetto fisico a cui attribuire quel peso.

🔑 **Il testo sopra il colore è prugna, non bianco**, e qui il riferimento non si è copiato: nel riferimento è chiaro perché il suo arancione è scuro, mentre su questi pastelli il bianco dà **circa 2:1** di contrasto — sotto il minimo perfino per il testo grande. È la stessa lezione già pagata in `lib/tema.ts` per la testata del calendario. Si è tenuta la **struttura** del riferimento e si è cambiato ciò che su questa palette non avrebbe funzionato.

**Le quattro pagine di spiegazione mostrano il meccanismo, non l'interfaccia**: nessuno screenshot in miniatura, che invecchierebbe al primo ritocco della schermata vera e comincerebbe a mentire. E quella dei giochi non vende un gioco: **disegna il sigillo di D-12** — *prima in segreto, poi insieme* — che è la cosa dell'app più facile da fraintendere come «l'altro legge mentre scrivo». Meglio dirlo all'ingresso che lasciarlo scoprire.

⚠️ **La mascotte in cima al saluto è ancora l'emblema.** Il riferimento ha lì la sua, e LifeCouple ne ha una decisa lo stesso giorno (D-95, la lontra), ma `assets/mascotte/` contiene solo un **JPEG su fondo chiaro**, che sopra il gradiente si vedrebbe come un rettangolo bianco. Serve il PNG ritagliato di `docs/mascotte.md`: il posto è già suo, si sostituisce un componente.

⚠️ **Chi rientra salta la spiegazione**: «Ho già un account» va diritto ad `accedi`. Rivedere quattro pagine a ogni reinstallazione sarebbe un pedaggio, ed è la stessa ragione per cui D-26 aveva tolto il cancello dall'onboarding.

### D-96 — La creatura ha **tre** stadi, e i tre esistono già (2026-09-04)

**Deciso dall'utente il 2026-09-04**: *«la mascotte avrà 3 stadi»*. Con la stessa richiesta è arrivato il file di riferimento, ora in [`assets/mascotte/riferimento.jpg`](assets/mascotte/riferimento.jpg) (2048×2048).

**Rapporto con D-09, che diceva ~5-6**: quel numero era un **tetto dettato dal costo** — *«il costo dell'upgrade grafico cresce linearmente col numero di stati visivi; cinque o sei si possono far illustrare, cinquanta no»*. Tre sta **sotto** il tetto: la ragione di D-09 non è contraddetta, è servita meglio. Il numero scritto lì è superato da questo; il vincolo che lo generava resta.

🔑 **La conseguenza migliore: il disegno degli stadi è già finito.** I tre coincidono col materiale prodotto oggi — **1** cucciolo (prompt, `docs/mascotte.md` §4), **2** intermedio (**è il file di riferimento**, già un'immagine finita), **3** adulta (prompt, §5). Non c'è nessuno stadio da inventare, e questo è vero solo perché l'età era stata parametrizzata su una sola manopola: i tre valori del rapporto testa/corpo (1:1,5 · ~1:1,8 · 1:2,4) erano già fissati.

⚠️ **Il prezzo dei tre stadi, che va saputo adesso e non quando si implementa**: tre stadi significano **due sole transizioni** in tutta la vita della creatura, quindi per quasi tutto il tempo la coppia vede un'immagine ferma.
- **Ogni transizione deve essere inequivocabile.** Se lo stadio 2 non si stacca a colpo d'occhio dall'1 e dal 3, la coppia percepisce **due** stati e uno dei tre è stato disegnato per niente. Il salto fra i tre rapporti non va ammorbidito «per dolcezza».
- ❓ **E il senso di crescita quotidiano non può venire dagli stadi.** P-03 lega le partite completate alla crescita della creatura: se il riscontro visivo arriva due volte in tutta la vita, il ciclo *«si gioca → la creatura cresce»* è vero nei punti ma invisibile nel disegno. Se serve un riscontro più frequente deve venire da qualcosa che **non è uno stadio** (micro-variazioni, posa, accessori) e che quindi non moltiplica il costo. **Non deciso**, e da decidere quando la creatura si implementa — non ora.

**Conseguenza sul conto delle immagini**: `3 × umori`. **Quanti umori resta l'unica cosa non decisa** prima di poter generare.

### D-95 — La mascotte **è** la creatura di P-01: la lontra è il disegno che D-09 aveva lasciato sostituibile (2026-09-04)

**Deciso dall'utente il 2026-09-04**, rispondendo alla domanda lasciata aperta in [`docs/mascotte.md`](docs/mascotte.md) §0: *«è la creatura di P-01»*. La lontra non è una mascotte di marca che vive accanto al prodotto: **è la creatura**.

**Perché è una decisione e non un dettaglio estetico**: finché la risposta era aperta, il disegno era un oggetto di marketing e le sue regole erano quelle di `Marketing/`. Da ora ricade sotto **D-09** e **D-11**, che gli impongono vincoli precisi — e sotto **P-01**, che gliene impone uno che non c'entra niente col disegno ma lo governa (l'ultimo punto qui sotto).

**Cosa NON cambia, ed è il motivo per cui questa decisione costa poco**: **D-09 resta intatta**. Lo stato è astratto (punti → stadio + umore), il disegno è un componente che riceve **solo `stadio` e `umore`** e non sa altro. La lontra è precisamente il *«qualcosa di più elaborato»* che D-09 prevedeva di sostituire alle forme geometriche, e la sostituzione non tocca la logica di crescita. Se D-09 non avesse separato stato e disegno il 2026-08-12, oggi questa decisione richiederebbe di riscrivere la crescita.

**Cosa cambia, in concreto**:

1. 🔴 **Il numero degli stadi non è più libero.** D-09 fissa **~5-6 stadi discreti** e la ragione è di costo: il costo dell'upgrade grafico cresce **linearmente col numero di stati visivi**. Oggi ne esistono due sulla carta (cucciolo, adulta) più il riferimento: ne mancano **3-4**, e vanno ottenuti muovendo il rapporto testa/corpo, non riscrivendo i prompt.
2. 🔴 **Il conto delle immagini è `stadi × umori`, non `stadi`** — perché il componente riceve anche l'umore. **Gli umori non sono mai stati contati**, e vanno contati *prima* di generare, non dopo: è la differenza fra ~6 immagini e ~30.
3. ⚠️ **Il percorso di sostituzione previsto da D-09 è cambiato di natura, e va detto**: quella decisione scriveva *«un illustratore consegna file **Lottie**, uno per stadio»*. Ora il disegno arriva da un modello generativo, che produce **raster**. Non è un dettaglio di fornitura: Lottie è vettoriale e un PNG non ci si converte. Le tre strade e il loro costo sono in `docs/mascotte.md` §9, e **la scelta resta aperta** — è oggi il vero nodo tecnico della creatura.
4. ⚠️ **Il materiale resta nel repo del progetto** (`docs/mascotte.md`, `assets/mascotte/`) e non passa a `Marketing/LifeCouple/`. Con la decisione, la collocazione scelta il 2026-09-04 diventa quella giusta per la ragione giusta: è un asset dell'app, non della comunicazione.
5. 🔑 **P-01 impone un vincolo al disegno che non nasce dal disegno**: *«la creatura cresce e basta: non muore, non deperisce, non rimprovera»*, perché una creatura che deperisce applica una punizione a una relazione, e se la coppia sta attraversando un periodo difficile l'app aggiunge senso di colpa nel momento peggiore. **Conseguenza diretta sugli stadi e sugli umori**: nessuno stadio può rappresentare deperimento, e nessun umore può leggersi come rimprovero per l'assenza. Un umore «triste» che significa *«non vi occupate di me»* violerebbe P-01 pur essendo solo un disegno. L'assenza rallenta la crescita, non la imbruttisce.

**L'alternativa è caduta con la decisione**: una mascotte di marca **distinta** dalla creatura. Vale la pena scrivere il costo che si evita, perché è il genere di duplicazione che si nota solo dopo — due personaggi significano due serie di asset da produrre e da tenere coerenti, e soprattutto due volti per un prodotto la cui **unica funzione non-commodity è proprio la creatura**. Un volto solo, che compare nell'app e nella comunicazione, è più economico e più forte.

⚠️ **Non cambia l'ordine di implementazione**: **D-11 resta** — *«si progetta subito, si implementa per ultima»*. La creatura è ancora l'ultima funzione della sequenza, e nulla di questa decisione anticipa il codice. Ciò che è stato fatto il 2026-09-04 è esattamente la metà «si progetta subito».

### D-94 — La domanda prima di buttare via vive in un posto solo, e dice cosa si porta via (2026-09-03)

Chiesto dall'utente: una conferma quando si elimina un evento «o qualcosa in generale». Il conto ha trovato **nove** cancellazioni e **sei senza domanda**.

**La decisione ha tre parti, e la prima conta più delle altre due.**

1. **Una funzione sola** (`lib/conferma.ts`), non sei `Alert` copiati. Il motivo non è il risparmio di righe: è che tre conferme scritte a mano non hanno impedito a sei schermate di nascere senza. 🔑 *Una regola che dipende dalla memoria di chi scrive la prossima schermata non è una regola, è una speranza* (D-60, D-85) — e qui la prova è che la regola c'era, in tre punti, e non ha protetto gli altri sei.
2. **Per gli eventi e le schede la conferma sta nel componente che possiede il bottone**, non nel punto di chiamata: `riga-evento.tsx` è usato dal calendario in due posti, `scheda-elemento.tsx` dalle liste in due; con la domanda nel chiamante bastava una schermata nuova per perderla. Dove il bottone è unico e locale (cartella, commento, posto sulla mappa, carta) la conferma sta accanto ad esso.
3. **La nota dice cosa si porta via, mai «sei sicuro?»** — che non è una domanda, non aggiunge niente a quello che chi preme già sa, e insegna a confermare senza leggere. È la regola scritta per le liste il 2026-08-30 (*«la conferma dice quante voci si porta via»*), qui estesa. ⚠️ **E le note sono state verificate contro lo schema**: le foto di una cartella restano (`on delete set null`), un posto se ne va anche dalle liste, una voce di lista no. Una nota falsa è peggio di nessuna nota: insegna a non fidarsi delle altre.

**Il bottone rosso è il secondo**, con `style: 'destructive'`; il primo è «Annulla» con `style: 'cancel'`. Su iOS è quello che il pollice trova per primo, su Android il tocco fuori annulla: in tutti e due i casi **la via facile è non cancellare**.

⚠️ **Il caso discutibile è la carta di gioco**: è appena stata scritta e si riscrive in un momento, quindi la domanda pesa più di quanto protegga. È stata inclusa lo stesso perché *«in generale»* era la richiesta, e perché un'eccezione lasciata al giudizio di chi scrive la schermata riapre esattamente il problema del punto 1. La nota lo dice: si può riscrivere.

**Alternative scartate**:
- *Un foglio di conferma nostro* (`components/foglio.tsx`) invece dell'`Alert` di sistema, come già fanno liste e impostazioni. Più bello e coerente con la direzione visiva, ma richiede uno stato per ogni schermata che cancella — cioè di nuovo qualcosa da ricordarsi — mentre una funzione si chiama e basta. I fogli che già esistono **restano**: dove la conferma è un momento della schermata (la lista, l'account con la parola da digitare) sono migliori dell'`Alert`.
- *Un annullamento dopo il fatto* («eliminato — annulla»), che eviterebbe la domanda. È la soluzione migliore in assoluto, e costa una cancellazione differita o un cestino: su contenuti condivisi fra due persone, con la RLS di mezzo, è un progetto suo. Nel backlog.
- *Chiedere solo per ciò che non si può rifare*, saltando la carta di gioco: vedi sopra.

**Verifica**: `tsc`, `eslint`, bundle web con le stringhe nuove, app che carica nella preview. ⚠️ **Non provata su un telefono**: la domanda che conta — *si legge, e dice qualcosa di utile?* — la dà solo l'uso.

### D-93 — Il progetto è collegato a EAS, sotto il team (2026-09-03)

Fatto dall'utente con `eas init`, su richiesta motivata: l'Expo Go 57 apre dal tunnel solo un manifest firmato, e la firma di sviluppo richiede login **e** `extra.eas.projectId`. Il progetto su expo.dev è `lifecouple`, owner **`samududjhdnss-team`** (un team, non l'utente `samududjhdns` con cui il CLI è loggato: conta l'appartenenza), `projectId` `322f00d8-59ff-4ae6-9572-255e22124291` in `app.json` — è un identificatore pubblico, sta nel repo.

**Conseguenze**: (1) `owner` in `app.json` decide sotto quale account finiranno build e update EAS: era nel piano di pubblicazione, oggi è deciso; (2) chi lavora al progetto da un altro dispositivo deve fare `npx expo login` con un utente **membro del team**, o il tunnel torna anonimo ed Expo Go rifiuta; (3) in LAN il requisito non c'è, ma in LAN i telefoni non sono mai arrivati (2026-09-02).

**Alternativa scartata**: restare anonimi e usare la LAN spegnendo la VPN. Avrebbe evitato di creare la risorsa oggi per ricrearla al primo build, e avrebbe rimesso in gioco firewall e adattatori virtuali.

### D-92 — L'aggiornamento a SDK 57: un passo alla volta, e il codice si tocca solo dove un controllo lo chiede (2026-09-03)

Il contesto è nel log: l'Expo Go dell'App Store è alla 57.0.9, include un solo SDK, e il progetto su 54 non si apriva più su iPhone. Le tre strade erano nel backlog; l'utente ha scelto l'aggiornamento, subito.

**Le regole seguite, e perché**:

1. **Un SDK alla volta** (54 → 55 → 56 → 57), come chiede la guida ufficiale, e a ogni passo la stessa scala di controlli: `expo install --fix` → `expo-doctor` → `tsc` → `eslint` → bundle web. Saltare al 57 in un colpo avrebbe fatto arrivare tutti i breaking change insieme, senza sapere a quale passo appartenesse ciascun errore.
2. **Il codice si tocca solo dove un controllo lo chiede**, e ogni tocco è di un tipo solo — *rimpiazzo* — mai *miglioramento*. Un aggiornamento che porta con sé refactor «già che ci siamo» è un aggiornamento che non si può più annullare senza perdere altro.
3. **`--legacy-peer-deps` sì, `--force` no.** Il conflitto era su un peer *opzionale* non installato (`react-native-windows`, dichiarato dal selettore data): `--legacy-peer-deps` dice a npm di non risolvere i peer da solo, che è esattamente ciò che si voleva; `--force` avrebbe accettato qualunque cosa. Il giudice è `expo-doctor`, che a fine corsa dà 21/21.
4. **Le tre regole nuove del React Compiler diventano avvisi, non errori — e non si spengono.** 63 segnalazioni su codice invariato non sono 63 difetti comparsi in un pomeriggio: sono una regola nuova applicata a schemi vecchi (lo stato che segue un evento realtime, il reset a cambio round), che nei giochi sono deliberati e documentati (B-43, D-90). Rivederli uno a uno è nel backlog, come refactor. ⚠️ Con `reactCompiler: true` in `app.json` quegli schemi possono far rinunciare il compilatore a ottimizzare quei componenti — non a compilarli male — quindi il costo è di prestazione, non di correttezza.
5. **Le dipendenze che nessuno importa si tolgono** (`@react-navigation/*`, `@expo/vector-icons`): SDK 56 ha tolto la ragione per cui c'erano, e npm conferma che non restano nemmeno come transitive. Una dipendenza diretta senza un import è un aggiornamento in più a ogni SDK, per niente.

**I tre rimpiazzi**, tutti nel log: `absoluteFillObject` → `absoluteFill` (15 punti); `BottomTabBarProps` da `expo-router/js-tabs` (codemod); `fetch(uri)` → `new File(uri).arrayBuffer()` in `lib/foto.ts`. 🔑 Il terzo è l'unico deciso leggendo il **sorgente** e non un changelog: il changelog di SDK 56 dice che `expo/fetch` è il nuovo `fetch` e come spegnerlo, non cosa non sa fare. Nel sorgente di `expo/fetch` non c'è `file://`, e su Android sotto c'è OkHttp. Si è cambiata la riga invece di spegnere `expo/fetch` per tutta l'app, perché lo spegnimento avrebbe protetto un punto rinunciando al resto — e sarebbe stato invisibile a chi legge il codice fra un mese.

**Alternative scartate**:
- *`eas go` + TestFlight* per restare su 54: rimanda lo stesso aggiornamento di qualche settimana, e lega la prova a EAS e all'account Apple da subito.
- *Saltare al 57 in un colpo*: regola 1.
- *Correggere i 63 avvisi adesso*: regola 4. Un aggiornamento con dentro un refactor dei giochi sarebbe stato impossibile da verificare in una sessione.

**Verifica**: doctor 21/21, `tsc` pulito, `eslint` 0 errori, bundle web con le stringhe di D-91, `test:parole` 31/31, `test:rls` verde, `test:partita` 183 verdi. ⚠️ **Nessun telefono l'ha ancora visto**: è la prima voce del PUNTO DI RIPRESA, e la lista di cosa può essere rotto sta lì.

### D-91 — L'insegna del ruolo nel quiz: il ruolo si dice grande, e si dice di tutti e due (2026-09-03)

Il quiz sulle preferenze aveva il ruolo in una pillola (2026-09-01): un ovale colorato con dodici punti di maiuscolo — «Tocca a te» / «Indovina tu» — e una riga grigia d'istruzione sotto la domanda. Due giorni di partite vere sui telefoni, e l'utente ha chiesto che fosse *molto* più evidente a chi tocca rispondere e a chi inserire la risposta corretta, in ufficiale e in personalizzata.

**La decisione**: sostituire la pillola con un'**insegna** (`components/insegna-ruolo.tsx`), un blocco a tutta larghezza in testa al round che dice il ruolo in quattro modi che si sommano, non in uno più grande:

1. **la tinta** — tutto il blocco è rosa quando si risponde per sé e ambra quando si indovina: la stessa coppia di colori della pillola, che chi ha già giocato conosce; cambia la grandezza, non il codice;
2. **l'icona** — la penna di chi scrive la propria risposta, il fumetto col punto di domanda di chi la cerca;
3. **il titolo** a corpo grande — «Rispondi per te» / «Indovina tu» — e una riga che nomina **anche l'altro** («È la tua risposta vera: il tuo partner deve indovinarla»);
4. **due cartellini** affiancati — *Tu: la risposta vera* · *Partner: indovina*, o il contrario — col proprio pieno e quello dell'altro bianco.

E sopra le carte (o sopra il riquadro, in personalizzata) una didascalia ripete il ruolo **dove si preme** — «Scegli la tua risposta vera» / «Scegli cosa pensi che abbia risposto» — e si spegne a scelta fatta. La testata del quiz è una per i due modi, quindi «vale per entrambi» è vero per costruzione, non per due modifiche parallele.

🔑 **Perché di tutti e due, e non solo il mio.** Rileggendo la richiesta, la parola che pesa è *«a chi»*: in due davanti allo stesso gioco la domanda non è «cosa faccio io» ma «**chi dei due** sta dando la risposta giusta». La pillola rispondeva alla prima; i cartellini rispondono alla seconda, e sono la parte dell'insegna che nessun ingrandimento della pillola avrebbe dato.

🔑 **«Rispondi per te», non «Rispondi tu».** *Rispondere* nel quiz lo fanno tutti e due — uno per sé, l'altro al posto dell'altro — e un titolo col solo verbo lascia intatta proprio l'ambiguità che l'insegna deve togliere. Nei cartellini, per lo stesso motivo, c'è scritto *la risposta vera* e non *risponde*.

**Alternative scartate**:

- *Ingrandire la pillola.* Avrebbe reso più visibile il ruolo di uno solo; il problema era il ruolo di entrambi.
- *Tingere l'intera schermata col ruolo.* È il segnale più forte possibile, ma le quattro carte e il riquadro stanno sopra vetro e fondo chiaro tarati per quel bianco (B-15, D-55): cambiare lo sfondo riaprirebbe una taratura chiusa a fatica per una cosa che l'insegna ottiene da sola. È la prima mossa se l'insegna non bastasse.
- *Bianco su tinta piena*, come la pillola. Il bianco sull'ambra piena stava sotto il minimo di contrasto anche per un titolo; i pastelli del calendario — fondo tenue, testo scuro della stessa famiglia — si leggono sempre, ed erano già i colori delle carte dell'hub. Il costo è che l'insegna è meno «accesa» di un blocco pieno: si compensa con la grandezza, il bordo nella tinta di mezzo e il cartellino pieno.

⚠️ **Due conseguenze da conoscere**:

- L'insegna **non compare finché non si sa chi è il soggetto**: nei round pari lo si deduce dall'elenco dei membri, che arriva dopo la partita. Mostrare «Indovina tu» per un istante e poi cambiarla sarebbe il genere di segnale che l'insegna esiste per togliere. È un'assenza di qualche decimo di secondo al primo round pari, non un difetto.
- L'insegna **rientra a ogni round** (chiave sull'id del round): il cambio di ruolo si vede succedere. Non vibra: la vibrazione è dell'azione, non del cambio di stato (D-53).

**Verifica**: `tsc` ed `eslint` puliti, bundle web compilato da Metro. ⚠️ **Non vista su un telefono**: è la prima voce del PUNTO DI RIPRESA. La misura che conta — *si capisce a colpo d'occhio chi fa cosa?* — la dà solo l'utente.

### D-90 — Una partita in attesa che nessuno ha fatto propria si rimpiazza, non ci si entra (2026-09-02, seconda sessione)

D-88 dice: *il modo lo decide chi apre la partita, e chi arriva secondo si aggancia*. È giusta ed è rimasta. Ma «chi arriva secondo» presuppone che qualcuno sia arrivato **primo** — e uscire dall'anticamera col tasto indietro non abbandona la partita, la lascia in `attesa`. Il risultato riferito dall'utente (**B-46**): premere «versione ufficiale» e trovarsi nella personalizzata, non perché l'altro l'avesse scelta ma perché era rimasta lì. Il comportamento era **documentato** in `apri` come «conseguenza da conoscere», con la via d'uscita «si abbandona e se ne apre un'altra». 🔑 Una regola che l'utente deve conoscere per non restarci dentro non è una regola: è un difetto con la spiegazione accanto.

**La regola nuova** (`daRimpiazzare`, `lib/partita.ts`): se il modo richiesto è diverso, la partita viva è ancora in `attesa`, **nessuno** ha premuto «Avvia»/«Ho finito» e l'altro non ha scritto carte, allora non è la partita di nessuno — si abbandona e se ne crea una col modo chiesto. Basta **uno** di quei segni di vita e ci si entra come prima: una partita `in_corso` è un gioco vero, e carte scritte dall'altro sono lavoro suo.

**Alternative scartate**:

- *Chiedere* («c'è una partita personalizzata aperta: entri o la sostituisci?»). Onesta, ma è una domanda in più a ogni avvio proprio nel caso più comune — la partita rimasta lì per sbaglio — per proteggere un caso raro (l'altro sta scrivendo carte e non ha ancora premuto «Ho finito»), che la regola copre già contando le carte altrui.
- *Abbandonare all'uscita* (`onEsci` → `abbandona`). Più radicale, ma distrugge la partita dell'altro se uno dei due esce un attimo dall'anticamera mentre l'altro sta scrivendo: ricrea il difetto nel verso opposto.
- *Cambiare il modo* della partita esistente con un `update`. Meno scritture, ma lascerebbe le carte scritte agganciate a una partita che ora è ufficiale; abbandonare e ricreare le lascia sulla partita abbandonata, fuori dal gioco, e riusa un percorso già verificato (0021 + `partita_una_viva`).

🔑 **In dubbio non si rimpiazza**: se uno dei due conteggi fallisce, ci si entra come prima. Un errore di lettura non deve far sparire una partita che magari è viva davvero.

⚠️ **La corsa**: l'abbandono è condizionato a `stato = 'attesa'`. Se l'altro l'ha fatta partire nel frattempo, l'update non tocca niente, l'insert fallisce su `partita_una_viva` e si rientra nella sua — il percorso di D-88, verificato nel test di B-46.

### D-89 — Il filtro del contenuto non copre il set della coppia, e va detto (2026-09-02)

🔴 **La versione personalizzata toglie la mitigazione di D-13, e non c'è modo di rimetterla.** D-08 e D-13 proteggono i giochi con un banco scritto da noi: niente categorie dell'art. 9, nessun obbligo fisico, nessuna verità sulle relazioni precedenti. Quel filtro è una *nostra* garanzia sul *nostro* contenuto. Nel momento in cui le carte le scrivono i due, il contenuto non passa più da noi.

**Cosa resta in piedi, e non è poco:**

- **il pass** (D-87) vale identico, e in personalizzata vale di più: è l'unica difesa rimasta, ed è per questo che passare non fa perdere niente a nessuno. Una meccanica che punisse il rifiuto sarebbe stata discutibile col banco filtrato; con un banco scritto dal partner sarebbe stata **l'app che aiuta a insistere**;
- **il set è visibile a entrambi prima di giocare** (`domanda_select`): chi si trova davanti dieci carte che non gli vanno se ne accorge nella preparazione, non a partita cominciata;
- **si scrive solo per sé** (`domanda_insert`, `autore_id = auth.uid()`): nessuno può riempire il set a nome dell'altro e far partire la partita da solo;
- **la partita si abbandona** in qualunque momento, e le carte muoiono con lei (`on delete cascade`).

**Cosa NON facciamo, e perché**: nessun filtro automatico sul testo scritto dalla coppia. Un elenco di parole vietate su contenuti intimi fra due persone che si sono scelte sarebbe **inefficace** (si aggira scrivendo diversamente) e **invadente** (l'app che legge e giudica le confidenze è precisamente ciò che il progetto ha evitato ovunque, TB-2). Il confine di fiducia fra i due partner **non lo presidia un filtro**: lo presidiano le uscite — passare, vedere prima, chiudere.

⚠️ **Conseguenza da tenere presente al momento di pubblicare**: `Architecture.md` dice già che il contenuto della coppia è *«non controllabile»*. Da oggi non è più un'ipotesi di schema, è una funzione che gira. Se un giorno arrivasse una segnalazione su un contenuto, la risposta onesta è che quel testo **non è mai passato da noi** e vive solo nel loro spazio — la stessa cosa che vale per le foto e per le note, ed è coerente con tutto il resto del prodotto.

### D-88 — La versione personalizzata: il modo sta sulla partita, il set in `domanda` (2026-09-02, migrazione 0028)

**Chiesta dall'utente**, gioco per gioco:

| Gioco | Come funziona la versione personalizzata |
|---|---|
| **indovina il disegno** | chi disegna **dichiara la parola** all'inizio del proprio turno, poi si procede col gioco normale |
| **quiz sulle preferenze** | all'inizio ognuno scrive **5 domande** (dieci in tutto). Niente quattro opzioni: chi ha il turno scrive la propria risposta, l'altro scrive quella che crede, e le due si confrontano |
| **obbligo o verità** | all'inizio ognuno scrive **5 obblighi e 5 verità**: quelle venti carte sono il set della partita |
| **telepatia** | **niente versione personalizzata**, per ora |

🔑 **Il modo è una proprietà della partita, non di chi la guarda** (`partita.modo`). I due telefoni non si accordano: chi arriva secondo **si aggancia** alla partita viva invece di crearne un'altra (`partita_una_viva`, 0020), quindi il modo deve stare su un dato che entrambi leggono. Tenerlo nello stato dell'app avrebbe voluto dire che chi ha premuto «personalizzata» gioca a un gioco e chi ha premuto «ufficiale» a un altro, **sulla stessa partita**.

Conseguenza voluta: **lo decide chi apre**, e l'altro lo trova scelto. Una negoziazione fra i due sarebbe stato un meccanismo intero — con la sua attesa, il suo annullamento e i suoi modi di rompersi — per una decisione che si risolve abbandonando la partita e riaprendola.

**Perché il set vive in `domanda`**, che era vuota dalla 0001: è la tabella nata per questo, col commento accanto che lo diceva già. Il banco comune non ci è mai finito — vive in `lib/parole.ts` perché è bilingue e immutabile — quindi qui dentro entrano **solo** le righe scritte dai due.

⚠️ **`partita_id` è la decisione rimandata, resa visibile nello schema.** L'utente ha chiesto di salvarle sul server ma di usarle *come se* valessero solo per quella partita, lasciando aperta per il futuro la scelta se debbano accumularsi in un banco della coppia. Con la colonna: oggi si legge filtrando, domani si toglie il filtro e le righe scritte finora sono già lì. La strada opposta non si recupera — una riga senza `partita_id` non saprebbe più da che partita viene.

**Perché la preparazione non è uno stato nuovo**: «Ho finito» chiama `segna_pronto`, cioè la stessa funzione del bottone «Avvia partita». *«Ho scritto le mie carte»* e *«sono pronto a giocare»* sono la stessa affermazione detta in due momenti diversi, e un secondo meccanismo avrebbe avuto una sua attesa e un suo modo di bloccarsi.

**Perché ognuno ne scrive cinque e cinque in obbligo o verità**, e non dieci a caso: chi ha il turno **sceglie** obbligo o verità, quindi le due colonne si consumano in modo imprevedibile. Con un mucchio solo, verso la fine il gioco costringerebbe alla scelta che avanza.

⚠️ **Il confronto delle risposte scritte è tollerante ma esatto** (`normalizza`: maiuscole, accenti, articolo iniziale, spazi). Non conosce i sinonimi: *«pizza»* e *«margherita»* restano risposte diverse. 🔴 È un rischio accettato e dichiarato: su testo libero dirà «no» dove due persone direbbero «sì». L'alternativa era far giudicare al soggetto se l'altro ci avesse preso — scartata perché mette **una persona a dare un voto all'altra** dentro un gioco il cui punteggio è della coppia. Da rivedere dopo la prima partita vera.

**Alternativa scartata sul quiz**: usare le domande del banco comune togliendo solo le quattro opzioni. Costava molto meno — nessuna schermata di scrittura — ma «personalizzata» avrebbe voluto dire *«le risposte sono libere»* invece di *«le domande le scrivete voi»*, che è ciò che D-19 e il testo già scritto nell'hub promettono da settimane. L'utente ha scelto le domande scritte dai due.

⚠️ **La telepatia è fuori per richiesta dell'utente**, e c'è una ragione tecnica che vale la pena scrivere: negli altri tre il contenuto lo mette **una persona nel proprio turno** — la parola, la risposta, la carta. La telepatia pretende **insiemi di quattro opzioni**, cioè quaranta caselle da riempire prima di cominciare. Non è che personalizzarla sia sbagliato: è che costa una schermata di data entry che nessuno riempirebbe due volte.


### D-87 — Il pass non fa perdere nessuno: D-13 aveva due teste (2026-09-02)

🔴 **D-13 diceva due cose incompatibili, e nessuna delle due era sbagliata quando è stata scritta.** Il titolo: *«in obbligo o verità il pass non fa perdere»*. Il corpo: teneva la proposta dell'utente *«chi passa di più perde»*, la dichiarava accettabile perché il banco è filtrato, e **scartava esplicitamente** l'alternativa di togliere la condizione di sconfitta. Non si potevano applicare entrambe.

**Scelta dell'utente, oggi**: vale il titolo. Il punteggio è **della coppia** — carte portate a termine su dieci, in percentuale come gli altri tre — e passare costa il punto del round, **niente altro**. Si chiama **«Coraggio»** (en: *Nerve*), accanto a Intesa, Sintonia e Conoscenza.

**Il perché, che è il motivo per cui la contraddizione andava sciolta e non ignorata**: contare i pass *di ciascuno* è una graduatoria fra le due persone. È esattamente ciò che P-03 vieta, ed è ciò che **D-83** aveva tolto dagli altri giochi il giorno prima, riscrivendo due testi che dicevano «chi ha vinto di più». Tenere D-13 alla lettera avrebbe rimesso nel quarto gioco la cosa appena cacciata dagli altri tre — e in quello dove pesa di più, perché lì il numero non conterebbe le partite vinte ma **i rifiuti**.

⚠️ **La parte di D-13 che resta in piedi è quella che conta**: la mitigazione non è la meccanica addolcita, è il **contenuto filtrato**. Le due esclusioni specifiche (nessun obbligo fisico, nessuna verità sulle relazioni precedenti) valgono parola per parola e sono scritte nel banco, dove si vedono.

🔑 **E la garanzia non è nell'interfaccia, è nella forma dei dati.** Il round registra l'esito della carta e **non chi aveva il turno** (`disegnatore_id` resta vuoto, come nel quiz): «chi ha passato di più» non è una query che si possa scrivere, nemmeno volendo, nemmeno da un'app futura che ci ripensasse. È la logica di D-12 portata su un'altra minaccia — *se non deve essere possibile, non basta non farlo: non va reso rappresentabile* — e c'è un'asserzione nel test che la controlla.

### D-86 — Obbligo o verità: il quarto gioco, e l'unico senza sigillo (2026-09-02)

**Cos'è**: dieci carte, i ruoli si alternano (cinque a testa, come nel quiz). Chi ha il turno sceglie **obbligo** o **verità**, la carta compare **su tutti e due i telefoni**, e chi ha il turno la fa o la passa. Poi «Continua» premuto da entrambi (0027) e si passa alla prossima. Nessuna migrazione: la carta sta in `partita_round.opzioni`, come le quattro opzioni della telepatia.

🔴 **Perché NON usa il sigillo D-12, mentre gli altri tre sì.** Quiz, telepatia e disegno esistono perché c'è **qualcosa da nascondere fino al momento giusto**: la risposta vera, la scelta dell'altro, la parola. Da lì viene tutto il congegno — `invio_sigillato`, `round_segreto`, `rivela_telepatia` — e la regola che l'autorizzazione sta nel database.

Qui non c'è niente da nascondere: **la carta la deve leggere anche l'altro**, o non c'è nessuno davanti a cui farla. Un invio sigillato proteggerebbe un segreto che il gioco non ha, e in cambio pretenderebbe due invii dove agisce una persona sola.

⚠️ **E va detto perché contraddice tre righe di questo stesso documento**: `History.md` classifica «obbligo o verità» fra i tre giochi del sigillo (D-12, e le note su P-04). Quelle righe guardavano all'**infrastruttura di turni e stato condiviso** — partita, round, pronti, punteggio — che infatti è la stessa e non è stata scritta una seconda volta. Il sigillo no. La riga di D-12 *«si costruisce un meccanismo solo e si ottengono tre giochi»* resta vera contando il disegno: i giochi che riusano il sigillo sono tre su quattro.

**Chi crea il round**: **chi ha il turno**, non chi ha creato la partita. È diverso dal quiz e dalla telepatia, e la ragione è che qui il round nasce da una scelta — obbligo o verità — che conosce solo lui. È la stessa forma del disegno (crea chi disegna), e il turno lo deduce `disegnatoreDi` da `creata_da` e dal numero, che i due telefoni calcolano uguale (**B-30**). L'indice unico `(partita_id, numero)` è la rete sotto: se per un difetto futuro i due calcolassero turni diversi, non nascerebbero due round 1 — il secondo prende un duplicato. C'è un'asserzione anche per questo.

**Il banco**: trenta obblighi e trenta verità bilingui in `lib/parole.ts`, chiave inglese + testo italiano come gli altri tre. Filtro di **D-08** (niente categorie art. 9) più le due esclusioni di **D-13**.

🔑 **Sull'esclusione degli obblighi fisici, la ragione non è il pudore** — è che un obbligo fisico è l'unico che non si può passare *senza che si veda*, e quindi l'unico che trasforma il pass in una scena. Tutti gli obblighi del banco si fanno **da seduti**, con la voce o col telefono in mano. E c'è un secondo criterio, pratico: una carta che richiede di alzarsi o di uscire verrebbe passata da chiunque per logistica, non per scelta — e il pass deve costare una decisione, non un trasloco.

**Alternativa scartata**: dare al partner un bottone per confermare che la carta è stata fatta davvero. Scartata perché è un **giudizio di una persona sull'altra** dentro un gioco il cui punteggio è della coppia, e perché il precedente esiste già: la creatura non verifica che la coppia sia andata davvero a New York, ed è scritto che *va bene così*. Il gioco è cooperativo: non c'è nessuno da battere e quindi nessuno da controllare.



### D-85 — Le superfici che devono esserci non usano il vetro nativo (2026-09-01)

**Difetto riferito, con screenshot**: nella telepatia *«alcuni riquadri con la risposta sono come evidenziati o in rilievo»*. Lo screenshot ha mostrato il contrario di come suonava: la prima carta **non aveva il riquadro affatto**: non era più in evidenza, erano le altre tre ad avere una superficie e lei no.

**Causa**: `fondo="sicuro"` lascia disegnare il **vetro nativo di iOS**, e quando il sistema decide di non disegnarlo resta la sola velatura chiarissima — che sul fondo chiaro dell'app è indistinguibile dallo sfondo. È **B-15** preso in flagrante: *«il riquadro spariva, restavano le icone»*, registrato il 2026-08-27 come mitigato e con causa mai isolata.

**Decisione**: le quattro carte e i pop-up di esito passano a `fondo="pieno"`, che **salta il vetro nativo** e mette una base opaca nostra. Stesso aspetto su iOS e su Android.

- **Cosa si perde**: l'effetto vetro su quelle superfici.
- **Perché si accetta**: una carta da premere che a volte non si vede non è una decorazione riuscita male, è **un comando invisibile**.

🔑 **La regola generale, che il progetto aveva già scritto e non aveva applicato fin qui**: *ciò che deve reggere non può dipendere da un materiale che decide il sistema*. Era già la lezione del bottone «avvia» che sembrava spento (2026-08-28), ed è scritta nel `fondo` di [`components/ui/vetro.tsx`](components/ui/vetro.tsx): `'pieno'` è «per il vetro **dentro un foglio**». Un pop-up modale *è* un foglio — il primo pop-up è nato con `'sicuro'` per una mia disattenzione, ed è ricomparso come *«a volte il pop-up è in trasparenza»*.

⚠️ **E un errore di lettura da non ripetere**: la prima correzione ha solo **uniformato** il fondo delle quattro carte (togliendo `mia ? 'pieno' : 'sicuro'`), perché la parola «in rilievo» faceva pensare a una carta *in più*. Era ragionevole e non bastava: la segnalazione descriveva una carta *in meno*. **Lo screenshot ha risolto in un colpo un'ambiguità che due giri di ipotesi non avevano sciolto.**

---

### D-84 — Il quiz sulle preferenze: turni alternati, e nessuna migrazione (2026-09-01)

**Chiesto dall'utente**: implementare il terzo gioco. Dieci round: uno risponde per sé fra quattro opzioni, l'altro prova a indovinarlo; punto quando ci prende. Punteggio: **Conoscenza**.

🔑 **I ruoli si scambiano a ogni round** (`disegnatoreDi`, la stessa alternanza del disegno), e non è varietà: senza lo scambio il gioco misurerebbe *quanto uno conosce l'altro*, cioè produrrebbe un giudizio **su una persona sola** — la cosa che P-03 vieta di far uscire da questi giochi. Cinque round per parte: entrambi esaminati ed esaminatori la stessa quantità di volte, quindi il punteggio resta della coppia.

**Nessuna migrazione, e la ragione non è la fretta.** `invio_sigillato` prevede `natura = 'verita'` e `'tentativo'` fin dalla 0001, nate per questo gioco. Non sono state usate: **quale delle due righe sia la verità lo dice già il turno**, che si calcola da `creata_da` e dal numero ed è uguale sui due telefoni per costruzione (è la lezione di B-30). Un'etichetta sulla riga ripeterebbe in un secondo posto un fatto che vive già altrove, con l'unico effetto di poter divergere. Usando `'scelta'` per entrambi, **`rivela_telepatia` funziona qui senza una riga di SQL nuova**: non filtra per gioco, restituisce le due scelte sigillate di un round.

**Le domande stanno nel codice** ([`lib/parole.ts`](lib/parole.ts), 14 domande da 8 risposte), come `TEMI_TELEPATIA` e `PAROLE_DISEGNO`. La tabella `domanda` resta vuota per ciò a cui serve davvero: il banco **personalizzato** della coppia (D-19, backlog 11-bis). Metterci il banco comune vorrebbe dire una migrazione di seed per ogni domanda e due lingue da tenere allineate a mano.

⚠️ **Il filtro di D-08 qui morde più che altrove**: nella telepatia una scelta dice qualcosa di chi la fa, nel quiz **la domanda è su una persona per costruzione**. Nessuna domanda tocca salute, religione, opinioni politiche, origine o vita sessuale — un quiz su quelle categorie non sarebbe indiscreto, sarebbe *un trattamento progettato per raccoglierle*. Secondo filtro, di tono: niente domande la cui risposta possa **ferire**, perché rimetterebbero dalla finestra il verdetto sulla relazione che P-03 caccia dalla porta.

**Il ruolo si dice due volte** (seconda richiesta dell'utente: *«vorrei che fosse più evidente chi deve rispondere e chi deve indovinare»*): una **pillola colorata** — magenta «Tocca a te», ambra «Indovina tu», i colori che le carte già usano per «mio» e «suo» — e soprattutto **la domanda che cambia persona**: «Il *tuo* piatto consolatorio» contro «Il *suo*». La seconda è quella che conta: mette il ruolo **dove gli occhi già sono**, invece di aggiungere una cosa in più da leggere. Un badge si può saltare, il titolo no.

⚠️ **Il quiz non ha test automatici**: la suite copre disegno e telepatia. Dichiarato, non taciuto.

---

### D-83 — Il punteggio è una media in percentuale, e ogni gioco mostra il suo (2026-09-01)

**Chiesto dall'utente**, e scioglie il nodo che [`app/(tabs)/giochi.tsx`](app/(tabs)/giochi.tsx) teneva aperto da agosto: *«il conteggio si fa; **come** formularlo separa un gioco da una pagella, e va deciso quando le partite esisteranno davvero»*. Le partite ora esistono.

- **Una media, non un totale.** Un totale che sale e non scende mai misura **quanto avete giocato**, non quanto vi capite: dopo venti partite è un numero grande comunque, e non c'è modo di andare peggio. Il rapporto `punti / round giocati` si muove nei due versi — parole dell'utente: *«così il punteggio può essere migliorato o peggiorato nel tempo»*.
- **Il denominatore è `round_totali`, non il numero di partite**: telepatia vale 10 round e disegno 5, e sommare partite di lunghezza diversa darebbe una percentuale che dipende da quale gioco si è scelto.
- **Un punteggio solo, quello del gioco da cui si apre.** Il foglio portava già in testa il nome del gioco scelto e sotto mostrava entrambi i punteggi: era l'incoerenza riferita dall'utente.
- **Ogni gioco tiene il suo nome** — Sintonia, Intesa, Conoscenza: sono tre cose diverse, e chiamarle con la stessa parola farebbe sembrare confrontabili numeri che non lo sono.

⚠️ **Due testi correggevano il falso e sono stati riscritti**, senza che fosse chiesto: il foglio si intitolava *«Chi ha vinto di più»* e la schermata vuota prometteva *«chi ha vinto più partite»*. Con la media quel numero **non esiste più** — e soprattutto un «chi ha vinto» fra due persone è precisamente la graduatoria che P-03 vieta.

**Rinominato «Classifica» in «Punteggio»** ovunque (richiesta dell'utente), **chiavi del codice comprese**: un codice che chiama una cosa in un modo e l'interfaccia in un altro invecchia male.

---

### D-82 — Fra un round e l'altro non passa un tempo, passa un gesto (2026-09-01, migrazione 0027)

**Difetto riferito**: *«nel gioco telepatia le animazioni sono troppo veloci»*, con la proposta dell'utente — un pop-up con l'esito e un pulsante «Continua», per tutti i giochi.

**Perché non è bastato allungare i tre secondi.** `PAUSA_FRA_ROUND` era un tempo fisso uguale per chiunque: protegge il momento dell'esito **solo per chi legge alla velocità per cui è stato tarato**, e resta un'attesa cieca identica sia che l'altro stia guardando lo schermo sia che abbia posato il telefono. La costante è stata **rimossa**, non ritoccata.

**Come**: nuova tabella `round_pronto` (chiave `(round_id, utente_id)`), modellata su `partita_pronto` che fa già la stessa cosa per l'inizio della partita — stesse tre policy, stesso modo di attivare il realtime. Per round e non per partita perché «sono pronto ad andare avanti» è una risposta che **scade a ogni round**, mentre «sono pronto a giocare» si dà una volta sola: riusare la tabella esistente avrebbe voluto dire cancellarne le righe a ogni round, cioè distruggere l'informazione che fa partire la partita.

**Chi preme, quanti**: entrambi (decisione dell'utente). `>= 2` e non «tutti», come in `segna_pronto`: una coppia è due persone per costruzione (D-14), e la riga esplicita dice che il meccanismo **non** regge a un gruppo.

⚠️ **All'ultimo round non si aspetta nessuno**: dopo non c'è un round da far partire insieme, c'è il punteggio. Far aspettare lì sarebbe un'attesa senza scopo, e con l'altro che ha già posato il telefono un'attesa senza fine.

🔑 **Il duplicato non è un errore** (`23505`): premere due volte è la cosa più naturale davanti a un bottone che non sembra aver fatto niente — e qui *non fa* niente di visibile finché non preme anche l'altro. Trattarlo come guasto mostrerebbe un messaggio rosso a chi ha solo insistito.

**Verifica della migrazione, e il buco che aveva**: applicata dall'utente e verificata contro il server prima di ripartire — `round_pronto` risponde `200 []` mentre una tabella inventata dà `404`, quindi la tabella **esiste** e il controllo discrimina. ⚠️ Ma quella verifica copriva la tabella, **non la publication realtime**, che con la chiave dell'app non è leggibile: la query è stata lasciata all'utente. *Una verifica che non dice cosa non ha coperto è una verifica che si crede completa.*

---

### D-81 — Si pubblica come individuo, e uno dei tre motivi per fare il contrario non esisteva (2026-08-31)

**Decisione dell'utente**: l'app esce a nome **Fausto Busato**, non a nome F.R. di Busato Fausto. [`docs/pubblicazione.md`](docs/pubblicazione.md) §2 è stata riscritta di conseguenza; la versione superata è conservata in §2.4.

🔑 **E per questa forma d'impresa non era nemmeno una scelta libera.** Apple stabilisce che chi è **ditta individuale si iscrive come individuo**: il percorso «Organization» è riservato alle **entità legali separate**, e il D-U-N-S serve a provare che quell'entità esiste come soggetto distinto dalla persona. Una ditta individuale non lo è — `F.R. di Busato Fausto` **è** `Fausto Busato` — ed è lo stesso motivo per cui D&B non censisce le *sole proprietorships*. **La ricerca del D-U-N-S che stava per partire era verosimilmente un vicolo cieco.**

**Il piano precedente dava tre ragioni per scegliere organizzazione. Delle tre:**

| | Esito |
|---|---|
| Editore = l'azienda | ❌ non è più voluto |
| Evita il test chiuso di Google (12 tester × 14 giorni) | ✅ **era vero, e resta il prezzo da pagare** |
| Separa la responsabilità dell'app da quella personale | 🔑 **era illusorio** |

⚠️ **Il terzo merita di essere registrato, perché è un errore di ragionamento e non di fatto.** Con una ditta individuale si risponde col patrimonio personale **comunque**: il tipo di account su uno store non crea una separazione patrimoniale che l'ordinamento non prevede. Era un beneficio **dichiarato e inesistente**, ed è passato inosservato perché *suonava ovvio*. È la stessa classe di difetto che questo progetto insegue da settimane — **uno stato scritto che nessuno ha verificato** — applicata a un ragionamento invece che a un file. *Anche le premesse invecchiano, e in silenzio come i documenti.*

**Cosa cambia nel piano**: sparisce l'attesa del D-U-N-S (1-2 settimane, passiva), entra il **test chiuso di Google** (+3 settimane, ma è **lavoro**, non attesa). 🔑 E coincide con un bisogno che il progetto ha già: **D-25** dice che senza partner l'app non fa niente, quindi non è collaudabile in altro modo — quei 12 tester sono **sei coppie**, e sono gli stessi beta tester del piano di marketing. *Una lista sola, due scopi.*

⬜ **Non è una porta che si chiude**: se un giorno nascesse una S.r.l., entrambi gli store prevedono il trasferimento di un'app da un account individuale a uno aziendale.

⚠️ **Quel che la scelta NON cambia**: le commissioni (~15% con lo Small Business Program di Apple, che è legato al **fatturato** e non al tipo di account), il funzionamento dei pagamenti, e gli obblighi **DSA** di esporre nome, indirizzo, telefono ed email del professionista — anzi, come individuo il nome pubblico è quello personale. *Pubblicare come individuo non rende anonimi.*

**E un alias non è praticabile** (domanda posta il 2026-08-31). Apple lo esclude alla lettera: nei campi nome e cognome va il **nome legale**, *«non alias, non soprannomi, non nomi di società»*, e usarne uno **fa ritardare l'approvazione**. Google consente un *developer name* diverso dal nome legale **solo agli account organizzazione**; per quelli personali pubblica **nome legale, paese ed email**. 🔑 **Quindi la strada dell'alias esiste ma passa dal D-U-N-S — cioè proprio quella chiusa per una ditta individuale.** E in ogni caso il **DSA** obbliga a esporre i dati del professionista: *per chi vende, l'anonimato non è un'opzione disponibile.* ⚠️ In Italia si aggiunge che la ditta di un'impresa individuale deve contenere il **cognome o la sigla dell'imprenditore**, quindi nemmeno una denominazione di fantasia lo nasconderebbe.

✅ **Quel che invece resta libero è il nome dell'app.** `LifeCouple` è il brand e non ha rapporto col nome venditore: l'utente vede il nome dell'app, l'icona e le recensioni; il venditore è una riga in fondo alla scheda — che chi la cerca **deve** poter trovare, ed è lo scopo per cui esiste. Un nome venditore diverso richiederebbe una **società di capitali**, che oggi sarebbe costo e burocrazia per una riga di testo su un'app con zero utenti. 🔑 Il precedente utile è **Heartbit S.R.L.** (*Couple Joy*): app pubblicata a nome personale nel 2022 — il package `com.angcosmin.couple` lo dimostra ancora — e società dal 2024. **Prima hanno pubblicato, poi hanno costituito la società quando i numeri l'hanno giustificata.** Entrambi gli store prevedono il trasferimento a un account aziendale: partire come individuo non chiude quella porta.

### D-80 — I documenti legali dichiarano ciò che il sistema fa, non ciò che vorremmo facesse (2026-08-31)

Scritti i cinque documenti in [`docs/legal/`](docs/legal/): informativa privacy, cookie policy, catena di cancellazione, registro dei trattamenti, procedura data breach. Adattati dai modelli in `Rule/`, che sono scritti per HeleoX — **non copiati**: LifeCouple tratta fotografie private, cronologie di luoghi e il legame fra due persone, categorie che HeleoX non tratta affatto.

🔑 **La decisione vera è una sola, ed è sulla conservazione a termine.** [`conformita.md`](docs/conformita.md) §4 la segnalava come aperta: lo scioglimento revoca ma non cancella (D-04), quindi i dati restano indefinitamente. Le due strade erano dichiarare un termine, oppure dichiarare che non c'è.

**Scelta: si dichiara che non c'è**, perché è ciò che il sistema fa realmente. L'alternativa — scrivere «cancelliamo dopo N mesi di inattività» — richiederebbe infrastruttura che non esiste, e ⚠️ **un'informativa che dichiara un termine senza la configurazione che lo applica è una dichiarazione falsa**: non un'imprecisione, una violazione. Se un termine si vuole, va **prima costruito e poi scritto**, in quest'ordine.

> È la stessa forma delle note di allineamento tecnico dell'informativa di HeleoX (2026-07-28 e 07-29), dove ogni retention dichiarata è stata resa effettiva **contestualmente** alla stesura. Qui la si applica al contrario: non si dichiara ciò che non è stato reso effettivo.

⚠️ **Quattro punti restano `[DA DECIDERE]` / `[DA VERIFICARE]` dentro i documenti, marcati e non riempiti di stime**: l'email per l'esercizio dei diritti, i dati del professionista richiesti dal DSA, la retention dei backup Supabase (va **letta** nel pannello, non stimata: finisce nell'informativa §7), e la valutazione professionale sull'art. 9. Un documento legale con un numero inventato è peggio di un documento incompleto.

✅ **E uno si è chiuso oggi**: la regione del progetto Supabase, backlog aperto dal 2026-08-12, è **`eu-central-1` (Francoforte)** — verificato con `supabase projects list`, non dichiarato. Nessun trasferimento verso paese terzo per i dati degli utenti: restano nell'UE. Fuori UE vanno solo il **testo delle ricerche** di luoghi e film, non i contenuti.

### D-79 — La pipeline di build, e perché i numeri di versione li tiene EAS (2026-08-31)

Creato [`eas.json`](eas.json) con i tre profili previsti da [`pubblicazione.md`](docs/pubblicazione.md) §4 — `development` (build di sviluppo), `preview` (APK interno), `production` (AAB per Play, IPA per App Store) — e portata `version` da `0.1.0` a **`1.0.0`** in `app.json`.

🔑 **`appVersionSource: "remote"` con `autoIncrement` sul profilo di produzione**: i numeri di build (`buildNumber` iOS, `versionCode` Android) li tiene **EAS**, non il repository. La ragione è la stessa classe di problema che questo progetto ha già incontrato quattro volte: un contatore versionato a mano si dimentica, e i due store **rifiutano un caricamento con un numero già usato**. Un rifiuto per un contatore è il tipo di errore che costa un giro di sottomissione per niente.

⚠️ **Il primo build farà uscire cose, ed è il suo scopo**: in Expo Go i dialoghi dei permessi usano l'`Info.plist` di Expo Go, quindi le tre frasi in `app.json` — calendario, posizione, foto — **non sono mai comparse a nessuno** (B-20). Sono anche **solo in italiano** su un'app bilingue per decisione esplicita (D-18): il primo build di sviluppo è il momento in cui si verificano e si traducono, chiudendo il backlog 11-quater.

⬜ **Non fatto, e va fatto dall'utente**: caricare le variabili d'ambiente come **secret su EAS** (`eas secret:create`). Sono chiavi API e non passano da qui. 🔑 È anche il rimedio strutturale al problema del 2026-08-29 — la chiave TMDB presente su un dispositivo e assente sull'altro: su EAS si caricano una volta e valgono per ogni build, da qualunque macchina.

### D-78 — La portabilità dei dati è un diritto, non una voce di roadmap (2026-08-29)

Stava nel backlog sotto **«Dopo l'MVP, non prima»**, accanto alle notifiche push e ai filtri nelle liste. 🔑 **Ma l'art. 20 non è una funzione: è un diritto**, esercitabile in qualunque momento da qualunque utente europeo, e *«arriverà in una versione futura»* non è una risposta ammessa. La collocazione nel backlog non era una scelta sbagliata: era una **classificazione** sbagliata, e finché è rimasta lì l'app non era distribuibile.

Costruita in `lib/esporta.ts` più un comando in Impostazioni. Formato **JSON**, che è insieme leggibile da una persona e da un programma — le due cose che l'articolo chiede nella stessa frase.

**Due confini, scritti dentro il file esportato e non solo nell'interfaccia**, perché il file sopravvive alla schermata che l'ha prodotto e fra sei mesi sarà l'unica cosa sotto gli occhi di chi lo apre:
- 🔑 **Solo ciò di cui l'utente è autore**, non tutto ciò che vede. È il confine di **D-21**, e non è formalismo: esportare anche i contenuti del partner permetterebbe di portarsi via i ricordi dell'altro premendo un bottone — la ritorsione che **TB-2** esiste per impedire.
- **Le foto come metadati, non come immagini.** Un JSON con dentro un gigabyte di binari non è portabilità: è un file che non si apre.

⚠️ **Scartato**: esportare tutto ciò che la coppia possiede. Sembra più generoso e sarebbe stato più semplice da scrivere — ed è esattamente il modo in cui una funzione di conformità diventa un'arma nel confine di fiducia caratteristico del prodotto.

### D-77 — La cancellazione dell'account: la regola sta nello schema, non in una funzione (2026-08-29)

Apple impone che un'app che crea account permetta di cancellarli **dall'app**. Serviva, e ha richiesto la **prima infrastruttura server del progetto** — perché eliminare una riga da `auth.users` richiede la `service_role`, e dal client è impossibile per costruzione.

🔴 **Il vincolo scoperto verificando**: delle **17** chiavi esterne verso `auth.users`, solo due avevano `on delete cascade`. Con una sola riga scritta, `deleteUser()` fallisce con violazione di chiave esterna.

🔑 **La scelta, e perché non è quella ovvia.** Una funzione che cancella tabella per tabella sarebbe stata più esplicita da leggere, e sbagliata per la ragione che questo progetto ha già incontrato quattro volte in tre giorni (**D-60**, B-24, B-28, e la guardia di sessione di **D-75**): *è una regola affidata alla memoria di chi scriverà la prossima tabella*. `lista` è nata il 2026-08-28 con un `autore_id`; la diciottesima nascerà fra un mese. La migrazione **0026** riscrive quindi i vincoli **per regola** — non nulla → `cascade`, nullable → `set null` — con un blocco che li scopre dal catalogo invece di elencarli.

⚠️ **Perché `set null` sulle tre nullable** (`invito.aperto_da`, `partita.turno_di`, `partita_round.disegnatore_id`): nessuna delle tre *appartiene* a chi vi è indicato — dicono chi ha fatto una cosa, non di chi è la riga. Cancellare un round perché chi disegnava se n'è andato distruggerebbe la partita dell'altro.

**La divisione dei poteri**: la Edge Function ha la `service_role`, cioè è l'unico punto del progetto che può fare qualunque cosa a chiunque. Least privilege non dice di evitarla — dice di **restringerla a ciò che solo lei può fare**. Tutto il resto (sciogliere la coppia, e quindi applicare D-04/D-21/D-16) passa da una funzione che gira **con i permessi dell'utente**. 🔑 E **l'id da cancellare si ricava dal token, mai dal corpo della richiesta**: accettandolo dal chiamante, chiunque avesse un account potrebbe cancellare quello di chiunque altro — e con la chiave segreta in mano alla funzione, ci riuscirebbe.

**Lo scioglimento non è riscritto: si chiama.** `sciogli_coppia()` porta con sé D-04, D-21 e D-16; riscriverne la logica avrebbe prodotto due versioni della stessa regola che divergono al primo ritocco.

⚠️ **E l'ordine è obbligato**: prima i file dello storage, poi lo scioglimento, poi la riga di `auth.users`. Il nome del file vive **dentro la riga** (`foto.chiave_storage`): cancellando prima le righe si perdono i puntatori, e i binari diventano irraggiungibili invece che cancellati — lo stato che l'art. 17 vieta, con l'aggravante che da fuori sembra riuscito. È l'ordine che `Rule/catena-cancellazione.md` imponeva già.

### D-76 — Impostazioni: la conferma dice cosa succede, non «sei sicuro?» (2026-08-29)

Fino a oggi `app/` aveva 17 schermate e **nessuna di impostazioni**: `sciogli_coppia()` esisteva nel database dal 2026-08-12 **senza interfaccia**, e l'unica cosa che si poteva fare dalla home era uscire.

Quattro voci — uscita, esportazione, invito, e le due senza ritorno — in **sezioni separate per gravità**. «Esci», «sciogli» e «cancella» si assomigliano in una lista di bottoni e hanno conseguenze incomparabili: la prima non tocca niente, la seconda toglie l'accesso ai ricordi dell'altro, la terza distrugge i propri.

🔑 **Le due conferme dicono cosa succede, voce per voce** — quali contenuti restano, quali si duplicano, cosa sparisce per entrambi. *«Sei sicuro?» non aggiunge niente a ciò che chi preme già sa*: è la stessa regola scelta il 2026-08-28 per la cancellazione di una lista, dove la conferma dice **quante voci** porta via e di chi.

⚠️ **E la più grave chiede di scrivere una parola.** Non per cerimonia: è l'unico attrito che un dito che scorre non supera per inerzia. **L'annullamento è il bottone pieno delle due strade**, perché in un bivio in cui una sola è irreversibile, quella facile da premere dev'essere l'altra.

**L'invito non è riscritto**: si riusa `useInvito`, compreso il passo di conferma di **D-14** — quello che interrompe davvero l'ingresso di un estraneo che ha aperto un link inoltrato.

### D-75 — Le schermate pre-accesso stanno in una cartella, non in un elenco (2026-08-29)

La guardia di sessione in `_layout.tsx` aveva le schermate pubbliche **scritte a mano**: `primo === 'benvenuto' || primo === 'accedi'`. Aggiungendo `registrati` e `recupera` la guardia le ha rimandate indietro **all'istante** — e il sintomo era una schermata che non cambiava, non un errore.

🔑 **È D-60 per la quinta volta in tre giorni**, e stavolta l'ho sbagliata io mentre la stavo citando. Ora le schermate pre-accesso stanno in `app/(pubbliche)/`, e **essere in quella cartella è la dichiarazione**. Il gruppo fra parentesi non cambia gli indirizzi — `/accedi` resta `/accedi` — cambia solo **chi decide**: la posizione nell'albero invece di una lista da ricordare.

### D-74 — L'accesso passa a email e password (2026-08-29)

Fino a oggi l'accesso era `signInWithOtp` con `shouldCreateUser: true`: registrarsi ed entrare erano **lo stesso gesto**, e non c'era password.

⚠️ **Era la scelta più sicura delle due, e viene abbandonata lo stesso.** Una password che non esiste non si ruba, non si riusa altrove, non si dimentica. Ma ha un costo emerso scrivendo il piano di pubblicazione: **il revisore di Apple non può ricevere il nostro codice**. Un'app che senza partner non fa niente (**D-25**) va consegnata alla revisione con un account già appaiato, e a quell'account bisogna poter entrare. Il costo è dichiarato, non nascosto: si accetta una superficie d'attacco in più per poter pubblicare.

**Due schermate distinte** invece di una che indovina: su un'app che custodisce ricordi, la differenza fra *«sto creando il mio spazio»* e *«sto tornando nel mio»* è la prima cosa che l'utente vuole sapere — e la seconda è la sola che può andare storta in modo spaventoso.

🔑 **Il codice via email non è sparito: è diventato il recupero della password.** E **non è una seconda porta d'ingresso** — col solo codice non si entra da nessuna parte: la sessione che `verifyOtp` apre viene usata **immediatamente** per imporre una password nuova. Chi arriva lì esce con una password, o non esce.

⚠️ **Scartato il link «reimposta password»**, che è la strada canonica di Supabase: porta il token nel frammento dell'URL e richiede di intercettare un deep link — un percorso d'ingresso nuovo, da provare su due sistemi operativi, che **oggi nessuno qui potrebbe provare**. Il codice fa la stessa cosa con un meccanismo già in uso e funzionante.

⚠️ **Conseguenza per gli account esistenti**: chi è nato col codice **non ha una password**. Deve passare da «Ho dimenticato la password» per dargliene una la prima volta. Non è un difetto: è la migrazione, e non richiede nulla lato database.

### D-73 — Un evento senza foto prende in prestito l'immagine del suo posto

**Chiesto dall'utente** il 2026-08-28: se un evento non ha immagini ma ha un luogo, la pagina dell'evento usa come copertina **l'immagine di default del luogo**; la vista **Diario** del calendario resta com'è.

**Prima**: un evento senza scatti mostrava una sfumatura rosa. Se però ha un posto, quel posto **una sua immagine ce l'ha** — quella di Google — e usarla dice *dove eravate* anche prima che esista una foto vostra.

## ⚠️ La scelta vera: **quale** immagine del luogo

La scheda di un luogo, in lista, usa questa scala: foto scelta a mano → **foto delle vostre serate lì** → Google. Verrebbe naturale riusarla identica.

🔑 **Sarebbe sbagliata proprio qui**, e per una ragione che non è tecnica: quelle sono foto di **altre** serate. Messe in testa a *questa* pagina si leggerebbero come scatti di *questo* evento — un ricordo attribuito alla data sbagliata, e per giunta senza che niente lo segnali. La foto di Google non ha il problema: non è di nessuno e non è di nessuna sera, è **l'immagine del posto**.

*Una copertina che mente sul giorno è peggio di nessuna copertina.*

## Perché il Diario resta com'era, e non è pigrizia

Là le anteprime dicono **quali serate avete fotografato**. Riempirle con l'immagine del posto renderebbe tutte le righe uguali — cioè toglierebbe esattamente l'informazione che quella vista dà. Due schermate che mostrano lo stesso dato per scopi diversi possono, e a volte devono, mostrarlo in modo diverso.

## Due strade verso lo stesso posto, di nuovo

⚠️ `foto_google` sta su **`elemento_lista`**, non su `luogo` (è lì da 0013), quindi non basta la query del luogo. E si cerca per **entrambe** le strade — `elemento_id` e `luogo_id` — perché **B-12** aveva già trovato che un evento punta al posto in due modi: guardarne una sola avrebbe fatto comparire la copertina **su metà degli eventi**, cioè il difetto che sembra casuale e che nessuno riesce a riprodurre.

## 🔴 E un difetto trovato prima di spedirlo, in una funzione vecchia

Scrivendo il ripiego è emerso che **`urlFotoGoogle('')` non restituiva `undefined`**: costruiva un URL valido verso una risorsa inesistente. Chi la chiamava con un nome vuoto non otteneva «nessuna foto» — otteneva **un'immagine rotta**, e il ripiego previsto (la sfumatura) non scattava mai.

⚠️ I due chiamanti esistenti si guardavano da soli con un `? :`, quindi il difetto non si era mai visto. 🔑 **Ed è proprio per questo che valeva chiuderlo nella funzione**: una funzione che si comporta bene *solo se chi la chiama se ne ricorda* è la forma di D-60, e il prossimo chiamante non ha modo di saperlo. Ora accetta `null | undefined` e restituisce `undefined` per qualunque nome vuoto.

### D-72 — Sulla mappa tornano tutti i posti, e a distinguerli è l'icona

**Chiesto dall'utente** il 2026-08-28: sulla mappa devono comparire **tutti** i luoghi — quelli in programma con il calendario **bianco**, quelli dove si è stati con il calendario **rosa**, e i desiderati con un'icona a scelta.

## È un cambio di idea rispetto a D-70, e va detto così

D-70 aveva tolto dalla mappa i posti desiderati, perché *«la mappa è il registro di dove siete stati»*. Il ragionamento reggeva, ma aveva un effetto che si vede solo usandola: **nascondeva i desideri proprio sulla superficie che serve a decidere dove andare**.

🔑 L'icona risolve lo stesso problema — *non confondere un ricordo con un desiderio* — **senza togliere informazione**. Fra due soluzioni a un problema di confusione, quella che distingue batte quella che nasconde, quasi sempre. D-70 aveva scelto l'altra.

⚠️ **Ma il filtro non sparisce: si sposta.** Resta nell'**elenco** (B-27), e ora le due viste divergono **di proposito**: nella mappa si guarda, nell'elenco si agisce, e un elenco di cose su cui agire non deve contenere ciò che non si può ancora toccare. È anche la ragione per cui il filtro non poteva più stare in `useLuoghi`: da lì valeva per entrambe.

## I tre stati, e l'ordine fra loro è una decisione

1. **visitato** → calendario **bianco** su pin **pieno** — è un fatto compiuto;
2. **in programma** (almeno una serata **futura**) → calendario **rosa** su pin **chiaro** — c'è, ma non è ancora successo;
3. **desiderato** → **segnalibro** grigio — messo da parte, senza una data.

⚠️ **La corrispondenza è stata invertita su richiesta dell'utente**, poche ore dopo la prima stesura: all'inizio il bianco stava sul programmato e il rosa sul visitato. La riga qui sopra con la richiesta originale è lasciata com'era — è ciò che era stato chiesto allora, e riscriverla farebbe sparire il ripensamento.

🔑 **E l'inversione non è di un attributo solo: colore dell'icona e riempimento del pin sono una scelta sola.** Un'icona bianca ha bisogno di un fondo pieno e una rosa di un fondo chiaro; invertirne una senza l'altra produce bianco-su-bianco o rosa-su-rosa, cioè **un pin vuoto**. Chi tocca quei rami li tocca a coppie.

🔑 La scala che ne esce si legge da sé: **pieno = è successo**, **contornato = non ancora**, **grigio = nemmeno in programma**. Il peso visivo segue la **certezza del fatto**, non la sua urgenza — che è la lettura giusta per una mappa che è prima di tutto un registro.

🔑 **`visitato` vince quando un posto è entrambi** (ci tornate): la mappa è prima di tutto il registro di dov'è stata la coppia, e *«ci siamo stati»* è un fatto mentre *«ci andremo»* è un'intenzione. Se servisse il contrario, è l'ordine dei tre rami a cambiare — nient'altro.

⚠️ **Il segnalibro non è un `MapPin`**: dentro un pin, un'icona a forma di pin è una ripetizione che non dice niente. «Messo da parte» è invece esattamente lo stato.

⚠️ **«In programma» non si deduce dal conteggio degli eventi**, ed è la trappola di questa modifica: quel numero comprende anche le serate passate, quindi un posto dove siete stati tre volte avrebbe lo stesso conto di uno dove andrete domani. Serve guardare le **date**, e il confronto è con l'istante del render e non con la mezzanotte — arrotondare al giorno avrebbe fatto sparire l'icona bianca la mattina stessa della serata, cioè proprio quando serve.

⚠️ **Nota di manutenzione**: le prop nuove sono state dichiarate **anche in `mappa-vera.tsx`**, la variante web che non disegna pin e non le usa. È quel file che TypeScript legge per controllare le chiamate — il `.native.tsx` lo vede solo il bundler — quindi le due firme vanno tenute allineate o il codice giusto non compila.

### D-71 — I due elenchi si separano davvero: la wishlist si modifica, la mappa si guarda e basta

**Chiesto dall'utente** il 2026-08-28, subito dopo aver provato D-70: nell'elenco dei luoghi non si devono poter **cancellare** posti, perché contiene quelli legati agli eventi; sulla wishlist si aggiunge e si toglie liberamente; e le tre liste di partenza non si devono poter eliminare.

## Il confine di D-70 era giusto e applicato a metà

D-70 aveva detto *«la mappa è un registro»* e aveva filtrato **i pin**. Ma la stessa sezione ha anche un **elenco**, che legge da un'altra parte (`elemento_lista`, non `luogo`) — e quello mostrava ancora tutto, cancellazione compresa.

🔑 *Quando una regola riguarda un dato, va messa dove il dato si legge; se le letture sono due, i posti sono due.* Filtrare una vista sola non è una regola applicata a metà: è **una regola che non c'è**, perché la vista sbagliata basta a smentirla.

**Ora sono due modalità dichiarate**, non due comportamenti impliciti:
- **dentro una wishlist** — si aggiunge, si spunta, si cancella;
- **dentro la mappa** — solo i posti visitati o con una serata, e **niente spunta, niente cestino, niente copertina**.

⚠️ **E la ragione per cui il cestino sparisce è più forte dell'estetica**: quei posti sono citati da eventi. Cancellarne uno da lì non toglie una riga da un elenco — toglie **il posto a una serata che lo nomina**. La wishlist può permetterselo perché lì un posto non è ancora legato a niente.

🔑 **La spunta sparisce invece di restare inerte.** Un tondo che non risponde al dito si legge come un'app rotta, non come «qui non si tocca» — è la lezione di `premibile.tsx`, e B-22 ha già mostrato quanto costa ignorarla.

## Le tre liste di partenza non si cancellano (0025)

«Film», «Viaggi» e «Ristoranti» non sono liste come le altre: sono **la struttura** su cui poggiano due schermate. Cancellarne una non toglie una lista, toglie **il posto dove finiscono le cose**.

🔴 **E questo contraddice una nota che avevo scritto in 0023**, dove sostenevo il contrario — *«una lista che non si può togliere è un pezzo di arredamento»*. Il ragionamento era coerente ma **partiva da un prodotto diverso**: allora «Film» era l'unico default e i luoghi vivevano ancora sulla mappa. Con D-70 le liste di partenza sono diventate l'unico ingresso per i desideri.

🔑 La lezione non è «avevo torto»: è che **una decisione giusta smette di esserlo quando cambia ciò su cui poggiava**, e il modo di accorgersene è rileggere le note vecchie invece di fidarsene. La nota in 0023 resta, col rimando a 0025: cancellarla nasconderebbe il cambio di idea, che è l'informazione più utile delle due.

**Il divieto vive nel database**, come trigger. ⚠️ Nascondere il bottone non è una protezione, è un suggerimento: chiunque parli all'API con un token valido cancella la riga lo stesso, ed è il modello di attaccante che il threat model descrive (TB-1).

⚠️ **Un trigger e non una policy più stretta**, ed è la scelta che conta: una policy filtrerebbe la riga **in silenzio** — zero righe, `error: null` — cioè B-23 di nuovo. Un'eccezione arriva al client **come errore**, e si può tradurre in una frase. *Quando il rifiuto va spiegato, non va nascosto in un filtro.*

⚠️ E `predefinita` è **una colonna**, non il nome: riconoscerle da `nome in ('Film','Viaggi','Ristoranti')` avrebbe perso la protezione alla prima rinomina e l'avrebbe regalata a una lista creata a mano con lo stesso nome.

**Nell'interfaccia** il comando «Elimina» non compare, e resta un solo «Apri» a tutta larghezza — **la stessa forma già usata per la carta «+»**: la riga non si sposta, cambia cosa si può fare. Sotto, una frase dice *perché* manca, invece di lasciare che si scambi per un guasto.

### D-70 — La mappa diventa il registro di dove siete stati, e i desideri passano alle wishlist

**Chiesto dall'utente** il 2026-08-28: togliere la possibilità di aggiungere luoghi dalla mappa e dall'elenco; nella sezione Luoghi mostrare **solo i posti visitati o collegati a eventi**; mettere i posti desiderati in due wishlist di default, «Viaggi» e «Ristoranti»; e far comparire un posto nei Luoghi **automaticamente** quando viene spuntato o quando la sua serata è passata.

## Perché è un cambio di modello e non di schermata

Prima la mappa era **due cose insieme**: i posti dove siete stati e quelli dove vorreste andare, distinti da un campo `stato` e da un pin di colore diverso.

🔑 **Ma i due hanno cicli di vita diversi.** Un posto *desiderato* si aggiunge, si rimanda, a volte si cancella. Un posto *visitato* non cambia più: ci siete stati, e resta. Tenerli nello stesso elenco obbligava **ogni schermata a filtrare**, e ogni filtro dimenticato mostrava desideri in mezzo ai ricordi. Ora il confine lo dice **il posto in cui la riga vive**, non un campo che qualcuno deve ricordarsi di controllare — che è ancora D-60: *se il dato è deducibile dalla posizione, si deduce.*

✅ **E il passaggio fra i due mondi esisteva già**, che è il segno migliore che il confine è nel punto giusto: spuntare «fatto» su una riga di lista **scrive già `luogo.stato`** (`segnaFatto`, dal 2026-08-13), e `aggiorna_ristoranti_visitati` (0015/0016) spunta da sé i posti la cui serata è passata. Non è stata inventata nessuna promozione automatica: c'era, e adesso ha un significato visibile.

## Le porte chiuse sono due, non una

Il «+» della mappa è stato **rimosso**, non nascosto — e con lui il foglio che apriva.

🔴 **E ce n'era un secondo**, che il primo giro di modifica non aveva visto: nella variante **senza componente mappa** (il web) c'era un bottone «aggiungi un posto» che apriva lo stesso foglio. Togliere solo il «+» avrebbe lasciato aperta esattamente la strada che si voleva chiudere, **e per giunta sul web** — cioè dove nessuno prova, quindi dove sarebbe sopravvissuta.

🔑 *Trovato un difetto per forma, si cerca la forma.* È la stessa regola di B-17, applicata a una rimozione invece che a una correzione: quando si toglie una strada, si cercano **tutte** le sue imboccature.

⚠️ E lasciare il bottone «tanto poi filtriamo» avrebbe ricreato le due strade che **D-64 aveva appena finito di cancellare**, con la stessa conseguenza già scritta lì: *una strada che nessuno percorre non viene aggiornata quando cambia lo schema, e chi la trova fra sei mesi la ricollega credendola equivalente.*

## Cosa mostra la mappa, esattamente

`stato = 'visitato'` **oppure** almeno un evento — anche **futuro**, perché una serata già in calendario è un posto che vi riguarda già, e vederlo sulla mappa è metà del motivo per cui la mappa esiste.

⚠️ **Il secondo legame evento→posto non viene controllato, ed è voluto.** B-12 aveva trovato che un evento punta al luogo in due modi (`luogo_id` e `elemento_id`), e verrebbe da filtrare su entrambi. Non serve: la strada per `elemento_id` passa da `elemento_lista`, e spuntare quella riga scrive già `luogo.stato`. Quel caso è **già coperto dalla prima condizione** — e aggiungere un secondo controllo darebbe l'impressione di due regole dove ce n'è una.

## I posti che c'erano non si perdono

La migrazione **0024** assegna a una wishlist **tutti** i luoghi esistenti, visitati compresi — non solo i desiderati. ⚠️ Un posto visitato che non stesse in nessuna lista sarebbe visibile **solo** sulla mappa, e la sua scheda con le recensioni diventerebbe irraggiungibile. *Cambia dove si guarda, non cosa esiste.*

I ristoranti vanno in «Ristoranti» (la condizione ricalca `eRistorante()`, che accetta l'intera famiglia — sono `bar` e `cafe` i casi più comuni di una serata), tutto il resto in «Viaggi».

🔑 ⚠️ **E le due `update` non si possono invertire**: la seconda prende «tutto il resto», e il resto è definito da *ciò che la prima ha già sistemato*. Invertirle avrebbe messo i ristoranti in «Viaggi» e poi non li avrebbe più trovati. **L'ordine è il significato**, non lo stile.

## I colori: la prima regola non reggeva

**Chiesto**: ogni lista di colore diverso, ripetizioni ammesse ma non fra vicine.

🔴 La prima stesura (D-68) prendeva `pastelli[liste.length % 4]`. Sembra un giro regolare e non lo è: **basta cancellare una lista** perché il conteggio torni indietro e la successiva nasca dello stesso colore di quella che ora le sta accanto.

🔑 **Il ciclo garantisce di non ripetersi *contando*, non di non ripetersi *in fila*** — e in fila è l'unica cosa che conta, perché il colore serve a distinguere due carte vicine senza leggerne il nome. La regola ora si scrive per ciò che deve ottenere: **diverso dagli ultimi due**. Due e non uno: con quattro tinte, evitare solo la precedente lascia passare A-B-A, che nel carosello si legge come un motivo invece che come tre cose diverse.

⚠️ E le tre liste di default nascono con **tre colori assegnati a mano** nella migrazione, non col default della colonna: nascono insieme, quindi finirebbero adiacenti e identiche — esattamente il difetto che il colore doveva evitare.

### D-69 — La lista «Film» c'è sempre, le locandine arrivano da sole, e le recensioni c'erano già

**Chiesto dall'utente** il 2026-08-28: una lista di default «Film» in cui scrivere i titoli da vedere, con la **copertina presa in automatico «da Google»**, e la possibilità per entrambi di lasciare **recensione e voto in stelle** una volta spuntato il film.

## Un terzo della richiesta era già fatto, e dirlo vale più che rifarlo

✅ **Le recensioni esistono dal 2026-08-12 e fanno già esattamente questo**: `recensione` ha il vincolo `unique(elemento_id, autore_id)` — *due persone, due opinioni, nessuna sovrascrive l'altra* — e `components/scheda-elemento.tsx` mostra cinque stelle **toccabili solo se sono le proprie**, ferme se sono del partner, con il testo accanto. E compaiono **alla spunta di «fatto»**, che è la condizione chiesta, con questo commento già in codice: *«prima non c'è niente da recensire, e chiederlo sarebbe rumore»*.

🔑 **Non è stato riscritto niente.** La cosa utile qui non è il codice risparmiato: è che una funzione già costruita e mai vista può essere richiesta come se non esistesse — e se si costruisce di nuovo, si costruisce **una seconda strada** verso lo stesso dato. È B-19 evitato leggendo prima di scrivere.

## Google non ha un'API per le locandine: si usa TMDB

🔴 **La richiesta non era soddisfacibile alla lettera.** Google Places serve i *luoghi*; per il cinema non esiste un equivalente, e la Knowledge Graph Search API è deprecata e non restituisce poster utilizzabili. La fonte di fatto è **TMDB** — la stessa indicata poche ore prima nella risposta sulle liste Netflix, e quella che sta dietro a JustWatch e Letterboxd.

Quindi: **soddisfatta la sostanza** (*«scrivo il titolo e la copertina arriva»*), **non la lettera** (*«da Google»*). Va scritto qui perché fra sei mesi «la copertina viene da Google» sembrerà vero leggendo la richiesta e falso leggendo il codice.

⚠️ **E porta un debito identico a quello della chiave Google**, dichiarato subito invece di essere scoperto dopo: la chiave `EXPO_PUBLIC_TMDB_KEY` **vive nel bundle**, quindi va dietro una Edge Function prima di utenti veri. E 🔴 **TMDB è gratuito per uso NON commerciale**: se si attivasse il listino di `Marketing/LifeCouple/monetizzazione.md`, la licenza va verificata **prima**.

## La lista «Film» nasce con la coppia, come la creatura

0022 creava «Film» **solo per le coppie che avevano già dei film**: era una lista di *migrazione*, non di *default*. Una coppia nuova apriva Liste e trovava il vuoto.

🔑 **La forma giusta era già nello schema dal 2026-08-12**, scritta per un'altra cosa: *«La creatura nasce con la coppia: mai una coppia senza creatura»* — un trigger su `coppia`. Qui vale identico, e per la stessa ragione: **ciò che deve esistere sempre non si crea dal client**, perché il client può dimenticarsene, fallire a metà, o non essere ancora stato scritto.

⚠️ **Il trigger da solo non basta**: copre le coppie future, non quelle già nate. Serve anche il riempimento all'indietro — *la regola nuova vale da adesso, i dati vengono dal passato*, che è B-21 letto in positivo per la seconda volta in due migrazioni.

## Una lista dichiara cosa contiene, invece di farlo indovinare

La schermata di una lista aperta deve sapere **come si aggiunge una voce**: scrivendo, o scegliendo da una tendina con le locandine. L'alternativa era dedurlo dal **nome** — *«se si chiama Film allora è di film»* — che si rompe con «Filmoni», in inglese, e alla prima rinomina.

🔑 Da qui `lista.tipo`. È **D-60 riportato allo schema**: *se il dato serve, si dichiara; non si deduce da un indizio che può cambiare.*

⚠️ **Limitazione dichiarata**: oggi **non si può creare una seconda lista di film**, perché il foglio di creazione non chiede il tipo. La colonna però esiste, quindi aggiungere quella scelta è una riga di interfaccia e non una migrazione. Sta nel backlog.

⚠️ **E le liste «Film» nate da 0022 vanno promosse a `tipo = 'film'`**, altrimenti succede la cosa più beffarda: la ricerca funziona per chi *non* aveva film e non per chi ne aveva.

## Le due colonne, e perché non se ne riusano due che c'erano

`tmdb_id` e `locandina` sono nuove. Mettere l'identità TMDB in `google_place_id` e il poster in `foto_google` sarebbe stata **la stessa bugia nello schema** che 0022 aveva rifiutato di scrivere per `tipo`: chi legge `foto_google` fra sei mesi si aspetta un nome-risorsa di Google Places.

⚠️ **La locandina è un percorso, non un file.** Salvare l'immagine consumerebbe il tetto di 1 GB (D-22) per una figura che TMDB serve già da CDN. Costo dichiarato: se TMDB cambia i percorsi le locandine si rompono tutte insieme — accettabile perché **non è un ricordo della coppia**, è la copertina di un film e si ripesca.

## Due strade per aggiungere un film, e una è una scommessa

- **La tendina** è la strada buona: si sceglie fra film veri, con la locandina già visibile nella riga — che è ciò che distingue due film omonimi, cioè il caso in cui la tendina serve davvero. È D-37 applicato al cinema.
- **La riparazione automatica** cerca la locandina per i titoli scritti a mano e prende il **primo risultato**. ⚠️ È una scommessa: «Dune» sono due film, e TMDB ordina per popolarità, non per *quello che intendevate voi*. Chi vuole essere sicuro sceglie.

⚠️ **E chi è già stato tentato non si ritenta**, come per le copertine dei luoghi: senza quel registro, un film che TMDB non conosce resterebbe per sempre fra i «senza locandina» e la ricerca ripartirebbe a ogni modifica dell'elenco — una richiesta in un ciclo che non converge.

### D-68 — «Liste» smette di essere una categoria decisa da noi e diventa una cosa che si crea

**Chiesto dall'utente** il 2026-08-28: *«vorrei che la parte "preferiti" diventasse wishlist. L'interfaccia deve essere simile a quella dei giochi con le card che scorrono e per ultima ci deve essere una card "+" che permette di creare una nuova lista. Sotto ci devono essere 2 pulsanti: "elimina" e "apri". Aprendo una wishlist è possibile aggiungere delle voci.»*

**Cosa c'era prima, e perché non reggeva più.** La sezione si era già chiamata «Preferiti» (nome sbagliato, corretto da **D-47**) e poi «Liste», ma dopo che **D-51** aveva portato i luoghi dentro la mappa era rimasto **un elenco solo**: i film. Una sezione al plurale con dentro una cosa sola non è una sezione — è un residuo di due riorganizzazioni che nessuno ha ridiscusso fino in fondo. Ora l'elenco lo decide la coppia.

**Lo schema: `lista` nuova, e `lista_id` su `elemento_lista`** (migrazione **0022**).

🔑 **La tentazione era una tabella `voce_wishlist` pulita, e sarebbe stata l'errore di B-19 fatto in schema.** `elemento_lista` ha già la transizione `desiderato → fatto`, ed è *quella* transizione che alimenta la creatura (D-15) tramite un trigger. Una tabella separata avrebbe richiesto un **secondo trigger dei punti** — cioè due strade per guadagnarli, che non restano uguali: divergono al primo ritocco, e la differenza si scopre mesi dopo notando che la creatura cresce solo per metà delle cose fatte. Stessa ragione per le recensioni, che pendono già da `elemento_lista` col vincolo «una per persona».

⚠️ **Il prezzo del riuso, dichiarato**: `lista_id` è **nullable**, e il null vuol dire *«è un luogo della mappa»* (D-46), non *«dato mancante»*. È una colonna obbligatoria per metà tabella e vietata per l'altra metà. Il `not null` che sembrerebbe la stretta ovvia **non si può mettere**, ed è scritto nella migrazione perché nessuno ci provi credendo di correggere una svista.

**Un tipo nuovo, `voce`**, accanto a `film` e `luogo`. Una wishlist contiene quello che vuole la coppia — «prendere il passaporto», «regalo per mia sorella» — e riusare `film` per non aggiungere un valore sarebbe stata **una bugia scritta nello schema**, di quelle che fanno filtrare male qualcun altro fra sei mesi. ⚠️ È un **allargamento** del `check`, non una stretta: non ha il problema di B-21, perché nessuna riga esistente lo viola.

**I film che c'erano prima non restano orfani.** La migrazione crea una lista «Film» per ogni coppia che ne ha e ce li attacca. 🔑 Senza quel passo i film sarebbero rimasti nel database ma **in nessuna lista**, cioè spariti dall'app pur esistendo — la forma peggiore di perdita di dati, perché non la segnala nessuno: chi non sapeva che c'erano non li cerca, e chi lo sapeva pensa di ricordare male. È B-21 letto in positivo: *sistema i dati nella stessa migrazione che cambia le regole.*

## Il nodo di interfaccia: cosa fanno i due comandi sulla carta «+»

L'hub dei giochi (**D-62**) poggia su una regola esplicita — *i comandi restano due, sempre gli stessi, fermi in fondo* — e qui l'ultima carta del mazzo **non è una lista**: è il gesto per crearne una. «Elimina» su quella carta non significa niente.

🔑 **La regola parla di posizione, non di etichetta.** Ciò che non deve accadere è che scorrendo i comandi si spostino e li si debba ritrovare. Quindi sulla carta «+» la riga resta **nello stesso posto e della stessa altezza**, e contiene un comando solo a tutta larghezza. *Cambia cosa si può fare, non dove si preme.*

⚠️ **E la carta «+» non è toccabile**, come nessuna carta di nessuno dei due caroselli. Renderla premibile era la cosa naturale da fare ed è precisamente **l'errore di D-64**: due strade per lo stesso gesto. Una strada, quella in fondo.

**«Apri» è pieno, «Elimina» è di vetro** — dopo **B-22** il pieno va all'azione primaria, e l'azione primaria di questa schermata è aprire. ⚠️ Nel foglio di conferma il rapporto **si inverte**: lì il bottone pieno è «Annulla», perché il pieno è quello che il pollice trova per primo e su una cancellazione deve trovare la via d'uscita.

**La conferma dice quante voci si porta via**, e che possono essere del partner. *«Sei sicuro?»* non è una domanda: non aggiunge niente a quello che chi preme già sa. Il numero sì — è l'unica cosa che può fargli cambiare idea.

⚠️ **Cancellare è solo-autore, ed è una scelta.** La policy segue quella già in vigore sui singoli elementi. Il costo è lo stesso già accettato (se uno sbaglia, l'altro non corregge); il beneficio qui è più grande, perché una lista è **un contenitore che riempiono in due**. Fra «chiunque può cancellare il lavoro di entrambi» e «solo chi l'ha creata può», la seconda sbaglia dalla parte giusta.

🔑 **E la cancellazione rilegge quante righe ha toccato**, perché un `delete` negato dalla RLS torna con `error: null` e zero righe — **B-23 nella sua forma esatta**. Senza quel controllo l'app direbbe «fatto» e la lista resterebbe lì, e chi ha premuto leggerebbe un guasto casuale invece di un permesso.

**La schermata aperta riusa `ElencoElementi`** invece di avere un elenco suo, più semplice. Sarebbe bastato per le voci scritte a mano — ma i film migrati hanno copertina, recensioni e punti, e un elenco nuovo li avrebbe mostrati come righe nude: **funzioni che spariscono dall'interfaccia restando nel database**, senza un errore e senza un test che fallisca.

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

### B-50 — L'illustrazione non compariva e i pallini restavano indietro: lo stato non seguiva lo scorrimento (2026-09-04, CORRETTO)

**Il sintomo**: nella spiegazione d'ingresso, premendo «Avanti» i **pallini avanzano** ma il contenuto si sposta solo di poco e si ferma **fra due pagine**, con l'illustrazione fuori campo. Riproducibile con tocchi distanziati di 1,5 secondi, quindi **non** è una questione di tocchi ravvicinati.

**Cosa è stato misurato** (e non dedotto): il contenitore scorrevole ha `clientWidth 375`, `scrollWidth 1500` — coerente con quattro pagine da uno schermo — `scroll-snap-type: x mandatory`, e dopo `scrollTo({x: 375})` si ferma a **113**. Lo `scroll-snap` non recupera, perché si applica dopo un gesto e non dopo uno scorrimento programmatico.

🔑 **La lezione, che vale più della correzione**: le prime due ipotesi erano sbagliate ed **entrambe erano state scritte nel codice come se fossero la causa**. La prima (`setPagina` non sincrono, quindi il secondo tocco legge una pagina vecchia) descriveva un problema **reale ma non questo**; la seconda (due `scrollTo` animati che si annullano) è stata smentita dal fatto che il difetto compare anche con un solo tocco per volta. ⚠️ Entrambe erano state «verificate» leggendo `scrollLeft` di un elemento trovato per euristica — che riportava `0` mentre il contenuto era **visibilmente** spostato. *Una misura che non concorda con ciò che si vede non è un dato: è un secondo difetto da diagnosticare, e finché non lo si fa ogni correzione che ne discende è cieca.*

**Stato**: il codice è tornato alla forma **vista funzionare** (le quattro pagine si rendono correttamente e lo scorrimento col dito le raggiunge); resta il solo `paginaRef`, che corregge una race vera e non tocca il layout. Le correzioni tentate — misure fisse al posto di `flex`, salto senza animazione — **sono state ritirate**: non risolvevano, e lasciarle avrebbe significato tenere in repo del codice con la motivazione sbagliata scritta accanto.

🔴 **Da guardare per primo sul telefono**, perché è lì che si decide se sia un difetto o un artefatto: su iOS il paging di `ScrollView` è **nativo**, non è `scroll-snap` del CSS, e `scrollTo` passa da UIScrollView. Molto probabilmente lì funziona, e in quel caso è un difetto della sola preview web — da dichiarare, non da correggere. **Lo scorrimento col dito è comunque il gesto principale** e funziona.

**✅ CORRETTO in giornata.** La causa vera era una sola, e nessuna delle due ipotesi precedenti: **`onMomentumScrollEnd` scatta solo quando lo scorrimento ha inerzia.** Uno scorrimento che non ne ha — trascinare e lasciare fermi, o uno spostamento programmatico — non lo fa scattare mai, quindi lo stato `pagina` restava indietro rispetto a ciò che si stava guardando.

🔑 **E il sintomo era doppio, il che ha reso la diagnosi più difficile di quanto fosse**: `pagina` non serve solo ai pallini, è anche ciò che dice a ogni illustrazione **se è quella guardata**. Con lo stato fermo, l'illustrazione della pagina raggiunta non riceveva mai `attiva`, non partiva, e restava a opacità zero — cioè **invisibile**. Si vedeva una pagina "vuota" col solo testo, e sembrava un problema di scorrimento quando era un problema di stato.

**La correzione**: `onScroll` con `scrollEventThrottle`, **in aggiunta** a `onMomentumScrollEnd` e senza toccare il layout, aggiornando solo quando la pagina cambia davvero.

**Verificato in preview** dopo la correzione: scorrendo di una pagina, `scrollLeft` arriva esattamente a 375 su pagine da 375, **i tre pin della mappa compaiono** e il pallino attivo è il secondo. Prima della correzione, stessa azione: pin assenti e pallino fermo sul primo.

⚠️ **Resta da provare sul telefono** il bottone «Avanti» (voce 000000-c-bis): là il paging è nativo e `scrollTo` passa da UIScrollView, quindi il comportamento può essere diverso da quello della preview in entrambe le direzioni.



### B-49 — L'importazione dal calendario era rotta da SDK 57, e sarebbe rimasta a caricare per sempre (2026-09-03, CORRETTO — da provare sul telefono)

**Il sintomo che non si è visto**, perché nessuno ha aperto quella schermata dopo l'aggiornamento: «Importa dal calendario» sarebbe rimasta a caricare **all'infinito**, senza errore.

**La causa, doppia.**

1. In `expo-calendar` 57 le tre funzioni usate da `lib/importa.ts` — `requestCalendarPermissionsAsync`, `getCalendarsAsync`, `getEventsAsync` — sono state spostate dietro il sottopercorso `expo-calendar/legacy`. Quelle importate da `expo-calendar` esistono ancora **nei tipi**, marcate `@deprecated … This method will throw in runtime`, e la loro implementazione è letteralmente `throw errorOnLegacyMethodUse(...)`. 🔑 **Per questo `tsc` non ha visto niente**: un `@deprecated` non è un errore di tipo, e il controllo che sarebbe servito — aprire la schermata — non era fra quelli fatti.
2. In `app/importa.tsx` la chiamata a `chiediPermesso()` era **fuori** dal `try/catch`. L'eccezione diventava una promise rifiutata e non gestita, lo stato restava `'attesa'`, e la schermata **non finiva mai di caricare**. 🔑 *Un errore non gestito non produce un errore visibile: produce una schermata che non finisce*, che è il sintomo più difficile da diagnosticare — e sarebbe stato letto come «lentezza» o «l'app si è impallata».

**Le correzioni**: import da `expo-calendar/legacy` (una riga), e il permesso dentro il `try` insieme al resto. Il messaggio d'errore ora usa `e.message` invece di `String(e)`, che su un `Error` stampava il prefisso `Error:` davanti alla frase.

**Perché non la nuova API**: `getCalendars()` / `listEvents()` **non sono disponibili in Expo Go** (`ExpoGoCalendarNextStub` lancia). Con tutto il collaudo su Expo Go, migrare oggi significherebbe rendere l'importazione non provabile. Nel backlog per il primo development build.

**Come è stato verificato**: leggendo il **sorgente** del pacchetto installato (`build/legacyWarnings.js`, `build/ExpoCalendar.js`, `package.json` con l'export `./legacy`), non un changelog; e compilando il bundle web, che è la prova che `expo-calendar/legacy` si risolve davvero. ⚠️ **Non provato su un telefono**: serve aprire «Importa dal calendario», concedere il permesso e vedere l'elenco. È in cima al PUNTO DI RIPRESA.

🔑 **La lezione, che vale oltre questo difetto**: l'aggiornamento a SDK 57 era stato dichiarato *«verde a compilazione e contro il database»* con l'avvertenza che il telefono non aveva visto niente. Questo è il primo pezzo di quell'avvertenza che si è materializzato, ed era in una schermata che **non compariva nella lista dei controlli mirati** — la lista era stata fatta a partire da ciò che l'aggiornamento *toccava* (vetro, foto, date, mappe), non da ciò che *usa un pacchetto Expo*. Le due liste non coincidono.

### B-48 — Una partita in corso non si poteva abbandonare, e «Gioca» la riprendeva dal round in cui era rimasta (2026-09-02 seconda sessione, CORRETTO — da verificare sul telefono)

*«Indovina il disegno parte dal round 2»*.

**La causa, con ogni probabilità.** Non un round saltato: la partita bloccata da B-47 era rimasta `in_corso` col round 1 già chiuso e i due «continua» premuti. Riaperto il gioco, `apri` l'ha trovata viva e — giustamente, D-88 e D-90 — ci è rientrato: con la correzione di B-47 chi disegnava ha visto «che cosa disegni?» per il round **2**. Dal telefono la cosa si legge come «parte dal round 2». E non c'era modo di fare altrimenti: dentro un gioco la X faceva solo `router.back()`, l'anticamera con «Annulla la partita» non si vede più una volta partiti, quindi **una partita in corso si poteva solo finire**. Un gioco bloccato, o lasciato a metà, diventava l'unico gioco possibile.

⚠️ **Non verificata sui dati**: la RLS non lascia leggere le partite della coppia dall'esterno, quindi la sequenza è dedotta dal codice e dal racconto, non letta dal database. L'alternativa che spiegherebbe lo stesso sintomo in una partita **nuova**: il round 1 chiuso all'istante per «tempo scaduto» da un telefono con l'orologio avanti di almeno un minuto — il conto alla rovescia è `Date.now() - iniziato_il`, con `iniziato_il` scritto dal server. Improbabile su un telefono con l'ora automatica, ma se il sintomo ricapitasse su una partita appena creata è la prima cosa da guardare.

**La correzione** (i quattro `app/gioco/*.tsx`, `lib/i18n.ts`): la X dentro il gioco apre un `Alert` — lo stesso mezzo di «elimina foto» — con tre scelte scritte per esteso: **«Resta»**, **«Esci, la partita resta»** (indietro, la partita continua a esistere per tutti e due) e **«Annulla la partita»** (`abbandona`, finisce per tutti e due). Uscire e abbandonare sono due cose diverse e vanno dette entrambe: prima l'app ne offriva una sola, e la chiamava con l'icona dell'altra.

**Come è stato verificato**: `tsc` e `lint` puliti. ⚠️ Sul telefono: la X in partita deve chiedere; dopo «Annulla la partita», «Gioca» deve ripartire dal round 1 in attesa. Se una partita **nuova** partisse ancora dal round 2, la causa è l'altra (l'orologio), non questa.

### B-47 — Il disegno personalizzato si fermava fra un round e l'altro, con i due «continua» premuti (2026-09-02 seconda sessione, CORRETTO — da verificare sul telefono)

*«Stavo giocando al gioco dei disegni in versione personalizzata e si è bloccato anche se entrambi i giocatori hanno premuto continua»*.

**La causa.** Nella versione ufficiale il round nuovo lo crea un effetto, quando hanno premuto «continua» tutti e due. Nella personalizzata quell'effetto si ferma apposta (D-19: la parola la dichiara chi disegna) e il round lo crea `dichiara`, che vive nella schermata «che cosa disegni?». Quella schermata compariva solo con `!esitoRound`: vero al **primo** round, perché non c'è un round precedente, e **mai più** — dal secondo in poi l'esito del round appena chiuso c'è sempre, e nella versione ufficiale sparisce solo perché l'effetto crea il round nuovo e `round` cambia. Qui nessuno lo creava: i due telefoni restavano sul pop-up dell'esito con lo spinner «aspettiamo l'altro», entrambi pronti, nessuno in grado di andare avanti. 🔑 Il primo round funzionava, e infatti la versione personalizzata del disegno era stata «provata» solo fino a lì.

**La correzione** (`app/gioco/disegno.tsx`): l'esito si considera congedato quando hanno premuto «continua» tutti e due — la condizione diventa `!esitoRound || entrambiProntiRound`. Chi disegna vede «che cosa disegni?», l'altro «sta scrivendo la parola…» (stringa nuova `staScrivendoParola`: prima c'era «sta scegliendo la carta…», presa in prestito da obbligo o verità). Appena la parola è scritta il round nuovo esiste, `prontiRound` si azzera col cambio di `round.id`, e il giro dopo il pop-up torna a chiedere i due «continua». All'ultimo round non cambia niente: la partita è `conclusa`, la condizione chiede `in_corso`, e il «continua» porta al punteggio come prima.

**Come è stato verificato**: `tsc` e `lint` puliti. ⚠️ Il difetto è nella condizione di una schermata e **non è esercitabile da un test in Node**: la prova è giocare almeno due round del disegno personalizzato su due telefoni. È la stessa famiglia di B-43 e B-44 — difetti di un *passaggio* (i primi secondi, il cambio di carta, il cambio di round) che un giro di prova a mano salta perché guarda gli stati, non le transizioni.

### B-46 — «Versione ufficiale» apriva la personalizzata: la partita di nessuno restava viva (2026-09-02 seconda sessione, CORRETTO E VERIFICATO contro il database — da provare sul telefono)

*«Premo su Gioca versione ufficiale ma mi apre la versione personalizzata»*. `apri` (`lib/partita.ts`) cerca la partita viva della coppia per quel gioco e, se c'è, **ci entra col suo modo** — il parametro serve solo a creare (D-88). Uscire dall'anticamera con «indietro» (`onEsci` → `router.back()`) non abbandona niente: la partita resta in `attesa`, e la volta dopo si rientra lì dentro, qualunque riga si sia premuta. Il comportamento era **documentato** nel commento di `apri` come «conseguenza da conoscere»: era la descrizione del difetto, non la sua giustificazione.

**Correzione**: `daRimpiazzare`, la regola di **D-90**. Prima di entrare in una partita viva col modo diverso da quello chiesto, si contano i pronti (`partita_pronto`) e le carte scritte dall'altro (`domanda`, `autore_id <> io`), con `head: true` per non scaricare righe. Se la partita è in `attesa` e i due conteggi sono zero, si abbandona (`update … eq('stato','attesa')`) e se ne crea una col modo chiesto; altrimenti — o se un conteggio fallisce — ci si entra come prima.

**Come è stato verificato** — `tests/partita.mjs`, blocco «La partita di nessuno si rimpiazza (B-46)», **9 asserzioni** nuove, suite a **183/183** contro il database vero. La regola vive nell'app; il test prova ciò che il database deve garantirle:

- B legge **col proprio token** i due conteggi (zero e zero) della partita lasciata da A. Se la RLS li avesse negati, la regola avrebbe deciso «non rimpiazzare» in silenzio e il difetto sarebbe rimasto identico: era l'asserzione che valeva tutto il blocco;
- B abbandona la partita di nessuno e ne crea una `ufficiale`: l'indice unico non la blocca;
- 🔴 dopo un «Avvia» di A il conteggio dei pronti è 1; dopo una carta scritta da A il conteggio delle carte altrui, visto da B, è 1 — i due segni di vita che fermano il rimpiazzo si vedono davvero dall'altro telefono;
- 🔴 l'abbandono condizionato a `attesa` **non tocca** una partita `in_corso`, e la seconda partita **fallisce** su `partita_una_viva`: chi perde la corsa rientra in quella dell'altro, come D-88 vuole.

⚠️ **Cosa NON prova**: che la schermata, sul telefono, faccia la sequenza giusta. La prova è: aprire la personalizzata del quiz, uscire con «indietro», premere «versione ufficiale» — deve comparire l'attesa con le carte ufficiali, non la preparazione.

### B-45 — Nel quiz personalizzato le domande si chiamavano «Obbligo o verità?» (2026-09-02 seconda sessione, CORRETTO — da verificare sul telefono)

*«Nella versione personalizzata di quiz sulle preferenze esce scritto obbligo o verità»*. In `components/preparazione-carte.tsx` l'etichetta di una carta si sceglieva per tipo: `obbligo` → «Obbligo», `verita` → «Verità», *tutto il resto* → `t.gioco.scegliCarta`. E «tutto il resto» è la carta senza tipo, cioè la **domanda** del quiz — mentre `scegliCarta` è «Obbligo o verità?», la stringa del round in cui si sceglie la carta in *un altro gioco*. La funzione era stata scritta guardando obbligo o verità e provata solo lì; la preparazione del quiz non l'aveva mai aperta nessuno.

**Correzione**: chiave nuova `cartaDomanda` («Domanda» / «Question») in tutte e due le lingue, usata per il caso senza tipo.

⚠️ Il difetto era **invisibile ai test**: è una stringa a schermo, e l'unica verifica è aprire la preparazione del quiz sul telefono. Va guardata insieme a B-44, perché lo stesso schermo può comparire per la ragione sbagliata (l'hub che apre il gioco di prima).

### B-44 — L'hub avviava il gioco di prima: la selezione si aggiornava solo a fine inerzia (2026-09-02 seconda sessione, CORRETTO — da verificare sul telefono)

**Riferiti dall'utente due sintomi**, che sono uno: *«apro un gioco, premo Gioca, chiudo, premo Gioca su un altro gioco e mi riapre quello precedente»* e *«a volte mi apre direttamente il gioco e non mi fa scegliere tra ufficiale e personalizzata»*.

**La causa.** `scelto` — l'indice del gioco al centro del carosello — si aggiornava **solo** in `onMomentumScrollEnd`. Quell'evento scatta solo se lo scorrimento ha **inerzia**: un trascinamento lento che si ferma sulla carta accanto — `snapToInterval` la centra comunque — non lo fa scattare, e `scelto` restava sulla carta di prima. Da lì tutto il resto: «Gioca» apriva la rotta del gioco precedente; il foglio «come volete giocare?» portava in testa il nome sbagliato; e quando la carta rimasta in memoria era la telepatia — l'unico gioco senza versione personalizzata — «Gioca» entrava diretto senza foglio. 🔑 Il *«a volte»* del racconto è esattamente la differenza fra un colpo di dito e un trascinamento.

**La correzione** (`app/(tabs)/giochi.tsx`): l'indice si ricava da **ogni** evento di scorrimento nello stesso handler Reanimated che già muove le carte, e passa al thread JS con `runOnJS` **solo quando cambia**. La separazione voluta fra la `x` a sessanta fotogrammi e lo stato React che scrive un nome resta: cambia una volta per carta attraversata, non per fotogramma. `onMomentumScrollEnd` è tolto: due sorgenti per lo stesso stato sarebbero state la prossima corsa.

**Come è stato verificato**: `tsc` e `lint` puliti. ⚠️ La correzione vive in un gesto sul touch screen e **non è esercitabile da un test in Node**: la prova è scorrere *lentamente* fino alla carta accanto e premere «Gioca». Finché non è fatta sul telefono, resta corretto ma non verificato.

### B-43 — Il round nasceva a metà, e chi non l'aveva creato non lo sapeva (2026-09-02, CORRETTO — da verificare su due telefoni)

**Riferiti dall'utente due sintomi**, che sembravano due difetti e sono **uno solo**:

1. *«nella versione ufficiale di indovina il disegno la prima parola non viene mai caricata e il primo round va perso»*;
2. *«anche per gli altri giochi quando si avvia l'applicazione si rompe e bisogna uscire e rientrare dal gioco per poter partire»*.

⚠️ **Si trascinavano da giorni**, e nessuna delle tre sessioni di verifica precedenti li aveva presi: sono difetti dei **primi due secondi** di una partita, e chi prova a mano apre la schermata, guarda, e riprova — cioè fa esattamente la cosa che li nasconde.

## La causa, che è una sola

Le schermate creano il round dentro un `useEffect` che dipendeva da `p`, l'oggetto restituito da `usePartita`. Quell'oggetto è memoizzato su **tutto** lo stato della partita: punteggio, pronti, round, «continua». All'avvio cambia più volte in pochi istanti — arriva la coppia, arriva la partita, arrivano i pronti, arriva il primo evento realtime — e ogni cambio **rimontava** l'effetto. La pulizia alzava `vivo = false`, e il lavoro già partito veniva abbandonato **a metà**.

**Nel disegno** la sequenza è: crea il round → scrivi la parola in `round_segreto` → tienila in memoria. Interrotta dopo il primo passo lascia **un round senza parola**. E chi disegna è l'unico che può giudicare i tentativi — è l'unico a cui la RLS lascia leggere la parola — quindi senza parola **nessuno giudica niente**: il tempo scade e il round è perso. 🔑 Era *il primo* round perché è l'unico che nasce mentre tutto il resto si sta ancora assestando.

**Negli altri giochi** la sequenza è una scrittura sola, quindi non resta niente a metà nel database — ma il risultato veniva buttato lo stesso: `if (!vivo) return` **prima** di `setRound`. Il round esisteva e lo stato locale non lo sapeva; il giro dopo riprovava, prendeva un duplicato di `(partita_id, numero)` e taceva.

## E il secondo pezzo: l'evento che non arriva

L'altro telefono avrebbe potuto scoprire il round dall'evento realtime. **A volte lo scopriva e a volte no**, ed è la parte che ha richiesto una correzione della diagnosi.

`subscribe()` ritorna **prima** che la sottoscrizione sia attiva sul server. Un evento emesso in quella finestra non è però perso *per definizione*: Realtime legge il WAL a lotti e li consegna ai canali iscritti **nel momento della consegna**, non in quello della scrittura. Quindi una riga scritta un istante prima dell'iscrizione cade in una **lotteria** — se il lotto viene servito dopo che il canale è entrato l'evento arriva, se prima è perso.

⚠️ **La prima stesura di questo paragrafo diceva «non arriva mai», e il test l'ha smentita**: asseriva la perdita, è passata una volta ed è fallita quella dopo perché l'evento era arrivato. Tre giri consecutivi hanno poi dato *arrivato · perso · arrivato*. La versione forte era comoda — spiegava tutto — ed era falsa.

🔑 E la versione vera spiega **meglio** il sintomo riferito: non «non parte mai», ma *«ogni tanto bisogna uscire e rientrare»*. All'avvio la finestra cade nel punto peggiore, perché la schermata apre la partita e crea il round mentre il socket si sta ancora collegando.

🔑 *Uscire e rientrare funzionava perché **rientrare rilegge**.* Era la rilettura a mancare, non il canale.

⚠️ **È la stessa corsa di B-42**, trovata il giorno prima *dentro un test* e non riconosciuta come un difetto **del prodotto**. La lezione mancata: quando una corsa si presenta in un test, la prima domanda è *«e il codice vero, quella corsa ce l'ha?»* — qui la risposta era sì, in tre schermate.

## Le correzioni

1. **`useAperturaRound`** (`lib/partita.ts`): apre il round **una volta sola per (partita, numero)** e non abbandona il lavoro a metà. La bandierina non ferma più le scritture — dice soltanto se la schermata è ancora montata, cioè se ha senso aggiornare lo stato locale. 🔑 *Una scrittura sul database che si può annullare a metà non è annullabile: è solo incompleta.*
2. **`p` esce dalle dipendenze** dei tre effetti di apertura: si usano `setRound` (identità stabile) e `entrambiProntiRound` (un booleano). Le dipendenze cambiano quando cambia **la risposta**, non a ogni evento.
3. **Si rilegge quando il canale è davvero attivo**: `subscribe((stato) => stato === 'SUBSCRIBED' && rileggi(id))`, sul canale della partita e su quello di `round_pronto`. Chiude la finestra per **tutti e quattro** i giochi, ed è anche la spiegazione vera del «continua» che si bloccava a intermittenza — non la publication, che c'è.
4. **Il duplicato si rilegge invece di tacere**: se l'inserimento del round fallisce, si cerca il round per `(partita_id, numero)` e si adotta quello. È «chi perde la corsa rilegge» di `apri`, applicato alla corsa contro sé stessi.
5. **Il round senza parola si ripara** (`disegno.tsx`): chi disegna, se trova il proprio round vivo senza `round_segreto`, **scrive la parola adesso** e poi la rilegge dal database. Serve per due ragioni: i round nati a metà **esistono già** nel database di chi ha giocato — senza questo resterebbero ingiocabili per sempre — e nessuna precauzione rende impossibile un'interruzione fra due scritture: la si può rendere *recuperabile*.
   ⚠️ La rilettura finale non è pignoleria: se la parola l'ha scritta l'altra strada, il nostro `insert` prende un duplicato e va perso. Tenere la nostra darebbe a chi disegna una parola che chi indovina non può azzeccare — un difetto che si vedrebbe come *«ha indovinato e non gliel'ha contato»*.

## Come è stato verificato

`tests/partita.mjs` sale a **162 asserzioni** con un blocco che riproduce lo stato rotto contro il database vero:

- un round si crea **senza** parola, e `round_segreto` resta vuota: lo stato ingiocabile è raggiungibile;
- 🔴 chi disegna **può** scrivere la parola a round già aperto (è il presupposto della riparazione: se la RLS l'avesse impedito, la riparazione sarebbe fallita in silenzio);
- una seconda parola sullo stesso round **non passa**, quindi rileggere è l'unico modo di sapere quale vale;
- riaprire lo stesso round dà `23505`, e il round si **ritrova per numero**;
- 🔴 **la prova della causa**: A crea il round *prima* che B si iscriva, B si iscrive e aspetta sei secondi. Qui il test **non asserisce**: stampa se l'evento è arrivato o no, e asserisce solo ciò che è certo — che **leggendo** lo si trova. Su tre giri: *arrivato · perso · arrivato*. Un'asserzione su un esito che è una lotteria sarebbe stato un test che fallisce a caso, cioè la cosa che B-41 e B-42 avevano appena insegnato a non scrivere.

⚠️ **Cosa questo NON prova**: che le tre schermate ora si comportino bene sul telefono. Le correzioni 1, 2, 4 e 5 vivono in React e un test in Node non le esercita. La prova vera è una partita su due dispositivi, e finché non c'è questo difetto resta **corretto ma non verificato**.


### B-42 — La verifica del realtime era una corsa, e persa una volta su due (2026-09-02, CORRETTO E VERIFICATO)

**Il sintomo**: la nuova asserzione sul «continua» a due — B si iscrive al canale, A inserisce, l'evento deve arrivare — è fallita al primo giro con *«nessun evento entro 12s»*, e passata al secondo. Un test che dà due risposte diverse sullo stesso codice.

🔴 **La parte pericolosa non era il fallimento: era cosa diceva.** Il messaggio accusava la publication `supabase_realtime`, cioè **esattamente il sospetto che il punto di ripresa del 2026-09-01 aveva lasciato in cima all'elenco**. Un test che conferma il dubbio che già si aveva è la forma più credibile di diagnosi sbagliata: chiude l'indagine invece di aprirla.

**Come è stata isolata la causa vera**: uno script di diagnosi che prova lo stesso meccanismo su **tre tabelle** — `partita_pronto` e `partita` (nella publication dalla 0020, e il realtime dei giochi funziona in app) e `round_pronto`. Se l'evento arrivava per le prime due e non per la terza, la colpa era della 0027; se non arrivava per nessuna, la colpa era dello script. **Sono arrivati tutti e tre.** Il controllo discriminava, e ha scagionato la migrazione.

**La causa**: l'ack `SUBSCRIBED` arriva **prima** che la sottoscrizione sia attiva sul server. Una scrittura fatta in quella finestra non produce nessun evento, e l'evento perso non si recupera.

**La correzione**, in due parti perché una sola l'avrebbe resa fortunata invece che deterministica: una pausa dopo `SUBSCRIBED`, e un **secondo tentativo** sulla stessa riga (A si ripensa e ripreme — è la policy `round_pronto_delete`, quindi una cosa che l'app può fare davvero). Se non arriva nemmeno il secondo evento, non è più una corsa persa: è il meccanismo rotto, che è ciò che l'asserzione deve dire.

**Come è stata verificata**: la suite girata **tre volte** dopo la correzione, sempre verde: 117/117 due volte di fila, poi 152/152 col quarto gioco aggiunto.

🔑 **La lezione, che è la terza della stessa famiglia** (B-36, B-41): *un test che sbaglia non dice «ho sbagliato io», indica il file sbagliato*. E quando il file che indica è quello che già si sospettava, la conferma va cercata con un controllo che possa anche **smentirlo** — qui, provare due tabelle che dovevano funzionare.

### B-41 — Il controllo dei banchi era rosso da un giorno, e accusava la lista di parole (2026-09-02, CORRETTO E VERIFICATO)

**Il difetto**: in `tests/parole.mjs` l'espressione che ritaglia il blocco `TEMI_TELEPATIA` era **greedy** (`[\s\S]*`), quindi arrivava fino all'**ultima** chiusura `\n];` del file. Finché la telepatia era l'ultimo banco funzionava. Dal 2026-09-01, con l'arrivo di `DOMANDE_QUIZ` (commit `a5785c3`), il blocco della telepatia si portava dentro anche le domande del quiz: le voci contate diventavano **612 invece di 500**.

⚠️ **Ed era rosso da ventiquattro ore senza che nessuno lo sapesse**, perché questa suite **non gira nel `pre-commit`** — sta scritto in testa al file — e ieri, aggiungendo il banco del quiz, non è stata lanciata. Il commit è passato verde perché nessuno ha chiesto niente a questo controllo.

🔴 **Il modo in cui falliva è la parte che conta**: diceva *«500 voci di telepatia in tutto — trovate 612»*. Cioè accusava una lista di cinquecento voci scritte a mano di avere centododici righe di troppo. Chi lo leggesse andrebbe a cercare un difetto che non c'è, nel posto più scomodo in cui cercarlo. È **la stessa forma di B-36** — dove la causa erano i fine riga — e la regola che ne esce è la stessa: *un test che non sa leggere il proprio input deve dirlo, non incolpare l'input*.

**La correzione**: espressione non greedy, e — perché il difetto non si ripresenti alla prossima lista aggiunta in fondo — **ogni banco ha ora il suo blocco di controlli** con la propria chiusura riconoscibile, quiz e carte di obbligo o verità compresi.

**Come è stato verificato**: `npm run test:parole` → **31/31**, con le 500 voci di telepatia contate giuste (era il numero sbagliato che ha fatto scoprire il difetto, ed è quello che ora torna).



### La prima partita vera: sette difetti da sei sintomi (2026-08-29)

I giochi erano **l'unica zona dell'app mai vista girare**, ed è la prima volta che due persone ci hanno giocato davvero. Sei sintomi riferiti dall'utente, sette difetti dietro — e quattro difetti ne spiegano più d'uno a testa.

🔑 **La lezione d'insieme, prima dei singoli**: le 42 asserzioni di `tests/partita.mjs` erano tutte verdi, e non ne hanno intercettato **nessuno**. Non perché fossero scritte male: perché esercitano le funzioni Postgres — `segna_pronto`, `chiudi_round`, `rivela_telepatia` — con **due client simulati che si passano gli id a mano**. Tutti e sette i difetti stanno invece nello strato React, cioè in *chi decide quando chiamare quelle funzioni e cosa mostrare fra una chiamata e l'altra*. ⚠️ *Un test che simula i due giocatori non prova i due telefoni: prova il database sotto di loro.* Il livello mai coperto è esattamente quello in cui erano tutti e sette.

### B-30 — Il turno era calcolato «rispetto a me», e sui due telefoni dava persone diverse (2026-08-29, CORRETTO — non verificato su due telefoni)

**Sintomi, riferiti dall'utente**: *«dopo la prima manche i ruoli si mischiano ed entrambi devono indovinare la parola»*, *«la parola non viene mostrata»*, *«ogni tanto la partita si blocca»*. **Tre sintomi, un difetto.**

**La causa**: `disegnatoreDi` in `lib/partita.ts` valeva `n % 2 === 1 ? partita.creata_da : altroId`, e `altroId` lo calcolava la schermata come *«il membro che non sono io»* (`membri.find(u => u !== io)`). Quel `!== io` rende il valore **relativo a chi guarda**: nei round pari il telefono di A concludeva «disegna B» e quello di B concludeva «disegna A».

**Conseguenza a catena, ed è ciò che rende il difetto grosso**: nei round pari **nessuno dei due si riconosceva disegnatore**. Quindi (1) entrambi vedevano «indovina tu»; (2) nessuno pescava la parola, e la carta della parola restava a `…`; (3) siccome il round lo crea chi disegna, **il round 2 non nasceva mai** e la partita si fermava lì per sempre.

🔑 **È D-60 in un'altra veste**: *una regola che dipende da chi la applica non è una regola*. Qui il dato condiviso c'era già — `creata_da`, che i due telefoni leggono uguale — e si è preferito farlo ricostruire a chi chiama, dal proprio punto di vista. **Il turno deve essere una funzione di dati che entrambi leggono uguali, mai di «io».**

**Correzione**: la firma diventa `disegnatoreDi(n, membri)` e il non-creatore lo deduce la funzione. ⚠️ Non è solo una correzione: è la **rimozione del parametro** che permetteva l'errore. Lasciare `altroId` e documentarne il significato giusto avrebbe retto fino alla prossima schermata che lo ricalcola — che è la forma di B-24 e di `urlFotoGoogle`.

**Come è stato verificato**: ⚠️ **per lettura, non giocando.** `tsc` pulito, bundle Metro reale (3236 moduli), app che rende — nessuna di queste tre cose dice che il round 2 ora parte. Serve una partita a due.

### B-34 — L'esito veniva cancellato nello stesso istante in cui veniva scritto (2026-08-29, CORRETTO — non verificato)

**Sintomi**: *«gli utenti non riescono nemmeno a vedere se hanno risposto correttamente o sbagliato»* e *«le animazioni sono troppo veloci»*. **Due difetti sovrapposti, che davano lo stesso effetto.**

**Causa 1** — l'azzeramento di `esito` dipendeva da `numeroRound`, cioè `partita.round_corrente + 1`. Ma `round_corrente` lo scrive `chiudi_round`, **nello stesso istante** in cui il round si chiude: `setEsito(...)` e `setEsito(null)` finivano nello stesso giro di render. L'esito veniva calcolato correttamente, scritto, e cancellato **prima di comparire**.

**Causa 2** — le quattro carte leggevano le opzioni da `roundVivo`, che per definizione diventa `null` appena il round si chiude: **sparivano insieme al round**. Nei tre secondi della rivelazione restava una schermata vuota col titolo `…`, senza nessuna carta su cui vedere la scelta del partner.

🔑 **E questo spiega perché il sintomo si è presentato come «troppo veloce»**: `PAUSA_FRA_ROUND` funzionava — i tre secondi c'erano davvero — ma erano tre secondi di **niente**. *Chi guarda non distingue «passa troppo in fretta» da «non è mai comparso»: vede solo che non fa in tempo a leggere.* ⚠️ Per questo la costante **non è stata toccata**: tararla su un'osservazione in cui il risultato durava zero significherebbe correggere una misura sbagliata.

**Correzione**: l'azzeramento dipende da `round?.id` — che cambia solo quando il round successivo viene **inserito**, mentre la chiusura del round in corso è un `update` sulla stessa riga e lascia l'id dov'è. Le opzioni vengono da `round`; `roundVivo` resta, ma per una cosa sola: dire se si può ancora premere.

### B-31 — La classifica si cancellava da sola a ogni partita finita (2026-08-29, CORRETTO — non verificato)

**Sintomo**: *«per i due giochi non viene mostrato il risultato se premo su classifica»*.

**La causa**: le due schermate di punteggio finale chiamavano `p.abbandona()` alla chiusura, e quella funzione scrive `stato = 'abbandonata'` **sopra** `conclusa`, senza guardare cosa c'era prima. L'hub somma le partite con `stato = 'conclusa'`. Quindi **ogni partita finita usciva dalla classifica nell'istante esatto in cui la si chiudeva**, e la classifica non poteva che essere sempre vuota.

🔴 **La cosa più istruttiva è che era già scritto.** La migrazione **0021** spiega, come motivo per cui non esiste una policy di `delete`: *«una partita conclusa è il punteggio della coppia: è ciò che alimenta Intesa e Sintonia nell'hub. Poterla cancellare vorrebbe dire poter riscrivere il passato condiviso»*. Il database è stato difeso da una cancellazione che il client faceva comunque, per un'altra strada. 🔑 *Una protezione scritta in un posto solo protegge solo quel posto.*

⚠️ **E la chiamata non era neppure necessaria**: l'indice `partita_una_viva` copre solo `attesa` e `in_corso`, quindi una partita conclusa **non blocca** la successiva. Non era un compromesso fra due esigenze: era danno puro, a costo zero di rimuoverlo.

**Correzione**: `abbandona()` esce subito, azzerando il solo stato locale, se la partita è `conclusa`.

### B-33 — Le categorie si ripetevano quasi sempre (2026-08-29, CORRETTO — non verificato)

**Sintomo**: *«non possono comparire più volte domande della stessa categoria»*.

**La causa**: `pescaOpzioni()` pescava a caso fra i 25 temi a ogni round, **senza memoria**.

⚠️ **E il numero andava fatto prima, non dopo**: su una partita da **10** round la probabilità di vedere almeno una categoria due volte è **circa l'84%**. Non un caso raro sfuggito alla prova — il comportamento normale. 🔑 *Quando una scelta è casuale, la domanda giusta non è «può ripetersi?» ma «quanto spesso?», e la risposta è un conto di due righe che nessuno ha fatto.*

**Correzione**: il tema si esclude leggendo `opzioni->>tema` dei round già giocati **di quella partita** — dal database e non dalla memoria, perché chi crea i round può aver chiuso e riaperto la schermata. Stessa correzione applicata alle **parole del disegno**, dove il conto dà ~4% su 5 round: più raro, stessa forma, e la fonte lì è `chiave_rivelata` dei round chiusi e non `round_segreto` — che chi disegna adesso non può leggere per i round dell'altro, ed è giusto così.

### B-35 — Una scelta che non arrivava al database bloccava la partita in silenzio (2026-08-29, CORRETTO — non verificato)

**Sintomo**: concorre a *«ogni tanto la partita si blocca»*.

**La causa**: in `scegli()` l'esito dell'`insert` su `invio_sigillato` **non si guardava**. Una scelta non scritta lascia la schermata che dice «hai scelto» mentre il database non ha niente: `rivela_telepatia` non arriverà **mai** a due righe, il partner aspetta all'infinito, e il guardiano `if (miaScelta) return` impedisce persino di riprovare.

🔑 **È B-23 spostata di un livello.** Lì un permesso mancante non falliva — taceva. Qui il fallimento c'era, ed è stato **nessuno a leggerlo**. *Una scrittura di cui non si guarda l'esito è una scrittura che si spera sia avvenuta.*

**Correzione**: in caso di errore `miaScelta` torna indietro e compare una riga che invita a ripremere. Non un messaggio tecnico: l'unica cosa che serve sapere è che si può riprovare.

### B-32 — Un oggetto nuovo a ogni render azzerava tutti i timer delle partite (2026-08-29, CORRETTO — non verificato)

**La causa**: `usePartita` restituiva un **oggetto letterale nuovo a ogni render**, e le due schermate lo mettono nelle dipendenze dei loro effetti (per `p.chiudi`, `p.setRound`). Dentro quegli effetti ci sono il `setTimeout` della pausa fra i round e il `setInterval` del tempo del disegno: **ogni render li smontava e li faceva ripartire da capo**.

🔑 *Un valore instabile nelle dipendenze non rompe il codice che lo legge: rompe i **timer** di chi lo osserva.* Ed è un difetto che leggendo l'effetto non si vede — si vede solo sapendo cosa gli viene passato, che è in un altro file.

**Correzione**: `React.useMemo` sull'oggetto restituito. ⚠️ Trovato **leggendo**, non da un sintomo: non è dimostrato che abbia prodotto uno dei sei riferiti.

### B-40 — Il guardiano del round interrogava un dato ancora in viaggio (2026-09-01, CORRETTO — verificato dall'utente)

**Sintomo riferito**: *«nel gioco telepatia si apre il pop-up ma continua a passare alla pagina successiva in automatico»*. Il pop-up si affacciava e il round nuovo lo cancellava subito.

**Causa**: il guardiano scritto per D-82 diceva `if (round?.finito_il && !entrambiProntiRound) return`. Ma i due dati che decidono arrivano da **strade diverse**: `chiudi` riceve dalla RPC la partita con `round_corrente` **già avanzato**, mentre `finito_il` sul round locale arriva solo col successivo evento realtime. Nell'istante fra i due, sul telefono di chi apre i round, `numeroRound` era già N+1 e `finito_il` ancora `null`: il guardiano leggeva un campo non ancora arrivato e lasciava passare.

**Correzione**: `if (round && !entrambiProntiRound) return`. La condizione giusta non ha bisogno che nessun campo arrivi — il round in corso è già fermato dalla riga sopra, quindi un `round` che arriva fin lì **è** un round passato; e al primo round `round` è `null`, così la partita parte senza aspettare un «continua» che nessuno vedrebbe.

🔑 ***Un guardiano che dipende da un dato in viaggio non è un guardiano.*** È la stessa famiglia di B-30 e B-34: uno stato calcolato al momento sbagliato vale cose diverse sui due telefoni, o nei due istanti.

---

### B-39 — Il bottone alimentava il pop-up che voleva chiudere (2026-09-01, CORRETTO — verificato dall'utente)

**Sintomo riferito**: a fine partita *«entra in un loop in cui continua a comparire il pop-up "è la stessa"»*.

**Causa**: il «Continua» dell'ultimo round congedava il pop-up con `setEsito(null)`. Non poteva funzionare **da quando esiste B-37**: l'effetto della rivelazione ora sopravvive alla chiusura del round, quindi trovava `esito` vuoto, richiedeva la rivelazione al database — che risponde sempre la stessa cosa — e rimetteva il pop-up. Un anello chiuso, senza uscita.

**Correzione**: uno stato locale `finaleLetto`, e il punteggio finale compare quando è vero.

🔑 ***Cancellare un dato non è dire che l'hai visto.*** Il dato è vero e resta vero; quello che cambia è che **questo telefono** l'ha già letto — e nessun campo del database può saperlo, perché l'altro lo legge per conto suo.

⚠️ **Il difetto è nato da una correzione**, non da codice vecchio: B-37 ha reso l'effetto più resistente, e la resistenza ha rotto un congedo che si reggeva sulla sua fragilità. Corretto nello stesso giro anche nel disegno, dove non si era ancora manifestato.

---

### B-38 — I pin della mappa non comparivano su Android, e il difetto era lì da cinque giorni (2026-09-01, CORRETTO)

**Sintomo riferito**: *«su Android appena apro l'applicazione non carica i pin sulla mappa»*. Tornando sulla mappa da un'altra scheda i pin c'erano.

**Causa**: `tracksViewChanges` — ciò che permette a react-native-maps di catturare la texture dei pin disegnati da noi — si spegneva dopo 900 ms contati dal **mount**. L'effetto dipendeva dal numero dei luoghi, il che faceva credere che il conto tornasse, ma **rimandare lo spegnimento non è riaccendere**: all'apertura dell'app la mappa monta con zero luoghi (i dati stanno arrivando dal database), i 900 ms scadono sul vuoto, e quando i luoghi arrivano i marker nascono con la cattura **già spenta**.

**Correzione**: `setTraccia(true)` all'inizio dell'effetto, così la finestra si apre quando i pin ci sono davvero. E la dipendenza è una **firma-stringa** che comprende conteggio eventi e «ha una serata futura», perché quelli cambiano il disegno del pin senza spostare `luoghi.length` — su Android un posto che diventa «visitato» avrebbe tenuto la texture vecchia. Firma e non gli oggetti: sono ricreati dal genitore a ogni render, e metterli fra le dipendenze riaccenderebbe la cattura di continuo (è la lezione di B-32, applicata prima che facesse danni).

🔑 **Perché non si è mai visto prima.** Su iOS la view del marker viene renderizzata comunque, quindi lo **stesso identico bug** non produce nessun sintomo. Era in `mappa-vera.native.tsx` dal **2026-08-27** e tutti i giri di verifica lo hanno attraversato senza vederlo, perché fatti su un iPhone. ***Una correzione provata su un solo sistema è provata a metà*** — ed è la ragione per cui la giornata su due telefoni ha reso più di tre di rilettura.

---

### B-37 — La rivelazione si spegneva insieme al round, e l'esito non arrivava mai (2026-09-01, CORRETTO — verificato dall'utente)

**Sintomo riferito**: *«il gioco telepatia si è bloccato»*.

**Causa**: l'effetto che interroga `rivela_telepatia` era guardato da `if (!roundVivo ...)`, e `roundVivo` diventa `null` **nell'istante in cui il round si chiude** — è la sua definizione. Ma chi chiude è uno solo, chi apre i round, e lo fa appena *lui* ha ricevuto la rivelazione; sull'altro telefono il giro di domande passa ogni 1200 ms. Se la chiusura arriva prima del suo giro, l'effetto si smonta e `esito` **non viene impostato mai**.

**Correzione**: si chiede a `round`, non a `roundVivo` — il round finito **è** il momento per cui si gioca (B-34), quindi l'effetto deve sopravvivergli. E `p.chiudi` si manda solo se il round è ancora `in_corso`, o adesso partirebbe una scrittura inutile ogni 1200 ms.

**Seconda metà, trovata subito dopo**: `miaScelta` è stato locale, e chi ricaricava la schermata lo perdeva — senza quello l'effetto non ripartiva nemmeno con la correzione, e la partita restava bloccata **in modo permanente**. A round finito la rivelazione si chiede ora **anche senza `miaScelta`**: la scelta la dice il database. Si ripristina anche l'evidenza sulla carta, o l'esito sarebbe una frase senza il suo referente.

🔑 **È la seconda metà di B-34, rimasta indietro tre giorni.** Quel difetto era stato corretto **solo dalla parte delle carte**; la parte dell'esito è rimasta rotta e non dava fastidio, perché finché il round avanzava da solo perdere l'esito era un peccato. Da quando il round successivo aspetta il «Continua», lo stesso difetto **ferma la partita**. ⚠️ *Una correzione parziale non si vede finché qualcosa non si appoggia sulla metà rimasta rotta.*

---

### B-36 — Il test dei banchi accusava il file sbagliato, e solo su questo dispositivo (2026-08-29, CHIUSO E VERIFICATO)

**Sintomo**: `npm run test:parole` dava **12/15** qui, mentre `History.md` registrava 15/15 il giorno prima.

**La causa**: il test non importa il modulo, lo **legge come testo** e lo spacca con espressioni regolari che contengono `\n`. Su questo dispositivo `core.autocrlf=true` — il default di Git su Windows — mette `\r\n` nella copia di lavoro, quei `\n` non combaciano più, e `TEMI_TELEPATIA` viene letto come **un tema solo** contenente tutte le voci.

🔴 **Il modo in cui falliva è la parte peggiore**: non diceva «il test non sa leggere il file», diceva **«almeno 20 temi — trovati 1»** e «chiave doppia dentro un tema». Cioè **accusava il banco di parole**, che era intatto. *Un test che sbaglia indica il file sbagliato, e chi lo legge va a cercare un difetto che non esiste.*

🔑 **Ed era invisibile finché il progetto è vissuto su un dispositivo solo** — stessa forma della chiave TMDB, scoperta il giorno prima: qualcosa che vale su questa macchina e non sull'altra, e nessuno dei due lato lo vede. *Un controllo che dipende dal checkout non sta verificando il codice: sta verificando il checkout.*

⚠️ **E costava più di tre righe di report**: fra i controlli spenti c'era **«nessuna chiave doppia dentro un tema»**, che è precisamente la garanzia su cui si appoggia la correzione di B-33. Per un giorno quel controllo non ha verificato niente, dicendo di averlo fatto.

**Correzione**: i fine riga si normalizzano prima di guardare il sorgente. **Verificato**: 15/15, contro 12/15 di prima. ⚠️ Controllati anche `tests/partita.mjs` e `tests/rls.avversariali.mjs`, che leggono il `.env` con lo stesso `split('\n')`: sono **sani**, perché fanno `.trim()` su ogni valore e il `\r` cade lì.

### B-28 — Il numero sulla carta non si aggiornava tornando dalla lista (2026-08-28, CORRETTO)

**Sintomo, riferito dall'utente**: *«quando apro una lista e inserisco una voce poi chiudo la card il numero sulla card non si aggiorna»*.

**La causa**: le carte mostrano quante voci ha ogni lista, e quel numero si carica **al montaggio**. Tornando indietro, la schermata a tab **non si rimonta** — quindi il conto resta quello di prima mentre il database ne ha uno nuovo.

🔴 **È la forma di B-09/B-13 per la terza volta**: *due copie dello stesso stato, di cui una non viene aggiornata*. E la regola era già scritta il 2026-08-27 — *se una schermata legge dati che un'altra può scrivere, deve rileggere al focus* — poi riapplicata da **D-59** ai permessi di posizione.

🔑 **Questa schermata è nata ieri e non ce l'aveva.** È la stessa lezione di B-24 in un altro punto: *sapere una regola e applicarla sono due cose diverse, e la seconda non segue dalla prima.* Tre occorrenze della stessa forma in due giorni dicono che il problema non è la memoria di chi scrive — è che non c'è niente che lo ricordi al posto suo. ⚠️ **Va considerato un candidato per un controllo automatico**: una schermata sotto `app/(tabs)/` che usa un hook di lettura senza `useFocusEffect` è un difetto probabile, e si può cercare con un grep.

**Correzione**: `useFocusEffect` che richiama `ricarica`, come in `galleria.tsx` e `home.tsx`.

### B-29 — «Apri» apriva a volte la lista sbagliata (2026-08-28, CORRETTO)

**Sintomo, riferito dall'utente**: *«a volte apro una card ma mi apre un'altra lista»*.

**La causa**: `scelto` — l'indice della carta al centro — si aggiornava **solo** in `onMomentumScrollEnd`, che scatta quando il carosello si ferma **per inerzia**. Se si trascina piano e si lascia, o si accompagna la carta fino in fondo col dito, quell'evento **non arriva mai**: la carta al centro è cambiata, lo stato no, e «Apri» apre la precedente.

⚠️ **Il «a volte» della segnalazione è la diagnosi**, e vale la pena notarlo: un difetto che dipende da *come* si scorre non si riproduce a comando, e la tentazione è archiviarlo come impressione. Qui invece descriveva esattamente la condizione — capita quando il gesto finisce senza inerzia.

🔑 **La correzione non è aggiungere il secondo evento sperando di averli presi tutti.** È smettere di **dedurre una posizione da una sequenza di eventi**: lo scorrimento vero sta in `x`, aggiornato a ogni fotogramma, e al momento del tocco si legge quello. *Il pezzo che sa il dato lo usa, invece di ricostruirlo* — la stessa cura di B-25, dove il dato era l'altezza della tastiera.

⚠️ `onScrollEndDrag` è stato aggiunto lo stesso, ma **per un'altra ragione**: serve a far cambiare **i bottoni** mentre si scorre (una lista di partenza non mostra «Elimina»). Quello è aspetto e può permettersi uno stato in ritardo di un istante; **l'azione no**.

🔴 **E la stessa rilettura è stata messa sulla cancellazione**, dove non era stata segnalata: cancellare la lista sbagliata è molto peggio che aprirla. *Trovato un difetto per forma, si cerca la forma* — anche quando la seconda occorrenza non ha ancora fatto danni.

### B-27 — L'elenco della mappa mostrava ancora i posti non visitati (2026-08-28, CORRETTO)

**Sintomo, riferito dall'utente**: *«l'elenco dei luoghi contiene anche luoghi non ancora visitati»*.

**La causa**: D-70 aveva filtrato `useLuoghi`, che alimenta **i pin**. L'elenco della stessa sezione però non legge da lì: legge `elemento_lista` tramite `ElencoElementi`, e quel filtro non c'era.

🔑 **Due viste della stessa cosa, una sola corretta** — ed è la peggiore delle due situazioni, perché la vista giusta fa credere che la regola sia applicata. *Quando una regola riguarda un dato, va messa dove il dato si legge; se le letture sono due, i posti sono due.*

⚠️ **Il criterio è ora scritto identico nei due punti** (`visitato` **oppure** almeno un evento) e questo è un debito, non una soluzione: due copie della stessa condizione divergeranno. Non è stato unificato oggi perché le due leggono tabelle diverse con strumenti diversi, e l'astrazione che le unisce andrebbe progettata, non improvvisata a fine giornata. **Sta qui perché la prossima volta che una delle due cambia, si cambino entrambe.**

### B-26 — I posti aggiunti a «Viaggi» e «Ristoranti» non comparivano (2026-08-28, CORRETTO)

**Sintomo, riferito dall'utente**: *«quando aggiungo degli elementi alla wishlist viaggi e ristoranti questi non vengono caricati»*.

**La causa, e viene da me.** `creaLuogo` scrive due righe — una in `luogo` e una in `elemento_lista` — e nella seconda **non metteva `lista_id`**. Ma la wishlist filtra **per** `lista_id`: il posto veniva creato davvero, il database lo aveva, la mappa se ne sarebbe accorta — e la lista da cui lo avevi aggiunto no.

🔴 **È la forma esatta di B-19**, introdotta lo stesso giorno in cui B-19 veniva citato tre volte come lezione appresa. Allora `aggiungi` non scriveva copertina e genere; oggi non scrive l'appartenenza. La forma è: *una via di creazione che non scrive un campo che chi legge usa per filtrare* — e il sintomo, allora come oggi, **non è un errore: è una cosa che non compare**.

⚠️ **Perché non l'hanno preso i controlli**: `tsc` non poteva dire niente, perché `lista_id` è **nullable per progetto** — un posto può nascere da un evento senza stare in nessuna lista (D-44). Il tipo che permette il caso legittimo permette anche il difetto. *Una colonna nullable è una colonna su cui il compilatore ha smesso di aiutarti.*

**Correzione**: `creaLuogo` accetta `listaId` e lo scrive; `FoglioAggiungiLuogo` lo inoltra; `ElencoElementi` gli passa il proprio. Il valore predefinito resta `null`, perché il caso «nato da un evento» è ancora vero.

**Verificato**: `tsc`, `eslint`, bundle. ⚠️ **Non sul telefono** — e questo è uno dei pochi difetti di oggi che si vedrebbe anche in preview, se non ci fosse il cancello di sessione.

### B-25 — La tastiera copriva la riga di aggiunta di una lista (2026-08-28, CORRETTO)

**Sintomo, riferito dall'utente**: *«anche quando inserisco una voce il tastierino sovrascrive elementi della UI»*. È la **seconda** segnalazione di tastiera della giornata, arrivata dopo la correzione di **B-24** — che quindi non l'aveva coperta.

**Perché B-24 non bastava**: quella correzione ha messo la gestione della tastiera dentro `Foglio`, e riguarda i **fogli**. Qui la riga di aggiunta non sta in un foglio: sta in fondo a `components/elenco-elementi.tsx`, che aveva un `KeyboardAvoidingView` **suo** — e funzionante, fino a ieri.

🔑 **La causa, e perché si è manifestata solo adesso.** `behavior="padding"` calcola quanto padding serve **dalla posizione del contenitore sullo schermo**. Nella sezione Liste quel contenitore partiva subito sotto un titolo di una riga, e il conto tornava. Dentro una **lista aperta** (D-68, di oggi) ha sopra un'intestazione più alta — il tondo «indietro» più due righe di testo — e sottostima **esattamente di quell'altezza**.

⚠️ **Non era quindi un difetto del componente: era un difetto della schermata nuova, che ha reso visibile un'assunzione che il componente aveva sempre fatto.** Un `KeyboardAvoidingView` che funziona è un `KeyboardAvoidingView` che nessuno ha ancora messo sotto un'intestazione alta.

**Correzione**: la frame-math viene tolta di mezzo. L'altezza della tastiera si **misura** con `useTastiera` — che il progetto ha già, perché la barra volante deve sparire — e si applica come `paddingBottom`. Nessun conto sulle posizioni, quindi nessuna intestazione che possa falsarlo.

🔑 È la stessa cura di B-24 in un contesto diverso: **il pezzo che sa il dato lo usa direttamente, invece di farlo dedurre a qualcun altro da un indizio geometrico.**

**Verificato**: `tsc` e `eslint` puliti, bundle ricompilato. ⚠️ **Non verificato sul telefono**, e non è verificabile altrove: sul web non esiste una tastiera di sistema. La prova è aprire una lista e scrivere una voce.

### B-24 — La tastiera copriva i comandi di un foglio (2026-08-28, CORRETTO nella forma)

**Sintomo, riferito dall'utente**: *«quando si apre il tastierino nasconde alcuni elementi della UI»*.

⚠️ **La segnalazione non diceva quale schermata**, e la diagnosi qui sotto è stata fatta cercando *dove il difetto poteva esistere*, non partendo da dove è stato visto. Va quindi riletta come «trovato un difetto di questa forma, e corretto», non come «trovato quel difetto». Se dopo la correzione qualcosa resta coperto, è un secondo caso e non una correzione fallita.

**La causa**: `components/foglio.tsx` **non sapeva niente della tastiera**. Un foglio sta incollato in fondo allo schermo — cioè esattamente nel posto che la tastiera copre — e finora se ne occupava ogni schermata per conto proprio: il calendario aveva il suo `KeyboardAvoidingView` dentro il foglio, e chi scriveva il foglio successivo doveva ricordarsene.

🔴 **Chi lo ha scritto dopo non se n'è ricordato**: il foglio «crea una lista» di **D-68**, di oggi, è nato senza. Con `autoFocus` sul campo, la tastiera sale subito e copre «Crea» e «Annulla».

🔑 **Ed è la stessa forma già diagnosticata da D-60 per il vetro**, alla lettera: *una regola che dipende dalla memoria di chi scrive la prossima schermata non è una regola, è una speranza*. Lì la prova era che il vetro si rompeva su cento punti di chiamata; qui è bastato **un** foglio nuovo, scritto lo stesso giorno in cui quella lezione era in cima al PUNTO DI RIPRESA, per ripetere l'errore. *Sapere una regola e applicarla sono due cose diverse, e la seconda non segue dalla prima.*

**Correzione, nella forma e non nell'istanza**: la tastiera la scansa **`Foglio`**, una volta, per tutti i fogli — presenti e futuri. Il `KeyboardAvoidingView` è dentro la vista animata, così non litiga con la salita del pannello, e `pointerEvents="box-none"` lascia passare i tocchi alla velatura, che è ciò che chiude il foglio toccando fuori.

⚠️ **E il `KeyboardAvoidingView` del calendario è stato tolto**, non lasciato lì: due contenitori che scansano la stessa tastiera **sommano** lo spostamento, e il foglio sarebbe schizzato in alto del doppio. È la parte della correzione che si dimentica più facilmente, perché il difetto che introduce assomiglia a una svista di stile invece che a una regressione.

🔑 **Il posto era già indicato dal file stesso.** In `foglio.tsx` c'era scritto, a proposito di un'altra cosa: *«dichiararlo una volta, qui, evita che ogni schermata se lo ricordi — che è come si è perso il difetto del 2026-08-27»*. Lo stesso ragionamento, nello stesso file, per lo stesso tipo di problema — e la tastiera era rimasta fuori. Una regola scritta accanto al posto giusto non si applica da sola.

**I due `KeyboardAvoidingView` rimasti sono corretti e non vanno toccati**: quello di `elenco-elementi.tsx` (riga di aggiunta) avvolge la **schermata**, non un foglio; quello di `foglio-aggiungi-luogo.tsx` sta dentro un `Modal` di sistema, non dentro `Foglio`.

**Verificato**: `tsc` e `eslint` puliti, bundle web ricompilato (12,5 MB, HTTP 200). ⚠️ **Non verificato sul telefono**, che è l'unico posto dove una tastiera vera esiste: sul web non c'è tastiera di sistema, quindi `KeyboardAvoidingView` non ha niente da cui scansarsi e la preview **non può dire nulla** su questa correzione. La prova è aprire «crea una lista» sull'iPhone e vedere i due comandi sopra la tastiera.

### B-23 — Una partita non si poteva abbandonare, e il permesso mancante taceva (2026-08-28, CHIUSO — 0021 applicata il 2026-08-28)

**Trovato** perché l'utente ha chiesto di fermare le partite attive. Ho lanciato la pulizia sugli account di prova, l'output diceva «abbandonata» quattro volte, e **ho ricontrollato**: quattro partite ancora vive.

**La causa**: `partita` aveva, dal 2026-08-12, una policy di `select` e una di `insert`. **Nessuna di `update`.** Con la RLS attiva nessuno può modificare una partita passando dal client — quindi `abbandona()` nell'app e la pulizia in coda a `tests/partita.mjs` non facevano **niente**.

🔑 **E non lo dicevano.** Un UPDATE negato dalla RLS **non è un errore**: la query torna con `error: null` e zero righe toccate. Chi la scrive vede che è andata bene e va avanti. È il modo peggiore in cui un permesso può mancare — non fallisce, tace. *La rete che cade te lo dice; il permesso che manca no.*

**Perché i 41 test passavano lo stesso**: tutte le scritture che contano — `segna_pronto`, `chiudi_round`, `rivela_telepatia` — passano da funzioni `security definer`, che la RLS la scavalcano per costruzione. L'unica scrittura diretta era la pulizia, e **nessuna asserzione la verificava**.

🔴 **E questa è la parte che pesa di più**: nella stessa giornata avevo scritto, in questo file e nel commit, che il nuovo test «ripulisce ciò che crea, a differenza di `rls.avversariali.mjs`» — indicando quella mancanza come la causa di B-21. **L'affermazione era falsa**, ed è stata scritta con la sicurezza di chi ha appena imparato la lezione. *Aver capito un difetto non è averlo evitato: la seconda cosa va verificata come la prima.*

**Correzione, in tre pezzi**:
1. migrazione **0021**: la policy di `update` su `partita` per i membri della coppia. ⚠️ **Nessuna di `delete`, ed è voluto**: una partita conclusa è il punteggio della coppia, cioè ciò che alimenta «Intesa» e «Sintonia» — poterla cancellare vorrebbe dire riscrivere il passato condiviso, e da un solo lato;
2. `tests/partita.mjs`: la pulizia **restituisce quante ne restano** e chi la chiama lo **asserisce**. Ora il test fallisce forte al punto giusto invece di passare lasciando spazzatura;
3. `abbandona()` **rilegge dopo aver scritto** e mostra un errore se la partita è ancora viva. La regola generale: *dopo una scrittura che dipende da un permesso, si rilegge.*

**E un difetto d'interfaccia che ne discendeva**: una partita in attesa non si poteva togliere di mezzo da nessuna parte. Il database ne ammette **una viva per gioco**, quindi quella appesa avrebbe impedito di cominciarne un'altra — per sempre, e senza dire perché. Aggiunto «Annulla la partita» nell'anticamera, secondario e scritto per esteso: «indietro» lo si preme distrattamente, e la stessa gesto non deve buttare via la partita che l'altro sta aspettando.

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

✅ **CHIUSO il 2026-08-28**, dopo la migrazione 0021: `rls.avversariali.mjs` ora ripulisce, e verificato che il database resti a zero partite vive.

🔑 **Non si sarebbe potuto chiudere prima**, e non per distrazione: mancava la policy di update su `partita` (**B-23**), quindi qualunque pulizia sarebbe tornata «riuscita» senza toccare niente. *Il difetto che impediva di ripulire era lo stesso che rendeva invisibile il non aver ripulito.*

🔑 **E la pulizia sta in TESTA, non solo in coda.** La prima stesura la metteva alla fine del file e non serviva a niente: al primo tentativo il test è fallito prima di arrivarci, con l'indice unico che rifiutava la partita nuova per colpa di quella vecchia. **Pulire dopo funziona solo se il test riesce; pulire prima funziona sempre.** In coda c'è comunque, ma come igiene, non come garanzia.

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

✅ **Giro di verifica del 2026-08-28**: l'aggiunta di un posto funziona da entrambe le strade. ⚠️ Non è confermato che sia stata aperta la scheda **in Liste**, che è la metà del difetto invisibile dalla mappa: il pin compare comunque, con o senza copertina.

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

✅ **Giro di verifica del 2026-08-28**: la tendina si apre e i consigli arrivano.

### B-17 — La testata del calendario legge un `ref` dentro un worklet (2026-08-28, CHIUSO)

**Sintomo**: nei log di Metro, a ogni apertura dell'app sull'iPhone, `WARN [Worklets] Tried to modify key `current` of an object which has been already passed to a worklet`.

**Dove**: [`components/testata-calendario.tsx`](components/testata-calendario.tsx) — `direzione` è un `React.useRef`, viene **letto dentro `useAnimatedStyle`** (`translateX: (1 - cambio.value) * 22 * direzione.current`) e **mutato** sul thread JS poche righe sopra.

🔑 **Il commento accanto alla dichiarazione dice già la cosa giusta** — *«il verso al momento del cambio: letto qui, non nello stile animato»* — ed è il codice a contraddirlo. È il tipo di difetto che una rilettura non trova, perché il commento rassicura.

**Conseguenza**: il worklet tiene una **copia serializzata** del ref, quindi il verso che usa può essere **vecchio** — cioè il titolo del calendario può entrare **dal lato sbagliato**. È esattamente la funzione introdotta ieri con D-54 («titolo che entra dal lato giusto»), e resta fra le cose *non verificate sul telefono*.

**Corretto** su richiesta dell'utente, a fine giornata: `direzione` è un `useSharedValue`, scritto con `.value` e letto con `.value` dentro lo stile animato. Un valore condiviso è fatto per essere letto e scritto dai due lati.

⚠️ **E il commento è stato riscritto**, non solo il codice. Quello vecchio diceva *«letto qui, non nello stile animato»*: la descrizione corretta di ciò che il codice **doveva** fare, accanto al codice che faceva l'opposto. Lasciarlo lì avrebbe protetto il prossimo errore esattamente come ha protetto questo.

🔑 **Ed è stato cercato altrove**, perché un difetto di questa forma non ha ragione di essere unico: uno scorrimento di tutto `app/`, `components/` e `lib/` per ogni `.current` letto dentro un worklet (`useAnimatedStyle`, `useAnimatedProps`, `useAnimatedReaction`, `useDerivedValue`, `useAnimatedScrollHandler`) non ha trovato **nessun altro punto**. *Trovato un difetto per forma, si cerca la forma, non il difetto.*

**Verificato**: `tsc` e `eslint` puliti, e nel bundle iOS `direzione.value` compare tre volte mentre `direzione.current` zero.

✅ **Giro di verifica del 2026-08-28**: il calendario è fra le cose che l'utente ha usato senza trovare niente di rotto. ⚠️ Ma non è confermato che i mesi siano stati scorsi avanti e indietro, che è l'unico gesto in cui il verso del titolo si vede — la parte **osservabile** di questa correzione resta quindi non esercitata. Il difetto tecnico è chiuso (il `ref` non c'è più); la funzione che proteggeva, no.

**Perché è stato trovato**: leggendo il log di Metro mentre si verificava altro. ⚠️ E la prima occorrenza è **precedente** alle modifiche di oggi, il che è l'unica ragione per cui non è stato scambiato per una regressione: quando si trova un avviso, la prima domanda è *da quando c'è*, non *cosa ho appena toccato*.

### B-16 — Il «+» della mappa senza il suo tondo, ma solo appena avviata l'app (2026-08-28, CHIUSO — verificato su iPhone il 2026-08-28)

**Sintomo, riferito dall'utente**: *«appena avvio l'applicazione non c'è il riquadro del pulsante "+" per l'aggiunta di luoghi sull'interfaccia mappa»*. Restava l'icona, spariva la superficie.

**È il modo di rompersi n. 2 di D-55**, quello che quella decisione aveva descritto e per cui aveva scritto `fondo="sicuro"` — un valore **mai messo su nessun componente**. La rete c'era, sulla carta.

🔑 **Ma stavolta la causa è stata isolata, non aggirata**, e la chiave è il *«solo appena avvio l'app»*. Il «+» sta dentro una `Comparsa`, che al montaggio parte da **opacità 0**, dentro la dissolvenza di scena della mappa, che al montaggio **partiva anch'essa da 0**. Su iOS una vista di vetro creata a opacità zero non cattura il suo sfondo, e quando l'opacità torna **non si ridisegna da sola**. Dopo l'avvio il componente si rimonta a schermo già acceso, e il tondo c'è: ecco perché il difetto aveva quella finestra così stretta.

**Correzione**: **D-61** — il vetro non nasce più dentro un livello a opacità zero (in due punti), e `TondoVetro` prende comunque `fondo="sicuro"`, così **il modo in cui fallisce resta deciso** anche se la diagnosi fosse incompleta.

⚠️ **Verificato solo per costruzione e per stringa** (`tsc`, `eslint`, i simboli nuovi presenti nel bundle iOS). Sul telefono **non ancora**: è la prima cosa del prossimo giro, e il caso di prova è preciso — *chiudere del tutto l'app e riaprirla*, non ricaricare.

✅ **CHIUSO il 2026-08-28** (seconda sessione): sull'iPhone il tondo del «+» c'è. ⚠️ Con un limite dichiarato — non è confermato che il giro abbia esercitato il caso di prova stretto, *chiudere del tutto l'app e riaprirla*, che era l'unica finestra in cui il difetto si manifestava. 🔑 Quindi: se il tondo dovesse tornare a mancare **al solo avvio a freddo**, non va letto come una regressione ma come questa finestra, mai attraversata.

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
| R-06 | **Il contenuto della versione personalizzata non è filtrato da noi** (D-89): le carte le scrivono i due, quindi D-08 e le due esclusioni di D-13 non lo coprono | Un filtro automatico sul testo scritto fra due persone che si sono scelte sarebbe inefficace (si aggira riscrivendo) e invadente (l'app che legge e giudica le confidenze è ciò che TB-2 esiste per evitare). Restano in piedi le uscite: il pass che non fa perdere, il set visibile a entrambi **prima** di giocare, e la partita abbandonabile | Se arrivasse una segnalazione su un contenuto, o se il prodotto smettesse di essere un esperimento fra persone che si conoscono |

---

## 6. Backlog / roadmap

> Qui vanno **tutti** gli sviluppi futuri interni a questo progetto, brevi e lunghi (`CLAUDE.md` §3.4). Un progetto *nuovo* va invece in `Projects/elenco-progetti.md`.

### Widget per la home screen — rimandati dall'utente il 2026-09-04

**Chiesti dall'utente** il 2026-09-04, su iPhone **e** Android, e **rimandati** lo stesso giorno dopo aver visto i vincoli. Cinque, tutti «dinamici» nel senso di *a rotazione fra gli elementi disponibili*:

1. **Prossimo evento** — con la foto, se c'è
2. **Ultimo evento** — con la foto, se c'è
3. **Punteggi dei giochi** — a rotazione fra Intesa, Sintonia, Conoscenza e Coraggio
4. **Film e luoghi preferiti** — con la copertina
5. **Foto**

✅ **I dati ci sono già tutti**: `evento` (con `anteprimePerEvento` per le foto), i punteggi di **D-83**, `elemento_lista` con `locandina` (0023) e i luoghi con `foto_google`. Non serve nessuna migrazione: serve un modo di **portarli fuori dall'app**, che è tutto il problema.

#### 🔴 Perché non è «aggiungere cinque schermate»

Un widget **non è React Native**: lo disegna il sistema operativo per conto suo, quando l'app non è in esecuzione. Serve codice nativo e un **development build** — in Expo Go i widget non esistono e non si possono provare. Oggi `Projects/LifeCouple` non ha né `ios/` né `android/`, e il prebuild è il passo che *«cambierebbe la natura del progetto»* (già scritto a proposito di **B-20**).

**Rilevato il 2026-09-04, con le fonti** — le due piattaforme non sono affatto nella stessa situazione:

| | Android | iOS |
|---|---|---|
| Libreria | [`react-native-android-widget`](https://saleksovski.github.io/react-native-android-widget/) — config plugin, matura | [`expo-widgets`](https://docs.expo.dev/versions/latest/sdk/widgets/) — ufficiale Expo, **alpha** |
| Immagini nei widget | ✅ | 🔴 **non ancora supportate** in `@expo/ui` |
| Build provabile | ✅ EAS Build → APK, **senza costi** | 🔴 serve un **Mac** (compilazione locale) o l'**Apple Developer Program**, $99/anno |

🔴 **Due blocchi indipendenti su iOS**, e vale la pena tenerli distinti perché si sciolgono in momenti diversi: (1) `expo-widgets` **non supporta ancora le immagini**, e quattro widget su cinque vivono di foto e copertine — oggi su iOS sarebbero testo soltanto; (2) si sviluppa da **Windows**, e senza Mac né account Apple una development build **non si installa** sull'iPhone. Il primo si scioglie da sé quando la libreria matura, il secondo solo comprando qualcosa.

**Android invece è fattibile appena si accetta il prebuild**, ed è la strada da cui partire quando si riprende.

#### ⚠️ E la decisione che non è tecnica

🔑 **Un widget mette foto ed eventi della coppia sulla home screen, dove non c'è nessuna autenticazione**: chiunque prenda in mano il telefono li vede **senza sbloccarlo**. Il registro dei trattamenti classifica le fotografie a sensibilità **massima**, quindi questa è la stessa classe di scelta di **D-04** e **D-05** — non un dettaglio di presentazione, e **va nel threat model prima del codice**, non dopo. Il widget «foto» quasi certamente vuole un interruttore per spegnerlo; gli altri quattro vanno pesati uno a uno, perché «prossimo evento» può rivelare a un terzo dove sarete stasera.

⚠️ **I primi tre widget sono testo e date**: quelli sono gli unici che non toccano il nodo delle immagini, e sono anche quelli che si potrebbero fare per primi su entrambe le piattaforme.

#### Precondizioni, in ordine

1. **Decisione dell'utente sul prebuild** — cambia il modo di provare l'app tutti i giorni (via Expo Go, dentro una development build installata). In cambio sblocca anche i permessi mai visti di **B-20** e la nuova API di `expo-calendar`, che aspettano lì.
2. **Threat model dei widget** prima del codice, secondo `Rule/regole-sviluppo-sicuro.md`.
3. **Android per primo**, con `react-native-android-widget` e un APK da EAS Build.
4. **iOS quando** `expo-widgets` supporta le immagini **o** arriva l'account Apple — i due eventi sono indipendenti e serve il primo comunque.

### La piattaforma — aggiornato il 2026-09-03

- ⬜ **Migrare `lib/importa.ts` alla nuova API di `expo-calendar`** (`getCalendars()`, `listEvents()`, `requestCalendarPermissions()`), oggi impossibile: la nuova API **non esiste in Expo Go**. Si fa alla prima development build, insieme ai permessi di **B-20** che pure lì aspettano. Fino ad allora `expo-calendar/legacy` è la scelta giusta, non un ripiego provvisorio da correggere.
- ⚠️ **Cercare altri usi di API Expo spostate o rimosse da SDK 55/56/57**, con lo stesso metodo che ha trovato **B-49**: non i changelog, ma un giro sui pacchetti `expo-*` che il progetto importa, a caccia di `@deprecated … will throw in runtime`. `tsc` non li vede e il bundle nemmeno.

- ✅ **Aggiornare a SDK 57** — **fatto il 2026-09-03** (**D-92**): tre passi, tutti verdi a compilazione e contro il database. ⚠️ Mai visto su un telefono: vedi il PUNTO DI RIPRESA. La lista qui sotto è quella scritta **prima** di farlo, e ha retto; in più sono usciti `absoluteFillObject` (sparito in RN 0.85) e le tre regole del React Compiler. Era necessario dal 2026-09-03: l'Expo Go dell'App Store è alla 57.0.9 e include un solo SDK, quindi il progetto su 54 non si apre più su iPhone. La guida ufficiale chiede di salire **un SDK alla volta** — `npm install expo@^55.0.0` → `npx expo install --fix` → `npx expo-doctor`, poi 56, poi 57 — leggendo il changelog di ciascuno. Cosa tocca **questo** progetto, dai changelog letti e da un grep sul codice del 2026-09-03:
  - **55** (RN 0.83, React 19.2): `newArchEnabled` ed `edgeToEdgeEnabled` **spariscono da `app.json`** — le abbiamo entrambe a `true`, vanno tolte; `expo-blur` rinomina `experimentalBlurMethod` → non lo usiamo; `expo-av` esce da Expo Go → non lo usiamo.
  - **56** (RN 0.85, TypeScript 6.0): `expo-router` **non dipende più da react-navigation** — `components/barra-volante.tsx` importa `BottomTabBarProps` da `@react-navigation/bottom-tabs` e i tre pacchetti `@react-navigation/*` sono in `package.json`; c'è un codemod (`npx expo-codemod sdk-56-expo-router-react-navigation-replace`). **`expo/fetch` diventa il `fetch` globale**: cinque `fetch(` diretti (Google Places, TMDB, e `fetch(piccola.uri)` in `lib/foto.ts` su un URI **locale** — ⚠️ da verificare che `expo/fetch` accetti `file://`, altrimenti `EXPO_PUBLIC_USE_RN_FETCH=1` nel `.env`). `copy()`/`move()` di `expo-file-system` diventano asincroni → `lib/esporta.ts` non li usa. `@expo/vector-icons` non è più dipendenza di `expo` → è in `package.json` ma il codice non lo importa: si può togliere.
  - **57** (RN 0.86, reanimated 4.5): nessun breaking change dichiarato; usare `expo` ≥ 57.0.9 (regressione di memoria di worklets/reanimated, corretta lì).
  - ⚠️ **Fuori dai changelog, da verificare compilando**: NativeWind 4.2 + Tailwind 3.4 su RN 0.86; `expo-glass-effect` (siamo alla 0.1.x, l'API di `GlassContainer` può essere cambiata — `components/ui/vetro-nativo.native.ts`); `react-native-maps`; `@react-native-community/datetimepicker`. A ogni passo: `tsc`, `eslint`, bundle web, e **poi** il telefono. Le tre suite Node (`test:rls`, `test:parole`, `test:partita`) non dipendono dall'SDK e restano la prova che il backend non è stato toccato.
  - Le due alternative, scartate salvo ripensamenti: **`eas go` + TestFlight** (un Expo Go a SDK 54 costruito da noi — richiede l'account sviluppatore Apple, che serve comunque per pubblicare, ma lega la prova a EAS da subito) e **restare su 54 provando solo su Android** con `npx expo-go install --sdk 54 --platform android` (l'iPhone è il telefono su cui si è provato tutto finora).
- ⬜ **Rivedere i 65 avvisi del React Compiler** (`react-hooks/set-state-in-effect` 27, `refs` 19, `immutability` 17, più due `no-unused-vars` in `lib/luoghi.ts`), portati ad avviso in `eslint.config.js` con D-92. Uno a uno, a mano: la maggior parte è deliberata (B-43, D-90) e la correzione «da manuale» — stato derivato, ref non letti in render — cambierebbe il comportamento dei giochi. Sessione dedicata, con i telefoni.
- ⬜ **`@react-native-community/datetimepicker` è passato da 8.4 a 9.1** (un major) con `expo install --fix`, e il suo changelog non è stato letto. Se il selettore data si comporta diversamente, è il primo sospetto.
- ⬜ **Rileggere `app.json` dopo `eas init`** (2026-09-03): ha aggiunto una lista esplicita di permessi Android (`READ/WRITE_CALENDAR`, `ACCESS_COARSE/FINE_LOCATION`, `RECORD_AUDIO`), quattro plugin (`expo-image`, `expo-sharing`, `expo-status-bar`, `expo-web-browser`) ed `extra.router: {}`. Coerenti con l'uso, ma non scelti da nessuno: `RECORD_AUDIO` in particolare va tolto se non serve (viene dal selettore immagini, per i video), prima del primo build — è un permesso che il revisore vede.
- ⬜ **Deprecazioni di RN 0.86 segnalate dal bundle web**: `props.pointerEvents` → `style.pointerEvents`, `shadow*` → `boxShadow`. Solo avvisi; da sistemare quando si toccano `components/ui/vetro.tsx` e le carte.

### Le funzioni — aggiornato il 2026-09-03

- ⬜ **«Eliminato — annulla» al posto della domanda** (da D-94): una cancellazione differita di qualche secondo, o un cestino, toglierebbe la conferma da tutti e sei i punti e proteggerebbe meglio. Costa una colonna `cancellato_il` sulle tabelle interessate, le policy RLS che la rispettano, e la decisione su cosa succede se l'altro guarda in quei secondi. È un progetto suo, non un ritocco.

### I giochi — aggiornato il 2026-09-03

- ✅ **L'insegna del ruolo nel quiz** — fatta (**D-91**, 2026-09-03): chi risponde per sé e chi indovina, grande e per tutti e due, in ufficiale e in personalizzata. ⚠️ Non vista su un telefono: vedi il PUNTO DI RIPRESA.
- ⬜ **La stessa insegna negli altri giochi?** Obbligo o verità ha ancora la pillola piccola (`app/gioco/obbligo.tsx`), il disegno un titolo a corpo 2xl. **Non chiesto**: si decide dopo aver visto se l'insegna del quiz funziona sul telefono, non prima.
- ✅ **Test automatici per il quiz** — fatti (`npm run test:partita`, 152 asserzioni in tutto).
- ✅ **`obbligo_verita`** — fatto (**D-86**, **D-87**). ⚠️ Mai giocato su un telefono: vedi il PUNTO DI RIPRESA.
- ✅ **Publication realtime di `round_pronto`** — verificata: l'evento arriva (B-42 per il modo in cui la prima verifica sbagliava).
- ✅ **Il banco personalizzato della coppia (D-19, 11-bis)** — fatto (**D-88**, migrazione `0028`) per disegno, quiz e obbligo o verità. ⚠️ Aperto per la prima volta su un telefono il 2026-09-02 (seconda sessione), e ha dato subito **B-45** e **B-46**; una partita personalizzata intera non è ancora stata giocata. Vedi il PUNTO DI RIPRESA.
- 🔴 **Da decidere in futuro, chiesto dall'utente il 2026-09-02**: le carte scritte dalla coppia **restano sue e si accumulano**, oppure valgono solo per la partita in cui sono state scritte? Oggi si salvano sul server e si usano per-partita; `domanda.partita_id` tiene la porta aperta in tutte e due le direzioni, e togliere il filtro è più facile che ricostruire un'attribuzione che non c'è.
- ⬜ **La versione personalizzata della telepatia**, tolta il 2026-09-02 su richiesta dell'utente: costerebbe quaranta caselle da riempire prima di cominciare (dieci insiemi di quattro opzioni), che è la ragione per cui è fuori.
- ⚠️ **Rigenerare `lib/database.types.ts`** con `supabase gen types typescript`: i blocchi scritti a mano sono quelli delle 0011→0016 **più** `round_pronto` della 0027. Vanno via tutti insieme, e finché restano i tipi dicono ciò che *crediamo* ci sia nello schema.
- ⬜ **Test automatici per il disegno**, l'unico gioco la cui parte specifica non è coperta: la suite verifica il segreto della parola e i punti, non i tratti — che non si salvano da nessuna parte (disegni effimeri), quindi non c'è niente da interrogare. Da valutare se valga la pena.
- ✅ **`npm install` su questo dispositivo** — fatto il 2026-09-02, e non era cosmesi: senza, Expo non si avviava affatto. Lockfile invariato.


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
   - [x] **Le liste le crea la coppia** — 2026-08-28, **D-68** / migrazione **0022**: carosello di carte come l'hub dei giochi, carta «+» in fondo, «Elimina» e «Apri» sotto, e le voci dentro. ⚠️ Migrazione **da applicare**, e **mai visto girare**.
   - [x] **Lista «Film» di default, locandine automatiche e recensioni** — 2026-08-28, **D-69** / migrazione **0023**. ⚠️ Serve `EXPO_PUBLIC_TMDB_KEY` nel `.env`.
   - [x] **I luoghi arrivano dalle wishlist, non dalla mappa** — 2026-08-28, **D-70** / migrazione **0024**: «Viaggi» e «Ristoranti» di default, mappa come registro dei visitati, colori non adiacenti.
   - [x] **La mappa è di sola lettura e le liste di partenza sono protette** — 2026-08-28, **D-71** / migrazione **0025**, più i difetti **B-26** e **B-27**.
   - [x] **Tre pin sulla mappa, e l'hub che rilegge** — 2026-08-28, **D-72**, più i difetti **B-28** e **B-29**. Nessuna migrazione: è tutto lato app.
   - [x] **La copertina di un evento senza foto viene dal suo luogo** — 2026-08-28, **D-73**. Nessuna migrazione.
   - [ ] **Scegliere il tipo creando una lista** (voci o film): la colonna `lista.tipo` esiste già, manca solo la scelta nel foglio di creazione — oggi si può avere una sola lista di film, quella automatica.
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
    - ✅ **Il disegno è deciso dal 2026-09-04** (**D-95**): è la **lontra** di [`docs/mascotte.md`](docs/mascotte.md) — tavolozza, tratti invariabili e prompt di generazione per stadio. Sostituisce le forme geometriche previste da D-09, senza toccare la logica di crescita.
    - ✅ **Gli stadi sono tre** (**D-96**, 2026-09-04), e coincidono col materiale esistente: cucciolo · il riferimento · adulta. Nessuno stadio da inventare.
    - [ ] ❓ **Decidere quanti umori** — è l'**unica** cosa che manca prima di poter generare le immagini: il conto è `3 × umori`.
    - [ ] ❓ **Da dove viene il senso di crescita fra una transizione e l'altra** (D-96): con tre stadi la creatura cambia due volte in tutta la sua vita, mentre P-03 lega la crescita a ogni partita completata. Da decidere quando si implementa.
    - [ ] 🔴 **Decidere come si anima.** Nano Banana produce **raster**; D-09 prevedeva `react-native-svg` e una sostituzione con **Lottie**, che è vettoriale. Tre strade con costi diversi in `docs/mascotte.md` §9, nessuna scelta. Va deciso **prima** di generare in massa, perché cambia quante immagini servono.
    - [ ] ⚠️ **Vincolo di P-01 da applicare al disegno** (D-95 §5): nessuno stadio può rappresentare **deperimento** e nessun umore può leggersi come **rimprovero** per l'assenza. *La creatura cresce e basta.*
    - ✅ **Immagine di riferimento in repo** dal 2026-09-04: [`assets/mascotte/riferimento.jpg`](assets/mascotte/riferimento.jpg), 2048×2048. È anche lo **stadio 2**. ⚠️ È un JPEG: per l'asset dell'app servirà un PNG rigenerato dalla fonte, non ricompresso da questo.
    - [ ] ⚠️ **Verificare le condizioni d'uso commerciale** del servizio di generazione, se la mascotte finisce nell'icona o negli screenshot dello store. Non verificato.

> **Le partite completate alimentano la creatura** (P-03): la ricompensa è la crescita condivisa, **non** un punteggio di compatibilità che resta.
> **Dettaglio emerso il 2026-08-12 sulla mappa**: ogni luogo può avere **foto associate**. Lo schema lo prevede dal primo giorno — una foto può appartenere a un luogo — anche se l'interfaccia arriva dopo.

### La chiave di Google Places — aggiunto il 2026-08-27
- [ ] **Tetto di quota giornaliero + avviso di budget** su Google Cloud. Da fare **subito**, non prima di pubblicare: finché la chiave sta nel bundle è l'unica cosa che impedisce davvero un conto a sorpresa.
- [ ] 🔴 **Spostare la chiave dietro una Edge Function di Supabase**, prima di utenti veri. Oggi vive in `EXPO_PUBLIC_GOOGLE_PLACES_KEY`, cioè **dentro il bundle**: chiunque scarichi l'app può estrarla, e `urlFotoGoogle` la mette anche nella *query string* delle immagini, dove finisce in cache e log. Le "application restrictions" di Google non chiudono il buco per una `fetch` scritta a mano — valgono per gli SDK nativi, che mandano da soli gli header d'identità, e chi ha copiato la chiave può fabbricarli. Con la funzione la chiave sta in un secret, si può limitare per utente autenticato, e si spegne senza ripubblicare l'app.

### Cambiare partner senza distruggere la coppia — aggiunto il 2026-08-28 (terza sessione)

🔴 **Manca la terza via fra l'invito e lo scioglimento, e il buco si è visto usandolo.** Il 2026-08-28 è stato necessario sostituire il secondo membro di una coppia esistente. Non c'è **nessun** modo di farlo dall'app, e non è una svista: `coppia` e `membro_coppia` non hanno policy di INSERT/UPDATE dal client (**D-14**/**D-25**), quindi dal telefono è impossibile per costruzione. L'unica strada è stata **SQL a mano con la chiave `service_role`** dal dashboard — cioè scavalcare a mano l'unico strato di autorizzazione che questo progetto ha.

**Perché le due vie esistenti non bastano, entrambe per una ragione diversa**:
- **L'invito** (0003) richiede un posto libero: `conferma_invito` rifiuta se `n_membri_attivi >= 2`. Presuppone una coppia che si **forma**, non una che **cambia**.
- **`sciogli_coppia()`** (0004) libera il posto, ma è progettata per la fine di una storia: duplica i contenuti condivisi uno a testa, recide il legame, e **cancella creatura, punti, partite e domande**. Usarla per un cambio di partner distruggerebbe proprio ciò che si vuole conservare.

⚠️ **E c'è una conseguenza che nessuna delle due gestisce, e che va decisa prima di scrivere la funzione.** La sostituzione secca lascia dentro la coppia tutto ciò che ha scritto il membro uscente, e le policy di lettura sono `e_membro_attivo(coppia_id) or autore_id = auth.uid()` — quindi **il membro nuovo eredita la lettura di foto e recensioni del precedente** (0001:410-424 per `recensione` e `foto`). L'unica tabella che resta chiusa è `invio_sigillato`, author-only in ogni fase (**D-12**). Stessa cosa per **creatura e punti**, che sono per `coppia_id` e quindi si ereditano: è così che `sciogli_coppia()` li cancella, per coppia e non per membro.

🔑 **La lezione, che vale oltre questo caso**: `sciogli_coppia()` fa **due** cose insieme — *libera il posto* e *chiude la storia* — e finché sono un blocco unico non si può fare la prima senza la seconda. Il difetto non è una funzione mancante: è una funzione che fa due lavori.

- [ ] **Decidere la sorte dei contenuti del membro uscente** — la scelta vera, e va fatta prima del codice. Tre letture possibili, con costi diversi: (a) restano e il nuovo membro li vede (è ciò che è stato fatto a mano, ed è il più permissivo); (b) restano ma solo al loro autore, riusando la duplicazione di D-21; (c) la coppia riparte vuota. ⚠️ Nessuna è ovvia, ed è il punto in cui si decide se l'app tratta la coppia come **contenitore** o come **relazione**.
- [ ] **Scrivere `sostituisci_membro()`** come funzione `security definer`, con le guardie già scritte altrove e non reinventate: chiamante membro attivo della coppia, il subentrante non già in un'altra coppia (la guardia di `conferma_invito`), `uscito_il` chiuso invece che riga cancellata (l'appartenenza è un **intervallo**, 0001).
- [ ] ⚠️ **E il consenso: chi può farlo?** Lo scioglimento è **unilaterale di proposito** (TB-2: intrappolare chi ha bisogno di uscire sarebbe il danno peggiore). Ma una *sostituzione* unilaterale è un'altra cosa — significa che uno dei due può **rimpiazzare l'altro** in una coppia che continua a esistere, tenendosi i contenuti condivisi. Va deciso, non ereditato dallo scioglimento per analogia.
- [ ] **Traccia in `registro_azioni`**, come fa `sciogli_coppia()` e per lo stesso motivo: un cambio di membro è un atto, non un aggiornamento.

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

### Pubblicazione sugli store, con i pagamenti dentro — deciso il 2026-08-29

🔴 **Decisione dell'utente del 2026-08-29**: LifeCouple si pubblica **con gli abbonamenti già attivi** — download gratuito, «Insieme» acquistabile dalla versione 1.0. Ribalta la voce *«Monetizzazione — rimandata»* qui sotto, che **resta scritta**: il perché del cambio sta in [`Marketing/LifeCouple/monetizzazione.md`](../../Marketing/LifeCouple/monetizzazione.md) §0-bis, il piano operativo in [`docs/pubblicazione.md`](docs/pubblicazione.md).

⚠️ **«Gratis da scaricare» non è «gratis» per gli store**: per Apple e Google conta se incassi. L'app è commerciale dal primo giorno, con gli accordi fiscali e la revisione più severa che ne seguono.

**I due muri — non ritardi, esiti:**
- [ ] 🔴 **Cancellazione dell'account dall'app.** Obbligatoria su Apple (un'app che crea account deve poterli cancellare **in-app**), dichiarata e servita anche via web su Google. **Non esiste**: `app/` ha 17 schermate e nessuna di impostazioni. E **non è una schermata**: eliminare da `auth.users` richiede `service_role`, quindi è la **prima Edge Function** del progetto — il repo non ne ha nessuna. ⚠️ Da progettare insieme allo **scioglimento** (D-04/D-21), che è un atto diverso e reversibile: chi preme «cancella account» credendo di sciogliere fa la cosa irreversibile al posto di quella che non lo è.
- [ ] 🔴 **Licenza TMDB — ancora aperta.** Gratuita per uso **non commerciale**; con gli abbonamenti l'uso è commerciale dal primo giorno, quindi resta un **blocco alla pubblicazione**. Il 2026-09-04 si era deciso di passare a **TheTVDB** (**D-99**) — gratuito sotto i 50.000 $/anno di ricavi — e il codice era stato scritto; ⚠️ **ritirato in giornata perché TheTVDB ha problemi con la creazione di nuovi account** e la chiave non era ottenibile. La ricerca completa e le alternative scartate restano in **D-99**: se un domani gli account si sbloccano, il lavoro è descritto e non va rifatto. **Le mosse rimaste, in ordine:**
  1. 🔑 **Scrivere a TMDB** — è ora la mossa principale e costa una mail. Lo staff ha dichiarato nei forum di star preparando *«una nuova offerta pensata per le app piccole»*, e il caso di LifeCouple è esattamente quello dei tanti indie che se ne lamentano: ricavi di pochi euro al mese contro 149 $.
  2. **Riprovare TheTVDB** quando la registrazione funziona.
  3. **Togliere le locandine da fonte esterna** — costo zero e nessun rischio: la lista dei film resta identica, perde solo la copertina automatica. È il ripiego che rende la pubblicazione possibile comunque.
- [ ] 🔴 **L'abbonamento è della coppia, lo store vende a una persona.** Non esiste un abbonamento intestato a due: uno paga e il diritto va esteso all'altro, cosa che il telefono di chi non ha pagato non può fare (non ha ricevute). Servono webhook → Edge Function → colonna su `coppia` → policy RLS. ✅ Non è una migrazione di dati contesi: si aggiunge una colonna. ⚠️ **Da decidere prima del codice**: che fine fa il diritto **allo scioglimento**? Se la colonna sta su `coppia`, sparisce per entrambi — è la stessa domanda che D-16 ha già dovuto sciogliere per la creatura.

**Il resto, in ordine di dipendenza:**
- [ ] 🔴 **Richiedere il D-U-N-S** — è attesa pura e blocca gli account organizzazione, quindi si fa **per primo**, prima che l'app sia pronta. 🔑 **Verificare se esiste già**: D&B assegna numeri anche senza richiesta, e molte imprese ne hanno uno senza saperlo. ⚠️ I dati su Apple devono combaciare **alla lettera** col record D&B, o la verifica fallisce senza dire quale campo non torna.
- [ ] Account **Apple** e **Google** come **organizzazione** (non persona fisica): l'editore diventa F.R. di Busato Fausto, e su Google si evita la regola dei **12 tester per 14 giorni** che colpisce gli account personali recenti.
- [ ] **`eas.json`** (profili development / preview / production) e **variabili come secret su EAS**. ⚠️ Il `.env` non è versionato: è esattamente ciò che il 2026-08-29 ha lasciato la chiave TMDB su un dispositivo solo.
- [ ] **Primo build di sviluppo** → si provano finalmente i **tre testi dei permessi** (B-20, mai visti da nessuno) e si chiude il **backlog 11-quater**: sono scritti solo in italiano mentre l'app è bilingue (D-18).
- [ ] **Pagamenti**: libreria (`expo-in-app-purchases` è abbandonata — restano `react-native-iap` o RevenueCat), schermata del listino, **«Ripristina acquisti»**, prodotti configurati sui due store, accordi **Paid Apps** con dati bancari e fiscali. ⚠️ Cancellare l'account **non** cancella l'abbonamento: va detto all'utente nel momento in cui cancella.
- [ ] 🔴 **Account demo già appaiato per il revisore.** D-25 dice che senza partner l'app non fa niente, e il revisore è **una persona sola**: aprirebbe l'app, non avrebbe nessuno da invitare, e la segnalerebbe come non funzionante. ⚠️ E l'accesso è **via codice email**, che un revisore non può ricevere: serve una porta d'ingresso dedicata, da progettare guardando il threat model e non la sera prima della sottomissione.
- [ ] **Documenti privacy** adattati dai modelli in `Rule/` e **pubblicati a un URL** (ci sono già `fr-busato` e `heleox-landing` per ospitarli), più **App Privacy** e **Data safety** compilate da `threat-model.md` §1.
- [ ] **Controlli sul nome** (EUIPO cl. 9 e 42, disponibilità sui due store, dominio, handle) — già in elenco dal 2026-08-12. ⚠️ Da fare **prima** degli screenshot in due lingue, non dopo.

⚠️ **Stima: 7–11 settimane** dal 2026-08-29, D-U-N-S permettendo. È una stima, non una data: non va in `elenco-progetti.md`. 🔑 Il collo di bottiglia non è il lavoro — 17 giorni sono bastati per 25 migrazioni e due giochi — sono le **attese** e le **revisioni**, che non accelerano lavorando di più.

🔴 **E una condizione che precede tutto il piano**: l'app **non è verificata**. Sei difetti su sette dei giochi sono corretti e mai riprovati, e le Liste hanno decine di punti mai visti girare. La prima partita vera ha fatto uscire sette difetti in un colpo. Pubblicare prima significa scoprirli con le recensioni — e su un'app che incassa, con le richieste di rimborso.

### 🔴 La fine del servizio — tre domande da decidere PRIMA, non quando servirà (2026-08-31)

Emerso chiedendosi come si rimuove un domani l'app dagli store. **Non serve costruire niente adesso: serve decidere**, perché tutte e tre vincolano cose che si stanno per scrivere.

**Il fatto meccanico da cui parte tutto**: *togliere l'app dallo store non la toglie dai telefoni*. Su entrambi gli store gli utenti esistenti continuano a usarla (su Apple possono anche **riscaricarla**), e su Google un'app già pubblicata **non si può eliminare** — si toglie dalla pubblicazione e il record resta. ⚠️ **E il package name, dopo anche una sola installazione, non è più riutilizzabile da nessuno — nemmeno da noi.** `com.lifecouple.app` è per sempre.

**Le tre domande:**

1. **Quanto preavviso ci si impegna a dare?** Se lo si scrive nei termini diventa una promessa esigibile; se non lo si scrive, va improvvisato nel momento peggiore.
2. **Che fine fanno gli abbonamenti annuali in corso?** 🔑 **È la domanda che decide se si può chiudere in due mesi o in dodici.** Su Apple, togliere dalla vendita un abbonamento auto-rinnovabile **ferma i rinnovi** — ma resta l'obbligo di **fornire il servizio fino alla scadenza già pagata** e di ripristinare gli acquisti. Chi ha pagato l'annuale a gennaio ha diritto fino a dicembre. L'alternativa sono i rimborsi.
3. 🔴 **Chi cancella i dati, e come?** ✅ La **portabilità esiste già** (D-78): l'export c'è, e mezza procedura di dismissione è costruita senza essere stata pensata per questo. ❌ Ma la **catena di cancellazione è per un utente alla volta**: una cancellazione **di massa** non esiste. Spegnere Supabase e basta non è una cancellazione a norma — i dati restano finché qualcuno paga il conto, e poi spariscono in un modo che nessuno ha documentato. **Con fotografie private dentro, non è un dettaglio.**

🔑 **È la domanda ricorrente del progetto applicata alla fine invece che all'inizio**: *questo si può decidere dopo, o dopo sarebbe una migrazione di dati contesi?* Ed è parente stretta del **rimborso alla rottura** già aperto in [`Marketing/LifeCouple/monetizzazione.md`](../../Marketing/LifeCouple/monetizzazione.md) §5 — là è una coppia che si scioglie, qui è il servizio che chiude, ma la domanda è identica: **chi ha pagato per qualcosa che non c'è più?**

⬜ **Da fare quando si decide**: scrivere il preavviso nei termini d'uso e nell'informativa, e mettere a backlog la cancellazione di massa.

### Rimandato con motivo
- **Monetizzazione** — non è l'obiettivo (V3), e introdurla presto obbligherebbe a gestire pagamenti e fatturazione su un progetto non core. 🔴 **SUPERATO il 2026-08-29**: l'utente ha deciso di pubblicare già con gli abbonamenti. La voce resta perché *una decisione giusta smette di esserlo quando cambia ciò su cui poggiava*, e cancellare il ripensamento toglie l'informazione più utile delle due. Il costo che questa riga temeva — pagamenti e fatturazione su un progetto non core — **è stato accettato**, non smentito.
- **Vista web** — nessuna domanda dimostrata; si valuta se emerge dall'uso reale.

---

## 7. PUNTO DI RIPRESA

> **Nota del 2026-09-04 (seconda sessione) — l'ordine qui sotto NON cambia, ma ora c'è del codice nuovo da provare.** A differenza della prima sessione del giorno, questa **ha toccato l'app**: il nuovo ingresso (D-97), il questionario (D-98) e la data d'inizio correggibile dalle impostazioni. Tutto verificato **a compilazione e nella preview web**, niente su un telefono — quindi le voci qui sotto restano prime, e le nuove si aggiungono in coda come 000000-c/d/e.
>
> 🔴 **Prima di provare il questionario serve applicare la migrazione `0029`**: finché non è applicata, `salva_profilo_coppia` e `cancella_profilo_coppia` non esistono e l'invio fallisce. Il resto dell'ingresso non la usa.

> **Nota del 2026-09-04 — l'ordine qui sotto NON è cambiato.** La sessione del 4 settembre ha prodotto solo documentazione e un'immagine ([`docs/mascotte.md`](docs/mascotte.md), `assets/mascotte/`): **nessuna riga di codice, nessun comportamento dell'app toccato**, quindi tutto ciò che segue resta valido parola per parola e i controlli sul telefono restano la prima cosa da fare.
>
> Sul fronte creatura, delle tre domande aperte quel giorno **due hanno avuto risposta**: è la creatura (**D-95**) e ha **tre stadi** (**D-96**), che coincidono col materiale già prodotto. Restano **quanti umori** — l'unica cosa che manca prima di poter generare le immagini — e **come si anima un raster** (`docs/mascotte.md` §9). Nessuna delle due è codice da verificare su un telefono: non hanno una posizione in questa lista, stanno nel backlog alla voce 12.

**Aggiornato al 2026-09-03 (terza parte)** — le conferme di eliminazione (**D-94**) e l'importazione dal calendario riparata (**B-49**). Supera il punto della seconda parte su una riga: **il primo difetto vero dell'aggiornamento a SDK 57 è stato trovato**, e non era in nessuna delle voci della lista dei controlli mirati.

### Dove siamo, in una riga

**Sei eliminazioni ora chiedono conferma e l'importazione dal calendario non è più rotta** — tutto verificato a compilazione, nella preview e contro il database; **niente su un telefono**.

### 🔴 Cosa guardare al prossimo giro, in ordine

000000. 🔴 **«Importa dal calendario» sul telefono** (B-49): deve chiedere il permesso, poi mostrare l'elenco delle voci raggruppate per calendario. ⚠️ Se restasse a caricare, la correzione non è bastata e il prossimo posto da guardare è il messaggio d'errore ora visibile in schermata. Provare anche a **importare davvero** qualcosa: la scrittura sul database non è cambiata, ma non la si vede da settimane.

000000-a. 🔴 **Le sei conferme nuove** (D-94), una per una: evento dal calendario · cartella nella galleria · commento in un evento · posto dalla mappa · posto o voce dalle liste · carta in preparazione di una partita personalizzata. Cosa deve succedere: compare la domanda, **«Annulla» è il primo bottone**, e la nota dice cosa si porta via. Poi la parte che conta: **premendo «Annulla» non deve cancellare niente**, e premendo «Elimina» deve cancellare *davvero* — una conferma che non cancella è peggio di nessuna conferma.

000000-b. ⚠️ **Le due conferme che c'erano già** (le foto in galleria e nell'evento) non sono state toccate, ma il ripiego web di `chiediConferma` non le riguarda: se un giorno le si vorrà uniformare, passano anche loro da `chiediConferma`.

000000-c. 🔴 **Il nuovo ingresso, su un telefono vero** (D-97): il saluto con la mascotte nella metà colorata e la curva che monta sul bianco; premendo «Crea il tuo account» il colore **riempie** lo schermo e la collina sparisce senza lasciare una gobba; le quattro pagine scorrono col dito e i pallini seguono. ⚠️ **La cosa che il browser non può dire**: il blocco colorato è alto una frazione dello **schermo**, e il contenuto si allinea recuperando il margine di sistema — su un telefono col notch, o con la barra gesti, è lì che si vede se i due righelli coincidono davvero. Guardare anche che «Salta» non finisca sotto la tacca.

000000-c-bis. 🔴 **B-50, prima di tutto il resto dell'ingresso**: nella spiegazione, «Avanti» porta davvero alla pagina successiva? In preview web **no** — i pallini avanzano e il contenuto resta fra due pagine. Su iOS il paging è nativo e con ogni probabilità funziona: se è così, B-50 si chiude come difetto della sola preview. Provare **entrambi** i modi, perché dicono cose diverse: il **dito** (che è il gesto principale) e il **bottone**.

000000-d. 🔴 **Il questionario** (D-98), **dopo aver applicato la 0029**: l'invito compare in home quando la coppia è completa; risponde, invia, e le risposte si rileggono riaprendolo dalle impostazioni. Poi le due cose che contano più delle risposte: **«Non adesso» deve far sparire l'invito per sempre** (è memoria locale, per utente), e **«Cancella le risposte» deve cancellare davvero** — è una revoca di consenso, e una revoca che non revoca è il difetto peggiore di tutta questa funzione. ⚠️ Verificarla **rileggendo**, non fidandosi dell'assenza di errore: è la lezione di B-23.

000000-e. ⚠️ **La data d'inizio dalle impostazioni**: cambiarla e controllare che sul calendario **«Il nostro inizio» si sposti invece di sdoppiarsi** — l'indice unico lo impedisce, ma è proprio la cosa che nessuno ha mai visto succedere. E che il contatore in home segua. Serve il secondo account per vedere che si sposti anche **dall'altra parte**.

Poi la lista della seconda parte (00000-a → 00000-e: vetro, foto, selettore data, mappe, edge-to-edge, NativeWind) e quella della prima (l'insegna del quiz, i cinque difetti del 2026-09-02, Android), tutte ancora valide.

### Il punto precedente: la seconda parte del 2026-09-03

**Aggiornato al 2026-09-03 (seconda parte)** — il progetto è su **SDK 57** (**D-92**): tre passi, tutti verdi a compilazione e contro il database. Supera il punto della prima parte di oggi su una riga: la precondizione per tornare sull'iPhone **c'è**. Tutto il resto di quel punto resta valido ed è riportato sotto.

### Dove siamo, in una riga

**SDK 57 a bordo e mai visto su un telefono.** L'Expo Go dell'App Store (57.0.9) ora può aprirlo; con lui si vedranno per la prima volta anche l'insegna (D-91) e le cinque correzioni del 2026-09-02.

### 🔴 Cosa guardare al prossimo giro, in ordine

00000. ✅ **L'app parte su iPhone con l'Expo Go nuovo** (2026-09-03, riferito dall'utente: *«l'app si apre, funziona tutto»*). ⚠️ Con una **precondizione nuova**, D-93: CLI loggato con un membro del team **e** progetto EAS collegato, altrimenti dal tunnel Expo Go risponde *«you need to be signed in to Expo Go and Expo CLI»*. E il primo avvio dopo un server ucciso fallisce con `session closed`: si riavvia, e si rilegge l'host dal manifest locale perché la casualità può essere cambiata.

00000-a. 🔴 **Il vetro**: `expo-glass-effect` è passato da 0.1 a 57.0. La barra volante, i tondi e le carte di vetro devono avere la loro superficie (B-15 è il precedente). Se il vetro nativo sparisse, `components/ui/vetro-nativo.native.ts` è il posto, e il ripiego a tre strati (D-35) dovrebbe comunque disegnare qualcosa: il sintomo sarebbe «vetro finto», non «niente».

00000-b. 🔴 **Il caricamento di una foto** — è l'unica riga di logica cambiata dall'aggiornamento (`lib/foto.ts`, `File` al posto di `fetch`). Su iPhone **e** su Android: la foto deve arrivare nello storage e comparire in galleria. Se fallisse solo su Android, non è la riga nuova: è il motivo per cui la riga nuova esiste, e allora va cercato `expo/fetch` altrove.

00000-c. ⚠️ **Il selettore data** (da 8.4 a 9.1, un major): aprire «aggiungi evento», scegliere data e ora, salvare. E **le mappe** (1.20 → 1.27): i pin, l'anteprima, il «+».

00000-d. ⚠️ **Android, edge-to-edge**: da SDK 55 è obbligatorio e la chiave in `app.json` è sparita; l'app la aveva già a `true`, quindi non dovrebbe cambiare niente — ma è la definizione di «dovrebbe».

00000-e. ⚠️ **NativeWind su React Native 0.86**: se una schermata perdesse gli stili è la prima cosa da sospettare, e l'ultima che un `tsc` può vedere.

Poi la lista della prima parte (0000 → 0-d), che resta valida: l'insegna del ruolo, i cinque difetti del 2026-09-02, Android.

### Il punto precedente: la prima parte del 2026-09-03

**Aggiornato al 2026-09-03** — l'insegna del ruolo nel quiz (**D-91**), chiesta dall'utente dopo una giornata di gioco che **non ha dato sintomi nuovi**. Supera il punto della seconda sessione del 2026-09-02 su una riga: i cinque difetti (B-44→B-48) sono stati giocati e non hanno morso. Tutto il resto di quel punto resta valido ed è riportato sotto.

### Dove siamo, in una riga

**I giochi girano su iPhone e nessuno dei cinque difetti di ieri si è ripresentato** — riferito dall'utente come *«mi sembrava funzionare tutto»*. L'insegna del ruolo è a bordo e **nessuno l'ha vista**.

🔴 **E da oggi l'iPhone non apre più il progetto**: l'Expo Go dell'App Store è passato alla **57.0.9** (2026-09-02) e ogni build di Expo Go include un solo SDK; il progetto è su **54**. Verificato su docs.expo.dev e sull'App Store. Finché il progetto resta su 54, su iPhone non si vede niente — né l'insegna né i cinque difetti di ieri — a meno di un account sviluppatore Apple (`eas go` + TestFlight).

### 🔴 Cosa guardare al prossimo giro, in ordine

0000. ✅ **Come tornare sull'iPhone — deciso e fatto nella seconda parte di oggi** (**D-92**): aggiornamento 54 → 55 → 56 → 57, dopo il commit di D-91, come raccomandato. Vedi il punto sopra.

000. 🔴 **L'insegna del ruolo nel quiz** (D-91), in tutti e due i modi. Cosa deve succedere: in testa al round un blocco **rosa** con la penna e «Rispondi per te» quando tocca a te dare la risposta vera, **ambra** col fumetto e «Indovina tu» quando devi indovinare; sotto, due cartellini — *Tu: …* pieno, *Partner: …* bianco; sopra le carte (o sopra il riquadro, in personalizzata) la scritta «Scegli / Scrivi la tua risposta vera» oppure «… cosa pensi che abbia risposto». Al round dopo il blocco **cambia colore** e rientra. La domanda a cui deve rispondere l'utente è una sola: **si capisce a colpo d'occhio chi fa cosa, senza leggere?** Se la risposta è «più di prima ma non abbastanza», la mossa successiva è fra le alternative scartate di D-91 (tingere la schermata), non un'altra pillola.

⚠️ **Se al primo round pari il blocco compare con un attimo di ritardo**, è voluto (D-91): finché l'elenco dei membri non è arrivato non si sa chi è il soggetto, e l'insegna preferisce non esserci a dire una cosa e poi cambiarla.

⚠️ **Sui cinque difetti di ieri** vale la distinzione del 2026-08-28: è stato un giro d'**uso**, non l'esecuzione dei cinque casi stretti (0-a → 0-c-ter qui sotto). Se uno di quei sintomi si ripresenta non è una regressione: è la finestra che il giro non ha attraversato, e la prima mossa è il suo caso di prova.

### Il punto precedente: la seconda sessione del 2026-09-02

**Aggiornato al 2026-09-02 (seconda sessione)** — la prova sui telefoni è cominciata, e ha dato subito cinque difetti (**B-44**, **B-45**, **B-46**, **B-47**, **B-48**, **D-90**). Supera il punto della prima sessione di oggi su una riga: **il server arriva ai telefoni** (tunnel), cosa che in LAN con ogni probabilità non era mai successa. Tutto il resto di quel punto resta valido ed è riportato sotto.

### Dove siamo, in una riga

**L'app gira su iPhone attraverso il tunnel**; su Android l'utente riferisce che non funziona, senza ancora un sintomo preciso. Le cinque correzioni di oggi sono a bordo e **nessuna è stata ancora vista girare**.

### Cosa ha prodotto la giornata

✅ **Il server raggiunge i telefoni**: `expo start --tunnel` con `CI=1`, configurazione `lifecouple-telefoni-tunnel` nel `.claude/launch.json` del brain. Verificato scaricando il manifest attraverso il tunnel per iOS e Android (HTTP 200, SDK 54). ⚠️ `CI=1` spegne il watch di Metro: **ogni modifica al codice richiede il riavvio del server**, e i telefoni devono ricaricare.

✅ **Cinque difetti corretti** dai sei sintomi riferiti, e la suite a **183 asserzioni** (da 174) con il blocco di B-46.

### 🔴 Cosa guardare al prossimo giro, in ordine

00. 🔴 **Android**: capire cosa vede l'utente (resta a caricare? un errore, e quale? Expo Go non si apre?) e la versione di Expo Go installata. Il manifest Android è servito dal tunnel, quindi il problema è **a valle del server**.

0-a. 🔴 **B-44 sul telefono**: scorrere *lentamente* fino alla carta accanto e premere «Gioca» — deve aprire quella carta, e per quiz, obbligo o verità e disegno deve comparire il foglio ufficiale/personalizzata.

0-b. 🔴 **B-46 sul telefono**: aprire la personalizzata del quiz, uscire con «indietro», premere «versione ufficiale» — deve comparire l'attesa ufficiale, non la preparazione.

0-c. 🔴 **B-45 sul telefono**: nella preparazione del quiz l'etichetta sopra il riquadro è «Domanda».

0-c-bis. 🔴 **B-47 sul telefono**: nel disegno personalizzato, chiuso il primo round e premuto «continua» da tutti e due, chi disegna il secondo deve vedere «che cosa disegni?» e l'altro «sta scrivendo la parola…». Poi almeno un terzo round, per vedere che i «continua» tornano a essere richiesti.

0-c-ter. 🔴 **B-48 sul telefono**: la X dentro un gioco deve chiedere «Resta / Esci, la partita resta / Annulla la partita»; dopo «Annulla», «Gioca» deve ripartire dal round 1. ⚠️ Se una partita **nuova** partisse ancora dal round 2, la causa è un'altra: l'orologio del telefono (il tempo del round è ancorato a `iniziato_il` del server, e un telefono avanti di un minuto chiude il round 1 all'istante).

0-d. ⚠️ **Le versioni dei pacchetti**: Expo segnala `expo` 54.0.36, `expo-constants` 18.0.13 e `expo-file-system` 19.0.23 sotto le attese (`~54.0.37`, `~18.0.14`, `~19.0.24`). Non toccate oggi, di proposito: non si cambiano dipendenze nel mezzo di una prova sui telefoni.

### Il punto precedente: la prima sessione del 2026-09-02

**Aggiornato al 2026-09-02** — il quarto gioco e i test che mancavano (**D-86**, **D-87**, **B-41**, **B-42**). Supera il punto del 2026-09-01 su due righe: la publication di `round_pronto` **è verificata**, e `obbligo_verita` **esiste**. Il punto del 2026-08-31 sulla pubblicazione resta valido riga per riga: oggi non è stato toccato.

### Dove siamo, in una riga

**I quattro giochi del catalogo hanno tutti una partita dietro**, e tre su quattro sono stati giocati su due telefoni veri. Il quarto no.

### Cosa ha prodotto la giornata

✅ **`npm run test:partita` passa da 42 a 152 asserzioni** contro il database vero, e copre tutti e quattro i giochi. Le due che valgono il quiz: chi indovina non legge la risposta vera nemmeno interrogando l'API col proprio token, e non se la fa dire nemmeno dalla rivelazione.

✅ **La publication realtime di `round_pronto` c'è.** Era l'unica parte della migrazione `0027` mai verificata, ed era in cima all'elenco di ieri. Verificata **non** leggendo il catalogo — con la chiave dell'app non è leggibile — ma facendo arrivare l'evento: B si iscrive, A preme «continua», l'evento arriva. 🔑 Ed è la verifica migliore delle due: il catalogo dice che la tabella è *dichiarata*, l'evento dice che il meccanismo *funziona*.

✅ **`npm run test:parole` passa da 15 a 31 controlli** e copre tutti e quattro i banchi. Estendendolo è uscito **B-41**: era **rosso da ieri**, e accusava la lista di cinquecento parole di averne centododici di troppo.

⚠️ **Due test su due hanno indicato il file sbagliato** (B-41, B-42), e uno dei due puntava proprio sul sospetto che si aveva già. È la terza volta di questa famiglia dopo B-36: quando un controllo conferma il dubbio che avevi, va cercata una prova che possa **smentirlo**.

### 🔴 Cosa guardare al prossimo giro, in ordine

0-bis. ✅ **Migrazione `0028` applicata dall'utente il 2026-09-02, e verificata.** Non «applicata» per dichiarazione: il blocco di `tests/partita.mjs` che si saltava da solo **si è acceso e passa**, quindi il vincolo sul modo, le tre policy di `domanda`, il `coalesce` di `rivela_telepatia` e il realtime sulla preparazione sono verificati contro il server. La suite è a **174 asserzioni**, verdi su tre giri consecutivi.

0-ter. ⬜ **Provare la versione personalizzata**, che è scritta e non è mai stata usata: nel disegno la parola dichiarata al proprio turno, nel quiz le cinque domande a testa e le risposte scritte, in obbligo o verità i cinque obblighi e le cinque verità a testa. ⚠️ Il pezzo più incerto è il **confronto delle risposte del quiz**: è tollerante su maiuscole, accenti e articoli, ma non conosce i sinonimi — *«pizza»* e *«margherita»* restano risposte diverse (D-88). Se in partita risultasse fastidioso, è la prima cosa da rivedere.

0. 🔴 **Provare una partita di ciascun gioco, dall'avvio.** È la verifica di **B-43**: due sintomi riferiti dall'utente (la prima parola del disegno che non arriva, e i giochi che all'avvio pretendono di uscire e rientrare) sono corretti ma **provati solo contro il database**. Le correzioni vivono in React e un test in Node non le esercita. Cosa deve succedere:
   - **il primo round del disegno parte con la sua parola**, e chi disegna la vede subito;
   - **chi non crea il round lo vede lo stesso**, senza uscire e rientrare;
   - se una partita era rimasta rotta da prima, chi disegna trova la parola scritta **adesso** (la riparazione) invece di un round muto.
1. 🔴 **Giocare `obbligo_verita` su due telefoni.** È l'unico gioco mai visto girare: ha 35 asserzioni contro il database, ma *zero* dispositivi. La lezione di ieri al contrario — una correzione provata su un solo sistema è provata a metà, una schermata provata su nessuno non è provata. Cose da guardare in particolare:
   - il passaggio fra un round e l'altro **quando il turno cambia telefono**: chi ha appena chiuso deve vedere «sta scegliendo la carta», l'altro le due carte della scelta;
   - il titolo grande **non deve** restare «Obbligo» mentre si sceglie (era un difetto mio, corretto prima di consegnare: la carta a schermo è quella del round vivo, o quella appena chiusa finché il pop-up è a schermo);
   - la leggibilità delle due carte «Obbligo»/«Verità» su Android **e** su iPhone (B-15: `fondo="pieno"`, come nel quiz).
2. ⚠️ **Il banco personalizzato della coppia (D-19, backlog 11-bis)** resta tutto da fare, e ora è **l'unico comando dell'app che promette una differenza inesistente**: la tabella `domanda` esiste dalla 0001 ed è vuota, tutti e quattro i giochi usano il banco comune scritto nel codice.
3. ⚠️ **`lib/database.types.ts`** ha ancora i blocchi scritti a mano delle 0011→0016 più `round_pronto` della 0027. Vanno via tutti insieme con `supabase gen types typescript`.
4. ✅ **Risolto il 2026-09-02**: `expo-sharing` non installato era ciò che impediva a Expo di avviarsi, non solo una riga rossa di `tsc`. `npm install` fatto, lockfile invariato, `tsc` pulito.

---

### Il punto precedente: la giornata su due telefoni (2026-09-01)



**Aggiornato al 2026-09-01** — la prima giornata di gioco su **due telefoni veri contemporaneamente** (Android + iPhone, Expo Go via LAN). Copre **D-82 → D-85** e **B-37 → B-40**, più il terzo gioco. Non supera il punto del 2026-08-31 qui sotto: quello riguarda la **pubblicazione**, che oggi non è stata toccata e resta valido riga per riga.

### Dove siamo, in una riga

I tre giochi **girano tutti e tre su due dispositivi**, verificati dall'utente. Resta fuori solo `obbligo_verita`.

### Cosa ha prodotto la giornata

✅ **Il collaudo su due sistemi ha fatto uscire quattro difetti che tre giri su iPhone non avevano visto**, e uno era lì dal **2026-08-27** (B-38, i pin della mappa su Android). 🔑 La lezione che vale più delle correzioni: ***una correzione provata su un solo sistema è provata a metà*** — e i tre giri di verifica precedenti erano tutti su iPhone.

✅ **Migrazione `0027` applicata dall'utente e verificata contro il server**: `round_pronto` esiste (risposta `200 []` contro il `404` di una tabella inventata, quindi il controllo discrimina). ⚠️ **Quella verifica NON ha coperto la publication realtime**, che con la chiave dell'app non è leggibile: la query `select count(*) from pg_publication_tables where … tablename = 'round_pronto'` è stata lasciata all'utente e **non risulta eseguita**. Se desse `0`, il «continua» si bloccherebbe **a intermittenza** — chi preme per secondo rilegge e va avanti, chi preme per primo aspetta un evento che non arriva. Sembrerebbe capriccioso e sarebbe sistematico. **È la prima cosa da guardare se il sintomo torna.**

✅ **Recuperato l'accesso a un account nato senza password** (D-74), e di passaggio è stato **collaudato sul dispositivo il meccanismo del passo 8**: la schermata «Ho dimenticato la password» manda un codice e impone una password nuova. Serviva provarlo perché è la strada con cui si consegnerà l'account demo al revisore Apple — l'unica ragione per cui la password esiste (D-74).

### Cosa resta da fare sui giochi

1. ⬜ **Il quiz non ha test automatici.** La suite (`npm run test:partita`, 42/42 verdi anche dopo oggi) copre disegno e telepatia. Aggiungerlo seguendo lo schema degli altri due.
2. ⬜ **`obbligo_verita` è l'unico gioco non implementato.** L'hub lo mostra ancora come «in arrivo», che è vero.
3. ⚠️ **Il banco personalizzato della coppia (D-19, backlog 11-bis) resta tutto da fare**: la tabella `domanda` esiste dalla 0001 ed è **vuota**. Il quiz usa il banco comune nel codice (D-84), quindi la scelta «ufficiale / personalizzata» nell'hub oggi non cambia niente.
4. ⚠️ **`lib/database.types.ts` ha un blocco in più scritto a mano** (`round_pronto`, migrazione 0027), che si aggiunge al debito già dichiarato in `Architecture.md` per le 0011→0016. Alla prima rigenerazione con `supabase gen types typescript` vanno via tutti insieme.

---

### Il punto precedente, ancora valido: la pubblicazione


**Aggiornato al 2026-08-31** — la pipeline di build e l'impianto legale documentale (**D-79, D-80**), e il deploy della Edge Function finalmente eseguito. Supera il punto di ripresa del 2026-08-29 (D-74 → D-78, B-30 → B-36). Copre D-60→D-80 e B-16→B-36.

🔴 **La cosa più importante di questo aggiornamento è una correzione: il punto di ripresa precedente diceva il falso.**

> Diceva che la Edge Function sul server era *«quella senza la cancellazione dei file»*. Verificato il 2026-08-31 con `supabase functions list`: **sul progetto non esisteva NESSUNA Edge Function**. La prova è nel deploy stesso — la funzione risulta `version: 1`, e se ce ne fosse stata una prima sarebbe la 2.
>
> ⚠️ **La differenza non è accademica**: si credeva che «Elimina account» cancellasse *parzialmente* lasciando i file orfani, mentre in realtà **falliva del tutto**. È meno grave di quanto temuto, ma per tre giorni il rischio è stato valutato sulla base di uno stato che non esisteva.
>
> 🔑 È la **quinta** occorrenza della stessa classe in questo progetto, e stavolta con una variante nuova: non «ciò che non è versionato non esiste sull'altra macchina», ma ***ciò che è scritto in un documento non esiste sul server***. Il rimedio è lo stesso di sempre — verificare contro la realtà, non contro il documento — e stavolta è bastato un comando.

**Stato dei passi precedenti:**

1. **Migrazione `0026`** — ⚠️ **rilettura ancora non mostrata.** L'utente dichiara di averla applicata il 2026-08-29; la query di verifica (attese **17 righe**, tutte `cascade` o `set null`) non è mai stata eseguita davanti a nessuno. **Resta da fare.**
2. ~~**Deployare la Edge Function**~~ — ✅ **fatto il 2026-08-31.** `npx supabase functions deploy cancella-account` → `status ACTIVE`, `verify_jwt true`, `version 1`. Il CLI **era** già autenticato (il `LegacyPlatformAuthRequiredError` del 2026-08-29 non si è ripresentato); è servito solo `npx supabase link --project-ref uegayflvtjfhjrmbibdz`. **Nessun secret da impostare**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` le inietta la piattaforma.
   ⚠️ Il `link` ha creato file di stato locale in `supabase/.temp/`, ora ignorati — **tranne** `linked-project.json`, che resta tracciato per la decisione già presa (il riferimento nel repo sì, il token no).
3. 🔴 **LA PROVA CHE CONTA — ora è il primo passo, e va fatta su un account di prova, MAI su quello vero**: registrarsi, riempire lo spazio con foto ed eventi, cancellare l'account, e poi **ricontrollare il database e il bucket**. Non la schermata che dice di sì — è la lezione di B-23, applicata al posto più pericoloso in cui potesse servire.
   🔑 **Adesso ha senso farla**, e prima no: fino al 2026-08-31 non c'era nessuna funzione da provare. Il protocollo dettagliato, coi controlli da fare e la tabella da compilare, è in [`docs/legal/catena-cancellazione.md`](docs/legal/catena-cancellazione.md) — *«Protocollo di prova»*.
   ⚠️ **Finché non è eseguita, «Elimina account» resta da non premere** su un account vero.
4. ⚠️ **Chi ha un account nato col codice via email non ha una password** (D-74): la prima volta si passa da «Ho dimenticato la password».

**Poi, sul fronte pubblicazione** (piano completo in [`docs/pubblicazione.md`](docs/pubblicazione.md)):

5. **Caricare le variabili d'ambiente come secret su EAS** (`eas secret:create`) — sono chiavi API, le carica l'utente. Poi **`eas init`** (genera il `projectId` in `app.json`) e il **primo build di sviluppo**: è ciò che fa uscire B-20, i tre dialoghi di permesso mai visti da nessuno, e apre la traduzione del backlog 11-quater.
6. 🔴 **Aprire i due account come INDIVIDUO** (D-81) — giorni, nessun D-U-N-S. **E far partire subito il reclutamento dei 12 tester** per Google: i 14 giorni di permanenza continuativa non si comprimono, quindi ogni giorno perso qui si aggiunge in fondo. ⚠️ Sono **sei coppie**, sono gli stessi beta tester del piano marketing, e sono l'unico modo di collaudare un'app che da soli non fa niente (D-25).
   🔴 **E la licenza commerciale TMDB** (`sales@themoviedb.org`, indicando il paese): con la strada individuo è rimasta **la sola coda fuori dal nostro controllo**.
   ⚠️ **Sul perché la licenza serve**, verificato sui termini TMDB il 2026-08-31: il criterio è **a livello di applicazione, non di funzione** — *«Charging users a fee for Your Application… that includes some form of integration»*. Tenere gratuita la sola parte film **non basta**. E serve un **accordo scritto**, non una dichiarazione.
   🔑 Con la licenza arrivano anche obblighi di **attribuzione** da costruire nell'app (dicitura e logo approvato, meno prominente del nostro, in una sezione Info/Crediti che oggi **non esiste**).
7. **Chiudere i quattro punti aperti nei documenti legali** (marcati `[DA DECIDERE]`/`[DA VERIFICARE]`, vedi **D-80**): email per i diritti, dati del professionista per il DSA, retention dei backup Supabase da **leggere** nel pannello, valutazione professionale sull'art. 9.
8. 🔴 **L'account demo per il revisore**, che è un ostacolo di codice e non di documentazione: l'accesso è via **codice email** e un revisore non può riceverlo, e senza partner l'app non fa niente (D-25). Serve un account **già appaiato** con dati veri dentro, e una porta d'ingresso alternativa **progettata guardando il threat model** — non aggiunta la sera prima della sottomissione.
9. ⚠️ **I controlli sul nome** (EUIPO cl. 9 e 42, store, dominio, handle) — mai fatti. Scoprire che il nome è occupato **dopo** aver prodotto gli screenshot in due lingue costa una settimana; e l'handle serve anche per il canale TikTok deciso il 2026-08-31.

✅ **Migrazioni `0022`→`0025` applicate** dall'utente il 2026-08-28 (seconda sessione), in quest'ordine — ognuna dipende dalla precedente. ⚠️ Restava scritto qui «da applicare» anche dopo, in due punti: la riga è stata corretta il 2026-08-28 (terza sessione). *Un PUNTO DI RIPRESA che dice il falso è peggio di uno vuoto: il primo lo si crede.*

⚠️ **La chiave TMDB è per dispositivo, non per progetto.** `EXPO_PUBLIC_TMDB_KEY` è stata inserita nel `.env` del dispositivo usato nella seconda sessione, ma **il `.env` è nel `.gitignore`**: su ogni altro dispositivo va rimessa a mano (gratuita su themoviedb.org → Impostazioni → API → chiave v3), e **Metro va riavviato** perché le `EXPO_PUBLIC_` entrano nel bundle a compilazione. Verificato il 2026-08-28 (terza sessione): sul secondo dispositivo Metro caricava solo `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `GOOGLE_PLACES_KEY` — la ricerca film **lo dice** invece di tacere, ma non funziona. Vale identico per `EXPO_PUBLIC_GOOGLE_PLACES_KEY`.

🔴 **E poi c'è un fronte in più mai visto girare**: le **wishlist** (**D-68**). Cosa guardare, in ordine:
1. **La sezione Liste si apre** e mostra il carosello. Se la coppia aveva dei film, deve esserci una carta **«Film»** con dentro i film di prima — se quella carta non c'è, o è vuota, la migrazione dei dati non ha funzionato ed è la cosa più grave delle due.
2. **La carta «+»** è l'ultima del mazzo, e il comando sotto diventa **uno solo** a tutta larghezza. Scorrendo avanti e indietro fra una lista e il «+», i comandi non devono **spostarsi**: cambia cosa dicono, non dove stanno.
3. **Creare una lista**: il nome, e la carta nuova compare col colore successivo del ciclo. 🔴 **Ed è anche la prova di B-24**: col campo a fuoco e la tastiera aperta, «Crea» e «Annulla» devono restare **sopra** la tastiera. ⚠️ Da guardare nello stesso giro anche il foglio «nuovo evento» del calendario, che è l'altro toccato dalla correzione e prima funzionava: se ora salta troppo in alto, è il doppio spostamento.
4. **Aprire**: le voci si aggiungono scrivendo, come i film. Le voci vecchie (i film migrati) devono avere ancora **copertina e recensioni**.
5. ⚠️ **Eliminare una lista creata dal partner** deve mostrare la frase sul permesso, non un «fatto» silenzioso. È il caso che B-23 ha insegnato a non dare per riuscito — e serve il secondo account per provarlo.
6. **Il conteggio sulla carta** (voci, e «n su m») si aggiorna tornando indietro dalla lista.

🔴 **E per i film (D-69), nello stesso giro**:
7. **La lista «Film» c'è** anche se la coppia non aveva film. Se manca, è il trigger o il riempimento all'indietro di 0023.
8. **Aprendola compare la tendina**, non il campo di scrittura. Se compare il campo, `lista.tipo` non è `film` — e il sospetto è la promozione delle liste nate da 0022.
9. **Scrivendo tre lettere arrivano i risultati con la locandina piccola.** Se resta vuoto: chiave assente (ma allora lo dice), oppure Metro non riavviato dopo aver messo la chiave.
10. **Scelto un film**, la scheda deve avere **la locandina grande**.
11. ⚠️ **Spuntato «fatto», compaiono le stelle** — ed è la parte che **non è stata scritta oggi**: esiste dal 2026-08-12 e non è mai stata vista girare. Se è rotta, è rotta da allora.
12. **La recensione del partner** si vede in sola lettura e non si può toccare: serve il secondo account.

🔴 **E per i luoghi (D-70), che è il cambio più grosso**:
13. **Esistono tre liste di default**: Film, Viaggi, Ristoranti — e i **tre colori sono diversi**. Se due sono uguali e adiacenti, è la parte del colore ad aver fallito, non la migrazione.
14. **I posti che c'erano sono finiti nella lista giusta**: i ristoranti in «Ristoranti», il resto in «Viaggi». ⚠️ Questo è il punto in cui si perde più facilmente qualcosa — se un posto non compare in **nessuna** delle due liste **e** non è sulla mappa, le due `update` di 0024 non hanno funzionato, e va guardato prima di aggiungere altro.
15. **Sulla mappa non c'è più il «+»**, né nella mappa vera né nella variante senza componente mappa (il web).
16. ⚠️ **Superato da D-72**: qui c'era scritto *«la mappa mostra solo i posti visitati o con un evento; un desiderio senza data non deve avere un pin»*. **Non è più vero** — la mappa li mostra tutti, e a distinguerli è l'icona (punto 25). Il filtro è rimasto **solo nell'elenco**, ed è il punto 27.
17. **Aprendo «Viaggi» compare la ricerca luoghi** (il «+» che galleggia), e lì un posto si aggiunge ancora.
18. 🔴 **Il passaggio automatico**: spuntare un posto in «Viaggi» deve farlo comparire sulla mappa. È il cuore della modifica, e usa codice che **esisteva già** (`segnaFatto` scrive `luogo.stato` dal 2026-08-13) — quindi se non funziona, non è codice nuovo ad essersi rotto.
19. **La riga di aggiunta non finisce più sotto la tastiera** (B-25), in una lista aperta di qualunque tipo.

🔴 **E il secondo giro su luoghi e liste (D-71), che corregge tre difetti riferiti**:
20. **Aggiungere un posto a «Viaggi»**: deve comparire **subito nella lista** (B-26). Era il difetto che si vedeva di più — il posto veniva creato e non si vedeva da nessuna parte se non sulla mappa.
21. **L'elenco dentro la mappa non mostra i posti non visitati** (B-27). ⚠️ Da guardare **insieme ai pin**: se i pin sono giusti e l'elenco no, o viceversa, sono le due copie della stessa condizione ad essere divergenti — è il debito dichiarato in B-27.
22. **Nell'elenco della mappa non c'è il cestino, non c'è la spunta, non c'è «cambia copertina»**. Solo lettura.
23. **Sulle tre liste di partenza non compare «Elimina»**, e sotto c'è la frase che dice perché. Resta il solo «Apri», nella stessa posizione.
🔴 **E l'ultimo giro (D-72), che è il più visivo di tutti**:
25. **Sulla mappa ci sono di nuovo tutti i posti**, con **tre** pin diversi: calendario **bianco** su pin **pieno** = ci siete stati; calendario **rosa** su pin **chiaro** = ci andrete; **segnalibro** grigio = desiderato, senza data.
26. ⚠️ **Il caso che distingue una correzione giusta da una che sembra giusta**: un posto con una serata **passata** deve avere il pin **pieno col calendario bianco**, non quello chiaro col rosa. Se è chiaro, «in programma» sta guardando il conteggio degli eventi invece delle loro date.
27. **L'elenco però resta filtrato** (solo visitati o con eventi): mappa e elenco ora divergono **di proposito**, e non è un difetto.
28. **Il numero sulla carta si aggiorna** tornando indietro dopo aver aggiunto una voce (B-28).
29. 🔴 **Scorrere piano e lasciare senza slancio, poi premere «Apri»**: deve aprirsi la lista che si vede, non la precedente (B-29). ⚠️ È il caso che con uno scorrimento normale **non si riproduce** — va fatto apposta.

🔴 **E la copertina prestata dal luogo (D-73)**:
30. **Un evento con un posto e senza foto** deve mostrare in testa **l'immagine del posto**, non la sfumatura rosa.
31. **Un evento con almeno una foto vostra** deve continuare a mostrare **quella**: il posto è il ripiego, non il vincitore.
32. ⚠️ **Un evento con un posto ma senza identità Google** (quelli nati da un tocco lungo, prima di D-64) deve tornare alla **sfumatura**. È il caso che il difetto di `urlFotoGoogle` avrebbe rotto — se qui compare un riquadro vuoto invece della sfumatura, quella correzione non ha preso.
33. **Nel Diario del calendario non cambia niente**: le anteprime restano solo quelle degli eventi fotografati.

24. 🔴 **La prova vera del divieto non è l'interfaccia**: è che una cancellazione forzata venga **rifiutata dal database** con un errore leggibile, non con un silenzioso «fatto». Il bottone tolto è cortesia; il trigger è la regola.

**Dove siamo, in una riga**: l'app è stata usata sull'iPhone e funziona tutta **tranne i giochi**, che restano l'unico fronte mai visto girare su un dispositivo. Migrazioni **0020** e **0021** applicate; suite tutta verde.

---

### 🔴 I giochi: la prima partita è stata giocata, e ha rotto tutto quello che c'era da rompere

✅ **Aggiornato il 2026-08-29.** La riga qui sotto diceva *«nessuna partita è mai stata giocata da due persone»*: **non è più vero**. È stata giocata, ed è servita — sei sintomi riferiti, **sette difetti** dietro (**B-30 → B-36**), tutti nello strato React e nessuno intercettato dalle 42 asserzioni verdi.

🔴 **Stato attuale: i sette difetti sono corretti, e SEI DEI SETTE non sono verificati.** Corrette per lettura, con `tsc` pulito, `expo lint` pulito, bundle Metro reale da 3236 moduli e app che rende senza errori in console — nessuna delle quali dice che una partita adesso arriva in fondo. L'unico verificato davvero è **B-36** (15/15 contro 12/15). ⚠️ *Il fatto che io non possa essere il secondo giocatore — il login manda un codice via email — è la ragione per cui questo blocco resta rosso.*

**Cosa guardare alla prossima partita, in ordine di ciò che rompeva di più**:
1. 🔴 **Il round 2 del disegno parte** (B-30). È il difetto grosso: prima nei round pari nessuno dei due si riconosceva disegnatore, quindi la partita si fermava lì. Se il round 2 nasce e i ruoli sono invertiti rispetto al round 1, B-30 è chiuso.
2. 🔴 **A chi disegna compare la parola, al round 1 *e* al round 2.** ⚠️ **Domanda ancora senza risposta**: mancava anche al **round 1**? B-30 la spiega dal 2 in poi; al round 1, leggendo il codice, non è stato trovato niente che la rompa. Se manca anche lì, c'è un ottavo difetto non ancora trovato.
3. 🔴 **La telepatia mostra l'esito** e le quattro carte **restano** durante la rivelazione, col pallino sulla scelta del partner (B-34). Se si vede ma è breve, **allora** si tara `PAUSA_FRA_ROUND` — non prima: i tre secondi c'erano già, erano tre secondi di niente.
4. 🔴 **La classifica mostra un numero** dopo una partita finita (B-31). Se resta vuota, la partita non sta arrivando a `conclusa`.
5. ⚠️ **Nessuna categoria si ripete** in una partita da 10 round (B-33). Prima capitava nell'~84% delle partite, quindi una partita pulita è già un segnale.
6. ⚠️ **La partita non si blocca.** Le cause note erano due (B-30 e B-35); se si blocca ancora, è una terza.

✅ **I due giochi sono scritti** (**D-67**): «indovina il disegno» (5 round) e «telepatia» (10 round), versione ufficiale. Con loro: i due punteggi **Intesa** e **Sintonia** al posto della Classifica, l'anello del punteggio finale, e i due banchi da 500 voci in `lib/parole.ts` verificati con `npm run test:parole` (15 controlli verdi: nessuna chiave doppia, nessuna voce vuota, 25 temi da 20, e il normalizzatore dei tentativi provato su casi veri).

⚠️ **Ma «verificati con `npm run test:parole`» va letto con B-36 in mano**: su un checkout con fine riga CRLF quel test leggeva **un tema solo** e tre dei quindici controlli non verificavano niente, dicendo di averlo fatto. Dal 2026-08-29 il test normalizza i fine riga e i 15 controlli valgono su ogni dispositivo.

⚠️ **E «la meccanica è provata» va letto con B-30 in mano.** Le 42 asserzioni erano verde su verde mentre **il round 2 del disegno non partiva affatto** sui telefoni veri: il test simula i due giocatori passandosi gli id a mano, quindi non attraversa mai il codice che *decide di chi è il turno*. 🔑 *Un test che simula i due giocatori non prova i due telefoni: prova il database sotto di loro.*

✅ **La meccanica è provata**, da `tests/partita.mjs` — non dai test avversariali, che restano quelli di RLS e non sanno niente di partite. `npm run test:partita`: **42 asserzioni su 42**, con due giocatori simulati da due sessioni vere contro il database reale. Sono provati: la partita che non parte con un solo pronto e parte col secondo, i cinque round coi ruoli che si invertono, il punteggio (3/5, scelto perché né tutto né niente), la conclusione all'ultimo round, il round telepatia intero, e la pulizia — **asserita**, che è la parte che mancava prima di B-23.

🔴 **E sono provate le due cose che a mano non si possono provare**:
- **chi indovina non legge la parola** — zero righe da `round_segreto` interrogando l'API col proprio token, verificato su tutti e cinque i round. Sul telefono si vedrebbe solo che *l'interfaccia non la mostra*, che è un'affermazione molto più debole;
- **la rivelazione della telepatia tace** con una sola scelta, né a chi ha scelto né a chi non ha scelto — e il partner non legge il sigillo dell'altro.

⚠️ **Resta non provato ciò che è esperienza, non meccanica**: che i tratti arrivino fluidi, che il tempo scorra uguale sui due schermi, che il round passi quando deve. Quello lo dice solo una partita vera. Il modo praticabile senza una seconda persona è **telefono + preview web** coi due account, che sono entrambi dell'utente. *(L'agente non può essere il secondo giocatore: servirebbe una sessione di uno dei due account, cioè un codice via email.)*

**Cosa guardare alla prima partita vera, in ordine di quanto è probabile che sia rotto**:
0. **L'hub si apre e si scorre?** Quattro carte (**D-62**, **D-65**), i puntini che si allungano, i due fogli, e il cartellino «serve il partner» al posto dei comandi se si è soli. ⚠️ E lo **zoom** premendo «Gioca» non deve essere tagliato sopra e sotto: è il motivo dei 48 punti di pista in più. È l'unico punto di questa lista che si prova **da soli**, quindi va per primo.
1. **La partita parte?** Entrambi premono «avvia» e la schermata deve cambiare **da sola** su tutti e due. Se resta ferma su uno, il sospetto è il realtime su `partita_pronto`.
2. **I tratti arrivano?** Chi indovina deve vedere il disegno **mentre** viene fatto, non alla fine. Se arriva a scatti o non arriva, è il canale broadcast.
3. ⚠️ **Il tentativo giusto viene riconosciuto?** Lo giudica il telefono di **chi disegna**. Se un tentativo palesemente giusto non passa, guardare `normalizza` in `lib/parole.ts` prima di sospettare la rete.
4. **Il round passa dopo tre secondi**: non subito, e non mai.
5. **La telepatia rivela solo quando hanno scelto in due**, e chi sceglie per primo **non deve vedere niente** finché l'altro non ha scelto. È il sigillo D-12: se trapelasse, è il difetto più grave dei due giochi.
6. **A fine partita** l'anello si riempie e il numero sale.

⚠️ **Correzione del 2026-08-28, lasciata qui apposta**: in questo punto era stato scritto che il test di partita «ripulisce ciò che crea». **Era falso** — vedi **B-23**: mancava la policy di update su `partita`, quindi la pulizia non faceva niente e non lo diceva. Ora la policy c'è (migrazione **0021**, applicata) e la pulizia è asserita. 🔑 *Aver capito un difetto non è averlo evitato*: quella frase fu scritta con la sicurezza di chi aveva appena imparato la lezione.

---

### ✅ Chiuso dal giro di verifica del 2026-08-28

Tutto ciò che era stato scritto il 2026-08-27 e nella prima sessione del 2026-08-28, e mai visto girare è stato usato, e non si è trovato niente di rotto: **D-60** (il pannello «aggiungi un luogo» non è più in ombra), **B-16 / D-61** (il «+» della mappa ha il suo tondo), **D-64 / B-18 / B-19** (l'aggiunta di un posto è una sola, la tendina risponde, il posto nasce identico dalle due strade), **B-17** (il verso del titolo del calendario), **D-58**, **D-59**, e tutto il resto del 2026-08-27 — calendario, pagina evento, «Cambia tag», il cedimento dei bottoni, la cascata della home.

🔑 **Su D-60 vale la pena notare che la diagnosi era giusta *in pieno*, non a metà**: la correzione copriva sia il caso dei bottoni nidificati nel vetro della carta sia il caso della carta stessa, ed era scritto che se il pannello fosse rimasto in ombra la lettura di D-55 sarebbe stata sbagliata alla radice. Non è rimasto.

⚠️ **Con un limite dichiarato, che serve a leggere bene un'eventuale ricomparsa.** È stato un giro d'**uso**, non l'esecuzione dei quattro casi di prova stretti — che erano scritti apposta perché un giro normale **non li attraversa**: **B-16** voleva l'app *chiusa del tutto e riaperta*, non ricaricata; **B-19** voleva la scheda *in Liste*, che è la metà invisibile dalla mappa; **B-17** voleva *due mesi avanti e due indietro*; **D-59** voleva un rientro *senza che iOS avesse riavviato l'app*. Sono stati chiesti e non è arrivata risposta: restano non confermati singolarmente.

🔑 **La conseguenza pratica, che è l'unica che conta**: se uno di questi quattro si ripresenta, **non è una regressione**. È la finestra stretta che il giro non ha attraversato, e la prima mossa è riprovarla col suo caso di prova — non cercare una causa nuova in codice che nel frattempo nessuno ha toccato.

---

### ⚠️ Cose vere che restano da sapere

⚠️ **Il secondo membro della coppia di prova è cambiato il 2026-08-28** (terza sessione): sostituito con un altro utente, e `insieme_dal` portata al **2026-04-12**. Fatto in **SQL a mano con la chiave `service_role`**, perché l'app non ha nessuna via per farlo — vedi il backlog *«Cambiare partner senza distruggere la coppia»*. **Verificato rileggendo** dopo la scrittura, non fidandosi dell'assenza di errore (è la lezione di **B-23**).
🔑 **Conseguenza da ricordare prima di leggere qualunque cosa come un difetto**: i contenuti del membro uscente sono **rimasti** nella coppia, quindi il membro nuovo **vede foto e recensioni** che non ha scritto, e **creatura e punti sono stati ereditati** — sono per `coppia_id`, non per membro. Non è un difetto: è la conseguenza accettata di una sostituzione secca. *Chi troverà questi dati fra un mese, senza questa riga, li leggerebbe come una falla nella RLS.*

⚠️ **I permessi non si provano in Expo Go** (**B-20**): il dialogo usa l'`Info.plist` di Expo Go, non il nostro. Tutto ciò che sta nei `plugins` di `app.json` — testi dei permessi, chiavi dichiarate — resta **non verificato** finché non si fa un build vero, e nessun giro sull'iPhone per quanto accurato può intercettarlo. È la prima cosa da ricontrollare il giorno in cui se ne farà uno.

⚠️ **Da fare al primo build vero**: `eas.json` col profilo APK, le variabili d'ambiente su EAS, il tetto di quota Google, e i dialoghi di sistema tradotti (backlog **11-quater**).

⚠️ **Il bundle web si compila solo da un Metro fresco.** Il 2026-08-28 il processo su :8081 è rimasto impiantato al 99,9% e non ha mai emesso una riga `Web Bundled`; un secondo Metro sulla porta 8082 ha prodotto lo stesso bundle in **7 secondi**. Non è un difetto del codice — ma se un giorno il bundle web «non finisce mai», la prima cosa da provare è **riavviare Metro**, non cercare il modulo colpevole.

✅ **Chiave Google Places inserita nel `.env`** (terza sessione del 2026-08-27) e **verificata nel bundle iOS**, insieme a URL e anon key. Questo accende la ricerca luoghi/ristoranti di D-37.
⚠️ **E rende attuale un debito che era teorico**: la chiave ora vive nel bundle. Il **proxy dietro una Edge Function** e il **tetto di quota + avviso di budget** su Google Cloud vanno fatti **prima di utenti veri**, non prima della pubblicazione.

✅ **D-58** — il calendario si apre sul **Diario**, non sul mese. ⚠️ Conseguenza mai **misurata**: il Diario carica le anteprime delle foto, quindi quelle richieste partono a *ogni* apertura del calendario. Il giro di verifica non ha segnalato lentezza, ma non l'ha nemmeno cronometrata: se un giorno l'apertura risultasse lenta sul telefono, è il primo posto dove guardare.

✅ **D-59** — la mappa **chiede** il permesso di posizione (dialogo iOS diretto, scelta dell'utente) e lo **rilegge a ogni focus**, così concederlo dalle Impostazioni dopo un rifiuto funziona senza riavviare.
🔑 **Perché D-59 esisteva già e non funzionava per nessuno**: leggeva la posizione solo se il permesso era *già* concesso, e l'unico modo di concederlo era «segna dove sono adesso». Non un errore — **una funzione che tace**, sopravvissuta a due sessioni e a una rilettura del codice.

✅ **La Classifica è decisa** — era il blocco dichiarato il 2026-08-28. Il punteggio è **della coppia**, non fra i due: **Intesa** e **Sintonia**. 🔑 E scioglie P-03 da sé, invece di aggirarlo: una classifica *fra* le due persone sarebbe un verdetto sulla relazione; un totale condiviso no.

**Stato**: progetto **inizializzato e funzionante**. Esistono i tre documenti, il repo su GitHub, il submodule nel brain e un'app Expo che gira sull'iPhone.
⚠️ **Aggiornato il 2026-08-28** — la riga diceva ancora *«zero risorse cloud»*, scritta il 2026-08-12 e mai corretta: **non è più vera**. Esistono un progetto **Supabase** (piano gratuito, con 21 migrazioni applicate — va in pausa se resta fermo, vedi **R-02**) e una **chiave Google Places** attiva nel bundle. **Costi sostenuti finora: nessuno documentato**, entrambi i servizi essendo sul piano gratuito — ed è esattamente per questo che il tetto di quota su Google Cloud sta più in alto in questa pagina: 🔑 *un costo a zero perché nessuno lo usa non è un costo sotto controllo.*

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
