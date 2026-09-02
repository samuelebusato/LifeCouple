/**
 * I **banchi di parole** dei giochi: 500 per «indovina il disegno», 500 per
 * «telepatia», le domande del «quiz sulle preferenze» e le carte di «obbligo o
 * verità».
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

/**
 * Una domanda del quiz, in **due persone**.
 *
 * 🔑 **Perché due titoli e non uno** (2026-09-01, chiesto dall'utente: *«vorrei
 * che fosse più evidente chi deve rispondere e chi deve indovinare»*).
 *
 * Le quattro risposte sono le stesse per tutti e due, ma servono a due cose
 * opposte: uno dice la verità su di sé, l'altro tira a indovinare. Con un
 * titolo solo in terza persona — «Il suo piatto consolatorio» — chi era di
 * turno leggeva una domanda che parlava di qualcun altro proprio mentre doveva
 * rispondere per sé.
 *
 * Un'etichetta di ruolo aiuta, ma resta una cosa **in più** da leggere. Cambiare
 * la persona del titolo mette l'informazione **dove gli occhi già sono**: la
 * riga grande in cima. «Il tuo piatto consolatorio» e «Il suo piatto
 * consolatorio» non si confondono nemmeno guardandole di sfuggita.
 */
export type DomandaQuiz = {
  /** Come si legge quando tocca a te rispondere. */
  readonly tuo: Voce;
  /** Come si legge quando devi indovinare l'altro. */
  readonly titolo: Voce;
  readonly voci: readonly Voce[];
};

/**
 * **Le domande del «quiz sulle preferenze»**, 8 risposte ciascuna.
 *
 * ## Perché stanno qui e non nella tabella `domanda`
 *
 * Lo schema ha una tabella `domanda` fin dalla 0001, ed è **vuota**: nasce per
 * il banco *personalizzato* della coppia (D-19, backlog 11-bis), dove il
 * contenuto lo scrivono loro. Il banco **comune** invece è nostro, è bilingue e
 * non cambia mai — esattamente come `TEMI_TELEPATIA` e `PAROLE_DISEGNO`, che per
 * questo vivono nel codice. Metterlo nel database vorrebbe dire una migrazione
 * di seed per ogni domanda aggiunta, e due lingue da tenere allineate a mano in
 * righe invece che in una coppia di stringhe che il tipo obbliga a riempire.
 *
 * ## Il filtro di D-08, che qui morde più che altrove
 *
 * ⚠️ Nella telepatia una scelta dice qualcosa di chi la fa; qui **la domanda è
 * su di lei o su di lui per costruzione** — è il gioco. Nessuna domanda tocca
 * salute, religione, opinioni politiche, origine o vita sessuale: un quiz che
 * chiedesse «quale di queste quattro?» su una di quelle categorie non sarebbe un
 * gioco indiscreto, sarebbe **un trattamento progettato per raccoglierla**, cioè
 * il caso preciso che D-08 esiste per impedire.
 *
 * 🔑 E c'è un secondo filtro, che non è legale ma di tono: niente domande la cui
 * risposta possa **ferire** («cosa cambieresti di lui», «chi dei due…»). Il
 * punteggio è della coppia (P-03), e una domanda che mette i due uno contro
 * l'altro rimetterebbe dalla finestra il verdetto sulla relazione che P-03
 * caccia dalla porta.
 */
