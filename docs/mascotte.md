# LifeCouple — La mascotte: identità visiva e prompt di generazione

> **Cos'è questo file.** Lo **spec del disegno** della mascotte di LifeCouple e gli script per generarla con **Nano Banana 2** (Gemini 3 Pro Image). È documentazione di progetto, non codice: al 2026-09-04 **non esiste ancora una sola immagine generata** e **nessuna riga di codice** dell'app la usa.
>
> **Chiesto dall'utente il 2026-09-04**: *«tutte queste immagini e prompt servono per creare una mascotte e animarla per lifecouple»*, partendo da uno sticker kawaii di una **lontra** fornito come riferimento.
>
> Decisioni collegate: [`../History.md`](../History.md) **D-09** (la creatura parte come forme geometriche e il disegno resta sostituibile), **D-11** (la creatura si implementa per ultima ma **si progetta per prima**), backlog **12** e proposta **P-01**.

---

## 0. Cosa è deciso e cosa no

Va scritto in cima perché il resto del file è pieno di dettagli, e i dettagli non devono far sembrare deciso ciò che non lo è.

**Deciso**:
- La mascotte di LifeCouple è **una lontra**, nello stile sticker kawaii del riferimento fornito dall'utente.
- 🔑 **La lontra È la creatura di P-01** — deciso dall'utente il 2026-09-04, **D-95**. Non è una mascotte di marca che vive accanto al prodotto: è il **disegno della creatura**, quello che D-09 aveva lasciato sostituibile alle forme geometriche.
- Va **animata**.
- Ne servono almeno **due età**: cucciolo e adulta.

- 🔑 **Gli stadi sono TRE** — deciso dall'utente il 2026-09-04, **D-96**. Non i ~5-6 di D-09, che era un tetto di costo: tre ci sta sotto. E i tre coincidono col materiale già esistente — cucciolo, il riferimento, adulta (§2).
- 🔑 **Gli umori sono TRE, e l'umore è una *reazione*, non una condizione** — deciso dall'utente il 2026-09-06, **D-102**. `quiete` · `festa` · `sonno`, quindi **9 immagini** (§2bis). L'umore dice *cosa è appena successo*, non *come sta la creatura*: è ciò che rende il vincolo di P-01 soddisfatto per costruzione invece che per attenzione.
- 🔑 **Si anima con la strada (a)** — raster + trasformazioni Reanimated, più **dissolvenza incrociata** fra due immagini per il cambio d'umore. Deciso il 2026-09-06, **D-103** (§9).

**Cosa comporta D-95, e va tenuto presente leggendo tutto il resto del file**:
- Il conto delle immagini è **`3 × umori`**, perché il componente del disegno riceve `stadio` **e** `umore`.
- 🔑 **Vincolo che viene da P-01 e non dal disegno**: *«la creatura cresce e basta: non muore, non deperisce, non rimprovera»* — una creatura che deperisce applica una punizione a una relazione, e se la coppia sta attraversando un periodo difficile l'app aggiunge senso di colpa nel momento peggiore. **Quindi nessuno stadio può rappresentare deperimento, e nessun umore può leggersi come rimprovero per l'assenza.** Un umore «triste» che significhi *«non vi occupate di me»* violerebbe P-01 pur essendo solo un disegno. L'assenza rallenta la crescita, non imbruttisce la creatura.

- ✅ **Il bordo bianco fustellato resta** anche nell'asset dell'app — deciso dall'utente il 2026-09-06. È già nei blocchi `KEEP IDENTICAL` di §4 e §5, quindi non cambia nessun prompt: cambia il **ritaglio** (§2bis, §5bis).

**Non deciso — e sono le domande che restano**:
- ⚠️ **Le condizioni d'uso commerciale** del servizio di generazione, se la mascotte finisce nell'icona o negli screenshot dello store. Non verificato — e da qui in avanti conta, perché si sta per generare davvero.

⚠️ **Questo file non è in anticipo sui tempi: è esattamente D-11.** «Si progetta subito, si implementa per ultima» — progettare il disegno mentre il resto dell'app si costruisce è ciò che quella decisione chiede. Non implica alcun anticipo dell'implementazione, che resta ultima.

---

## 1. Il soggetto — ciò che non deve cambiare mai

