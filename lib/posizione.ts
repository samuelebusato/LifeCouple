import * as React from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * **La posizione condivisa fra i due membri** (D-100, migrazione 0031).
 *
 * 🔴 Questo modulo implementa la funzione che **D-05 aveva escluso**. Il perché
 * della decisione, e le tutele che la accompagnano, stanno per esteso nella
 * migrazione `0031`. Qui vale la conseguenza pratica, che vincola ogni riga di
 * questo file: **niente in questo modulo deve poter mandare una posizione senza
 * che la persona lo abbia chiesto, e spegnere dev'essere sempre possibile e mai
 * annunciato.**
 *
 * ## Le tre regole che il codice deve far rispettare
 *
 * 1. **Non si legge la posizione se la condivisione è spenta.** Il permesso non
 *    si chiede all'apertura della mappa: si chiede quando si accende la
 *    condivisione, che è l'unico momento in cui la richiesta ha un senso
 *    comprensibile per chi la riceve.
 * 2. **Spegnere cancella la riga**, non alza un flag. E non notifica nessuno:
 *    per il partner il risultato è indistinguibile da GPS spento o app chiusa.
 * 3. **Una posizione vecchia non si mostra come attuale.** Oltre `SCADENZA` il
 *    punto si considera *non disponibile*, perché un puntino di ieri disegnato
 *    come «è qui adesso» è un'informazione falsa, non una informazione vecchia.
 */

/**
 * Oltre questo tempo una posizione non è più «dove sei»: è dove eri.
 *
 * ⚠️ Quindici minuti è una scelta, non una costante di natura: abbastanza da
 * coprire un'app chiusa in tasca per un po', abbastanza poco da non far credere
 * che qualcuno sia in un posto che ha lasciato da un pezzo.
 */
export const SCADENZA = 15 * 60 * 1000;

/**
 * **La scelta di condividere vive sul dispositivo**, non nel database.
 *
 * 🔑 E non e' una comodita' implementativa: se lo stato «voglio condividere»
 * stesse sul server, esisterebbe un campo che dice *«ha smesso»* — e con esso la
 * possibilita' che qualcuno lo legga o che l'app lo mostri. La 0031 chiede che
 * spegnere non lasci traccia; il modo piu' solido di ottenerlo e' non avere
 * niente da lasciare. Sul server c'e' solo la posizione, e se non c'e' non si sa
 * perche'.
 *
 * La chiave e' per utente: sullo stesso telefono possono entrare persone
 * diverse, e la scelta di una non e' la scelta dell'altra.
 */
const chiaveCondivisione = (utenteId: string) => `lifecouple.condivido-posizione.${utenteId}`;

export function useCondivisionePosizione(utenteId: string | undefined) {
  const [condivido, setCondivido] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let vivo = true;
    if (!utenteId) {
      setCondivido(false);
      setLoading(false);
      return;
    }
    AsyncStorage.getItem(chiaveCondivisione(utenteId))
      .then((v) => vivo && setCondivido(v === '1'))
      // Se la memoria locale non risponde si resta **spenti**: il valore
      // prudente qui non e' "come l'ultima volta", e' "non condividere".
      .catch(() => vivo && setCondivido(false))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [utenteId]);

  const imposta = React.useCallback(
    async (valore: boolean) => {
      setCondivido(valore);
      if (utenteId) {
        await AsyncStorage.setItem(chiaveCondivisione(utenteId), valore ? '1' : '0').catch(() => {});
      }
    },
    [utenteId]
  );

  return { condivido, loading, imposta };
}

export type PosizioneMembro = {
  utenteId: string;
  lat: number;
  lon: number;
  precisione: number | null;
  aggiornataIl: number;
};

