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
    attesa: 'Un attimo…',
    titoloInvita: 'Invita il partner',
    sottotitoloInvita: 'Mandagli il link. Puoi anche entrare subito e invitarlo con calma.',
    condividi: 'Condividi il link',
    piuTardi: 'Lo invito dopo',
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
  },
  home: {
    titoloCoppia: 'Siete una coppia',
    testoCoppia:
      'Il vostro spazio è pronto. Da qui in poi arriveranno il calendario, la mappa dei vostri posti, le foto e molto altro.',
    titoloSolo: 'Il tuo spazio è pronto',
    testoSolo:
      'Puoi già guardarti intorno. Quando vuoi, invita il tuo partner: le cose che si fanno in due si sbloccano appena vi unite.',
    invitaPartner: 'Invita il tuo partner',
    esci: 'Esci',
  },
  coppia: {
    servePartner: 'Invita il tuo partner per continuare',
    servePartnerNota: 'Questa parte si fa in due: appena il tuo partner entra, si apre.',
    invita: 'Invita',
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
    attesa: 'One moment…',
    titoloInvita: 'Invite your partner',
    sottotitoloInvita: 'Send them the link. You can also go in now and invite them later.',
    condividi: 'Share the link',
    piuTardi: 'I’ll invite them later',
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
  },
  home: {
    titoloCoppia: 'You’re a couple',
    testoCoppia:
      'Your space is ready. From here on come the calendar, the map of your places, the photos and much more.',
    titoloSolo: 'Your space is ready',
    testoSolo:
      'Have a look around. Whenever you like, invite your partner: the things you do together unlock as soon as you join up.',
    invitaPartner: 'Invite your partner',
    esci: 'Sign out',
  },
  coppia: {
    servePartner: 'Invite your partner to continue',
    servePartnerNota: 'This part takes two: it opens as soon as your partner joins.',
    invita: 'Invite',
  },
};

/** Codice della lingua attiva, deciso dal dispositivo. */
export const lingua: 'it' | 'en' = getLocales()[0]?.languageCode === 'it' ? 'it' : 'en';

/** Stringhe della lingua attiva. */
export const t: Dizionario = lingua === 'it' ? it : en;
