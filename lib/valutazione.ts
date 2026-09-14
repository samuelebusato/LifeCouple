import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * **Quando chiedere una valutazione sullo store**, e soprattutto quando non farlo.
 *
 * ## 🔑 Il vincolo che decide tutto il disegno
 *
 * Il pop-up nativo **non si può mostrare a comando**. `requestReview()` è una
 * *richiesta*: il sistema decide se mostrarla, e iOS la concede al massimo
 * **tre volte per anno per utente**. Non c'è modo di sapere se è comparsa —
 * la funzione risolve comunque, che il pop-up ci sia stato o no.
 *
 * ⚠️ **Quindi il rischio vero non è chiedere troppo poco: è bruciare la quota.**
 * Cinque eventi che invocano il nativo senza filtro la esauriscono nei primi
 * minuti d'uso — quando l'utente non ha ancora nessun motivo per dare cinque
 * stelle — e per i restanti dodici mesi non succede più niente, in silenzio.
 *
 * Da qui il mestiere di questo file: **non mostrare il pop-up, ma scegliere il
 * momento in cui vale la pena chiederlo.** I cinque eventi richiesti entrano
 * tutti; sono i cancelli a decidere quale di essi diventa un tentativo vero.
 *
 * ## I cancelli, e perché ciascuno
 *
 * - **Età minima dell'utente** — non si chiede a chi ha aperto l'app oggi.
 *   Le linee guida Apple lo dicono esplicitamente, ed è anche il motivo per cui
 *   l'evento `accesso` da solo non basta mai: chi accede la prima volta non ha
 *   ancora visto niente da valutare.
 * - **Momenti piacevoli dall'ultima comparsa** — ⟳ **cambiato il 2026-09-14
 *   su richiesta dell'utente.** Le **prime tre** comparse arrivano a *ogni*
 *   momento piacevole; dopo di esse ne servono **tre** per ciascuna. Prima la
 *   regola era «tre momenti e poi basta», con la pausa settimanale a fare da
 *   freno vero.
 * - ~~Distanza fra un tentativo e l'altro~~ — **rimossa** lo stesso giorno:
 *   sette giorni contraddicevano «a ogni momento piacevole», perché due
 *   partite finite nello stesso pomeriggio avrebbero dato un solo tentativo.
 * - **Tetto annuale a dodici** — alzato da tre. ⚠️ *Il nostro contatore conta i
 *   nostri tentativi, non i pop-up davvero mostrati: quelli non sono
 *   osservabili.* È un'approssimazione dichiarata, ed è la migliore possibile.
 *
 * 🔴 **La conseguenza da conoscere, e che nessuna soglia può cambiare**: iOS ne
 * concede comunque **tre l'anno** e ignora il resto in silenzio. Chiedere più
 * spesso non produce più pop-up — sposta soltanto *su quali momenti* si
 * spendono i tre che il sistema concede. Con la regola nuova quei tre cadranno
 * quasi certamente sui primi tre momenti piacevoli dopo il terzo giorno.
 *
 * ## Due posti dove non si chiede mai
 *
 * - **In Expo Go**: lì il pop-up riguarderebbe **Expo Go**, non LifeCouple.
 *   Chiederlo in sviluppo non prova niente e confonde chi prova l'app.
 * - **Dove il sistema non sa farci niente** (`hasAction()` falso): sul web, e
 *   su un'app senza URL di store configurato. Si esce in silenzio.
 *
 * ⚠️ **Niente di ciò che sta qui è bloccante**: ogni funzione è a prova di
 * eccezione e non restituisce mai un errore a chi la chiama. Una valutazione
 * non chiesta è un non-evento; una schermata che si rompe mentre l'utente
 * finisce una partita è un difetto.
 */

/** Gli eventi che possono aprire la domanda. Sono i cinque chiesti dall'utente. */
export type Momento = 'partita' | 'evoluzione' | 'accesso' | 'luogo' | 'settimanale';

/**
 * Le prime comparse arrivano a **ogni** momento piacevole; dopo di esse ne
 * serve uno ogni `MOMENTI_FRA_COMPARSE` (decisione dell'utente, 2026-09-14).
 *
 * 🔑 **Si contano le comparse di sempre, non quelle dell'anno.** `tentativi`
 * viene potato a 365 giorni perché il tetto annuale possa riaprirsi; questo
 * contatore no. Altrimenti la fase generosa tornerebbe ogni anno, mentre
 * «le prime tre» vuol dire le prime tre e basta.
 */