/** La distanza in metri fra due punti, sulla sfera (formula dell'emisenoverso). */
export function distanzaMetri(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6_371_000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * La distanza scritta come la direbbe una persona.
 *
 * ⚠️ **Le cifre si tagliano man mano che il numero cresce**, e non è vezzo: a
 * dieci chilometri di distanza «10,3 km» e «10 km» dicono la stessa cosa, ma il
 * primo suggerisce una precisione che il GPS non ha. Sotto il chilometro si
 * arrotonda a decine di metri per la stessa ragione — «387 m» sarebbe una
 * precisione inventata.
 */
export function distanzaLeggibile(metri: number, lingua: string): string {
  if (metri < 1000) {
    const arrotondati = Math.max(10, Math.round(metri / 10) * 10);
    return `${arrotondati} m`;
  }
  const km = metri / 1000;
  const cifre = km < 10 ? 1 : 0;
  return `${km.toLocaleString(lingua, { minimumFractionDigits: cifre, maximumFractionDigits: cifre })} km`;
}

/** Una posizione è utilizzabile solo se è recente: vedi `SCADENZA`. */
export function eRecente(p: PosizioneMembro, adesso = Date.now()): boolean {
  return adesso - p.aggiornataIl < SCADENZA;
}

/**
 * Legge e pubblica la posizione, e legge quella del partner.
 *
 * `attivo` dice se la condivisione è accesa: quando è falso questo hook **non
 * chiede permessi, non legge il GPS e non scrive niente**. Si limita a leggere
 * cosa c'è, perché il partner può condividere anche se tu non lo fai — la
 * condivisione non è reciproca per costruzione, ed è giusto così: obbligare alla
 * reciprocità significherebbe che per vedere devi farti vedere.
 */
export function usePosizioni(coppiaId: string | null, attivo: boolean) {
  const { session } = useAuth();
  const [posizioni, setPosizioni] = React.useState<PosizioneMembro[]>([]);
  const [errore, setErrore] = React.useState<string | null>(null);

  const rileggi = React.useCallback(async () => {
    if (!coppiaId) return;
    const { data, error } = await supabase
      .from('posizione_membro')
      .select('utente_id, lat, lon, precisione, aggiornata_il');
    if (error) {
      setErrore(error.message);
      return;
    }
    setErrore(null);
    setPosizioni(
      (data ?? []).map((r) => ({
        utenteId: r.utente_id,
        lat: r.lat,
        lon: r.lon,
        precisione: r.precisione,
        aggiornataIl: new Date(r.aggiornata_il).getTime(),
      }))
    );
  }, [coppiaId]);

  /**
   * Pubblica la propria posizione. Chiamata solo quando la condivisione è
   * accesa — e chiede il permesso **qui**, non all'apertura della mappa.
   */
  const pubblica = React.useCallback(async (): Promise<string | null> => {
    if (!coppiaId || !session) return null;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'permesso-negato';

    const p = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { error } = await supabase.from('posizione_membro').upsert(
      {
        utente_id: session.user.id,
        coppia_id: coppiaId,
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        precisione: p.coords.accuracy,
        aggiornata_il: new Date().toISOString(),
      },
      { onConflict: 'utente_id' }
    );
    if (error) return error.message;
    await rileggi();
    return null;
  }, [coppiaId, session, rileggi]);

  /**
   * 🔴 **Spegne la condivisione cancellando la riga.**
   *
   * Non scrive niente da nessuna parte, non lascia traccia che sia mai stata
   * attiva, e **non avvisa il partner**: per lui il risultato è identico a un
   * telefono scarico. È la tutela centrale di D-100 — vedi la 0031.
   */
  const smettiDiCondividere = React.useCallback(async (): Promise<string | null> => {
    if (!session) return null;
    const { error } = await supabase
      .from('posizione_membro')
      .delete()
      .eq('utente_id', session.user.id);
    if (error) return error.message;
    await rileggi();
    return null;
  }, [session, rileggi]);

  // Si rilegge all'avvio e poi a intervalli, ma **si pubblica solo se attivo**.
  React.useEffect(() => {
    rileggi();
  }, [rileggi]);

  React.useEffect(() => {
    if (!coppiaId) return;
    // ⚠️ Un minuto, non pochi secondi: questo è un ciclo che consuma batteria e
    // rete, e la posizione di una persona non cambia utilmente più in fretta.
    const id = setInterval(() => {
      rileggi();
      if (attivo) pubblica();
    }, 60_000);
    return () => clearInterval(id);
  }, [coppiaId, attivo, rileggi, pubblica]);

  const mia = posizioni.find((p) => p.utenteId === session?.user.id) ?? null;
  const altro = posizioni.find((p) => p.utenteId !== session?.user.id) ?? null;

  return { mia, altro, errore, rileggi, pubblica, smettiDiCondividere };
}