export const DOMANDE_QUIZ: readonly DomandaQuiz[] = [
  {
    tuo: ['Your comfort food', 'Il tuo piatto consolatorio'],
    titolo: ['Their comfort food', 'Il suo piatto consolatorio'],
    voci: [
      ['pizza', 'pizza'], ['pasta', 'pasta'], ['ice cream', 'gelato'], ['fries', 'patatine'],
      ['soup', 'zuppa'], ['chocolate', 'cioccolato'], ['a sandwich', 'un panino'], ['rice', 'riso'],
    ],
  },
  {
    tuo: ['Your ideal Saturday night', 'Il tuo sabato sera ideale'],
    titolo: ['Their ideal Saturday night', 'Il suo sabato sera ideale'],
    voci: [
      ['dinner out', 'cena fuori'], ['a film at home', 'un film a casa'],
      ['with friends', 'con gli amici'], ['a concert', 'un concerto'],
      ['a long walk', 'una passeggiata lunga'], ['dancing', 'ballare'],
      ['in bed early', 'a letto presto'], ['cooking together', 'cucinare insieme'],
    ],
  },
  {
    tuo: ['Your favourite season', 'La tua stagione preferita'],
    titolo: ['Their favourite season', 'La sua stagione preferita'],
    voci: [
      ['spring', 'primavera'], ['summer', 'estate'], ['autumn', 'autunno'], ['winter', 'inverno'],
      ['early summer', 'inizio estate'], ['late autumn', 'tardo autunno'],
      ['the first cold days', 'i primi freddi'], ['the first warm days', 'i primi caldi'],
    ],
  },
  {
    tuo: ['What you order at the bar', 'Cosa ordini al bar'],
    titolo: ['What they order at the bar', 'Cosa ordina al bar'],
    voci: [
      ['espresso', 'espresso'], ['cappuccino', 'cappuccino'], ['tea', 'tè'],
      ['orange juice', 'spremuta'], ['hot chocolate', 'cioccolata calda'], ['water', 'acqua'],
      ['iced coffee', 'caffè freddo'], ['a croissant too', 'anche un cornetto'],
    ],
  },
  {
    tuo: ['How you wake up', 'Come ti svegli'],
    titolo: ['How they wake up', 'Come si sveglia'],
    voci: [
      ['at once', 'di colpo'], ['ten more minutes', 'altri dieci minuti'],
      ['before the alarm', 'prima della sveglia'], ['in silence', 'in silenzio'],
      ['talking straight away', 'parlando subito'], ['with music', 'con la musica'],
      ['slowly', 'lentamente'], ['already late', 'già in ritardo'],
    ],
  },
  {
    tuo: ['The holiday you would pick', 'La vacanza che sceglieresti'],
    titolo: ['The holiday they would pick', 'La vacanza che sceglierebbe'],
    voci: [
      ['the sea', 'il mare'], ['the mountains', 'la montagna'], ['a city', 'una città'],
      ['a lake', 'un lago'], ['a road trip', 'un viaggio in auto'], ['an island', 'un’isola'],
      ['the countryside', 'la campagna'], ['somewhere cold', 'un posto freddo'],
    ],
  },
  {
    tuo: ['What you watch when tired', 'Cosa guardi quando sei stanco'],
    titolo: ['What they watch when tired', 'Cosa guarda quando è stanco'],
    voci: [
      ['a comedy', 'una commedia'], ['a series already seen', 'una serie già vista'],
      ['a documentary', 'un documentario'], ['something short', 'qualcosa di corto'],
      ['a cartoon', 'un cartone'], ['nothing at all', 'niente'], ['sport', 'lo sport'],
      ['cooking shows', 'programmi di cucina'],
    ],
  },
  {
    tuo: ['The gift you would love', 'Il regalo che vorresti'],
    titolo: ['The gift they would love', 'Il regalo che vorrebbe'],
    voci: [
      ['a trip', 'un viaggio'], ['a book', 'un libro'],
      ['something handmade', 'una cosa fatta a mano'], ['a dinner', 'una cena'],
      ['a plant', 'una pianta'], ['a photo album', 'un album di foto'],
      ['a surprise', 'una sorpresa'], ['nothing, just time', 'niente, solo tempo'],
    ],
  },
  {
    tuo: ['How you unwind', 'Come ti rilassi'],
    titolo: ['How they unwind', 'Come si rilassa'],
    voci: [
      ['a hot shower', 'una doccia calda'], ['music', 'la musica'], ['a walk', 'una camminata'],
      ['the sofa', 'il divano'], ['tidying up', 'mettere in ordine'],
      ['a phone call', 'una telefonata'], ['cooking', 'cucinare'], ['sleeping', 'dormire'],
    ],
  },
  {
    tuo: ['Your favourite spot at home', 'Il tuo posto preferito in casa'],
    titolo: ['Their favourite spot at home', 'Il suo posto preferito in casa'],
    voci: [
      ['the sofa', 'il divano'], ['the kitchen', 'la cucina'], ['the bed', 'il letto'],
      ['the balcony', 'il balcone'], ['by the window', 'vicino alla finestra'],
      ['the desk', 'la scrivania'], ['the bathroom', 'il bagno'],
      ['wherever you are', 'dove ci sei tu'],
    ],
  },
  {
    tuo: ['What you would never order', 'Cosa non ordineresti mai'],
    titolo: ['What they would never order', 'Cosa non ordinerebbe mai'],
    voci: [
      ['pineapple pizza', 'pizza con l’ananas'], ['oysters', 'ostriche'],
      ['very spicy food', 'roba piccantissima'], ['tripe', 'trippa'],
      ['liquorice', 'liquirizia'], ['blue cheese', 'formaggio erborinato'],
      ['raw fish', 'pesce crudo'], ['bitter drinks', 'amari'],
    ],
  },
  {
    tuo: ['Your small luxury', 'Il tuo piccolo lusso'],
    titolo: ['Their small luxury', 'Il suo piccolo lusso'],
    voci: [
      ['good coffee', 'un buon caffè'], ['clean sheets', 'lenzuola pulite'],
      ['a long shower', 'una doccia lunga'], ['a taxi', 'un taxi'], ['dessert', 'il dolce'],
      ['a nap', 'un sonnellino'], ['new shoes', 'scarpe nuove'], ['silence', 'il silenzio'],
    ],
  },
  {
    tuo: ['How you arrive at an appointment', 'Come arrivi a un appuntamento'],
    titolo: ['How they arrive at an appointment', 'Come arriva a un appuntamento'],
    voci: [
      ['early', 'in anticipo'], ['exactly on time', 'preciso'],
      ['five minutes late', 'cinque minuti dopo'], ['always late', 'sempre tardi'],
      ['running', 'di corsa'], ['calling on the way', 'chiamando per strada'],
      ['first of everyone', 'primo di tutti'], ['last of everyone', 'ultimo di tutti'],
    ],
  },
  {
    tuo: ['The sound you like most', 'Il rumore che ti piace di più'],
    titolo: ['The sound they like most', 'Il rumore che gli piace di più'],
    voci: [
      ['rain', 'la pioggia'], ['the sea', 'il mare'], ['a fire', 'il fuoco'],
      ['wind in the trees', 'il vento fra gli alberi'], ['a coffee machine', 'la moka'],
      ['footsteps in the snow', 'i passi sulla neve'], ['a distant train', 'un treno lontano'],
      ['silence', 'il silenzio'],
    ],
  },
];

