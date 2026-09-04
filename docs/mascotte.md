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

**Cosa comporta D-95, e va tenuto presente leggendo tutto il resto del file**:
- Il numero degli stadi **non è libero**: D-09 fissa ~5-6 stadi discreti (§2).
- Il conto delle immagini è **`stadi × umori`**, perché il componente del disegno riceve `stadio` **e** `umore`.
- 🔑 **Vincolo che viene da P-01 e non dal disegno**: *«la creatura cresce e basta: non muore, non deperisce, non rimprovera»* — una creatura che deperisce applica una punizione a una relazione, e se la coppia sta attraversando un periodo difficile l'app aggiunge senso di colpa nel momento peggiore. **Quindi nessuno stadio può rappresentare deperimento, e nessun umore può leggersi come rimprovero per l'assenza.** Un umore «triste» che significhi *«non vi occupate di me»* violerebbe P-01 pur essendo solo un disegno. L'assenza rallenta la crescita, non imbruttisce la creatura.

**Non deciso — e sono le domande che restano**:
- ❓ **Quanti stadi e quanti umori.** D-09 fissa ~5-6 stadi discreti, non due (§2); gli umori non sono mai stati contati.
- 🔴 **Come si anima un PNG generato** (§9): è il nodo tecnico vero, e la risposta cambia il costo di tutto il resto.

⚠️ **Questo file non è in anticipo sui tempi: è esattamente D-11.** «Si progetta subito, si implementa per ultima» — progettare il disegno mentre il resto dell'app si costruisce è ciò che quella decisione chiede. Non implica alcun anticipo dell'implementazione, che resta ultima.

---

## 1. Il soggetto — ciò che non deve cambiare mai

Il riferimento è uno **sticker fustellato in vettoriale piatto**: contorno navy uniforme e spesso su ogni forma, cel-shading pulito senza sfumature, bordo bianco attorno alla sagoma, fondo lavanda piatto. Una lontra dorata seduta che tiene un sasso di fiume fra le zampe anteriori, con un fiore rosa dietro l'orecchio sinistro (destra di chi guarda).

Questi sono i **tratti d'identità**: cambiarne uno cambia personaggio.

| Elemento | Hex (approssimato) |
|---|---|
| Pelo dorato-ambra | `#E2A03C` |
| Muso, petto e pancia crema | `#F6ECD9` |
| Contorno / occhi / naso, navy scuro | `#2E2A45` |
| Fiore rosa (5 petali) | `#F07BA8` |
| Cuore del fiore, giallo | `#F6D24B` |
| Foglia verde | `#6FBF4A` |
| Sasso di fiume, grigio | `#9AA3A8` |
| Fondo lavanda | `#A98CF0` |
| Bordo sticker | bianco pieno |

⚠️ **Gli esadecimali sono una lettura a occhio dell'immagine di riferimento**, non i colori del file sorgente. Se l'originale esiste, vanno sostituiti con quelli veri: il modello li segue abbastanza fedelmente da farti guadagnare coerenza fra una generazione e l'altra, quindi vale la pena che siano esatti.

**Dove va il riferimento**: `assets/mascotte/` — vedi il `LEGGIMI.txt` di quella cartella.

---

## 2. Gli stadi — e perché due non bastano

La mascotte **è** la creatura (D-95), quindi **D-09 ha già deciso il numero**: *«~5-6 stadi discreti, non una scala continua»*, e la ragione è di costo — il costo dell'upgrade grafico cresce **linearmente col numero di stati visivi**, perché ognuno va disegnato e animato.

Oggi il materiale copre **due stadi e mezzo**:

| Stadio | Stato | Rapporto testa/corpo |
|---|---|---|
| Cucciolo | prompt pronto (§4) | 1 : 1,5 |
| *(il riferimento)* | immagine esistente | ~1 : 1,8 |
| Adulta | prompt pronto (§5) | 1 : 2,4 |

