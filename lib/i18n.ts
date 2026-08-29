import { getLocales } from 'expo-localization';

/**
 * Bilingue italiano/inglese (D-18), con la lingua presa dal dispositivo
 * invece che da un selettore (D-24): chi ha il telefono in italiano vede
 * l'app in italiano, tutti gli altri in inglese.
 *
 * Niente libreria di i18n: due lingue e poche centinaia di stringhe non
 * giustificano il peso di i18next. Il dizionario italiano definisce il tipo,
 * quindi una chiave aggiunta di qua e dimenticata di la' non compila.
 */

const it = {
  benvenuto: {
    sottotitolo:
      'Il vostro diario condiviso. Un posto solo per voi due, dove tenere quello che vivete insieme.',
    inizia: 'Iniziamo',
    nota: 'Bastano la tua email e il tuo partner.',
  },
  accedi: {
    titolo: 'Entra',
    sottotitolo: 'Ti mandiamo un codice via email. Niente password da ricordare.',
    placeholderEmail: 'la-tua@email.it',
    invio: 'Invio…',
    mandaCodice: 'Mandami il codice',
    titoloCodice: 'Il codice',
    sottotitoloCodice: (email: string) => `L'abbiamo mandato a ${email}. Controlla la posta.`,
    placeholderCodice: 'Inserisci il codice',
    verifico: 'Verifico…',
    entra: 'Entra',
    cambiaEmail: 'Cambia email',
  },
  onboarding: {
    titolo: 'Siete in due',
    sottotitolo: 'Crea il vostro spazio e invita il partner, oppure unisciti se hai ricevuto un invito.',
    crea: 'Crea il nostro spazio',
    unisciti: 'Ho ricevuto un invito',
    entraEDecidoDopo: 'Entra e decidi dopo',
    attesa: 'Un attimo…',
    titoloInvita: 'Invita il partner',
    sottotitoloInvita: 'Mandagli il link. Puoi anche entrare subito e invitarlo con calma.',
    condividi: 'Condividi il link',
    piuTardi: 'Invita più tardi',
    apertoInvito: 'Il tuo partner ha aperto l’invito.',
    conferma: 'Confermate: siete una coppia',
    unisco: 'Unisco…',
    inAttesaApertura: 'In attesa che apra il link…',
    titoloUnisci: 'Hai un invito',
    sottotitoloUnisci: 'Incolla il link che ti ha mandato il partner.',
    placeholderIncolla: 'Incolla qui il link',
    apri: 'Apri l’invito',
    apro: 'Apro…',
    indietro: 'Indietro',
    titoloAttesaConferma: 'Ci siamo quasi',
    testoAttesaConferma:
      'Hai aperto l’invito. Aspetta che il tuo partner confermi dal suo telefono: appena lo fa, entrate insieme.',
    messaggioCondivisione: (link: string) =>
      `Uniamoci su LifeCouple, il nostro diario condiviso. Apri questo link: ${link}`,
    condivisioneNonRiuscita:
      'Non siamo riusciti ad aprire la condivisione: copia il link qui sopra e mandaglielo tu.',
  },
  home: {
    titoloCoppia: 'Siete una coppia',
    testoCoppia:
      'Il vostro spazio è pronto. Da qui in poi arriveranno il calendario, la mappa dei vostri posti, le foto e molto altro.',
    titoloSolo: 'Il tuo spazio è pronto',
    testoSolo:
      'Puoi già guardarti intorno. Quando vuoi, invita il tuo partner: le cose che si fanno in due si sbloccano appena vi unite.',
    titoloSenzaSpazio: 'Per ora ci sei tu',
    testoSenzaSpazio:
      'Guardati intorno con calma. Lo spazio nasce quando inviti il tuo partner, oppure quando apri l’invito che ti ha mandato lui.',
    hoUnInvito: 'Ho ricevuto un invito',
    titoloErrore: 'Non riusciamo a leggere il tuo stato',
    testoErrore:
      'Può essere la connessione. Riprova fra un attimo: non abbiamo cambiato nulla di tuo.',
    riprova: 'Riprova',
    invitaPartner: 'Invita il tuo partner',
    esci: 'Esci',
  },
  coppia: {
    servePartner: 'Invita il tuo partner per continuare',
    servePartnerNota: 'Questa parte si fa in due: appena il tuo partner entra, si apre.',
    invita: 'Invita',
    erroreSpazio: 'Non siamo riusciti a creare il vostro spazio. Riprova.',
  },
  tab: {
    spazio: 'Noi',
    calendario: 'Calendario',
    giochi: 'Giochi',
    mappa: 'Mappa',
    /**
     * ⚠️ Si chiamava «Preferiti», e il nome era **sbagliato**: la sezione non
     * contiene un sottoinsieme scelto, contiene *tutto* — ogni film segnato e
     * ogni posto in cui siete stati o volete andare, compresi quelli che ci
     * finiscono da soli attaccandoli a un evento. Chiamare "preferito" cio' che
     * entra in automatico promette una selezione che non c'e'.
     *
     * «Liste» dice quello che e': due elenchi, Film e Luoghi, ciascuno con il
     * suo "da fare / fatto".
     */
    preferiti: 'Liste',
    galleria: 'Galleria',
  },
  riepilogo: {
    prossimo: 'Prossimo in calendario',
    nienteInVista: 'Niente in vista',
    posti: 'Posti visitati',
    postiNota: 'segnati sulla mappa',
    ultimoFilm: 'Ultimo film',
    nessunFilm: 'Ancora nessuno',
    ultimaPartita: 'Ultima partita',
    nessunaPartita: 'Mai giocato',
    galleria: 'Un ricordo',
    unRicordo: 'Guarda',
    nessunaFoto: 'Nessuna foto',
  },
  giochi: {
    quiz_preferenze: 'Quiz sulle preferenze',
    obbligo_verita: 'Obbligo o verità',
    telepatia: 'Telepatia',
    indovina_disegno: 'Indovina il disegno',
  } as Record<string, string>,
  gioco: {
    preparo: 'Preparo la partita…',
    pronti: 'Quando siete pronti tutti e due, la partita comincia da sola.',
    avvia: 'Avvia partita',
    annulla: 'Annulla la partita',
    indietro: 'Torna indietro',
    attendoAltro: 'Sei pronto. Aspettiamo che prema anche il tuo partner.',
    round: (n: number, tot: number): string => `Round ${n} di ${tot}`,
    disegnaTu: 'Disegna tu',
    indovinaTu: 'Indovina tu',
    tuaParola: 'La tua parola',
    cosaE: 'Cosa sarà?',
    pulisci: 'Ricomincia il disegno',
    nessunTentativo: 'Nessun tentativo, per ora.',
    scriviQualcosa: 'Scrivi cosa vedi: puoi provare quante volte vuoi.',
    indovinato: 'Indovinato!',
    tempoScaduto: 'Tempo scaduto',
    eraParola: (p: string): string => `Era: ${p}`,
    // --- telepatia ---
    sceglieteInsieme: 'Scegliete, senza dirvelo.',
    haiScelto: 'Hai scelto. Aspettiamo il tuo partner.',
    sceltaNonInviata: 'La scelta non è arrivata. Premi di nuovo.',
    coincidete: 'La stessa!',
    diverso: 'Stavolta no',
    haSceltoLui: (p: string): string => `Lui ha scelto: ${p}`,
    // --- fine partita ---
    suTotale: (tot: number): string => `su ${tot}`,
    finito: 'Va bene così',
    /** I due punteggi. Nomi scelti il 2026-08-28: descrivono voi due insieme. */
    intesa: 'Intesa',
    sintonia: 'Sintonia',
    /**
     * ⚠️ Nessuna di queste frasi dice «hai perso», e non è delicatezza: il
     * punteggio è **della coppia** (P-03), quindi non c'è nessuno che ha perso
     * contro nessuno. Una frase che suonasse come una pagella sarebbe l'app che
     * emette un verdetto sulla relazione — esattamente ciò che P-03 vieta.
     */
    commento: (p: number, tot: number): string => {
      if (tot === 0) return '';
      const q = p / tot;
      if (q >= 0.8) return 'Vi capite al volo.';
      if (q >= 0.5) return 'Ci siete quasi sempre.';
      if (q > 0) return 'Qualcosa è passato. Il resto si allena.';
      return 'Stavolta niente. È un gioco: si rigioca.';
    },
  },
  hubGiochi: {
    titolo: 'I vostri giochi',
    sottotitolo: 'Scorri per sceglierne uno.',
    classifica: 'Classifica',
    gioca: 'Gioca',
    descrizioni: {
      quiz_preferenze:
        'Quanto vi conoscete davvero. Ognuno deposita le proprie risposte, poi si prova a indovinare quelle dell’altro.',
      obbligo_verita:
        'A turno si sceglie, e si può passare. Il banco resta leggero: niente prove fisiche, niente domande sugli ex.',
      telepatia:
        'Le stesse opzioni a tutti e due, nello stesso momento. Si vince quando pensate la stessa cosa.',
      indovina_disegno:
        'Uno disegna, l’altro prova a capire cosa sia. Non serve saper disegnare: di solito è meglio se non sapete.',
    } as Record<string, string>,
    modoTitolo: 'Come volete giocare?',
    ufficiale: 'Versione ufficiale',
    ufficialeNota: 'Le nostre domande, uguali per tutte le coppie.',
    personalizzata: 'Personalizzata',
    personalizzataNota:
      'Le domande le scrivete voi due. Restano vostre: non finiscono nel banco comune e non le vede nessun altro.',
    classificaTitolo: 'Chi ha vinto di più',
    notaSintonia: 'Volte in cui avete scelto la stessa cosa.',
    notaIntesa: 'Disegni che l’altro ha indovinato.',
    classificaVuota:
      'Non avete ancora giocato. Qui comparirà chi ha vinto più partite, gioco per gioco.',
    /** Onesta' verso chi tocca: la stessa regola della sezione in arrivo. */
    inArrivo: 'Le partite arrivano: manca il meccanismo di invio sigillato.',
    chiudi: 'Chiudi',
  },
  mappa: {
    /** L'interruttore fra la mappa e l'elenco dei luoghi. */
    viste: { mappa: 'Mappa', elenco: 'Elenco' },
    visitato: 'ci siete stati',
    daVisitare: 'da visitare',
    segnaVisitato: 'Ci siamo stati',
    segnaDaVisitare: 'Rimettilo fra i desideri',
    nessunEvento: 'Nessun evento legato a questo posto, per ora.',
    /** Il “…” dell'anteprima: apre le azioni sul posto. */
    azioniPosto: 'Azioni sul posto',
    aggiungiPosto: 'Aggiungi un posto',
    cerca: 'Cerca un posto…',
    cercaNota: 'La ricerca manda solo quello che scrivi, mai dove sei.',
    mancaChiave: 'Manca la chiave Google: EXPO_PUBLIC_GOOGLE_PLACES_KEY nel .env.',
    scriviAncora: 'Scrivi almeno tre lettere.',
    cercando: 'Cerco…',
    nessunRisultato: 'Nessun posto trovato con questo nome.',
    nessunEventoRistorante: 'Nessuna serata legata a questo ristorante, per ora.',
    soloTelefono: 'La mappa vera si vede sul telefono. Qui resta l’elenco.',
    senzaComponente:
      'Su questa versione dell’app la mappa non si disegna: restano l’elenco dei posti e i loro eventi.',
  },
  galleria: {
    tetto: '1 GB per voi due',
    vuotoTitolo: 'Nessuna foto, per ora',
    vuotoTesto: 'Le foto che aggiungi le vedete in due, e ciascuno cancella le proprie.',
    permessoNegato: 'Senza accesso alle foto non possiamo aggiungerne.',
    soloTelefono: 'Le foto si aggiungono dal telefono',
    foto: 'Foto',
    cartelle: 'Cartelle',
    nuovaCartella: 'Nuova cartella',
    nomeCartella: 'Come la chiamiamo?',
    crea: 'Crea',
    annulla: 'Annulla',
    cartellaVuota: 'Ancora vuota',
    nessunaCartella: 'Nessuna cartella',
    nessunaCartellaTesto:
      'Le cartelle servono a rimettere in ordine insieme: un viaggio, un’estate, una casa.',
    nFoto: (n: number): string => (n === 1 ? '1 foto' : `${n} foto`),
    tolteDaCartella: 'Le foto restano: tornano solo senza cartella.',
    eliminaCartella: 'Elimina cartella',
    spostaIn: 'Sposta in…',
    senzaCartella: 'Senza cartella',
    chiudi: 'Chiudi',
    elimina: 'Elimina',
    tutte: 'Tutte',
  },
  evento: {
    sparito: 'Questo evento non c’è più.',
    dove: 'Dove',
    nessunLuogo: 'Nessun posto segnato per questo evento.',
    foto: 'Foto',
    dettagli: 'Dettagli',
    togliDallEvento: 'Togli dall’evento',
    confermaTogli: 'La foto resta nella galleria: viene solo staccata da questo evento.',
    eliminaFoto: 'Elimina foto',
    confermaEliminaFoto: 'La foto viene eliminata davvero, anche dalla galleria. Non si recupera.',
    /** Il conto sulle miniature che non entrano nella striscia. */
    altreFoto: (n: number): string => `+${n}`,
    fotoInArrivo: 'Ancora nessuna foto di questo momento.',
    aggiungiFoto: 'Aggiungi foto',
    aggiungiDescrizione: 'Aggiungi descrizione',
    cambiaData: 'Cambia data',
    cambiaLuogo: 'Cambia luogo',
    cambiaTipo: 'Cambia tag',
    commenti: 'Commenti',
    /**
     * ⚠️ Il vuoto dice **chi puo' scrivere**, e lo dice solo quando non c'e'
     * ancora niente: e' l'unico momento in cui l'informazione serve. Una riga
     * fissa che spiega una funzione e' un'istruzione permanente addosso alla
     * schermata — la stessa cosa tolta dalla mappa poche ore prima (D-52).
     */
    nessunCommento: 'Ancora niente. Potete scrivere tutti e due, quando volete.',
    scrivi: 'Scrivi un commento…',
    invia: 'Invia',
    confermaElimina: 'Eliminarlo davvero? Sparisce per entrambi, con i suoi commenti.',
    soloAutore: 'Solo chi l’ha creato può modificarlo o eliminarlo.',
    nFoto: (n: number): string => (n === 1 ? '1 foto' : `${n} foto`),
  },
  sezioni: {
    giochiTitolo: 'I giochi arrivano',
    giochiTesto:
      'Quiz sulle preferenze, obbligo o verità, telepatia. Sono l’unica cosa che da soli non si può fare: serve che siate in due davvero.',
    giochiManca: 'manca il meccanismo di invio sigillato',
    mappaTitolo: 'La mappa dei vostri posti',
    mappaTesto:
      'I luoghi li segnate voi, uno per uno: questa app non vi segue e non vi localizza, mai.',
    mappaManca: 'manca il componente mappa',
    galleriaTitolo: 'La galleria condivisa',
    galleriaTesto:
      'Le foto che caricate restano vostre: ciascuno può cancellare le proprie, e c’è un tetto di 1 GB già imposto dal database.',
    galleriaManca: 'manca lo spazio di archiviazione',
  },
  preferiti: {
    tipi: { film: 'Film', luogo: 'Luoghi' },
    aggiungiCopertina: 'Aggiungi una copertina',
    cambiaCopertina: 'Cambia copertina',
    aggiungiPosto: 'Aggiungi il posto',
    cercaRistorante: 'Cerca un posto',
    daFare: 'Da fare',
    /** La riga che apre l'elenco delle serate di un luogo. */
    serateQui: (n: number): string => (n === 1 ? 'Una serata qui' : `${n} serate qui`),
    fatti: 'Già fatti',
    fatto: 'fatto',
    recensisci: 'Scrivi la tua recensione',
    tua: 'la tua',
    delPartner: 'del partner',
    placeholderRecensione: 'Com’è andata?',
    placeholder: {
      film: 'Un film da vedere…',
      luogo: 'Un posto dove andare…',
      voce: 'Una cosa da fare…',
    },
    vuoto: {
      film: 'Nessun film in lista, per ora.',
      luogo: 'Nessun posto in lista, per ora.',
      voce: 'Lista vuota. Scrivi qui sotto la prima cosa.',
    },
  },
  /**
   * L'hub delle **liste dei desideri** (0022).
   *
   * ⚠️ Le chiavi di `preferiti` restano dove sono: quel blocco descrive le
   * **voci** di una lista, questo descrive le **liste**. Sono due livelli
   * diversi dello stesso schermo, e fonderli avrebbe prodotto un blocco in cui
   * metà delle chiavi non c'entra con l'altra metà.
   */
  /**
   * La ricerca dei film (0023).
   *
   * ⚠️ Le frasi degli stati «vuoti» esistono per la stessa ragione di quelle
   * della ricerca luoghi: un campo che non risponde si legge come rotto, non
   * come «non ho ancora niente da dirti» (B-18).
   */
  film: {
    cerca: 'Cerca un film…',
    scriviAncora: 'Scrivi ancora un paio di lettere.',
    cercando: 'Sto cercando…',
    nessunRisultato: 'Nessun film con questo titolo.',
    senzaChiave: 'La ricerca dei film non è configurata.',
    senzaChiaveNota:
      'Manca EXPO_PUBLIC_TMDB_KEY nel .env. Puoi comunque scrivere il titolo a mano dalle altre liste.',
  },
  liste: {
    titolo: 'Liste',
    sottotitolo: 'Le cose che volete fare, in un posto solo.',
    voce: 'voce',
    vociPlurale: 'voci',
    vuota: 'Ancora vuota. Apri e aggiungi la prima cosa.',
    avanzamento: (fatte: number, totali: number): string =>
      fatte === 0
        ? `${totali} da fare`
        : fatte === totali
          ? 'Fatto tutto — bravi'
          : `${fatte} su ${totali} — ci siete quasi`,
    nuovaCarta: 'Una lista nuova',
    nuovaCartaNota: 'Un viaggio, dei regali, i film di questo inverno.',
    crea: 'Crea una lista',
    creaTitolo: 'Come la chiamate?',
    creaNota: 'Il nome lo vedete in due. Si può cambiare quando volete.',
    creaPlaceholder: 'Viaggi 2027',
    creaConferma: 'Crea',
    apri: 'Apri',
    elimina: 'Elimina',
    /** La conferma: dice **cosa** si porta via, non solo che è definitiva. */
    eliminaTitolo: (nome: string) => `Eliminare «${nome}»?`,
    eliminaNota: (voci: number): string =>
      voci === 0
        ? 'La lista è vuota: non si perde niente.'
        : voci === 1
          ? 'Dentro c\u2019è una voce, e sparisce con la lista. Anche se l\u2019ha messa il tuo partner.'
          : `Dentro ci sono ${voci} voci, e spariscono con la lista. Anche quelle messe dal tuo partner.`,
    eliminaConferma: 'Elimina',
    annulla: 'Annulla',
    /**
     * L'errore che nasce da un **permesso**, non da un guasto. La policy di
     * `delete` è solo-autore: senza questa frase l'app direbbe «fatto» e la
     * lista resterebbe lì, che è esattamente B-23.
     */
    soloAutore: 'Questa lista l\u2019ha creata il tuo partner: solo chi la crea può eliminarla.',
    nessuna: 'Nessuna lista, per ora.',
    nessunaNota: 'Scorri fino alla carta col «+» per crearne una.',
    nomeVuoto: 'Serve un nome.',
    predefinitaNota: 'Le liste di partenza non si eliminano.',
  },
  importa: {
    titolo: 'Importa',
    apri: 'Importa dal telefono',
    avviso:
      'Quello che importi lo vedrà anche il tuo partner, come ogni cosa in questo calendario. Spunta solo ciò che volete condividere.',
    ricorrente: 'ogni anno',
    tutti: 'Tutti',
    nessuno: 'Nessuno',
    niente: 'Non c’è niente di nuovo da importare.',
    soloTelefono: 'L’importazione funziona solo sul telefono.',
    negatoTitolo: 'Serve il permesso',
    negatoTesto:
      'Senza accesso al calendario non possiamo mostrarti cosa importare. Puoi darlo dalle impostazioni del telefono, quando vuoi.',
    importa: (n: number): string => (n === 0 ? 'Scegli cosa importare' : `Importa ${n}`),
    importati: (n: number): string =>
      n === 1 ? 'Importato 1 evento.' : `Importati ${n} eventi.`,
  },
  insieme: {
    etichetta: 'Insieme da',
    // Il tipo di ritorno va dichiarato: senza, TypeScript lo restringe ai due
    // literal italiani e l'inglese non ci entra piu'.
    giorni: (n: number): string => (n === 1 ? 'giorno' : 'giorni'),
    dal: (data: string) => `dal ${data}`,
    chiediTitolo: 'Da quando state insieme?',
    chiediTesto:
      'Scegliete il giorno da cui contare. Lo segniamo sul calendario e da lì partono i vostri giorni insieme.',
    salva: 'Salva la data',
    eventoTitolo: 'Il nostro inizio',
    futuro: 'La data non può essere nel futuro.',
    dataNonValida: 'Data non valida: usa il formato 2020-06-14.',
  },
  calendario: {
    titolo: 'Calendario',
    viste: { giorni: 'Giorni', mese: 'Mese', anno: 'Anno', diario: 'Diario' },
    /** Il titolo della vista diario. Riprende la promessa fatta in benvenuto. */
    tuttiGliEventi: 'Il vostro diario',
    /** Le foto scelte nel form, prima di salvare. */
    fotoScelte: (n: number): string => (n === 1 ? '1 foto scelta' : `${n} foto scelte`),
    caricamentoFoto: (f: number, tot: number): string => `Carico le foto… ${f} di ${tot}`,
    /** L'avanzo in una cella del mese quando le pillole non ci stanno tutte. */
    altri: (n: number): string => `+${n}`,
    /** L'agenda del giorno: la fascia in cima, per cio' che non ha un'ora. */
    senzaOrario: 'Tutto il giorno',
    agendaVuota: 'Nessun impegno in questo giorno',
    adesso: 'Adesso',
    conto: {
      oggi: 'oggi',
      domani: 'domani',
      ieri: 'ieri',
      fra: (n: number): string => `fra ${n} giorni`,
      fa: (n: number): string => `${n} giorni fa`,
    },
    nessunImpegno: 'niente in programma',
    unImpegno: '1 cosa',
    impegni: (n: number): string => `${n} cose`,
    tipi: { impegno: 'Impegno', romantico: 'Romantico', vacanza: 'Vacanza' },
    quando: 'Quando',
    andata: 'Partenza',
    ritorno: 'Ritorno',
    ritornoPrima: 'Il ritorno non può venire prima della partenza.',
    chiudi: 'Chiudi',
    modifica: 'Modifica',
    nessunPosto: 'Nessun posto',
    postoAggiunto: (nome: string) => `«${nome}» è ora fra i vostri posti: scegliilo qui sotto.`,
    /** Il posto scelto era un ristorante: e' entrato da solo nei preferiti. */
    ristoranteAggiunto: (nome: string): string => `«${nome}» è entrato anche fra i vostri luoghi.`,
    ristorante: 'Ristorante',
    nessunRistorante: 'Nessuno',
    aggiungi: 'Aggiungi',
    nuovo: 'Nuovo appuntamento',
    placeholderTitolo: 'Cosa? Cena, viaggio, compleanno…',
    placeholderNota: 'Una nota, se serve',
    tuttoIlGiorno: 'Tutto il giorno',
    salva: 'Salva',
    annulla: 'Annulla',
    elimina: 'Elimina',
    daTe: 'l’hai messo tu',
    dalPartner: 'l’ha messo il tuo partner',
    inArrivo: 'In arrivo',
    passati: 'Già passati',
    vuotoTitolo: 'Ancora niente in programma',
    vuotoTesto:
      'Il primo appuntamento che segnate resta qui. Anche solo per ricordarvi di guardare un film insieme.',
    dataNonValida: 'Data non valida: usa il formato 2026-09-01 20:00.',
  },
};