/**
 * **Le carte di «obbligo o verità»** (D-13, backlog voce 10).
 *
 * Due liste separate e non una sola con un'etichetta: il tipo lo sceglie chi ha
 * il turno **prima** di vedere la carta, quindi la lista da cui pescare è già
 * decisa nel momento in cui si pesca. Una lista unica da filtrare a ogni round
 * farebbe lo stesso lavoro tenendo aperta la possibilità di pescare dalla parte
 * sbagliata.
 *
 * ## Il filtro, che qui è la funzione di sicurezza del gioco
 *
 * ⚠️ In questo gioco il contenuto **non è** un dettaglio di tono: è la
 * mitigazione. D-13 ha esaminato la proposta *«chi passa di più perde»* e ha
 * concluso che una meccanica che punisce il rifiuto, in un'app di coppia, è
 * l'app che si schiera dalla parte della pressione — sul confine di fiducia
 * TB-2, quello caratteristico del prodotto. La risposta scelta non è stata
 * addolcire la meccanica ma **rendere innocuo ciò che c'è scritto sulle carte**.
 *
 * Da lì i tre filtri, in ordine di durezza:
 *
 * 1. **D-08, le categorie dell'art. 9**: niente salute, religione, opinioni
 *    politiche, origine, vita sessuale. Qui morde quanto nel quiz — una carta
 *    che chiede di *raccontare* una di quelle è un trattamento di dato
 *    particolare travestito da gioco.
 * 2. **D-13, prima esclusione: nessun obbligo che comporti atti fisici.** Non è
 *    pudore ed è il filtro meno ovvio dei tre: un obbligo fisico è l'unico che
 *    non si può passare *senza che si veda*, ed è quindi l'unico che trasforma
 *    il pass in una scena. Gli obblighi qui sotto si fanno tutti **da seduti**,
 *    con la voce o col telefono in mano.
 * 3. **D-13, seconda esclusione: nessuna verità sui dettagli delle relazioni
 *    precedenti.** È la domanda che in coppia non si dimentica più, e un gioco
 *    non deve poterla fare al posto di chi non l'avrebbe fatta.
 *
 * 🔑 E un quarto filtro, di tono, che vale come per `DOMANDE_QUIZ`: **niente
 * carte la cui risposta possa ferire**, e niente carte che mettano i due uno
 * contro l'altro. Il punteggio è della coppia (P-03): una carta come *«chi dei
 * due…»* rimetterebbe dalla finestra il verdetto sulla relazione.
 *
 * ⚠️ Come per gli altri banchi: **le chiavi non si rinominano mai** (una partita
 * in corso ne ha salvata una), si aggiunge solo in fondo.
 */