const COMPARSE_SUBITO = 3;
/** Poi: un tentativo ogni tanti momenti piacevoli **dall'ultima comparsa**. */
const MOMENTI_FRA_COMPARSE = 3;
/** Da quanti giorni dev'essere in giro l'utente. */
const GIORNI_ETA_MINIMA = 3;
/**
 * Tetto annuale **nostro**, alzato da 3 a 12 il 2026-09-14.
 *
 * ⚠️ Non è il limite vero: iOS ne concede **tre** e ignora in silenzio il
 * resto. Serviva alzarlo perché a 3 le prime tre comparse esaurivano la quota
 * e la regola «poi ogni tre momenti» **non sarebbe mai scattata** nel primo
 * anno — codice morto travestito da politica. Resta come rete di sicurezza
 * contro un difetto che facesse contare male i momenti, non come freno atteso.
 */
const TENTATIVI_PER_ANNO = 12;

const GIORNO = 24 * 60 * 60 * 1000;

/**
 * 🔑 **`settimanale` e `accesso` non contano come momenti piacevoli**, e la
 * differenza è la sostanza di tutto il file: aprire l'app non è un motivo per
 * dare cinque stelle, finire una partita sì. Restano eventi che possono
 * *aprire* la domanda — ma solo se i momenti veri sono già stati accumulati
 * altrove. ⚠️ *Senza questa distinzione bastava riaprire l'app tre volte per
 * superare la soglia, che è il modo di chiedere una valutazione a chi non ha
 * ancora usato niente.*
 */
const CONTA_COME_MOMENTO: Record<Momento, boolean> = {
  partita: true,
  evoluzione: true,
  luogo: true,
  accesso: false,
  settimanale: false,
};

type Stato = {
  /** Prima volta che questo dispositivo ha visto questo utente. */
  visto: string;
  /** Quanti momenti piacevoli ha accumulato **in tutto**. Non si azzera mai. */
  momenti: number;
  /** Date ISO dei tentativi fatti, dal più vecchio. Potate a 365 giorni. */
  tentativi: string[];
  /**
   * Quante volte si è chiesto, **da sempre**: decide se siamo ancora nella
   * fase generosa. Volutamente non potato, a differenza di `tentativi`.
   */
  comparseTotali: number;
  /**
   * Quanto valeva `momenti` all'ultima comparsa.
   *
   * 🔑 **È il campo che fa funzionare la regola nuova.** Prima il confronto era
   * `momenti >= soglia` su un contatore cumulativo: superata la soglia una
   * volta, restava superata per sempre, e a trattenere il pop-up era solo la
   * pausa di sette giorni. Tolta quella pausa, quel confronto avrebbe chiesto
   * a **ogni** momento piacevole per sempre — anche nella fase in cui ne devono
   * servire tre. I momenti si contano quindi **da qui in avanti**, non dall'inizio.
   */
  momentiAllUltimaComparsa: number;
};

const chiave = (utenteId: string) => `lifecouple.valutazione.${utenteId}`;

const vuoto = (): Stato => ({
  visto: new Date().toISOString(),
  momenti: 0,
  tentativi: [],
  comparseTotali: 0,
  momentiAllUltimaComparsa: 0,
});

async function leggi(utenteId: string): Promise<Stato> {
  try {
    const grezzo = await AsyncStorage.getItem(chiave(utenteId));
    if (!grezzo) return vuoto();
    const v = JSON.parse(grezzo) as Partial<Stato>;
    const tentativi = Array.isArray(v.tentativi)
      ? v.tentativi.filter((t) => typeof t === 'string')
      : [];
    return {
      visto: typeof v.visto === 'string' ? v.visto : new Date().toISOString(),
      momenti: typeof v.momenti === 'number' && v.momenti >= 0 ? v.momenti : 0,
      tentativi,
      // ⚠️ **Chi ha già lo stato salvato non ha questi due campi**, e la scelta
      // dei ripieghi non è neutra. `comparseTotali` si deduce dai tentativi
      // ancora in memoria: è una sottostima se qualcuno ne aveva di più vecchi
      // di un anno, e sbaglia quindi verso la fase generosa — che è il verso
      // innocuo. `momentiAllUltimaComparsa` riparte da 0, quindi al primo
      // momento piacevole chi aveva già accumulato riceve subito il pop-up.
      // *Accettabile perché la politica nuova è comunque generosa, e perché
      // l'alternativa — dedurlo — significherebbe inventare un numero.*
      comparseTotali:
        typeof v.comparseTotali === 'number' && v.comparseTotali >= 0
          ? v.comparseTotali
          : tentativi.length,
      momentiAllUltimaComparsa:
        typeof v.momentiAllUltimaComparsa === 'number' && v.momentiAllUltimaComparsa >= 0
          ? v.momentiAllUltimaComparsa
          : 0,
    };
  } catch {
    // Memoria locale che non risponde: si riparte da zero. Il valore prudente
    // qui è «non ha ancora accumulato niente», cioè non chiedere — la stessa
    // scelta che `posizione.ts` fa ripartendo da «spenta».
    return vuoto();
  }
}