**Il file di riferimento è [`../assets/mascotte/riferimento.jpg`](../assets/mascotte/riferimento.jpg)** (2048×2048, fornito dall'utente il 2026-09-04). È la sorgente di verità **dello stile**: allegalo a ogni prompt.

È uno **sticker fustellato in vettoriale piatto**: contorno navy uniforme e spesso su ogni forma, cel-shading pulito senza sfumature, bordo bianco attorno alla sagoma, fondo lavanda piatto. Una lontra dorata seduta che tiene un sasso di fiume fra le zampe anteriori.

🔴 **Il fiore è stato tolto** — deciso dall'utente il 2026-09-06, **D-105**. Il riferimento ce l'ha ancora, quindi ogni prompt deve dire **esplicitamente** di toglierlo (§4, §5, §5bis): la sua presenza nell'immagine allegata lo rimette in gioco a ogni generazione.

⚠️ **Conseguenza che cambia il piano di produzione**: il riferimento **non è più lo stadio 2**, perché ha il fiore. Lo stadio 2 ora si **genera** come gli altri due (§4bis), e diventa lui l'ancora senza fiore da cui nascono l'1 e il 3 — vedi §2 e §5bis.

Questi sono i **tratti d'identità**: cambiarne uno cambia personaggio. 🔑 **Il fiore non è mai stato in questa lista**, ed è il motivo per cui toglierlo è una scelta estetica e non un cambio di personaggio.

- **Le lentiggini**: un piccolo gruppo di puntini bruni su ciascuna guancia, ai lati del muso. Sono piccole e si perdono facilmente in una rigenerazione, quindi vanno **nominate esplicitamente** in ogni prompt (i blocchi KEEP IDENTICAL del §4 e del §5 le contengono).
- **Il ciuffo sulla fronte**, appuntito e diviso in tre punte.
- **La macchia dorata più scura** sopra ciascun occhio.
- **Il sasso di fiume** fra le zampe: non è una posa, è un attributo del personaggio.

### 🔴 L'inquadratura è in **tre quarti**, e non è uno stile: è un vincolo (D-107)

Il riferimento non è frontale. La testa è **girata di poco**, il corpo è **angolato**, la coda **sventaglia da un lato**. Non era scritto da nessuna parte, ed è andato perso alla prima generazione vera — che è uscita **frontale e simmetrica**.

**Perché il frontale non funziona qui**, e la ragione è tripla:

- 🔑 **La simmetria bilaterale perfetta legge come maschera**, non come animale: in natura non esiste, e l'occhio la riconosce come artificiale prima di sapere perché.
- 🔑 **Uno sguardo dritto in asse non è tenero, è fisso.** È la posa di chi ti osserva. E questa creatura vive nella schermata di casa e viene guardata ogni giorno: una creatura che *fissa* è il registro sbagliato per una compagna — è lo stesso confine che P-01 protegge sul piano emotivo, qui sul piano del disegno.
- **Senza il tre quarti non c'è volume**: la figura si appiattisce e diventa un pupazzo di carta.

**La regola operativa**, da ripetere in ogni prompt:
- testa **girata di ~15°**, con un **lieve inclinamento**;
- corpo **angolato**, mai le spalle parallele al bordo dell'immagine;
- **coda visibile da un lato**, che è ciò che dà una direzione alla sagoma;
- **mai perfettamente simmetrico**: un orecchio leggermente più alto, il peso su un fianco.

⚠️ **E si sposa con D-106 invece di contraddirlo**: una sagoma asimmetrica si riconosce **meglio** di una simmetrica, perché ha un verso. La coda che sventaglia è precisamente ciò che distingue il cerchio del cucciolo da una palla qualunque.

⚠️ **Il file è un JPEG.** Per un asset dell'app serve un **PNG senza perdita**, e va rigenerato dalla fonte: ricomprimere questo file non recupera qualità, e sui contorni navy il JPEG lascia sporco. Per generare con Nano Banana va benissimo così.

| Elemento | Hex (approssimato) |
|---|---|
| Pelo dorato-ambra | `#E2A03C` |
| Muso, petto e pancia crema | `#F6ECD9` |
| Contorno / naso, navy scuro | `#2E2A45` |
| Occhi — **stadi 1 e 2**, navy pieno con **un** riflesso | `#2E2A45` |
| Occhi — **stadio 3**, grigio con iride e **due** riflessi (D-110) | `#898798` |
| Sasso di fiume, grigio | `#9AA3A8` |
| Fondo lavanda | `#A98CF0` |
| Bordo sticker | bianco pieno |
| ~~Fiore rosa `#F07BA8` · cuore giallo `#F6D24B` · foglia verde `#6FBF4A`~~ | **tolti il 2026-09-06 (D-105)** |

⚠️ **Il rosa sopravvive, ed è diventato il filo dell'infanzia.** Era il rosa del fiore, scelto per il **ciuccio** *«per riusare un colore già in tavolozza»*; tolto il fiore quella giustificazione è caduta, ma con **D-108** il rosa passa al **cappellino** dello stadio 2. 🔑 *Lo stesso accento attraversa i due stadi da piccola e scompare da adulta*: un colore che racconta un'età invece di decorare.

⟳ **Corretto il 2026-09-06 con D-109**: l'adulta **porta gli occhiali**, quindi non è vero — come diceva la prima stesura di D-108 — che «non porta più niente addosso». Quello che sparisce è il **rosa**, non l'accessorio: gli occhiali sono **navy**, cioè il colore del contorno, già in tavolozza. 🔑 *La tavolozza non cresce di un colore in tutta la vita della creatura, e la fine dell'infanzia si legge lo stesso — perché a finire non è il portare qualcosa, è il portare qualcosa di colorato.*

⚠️ **Gli esadecimali sono una lettura a occhio dell'immagine di riferimento**, non i colori del file sorgente. Se l'originale esiste, vanno sostituiti con quelli veri: il modello li segue abbastanza fedelmente da farti guadagnare coerenza fra una generazione e l'altra, quindi vale la pena che siano esatti.

**Dove va il riferimento**: `assets/mascotte/` — vedi il `LEGGIMI.txt` di quella cartella.

---

## 2. Gli stadi — sono tre, e si generano tutti e tre

**Deciso dall'utente il 2026-09-04 (D-96): la creatura ha *tre* stadi.** Non i ~5-6 di D-09: quel numero era un **tetto dettato dal costo** (il costo grafico cresce linearmente col numero di stati visivi), e tre sta sotto il tetto — la ragione di D-09 non è contraddetta, è servita meglio.

| # | Stadio | Prompt | Testa/corpo | **Sagoma** | Marcatore proprio |
|---|---|---|---|---|---|
| 1 | **Cucciolo** | §4 | **1 : 1,3** | **cerchio** — seduto basso, tutto pancia | il **ciuccio** |
| 2 | **Giovane** | §4bis | **1 : 1,9** | **pera** — seduto eretto, coda in vista | il **cappellino al contrario** (D-108) |
| 3 | **Adulta** | §5 | **1 : 2,6** | **colonna** — eretta, alta il doppio di quanto è larga | gli **occhiali tondi** (D-109) |

**Misure vere delle sagome** (larghezza/altezza del ritagliato, `tools/confronta-stadi.py`, 2026-09-06):

| Stadio | Sagoma | Rapporto | Scarto dal precedente |
|---|---|---|---|
| 1 cucciolo | 574 × 665 | **0,86** | — |
| 2 giovane | 454 × 643 | **0,71** | 18,2% |
| 3 adulta | — | **≤ 0,49** (obiettivo) | ≥ 30% |

⚠️ **L'adulta punta a uno scarto più largo degli altri, ed è voluto**: è la fine della scala, non ha uno stadio dopo da cui distinguersi, quindi può allontanarsi quanto vuole. Tradotto in una riga di prompt: **alta il doppio di quanto è larga**.

### ⟳ Rivisto il 2026-09-06 (D-106): la proporzione da sola non bastava

🔴 **Il difetto l'ha visto l'utente guardando la prima immagine**: fra lo stadio 1 e il 2, *«l'unica differenza è il ciuccio»*. Aveva ragione, e i numeri lo confermavano — 1:1,5 e 1:1,8 sono **il 20% di scarto**, invisibile su una figura alta 180 punti.

🔑 **E il progetto lo sapeva già dal 2026-08-12.** **D-17** chiude con una nota mai raccolta: *«se la crescita è **solo** dimensione, cinque stadi rischiano di sembrare cinque volte la stessa cosa. Chiedere che la crescita porti con sé un po' di complessità costa poco e rende visibile il progresso. **Da valutare col designer, non deciso.»*** Questo file l'aveva ridotta a *«una sola manopola numerica»* — cioè aveva scelto, senza dirlo, proprio l'opzione contro cui D-17 metteva in guardia.

**Due correzioni, e la seconda conta più della prima**:

1. **Le proporzioni si allargano**: 1,3 · 1,9 · 2,6 invece di 1,5 · 1,8 · 2,4. Gli scarti passano dal 20% e 33% al **46% e 37%**.
2. 🔑 **Ma quello che si legge a 180 punti non è la proporzione: è la sagoma.** Da qui la colonna nuova nella tabella — **cerchio → pera → colonna** — che cambia il *profilo esterno* e non un rapporto interno. Un cerchio e una colonna si distinguono in un decimo di secondo, anche a occhio distratto, anche in miniatura.

⚠️ **E ogni stadio deve avere un marcatore suo.** Il vero buco era che lo stadio 2 era definito **in negativo** — «né cucciolo né adulta» — mentre l'1 aveva il ciuccio e il 3 i baffi. *Uno stadio definito solo dall'essere in mezzo è esattamente quello che si legge come «uguale agli altri».*

⚠️ **Le sagome diverse sono lecite, e va detto perché non sembri una violazione**: D-103 chiede che siano sovrapponibili i **tre umori di uno stesso stadio**, per la dissolvenza incrociata. Fra **stadi** diversi non serve — il cambio di stadio è un momento a sé (§9), non un incrocio.

⟳ **Cambiato il 2026-09-06 con D-105.** Fino a quel giorno lo stadio 2 **era** `riferimento.jpg` e non si generava — *«i tre coincidono col materiale che esiste»*. Tolto il fiore, il riferimento non può più essere un'uscita: **ha il fiore**. Resta la sorgente dello **stile** (§1), ma lo stadio 2 va generato come gli altri due.

🔑 **E si genera per primo**, perché diventa l'**ancora senza fiore**: da lì nascono l'1 e il 3. Attaccare a ogni prompt un riferimento *col* fiore e dire tre volte «toglilo» sarebbe combattere tre volte la stessa battaglia contro l'immagine allegata. Una volta sola, poi si allega il risultato. È la stessa logica dei passaggi d'umore (§5bis).

Non serve inventare stadi intermedi: la scala di età è parametrizzata su **una sola manopola numerica**, il rapporto testa/corpo (§6), e i tre valori sono già fissati. Se un giorno si volessero cinque stadi, si otterrebbero muovendo quel numero — ma oggi non servono.

⚠️ **Il prezzo dei tre stadi, e va saputo adesso**: con tre stadi ci sono **due sole transizioni** in tutta la vita della creatura. Per quasi tutto il tempo la coppia vede un'immagine che non cambia. Due conseguenze:
- **Ogni transizione deve essere inequivocabile.** Se lo stadio 2 non si distingue a colpo d'occhio dall'1 e dal 3, la coppia percepisce **due** stati, non tre, e uno dei tre è stato disegnato per niente. È il motivo per cui il salto di proporzioni fra 1,5 · 1,8 · 2,4 non va ammorbidito.
- ✅ **Il senso di crescita quotidiano non può venire dagli stadi**, perché scattano due volte — e la risposta è arrivata il 2026-09-06 con **D-102**: viene dalla **reazione**, non dalla crescita. La creatura risponde a ogni evento-punto il giorno stesso; la crescita si legge nella barra verso lo stadio successivo. Nessuna micro-variazione da disegnare, quindi nessun costo grafico aggiunto.

⚠️ **Vincolo che D-09 impone al disegno, non alla logica**: il componente riceve **solo `stadio` e `umore`** e non sa altro. Quindi ogni stadio va prodotto anche in più **umori**, e il conto delle immagini è `3 × umori` = **9** (D-102).

---

## 2bis. Le nove immagini — nomi, formato, e la riga che cambia

**Gli umori sono tre** (D-102). 🔑 **E la regola che li governa vale più della lista**: *l'umore cambia **solo la riga dell'espressione** — mai la posa, mai le proporzioni, mai il sasso.* Era già scritta in §6 come una manopola fra le altre; con D-102 diventa un vincolo, e paga due volte.

1. **I tratti fragili non sono mai in gioco.** §1 avverte che lentiggini, ciuffo a tre punte e macchie sopra gli occhi si perdono facilmente in una rigenerazione. Se cambia solo l'espressione, non c'è nessuna rigenerazione della sagoma in cui perderli.
2. 🔑 **È ciò che rende sufficiente la strada (a)** — vedi §9. Nove immagini che condividono posa e inquadratura si possono **incrociare in dissolvenza**, e la dissolvenza restituisce esattamente il cambio d'espressione che §9 elencava come il costo di (a).

| Umore | Quando lo si vede | Espressione |
|---|---|---|
| `quiete` | il default, quasi sempre | quella del riferimento — non si genera niente |
| `festa` | un evento-punto è appena arrivato | occhi ad arco all'insù, bocca aperta in un sorriso, guance alzate |
| `sonno` | di notte | occhi chiusi all'ingiù, piccolo sbadiglio, orecchie rilassate |

**I sei prompt sono in §5bis**, col cappello comune e l'ordine di produzione.

🔴 **Lo stadio 1 fa eccezione a tutti e due gli umori, e non è un dettaglio**: il **ciuccio sostituisce il sorriso** (§4), quindi la bocca è nascosta. Ne segue che per il cucciolo lo sbadiglio è **impossibile**, e che la `festa` deve tenere gli **occhi aperti** — chiudendoli, con la bocca già coperta, resterebbe una faccia senza nessun tratto aperto, che non legge come gioia ma come vuoto. Le due varianti dedicate sono in §5bis.

⚠️ **Nessuno dei tre può leggersi come rimprovero**, ed è il vincolo di P-01 (§0). Si noti cosa *non* c'è nella lista: nessun umore triste, nessuno annoiato, nessuno che guarda in camera aspettando. L'assenza non produce un umore — produce `quiete`, che è un neutro.

**Nomi dei file**, in `assets/creatura/`:

```
creatura-1-quiete.png   creatura-1-festa.png   creatura-1-sonno.png
creatura-2-quiete.png   creatura-2-festa.png   creatura-2-sonno.png
creatura-3-quiete.png   creatura-3-festa.png   creatura-3-sonno.png
```

⚠️ **Cartella distinta da `assets/mascotte/`**, che resta quella del *materiale sorgente* (il riferimento, gli scarti, i JPEG). `assets/creatura/` contiene **solo** i nove PNG che l'app importa davvero.

🔴 **Lo sfondo lavanda va tolto: gli asset dell'app vogliono l'alpha.** I prompt di §4 e §5 chiedono un fondo lavanda piatto, giusto per la generazione; su una schermata dell'app un quadrato lavanda sarebbe sbagliato. Si genera col fondo e **si ritaglia dopo**.

🔑 **E qui la regola dello sfondo piatto — scritta in §6 per ragioni di stile (*«appena si accenna un gradiente lo stile sticker si sfalda»*) — ripaga per una ragione tecnica che non c'entra niente con lo stile**: una tinta piatta e uniforme si toglie in modo pulito, un gradiente no. Il vincolo estetico ha reso possibile il ritaglio.

**Formato**: PNG con alpha, **768 × 768**. Sono ~180 pt a schermo, che a @3x fanno 540 px: 768 copre con margine e non obbliga a tre varianti di risoluzione. ⚠️ **Peso reale delle nove, misurato: 2,77 MB** — la stima scritta qui prima di generarle diceva 1,5–2 MB, quindi era **bassa di circa il 40%**. Resta accettabile, ma vale la pena saperlo: su un'illustrazione piatta con alpha, la compressione PNG rende meno di quanto suggerisca l'intuizione, perché i contorni antialiasati sono rumore per un algoritmo senza perdita. Se un giorno servisse recuperarlo, la strada è **WebP** (stesso alpha, circa metà del peso), non abbassare la risoluzione.

⚠️ **Ogni immagine va passata al controllo di §8** prima di entrare in `assets/creatura/`: lentiggini, ciuffo, macchie sopra gli occhi, sasso. Nove immagini sono nove verifiche — è lì che sta il costo vero delle immagini generate, non nella generazione.

---

## 3. Le tre regole che valgono per tutti i prompt

1. **Scrivi in inglese.** Il progetto è in italiano, ma sui vincoli anatomici Nano Banana 2 è sensibilmente più fedele in inglese, e qui tutto il lavoro è rispetto di vincoli.
2. **Allega sempre l'immagine di riferimento.** La coerenza del personaggio la dà l'immagine, non la descrizione. I prompt standalone (§7) sono un ripiego per quando non si può allegare.
3. **Correggi isolando, non rigenerando.** Se sbaglia un dettaglio, un secondo passaggio che tocca solo quello costa meno e non rimette in gioco ciò che era già giusto.

---

## 4. Stadio «cucciolo» — prompt principale (con immagine allegata)

```text
Using the attached sticker as the exact style and character reference, redraw the
SAME otter character as a much younger baby version of itself — a newborn cub,
roughly 1/3 of its current age.

KEEP IDENTICAL (non-negotiable):
- The flat vector sticker style: clean cel-shading, no gradients beyond the soft
  two-tone fur shading, no texture, no realism.
- The thick uniform dark navy outline (#2E2A45) around every shape, and the thick
  white die-cut sticker border around the whole silhouette.
- The colour palette: golden-amber fur (#E2A03C), cream muzzle, chest and belly
  (#F6ECD9), dark navy eyes and nose.
- The flat lavender background (#A98CF0), edge to edge.
- The small grey river pebble held in both front paws against the chest.
- The small scatter of brown freckle dots on each cheek, beside the muzzle.
- The three-pointed cowlick on the forehead and the darker golden patch above
  each eye.
- THE THREE-QUARTER VIEW of the reference. This is not a stylistic preference,
  it is a hard requirement: the head is turned about 15 degrees off-axis with a
  slight tilt, the body is angled so the shoulders are NOT parallel to the
  frame, the weight rests on one hip, and one ear sits slightly higher than the
  other. The character must NEVER be drawn straight-on or bilaterally
  symmetrical: a perfectly frontal, symmetrical animal reads as a mask and its
  gaze reads as staring, not as warmth.

CHANGE INTO NEWBORN PROPORTIONS — THE SILHOUETTE MUST READ AS A CIRCLE:
- Head-to-body ratio pushed to about 1:1.3 — the head is nearly half the total
  height and clearly wider than the body, unmistakably oversized.
- The whole animal reads as ONE round blob: sitting low and settled, belly
  forward and wide, no visible neck, the outer silhouette almost a circle. Seen
  as a black shape from across a room it must read as round — but as a round
  shape with a DIRECTION, not as a symmetrical ball.
- Eyes noticeably larger and rounder, set lower on the face and further apart,
  with a single soft highlight each.
- Muzzle shorter and squashed; cheeks rounder and fluffier.
- Ears small, round, set low and wide on the skull.
- Limbs so short they barely emerge from the body; paws tiny and mitten-like,
  no visible claws, hind paws just peeking out at the bottom.
- Tail short and thick, curling in a soft comma that sweeps clearly out to ONE
  side of the body: it is the small asymmetry that gives the round silhouette a
  direction. Never tucked symmetrically underneath.
- The three-pointed cowlick stays exactly as it is: it is an identity trait,
  not an adult trait.
- No whisker dots: those belong to the adult.

REMOVE — THE FLOWER (important, it is present in the reference):
- The otter wears NO flower. Remove the pink flower, its yellow centre and its
  green leaf entirely from behind the ear.
- Nothing replaces it: no bow, no clip, no leaf, no accessory of any kind. The
  ear is bare and its outline is clean and continuous.
- Pink, yellow and green do not appear anywhere on the character except the
  pacifier ring described below.

ADD — THE PACIFIER:
- A baby pacifier (dummy) in its mouth, drawn in the same flat vector style: a
  soft pink shield (#F07BA8) shaped like a wide rounded butterfly, with a small
  cream teat (#F6ECD9) in the centre, both outlined in the same thick dark navy.
  Centred just under the nose, covering the muzzle.
- The pacifier REPLACES the smile: the mouth is hidden behind the shield, no
  mouth line and no teeth are drawn.
- Because the mouth is covered, all the warmth must come from the eyes: keep
  them wide, round and softly content, with the cheeks slightly raised, so the
  cub reads as calm and happy and never blank.
- No strap, no clip, no chain — the pacifier alone.

NEGATIVE: never a straight-on frontal view, never bilaterally symmetrical, never
a fixed head-on stare; no realism, no fur texture, no gradients, no background
shadow.

Square 1:1 composition, character centred, generous margin, same three-quarter
framing as the reference. Same character — do not restyle, do not change
species, do not add outfits or props beyond the pebble and the pacifier.
```

**Cosa allegare**: `assets/mascotte/riferimento.jpg`. ⟳ *Fino a D-106 questa riga diceva di allegare lo stadio 2, per non rimettere in gioco il fiore. Una generazione vera ha mostrato che il fiore si toglie al primo colpo, mentre l'identità e il tre quarti si perdono facilmente: conviene ancorare ogni stadio al riferimento — un salto solo — e usare l'immagine sorella solo dove serve la **sovrapponibilità**, cioè per gli umori (§5bis).*

### ⟳ Due correzioni del 2026-09-06, fatte leggendo la prima immagine vera

🔴 **Questo prompt si contraddiceva, e nessuno se n'era accorto finché un modello non ha dovuto obbedirgli.** `KEEP IDENTICAL` diceva *«the three-pointed cowlick on the forehead»*; venti righe più sotto, `CHANGE INTO BABY PROPORTIONS` diceva *«a couple of soft baby fur tufts on the crown **instead of** the sharp cowlick»*. Tieni e togli la stessa cosa.

🔑 **Il modello ha risolto la contraddizione meglio di come era scritta**: ha tenuto il ciuffo. Ed è la lettura giusta, perché §1 elenca il ciuffo a tre punte fra i **quattro tratti d'identità** — *«cambiarne uno cambia personaggio»* — mentre i ciuffetti da neonato erano un'idea di carineria in più. La riga è stata corretta: il ciuffo resta, ed è detto **perché**.

⚠️ *La lezione, che non riguarda il disegno*: una contraddizione fra due blocchi dello stesso prompt non si vede rileggendo, si vede quando qualcuno deve **eseguirla**. Vale per i prompt come per le specifiche.

⚠️ **E il ciuccio è stato riscritto per assomigliare a ciò che è uscito**, non viceversa: lo scudo è **rosa** con la tettarella **crema**, non il contrario come diceva la riga originale. La resa è buona e si tiene — ma allora la riga va corretta, o una rigenerazione fra sei mesi darebbe un ciuccio diverso. 🔑 *Ciò che si accetta diventa la specifica; se non lo si riscrive, la specifica descrive una cosa che non esiste più.*

⚠️ **L'anello rosa del ciuccio era il rosa del fiore, e ora è l'unico accento saturo del personaggio.** La nota originale diceva che riusava un colore già in tavolozza *«invece di introdurre un colore nuovo»* — con D-105 quella giustificazione è caduta, e il rosa è tecnicamente un colore nuovo. Si tiene per due ragioni diverse dalla prima: il ciuccio deve leggersi come **un oggetto**, distinto dal muso crema; ed è un marcatore d'età che **sparisce da sé** crescendo, quindi non è un colore che gli stadi successivi debbano gestire. 👉 Chi preferisse un anello crema o navy cambia questa riga e basta.

---

## 4bis. Stadio «giovane» — la sagoma a pera (D-105, rivisto da D-106)

🔑 **Non esisteva prima del 2026-09-06**, perché lo stadio 2 *era* il riferimento. Tolto il fiore non lo è più.

⟳ **E con D-106 non è più «l'età del riferimento».** La prima versione di questo prompt diceva *«stessa età, stessa posa, una sola cosa cambia: il fiore»* — un vincolo che esisteva solo perché lo stadio 2 **era** quel file. 🔑 *Caduto il file come uscita, è caduto anche il vincolo, ma la riga era rimasta: una regola può sopravvivere alla ragione che la reggeva, e nessuno se ne accorge finché non produce un risultato sbagliato.* Qui il risultato sbagliato era uno stadio 2 indistinguibile dallo stadio 1.

**Ora questo è lo stadio di mezzo vero**: 1:1,9, seduto **eretto**, sagoma a **pera**, e il **sorriso che torna** — perché il ciuccio è finito, ed è il suo marcatore.

**Cosa allegare**: `assets/mascotte/riferimento.jpg`.

```text
Using the attached sticker as the exact style and character reference, redraw the
SAME otter as a young one — older than a cub, not yet an adult.

KEEP IDENTICAL (non-negotiable):
- The flat vector sticker style: clean cel-shading, no gradients beyond the soft
  two-tone fur shading, no texture, no realism.
- The thick uniform dark navy outline (#2E2A45) on every shape, and the thick
  white die-cut sticker border around the whole silhouette.
- The palette: golden-amber fur (#E2A03C), cream muzzle, chest and belly
  (#F6ECD9), dark navy eyes and nose.
- The flat lavender background (#A98CF0), edge to edge.
- The small grey river pebble held in both front paws against the chest.
- The small scatter of brown freckle dots on each cheek, beside the muzzle.
- The three-pointed cowlick on the forehead and the darker golden patch above
  each eye.
- Large round eyes with a single soft highlight each, and a small closed-mouth
  smile — gentle and unforced, no visible teeth.
- THE THREE-QUARTER VIEW of the reference. This is not a stylistic preference,
  it is a hard requirement: the head is turned about 15 degrees off-axis with a
  slight tilt, the body is angled so the shoulders are NOT parallel to the
  frame, the weight rests on one hip, and one ear sits slightly higher than the
  other. The character must NEVER be drawn straight-on or bilaterally
  symmetrical: a perfectly frontal, symmetrical animal reads as a mask and its
  gaze reads as staring, not as warmth.

THE DIFFERENCE FROM THE CUB MUST BE OBVIOUS AT A GLANCE. Five binary contrasts,
all of them required — this is a different life stage, not a slightly older
version of the same drawing:
- The cub is WIDER THAN TALL. This one must be clearly TALLER THAN WIDE.
- The cub has NO NECK, its head sits straight on the body. This one has a
  visible neck.
- The cub's front limbs are buried in its body. This one's front legs are
  clearly separate limbs, with daylight between the elbows and the chest.
- The cub sits low and sprawled on its belly. This one sits UP on its haunches,
  spine vertical, chest lifted off the ground.
- The cub has a pacifier and no mouth. This one has no pacifier and a visible
  closed-mouth smile.

YOUNG PROPORTIONS — THE SILHOUETTE MUST READ AS A PEAR:
- Head-to-body ratio about 1:1.9 — the head is still generous but the body is
  now clearly the larger mass.
- Sitting UPRIGHT on its haunches, back straight, chest lifted: narrow at the
  shoulders and wide at the hips, so the outer silhouette reads as a pear. Seen
  as a black shape it must read taller than wide, and clearly not round.
- The front limbs are now visible as limbs, holding the pebble at chest height
  with a small gap between the elbows and the body.
- Hind legs and paws clearly visible at the base, not swallowed by the belly.
- Tail of medium length and thickness, curving OUT to one side and clearly
  breaking the outline, not tucked against the body.
- Ears larger than a cub's and set higher on the skull.
- No pacifier: the mouth is visible and smiling. No whisker dots: those belong
  to the adult.

ADD — THE BACKWARDS CAP (this stage only):
- A small baseball cap worn BACKWARDS, drawn in the same flat vector style: a
  rounded crown in the same soft pink as the cub's pacifier (#F07BA8) with a
  tiny button on top, and the brim pointing backwards over the nape. Everything
  outlined in the same thick dark navy as the rest.
- It sits back on the skull so the FOREHEAD STAYS CLEAR: the three-pointed
  cowlick pokes out in front of the crown and remains fully visible. Never let
  the cap cover, flatten or replace the cowlick.
- The backwards brim breaks the head outline on one side, adding to the
  three-quarter asymmetry.
- The cap is the ONLY accessory: nothing behind the ears, nothing around the
  neck, no clothing anywhere else.

REMOVE — THE FLOWER (it is present in the reference):
- Remove the pink flower, its yellow centre and its green leaf entirely from
  behind the left ear.
- Nothing replaces it there: no bow, no clip, no leaf. The ears are bare, and
  the ear outline is clean and continuous where the flower used to overlap it.
- Yellow and green must not appear anywhere on the character. The only pink is
  the cap.

NEGATIVE: never a straight-on frontal view, never bilaterally symmetrical, never
a fixed head-on stare; not anthropomorphic, no clothing or accessories beyond
the pebble and the backwards cap, no forward-facing cap, no pacifier, no
whiskers, no muscular build, no sultry or half-lidded eyes, no angular features,
no realism, no fur texture, no gradients, no background shadow.

Square 1:1, character centred, generous margin, three-quarter view.
```

⚠️ **Due punti da guardare, in quest'ordine.**
1. **La sagoma**: strizza gli occhi e guarda il profilo. Se è tondo come il cucciolo, il prompt non ha funzionato, ed è il difetto che conta — più di qualunque dettaglio.
2. **L'orecchio sinistro** (destra di chi guarda), dove il fiore copriva il profilo: il modello deve **ricostruirlo**, e lì può lasciare un contorno interrotto o una rientranza a forma di petalo.

---

## 5. Stadio «adulta» — prompt principale (con immagine allegata)

🔑 **Il punto difficile è tutto qui.** Invecchiare un personaggio animale, per un modello, vuol dire quasi sempre renderlo *figo*: corpo slanciato, mascella squadrata, occhi socchiusi. Il risultato è un adulto freddo — l'opposto di ciò che serve a un'app di coppia.

**L'età sta nelle proporzioni e nella postura, non nella durezza del viso.** Perciò il prompt tiene **due blocchi separati**: uno che invecchia e uno che *difende la tenerezza*. Il secondo non è decorativo, è la ragione per cui il prompt funziona.

```text
Using the attached sticker as the exact style and character reference, redraw the
SAME otter character as a grown adult — but keep it just as soft and endearing as
the reference. This is a gentle adult, not a cool one.

KEEP IDENTICAL (non-negotiable):
- The flat vector sticker style: clean cel-shading, no gradients beyond the soft
  two-tone fur shading, no texture, no realism.
- The thick uniform dark navy outline (#2E2A45) on every shape, and the thick
  white die-cut sticker border around the whole silhouette.
- The palette: golden-amber fur (#E2A03C), cream muzzle, chest and belly
  (#F6ECD9), dark navy eyes and nose.
- The flat lavender background (#A98CF0), edge to edge.
- The small grey river pebble held in both front paws against the chest.
- The small scatter of brown freckle dots on each cheek, beside the muzzle.
- The three-pointed cowlick on the forehead and the darker golden patch above
  each eye.
- THE THREE-QUARTER VIEW of the reference. This is not a stylistic preference,
  it is a hard requirement: the head is turned about 15 degrees off-axis with a
  slight tilt, the body is angled so the shoulders are NOT parallel to the
  frame, the weight rests on one hip, and one ear sits slightly higher than the
  other. The character must NEVER be drawn straight-on or bilaterally
  symmetrical: a perfectly frontal, symmetrical animal reads as a mask and its
  gaze reads as staring, not as warmth.

THE DIFFERENCE FROM THE YOUNG ONE MUST BE OBVIOUS AT A GLANCE. Five binary
contrasts, all of them required:
- The young one SITS on its haunches. This one STANDS on its hind legs, at full
  height.
- The young one wears a backwards cap. This one wears ROUND GLASSES and no hat:
  the three-pointed cowlick is bare and fully visible.
- The young one has no whiskers. This one has three tiny whisker dots per side.
- The young one is pear-shaped: narrow shoulders, wide hips. This one has
  shoulders and hips of roughly the SAME width — a straight column.
- The young one's tail curls close by. This one's tail is long and tapering,
  sweeping in one wide curve well away from the body.

ADULT PROPORTIONS — THE SILHOUETTE MUST READ AS A COLUMN:
- THE WHOLE FIGURE MUST BE ABOUT TWICE AS TALL AS IT IS WIDE. This is the single
  most important instruction in this prompt: measured across the widest point,
  the height must be roughly double the width. The young one is only about one
  and a half times as tall as wide, and the difference has to be unmistakable.
- Head-to-body ratio about 1:2.6 — the head is still generous, but the body is
  now clearly much longer.
- Standing upright on its hind legs, back straight, weight settled on one hip.
  Seen as a flat black shape it must read as a column — never round, never
  pear-shaped.
- Longer, fuller otter body with a gentle shoulder line and soft haunches.
- Longer limbs with visible slim forearms; paws a little larger, toes soft and
  rounded, still no sharp claws.
- Tail long and tapering, resting in one wide relaxed curve well away from the
  body.
- Muzzle slightly longer and broader, with three tiny whisker dots per side.
- Ears set higher on the skull and slightly larger.
- The sharp crown cowlick of the reference comes back, a little longer.
- Posture upright and settled: chest slightly forward, calm and composed.

KEEP IT TENDER (this is the whole point — do not skip, and it matters MORE the
taller you make her: every centimetre of height is a chance to make her cool,
and cool is exactly what this must never be):
- Eyes stay LARGE relative to the head: compared to the ATTACHED REFERENCE,
  shrink them by no more than 15%. Keep them perfectly round with a single soft
  highlight. Never almond-shaped, never half-lidded, never narrowed.
- Build the entire silhouette from curves: no angular jaw, no cheekbones, no
  muscle definition, no straight edges anywhere.
- Same small closed-mouth smile, gentle and unforced. No visible teeth.
- Keep the cream chest and belly generous and rounded — do not slim the torso
  into a sleek athletic shape.
- Relaxed brow, no frown, no smug or knowing expression.

ADD — THE ROUND GLASSES (this stage only, and this is what says "grown-up"):
- Small ROUND spectacles: two perfect circles joined by a short bridge, with
  thin temple arms running back towards the ears. Drawn in the same dark navy
  as the outline (#2E2A45) but with a THINNER line than the body outline, so
  they read as an object resting on the face and not as part of the silhouette.
- The lenses are completely CLEAR: no fill, no tint, no shine streaks, nothing
  drawn inside them. The eyes must be fully visible through them, at full size.
- Each circle is slightly LARGER than the eye it surrounds, so the frame never
  crops, shrinks or cuts across the eye. If the glasses make the eyes look
  smaller, they are wrong.
- ROUND frames only: no rectangular, no angular, no half-rim, no cat-eye. The
  whole character is built from curves and the glasses obey the same rule.
- They add NO new colour: navy is already in the palette.

- The small grey river pebble held in BOTH front paws against the chest, exactly
  as in the reference and in the other two stages.

NO SIGNS OF AGEING (this is a rule, not a style preference):
- This is a grown adult, NOT an old one. No grey or white hairs, no whitened
  muzzle, no drooping or heavy eyelids, no sagging, no wrinkles, no tiredness.
- She reads as capable and settled, never worn down.

NO FLOWER AND NO CAP:
- The otter wears no flower and no cap: apart from the glasses the head is bare,
  and the three-pointed cowlick is fully visible.
- Nothing behind the ears: no bow, no clip, no leaf.
- Pink, yellow and green do not appear anywhere on the character.

NEGATIVE: never a straight-on frontal view, never bilaterally symmetrical, never
a fixed head-on stare; not anthropomorphic, no clothing or accessories beyond
the pebble and the round glasses, no angular or rectangular frames, no tinted or
opaque lenses, no cap, no muscular or athletic build, no sultry or half-lidded
eyes, no sharp angular features, no edgy or "cool" restyle, no signs of old age,
no realism, no fur texture, no gradients, no background shadow.

Square 1:1, character centred, generous margin, three-quarter view. Same
character — do not restyle, do not change species.
```

**Cosa allegare**: `assets/mascotte/riferimento.jpg` — ogni stadio a **un salto solo** dall'ancora, vedi la nota in fondo a §4.

⟳ **Ritirata la presa a una zampa** (2026-09-06). D-109 aveva aggiunto *«il sasso tenuto in una sola zampa, l'altra rilassata»* come segno di maturità. Il modello l'ha ignorata e ha tenuto **entrambe** le zampe, e a guardare il risultato ha fatto meglio: il sasso è un **tratto d'identità** (§1), e tenerlo allo stesso modo a ogni età è ciò che dice *«è lo stesso individuo»*. 🔑 *Differenziare gli stadi su un tratto d'identità è differenziare sulla cosa sbagliata: i marcatori d'età esistono apposta per non doverlo fare.* La riga è stata tolta invece che ripetuta.

### 🔴 Gli occhi dell'adulta sono grigi, ed è deliberato — non correggerli (D-110)

**Non è un difetto sfuggito: è una scelta dell'utente del 2026-09-06**, presa dopo che la differenza era stata misurata e il costo dichiarato. Misure al centro dell'occhio: riferimento `#292246`, stadio 1 `#222347`, stadio 2 `#212047`, **stadio 3 `#898798`** — grigio, con iride e due riflessi invece del navy pieno con uno.

⚠️ **Questa sezione esiste per una ragione sola: impedire che qualcuno lo "aggiusti".** Un occhio fuori tavolozza in uno stadio su tre è esattamente ciò che una rilettura futura classificherebbe come errore, e rigenerare lo riporterebbe navy. **Non si fa.**

⚠️ **Il costo, accettato e messo a verbale**: i tre stadi si vedono affiancati mentre la creatura cresce, e §8 chiede che leggano come lo stesso individuo. Se un giorno la serie dovesse sembrare incoerente, la strada è **propagare il grigio agli altri due**, non riportare l'adulta al navy — perché la versione approvata dall'utente è questa.

Il prompt correttivo qui sotto **resta scritto ma non va usato** su questa immagine. Serve solo se un domani si decidesse la strada opposta, e allegando l'immagine da correggere:

```text
Keep everything exactly as it is — same pose, same body, same proportions, same
glasses, same tail, same background. Change ONLY the eyes.

- Make both eyes noticeably LARGER, as large as in the original sticker
  reference: they must fill most of the round lens, not float in the middle of
  it.
- Draw them as SOLID dark navy (#2E2A45), the same colour as the outline: no
  iris ring, no separate pupil, no grey or blue tint, no white of the eye.
- One single soft round highlight per eye, near the upper edge. Nothing else
  inside the eye.
- Keep the glasses exactly where they are: round, thin navy frame, completely
  clear lenses. The frame must surround each eye without cropping it.

Change nothing else at all.
```

### Se esce comunque troppo dura

Non rigenerare da capo: correggi in un secondo passaggio, isolando il difetto.

```text
Keep everything exactly as it is, but soften the face: make the eyes larger and
perfectly round again, round off the jawline into a continuous curve, and relax
the brow. Do not change the pose, the palette or the proportions of the body.
```

---

## 5bis. I passaggi d'umore — i sei prompt, e l'ordine in cui si generano

🔴 **Un umore non si genera da zero: si genera dall'immagine `quiete` già approvata di quello stesso stadio.** È la regola 3 di §3 (*«correggi isolando, non rigenerando»*) applicata a una produzione invece che a un difetto, e qui non è un risparmio — è un **requisito di D-103**: la dissolvenza incrociata funziona solo se le due immagini sono **sovrapponibili**. Rigenerando da capo si otterrebbero due lontre quasi uguali, e «quasi» in dissolvenza si vede come un fantasma che si sposta.

### L'ordine di produzione — 9 immagini, 3 passi

| # | Immagine | Come si ottiene | Riferimento da allegare |
|---|---|---|---|
| 1-3 | i tre `quiete` | prompt di **§4**, **§4bis**, **§5** | **`riferimento.jpg`** per tutti e tre |
| 4-9 | i sei umori | i prompt qui sotto | il **grezzo** `quiete` di quello stadio (`assets/mascotte/grezze/`) |

🔴 **Si allega il grezzo, non il ritagliato.** Il file in `assets/creatura/` ha il fondo **trasparente**, e allegando quello il modello dovrebbe inventarsi uno sfondo — mentre il cappello qui sotto chiede di **tenere il lavanda piatto edge to edge**. Il grezzo ce l'ha ancora. È il tipo di dettaglio che costa una generazione buttata e nessun messaggio d'errore.

🔑 **Due ancore diverse, e la ragione è diversa per ciascuna.** Gli **stadi** si ancorano al **riferimento**, perché quello che serve lì è l'**identità** — tratti, stile, tre quarti — e ogni salto in più è deriva. Gli **umori** si ancorano al **fratello approvato**, perché quello che serve lì è la **sovrapponibilità**, che è una proprietà fra due immagini e non del personaggio. *Requisiti diversi, sorgenti diverse.*

⟳ **Rivisto due volte in un giorno, e vale la pena dire perché.** D-105 aveva stabilito di generare prima lo stadio 2 e usarlo come ancora, *«per non combattere tre volte la battaglia del fiore»*. Una generazione vera ha mostrato che quella battaglia si vince **al primo colpo**, mentre a perdersi facilmente sono l'identità e il tre quarti (D-107). ⚠️ **Il ragionamento di D-105 era plausibile e sbagliato**, e a smentirlo non è stato un altro ragionamento: è stata un'immagine.

⚠️ **I tre `quiete` vanno passati al controllo di §8 *prima* di generarci sopra gli umori.** Un difetto d'identità nel `quiete` si moltiplica per tre invece di essere corretto una volta.

### Il cappello comune ai sei prompt

Si incolla identico in tutti e sei; cambia solo il blocco finale.

```text
Using the attached image as the exact character and style reference, redraw the
SAME otter in the SAME pose. Change ONLY the facial expression.

KEEP IDENTICAL (non-negotiable):
- Exactly the same pose, silhouette and framing: same body position, same head
  angle and tilt, same size and placement in the frame.
- The small grey river pebble held in both front paws against the chest.
- The bare ears: the otter wears no flower and nothing behind its ears.
- Whatever age marker the attached image carries — the cub's pacifier, the young
  one's backwards cap, the adult's round glasses — stays exactly as it is, same
  shape, same colour, same position. Do not remove it and do not tidy it away.
- The three-quarter view: same head turn, same body angle, same asymmetry. Never
  straighten the character towards the viewer.
- The small scatter of brown freckle dots on each cheek, beside the muzzle.
- The three-pointed cowlick on the forehead and the darker golden patch above
  each eye.
- The flat vector sticker style, the thick uniform dark navy outline (#2E2A45),
  the thick white die-cut sticker border around the whole silhouette, and the
  flat lavender background (#A98CF0) edge to edge.
- The full palette, unchanged.
- The eyes exactly as in the attached image: same size, same colour, same
  structure inside them, same number of highlights. Do not "clean them up" and
  do not restyle them.

NEGATIVE: do not change the pose, the body, the proportions, the palette or the
framing; no new props, no clothing, no flower or accessory behind the ears; no
sad, pleading, scolding or reproachful expression; no realism, no fur texture,
no gradients, no background shadow.
```

⚠️ **Il divieto del fiore va ripetuto anche qui**, benché l'immagine allegata non ce l'abbia più: un modello che ha visto migliaia di lontre-sticker con un fiore dietro l'orecchio può rimetterlo da solo, e in un passaggio che cambia *solo l'espressione* sarebbe l'ultima cosa che ci si aspetta di dover controllare.

⟳ **Tolta la riga «the outline must be superimposable»** (D-112): non è un requisito e il modello non la rispettava comunque. Le altre righe sull'inquadratura **restano** — non perché siano vincolanti, ma perché *meno l'immagine salta, meno schiacciata serve a mascherare il cambio*.

💡 **Un miglioramento possibile, non necessario e non provato.** I sei umori nascono tutti dallo stesso «passaggio d'espressione» e cadono nella **stessa** composizione (477×633 per lo stadio 1): quindi `festa ↔ sonno` sarà già quasi perfetto, e a saltare sono solo le transizioni che coinvolgono il `quiete` — che però è lo stato di riposo, cioè quello da cui si parte quasi sempre. **Se un giorno si volesse chiudere anche quel salto**, la strada non è chiedere al modello di tenere l'inquadratura (non funziona), è **rigenerare il `quiete` come cambio d'espressione a partire da un umore** — un'operazione che innesca il ridisegno e dovrebbe farlo cadere nella stessa composizione degli altri. Costa una generazione per stadio ed è **non provata**: D-112 funziona senza.

### Stadi 2 e 3 — `festa`

```text
CHANGE ONLY THIS — JOY:
- Eyes closed in two happy upward arcs, drawn in the same navy line weight.
- Mouth open in a small joyful smile, soft and rounded, no visible teeth.
- Cheeks clearly raised, with a soft warm blush.
- Ears perked slightly forward — a few degrees only; the outline must stay
  essentially unchanged.
```

### Stadi 2 e 3 — `sonno`

```text
CHANGE ONLY THIS — SLEEPINESS:
- Eyes gently closed in two soft downward curves — relaxed, not squeezed shut.
- A small sleepy yawn: the mouth a small soft oval, no teeth, no tongue.
- Brow relaxed; ears settling slightly lower — a few degrees only.
- The expression is peaceful and content: a creature dozing off happily, never
  tired-of-something and never sad.
```

⚠️ **`festa` e `sonno` hanno entrambi gli occhi chiusi, ed è il punto in cui possono collassare l'uno nell'altro.** Li distinguono tre cose che vanno tenute tutte: gli **archi all'insù** contro le **curve all'ingiù**, la bocca **aperta e sorridente** contro lo **sbadiglio piccolo**, e soprattutto le **orecchie** — in avanti contro rilassate. A 180 punti sullo schermo le orecchie sono ciò che si legge per primo.

### Stadio 1 — `festa` (il ciuccio cambia le regole)

🔴 **Qui la riga generica di §2bis non si può usare, e la ragione sta in §4**: il ciuccio **sostituisce il sorriso**, la bocca è nascosta dietro lo scudo. Chiudere anche gli occhi lascerebbe una faccia **senza nessun tratto aperto**, che non legge come gioia — legge come vuoto, o come sonno.

```text
CHANGE ONLY THIS — JOY:
- The pacifier STAYS exactly as it is: the mouth remains hidden behind the cream
  shield with the pink ring. No mouth line, no teeth, do not remove it.
- Because the mouth is covered, the joy must be carried entirely by the eyes:
  keep them WIDE OPEN, perfectly round and bright, with a larger soft highlight
  in each. Do not close them.
- Cheeks clearly raised, with a soft warm blush pushing up under the eyes.
- Ears perked slightly forward — a few degrees only.
```

### Stadio 1 — `sonno`

🔴 **E qui lo sbadiglio è impossibile**, per lo stesso motivo: la bocca è coperta.

```text
CHANGE ONLY THIS — SLEEPINESS:
- The pacifier STAYS exactly as it is, and there is NO yawn: the mouth is
  covered, so do not open it and do not remove the pacifier.
- Eyes gently closed in two soft downward curves, relaxed and content.
- Brow relaxed; ears settling slightly lower — a few degrees only.
- A cub dozing off peacefully, never distressed and never sad.
```

### 🔴 Il rischio che la prima immagine d'umore ha portato a galla (2026-09-06)

**`creatura-1-festa` è un buon disegno e non è sovrapponibile**, e la seconda cosa conta più della prima. Misurato con `tools/confronta-stadi.py`:

| | |
|---|---|
| sovrapposizione col suo `quiete` | **79,1%** |
| dopo aver allineato i riquadri | **84,0%** |
| soglia sotto cui la dissolvenza mostra un fantasma | 95% |

**La diagnosi**: il modello ha ridisegnato il personaggio a una **scala diversa** (riquadro 477×633 contro 574×665) e con la **parte bassa più piccola** — le fasce basse dell'immagine scendono al 71% e al 60% di sovrapposizione, mentre testa e torso stanno intorno al 90%. Il 53% della differenza sta nel **terzo sinistro**, dove c'è la coda.

🔴 **E questo non è un difetto di questa immagine: è una domanda su D-103.** La regola *«l'umore cambia solo la riga dell'espressione»* dava per scontato che un modello sappia tenere fermo tutto il resto. **Il cappello glielo chiedeva già esplicitamente** — *«same size and placement in the frame, the outline must be superimposable»* — e non è bastato. ⚠️ *Una premessa che nessuno aveva verificato ha retto tre stadi e si è rotta al primo umore.*

### ✅ Chiuso il 2026-09-06: la sovrapponibilità è irraggiungibile, e non serve più (D-112)

**Due prove, e dicono cose complementari.**

1. **Secondo tentativo con un vincolo d'inquadratura molto più duro** (*«same size, same scale, same position, same margins; the outline must be superimposable; the tail must not move at all»*). Risultato: **la stessa identica sagoma del primo** — riquadro 477×633 in entrambi, origine (141,67) in entrambi, **IoU fra le due versioni 0,9996**. Le facce differivano, il contorno no. Il vincolo non ha spostato nulla.
2. **Passaggio "ridisegna senza cambiare niente"**: il modello ha **restituito l'immagine di partenza**.

⟳ **E la conclusione che ne avevo tratto era sbagliata.** A nove immagini finite, i numeri veri:

| | quiete → festa | quiete → sonno | festa → sonno |
|---|---|---|---|
| **1 cucciolo** | **79,1%** | **79,1%** | 99,9% |
| **2 giovane** | 99,8% | 99,8% | 99,6% |
| **3 adulta** | 99,8% | 99,4% | 99,3% |

🔑 **Il modello la composizione la tiene — in due stadi su tre. La causa è la taglia, non lo strumento.** Il `quiete` del cucciolo è largo **574** px, gli altri due **454** e **464**, e i passaggi d'espressione del cucciolo convergono tutti a **477**: la misura degli altri. *Il modello rinormalizza verso una sua taglia preferita, e solo il cucciolo era fuori.*

### ✅ E poi l'anomalia è stata eliminata, non solo spiegata

L'utente ha fornito un `quiete` del cucciolo **nuovo**, nato nel regime del passaggio d'espressione. Cade esattamente dove cadono i suoi umori — **477×633, origine (141,67)** — e i numeri finali sono questi:

| | quiete → festa | quiete → sonno | festa → sonno |
|---|---|---|---|
| **1 cucciolo** | **99,9%** | **100,0%** | 99,9% |
| **2 giovane** | 99,8% | 99,8% | 99,6% |
| **3 adulta** | 99,8% | 99,4% | 99,3% |

🔑 **Conferma definitiva dell'ipotesi della taglia**: non era un limite dello strumento, non era il prompt, non era il regime. Era **un'immagine larga 574 dove le altre stanno a 477**.

⚠️ **Il prezzo**: la larghezza efficace del cucciolo scende da 0,615 a **0,570**, quindi lo scarto di sagoma col giovane passa dal 23,8% al **17,8%**. Resta sopra la soglia e restano il ciuccio e il contrasto cerchio/pera — ma il margine è più stretto, e se un domani i due stadi sembrassero vicini è **qui** che è successo.

✅ **Per D-112: la dissolvenza torna praticabile ovunque.** La schiacciata resta giusta per la **festa** — una reazione deve sembrare qualcosa che accade — ma per i cambi calmi si può usare la dissolvenza su tutti e tre gli stadi, senza casi particolari.

### Dopo la generazione — due passi che non sono facoltativi

1. **Controllo d'identità di §8** su ognuna delle nove: lentiggini, ciuffo a tre punte, macchie sopra gli occhi, sasso — i quattro tratti di §1 — più **l'orecchio nudo** (D-105), **il tre quarti** (D-107), il **marcatore d'età** del suo stadio (ciuccio · cappellino · occhiali) e gli **occhi come nel suo stadio**, che per l'adulta sono grigi (D-110). **Lo fa una persona**, e nessuno strumento lo sostituisce.
2. **Ritaglio e export** con [`tools/ritaglia-creatura.py`](../tools/ritaglia-creatura.py):

```
python tools/ritaglia-creatura.py --dentro assets/mascotte/grezze
```

Toglie il fondo, conserva il bordo, ridimensiona a 768 × 768 e scrive in `assets/creatura/`. Per ogni file stampa **quanta superficie ha tolto**: fuori dalla forbice 25-80% avvisa, perché è lì che si vede se il riempimento non ha riconosciuto il fondo o se è entrato nel personaggio.

🔴 **E non si fa con una sostituzione di colore, che è la strada ovvia: è impossibile, non solo imprecisa.** Misurato il 2026-09-06: il **sasso di fiume** dista **77** dal lavanda in RGB — il colore più vicino al fondo di tutta la tavolozza — mentre un pixel di frangia antialiasata al 70% fra lavanda e bordo bianco dista **101**. Per togliere la frangia servirebbe una tolleranza che **buca il sasso prima**. Per la sola metà più chiara della frangia la finestra utile esiste ma è larga **5 unità su 442**.

🔑 **Lo script usa invece un riempimento dai quattro angoli, e questo cambia la domanda**: *uno sfondo non è definito dal colore, è definito dalla connessione*. Il lavanda tocca il bordo dell'immagine, il sasso è chiuso dentro il contorno navy e non è raggiungibile — quindi la tolleranza può essere alta senza rischi. ⚠️ Ed è la seconda volta che la regola del **fondo piatto** ripaga per una ragione che non c'entra con lo stile: un fondo sfumato fermerebbe il riempimento a metà strada.

---

## 6. Le manopole da girare

| Vuoi… | Cambia questa riga |
|---|---|
| Uno stadio **fra** cucciolo e giovane | `1:1.3` → `1:1.6`, e una sagoma fra il cerchio e la pera |
| Uno stadio **fra** giovane e adulta | `1:2.6` → `1:2.2`, tenendo **tutto** il blocco KEEP IT TENDER |
| Più neonato ancora | `1:1.3` → `1:1.15`, e aggiungi *"eyes half-closed, sitting slightly slumped"* |
| Adulta anziana, ma sempre dolce | aggiungi *"a few pale cream hairs around the muzzle, softer heavier eyelids, same round eyes"* |
| Un altro **umore** (D-09, D-102) | ⚠️ Non improvvisare qui: gli umori sono **tre e decisi**, e i sei prompt pronti stanno in **§5bis**. La manopola resta valida se un giorno se ne aggiunge un quarto — sostituisci **solo** la riga dell'espressione, mai le proporzioni né la posa |
| Un'altra posa | sostituisci il blocco del sasso: *"lying belly-up floating, paws over its chest"* / *"curled asleep in a ring, tail over the nose"* |
| Sfondo diverso | cambia l'esadecimale del lavanda — tienilo **piatto**: appena si accenna un gradiente lo stile sticker si sfalda |
| Formato | `Square 1:1` → `Portrait 3:4` o `Wide 16:9`; chiedi esplicitamente **2K** o **4K** se serve per la stampa o per ritagliare |

⟳ **La nota storica su cosa il modello sbaglia più spesso, e il suo dividendo inatteso.** Fino al 2026-09-06 questa riga diceva: *«il dettaglio che il modello sbaglia più spesso è il fiore: cambia lato o sparisce»*. 🔑 **Con D-105 il difetto più frequente è stato eliminato togliendo il dettaglio che lo causava** — non era l'obiettivo della decisione, che era estetica, ma è un guadagno reale sulla riuscita delle generazioni.

⚠️ **Il difetto ora si rovescia**: il fiore non sbaglia più lato, ma può **ricomparire da solo**, perché nell'immagine di partenza c'era e perché il modello ha visto migliaia di lontre-sticker che ne portano uno. Il correttivo isolato, quando succede:

```text
Keep everything exactly as it is, but remove the flower from behind the ear and
rebuild the ear outline cleanly. Change nothing else.
```

---

## 7. Prompt standalone (senza immagine di riferimento)

Ripiego per quando non si può allegare. La coerenza sarà più fragile.

### Cucciolo

```text
A kawaii die-cut sticker illustration of a baby otter cub, flat vector style with
clean cel-shading and a thick dark navy outline (#2E2A45) on every shape,
surrounded by a thick white sticker border, on a flat lavender background
(#A98CF0).

The cub is golden-amber (#E2A03C) with a cream muzzle, chest and belly (#F6ECD9).
Baby proportions: oversized round head about 1:1.3 to the body, large round dark
navy eyes set low and wide with one soft highlight each, short squashed muzzle,
small dark rounded nose, small low round ears, chubby teardrop body, short stubby
limbs with tiny mitten paws, and a short thick tail curling in a soft comma. Two
little baby fur tufts on the crown.

It has a baby pacifier in its mouth: a small rounded cream shield (#F6ECD9) with
a pink ring (#F07BA8), outlined in the same dark navy, hiding the mouth. No strap
and no clip. The eyes are wide, round and softly content, cheeks slightly raised,
so it reads calm and happy.

Its ears are bare: it wears no flower and no accessory of any kind, and no pink,
yellow or green appears anywhere except the pacifier ring. It sits upright
holding a smooth grey river pebble in both front paws against its chest.

Square 1:1, character centred with generous margin, no text, no gradients,
no realistic fur texture, no shadow on the background.
```

### Adulta

```text
A kawaii die-cut sticker illustration of a gentle adult otter, flat vector style
with clean cel-shading and a thick dark navy outline (#2E2A45) on every shape,
surrounded by a thick white sticker border, on a flat lavender background
(#A98CF0).

Golden-amber fur (#E2A03C) with a cream muzzle, chest and belly (#F6ECD9). Adult
proportions: head-to-body about 1:2.6, a long full body with a gentle shoulder
line, longer slim limbs with soft rounded paws, and a long thick tapering tail in
one wide relaxed curve. Slightly longer muzzle with three tiny whisker dots per
side, ears set high on the skull, a soft cowlick on the crown.

Despite being adult it stays soft and endearing: large perfectly round dark navy
eyes with a single highlight, never narrowed or half-lidded; a silhouette built
entirely from curves with no angular jaw and no muscle definition; a small gentle
closed-mouth smile; a rounded cream belly, not a slim athletic torso.

Its ears are bare: it wears no flower and no accessory of any kind, and no pink,
yellow or green appears anywhere on it. It sits upright holding a smooth grey
river pebble in both front paws against its chest.

Square 1:1, character centred with generous margin, no text, no gradients, no
realistic fur texture, no shadow on the background, not anthropomorphic, no
clothing.
```

---

## 8. Verificare che sia lo stesso personaggio

Il modo più rapido per accorgersi che uno stadio è andato alla deriva è **metterli in fila**. È un controllo, non un deliverable — ma è il controllo che evita di scoprire a stadio 5 che stadio 2 era un'altra lontra.

```text
Using the attached sticker as character and style reference, draw the SAME otter
at three ages side by side on one flat lavender background, in identical flat
vector sticker style: on the left a baby cub with a pacifier (head-to-body
1:1.3, silhouette reading as a circle), in the middle a young one (1:1.9, pear),
on the right a grown adult (1:2.6, column). The three silhouettes must be
tellable apart at a glance, even as flat black shapes.

All three must read unmistakably as the same individual: identical palette,
identical outline weight, bare ears with no flower or accessory on any of them,
each holding its own grey pebble. All three keep large round eyes — the adult
must look grown, never cool or hardened.

Wide 16:9, evenly spaced, all three standing on the same invisible baseline,
no text, no labels, no panel borders.
```

E il foglio-personaggio, quando serve una serie coerente di pose per un solo stadio:

```text
Using the attached sticker as character and style reference, produce a character
sheet of the SAME otter in identical flat vector sticker style on one flat
lavender background: four full-body poses in a 2x2 grid — (1) sitting upright
holding a grey pebble, (2) floating on its back with paws on its chest, (3)
curled asleep in a ring with the tail over its nose, (4) mid-waddle walking
forward. Identical proportions, palette and outline weight in all four, and bare
ears with no flower or accessory in any of them. No text, no labels, no panel
borders.
```

---

## 9. ✅ Dal PNG all'animazione — il nodo tecnico, risolto il 2026-09-06

Era **il** nodo del progetto grafico, perché decideva il costo di tutto il resto. La scelta è la **strada (a)**, D-103; le tre strade restano scritte qui sotto perché il costo che si è evitato fa parte della decisione.

**Nano Banana produce raster (PNG).** Lo stack di movimento di LifeCouple non è fatto per il raster: D-09 prevede `react-native-svg` + Reanimated per la versione geometrica, e come percorso di sostituzione *«un illustratore consegna file **Lottie**, uno per stadio»*. Lottie è vettoriale, e un PNG non ci si converte: la vettorizzazione automatica di un'illustrazione cel-shaded dà percorsi sporchi che poi nessuno anima davvero.

Le tre strade, col loro costo, **nessuna ancora scelta**:

| Strada | Cosa vuol dire | Costo | Cosa si perde |
|---|---|---|---|
| **a) Raster + trasformazioni** | un PNG per stadio/umore, animato con Reanimated su scala, rotazione, rimbalzo, e piccoli scostamenti | il più basso: nessuno strumento nuovo | il personaggio non si **deforma** — respira e rimbalza, non cambia espressione dentro l'animazione |
| **b) Raster ridisegnato a mano in SVG** | l'immagine generata diventa il *modello* che qualcuno ricalca in vettoriale | alto, e ricorrente per ogni stadio | niente, ma è il costo che D-09 voleva evitare |
| **c) Sprite / sequenza** | più fotogrammi generati per lo stesso stadio, riprodotti in sequenza | medio, ma **la coerenza fra fotogrammi generati è proprio ciò che un modello non garantisce** | rischio di sfarfallio fra un fotogramma e l'altro |