/**
 * Gli **obblighi**: si fanno da seduti, con la voce o col telefono.
 *
 * ⚠️ Ognuno è scritto per essere **eseguibile subito e finito in un minuto**. Un
 * obbligo che richiede di alzarsi, di uscire o di aspettare non è un obbligo
 * difficile: è un obbligo che interrompe la partita, e che quindi verrà passato
 * da chiunque — non per pudore, per praticità. Il pass deve costare una scelta,
 * non la logistica.
 */
export const OBBLIGHI: readonly Voce[] = [
  ['Do your best impression of the other', 'Fai la tua migliore imitazione dell’altro'],
  ['Say three things you like about them, without stopping', 'Di’ tre cose che ti piacciono di lui, senza fermarti'],
  ['Tell your day as if it were a film trailer', 'Racconta la tua giornata come il trailer di un film'],
  ['Read your last message out loud, in a news anchor voice', 'Leggi a voce alta il tuo ultimo messaggio, con la voce del telegiornale'],
  ['Name five things in this room you would take on a trip', 'Elenca cinque cose in questa stanza che porteresti in viaggio'],
  ['Talk for a minute without saying the word no', 'Parla per un minuto senza dire «no»'],
  ['Invent a name for the next place you will go together', 'Inventa un nome per il prossimo posto in cui andrete insieme'],
  ['Tell how you met, but from the other’s side', 'Racconta come vi siete conosciuti, ma dalla parte dell’altro'],
  ['Choose the film for the next evening, no appeals', 'Scegli tu il film della prossima serata, senza appello'],
  ['Say out loud one thing you want to do together this month', 'Di’ a voce alta una cosa che volete fare insieme questo mese'],
  ['Make a two line speech thanking them for something small', 'Fai un discorso di due righe per ringraziarlo di una cosa piccola'],
  ['Repeat the last thing that made you laugh', 'Ripeti l’ultima cosa che ti ha fatto ridere'],
  ['Send them a voice note right now, with whatever you like in it', 'Mandagli un vocale adesso, con dentro quello che vuoi'],
  ['Show the last photo in your gallery and explain it', 'Mostra l’ultima foto della tua galleria e spiegala'],
  ['Describe the other in three words, and defend them', 'Descrivi l’altro in tre parole, e difendile'],
  ['Choose the dish for the next dinner at home', 'Scegli tu il piatto della prossima cena a casa'],
  ['Tell a story from when you were little that they have never heard', 'Racconta una storia di quando eri piccolo che non ha mai sentito'],
  ['Say what you would take to a desert island, apart from them', 'Di’ cosa porteresti su un’isola deserta, a parte lui'],
  ['Do an impression of how the other wakes up in the morning', 'Imita come si sveglia l’altro la mattina'],
  ['Choose the next place to put on your map', 'Scegli tu il prossimo posto da segnare sulla vostra mappa'],
  ['Pay a compliment you have thought and never said', 'Fai un complimento che hai pensato e non hai mai detto'],
  ['Announce the score of this game like a sports commentator', 'Annuncia il punteggio di questa partita come un telecronista'],
  ['Tell what you would do with an unexpected free day', 'Racconta cosa faresti con un giorno libero a sorpresa'],
  ['Recite the shopping list as if it were a poem', 'Recita la lista della spesa come se fosse una poesia'],
  ['Pick a nickname for the other and use it for the rest of the game', 'Scegli un soprannome per l’altro e usalo per il resto della partita'],
  ['Say what you were thinking the first time you saw them', 'Di’ cosa stavi pensando la prima volta che l’hai visto'],
  ['Plan out loud a perfect Sunday for the two of you', 'Progetta a voce alta una domenica perfetta per voi due'],
  ['Tell the plot of the last film you saw, badly', 'Racconta la trama dell’ultimo film che hai visto, male'],
  ['Give this evening a title, like a book', 'Dai un titolo a questa serata, come a un libro'],
  ['Say the first thing you would buy with a small win', 'Di’ la prima cosa che compreresti con una piccola vincita'],
] as const;