🔑 **La cosa importante da capire prima di generare**: il prompt dell'adulta parametrizza l'età su **una sola manopola numerica** — il rapporto testa/corpo — e le altre variazioni le tiene fisse. Questo vuol dire che gli stadi intermedi **non vanno inventati da capo**: si ottengono muovendo quel numero (§6), il che è esattamente ciò che rende raggiungibili 5-6 stadi invece di 2. Se ogni stadio richiedesse un prompt scritto a mano, il vincolo di costo di D-09 tornerebbe a mordere.

⚠️ **Vincolo che D-09 impone al disegno, non alla logica**: il componente riceve **solo `stadio` e `umore`** e non sa altro. Quindi ogni stadio va prodotto anche in più **umori**, e il conto delle immagini è `stadi × umori`, non `stadi`. Prima di generare in massa conviene sapere quanti umori esistono — e oggi **non è deciso**.

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
  (#F6ECD9), dark navy eyes and nose, pink five-petal flower (#F07BA8) with a
  yellow star centre and one green leaf (#6FBF4A) tucked behind the LEFT ear
  (viewer's right).
- The flat lavender background (#A98CF0), edge to edge.
- The small grey river pebble held in both front paws against the chest.

CHANGE INTO BABY PROPORTIONS:
- Head-to-body ratio pushed to about 1:1.5 — the head is nearly half the total
  height, clearly oversized for the body.
- Eyes noticeably larger and rounder, set lower on the face and further apart,
  with a single soft highlight each.
- Muzzle shorter and squashed; cheeks rounder and fluffier.
- Ears smaller, rounder, set lower and wider on the skull.
- Limbs short and stubby, paws tiny and mitten-like, no visible claws.
- Tail shorter and thicker, curling in a soft comma close to the body.
- Body a plump rounded teardrop, belly slightly bigger; a couple of soft baby
  fur tufts on the crown instead of the sharp cowlick.
- The flower reads slightly oversized on the smaller head, like a hand-me-down.

ADD — THE PACIFIER:
- A baby pacifier (dummy) in its mouth, drawn in the same flat vector style: a
  small rounded cream shield (#F6ECD9) with a pink ring (#F07BA8) matching the
  flower, outlined in the same thick dark navy. Centred just under the nose.
- The pacifier REPLACES the smile: the mouth is hidden behind the shield, no
  mouth line and no teeth are drawn.
- Because the mouth is covered, all the warmth must come from the eyes: keep
  them wide, round and softly content, with the cheeks slightly raised, so the
  cub reads as calm and happy and never blank.
- No strap, no clip, no chain — the pacifier alone.

Square 1:1 composition, character centred, generous margin, same framing energy
as the reference. Same character — do not restyle, do not change species, do not
add outfits or props beyond the pebble and the pacifier.
```

⚠️ **Il ciuccio riusa il rosa del fiore invece di introdurre un colore nuovo.** Non è un vezzo: ogni colore in più è un colore che gli stadi successivi dovranno gestire, e la tavolozza del §1 è ciò che tiene insieme cinque immagini generate in momenti diversi.

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
  (#F6ECD9), dark navy eyes and nose, pink five-petal flower (#F07BA8) with a
  yellow star centre and one green leaf (#6FBF4A) behind the LEFT ear
  (viewer's right).
- The flat lavender background (#A98CF0), edge to edge.
- The small grey river pebble held in both front paws against the chest.

CHANGE INTO ADULT PROPORTIONS:
- Head-to-body ratio about 1:2.4 — the head is still generous, but the body is
  now clearly longer.
- Longer, fuller otter body with a gentle shoulder line and soft haunches.
- Longer limbs with visible slim forearms; paws a little larger, toes soft and
  rounded, still no sharp claws.
- Tail longer and thicker, tapering, resting in one wide relaxed curve.
- Muzzle slightly longer and broader, with three tiny whisker dots per side.
- Ears set higher on the skull and slightly larger.
- The sharp crown cowlick of the reference comes back, a little longer.
- Posture upright and settled: chest slightly forward, a calm, composed sit.

KEEP IT TENDER (this is the whole point — do not skip):
- Eyes stay LARGE relative to the head: shrink them by no more than 15%. Keep
  them perfectly round with a single soft highlight. Never almond-shaped, never
  half-lidded, never narrowed.
- Build the entire silhouette from curves: no angular jaw, no cheekbones, no
  muscle definition, no straight edges anywhere.
- Same small closed-mouth smile, gentle and unforced. No visible teeth.
- Keep the cream chest and belly generous and rounded — do not slim the torso
  into a sleek athletic shape.
- Relaxed brow, no frown, no smug or knowing expression.
- The flower is still worn, with the same innocence, now proportionally smaller
  on the larger head.

NEGATIVE: not anthropomorphic, no clothing or accessories beyond the flower and
the pebble, no muscular or athletic build, no sultry or half-lidded eyes, no
sharp angular features, no edgy or "cool" restyle, no realism, no fur texture,
no gradients, no background shadow.

Square 1:1, character centred, generous margin. Same character — do not restyle,
do not change species.
```

### Se esce comunque troppo dura

Non rigenerare da capo: correggi in un secondo passaggio, isolando il difetto.

```text
Keep everything exactly as it is, but soften the face: make the eyes larger and
perfectly round again, round off the jawline into a continuous curve, and relax
the brow. Do not change the pose, the palette or the proportions of the body.
```

---

## 6. Le manopole da girare

| Vuoi… | Cambia questa riga |
|---|---|
| Uno stadio **fra** cucciolo e riferimento | `1:1.5` → `1:1.65`, togli il ciuccio, rimetti il sorriso |
| Uno stadio **fra** riferimento e adulta | `1:2.4` → `1:1.9`, tenendo **tutto** il blocco KEEP IT TENDER |
| Più neonato ancora | `1:1.5` → `1:1.2`, e aggiungi *"eyes half-closed, sitting slightly slumped"* |
| Adulta anziana, ma sempre dolce | aggiungi *"a few pale cream hairs around the muzzle, softer heavier eyelids, same round eyes"* |
| Un altro **umore** (D-09) | sostituisci la riga dell'espressione, **non** le proporzioni: *"eyes closed in a happy arc"* · *"looking up, ears slightly back"* · *"small sleepy yawn"* |
| Un'altra posa | sostituisci il blocco del sasso: *"lying belly-up floating, paws over its chest"* / *"curled asleep in a ring, tail over the nose"* |
| Sfondo diverso | cambia l'esadecimale del lavanda — tienilo **piatto**: appena si accenna un gradiente lo stile sticker si sfalda |
| Formato | `Square 1:1` → `Portrait 3:4` o `Wide 16:9`; chiedi esplicitamente **2K** o **4K** se serve per la stampa o per ritagliare |

**Il dettaglio che il modello sbaglia più spesso è il fiore**: cambia lato o sparisce. Se succede, ripeti il vincolo da solo in un secondo passaggio — *"keep everything, move the flower back behind its left ear"* — invece di rigenerare tutto.

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
Baby proportions: oversized round head about 1:1.5 to the body, large round dark
navy eyes set low and wide with one soft highlight each, short squashed muzzle,
small dark rounded nose, small low round ears, chubby teardrop body, short stubby
limbs with tiny mitten paws, and a short thick tail curling in a soft comma. Two
little baby fur tufts on the crown.

It has a baby pacifier in its mouth: a small rounded cream shield (#F6ECD9) with
a pink ring (#F07BA8), outlined in the same dark navy, hiding the mouth. No strap
and no clip. The eyes are wide, round and softly content, cheeks slightly raised,
so it reads calm and happy.

A pink five-petal flower (#F07BA8) with a yellow star centre and one green leaf
(#6FBF4A) is tucked behind its left ear, slightly oversized on the small head.
It sits upright holding a smooth grey river pebble in both front paws against
its chest.

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
proportions: head-to-body about 1:2.4, a long full body with a gentle shoulder
line, longer slim limbs with soft rounded paws, and a long thick tapering tail in
one wide relaxed curve. Slightly longer muzzle with three tiny whisker dots per
side, ears set high on the skull, a soft cowlick on the crown.

Despite being adult it stays soft and endearing: large perfectly round dark navy
eyes with a single highlight, never narrowed or half-lidded; a silhouette built
entirely from curves with no angular jaw and no muscle definition; a small gentle
closed-mouth smile; a rounded cream belly, not a slim athletic torso.

A pink five-petal flower (#F07BA8) with a yellow star centre and one green leaf
(#6FBF4A) behind its left ear. It sits upright holding a smooth grey river pebble
in both front paws against its chest.

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
1:1.5), in the middle the reference age, on the right a grown adult
(head-to-body 1:2.4).

All three must read unmistakably as the same individual: identical palette,
identical outline weight, identical pink flower behind the left ear, each holding
its own grey pebble. All three keep large round eyes — the adult must look grown,
never cool or hardened.

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
forward. Identical proportions, palette, outline weight and flower placement in
all four. No text, no labels, no panel borders.
```

---

## 9. 🔴 Dal PNG all'animazione — il nodo tecnico, ancora aperto

Va scritto ora perché **decide il costo di tutto il resto**, e perché il materiale di questo file da solo non lo risolve.

**Nano Banana produce raster (PNG).** Lo stack di movimento di LifeCouple non è fatto per il raster: D-09 prevede `react-native-svg` + Reanimated per la versione geometrica, e come percorso di sostituzione *«un illustratore consegna file **Lottie**, uno per stadio»*. Lottie è vettoriale, e un PNG non ci si converte: la vettorizzazione automatica di un'illustrazione cel-shaded dà percorsi sporchi che poi nessuno anima davvero.

Le tre strade, col loro costo, **nessuna ancora scelta**:

| Strada | Cosa vuol dire | Costo | Cosa si perde |
|---|---|---|---|
| **a) Raster + trasformazioni** | un PNG per stadio/umore, animato con Reanimated su scala, rotazione, rimbalzo, e piccoli scostamenti | il più basso: nessuno strumento nuovo | il personaggio non si **deforma** — respira e rimbalza, non cambia espressione dentro l'animazione |
| **b) Raster ridisegnato a mano in SVG** | l'immagine generata diventa il *modello* che qualcuno ricalca in vettoriale | alto, e ricorrente per ogni stadio | niente, ma è il costo che D-09 voleva evitare |
| **c) Sprite / sequenza** | più fotogrammi generati per lo stesso stadio, riprodotti in sequenza | medio, ma **la coerenza fra fotogrammi generati è proprio ciò che un modello non garantisce** | rischio di sfarfallio fra un fotogramma e l'altro |

🔑 **Quale che sia la scelta, D-09 non cambia e va rispettata**: il componente del disegno riceve **solo `stadio` e `umore`**. Se si sceglie il raster, il file PNG è un dettaglio *dentro* quel componente — la logica di crescita non deve sapere che esiste un PNG, esattamente come oggi non sa che esistono dei cerchi.

⚠️ **La strada (a) è quella che oggi costa meno e non chiude nessuna porta**: si può partire di lì e passare a Lottie in seguito senza toccare la logica, che è precisamente il motivo per cui D-09 ha separato stato e disegno.

---

## 10. Aperto

- ✅ ~~Mascotte di marca o creatura di P-01?~~ — **risolto il 2026-09-04: è la creatura** (D-95, §0).
- ❓ **Quanti stadi e quanti umori** (§2): D-09 dice ~5-6 stadi e oggi ce ne sono due; gli umori non sono mai stati contati. È la prossima decisione, e va presa prima di generare: cambia il conto delle immagini da ~6 a ~30.
- ⚠️ **Nessuno stadio può deperire e nessun umore può rimproverare** (vincolo di P-01, §0). Da verificare su ogni immagine generata, non solo da tenere a mente.
- 🔴 **Come si anima** (§9): tre strade, nessuna scelta.
- ⚠️ **La palette è una lettura a occhio**, non i colori del file sorgente (§1).
- **Nessuna immagine è stata ancora generata**: questo file è lo script, non il risultato. L'immagine di riferimento va messa in `assets/mascotte/`.
- ⚠️ **Contenuto generato dall'AI e negozi**: se la mascotte finisce nell'icona o negli screenshot dello store, va verificato che l'uso commerciale di immagini generate sia coperto dalle condizioni del servizio usato. Non è stato verificato.