🔑 **Quale che sia la scelta, D-09 non cambia e va rispettata**: il componente del disegno riceve **solo `stadio` e `umore`**. Se si sceglie il raster, il file PNG è un dettaglio *dentro* quel componente — la logica di crescita non deve sapere che esiste un PNG, esattamente come oggi non sa che esistono dei cerchi.

### ✅ Scelta il 2026-09-06: la strada (a) — D-103

**Ed è la (a) resa sufficiente, non la (a) accettata come ripiego.** La colonna «cosa si perde» diceva: *il personaggio non si deforma, non cambia espressione dentro l'animazione*. 🔑 **Ma con D-102 l'umore cambia solo la riga dell'espressione** (§2bis), quindi le tre immagini di uno stadio condividono posa, sagoma e inquadratura — e due immagini così si possono **incrociare in dissolvenza**. Il cambio d'espressione torna, senza deformazione e senza strumenti nuovi.

Le due decisioni si tengono a vicenda: è il vincolo sul disegno che rende bastante la strada più economica. Prese separatamente, D-102 sarebbe stata una scelta di costo e D-103 un compromesso; prese insieme, si pagano a vicenda.

⚠️ **E non chiude nessuna porta**: si passa a Lottie in seguito senza toccare la logica, che è precisamente il motivo per cui D-09 ha separato stato e disegno il 2026-08-12.