/**
 * Le **verità**: si rispondono a parole, e nessuna chiede un dato che poi resti.
 *
 * ⚠️ Nessuna riguarda relazioni precedenti (D-13), nessuna tocca le categorie
 * dell'art. 9 (D-08), e nessuna chiede *«chi dei due…»*: la risposta va sul
 * mondo di chi parla, mai sulla graduatoria fra i due (P-03).
 */
export const VERITA: readonly Voce[] = [
  ['What is the smallest thing that makes your day better?', 'Qual è la cosa più piccola che ti migliora la giornata?'],
  ['What have you never told them about the way they cook?', 'Cosa non gli hai mai detto di come cucina?'],
  ['Which of your habits would you defend to the end?', 'Quale tua abitudine difenderesti fino alla fine?'],
  ['What is the nicest present you have ever been given?', 'Qual è il regalo più bello che ti abbiano fatto?'],
  ['What would you like to learn to do together?', 'Cosa ti piacerebbe imparare a fare insieme?'],
  ['Which trip would you do again exactly as it was?', 'Quale viaggio rifaresti identico?'],
  ['What was the first thing you noticed about them?', 'Qual è la prima cosa che hai notato di lui?'],
  ['What are you proudest of, this year?', 'Di cosa sei più orgoglioso, quest’anno?'],
  ['Which compliment stayed with you the longest?', 'Quale complimento ti è rimasto più a lungo?'],
  ['What do you always put off?', 'Cosa rimandi sempre?'],
  ['Which film would you watch again tonight?', 'Quale film rivedresti stasera?'],
  ['What is your most useless talent?', 'Qual è il tuo talento più inutile?'],
  ['What did you want to be when you were ten?', 'Cosa volevi fare a dieci anni?'],
  ['What makes you laugh even when it should not?', 'Cosa ti fa ridere anche quando non dovrebbe?'],
  ['Which small thing of theirs do you copy without saying so?', 'Quale piccola cosa dell’altro copi senza dirlo?'],
  ['What is the best decision you have made together?', 'Qual è la decisione migliore che avete preso insieme?'],
  ['What do you never leave the house without?', 'Cosa non esci mai di casa senza?'],
  ['Which day of the last year would you live again?', 'Quale giorno dell’ultimo anno rivivresti?'],
  ['What do you think about on the way home?', 'A cosa pensi mentre torni a casa?'],
  ['Which promise to yourself do you keep?', 'Quale promessa che ti sei fatto mantieni?'],
  ['What is the nicest thing you have done without telling anyone?', 'Qual è la cosa più bella che hai fatto senza dirlo a nessuno?'],
  ['Which song reminds you of them?', 'Quale canzone ti ricorda l’altro?'],
  ['What would you change about an ordinary day of yours?', 'Cosa cambieresti di una tua giornata normale?'],
  ['What do you always order the first time in a new place?', 'Cosa ordini sempre la prima volta in un posto nuovo?'],
  ['What are you better at than you admit?', 'In cosa sei più bravo di quanto ammetti?'],
  ['What would you like to be asked more often?', 'Cosa ti piacerebbe ti chiedessero più spesso?'],
  ['What is the thing you would never throw away?', 'Qual è la cosa che non butteresti via mai?'],
  ['Which place do you go back to in your head?', 'In quale posto torni con la testa?'],
  ['What did you understand late that now seems obvious?', 'Cosa hai capito tardi che adesso ti sembra ovvio?'],
  ['What would you like this evening to be remembered for?', 'Per cosa ti piacerebbe che questa serata fosse ricordata?'],
] as const;