async function scrivi(utenteId: string, s: Stato) {
  try {
    await AsyncStorage.setItem(chiave(utenteId), JSON.stringify(s));
  } catch {
    /* si prosegue senza: vedi la nota in testa. */
  }
}

/** Giorni interi trascorsi da una data ISO. `null` se la data non è leggibile. */
function giorniDa(iso: string): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / GIORNO);
}

/**
 * I tentativi ancora dentro la finestra di 365 giorni. Gli altri si scordano,
 * altrimenti l'elenco cresce per sempre e il tetto non si riaprirebbe mai.
 */
function tentativiRecenti(tentativi: string[]): string[] {
  return tentativi.filter((t) => {
    const g = giorniDa(t);
    return g !== null && g < 365;
  });
}

/**
 * Il giudizio, separato dagli effetti perché è la parte che si può provare.
 * Non tocca la rete, non tocca il disco, non guarda l'orologio se non tramite
 * i valori che riceve.
 */
export function vaChiesto(
  stato: Stato,
  momento: Momento,
  ora: number = Date.now()
): { chiedere: boolean; perche: string } {
  const eta = Math.floor((ora - Date.parse(stato.visto)) / GIORNO);
  if (!Number.isFinite(eta) || eta < GIORNI_ETA_MINIMA) {
    return { chiedere: false, perche: `utente da ${eta} giorni, ne servono ${GIORNI_ETA_MINIMA}` };
  }

  const momenti = stato.momenti + (CONTA_COME_MOMENTO[momento] ? 1 : 0);

  // Quanti momenti piacevoli sono passati **dall'ultima comparsa**, e quanti
  // ne servono adesso: uno solo finché le comparse sono poche, poi tre.
  const daUltima = momenti - stato.momentiAllUltimaComparsa;
  const servono = stato.comparseTotali < COMPARSE_SUBITO ? 1 : MOMENTI_FRA_COMPARSE;
  if (daUltima < servono) {
    return {
      chiedere: false,
      perche: `${daUltima} momenti dall'ultima comparsa, ne servono ${servono}`,
    };
  }

  const recenti = tentativiRecenti(stato.tentativi);
  if (recenti.length >= TENTATIVI_PER_ANNO) {
    return { chiedere: false, perche: `gia' ${recenti.length} tentativi in 365 giorni` };
  }

  return {
    chiedere: true,
    perche: `${daUltima} momenti dall'ultima, ${stato.comparseTotali} comparse in tutto`,
  };
}

/** Vero solo dove il pop-up riguarderebbe davvero questa app. */
async function sistemaDisponibile(): Promise<boolean> {
  // In Expo Go il pop-up sarebbe quello di Expo Go: non è la nostra app, e
  // chiederlo in sviluppo non prova niente.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  try {
    return await StoreReview.hasAction();
  } catch {
    return false;
  }
}

/**
 * **Segnala che è successo qualcosa di buono**, e — se è il momento — chiedi al
 * sistema di mostrare il pop-up di valutazione.
 *
 * Si chiama e si dimentica: non attende, non blocca, non restituisce errori.
 * Il valore di ritorno serve ai test e al registro, non a chi la invoca.
 */