### Gli strati del movimento

Quattro, più il tocco. Ognuno risponde a una cosa diversa, e vanno tenuti separati perché hanno frequenze diversissime — dal continuo al due-volte-nella-vita.

| Strato | Cosa fa | Con cosa | Quanto spesso |
|---|---|---|---|
| **respiro** | scala 1 → 1,018 avanti e indietro, ancorata **in basso** | `withRepeat` + `withTiming`, ~2600 ms, `Easing.inOut` | continuo |
| **umore** | **schiacciata, scambio dell'immagine al culmine, rilascio** | `withSequence` su `scaleY`, scambio a metà, `molla.tocco` | qualche volta al giorno |
| **festa** | **scodinzolio** + rimbalzo + passaggio a `festa`, pausa, ritorno a `quiete` | rotazione oscillante ancorata **in alto**, `withSequence` su `molla.entrata` → `molla.scivolo`, e `tatto('fatto')` | a ogni evento-punto |
| **stadio** | il momento della transizione | sequenza dedicata, **non** una dissolvenza | due volte in tutta la vita |
| *tocco* | schiacciata e ritorno | `molla.tocco` + `tatto('tocco')` | a piacere |

⚠️ **Il respiro va ancorato in basso** (`transformOrigin: 'bottom center'`). Scalare dal centro fa *fluttuare* la creatura invece di farla respirare: è la stessa quantità di movimento e legge tutt'altro.

