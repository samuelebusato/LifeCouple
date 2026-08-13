import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Preferenze locali del dispositivo — niente di segreto e niente che il
 * database debba sapere.
 *
 * Per ora una sola: "ho scelto di entrare senza creare lo spazio". Serve
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
