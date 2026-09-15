// =============================================================================
// acquisti — «Insieme»: il paywall, il Customer Center, e il diritto
//
// 🔑 **La riga che regge tutto il file, e va letta prima del codice: questo
//    modulo NON decide se una funzione è concessa.** Lo decide il database,
//    con `coppia_ha_insieme()` (0041), scritto solo dalla Edge Function
//    `abbonamento-webhook`. Ciò che l'SDK di RevenueCat sa serve a **disegnare
//    la schermata**: a sapere se mostrare il paywall, non a sbloccare.
//
// ⚠️ Non è prudenza eccessiva, è il threat model di questo progetto
//    (docs/threat-model.md §4-ter, scritto prima del codice): il telefono è
//    ostile per definizione (TB-1), e un'app modificata che dichiara di avere
//    il diritto non deve ottenere niente. Se un domani qualcuno sostituisse
//    una lettura del database con `customerInfo.entitlements.active`, il
//    prodotto diventerebbe gratis per chiunque sappia ricompilare — e nessuna
//    schermata cambierebbe aspetto.
//
// ## Perché l'App User ID è l'id di Supabase
//
// È ciò che permette al webhook di sapere **a chi** intestare il diritto: il
// suo `app_user_id` è la chiave primaria di `abbonamento`. ⚠️ Non è un
// segreto e non è una prova — un client modificato può dichiararne un altro —
// e infatti la difesa non è nasconderlo: è che il diritto **che conta** venga
// letto dalla riga dell'utente **autenticato**, non da quella che il client
// nomina.
//
// ## Cosa succede in Expo Go
//
// Dalla 10.x l'SDK ha una «Preview API Mode»: non esplode, restituisce dati
// finti, e gli acquisti veri non avvengono. Quindi si può sviluppare, ma
// **provare un acquisto richiede una development build** — è la stessa
// decisione sul prebuild ferma da B-20 e sciolta da D-133.
// =============================================================================

import * as React from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Cresce a ogni montaggio, e finisce nel nome del canale realtime.
 *
 * ⚠️ **È la correzione di B-58, non un vezzo.** `supabase.channel(nome)`
 * restituisce il canale **esistente** se il nome combacia, e `removeChannel`
 * è asincrono: uscendo e rientrando con lo **stesso** account il nome
 * collideva, `.on(…)` lanciava dentro un effetto, e l'albero React si
 * smontava — schermata bianca. *Con un account diverso non succedeva mai, ed
 * è il motivo per cui è sopravvissuto a lungo.*
 */
let istanzaCanaleAbbonamento = 0;
// ⚠️ `useCoppia` non si importa più qui, ed è il segno che B-75 è chiuso: il
// cancello non dipende più dalla coppia. Era proprio quella dipendenza a far
// uscire l'hook prima di interrogare il database, in silenzio.

/**
 * L'entitlement configurato su RevenueCat (decisione dell'utente, 2026-09-14).
 *
 * ⚠️ **Questo nome deve combaciare, carattere per carattere, con quello nel
 * pannello RevenueCat.** Nessun controllo confronta i due: se divergono l'app
 * non concede mai niente e non lo dice — il paywall si chiuderebbe con un
 * successo apparente e il diritto resterebbe spento.
 */
export const ENTITLEMENT = 'lifecouple_pro';

const CHIAVE = process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS ?? '';

/**
 * ⚠️ Una chiave con prefisso `test_` è una **Test Store key**: gli acquisti
 * vanno al negozio di prova di RevenueCat, non all'App Store. Utilissima
 * adesso — permette di provare tutto **prima** che i prodotti su App Store
 * Connect esistano — ma un'app con questa chiave **non va mai inviata allo
 * store**. La build di produzione vuole la chiave `appl_…`.
 */
export const E_TEST_STORE = CHIAVE.startsWith('test_');

// -----------------------------------------------------------------------------
// Configurazione
// -----------------------------------------------------------------------------

let configurato = false;

/**
 * Configura l'SDK una volta sola. Idempotente di proposito: viene chiamata da
 * un componente che può rimontare, e configurare due volte è un errore che
 * l'SDK segnala in modo poco chiaro.
 */