### ⟳ Il cambio d'umore non è una dissolvenza: è uno stacco mascherato (D-112)

🔴 **D-103 era costruita su una premessa che si è rivelata falsa.** Il suo argomento era: *«il difetto della strada raster — non cambia espressione dentro l'animazione — lo paga D-102, perché le tre immagini di uno stadio sono sovrapponibili e quindi si incrociano in dissolvenza»*. **Le immagini non sono sovrapponibili** (79%, §5bis), e non c'è prompt che le renda tali.

**Cosa la sostituisce**: il cambio d'immagine avviene **dentro un movimento**. La creatura si **schiaccia** verticalmente in ~90 ms, **al culmine della schiacciata l'immagine viene scambiata**, e poi si rilascia con `molla.tocco`. Nell'istante dello scambio la figura è compressa e in movimento: è il fotogramma in cui l'occhio vede meno forma e più moto, e lo stacco non si legge.

🔑 **Ed è più adatto della dissolvenza, non un ripiego che ci si tiene.** D-102 dice che l'umore è una **reazione**: *una reazione deve sembrare qualcosa che accade, non qualcosa che sfuma.* La dissolvenza era la scelta giusta per un cambio di stato; per un sussulto è sempre stata la scelta sbagliata, e ce ne siamo accorti solo perché l'altra strada si è chiusa.

