/**
 * I **banchi di parole** dei due giochi: 500 per «indovina il disegno», 500 per
 * «telepatia».
 *
 * ## Perché stanno qui e non nella tabella `domanda`
 *
 * Lo schema ha una tabella `domanda` con una colonna `lingua`, pensata per i
 * giochi a domande di D-12. Per queste due liste non serve, e usarla sarebbe
 * costato più di quanto rendeva:
 *
 * - sono **contenuto nostro e immutabile**, non dati della coppia: mille righe
 *   identiche per tutti, da seminare in ogni ambiente e da tenere allineate fra
 *   sviluppo e produzione;
 * - servono **a ogni round**, cioè decine di volte per partita: leggerle dal
 *   database vorrebbe dire un viaggio di rete per mostrare una parola;
 * - e soprattutto: una riga per lingua avrebbe reso possibile che le due liste
 *   **divergessero** — 500 righe italiane e 499 inglesi è un difetto che si
 *   scopre quando a qualcuno tocca il round 500.
 *
 * ## 🔑 La chiave è la lingua neutra, ed è ciò che rende il gioco bilingue
 *
 * Ogni voce è una coppia: **la chiave (che è anche il testo inglese)** e il
 * testo italiano. Nel database si salva **solo la chiave**; ogni telefono
 * rende la lingua sua.
 *
 * Conseguenza che vale la pena rendere esplicita: se lei ha il telefono in
 * italiano e lui in inglese, **giocano la stessa identica partita** — stesso
 * round, stessa parola, stessi punti — e ognuno vede la propria lingua. Non è
 * un caso di scuola: è la coppia italo-straniera, che per un'app di coppia è
 * uno dei casi più probabili in assoluto.
 *
 * ⚠️ **La chiave non cambia mai.** Una partita in corso salva chiavi; se una
 * chiave sparisse o cambiasse in un aggiornamento, la partita di chi ha già
 * l'app aggiornata e quella di chi non l'ha ancora non parlerebbero più la
 * stessa lingua. Si possono **aggiungere** voci in fondo; non se ne rinominano.
 *
 * ## Il filtro sul contenuto (D-08, D-13)
 *
 * Nessuna delle 1000 voci tocca le categorie particolari dell'art. 9: niente
 * salute, religione, opinioni politiche, origine etnica, vita sessuale. Per
 * «indovina il disegno» il filtro è quasi automatico — sono oggetti concreti —
 * ma non del tutto: parole come *chiesa* o *moschea* sono oggetti disegnabili e
 * sono **volutamente assenti**, perché una parola da disegnare è una parola che
 * poi si commenta, e non è questo il gioco in cui farlo.
 *
 * Per «telepatia» il filtro conta di più, perché lì la parola non si disegna:
 * si **sceglie**, e la scelta dice qualcosa di chi la fa. Le voci sono quindi
 * volutamente neutre e concrete.
 */

/** Una voce del banco: `[chiave inglese, testo italiano]`. */
export type Voce = readonly [chiave: string, it: string];

/**
 * Rende una voce nella lingua data. La chiave **è** il testo inglese, quindi
 * l'inglese non ha bisogno di una colonna sua.
 */
export function rendi(voce: Voce, lingua: 'it' | 'en'): string {
  return lingua === 'it' ? voce[1] : voce[0];
}

/**
 * Normalizza un testo per il confronto dei tentativi.
 *
 * ⚠️ Serve perché un tentativo si **scrive**, e chi scrive di fretta con una
 * mano sola sul telefono sbaglia in modi prevedibili: maiuscole, accenti,
 * l'articolo davanti, uno spazio di troppo. Rifiutare «Il Cane» quando la
 * parola è «cane» non è rigore, è un gioco che litiga con chi ci sta giocando.
 *
 * Cosa **non** fa: non corregge i refusi veri e non accetta i sinonimi. Il
 * confine è voluto — «cagnolino» non è «cane», e accettarlo vorrebbe dire
 * decidere noi quanto vale il tentativo di qualcun altro.
 */