async function configura(utenteId: string | null): Promise<boolean> {
  // D-132: la distribuzione parte da iPhone soltanto. Su web non esiste
  // nessuno store, e chiamare l'SDK lì fallirebbe senza che serva a niente.
  if (Platform.OS !== 'ios') return false;
  if (!CHIAVE) {
    console.warn('[acquisti] EXPO_PUBLIC_REVENUECAT_KEY_IOS non impostata: SDK non configurato');
    return false;
  }
  // 🔴 **La guardia che impedisce di vendere nel negozio di prova.**
  //
  // Una chiave `test_…` manda gli acquisti al **Test Store** di RevenueCat:
  // utilissima adesso, perché permette di provare la catena intera *prima* che
  // i prodotti su App Store Connect esistano. ⚠️ **In una build che raggiunge
  // una persona sarebbe un guasto silenzioso e costoso**: l'app «venderebbe»
  // senza che nessuno incassi, e il diritto verrebbe concesso a chi non ha
  // pagato niente.
  //
  // 🔑 **Il discriminante è `__DEV__`, e non è un dettaglio**: una development
  // build lo ha `true`, una build di TestFlight o di produzione `false`. Così
  // la chiave di prova continua a funzionare esattamente dove serve, e smette
  // di funzionare esattamente dove farebbe danno — senza che nessuno debba
  // ricordarsi di cambiarla.
  //
  // ⚠️ **Il modo di fallire è scelto**: non si configura affatto, quindi il
  // paywall dice «non disponibile» invece di vendere. Chi ha già «Insieme» non
  // perde nulla, perché il diritto vive nel database e non in questo SDK.
  //
  // ⚠️ **E una cosa che questa guardia non può fare: accorgersene prima del
  // build.** La chiave di produzione arriva dai secret di EAS, non dal
  // repository — nessun controllo committabile può leggerla. Questo è il punto
  // più a monte in cui il problema è ancora osservabile.
  if (E_TEST_STORE && !__DEV__) {
    console.error(
      '[acquisti] chiave Test Store in una build non di sviluppo: SDK NON configurato, ' +
        'e «Insieme» non è acquistabile. La build di produzione vuole la chiave appl_…'
    );
    return false;
  }

  if (configurato) return true;

  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: CHIAVE, appUserID: utenteId ?? null });
    configurato = true;
    return true;
  } catch (e) {
    // ⚠️ Non si rilancia: un guasto qui non deve impedire di usare l'app. Il
    // peggio che può succedere è che «Insieme» non sia acquistabile — e chi
    // già lo ha continua ad averlo, perché il diritto vive nel database e non
    // in questo SDK.
    console.warn('[acquisti] configure fallita:', String(e));
    return false;
  }
}

/**
 * Tiene l'identità di RevenueCat allineata a quella di Supabase.
 *
 * 🔑 **Va montato una volta sola, alla radice** — come `MomentiDiValutazione`:
 * è un componente che non disegna niente e vive per un effetto.
 */
