import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Preferenze locali del dispositivo — niente di segreto e niente che il
 * database debba sapere.
 *
 * Due, per ora. La prima: "ho scelto di entrare senza creare lo spazio". Serve
 * perche' la schermata di scelta resta (chi ha ricevuto un invito deve poterlo
 * aprire) ma non e' piu' un cancello: senza memoria della scelta, chi entra
 * rimandando se la ritroverebbe davanti a ogni avvio, che e' esattamente il
 * cancello che si voleva togliere.
 *
 * La chiave e' per utente: sullo stesso telefono possono entrare persone
 * diverse, e la scelta di una non e' la scelta dell'altra.
 */
const chiave = (utenteId: string) => `lifecouple.ingresso-rimandato.${utenteId}`;

export function useIngressoRimandato(utenteId: string | undefined) {
  const [rimandato, setRimandato] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let vivo = true;
    if (!utenteId) {
      setRimandato(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    AsyncStorage.getItem(chiave(utenteId))
      .then((v) => {
        if (vivo) setRimandato(v === '1');
      })
      // Se la memoria locale non risponde si prosegue senza: al massimo si
      // rivede la schermata di scelta, che non blocca piu' niente.
      .catch(() => vivo && setRimandato(false))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [utenteId]);

  const rimanda = React.useCallback(async () => {
    setRimandato(true);
    if (utenteId) await AsyncStorage.setItem(chiave(utenteId), '1').catch(() => {});
  }, [utenteId]);

  return { rimandato, loading, rimanda };
}


/**
 * **Il paywall di fine onboarding e' gia' stato mostrato a questa persona.**
 *
 * 🔑 Serve perche' l'onboarding si puo' riattraversare: chi rimanda la scelta
 * e poi riceve un invito ci ripassa, e vedere il paywall due volte in dieci
 * minuti e' il modo piu' rapido di farsi disinstallare.
 *
 * ⚠️ Sta sul DISPOSITIVO e non sul database, come la preferenza sopra: e' una
 * cortesia verso chi guarda questo telefono, non un fatto sulla persona. Chi
 * reinstalla lo rivede una volta — ed e' il comportamento giusto, perche' su
 * un telefono nuovo nessuno gliel'ha ancora mostrato.
 */
const chiavePaywall = (utenteId: string) => `lifecouple.paywall-ingresso.${utenteId}`;

export async function paywallIngressoGiaVisto(utenteId: string | undefined) {
  if (!utenteId) return true; // senza utente non si mostra niente
  try {
    return (await AsyncStorage.getItem(chiavePaywall(utenteId))) === '1';
  } catch {
    // Se la memoria non risponde si assume di SI': mostrare un paywall di
    // troppo e' peggio che saltarne uno.
    return true;
  }
}

export async function segnaPaywallIngressoVisto(utenteId: string | undefined) {
  if (!utenteId) return;
  await AsyncStorage.setItem(chiavePaywall(utenteId), '1').catch(() => {});
}

/**
 * Il token d'invito toccato da fuori, tenuto da parte finché non si può usare.
 *
 * ## 🔑 Perché NON è legato a un utente, a differenza di tutto il resto qui
 *
 * Le altre chiavi di questo file portano l'`utenteId` nel nome, perché
 * descrivono una persona che esiste già. Questa no, ed è il punto: **chi
 * riceve un invito quasi sempre non ha ancora un account**. Tocca il link,
 * arriva sull'app, e deve registrarsi *prima* di poterlo aprire.
 *
 * ⚠️ *È esattamente il nodo su cui la questione si era fermata il 2026-08-13*
 * («non ancora deciso come risolverlo»): non serviva una route, serviva un
 * posto dove l'invito potesse aspettare che l'utente venisse al mondo.
 *
 * ## Il ciclo di vita, in tre gesti
 *
 *   `salva`     — la route `app/invito/[token].tsx`, appena riceve il link
 *   `leggi`     — l'onboarding, quando c'è finalmente una sessione
 *   `dimentica` — subito dopo averlo usato, **riuscito o no**
 *
 * 🔑 **Si dimentica anche quando fallisce**, e va detto: un token scaduto o
 * già usato che restasse in memoria riproverebbe a ogni avvio, mostrando lo
 * stesso errore a chi non ha modo di capire da dove venga.
 */
const CHIAVE_INVITO = 'lifecouple.invito-in-attesa';

export async function salvaInvitoInAttesa(token: string) {
  // ⚠️ Nessun token vuoto: cancellerebbe il senso di `leggi` e basta.
  if (!token.trim()) return;
  await AsyncStorage.setItem(CHIAVE_INVITO, token.trim()).catch(() => {});
}

export async function invitoInAttesa(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(CHIAVE_INVITO);
    return v?.trim() ? v.trim() : null;
  } catch {
    // La memoria non risponde: si prosegue senza invito. ⚠️ Mai lanciare da
    // qui — bloccherebbe l'ingresso a chi l'invito non l'ha nemmeno usato.
    return null;
  }
}

export async function dimenticaInvitoInAttesa() {
  await AsyncStorage.removeItem(CHIAVE_INVITO).catch(() => {});
}