export function normalizza(testo: string): string {
  return testo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Via i segni diacritici, scritti come intervallo esplicito e non come
    // caratteri combinanti letterali: quelli in un editor non si vedono.
    .replace(/[\u0300-\u036f]/g, '')
    // Via gli articoli iniziali, italiani e inglesi.
    .replace(/^(il|lo|la|i|gli|le|un|uno|una|l'|the|a|an)\s+/u, '')
    .replace(/\s+/g, ' ');
}

/** Il tentativo indovina la voce? Confronto su **entrambe** le lingue. */
export function indovinata(tentativo: string, voce: Voce): boolean {
  const t = normalizza(tentativo);
  if (t.length === 0) return false;
  // ⚠️ Si accetta anche la parola nell'**altra** lingua: chi ha il telefono in
  // inglese e conosce la parola italiana ha indovinato lo stesso — il gioco è
  // capire il disegno, non ricordarsi in che lingua ha l'interfaccia.
  return t === normalizza(voce[0]) || t === normalizza(voce[1]);
}

/**
 * **Le 500 parole da disegnare.**
 *
 * Criterio di scelta, uno solo e vincolante: **si deve poter disegnare in
 * trenta secondi con un dito**. È un criterio più stretto di «sostantivo
 * concreto» e taglia fuori tre famiglie che sembrano ovvie e non lo sono:
 *
 * - le cose **senza forma propria** (*aria*, *rumore*): non c'è niente da
 *   tracciare;
 * - le cose che si distinguono solo per un **dettaglio fine** (*lupo* contro
 *   *cane*, *violino* contro *viola*): il disegno è giusto e il tentativo è
 *   sbagliato, e la colpa sembra di chi indovina;
 * - le cose che si disegnano **scrivendole** (*nome*, *lettera*): il gioco
 *   diventa scrivere la parola, e finisce lì.
 *
 * Ordinate per famiglia, così un'aggiunta futura trova il suo posto invece di
 * finire in coda a caso.
 */
export const PAROLE_DISEGNO: readonly Voce[] = [
  // --- animali ------------------------------------------------------------
  ['dog', 'cane'], ['cat', 'gatto'], ['horse', 'cavallo'], ['cow', 'mucca'],
  ['pig', 'maiale'], ['sheep', 'pecora'], ['goat', 'capra'], ['rabbit', 'coniglio'],
  ['mouse', 'topo'], ['squirrel', 'scoiattolo'], ['hedgehog', 'riccio'], ['bat', 'pipistrello'],
  ['bear', 'orso'], ['lion', 'leone'], ['tiger', 'tigre'], ['elephant', 'elefante'],
  ['giraffe', 'giraffa'], ['zebra', 'zebra'], ['monkey', 'scimmia'], ['kangaroo', 'canguro'],
  ['camel', 'cammello'], ['rhino', 'rinoceronte'], ['hippo', 'ippopotamo'], ['crocodile', 'coccodrillo'],
  ['snake', 'serpente'], ['turtle', 'tartaruga'], ['frog', 'rana'], ['lizard', 'lucertola'],
  ['fish', 'pesce'], ['shark', 'squalo'], ['whale', 'balena'], ['dolphin', 'delfino'],
  ['octopus', 'polpo'], ['crab', 'granchio'], ['lobster', 'aragosta'], ['jellyfish', 'medusa'],
  ['starfish', 'stella marina'], ['seahorse', 'cavalluccio marino'], ['snail', 'lumaca'], ['worm', 'verme'],
  ['bird', 'uccello'], ['chicken', 'gallina'], ['rooster', 'gallo'], ['duck', 'anatra'],
  ['swan', 'cigno'], ['owl', 'gufo'], ['eagle', 'aquila'], ['penguin', 'pinguino'],
  ['flamingo', 'fenicottero'], ['peacock', 'pavone'], ['parrot', 'pappagallo'], ['bee', 'ape'],
  ['butterfly', 'farfalla'], ['ladybug', 'coccinella'], ['ant', 'formica'], ['spider', 'ragno'],
  ['dragonfly', 'libellula'], ['dinosaur', 'dinosauro'], ['dragon', 'drago'], ['unicorn', 'unicorno'],
  // --- corpo e persone -----------------------------------------------------
  ['eye', 'occhio'], ['ear', 'orecchio'], ['nose', 'naso'], ['mouth', 'bocca'],
  ['tooth', 'dente'], ['tongue', 'lingua'], ['hand', 'mano'], ['foot', 'piede'],
  ['heart', 'cuore'], ['brain', 'cervello'], ['bone', 'osso'], ['skeleton', 'scheletro'],
  ['moustache', 'baffi'], ['beard', 'barba'], ['hair', 'capelli'], ['smile', 'sorriso'],
  ['tear', 'lacrima'], ['footprint', 'impronta'], ['shadow', 'ombra'], ['ghost', 'fantasma'],
  // --- cibo ---------------------------------------------------------------
  ['apple', 'mela'], ['pear', 'pera'], ['banana', 'banana'], ['orange', 'arancia'],
  ['lemon', 'limone'], ['strawberry', 'fragola'], ['cherry', 'ciliegia'], ['grape', 'uva'],
  ['watermelon', 'anguria'], ['pineapple', 'ananas'], ['peach', 'pesca'], ['kiwi', 'kiwi'],
  ['coconut', 'cocco'], ['avocado', 'avocado'], ['carrot', 'carota'], ['potato', 'patata'],
  ['tomato', 'pomodoro'], ['onion', 'cipolla'], ['garlic', 'aglio'], ['pepper', 'peperone'],
  ['mushroom', 'fungo'], ['corn', 'mais'], ['broccoli', 'broccolo'], ['pumpkin', 'zucca'],
  ['bread', 'pane'], ['croissant', 'cornetto'], ['cake', 'torta'], ['cupcake', 'tortina'],
  ['cookie', 'biscotto'], ['donut', 'ciambella'], ['pizza', 'pizza'], ['spaghetti', 'spaghetti'],
  ['lasagna', 'lasagna'], ['sandwich', 'panino'], ['hamburger', 'hamburger'], ['hot dog', 'hot dog'],
  ['fries', 'patatine'], ['popcorn', 'popcorn'], ['cheese', 'formaggio'], ['egg', 'uovo'],
  ['bacon', 'pancetta'], ['sausage', 'salsiccia'], ['fish bone', 'lisca'], ['ice cream', 'gelato'],
  ['lollipop', 'lecca lecca'], ['candy', 'caramella'], ['chocolate', 'cioccolato'], ['honey', 'miele'],
  ['salt', 'sale'], ['sugar', 'zucchero'],
  // --- casa e oggetti ------------------------------------------------------
  ['house', 'casa'], ['door', 'porta'], ['window', 'finestra'], ['key', 'chiave'],
  ['bed', 'letto'], ['chair', 'sedia'], ['table', 'tavolo'], ['sofa', 'divano'],
  ['lamp', 'lampada'], ['candle', 'candela'], ['mirror', 'specchio'], ['clock', 'orologio'],
  ['stairs', 'scale'], ['ladder', 'scala a pioli'], ['roof', 'tetto'], ['chimney', 'camino'],
  ['fence', 'staccionata'], ['mailbox', 'cassetta della posta'], ['bell', 'campanello'], ['carpet', 'tappeto'],
  ['curtain', 'tenda'], ['pillow', 'cuscino'], ['blanket', 'coperta'], ['towel', 'asciugamano'],
  ['toothbrush', 'spazzolino'], ['soap', 'sapone'], ['comb', 'pettine'], ['scissors', 'forbici'],
  ['razor', 'rasoio'], ['bathtub', 'vasca'], ['shower', 'doccia'], ['toilet', 'water'],
  ['sink', 'lavandino'], ['bucket', 'secchio'], ['broom', 'scopa'], ['trash can', 'bidone'],
  ['plate', 'piatto'], ['bowl', 'ciotola'], ['cup', 'tazza'], ['glass', 'bicchiere'],
  ['bottle', 'bottiglia'], ['fork', 'forchetta'], ['spoon', 'cucchiaio'], ['knife', 'coltello'],
  ['pot', 'pentola'], ['pan', 'padella'], ['kettle', 'bollitore'], ['fridge', 'frigorifero'],
  ['oven', 'forno'], ['toaster', 'tostapane'], ['blender', 'frullatore'], ['can', 'lattina'],
  ['jar', 'barattolo'], ['basket', 'cesto'], ['box', 'scatola'], ['bag', 'borsa'],
  ['backpack', 'zaino'], ['suitcase', 'valigia'], ['wallet', 'portafoglio'], ['umbrella', 'ombrello'],
  ['book', 'libro'], ['pencil', 'matita'], ['pen', 'penna'], ['eraser', 'gomma'],
  ['ruler', 'righello'], ['paintbrush', 'pennello'], ['paper', 'foglio'], ['envelope', 'busta'],
  ['stamp', 'francobollo'], ['newspaper', 'giornale'], ['map', 'mappa'], ['calendar', 'calendario'],
  ['balloon', 'palloncino'], ['gift', 'regalo'], ['ribbon', 'nastro'], ['crown', 'corona'],
  ['ring', 'anello'], ['necklace', 'collana'], ['watch', 'orologio da polso'], ['glasses', 'occhiali'],
  ['camera', 'macchina fotografica'], ['phone', 'telefono'], ['laptop', 'computer'], ['television', 'televisione'],
  ['radio', 'radio'], ['headphones', 'cuffie'], ['battery', 'batteria'], ['plug', 'spina'],
  ['light bulb', 'lampadina'], ['magnet', 'calamita'], ['telescope', 'telescopio'], ['microscope', 'microscopio'],
  ['magnifying glass', 'lente'], ['compass', 'bussola'], ['hourglass', 'clessidra'], ['thermometer', 'termometro'],
  // --- natura --------------------------------------------------------------
  ['sun', 'sole'], ['moon', 'luna'], ['star', 'stella'], ['cloud', 'nuvola'],
  ['rain', 'pioggia'], ['snow', 'neve'], ['snowman', 'pupazzo di neve'], ['rainbow', 'arcobaleno'],
  ['lightning', 'fulmine'], ['fire', 'fuoco'], ['wave', 'onda'], ['mountain', 'montagna'],
  ['volcano', 'vulcano'], ['island', 'isola'], ['desert', 'deserto'], ['forest', 'bosco'],
  ['tree', 'albero'], ['leaf', 'foglia'], ['flower', 'fiore'], ['rose', 'rosa'],
  ['sunflower', 'girasole'], ['tulip', 'tulipano'], ['cactus', 'cactus'], ['mushroom cloud', 'nuvola a fungo'],
  ['grass', 'erba'], ['seed', 'seme'], ['root', 'radice'], ['branch', 'ramo'],
  ['acorn', 'ghianda'], ['pinecone', 'pigna'], ['feather', 'piuma'], ['shell', 'conchiglia'],
  ['rock', 'sasso'], ['sand', 'sabbia'], ['river', 'fiume'], ['waterfall', 'cascata'],
  ['lake', 'lago'], ['beach', 'spiaggia'], ['cave', 'grotta'], ['planet', 'pianeta'],
  // --- trasporti -----------------------------------------------------------
  ['car', 'automobile'], ['bus', 'autobus'], ['truck', 'camion'], ['taxi', 'taxi'],
  ['bicycle', 'bicicletta'], ['motorcycle', 'moto'], ['scooter', 'monopattino'], ['skateboard', 'skateboard'],
  ['train', 'treno'], ['tram', 'tram'], ['subway', 'metropolitana'], ['airplane', 'aereo'],
  ['helicopter', 'elicottero'], ['rocket', 'razzo'], ['hot air balloon', 'mongolfiera'], ['parachute', 'paracadute'],
  ['boat', 'barca'], ['ship', 'nave'], ['sailboat', 'barca a vela'], ['canoe', 'canoa'],
  ['submarine', 'sottomarino'], ['anchor', 'ancora'], ['lighthouse', 'faro'], ['bridge', 'ponte'],
  ['road', 'strada'], ['traffic light', 'semaforo'], ['stop sign', 'segnale di stop'], ['tunnel', 'tunnel'],
  ['wheel', 'ruota'], ['tire', "gomma dell’auto"], ['steering wheel', 'volante'], ['gas pump', 'pompa di benzina'],
  // --- vestiti -------------------------------------------------------------
  ['shirt', 'camicia'], ['t-shirt', 'maglietta'], ['sweater', 'maglione'], ['jacket', 'giacca'],
  ['coat', 'cappotto'], ['dress', 'vestito'], ['skirt', 'gonna'], ['trousers', 'pantaloni'],
  ['shorts', 'pantaloncini'], ['socks', 'calzini'], ['shoe', 'scarpa'], ['boot', 'stivale'],
  ['sandal', 'sandalo'], ['slipper', 'pantofola'], ['hat', 'cappello'], ['cap', 'berretto'],
  ['scarf', 'sciarpa'], ['gloves', 'guanti'], ['belt', 'cintura'], ['tie', 'cravatta'],
  ['button', 'bottone'], ['zipper', 'cerniera'], ['pocket', 'tasca'], ['apron', 'grembiule'],
  ['swimsuit', 'costume da bagno'], ['pyjamas', 'pigiama'], ['mask', 'maschera'], ['helmet', 'casco'],
  // --- sport e gioco -------------------------------------------------------
  ['ball', 'palla'], ['football', 'pallone da calcio'], ['basketball', 'pallacanestro'], ['tennis racket', 'racchetta'],
  ['goal', 'porta da calcio'], ['whistle', 'fischietto'], ['medal', 'medaglia'], ['trophy', 'coppa'],
  ['skis', 'sci'], ['sled', 'slitta'], ['surfboard', 'tavola da surf'], ['swimming pool', 'piscina'],
  ['dumbbell', 'manubrio'], ['jump rope', 'corda per saltare'], ['bowling pin', 'birillo'], ['dartboard', 'bersaglio'],
  ['chess', 'scacchi'], ['dice', 'dado'], ['playing card', 'carta da gioco'], ['puzzle', 'puzzle'],
  ['kite', 'aquilone'], ['swing', 'altalena'], ['slide', 'scivolo'], ['seesaw', 'dondolo'],
  ['teddy bear', 'orsacchiotto'], ['doll', 'bambola'], ['robot', 'robot'], ['spinning top', 'trottola'],
  ['yo-yo', 'yo-yo'], ['marble', 'biglia'], ['bubble', 'bolla di sapone'], ['ferris wheel', 'ruota panoramica'],
  // --- musica --------------------------------------------------------------
  ['guitar', 'chitarra'], ['piano', 'pianoforte'], ['drum', 'tamburo'], ['trumpet', 'tromba'],
  ['saxophone', 'sassofono'], ['flute', 'flauto'], ['harp', 'arpa'], ['accordion', 'fisarmonica'],
  ['microphone', 'microfono'], ['speaker', 'altoparlante'], ['musical note', 'nota musicale'], ['record', 'disco'],
  // --- lavoro e attrezzi ---------------------------------------------------
  ['hammer', 'martello'], ['nail', 'chiodo'], ['screw', 'vite'], ['screwdriver', 'cacciavite'],
  ['saw', 'sega'], ['axe', 'ascia'], ['wrench', 'chiave inglese'], ['drill', 'trapano'],
  ['shovel', 'pala'], ['rake', 'rastrello'], ['watering can', 'annaffiatoio'], ['wheelbarrow', 'carriola'],
  ['toolbox', 'cassetta degli attrezzi'], ['gear', 'ingranaggio'], ['spring', 'molla'], ['chain', 'catena'],
  ['rope', 'corda'], ['hook', 'gancio'], ['net', 'rete'], ['fishing rod', 'canna da pesca'],
  ['firefighter', 'pompiere'], ['chef', 'cuoco'], ['astronaut', 'astronauta'], ['pirate', 'pirata'],
  ['clown', 'pagliaccio'], ['wizard', 'mago'], ['knight', 'cavaliere'], ['cowboy', 'cowboy'],
  // --- luoghi e costruzioni ------------------------------------------------
  ['castle', 'castello'], ['tower', 'torre'], ['windmill', 'mulino a vento'], ['barn', 'fienile'],
  ['tent', 'tenda da campeggio'], ['igloo', 'igloo'], ['treehouse', "casa sull’albero"], ['skyscraper', 'grattacielo'],
  ['pyramid', 'piramide'], ['statue', 'statua'], ['fountain', 'fontana'], ['bench', 'panchina'],
  ['street lamp', 'lampione'], ['shop', 'negozio'], ['school', 'scuola'], ['hospital', 'ospedale'],
  ['library', 'biblioteca'], ['museum', 'museo'], ['cinema', 'cinema'], ['restaurant', 'ristorante'],
  ['hotel', 'albergo'], ['airport', 'aeroporto'], ['station', 'stazione'], ['garage', 'garage'],
  // --- forme e simboli -----------------------------------------------------
  ['circle', 'cerchio'], ['square', 'quadrato'], ['triangle', 'triangolo'], ['spiral', 'spirale'],
  ['arrow', 'freccia'], ['question mark', 'punto interrogativo'], ['exclamation mark', 'punto esclamativo'], ['infinity', 'infinito'],
  ['puzzle piece', 'pezzo di puzzle'], ['checkmark', 'segno di spunta'], ['cross', 'croce'], ['flag', 'bandiera'],
  ['target', 'bersaglio a cerchi'], ['maze', 'labirinto'], ['knot', 'nodo'], ['zigzag', 'zigzag'],
  // --- fantasia ------------------------------------------------------------
  ['crystal ball', 'sfera di cristallo'], ['magic wand', 'bacchetta magica'], ['potion', 'pozione'], ['treasure chest', 'forziere'],
  ['genie lamp', 'lampada magica'], ['broomstick', 'manico di scopa'], ['witch hat', 'cappello da strega'], ['alien', 'alieno'],
  ['ufo', 'disco volante'], ['mermaid', 'sirena'], ['fairy', 'fata'], ['giant', 'gigante'],
  ['sword', 'spada'], ['shield', 'scudo'], ['bow', 'arco'], ['arrow tip', 'punta di freccia'],
  ['armour', 'armatura'], ['throne', 'trono'], ['scroll', 'pergamena'], ['skull', 'teschio'],
  // --- azioni e scene ------------------------------------------------------
  ['running', 'correre'], ['sleeping', 'dormire'], ['dancing', 'ballare'], ['swimming', 'nuotare'],
  ['jumping', 'saltare'], ['climbing', 'arrampicarsi'], ['falling', 'cadere'], ['flying', 'volare'],
  ['reading', 'leggere'], ['writing', 'scrivere'], ['cooking', 'cucinare'], ['eating', 'mangiare'],
  ['drinking', 'bere'], ['singing', 'cantare'], ['laughing', 'ridere'], ['crying', 'piangere'],
  ['hugging', 'abbracciarsi'], ['waving', 'salutare con la mano'], ['pointing', 'indicare'], ['whispering', 'sussurrare'],
  ['fishing', 'pescare'], ['painting', 'dipingere'], ['gardening', 'fare giardinaggio'], ['shopping', 'fare la spesa'],
  ['driving', 'guidare'], ['waiting', 'aspettare'], ['hiding', 'nascondersi'], ['searching', 'cercare'],
  // --- varie ---------------------------------------------------------------
  ['birthday cake', 'torta di compleanno'], ['picnic', 'picnic'], ['campfire', 'falò'], ['fireworks', "fuochi d’artificio"],
  ['snowball', 'palla di neve'], ['sandcastle', 'castello di sabbia'], ['scarecrow', 'spaventapasseri'], ['piggy bank', 'salvadanaio'],
  ['coin', 'moneta'], ['banknote', 'banconota'], ['ticket', 'biglietto'], ['receipt', 'scontrino'],
  ['bandage', 'cerotto'], ['first aid kit', 'cassetta di pronto soccorso'], ['fire extinguisher', 'estintore'], ['alarm', 'sveglia'],
  ['calculator', 'calcolatrice'], ['abacus', 'abaco'], ['globe', 'mappamondo'], ['flagpole', 'asta della bandiera'],
];


/** Un tema della telepatia: un titolo bilingue e le sue voci. */
export type TemaTelepatia = { readonly titolo: Voce; readonly voci: readonly Voce[] };

/**
 * **I 25 temi della telepatia**, 20 voci ciascuno: 500 in tutto.
 *
 * ## Perché a temi e non un mucchio unico
 *
 * Le regole dicono «quattro parole uguali per entrambi». Pescandole da un banco
 * unico di 500 uscirebbero set come *cane · martello · blu · Parigi*: quattro
 * cose che non stanno sulla stessa scala, dove scegliere non vuol dire niente
 * e indovinare è puro caso.
 *
 * 🔑 **La telepatia funziona solo se le quattro opzioni sono confrontabili.**
 * «Quale colore avrebbe scelto?» è una domanda a cui si può rispondere pensando
 * all'altra persona; «cane o martello?» no. Il tema è ciò che trasforma una
 * scelta casuale in un piccolo atto di conoscenza — che è tutto il gioco.
 *
 * ⚠️ Venti voci per tema, non quattro: se il tema avesse esattamente le opzioni
 * del round, dopo tre partite le si conoscerebbero a memoria e si sceglierebbe
 * «quella che scegliamo sempre». Venti ne fanno pescare quattro diverse quasi
 * ogni volta.
 *
 * **Il filtro di D-08 qui morde davvero**, più che nel disegno: una parola
 * scelta dice qualcosa di chi la sceglie. Nessun tema tocca salute, religione,
 * opinioni politiche, origine o vita sessuale — e non per prudenza generica: un
 * gioco che chiede «quale di queste quattro?» su una di quelle categorie **è**
 * un trattamento progettato per raccoglierla, che è precisamente il caso che
 * D-08 esiste per impedire.
 */
export const TEMI_TELEPATIA: readonly TemaTelepatia[] = [
  {
    titolo: ['A colour', 'Un colore'],
    voci: [
      ['red', 'rosso'], ['blue', 'blu'], ['green', 'verde'], ['yellow', 'giallo'],
      ['orange', 'arancione'], ['purple', 'viola'], ['pink', 'rosa'], ['black', 'nero'],
      ['white', 'bianco'], ['grey', 'grigio'], ['brown', 'marrone'], ['gold', 'oro'],
      ['silver', 'argento'], ['turquoise', 'turchese'], ['beige', 'beige'], ['navy', 'blu notte'],
      ['emerald', 'smeraldo'], ['coral', 'corallo'], ['ivory', 'avorio'], ['lilac', 'lilla'],
    ],
  },
  {
    titolo: ['An animal', 'Un animale'],
    voci: [
      ['dog', 'cane'], ['cat', 'gatto'], ['horse', 'cavallo'], ['rabbit', 'coniglio'],
      ['lion', 'leone'], ['tiger', 'tigre'], ['elephant', 'elefante'], ['bear', 'orso'],
      ['wolf', 'lupo'], ['fox', 'volpe'], ['dolphin', 'delfino'], ['penguin', 'pinguino'],
      ['owl', 'gufo'], ['eagle', 'aquila'], ['turtle', 'tartaruga'], ['butterfly', 'farfalla'],
      ['panda', 'panda'], ['koala', 'koala'], ['giraffe', 'giraffa'], ['deer', 'cervo'],
    ],
  },
  {
    titolo: ['A fruit', 'Un frutto'],
    voci: [
      ['apple', 'mela'], ['banana', 'banana'], ['strawberry', 'fragola'], ['cherry', 'ciliegia'],
      ['peach', 'pesca'], ['pear', 'pera'], ['grape', 'uva'], ['watermelon', 'anguria'],
      ['pineapple', 'ananas'], ['mango', 'mango'], ['orange', 'arancia'], ['lemon', 'limone'],
      ['kiwi', 'kiwi'], ['melon', 'melone'], ['fig', 'fico'], ['apricot', 'albicocca'],
      ['plum', 'prugna'], ['raspberry', 'lampone'], ['blueberry', 'mirtillo'], ['coconut', 'cocco'],
    ],
  },
  {
    titolo: ['A dessert', 'Un dolce'],
    voci: [
      ['tiramisu', 'tiramisù'], ['ice cream', 'gelato'], ['cheesecake', 'cheesecake'], ['brownie', 'brownie'],
      ['pancakes', 'pancake'], ['croissant', 'cornetto'], ['donut', 'ciambella'], ['cannolo', 'cannolo'],
      ['panna cotta', 'panna cotta'], ['profiterole', 'profiterole'], ['apple pie', 'torta di mele'], ['crème brûlée', 'crème brûlée'],
      ['macaron', 'macaron'], ['waffle', 'waffle'], ['chocolate cake', 'torta al cioccolato'], ['sorbet', 'sorbetto'],
      ['biscuit', 'biscotto'], ['meringue', 'meringa'], ['strudel', 'strudel'], ['zabaione', 'zabaione'],
    ],
  },
  {
    titolo: ['A drink', 'Una bevanda'],
    voci: [
      ['coffee', 'caffè'], ['tea', 'tè'], ['water', 'acqua'], ['orange juice', 'succo d’arancia'],
      ['lemonade', 'limonata'], ['milk', 'latte'], ['hot chocolate', 'cioccolata calda'], ['smoothie', 'frullato'],
      ['iced tea', 'tè freddo'], ['sparkling water', 'acqua frizzante'], ['cappuccino', 'cappuccino'], ['espresso', 'espresso'],
      ['milkshake', 'frappè'], ['coconut water', 'acqua di cocco'], ['ginger ale', 'ginger ale'], ['apple juice', 'succo di mela'],
      ['herbal tea', 'tisana'], ['barley coffee', 'orzo'], ['tonic water', 'acqua tonica'], ['cold brew', 'cold brew'],
    ],
  },
  {
    titolo: ['A city', 'Una città'],
    voci: [
      ['Rome', 'Roma'], ['Paris', 'Parigi'], ['London', 'Londra'], ['New York', 'New York'],
      ['Tokyo', 'Tokyo'], ['Barcelona', 'Barcellona'], ['Amsterdam', 'Amsterdam'], ['Lisbon', 'Lisbona'],
      ['Venice', 'Venezia'], ['Florence', 'Firenze'], ['Naples', 'Napoli'], ['Milan', 'Milano'],
      ['Berlin', 'Berlino'], ['Vienna', 'Vienna'], ['Prague', 'Praga'], ['Dublin', 'Dublino'],
      ['Sydney', 'Sydney'], ['Rio de Janeiro', 'Rio de Janeiro'], ['Istanbul', 'Istanbul'], ['Copenhagen', 'Copenaghen'],
    ],
  },
  {
    titolo: ['A place to escape to', 'Un posto dove scappare'],
    voci: [
      ['the beach', 'la spiaggia'], ['the mountains', 'la montagna'], ['a lake', 'un lago'], ['the countryside', 'la campagna'],
      ['a desert island', 'un’isola deserta'], ['a forest', 'un bosco'], ['a big city', 'una grande città'], ['a small village', 'un paesino'],
      ['a cabin', 'una baita'], ['a lighthouse', 'un faro'], ['a boat', 'una barca'], ['a hot spring', 'le terme'],
      ['a vineyard', 'una vigna'], ['a waterfall', 'una cascata'], ['a canyon', 'un canyon'], ['a glacier', 'un ghiacciaio'],
      ['a tropical reef', 'una barriera corallina'], ['a national park', 'un parco naturale'], ['a rooftop', 'un tetto'], ['a garden', 'un giardino'],
    ],
  },
  {
    titolo: ['A season or a moment', 'Una stagione o un momento'],
    voci: [
      ['spring', 'primavera'], ['summer', 'estate'], ['autumn', 'autunno'], ['winter', 'inverno'],
      ['dawn', 'alba'], ['morning', 'mattina'], ['noon', 'mezzogiorno'], ['afternoon', 'pomeriggio'],
      ['sunset', 'tramonto'], ['evening', 'sera'], ['night', 'notte'], ['midnight', 'mezzanotte'],
      ['a rainy day', 'un giorno di pioggia'], ['a snowy day', 'un giorno di neve'], ['a windy day', 'un giorno di vento'], ['a foggy day', 'un giorno di nebbia'],
      ['a sunny day', 'un giorno di sole'], ['a storm', 'un temporale'], ['a full moon', 'la luna piena'], ['the first warm day', 'il primo giorno caldo'],
    ],
  },
  {
    titolo: ['A way to travel', 'Un modo di viaggiare'],
    voci: [
      ['car', 'automobile'], ['train', 'treno'], ['plane', 'aereo'], ['ship', 'nave'],
      ['bicycle', 'bicicletta'], ['motorcycle', 'moto'], ['bus', 'autobus'], ['camper van', 'camper'],
      ['on foot', 'a piedi'], ['sailboat', 'barca a vela'], ['hot air balloon', 'mongolfiera'], ['helicopter', 'elicottero'],
      ['scooter', 'scooter'], ['ferry', 'traghetto'], ['tram', 'tram'], ['horse', 'a cavallo'],
      ['canoe', 'canoa'], ['cable car', 'funivia'], ['night train', 'treno notturno'], ['hitchhiking', 'in autostop'],
    ],
  },
  {
    titolo: ['A number', 'Un numero'],
    voci: [
      ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'],
      ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'],
      ['9', '9'], ['10', '10'], ['11', '11'], ['12', '12'],
      ['13', '13'], ['17', '17'], ['21', '21'], ['33', '33'],
      ['42', '42'], ['50', '50'], ['77', '77'], ['100', '100'],
    ],
  },
  {
    titolo: ['A shape', 'Una forma'],
    voci: [
      ['circle', 'cerchio'], ['square', 'quadrato'], ['triangle', 'triangolo'], ['star', 'stella'],
      ['heart', 'cuore'], ['spiral', 'spirale'], ['diamond', 'rombo'], ['hexagon', 'esagono'],
      ['cross', 'croce'], ['arrow', 'freccia'], ['wave', 'onda'], ['ring', 'anello'],
      ['cube', 'cubo'], ['sphere', 'sfera'], ['pyramid', 'piramide'], ['cylinder', 'cilindro'],
      ['crescent', 'mezzaluna'], ['zigzag', 'zigzag'], ['cloud shape', 'nuvola'], ['teardrop', 'goccia'],
    ],
  },
  {
    titolo: ['A flower', 'Un fiore'],
    voci: [
      ['rose', 'rosa'], ['tulip', 'tulipano'], ['sunflower', 'girasole'], ['daisy', 'margherita'],
      ['lily', 'giglio'], ['orchid', 'orchidea'], ['lavender', 'lavanda'], ['peony', 'peonia'],
      ['violet', 'violetta'], ['jasmine', 'gelsomino'], ['poppy', 'papavero'], ['hydrangea', 'ortensia'],
      ['carnation', 'garofano'], ['iris', 'iris'], ['magnolia', 'magnolia'], ['wisteria', 'glicine'],
      ['camellia', 'camelia'], ['freesia', 'fresia'], ['dahlia', 'dalia'], ['mimosa', 'mimosa'],
    ],
  },
  {
    titolo: ['A musical instrument', 'Uno strumento musicale'],
    voci: [
      ['guitar', 'chitarra'], ['piano', 'pianoforte'], ['violin', 'violino'], ['drums', 'batteria'],
      ['saxophone', 'sassofono'], ['trumpet', 'tromba'], ['flute', 'flauto'], ['harp', 'arpa'],
      ['cello', 'violoncello'], ['accordion', 'fisarmonica'], ['ukulele', 'ukulele'], ['double bass', 'contrabbasso'],
      ['clarinet', 'clarinetto'], ['banjo', 'banjo'], ['organ', 'organo'], ['mandolin', 'mandolino'],
      ['harmonica', 'armonica'], ['xylophone', 'xilofono'], ['bagpipes', 'cornamusa'], ['tambourine', 'tamburello'],
    ],
  },
  {
    titolo: ['A sport', 'Uno sport'],
    voci: [
      ['football', 'calcio'], ['basketball', 'pallacanestro'], ['tennis', 'tennis'], ['swimming', 'nuoto'],
      ['running', 'corsa'], ['cycling', 'ciclismo'], ['volleyball', 'pallavolo'], ['skiing', 'sci'],
      ['surfing', 'surf'], ['climbing', 'arrampicata'], ['dancing', 'danza'], ['boxing', 'boxe'],
      ['golf', 'golf'], ['sailing', 'vela'], ['skating', 'pattinaggio'], ['yoga', 'yoga'],
      ['rugby', 'rugby'], ['archery', 'tiro con l’arco'], ['fencing', 'scherma'], ['table tennis', 'ping pong'],
    ],
  },
  {
    titolo: ['A kind of film', 'Un genere di film'],
    voci: [
      ['comedy', 'commedia'], ['thriller', 'thriller'], ['romance', 'romantico'], ['science fiction', 'fantascienza'],
      ['fantasy', 'fantasy'], ['animation', 'animazione'], ['documentary', 'documentario'], ['adventure', 'avventura'],
      ['mystery', 'giallo'], ['musical', 'musical'], ['western', 'western'], ['historical', 'storico'],
      ['drama', 'drammatico'], ['action', 'azione'], ['crime', 'poliziesco'], ['biography', 'biografico'],
      ['road movie', 'road movie'], ['noir', 'noir'], ['coming of age', 'di formazione'], ['disaster', 'catastrofico'],
    ],
  },
  {
    titolo: ['A scent', 'Un profumo'],
    voci: [
      ['coffee', 'caffè'], ['fresh bread', 'pane appena sfornato'], ['rain', 'pioggia'], ['cut grass', 'erba tagliata'],
      ['the sea', 'il mare'], ['vanilla', 'vaniglia'], ['cinnamon', 'cannella'], ['lavender', 'lavanda'],
      ['pine', 'pino'], ['orange peel', 'buccia d’arancia'], ['woodsmoke', 'legna che brucia'], ['clean laundry', 'bucato pulito'],
      ['mint', 'menta'], ['chocolate', 'cioccolato'], ['old books', 'libri vecchi'], ['jasmine', 'gelsomino'],
      ['basil', 'basilico'], ['leather', 'cuoio'], ['wet earth', 'terra bagnata'], ['sunscreen', 'crema solare'],
    ],
  },
  {
    titolo: ['A material', 'Un materiale'],
    voci: [
      ['wood', 'legno'], ['glass', 'vetro'], ['metal', 'metallo'], ['stone', 'pietra'],
      ['paper', 'carta'], ['cotton', 'cotone'], ['wool', 'lana'], ['silk', 'seta'],
      ['leather', 'pelle'], ['clay', 'argilla'], ['marble', 'marmo'], ['bamboo', 'bambù'],
      ['velvet', 'velluto'], ['linen', 'lino'], ['ceramic', 'ceramica'], ['copper', 'rame'],
      ['crystal', 'cristallo'], ['cork', 'sughero'], ['rope', 'corda'], ['wax', 'cera'],
    ],
  },
  {
    titolo: ['A room', 'Una stanza'],
    voci: [
      ['kitchen', 'cucina'], ['bedroom', 'camera da letto'], ['living room', 'salotto'], ['bathroom', 'bagno'],
      ['balcony', 'balcone'], ['terrace', 'terrazza'], ['garden', 'giardino'], ['study', 'studio'],
      ['attic', 'soffitta'], ['cellar', 'cantina'], ['hallway', 'corridoio'], ['garage', 'garage'],
      ['pantry', 'dispensa'], ['laundry room', 'lavanderia'], ['porch', 'veranda'], ['library', 'stanza dei libri'],
      ['guest room', 'stanza degli ospiti'], ['dining room', 'sala da pranzo'], ['workshop', 'laboratorio'], ['walk-in closet', 'cabina armadio'],
    ],
  },
  {
    titolo: ['Something you always carry', 'Una cosa che porti sempre con te'],
    voci: [
      ['keys', 'chiavi'], ['phone', 'telefono'], ['wallet', 'portafoglio'], ['headphones', 'cuffie'],
      ['a book', 'un libro'], ['sunglasses', 'occhiali da sole'], ['a water bottle', 'una borraccia'], ['lip balm', 'burrocacao'],
      ['a notebook', 'un taccuino'], ['a pen', 'una penna'], ['chewing gum', 'gomme da masticare'], ['an umbrella', 'un ombrello'],
      ['a charger', 'un caricabatterie'], ['tissues', 'fazzoletti'], ['a hair tie', 'un elastico per capelli'], ['a lucky charm', 'un portafortuna'],
      ['a photo', 'una foto'], ['snacks', 'qualcosa da sgranocchiare'], ['a jumper', 'un maglione'], ['a shopping bag', 'una borsa della spesa'],
    ],
  },
  {
    titolo: ['A pizza topping', 'Un condimento per la pizza'],
    voci: [
      ['margherita', 'margherita'], ['mushrooms', 'funghi'], ['ham', 'prosciutto'], ['olives', 'olive'],
      ['onion', 'cipolla'], ['artichokes', 'carciofi'], ['aubergine', 'melanzane'], ['courgette', 'zucchine'],
      ['rocket', 'rucola'], ['cherry tomatoes', 'pomodorini'], ['buffalo mozzarella', 'bufala'], ['gorgonzola', 'gorgonzola'],
      ['spicy salami', 'salame piccante'], ['tuna', 'tonno'], ['potatoes', 'patate'], ['sausage', 'salsiccia'],
      ['peppers', 'peperoni'], ['four cheeses', 'quattro formaggi'], ['pesto', 'pesto'], ['plain focaccia', 'focaccia'],
    ],
  },
  {
    titolo: ['An ice cream flavour', 'Un gusto di gelato'],
    voci: [
      ['chocolate', 'cioccolato'], ['vanilla', 'crema'], ['strawberry', 'fragola'], ['pistachio', 'pistacchio'],
      ['hazelnut', 'nocciola'], ['lemon', 'limone'], ['coffee', 'caffè'], ['stracciatella', 'stracciatella'],
      ['mint', 'menta'], ['coconut', 'cocco'], ['yoghurt', 'yogurt'], ['tiramisu', 'tiramisù'],
      ['melon', 'melone'], ['raspberry', 'lampone'], ['almond', 'mandorla'], ['cinnamon', 'cannella'],
      ['salted caramel', 'caramello salato'], ['dark chocolate', 'cioccolato fondente'], ['peach', 'pesca'], ['zabaione', 'zabaione'],
    ],
  },
  {
    titolo: ['An idea for an evening together', 'Un’idea per una serata insieme'],
    voci: [
      ['a film at home', 'un film a casa'], ['dinner out', 'cena fuori'], ['a walk', 'una passeggiata'], ['cooking together', 'cucinare insieme'],
      ['a board game', 'un gioco da tavolo'], ['a concert', 'un concerto'], ['stargazing', 'guardare le stelle'], ['a long drive', 'un giro in macchina'],
      ['reading side by side', 'leggere vicini'], ['a picnic', 'un picnic'], ['dancing in the kitchen', 'ballare in cucina'], ['a bath', 'un bagno caldo'],
      ['looking at old photos', 'guardare vecchie foto'], ['a museum evening', 'un museo la sera'], ['ice cream out', 'un gelato fuori'], ['a card game', 'una partita a carte'],
      ['planning a trip', 'progettare un viaggio'], ['an early night', 'andare a letto presto'], ['a video call with friends', 'una videochiamata con amici'], ['doing nothing', 'non fare niente'],
    ],
  },
  {
    titolo: ['A small pleasure', 'Un piccolo piacere'],
    voci: [
      ['sleeping in', 'dormire fino a tardi'], ['a hot shower', 'una doccia calda'], ['fresh sheets', 'lenzuola pulite'], ['the first coffee', 'il primo caffè'],
      ['a nap', 'un pisolino'], ['sun on your face', 'il sole in faccia'], ['a good song', 'una bella canzone'], ['rain on the window', 'la pioggia sul vetro'],
      ['a warm blanket', 'una coperta calda'], ['an empty beach', 'una spiaggia vuota'], ['a long hug', 'un abbraccio lungo'], ['a finished book', 'un libro finito'],
      ['a tidy room', 'una stanza in ordine'], ['a surprise message', 'un messaggio a sorpresa'], ['a day with no plans', 'un giorno senza impegni'], ['warm bread', 'pane caldo'],
      ['a quiet morning', 'una mattina silenziosa'], ['candlelight', 'la luce di una candela'], ['bare feet on grass', 'i piedi scalzi sull’erba'], ['laughing until it hurts', 'ridere fino a farsi male'],
    ],
  },
  {
    titolo: ['A gift', 'Un regalo'],
    voci: [
      ['flowers', 'fiori'], ['a book', 'un libro'], ['a plant', 'una pianta'], ['a trip', 'un viaggio'],
      ['a concert ticket', 'un biglietto per un concerto'], ['a letter', 'una lettera'], ['a photo album', 'un album di foto'], ['a scarf', 'una sciarpa'],
      ['perfume', 'un profumo'], ['a watch', 'un orologio'], ['a vinyl record', 'un disco in vinile'], ['a dinner', 'una cena'],
      ['something handmade', 'qualcosa fatto a mano'], ['a candle', 'una candela'], ['a mug', 'una tazza'], ['a board game', 'un gioco da tavolo'],
      ['a piece of jewellery', 'un gioiello'], ['a cookbook', 'un libro di ricette'], ['a blanket', 'una coperta'], ['a whole free day', 'un giorno libero tutto per voi'],
    ],
  },
  {
    titolo: ['A superpower', 'Un superpotere'],
    voci: [
      ['flying', 'volare'], ['invisibility', 'invisibilità'], ['reading minds', 'leggere nel pensiero'], ['teleporting', 'teletrasporto'],
      ['stopping time', 'fermare il tempo'], ['travelling in time', 'viaggiare nel tempo'], ['talking to animals', 'parlare con gli animali'], ['breathing underwater', 'respirare sott’acqua'],
      ['super strength', 'super forza'], ['super speed', 'super velocità'], ['healing', 'guarire'], ['never sleeping', 'non dormire mai'],
      ['speaking every language', 'parlare tutte le lingue'], ['being in two places', 'essere in due posti'], ['controlling the weather', 'comandare il tempo'], ['never getting lost', 'non perdersi mai'],
      ['perfect memory', 'memoria perfetta'], ['walking through walls', 'attraversare i muri'], ['seeing in the dark', 'vedere al buio'], ['always finding a parking space', 'trovare sempre parcheggio'],
    ],
  },
];