// Senza `as const`: il tipo cattura le CHIAVI (una dimenticata non compila) ma
// lascia liberi i valori, che nell'altra lingua sono per forza diversi.
type Dizionario = typeof it;

const en: Dizionario = {
  benvenuto: {
    sottotitolo:
      'Your shared diary. A place just for the two of you, to keep what you live together.',
    inizia: 'Get started',
    nota: 'All you need is your email and your partner.',
  },
  accedi: {
    titolo: 'Sign in',
    sottotitolo: 'We’ll email you a code. No password to remember.',
    placeholderEmail: 'your@email.com',
    invio: 'Sending…',
    mandaCodice: 'Send me the code',
    titoloCodice: 'The code',
    sottotitoloCodice: (email: string) => `We sent it to ${email}. Check your inbox.`,
    placeholderCodice: 'Enter the code',
    verifico: 'Checking…',
    entra: 'Sign in',
    cambiaEmail: 'Change email',
  },
  onboarding: {
    titolo: 'You’re two',
    sottotitolo: 'Create your space and invite your partner, or join if you received an invite.',
    crea: 'Create our space',
    unisciti: 'I received an invite',
    entraEDecidoDopo: 'Go in, decide later',
    attesa: 'One moment…',
    titoloInvita: 'Invite your partner',
    sottotitoloInvita: 'Send them the link. You can also go in now and invite them later.',
    condividi: 'Share the link',
    piuTardi: 'Invite later',
    apertoInvito: 'Your partner opened the invite.',
    conferma: 'Confirm: you’re a couple',
    unisco: 'Joining…',
    inAttesaApertura: 'Waiting for them to open the link…',
    titoloUnisci: 'You have an invite',
    sottotitoloUnisci: 'Paste the link your partner sent you.',
    placeholderIncolla: 'Paste the link here',
    apri: 'Open the invite',
    apro: 'Opening…',
    indietro: 'Back',
    titoloAttesaConferma: 'Almost there',
    testoAttesaConferma:
      'You opened the invite. Wait for your partner to confirm from their phone: as soon as they do, you’re in together.',
    messaggioCondivisione: (link: string) =>
      `Let’s join on LifeCouple, our shared diary. Open this link: ${link}`,
    condivisioneNonRiuscita:
      'We couldn’t open the share sheet: copy the link above and send it yourself.',
  },
  home: {
    titoloCoppia: 'You’re a couple',
    testoCoppia:
      'Your space is ready. From here on come the calendar, the map of your places, the photos and much more.',
    titoloSolo: 'Your space is ready',
    testoSolo:
      'Have a look around. Whenever you like, invite your partner: the things you do together unlock as soon as you join up.',
    titoloSenzaSpazio: 'For now it’s just you',
    testoSenzaSpazio:
      'Take your time looking around. Your space is born when you invite your partner, or when you open the invite they sent you.',
    hoUnInvito: 'I received an invite',
    titoloErrore: 'We can’t read your status',
    testoErrore: 'It may be the connection. Try again in a moment: nothing of yours has changed.',
    riprova: 'Try again',
    invitaPartner: 'Invite your partner',
    esci: 'Sign out',
  },
  coppia: {
    servePartner: 'Invite your partner to continue',
    servePartnerNota: 'This part takes two: it opens as soon as your partner joins.',
    invita: 'Invite',
    erroreSpazio: 'We couldn’t create your space. Please try again.',
  },
  tab: {
    spazio: 'Us',
    calendario: 'Calendar',
    giochi: 'Games',
    mappa: 'Map',
    preferiti: 'Lists',
    galleria: 'Gallery',
  },
  riepilogo: {
    prossimo: 'Next up',
    nienteInVista: 'Nothing ahead',
    posti: 'Places visited',
    postiNota: 'pinned on the map',
    ultimoFilm: 'Last film',
    nessunFilm: 'None yet',
    ultimaPartita: 'Last game',
    nessunaPartita: 'Never played',
    galleria: 'A memory',
    unRicordo: 'Take a look',
    nessunaFoto: 'No photos',
  },
  giochi: {
    quiz_preferenze: 'Preferences quiz',
    obbligo_verita: 'Truth or dare',
    telepatia: 'Telepathy',
    indovina_disegno: 'Guess the drawing',
  } as Record<string, string>,
  gioco: {
    preparo: 'Setting up the game…',
    pronti: 'Once you have both tapped, the game starts on its own.',
    avvia: 'Start game',
    annulla: 'Cancel the game',
    indietro: 'Go back',
    attendoAltro: 'You are ready. Waiting for your partner to tap too.',
    round: (n: number, tot: number): string => `Round ${n} of ${tot}`,
    disegnaTu: 'You draw',
    indovinaTu: 'You guess',
    tuaParola: 'Your word',
    cosaE: 'What could it be?',
    pulisci: 'Start the drawing over',
    nessunTentativo: 'No guesses yet.',
    scriviQualcosa: 'Type what you see: guess as many times as you like.',
    indovinato: 'Got it!',
    tempoScaduto: 'Time is up',
    eraParola: (p: string): string => `It was: ${p}`,
    sceglieteInsieme: 'Pick one, without telling each other.',
    haiScelto: 'You picked. Waiting for your partner.',
    sceltaNonInviata: 'Your pick did not go through. Tap again.',
    coincidete: 'Same one!',
    diverso: 'Not this time',
    haSceltoLui: (p: string): string => `They picked: ${p}`,
    suTotale: (tot: number): string => `out of ${tot}`,
    finito: 'That will do',
    intesa: 'Rapport',
    sintonia: 'In sync',
    commento: (p: number, tot: number): string => {
      if (tot === 0) return '';
      const q = p / tot;
      if (q >= 0.8) return 'You read each other instantly.';
      if (q >= 0.5) return 'You get there most of the time.';
      if (q > 0) return 'Something got through. The rest is practice.';
      return 'Nothing this time. It is a game: play again.';
    },
  },
  hubGiochi: {
    titolo: 'Your games',
    sottotitolo: 'Swipe to pick one.',
    classifica: 'Standings',
    gioca: 'Play',
    descrizioni: {
      quiz_preferenze:
        'How well you actually know each other. You each store your own answers, then try to guess the other’s.',
      obbligo_verita:
        'You take turns choosing, and you can pass. The deck stays light: no physical dares, nothing about exes.',
      telepatia:
        'The same options for both of you, at the same time. You win when you think alike.',
      indovina_disegno:
        'One of you draws, the other tries to work out what it is. No drawing skills needed — it is usually better without.',
    } as Record<string, string>,
    modoTitolo: 'How do you want to play?',
    ufficiale: 'Official version',
    ufficialeNota: 'Our questions, the same for every couple.',
    personalizzata: 'Your own',
    personalizzataNota:
      'You two write the questions. They stay yours: they never join the shared deck and nobody else sees them.',
    classificaTitolo: 'Who has won the most',
    notaSintonia: 'Times you picked the same thing.',
    notaIntesa: 'Drawings your partner guessed.',
    classificaVuota:
      'You haven’t played yet. This is where the win count will show up, game by game.',
    inArrivo: 'Matches are coming: the sealed-submission mechanism is missing.',
    chiudi: 'Close',
  },
  mappa: {
    viste: { mappa: 'Map', elenco: 'List' },
    visitato: 'you’ve been here',
    daVisitare: 'still to visit',
    segnaVisitato: 'We’ve been here',
    segnaDaVisitare: 'Back to the wish list',
    nessunEvento: 'Nothing tied to this place yet.',
    azioniPosto: 'Place actions',
    aggiungiPosto: 'Add a place',
    cerca: 'Search for a place…',
    cercaNota: 'The search only sends what you type, never where you are.',
    mancaChiave: 'Google key missing: EXPO_PUBLIC_GOOGLE_PLACES_KEY in .env.',
    scriviAncora: 'Type at least three letters.',
    cercando: 'Searching…',
    nessunRisultato: 'No place found with that name.',
    nessunEventoRistorante: 'No evening tied to this restaurant yet.',
    soloTelefono: 'The real map shows on the phone. Here you get the list.',
    senzaComponente:
      'This build can’t draw the map: you still get the list of places and their events.',
  },
  galleria: {
    tetto: '1 GB for the two of you',
    vuotoTitolo: 'No photos yet',
    vuotoTesto: 'The photos you add are seen by both of you, and each deletes their own.',
    permessoNegato: 'Without photo access we can’t add any.',
    soloTelefono: 'Photos are added from the phone',
    foto: 'Photos',
    cartelle: 'Albums',
    nuovaCartella: 'New album',
    nomeCartella: 'What shall we call it?',
    crea: 'Create',
    annulla: 'Cancel',
    cartellaVuota: 'Still empty',
    nessunaCartella: 'No albums',
    nessunaCartellaTesto:
      'Albums are for putting things back in order together: a trip, a summer, a home.',
    nFoto: (n: number): string => (n === 1 ? '1 photo' : `${n} photos`),
    tolteDaCartella: 'The photos stay: they just go back to having no album.',
    eliminaCartella: 'Delete album',
    spostaIn: 'Move to…',
    senzaCartella: 'No album',
    chiudi: 'Close',
    elimina: 'Delete',
    tutte: 'All',
  },
  evento: {
    sparito: 'This event is gone.',
    dove: 'Where',
    nessunLuogo: 'No place pinned for this event.',
    foto: 'Photos',
    dettagli: 'Details',
    togliDallEvento: 'Remove from event',
    confermaTogli: 'The photo stays in the gallery: it is only detached from this event.',
    eliminaFoto: 'Delete photo',
    confermaEliminaFoto: 'The photo is deleted for good, from the gallery too. There is no undo.',
    altreFoto: (n: number): string => `+${n}`,
    fotoInArrivo: 'No photos of this moment yet.',
    aggiungiFoto: 'Add photos',
    aggiungiDescrizione: 'Add a note',
    cambiaData: 'Change date',
    cambiaLuogo: 'Change place',
    cambiaTipo: 'Change tag',
    commenti: 'Comments',
    nessunCommento: 'Nothing yet. You can both write, whenever you like.',
    scrivi: 'Write a comment…',
    invia: 'Send',
    confermaElimina: 'Really delete it? It disappears for both of you, with its comments.',
    soloAutore: 'Only the person who created it can change or delete it.',
    nFoto: (n: number): string => (n === 1 ? '1 photo' : `${n} photos`),
  },
  sezioni: {
    giochiTitolo: 'Games are coming',
    giochiTesto:
      'Preferences quiz, truth or dare, telepathy. They’re the one thing you can’t do alone: it takes both of you.',
    giochiManca: 'the sealed-submission mechanism is missing',
    mappaTitolo: 'The map of your places',
    mappaTesto:
      'You pin the places yourself, one by one: this app never follows you and never tracks you.',
    mappaManca: 'the map component is missing',
    galleriaTitolo: 'Your shared gallery',
    galleriaTesto:
      'The photos you upload stay yours: each of you can delete their own, and there’s a 1 GB cap already enforced by the database.',
    galleriaManca: 'storage is missing',
  },
  preferiti: {
    tipi: { film: 'Films', luogo: 'Places' },
    aggiungiCopertina: 'Add a cover',
    cambiaCopertina: 'Change cover',
    aggiungiPosto: 'Add the place',
    cercaRistorante: 'Find a place',
    daFare: 'To do',
    serateQui: (n: number): string => (n === 1 ? 'One evening here' : `${n} evenings here`),
    fatti: 'Done',
    fatto: 'done',
    recensisci: 'Write your review',
    tua: 'yours',
    delPartner: 'your partner’s',
    placeholderRecensione: 'How was it?',
    placeholder: {
      film: 'A film to watch…',
      luogo: 'A place to try…',
      voce: 'Something to do…',
    },
    vuoto: {
      film: 'No films on the list yet.',
      luogo: 'No places on the list yet.',
      voce: 'Empty list. Write the first thing below.',
    },
  },
  film: {
    cerca: 'Search for a film…',
    scriviAncora: 'Type a couple more letters.',
    cercando: 'Searching…',
    nessunRisultato: 'No film with that title.',
    senzaChiave: 'Film search is not configured.',
    senzaChiaveNota:
      'EXPO_PUBLIC_TMDB_KEY is missing from .env. You can still type titles by hand in other lists.',
  },
  liste: {
    titolo: 'Lists',
    sottotitolo: 'The things you want to do, in one place.',
    voce: 'item',
    vociPlurale: 'items',
    vuota: 'Still empty. Open it and add the first thing.',
    avanzamento: (fatte: number, totali: number): string =>
      fatte === 0
        ? `${totali} to do`
        : fatte === totali
          ? 'All done — nice'
          : `${fatte} of ${totali} — almost there`,
    nuovaCarta: 'A new list',
    nuovaCartaNota: 'A trip, some gifts, this winter\u2019s films.',
    crea: 'Create a list',
    creaTitolo: 'What do you call it?',
    creaNota: 'You both see the name. You can change it whenever you like.',
    creaPlaceholder: 'Trips 2027',
    creaConferma: 'Create',
    apri: 'Open',
    elimina: 'Delete',
    eliminaTitolo: (nome: string) => `Delete \u201c${nome}\u201d?`,
    eliminaNota: (voci: number): string =>
      voci === 0
        ? 'The list is empty: nothing is lost.'
        : voci === 1
          ? 'There is one item in it, and it goes with the list. Even if your partner added it.'
          : `There are ${voci} items in it, and they go with the list. Including the ones your partner added.`,
    eliminaConferma: 'Delete',
    annulla: 'Cancel',
    soloAutore: 'Your partner created this list: only whoever creates it can delete it.',
    nessuna: 'No lists yet.',
    nessunaNota: 'Swipe to the \u201c+\u201d card to create one.',
    nomeVuoto: 'It needs a name.',
    predefinitaNota: 'The starting lists cannot be deleted.',
  },
  importa: {
    titolo: 'Import',
    apri: 'Import from your phone',
    avviso:
      'Whatever you import, your partner sees too — like everything in this calendar. Only tick what you want to share.',
    ricorrente: 'every year',
    tutti: 'All',
    nessuno: 'None',
    niente: 'Nothing new to import.',
    soloTelefono: 'Importing only works on the phone.',
    negatoTitolo: 'We need permission',
    negatoTesto:
      'Without access to your calendar we can’t show you what to import. You can grant it from your phone settings whenever you like.',
    importa: (n: number): string => (n === 0 ? 'Pick what to import' : `Import ${n}`),
    importati: (n: number): string => (n === 1 ? 'Imported 1 event.' : `Imported ${n} events.`),
  },
  insieme: {
    etichetta: 'Together for',
    giorni: (n: number) => (n === 1 ? 'day' : 'days'),
    dal: (data: string) => `since ${data}`,
    chiediTitolo: 'When did you two start?',
    chiediTesto:
      'Pick the day to count from. We mark it on the calendar, and your days together start there.',
    salva: 'Save the date',
    eventoTitolo: 'Where we began',
    futuro: 'The date can’t be in the future.',
    dataNonValida: 'Invalid date: use the format 2020-06-14.',
  },
  calendario: {
    titolo: 'Calendar',
    viste: { giorni: 'Days', mese: 'Month', anno: 'Year', diario: 'Diary' },
    tuttiGliEventi: 'Your diary',
    fotoScelte: (n: number): string => (n === 1 ? '1 photo selected' : `${n} photos selected`),
    caricamentoFoto: (f: number, tot: number): string => `Uploading… ${f} of ${tot}`,
    altri: (n: number): string => `+${n}`,
    senzaOrario: 'All day',
    agendaVuota: 'Nothing planned this day',
    adesso: 'Now',
    conto: {
      oggi: 'today',
      domani: 'tomorrow',
      ieri: 'yesterday',
      fra: (n: number): string => `in ${n} days`,
      fa: (n: number): string => `${n} days ago`,
    },
    nessunImpegno: 'nothing planned',
    unImpegno: '1 thing',
    impegni: (n: number): string => `${n} things`,
    tipi: { impegno: 'Plan', romantico: 'Romantic', vacanza: 'Holiday' },
    quando: 'When',
    andata: 'Leaving',
    ritorno: 'Back',
    ritornoPrima: 'The return can’t come before the departure.',
    chiudi: 'Close',
    modifica: 'Edit',
    nessunPosto: 'No place',
    postoAggiunto: (nome: string) => `“${nome}” is now one of your places: pick it below.`,
    ristoranteAggiunto: (n: string): string => `${n} added to your places`,
    ristorante: 'Restaurant',
    nessunRistorante: 'None',
    aggiungi: 'Add',
    nuovo: 'New plan',
    placeholderTitolo: 'What? Dinner, trip, birthday…',
    placeholderNota: 'A note, if you need one',
    tuttoIlGiorno: 'All day',
    salva: 'Save',
    annulla: 'Cancel',
    elimina: 'Delete',
    daTe: 'you added it',
    dalPartner: 'your partner added it',
    inArrivo: 'Coming up',
    passati: 'Already past',
    vuotoTitolo: 'Nothing planned yet',
    vuotoTesto:
      'The first plan you save shows up here. Even just a reminder to watch a film together.',
    dataNonValida: 'Invalid date: use the format 2026-09-01 20:00.',
  },
};

/** Codice della lingua attiva, deciso dal dispositivo. */
export const lingua: 'it' | 'en' = getLocales()[0]?.languageCode === 'it' ? 'it' : 'en';

/** Stringhe della lingua attiva. */
export const t: Dizionario = lingua === 'it' ? it : en;