export function ProvederAcquisti(): null {
  const { session } = useAuth();
  const utenteId = session?.user?.id ?? null;
  const ultimoId = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    let vivo = true;
    (async () => {
      if (!(await configura(utenteId))) return;
      if (!vivo || ultimoId.current === utenteId) return;

      try {
        // Al primo giro `configure` ha già ricevuto l'id: si evita un logIn
        // superfluo, che creerebbe un alias inutile lato RevenueCat.
        if (ultimoId.current !== undefined) {
          if (utenteId) await Purchases.logIn(utenteId);
          else await Purchases.logOut();
        }
        ultimoId.current = utenteId;
      } catch (e) {
        console.warn('[acquisti] allineamento identità fallito:', String(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [utenteId]);

  return null;
}

// -----------------------------------------------------------------------------
// Il diritto — letto dal database, non dall'SDK
// -----------------------------------------------------------------------------

/**
 * **Il cancello.** Vero se la coppia ha «Insieme», secondo il database.
 *
 * ⚠️ Dopo un acquisto riuscito c'è una finestra di **qualche secondo** in cui
 * l'SDK sa e il database non ancora: il webhook di RevenueCat è asincrono.
 * `ricarica({ insistendo: true })` copre proprio quella finestra, ed è ciò che
 * il paywall chiama quando si chiude con successo.
 *
 * 🔑 Si è scelto di aspettare il database invece di fidarsi dell'SDK «solo per
 * quei secondi»: una scorciatoia temporanea in un cancello di sicurezza è una
 * scorciatoia permanente il giorno dopo.
 */
export function useInsieme() {
  // 🔴 **B-75 — il cancello chiedeva della COPPIA, e il diritto è della
  // PERSONA.**
  //
  // Fino al 2026-09-15 questo hook chiamava `coppia_ha_insieme(cid)`, che
  // risponde a *«questa coppia ha Insieme?»*. Ma **D-124** stabilisce che il
  // diritto è della persona e si *proietta* sulla coppia — quindi chi paga
  // **senza avere ancora un partner** ha un abbonamento valido e registrato,
  // e non sbloccava niente.
  //
  // ⚠️ **E il modo di fallire era il peggiore possibile**: quella funzione
  // vuole un `cid`, quindi senza coppia l'hook usciva **prima** di interrogare
  // il database — nessuna chiamata, nessun errore, nessun log. Solo un muro
  // che non se ne andava, e un sintomo («ho pagato e resta chiuso») che punta
  // ai pagamenti, dove non c'era niente di rotto. *Sono servite due sonde per
  // vederlo, ed è il motivo per cui questa versione non dipende più dalla
  // coppia per niente.*
  //
  // Ora chiama `ho_insieme()` (0047): niente argomenti, soggetto `auth.uid()`,
  // vera per diritto proprio **o** per proiezione dalla coppia.
  // 🔑 Si dipende dall'**autenticazione**, non più dalla coppia: `ho_insieme()`
  // ha per soggetto `auth.uid()`. ⚠️ E si aspetta che l'auth abbia finito —
  // chiamarla con la sessione ancora nulla direbbe «non hai Insieme» a chi ce
  // l'ha, che è la forma esatta di B-73.
  const { session, loading: autenticazioneInCorso } = useAuth();
  const utenteId = session?.user?.id ?? null;
  const [insieme, setInsieme] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(
    async (opzioni?: { insistendo?: boolean }) => {
      // Sei tentativi in ~9 secondi: è la finestra tipica fra l'acquisto e
      // l'arrivo del webhook. Se non basta, il diritto comparirà comunque al
      // prossimo avvio — non si perde, arriva tardi.
      const tentativi = opzioni?.insistendo ? 6 : 1;
      for (let i = 0; i < tentativi; i++) {
        const { data, error } = await supabase.rpc('ho_insieme');

        // 🔎 **Resta una riga di diagnostica, e solo in sviluppo.**
        //
        // La sonda del 2026-09-15 leggeva anche la riga di `abbonamento` a
        // ogni giro: è stata tolta perché costava **una query in più per ogni
        // controllo**, e questo hook gira a ogni montaggio di mappa, liste e
        // creatura. ⚠️ *Serviva a distinguere «la funzione sbaglia» da «la
        // riga dice ancora sì», e quella distinzione si rifà a mano quando
        // serve — non si paga a ogni render.*
        //
        // 🔑 Ciò che resta è il minimo che evita di ripetere la giornata del
        // 2026-09-15: se `ho_insieme` non esistesse (0047 non applicata su un
        // ambiente), `error` lo direbbe — mentre `data !== true` da solo
        // somiglierebbe di nuovo a «non hai Insieme», che è la forma di B-73.
        if (__DEV__) {
          // 🔎 **Il minimo che resta, e perché proprio questo.**
          //
          // La sonda del 2026-09-15 leggeva anche la riga di `abbonamento` a
          // ogni giro — `attivo`, `scade_il`, `evento_il` — ed è stata
          // decisiva due volte: ha distinto «il webhook non ha scritto» da
          // «ha scritto e l'app non lo vede», che sono guasti opposti.
          // ⚠️ *Ma costava una query in più per ogni controllo*, su un hook
          // che gira a ogni montaggio di mappa, liste e creatura. Si rimette a
          // mano quando serve, non si paga sempre.
          //
          // 🔑 Questa riga invece resta: se `ho_insieme` non esistesse su un
          // ambiente (0047 non applicata), `error` lo direbbe — mentre
          // `data !== true` da solo somiglia di nuovo a «non hai Insieme»,
          // che è la forma di B-73.
          console.log(
            '[insieme]',
            JSON.stringify({
              data,
              errore: error ? { message: error.message, code: error.code } : null,
              tentativo: `${i + 1}/${tentativi}`,
            })
          );
        }

        if (!error && data === true) {
          setInsieme(true);
          setLoading(false);
          return true;
        }
        if (i === 0 && !opzioni?.insistendo) setInsieme(data === true);
        if (i < tentativi - 1) await new Promise((s) => setTimeout(s, 1500));
      }
      setLoading(false);
      return false;
    },
    [utenteId]
  );

  React.useEffect(() => {
    // Non si conclude niente finché l'auth non ha finito: `auth.uid()` sarebbe
    // null e la funzione tornerebbe false — cioè «non hai Insieme» detto a chi
    // ce l'ha. È la lezione di B-73, applicata alla dipendenza nuova.
    if (autenticazioneInCorso) return;
    void ricarica();
  }, [ricarica, autenticazioneInCorso]);

  /**
   * **I muri cadono quando il webhook scrive, non quando l'app si ricorda di
   * chiedere** (B-77, `0048`).
   *
   * ## Il difetto che chiude
   *
   * Dopo un acquisto riuscito il paywall chiamava `ricarica({ insistendo })`,
   * che prova **6 volte in ~9 secondi** e poi si arrende **in silenzio**. Il
   * 2026-09-15 il webhook ci ha messo un secondo la mattina e molto di più il
   * pomeriggio: la finestra ha ceduto, e chi aveva pagato si è ritrovato coi
   * muri su e **nessun messaggio**. ⚠️ *Identico allo schermo di chi non ha
   * pagato — cioè, per un cliente vero, soldi buttati.*
   *
   * 🔑 **La risposta non è aspettare di più, è smettere di aspettare.** Il
   * realtime non ha finestre: arriva quando arriva, anche fra dieci minuti,
   * anche mentre la persona sta guardando un'altra scheda.
   *
   * ## ⚠️ Il realtime dice «è cambiato», mai «hai diritto»
   *
   * Si **rilegge** `ho_insieme()` invece di fidarsi del payload, e non è
   * prudenza di troppo: una riga che arriva al telefono è una cosa che il
   * telefono ha visto, e `docs/threat-model.md` §4-ter dice che il telefono è
   * ostile per definizione. *Concedere un diritto da un payload sarebbe lo
   * stesso errore dell'SDK di RevenueCat, spostato di un livello.*
   *
   * ## 🔴 Il numero d'istanza nel nome, che è la correzione di B-58
   *
   * `supabase.channel(nome)` **restituisce quello esistente** se il nome
   * combacia, e `removeChannel` è asincrono. Uscendo e rientrando **con lo
   * stesso account** il nome collide, il canale è già sottoscritto, e
   * `.on('postgres_changes', …)` lancia — dentro un effetto, cioè **schermata
   * bianca**. *Un nome diverso a ogni montaggio non ha finestre di corsa.*
   */
  React.useEffect(() => {
    if (!utenteId) return;
    const canale: RealtimeChannel = supabase
      .channel(`abbonamento:${utenteId}:${++istanzaCanaleAbbonamento}`)
      .on(
        'postgres_changes',
        {
          // ⚠️ `*` e non `UPDATE`: la prima volta che si compra la riga **nasce**
          // (il webhook fa un upsert), e ascoltare i soli UPDATE perderebbe
          // esattamente il caso che questo codice esiste per coprire.
          event: '*',
          schema: 'public',
          table: 'abbonamento',
          filter: `utente_id=eq.${utenteId}`,
        },
        () => {
          void ricarica();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canale);
    };
  }, [utenteId, ricarica]);

  // ⚠️ **Il `loading` che esce da qui include quello dell'autenticazione**
  // (B-73). 🔑 *«Non lo so ancora» è uno stato, non un no* — e chi disegna il
  // muro (`mappa.tsx`, `preferiti.tsx`) decide su `!loading && !insieme`:
  // dichiarare di sapere troppo presto è ciò che faceva comparire il muro a
  // chi aveva diritto.
  return { insieme, loading: loading || autenticazioneInCorso, ricarica };
}

// -----------------------------------------------------------------------------
// Le tre azioni
// -----------------------------------------------------------------------------

export type EsitoPaywall =
  | { stato: 'comprato' }
  | { stato: 'ripristinato' }
  | { stato: 'annullato' }
  | { stato: 'non-disponibile'; motivo: string };

/**
 * Mostra il paywall costruito su RevenueCat.
 *
 * 🔑 **Il paywall lo disegna RevenueCat, non noi**, ed è una scelta: cambiare
 * prezzi, testi e forma non richiede una nuova versione sullo store. *Il costo
 * è che il suo aspetto non vive nel repo* — chi cerca «dov'è la schermata del
 * listino» non la trova, ed è il motivo per cui questa riga è qui.
 */
export async function apriPaywall(): Promise<EsitoPaywall> {
  if (Platform.OS !== 'ios' || !configurato) {
    return { stato: 'non-disponibile', motivo: 'SDK non configurato su questa piattaforma' };
  }
  try {
    const esito = await RevenueCatUI.presentPaywall({ displayCloseButton: true });
    switch (esito) {
      case PAYWALL_RESULT.PURCHASED:
        return { stato: 'comprato' };
      case PAYWALL_RESULT.RESTORED:
        return { stato: 'ripristinato' };
      case PAYWALL_RESULT.CANCELLED:
        return { stato: 'annullato' };
      default:
        // NOT_PRESENTED ed ERROR: l'utente non ha visto niente. ⚠️ Vanno
        // distinti da «annullato», altrimenti si racconta che ha detto di no
        // una persona a cui non è stato chiesto nulla.
        return { stato: 'non-disponibile', motivo: String(esito) };
    }
  } catch (e) {
    return { stato: 'non-disponibile', motivo: String(e) };
  }
}

/**
 * Il Customer Center di RevenueCat: disdetta, cambio piano, richiesta di
 * rimborso, storico. ⚠️ **Non è un lusso**: Apple pretende che un'app con
 * abbonamenti dica come disdire, e questo lo fa senza che dobbiamo costruirlo.
 */
export async function apriGestioneAbbonamento(): Promise<string | null> {
  if (Platform.OS !== 'ios' || !configurato) return 'non disponibile qui';
  try {
    await RevenueCatUI.presentCustomerCenter();
    return null;
  } catch (e) {
    return String(e);
  }
}

/**
 * «Ripristina acquisti». ⚠️ **Obbligatorio per la revisione Apple**: chi
 * cambia telefono, o reinstalla, deve poter riavere ciò che ha pagato senza
 * ricomprarlo.
 */
export async function ripristinaAcquisti(): Promise<{ ok: boolean; motivo?: string }> {
  if (Platform.OS !== 'ios' || !configurato) return { ok: false, motivo: 'non disponibile qui' };
  try {
    await Purchases.restorePurchases();
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: String(e) };
  }
}

/**
 * Lo stato che l'SDK conosce. ⚠️ **Per disegnare, mai per concedere.** Serve a
 * decidere se mostrare il pulsante «Passa a Insieme» o quello «Gestisci
 * l'abbonamento», non a sbloccare una funzione.
 */
export async function statoSecondoLoStore(): Promise<{
  attivo: boolean;
  scadenza: string | null;
  gestibileQui: boolean;
}> {
  const vuoto = { attivo: false, scadenza: null, gestibileQui: false };
  if (Platform.OS !== 'ios' || !configurato) return vuoto;
  try {
    const info = await Purchases.getCustomerInfo();
    const e = info.entitlements.active[ENTITLEMENT];
    return {
      attivo: !!e,
      scadenza: e?.expirationDate ?? null,
      // Vero solo se l'abbonamento è stato comprato su QUESTO account dello
      // store: è chi può disdire. L'altro membro della coppia beneficia del
      // diritto ma non lo gestisce.
      gestibileQui: !!e?.willRenew || !!e?.expirationDate,
    };
  } catch {
    return vuoto;
  }
}

/**
 * **Il rifiuto viene dal piano gratuito?**
 *
 * I limiti della `0042` sono imposti dal database e arrivano al client come
 * messaggi d'errore. 🔑 *Senza questa funzione l'app li mostrerebbe come
 * guasti* — «Con il piano gratuito ogni evento tiene una foto» in un riquadro
 * rosso sembra un errore dell'app, non un'offerta. Chi la usa deve mandare al
 * paywall, non stampare la frase.
 *
 * ⚠️ Riconosce la frase e non un codice, perché PostgREST non propaga
 * `errcode` al client: arriva solo il testo. Se un domani i messaggi della
 * `0042` cambiano, questa funzione va cambiata con loro — ed è il motivo per
 * cui tutte e tre le frasi contengono «piano gratuito», scritto apposta.
 */
export function eRifiutoDelPiano(messaggio?: string | null): boolean {
  return /piano gratuito/i.test(messaggio ?? '');
}