export async function segnalaMomento(
  utenteId: string | undefined | null,
  momento: Momento
): Promise<{ chiesto: boolean; perche: string }> {
  if (!utenteId) return { chiesto: false, perche: 'nessun utente' };

  try {
    const stato = await leggi(utenteId);
    const giudizio = vaChiesto(stato, momento);

    // Il conteggio si aggiorna **sempre**, anche quando non si chiede: è così
    // che i momenti maturano fino alla soglia.
    const aggiornato: Stato = {
      ...stato,
      momenti: stato.momenti + (CONTA_COME_MOMENTO[momento] ? 1 : 0),
      tentativi: tentativiRecenti(stato.tentativi),
    };

    if (!giudizio.chiedere) {
      await scrivi(utenteId, aggiornato);
      return { chiesto: false, perche: giudizio.perche };
    }

    if (!(await sistemaDisponibile())) {
      // ⚠️ **Non si segna il tentativo.** Qui il pop-up non poteva comparire per
      // ragioni nostre (web, Expo Go, URL di store mancante): contarlo
      // brucerebbe uno dei tre a vuoto, e l'utente vero non avrebbe mai visto
      // niente.
      await scrivi(utenteId, aggiornato);
      return { chiesto: false, perche: 'il sistema non ha un modo di chiederlo qui' };
    }

    await StoreReview.requestReview();

    // 🔑 Si segna il tentativo **dopo** la chiamata e comunque vada: non
    // sappiamo se il pop-up è comparso — il sistema non lo dice — e l'unica
    // cosa che possiamo contare onestamente è **di averlo chiesto**.
    await scrivi(utenteId, {
      ...aggiornato,
      tentativi: [...aggiornato.tentativi, new Date().toISOString()],
      // 🔑 Da qui riparte il conteggio dei momenti: `aggiornato.momenti`
      // comprende già quello appena segnalato, quindi la prossima comparsa
      // vorrà momenti **successivi** a questo e non lo riconterà.
      comparseTotali: aggiornato.comparseTotali + 1,
      momentiAllUltimaComparsa: aggiornato.momenti,
    });
    return { chiesto: true, perche: giudizio.perche };
  } catch {
    // Nessuna valutazione vale una schermata rotta.
    return { chiesto: false, perche: 'errore ignorato' };
  }
}

/**
 * I due momenti che non nascono da un gesto dentro l'app: **l'accesso** e il
 * **controllo periodico**. Si monta una volta sola, in `app/_layout.tsx`.
 *
 * ## 🔑 Perché «una volta a settimana» può solo voler dire «all'apertura»
 *
 * Un'app chiusa **non esegue codice**. Senza notifiche push o attività in
 * background — che LifeCouple non ha, e che per una domanda di valutazione
 * sarebbero sproporzionate — non esiste modo di far comparire un pop-up il
 * settimo giorno se quel giorno l'utente non apre l'app.
 *
 * ⚠️ *Quindi «periodicamente una volta a settimana» qui significa: **a ogni
 * apertura, ma non più di una volta a settimana**.* È la cosa più vicina alla
 * richiesta che una app mobile possa fare onestamente, e vale la pena dirlo
 * invece di lasciar credere che ci sia un timer da qualche parte.
 */
export function useMomentiDiSessione(): void {
  const { session, loading } = useAuth();
  const utenteId = session?.user?.id;
  const giaAllAvvio = React.useRef<string | null>(null);

  /* Apertura dell'app con una sessione: è qui che cade il controllo periodico. */
  React.useEffect(() => {
    if (loading || !utenteId || giaAllAvvio.current === utenteId) return;
    giaAllAvvio.current = utenteId;
    void segnalaMomento(utenteId, 'settimanale');
  }, [loading, utenteId]);

  /* Accesso o registrazione appena completati. */
  React.useEffect(() => {
    // ⚠️ `SIGNED_IN` e non la comparsa della sessione: al riavvio dell'app la
    // sessione ricompare **senza** che nessuno abbia fatto niente, e quello è
    // il caso dell'effetto qui sopra. Supabase distingue i due con
    // `INITIAL_SESSION`, che qui non interessa.
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'SIGNED_IN' && s?.user?.id) void segnalaMomento(s.user.id, 'accesso');
    });
    return () => sub.subscription.unsubscribe();
  }, []);
}

/** Esposte per i test: le soglie non si ricopiano a mano da un'altra parte. */
export const SOGLIE = {
  COMPARSE_SUBITO,
  MOMENTI_FRA_COMPARSE,
  GIORNI_ETA_MINIMA,
  TENTATIVI_PER_ANNO,
  CONTA_COME_MOMENTO,
};