⚠️ **I tre casi, e non hanno tutti lo stesso bisogno**:
- **`quiete → festa`**: lo stacco è già coperto dal rimbalzo e dallo scodinzolio (D-111). Non serve altro.
- **`festa → quiete`**, un paio di secondi dopo: è il caso scoperto, ed è per questo che serve la schiacciata — un ritorno calmo lascerebbe vedere il salto.
- **`quiete ↔ sonno`**: scatta su un orario, non su un gesto. Nessuno sta guardando l'istante del cambio, e se lo guarda è un battito di ciglia.

⚠️ **`durata.media` non serve più qui** — era la durata della dissolvenza. Resta valida nel resto dell'app.

### 🔑 Lo scodinzolio si ottiene ancorando **in alto** (D-111)

**Chiesto dall'utente il 2026-09-06**: *«vorrei che da felice scondinzolasse»*. 🔴 Nell'**immagine** non si può — una coda in posizione diversa rende la `festa` non sovrapponibile al `quiete`, e la dissolvenza incrociata di D-103 mostrerebbe un fantasma proprio sulla parte che si è mossa di più. Ma nell'**animazione** sì, e a costo zero.

**Il trucco è dove si mette il perno.** Una rotazione oscillante di pochi gradi applicata a tutto lo sprite:

- ancorata **in basso** (ai piedi) → oscilla la testa: sembra che si dondoli;
- ancorata **in alto** (`transformOrigin: 'top center'`) → **la testa resta ferma e la parte lontana dal perno descrive l'arco più ampio**. E la parte più lontana, in tutti e tre gli stadi, è la coda.

🔑 *Non è una coda animata: è una rotazione scelta in modo che a muoversi di più sia la coda.* Con ±4-6°, tre o quattro oscillazioni rapide sovrapposte al rimbalzo, legge come scodinzolio.

⚠️ **Non è uno scodinzolio vero, e va detto per quello che è**: la coda si muove insieme al corpo, non rispetto a esso. La versione fedele richiede che la coda diventi un **livello suo** — un PNG separato per stadio, ruotato attorno alla sua base — e costa: tre asset in più, una separazione a mano per stadio con il rischio di una giuntura visibile, e i nove PNG del corpo da rigenerare senza coda. 👉 **Non chiude nessuna porta**: il componente riceve sempre solo `stadio` e `umore` (D-09), quindi il livello separato si può aggiungere dopo senza toccare la logica.

⚠️ **E vale solo per la festa.** Nel respiro non c'è: una creatura che scodinzola sempre non sta festeggiando, sta solo scodinzolando — e un segno che sta su tutto smette di informare, che è la stessa lezione del cuoricino sul calendario.

🔴 **Il respiro è la prima animazione perpetua dell'app, e va messa in pausa quando nessuno guarda.** Le schede restano montate passando da una tab all'altra — è scritto nel commento di `app/(tabs)/home.tsx`, ed è voluto — quindi senza una guardia la creatura continuerebbe a respirare sul thread UI mentre si è sulla mappa. Si spegne con `useFocusEffect`, che è già l'idioma di cinque schermate del progetto, e con `AppState` per il passaggio in secondo piano.

⚠️ **`durata.media` è già il numero giusto per la dissolvenza**, e non va inventato: la sua documentazione in `lib/movimento.ts` dice testualmente *«Un incrocio in dissolvenza fra due contenuti»*. Il **respiro** invece non ha token, perché `movimento.ts` non ha una categoria per i cicli — tutte le sue voci sono eventi discreti. Va aggiunto lì, non scritto nel componente: è esattamente il motivo per cui quel file esiste (*«due movimenti leggermente diversi si notano ancora di più»*).

🔴 **`require()` deve essere statico**: Metro non risolve `require(\`…/creatura-${stadio}-${umore}.png\`)`. Serve una mappa esplicita di nove voci — e va tenuta **dentro** il componente del disegno, perché D-09 vuole che la logica di crescita non sappia che esistono dei file.

⚠️ **La festa non si rigioca all'apertura.** Deve scattare quando arriva un evento-punto **che questo dispositivo non ha ancora mostrato** — l'ultimo `punti_evento.creato_il` visto si tiene in locale (`lib/preferenze.ts`, che già usa AsyncStorage). Rigiocarla a ogni avvio la trasformerebbe in carta da parati, che è la stessa lezione già imparata col cuoricino sul calendario: *un segno che sta su tutto smette di informare*.

🔑 **E ne discende una proprietà che vale più dell'animazione**: se è il partner a segnare un luogo come visitato, **la festa la si vede aprendo l'app**. È l'unico punto del prodotto in cui l'azione dell'altro arriva come un fatto emotivo invece che come una riga in un elenco — cioè è dove P-01 mantiene davvero la promessa *«l'unica funzione che richiede entrambi»*.

⚠️ **Il cambio di stadio non può essere una dissolvenza.** §2 chiede che ogni transizione sia **inequivocabile**, e succede due volte in tutta la vita della creatura: un incrocio di 220 ms su una tab che magari non si sta guardando lo farebbe perdere per sempre. Va trattato come un **momento**, con la stessa logica del «già visto» della festa, e mostrato a ciascuno dei due sul proprio dispositivo alla prima apertura utile.

⚠️ **Il movimento ridotto non è gestito in nessun punto del progetto** — nessun `ReduceMotion`, nessun `AccessibilityInfo`. Finora non è stato un problema perché ogni animazione durava meno di un secondo; un respiro perpetuo è precisamente ciò per cui quell'impostazione di sistema esiste. È qui che il progetto deve cominciare a rispettarla.

---

## 10. Aperto

- ✅ ~~Mascotte di marca o creatura di P-01?~~ — **risolto il 2026-09-04: è la creatura** (D-95, §0).
- ✅ ~~Quanti stadi?~~ — **risolto il 2026-09-04: tre** (D-96, §2), e coincidono col materiale già esistente.
- ✅ ~~Quanti umori?~~ — **risolto il 2026-09-06: tre**, e l'umore è una *reazione* (D-102, §2bis). Nove immagini.
- ✅ ~~Da dove viene il senso di crescita fra una transizione e l'altra?~~ — **risolto dalla stessa D-102**: dalla reazione, non dalla crescita (§2).
- ✅ ~~Come si anima?~~ — **strada (a)**, resa sufficiente dalla dissolvenza incrociata (D-103, §9).
- ✅ ~~Il bordo bianco fustellato resta nell'asset dell'app?~~ — **risolto il 2026-09-06: resta.** Non cambia i prompt (era già in `KEEP IDENTICAL`), cambia il ritaglio: si toglie solo il lavanda (§5bis).
- ✅ **Il fiore è tolto** (D-105, 2026-09-06). Conseguenza: lo stadio 2 **si genera** (§4bis) e non è più il riferimento, e da lì in poi `riferimento.jpg` non si allega più a nessun prompt.
- ❓ **L'anello del ciuccio resta rosa?** Era il rosa del fiore; senza fiore è l'unico accento saturo del personaggio (§1, §4). Si tiene, ma è un cambio di una riga se lo si preferisce crema o navy.
- [ ] **Generare le nove immagini**: i prompt ci sono tutti (§4, §5, §5bis), l'ordine di produzione è in §5bis. È il prossimo passo concreto.
- ⚠️ **Nessuno stadio può deperire e nessun umore può rimproverare** (vincolo di P-01, §0). Da verificare su ogni immagine generata, non solo da tenere a mente.
- ⚠️ **Il riferimento in repo è un JPEG** (§1): per l'asset dell'app serve un PNG rigenerato dalla fonte.
- ⚠️ **La palette è una lettura a occhio**, non i colori del file sorgente (§1).
- ✅ ~~Nessuna immagine è stata ancora generata~~ — **le nove esistono dal 2026-09-06**, in `assets/creatura/`. Questo file è tornato a essere quello che dice di essere: lo script che le ha prodotte, e la ragione di ogni scelta dentro di loro.
- ⚠️ **Contenuto generato dall'AI e negozi**: se la mascotte finisce nell'icona o negli screenshot dello store, va verificato che l'uso commerciale di immagini generate sia coperto dalle condizioni del servizio usato. Non è stato verificato.
