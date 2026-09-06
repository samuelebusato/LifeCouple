import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Lo **stato** della creatura: punti, stadio, e i due momenti da mostrare.
 *
 * ## Il confine che questo file difende (D-09)
 *
 * Qui non si sa **niente** di come la creatura e' disegnata. Nessun PNG,
 * nessun colore, nessuna lontra: solo un numero, uno stadio derivato e due
 * booleani. Il disegno vive in `components/creatura.tsx` e riceve `stadio` e
 * `umore`, e non sa che esistono dei file — esattamente come nell'agosto 2026
 * non sapeva che esistevano dei cerchi.
 *
 * 🔑 E' il confine messo da **D-09 il 2026-08-12**, quattro settimane prima che
 * servisse. E' cio' che ha permesso, il 2026-09-06, di sostituire le forme
 * geometriche con una lontra generata senza toccare una riga di logica — e
 * sara' cio' che permettera' di passare a Lottie senza toccarla di nuovo.
 *
 * ## Lo stadio si **deriva**, non si salva
 *
 * `stadio_soglia` e' una tabella e non una costante nel codice apposta: le
 * soglie si tarano con l'uso reale **senza migrazione** (0001, ritarate dalla
 * 0033). Quindi lo stadio e' sempre una funzione dei punti letta al momento,
 * mai un valore memorizzato che potrebbe divergere.
 *
 * ## I due «gia' visto» stanno sul **dispositivo**, non sulla coppia
 *
 * La festa e l'evoluzione sono momenti che **ciascuno dei due deve vedere sul
 * proprio telefono** (D-102, D-115). Un flag di coppia sul server farebbe si'
 * che chi apre per primo lo consumi per entrambi, e l'altro non vedrebbe mai
 * la cosa che gli spetta. Quindi AsyncStorage, con la chiave per utente:
 * sullo stesso telefono possono entrare persone diverse.
 *
 * ⚠️ **Se la memoria locale non risponde si prosegue senza.** Al massimo si
 * perde una festa o si rivede un'evoluzione: nessuna delle due merita di
 * bloccare la schermata di casa.
 */

export type Stadio = 1 | 2 | 3;

export type StatoCreatura = {
  /** I punti veri della coppia. */
  punti: number;
  /** Derivato dai punti e dalle soglie, mai memorizzato. */
  stadio: Stadio;
  /** Quanti punti servivano per lo stadio attuale. */
  sogliaAttuale: number;
  /** Quanti ne servono per il prossimo, o `null` se e' l'ultimo. */
  sogliaProssima: number | null;
  /** 0..1 verso il prossimo stadio. Vale 1 quando non c'e' un prossimo. */
  quota: number;
  loading: boolean;
  /** Non lo sappiamo: si dice, non si finge uno zero (B-03). */
  errore: string | null;
};

const vuoto: StatoCreatura = {
  punti: 0,
  stadio: 1,
  sogliaAttuale: 0,
  sogliaProssima: null,
  quota: 1,
  loading: true,
  errore: null,
};

/** Cosa questo dispositivo ha gia' mostrato a questa persona. */
type Visto = { punti: number; stadio: Stadio };

const chiave = (utenteId: string) => `lifecouple.creatura-vista.${utenteId}`;

async function leggiVisto(utenteId: string): Promise<Visto | null> {
  try {
    const grezzo = await AsyncStorage.getItem(chiave(utenteId));
    if (!grezzo) return null;
    const v = JSON.parse(grezzo) as Partial<Visto>;
    if (typeof v.punti !== 'number' || typeof v.stadio !== 'number') return null;
    return { punti: v.punti, stadio: Math.min(3, Math.max(1, v.stadio)) as Stadio };
  } catch {
    return null;
  }
}

async function scriviVisto(utenteId: string, v: Visto) {
  try {
    await AsyncStorage.setItem(chiave(utenteId), JSON.stringify(v));
  } catch {
    /* vedi la nota in testa: si prosegue senza. */
  }
}

export type Soglia = { stadio: number; punti_minimi: number };

/**
 * **Da quanti punti a cosa si vede.** Pura: nessuna rete, nessuno stato.
 *
 * E' la funzione che decide **quale delle tre creature guardi**, quindi vive
 * fuori dall'hook e ha un test suo (`tests/creatura.mjs`). Un errore qui non
 * si presenterebbe come un errore: si presenterebbe come la creatura sbagliata,
 * e nessuno saprebbe che e' sbagliata.
 *
 * ⚠️ **Non si fida dell'ordine delle righe** e **non si fida dei numeri di
 * stadio**: la tabella `stadio_soglia` e' fatta per essere ritarata a mano
 * senza migrazione (0001, ritarata dalla 0033), quindi puo' benissimo tornare
 * disordinata o contenere ancora uno stadio 4 di una taratura vecchia. Una
 * funzione che assume tre righe ordinate e' una funzione che si rompe la prima
 * volta che qualcuno tara le soglie da un pannello.
 */
export function derivaStadio(punti: number, soglie: Soglia[]) {
  const valide = soglie
    .filter((r) => r.stadio >= 1 && r.stadio <= 3 && Number.isFinite(r.punti_minimi))
    .sort((a, b) => a.punti_minimi - b.punti_minimi);

  let stadio: Stadio = 1;
  let sogliaAttuale = 0;
  for (const r of valide) {
    if (punti >= r.punti_minimi && r.stadio >= stadio) {
      stadio = r.stadio as Stadio;
      sogliaAttuale = r.punti_minimi;
    }
  }

  const prossima = valide.find((r) => r.stadio === stadio + 1);
  const sogliaProssima = prossima ? prossima.punti_minimi : null;

  // ⚠️ `quota` vale 1 quando non c'e' un prossimo stadio: la barra piena dice
  // «e' cresciuta del tutto», che e' vero. Una barra vuota direbbe il
  // contrario di cio' che e' successo.
  const spazio = sogliaProssima === null ? 0 : sogliaProssima - sogliaAttuale;
  const quota =
    sogliaProssima === null || spazio <= 0
      ? 1
      : Math.min(1, Math.max(0, (punti - sogliaAttuale) / spazio));

  return { stadio, sogliaAttuale, sogliaProssima, quota };
}

export function useCreatura(coppiaId: string | null, utenteId: string | undefined) {
  const [stato, setStato] = React.useState<StatoCreatura>(vuoto);
  /** Le soglie non cambiano durante una sessione: si leggono una volta. */
  const soglie = React.useRef<{ stadio: number; punti_minimi: number }[] | null>(null);

  /**
   * I due momenti in sospeso. `null` = niente da mostrare.
   *
   * ⚠️ Non sono `useState` uniti allo stato dei punti apposta: i punti si
   * aggiornano anche quando non c'e' niente da festeggiare (primo caricamento,
   * ricarica al focus), e legarli renderebbe impossibile distinguere «e'
   * cambiato» da «l'ho appena letto».
   */
  const [festaInSospeso, setFestaInSospeso] = React.useState(false);
  const [evoluzioneInSospeso, setEvoluzioneInSospeso] = React.useState(false);

  /**
   * Il riferimento di cio' che questo dispositivo ha gia' mostrato.
   *
   * ⚠️ Vive in un ref e non in uno stato perche' viene letto **dentro** la
   * ricarica: uno stato lo renderebbe una dipendenza di `ricarica`, e ogni
   * festa mostrata ne farebbe partire una nuova.
   */
  const visto = React.useRef<Visto | null>(null);
  /** Il primo caricamento non festeggia: vedi `ricarica`. */
  const primoGiro = React.useRef(true);

  /**
   * Lo stadio che questo dispositivo ha gia' **mostrato**, come stato.
   *
   * 🔴 Serve perche' chi disegna deve poter continuare a mostrare quello
   * **vecchio** finche' non c'e' un momento buono per l'evoluzione. Senza,
   * il disegno cambierebbe appena i dati arrivano — cioe' magari mentre si sta
   * giocando, con la schermata di casa montata ma non guardata — e il momento
   * che si vede due volte in tutta la vita della creatura si consumerebbe
   * davanti a nessuno (D-115).
   */
  const [stadioVisto, setStadioVisto] = React.useState<Stadio>(1);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId || !utenteId) {
      setStato({ ...vuoto, loading: false });
      return;
    }

    if (visto.current === null) visto.current = await leggiVisto(utenteId);

    const [creatura, soglieLette] = await Promise.all([
      supabase.from('creatura').select('punti').eq('coppia_id', coppiaId).maybeSingle(),
      soglie.current
        ? Promise.resolve({ data: soglie.current, error: null })
        : supabase.from('stadio_soglia').select('stadio, punti_minimi').order('stadio'),
    ]);

    if (creatura.error) {
      setStato((p) => ({ ...p, loading: false, errore: creatura.error!.message }));
      return;
    }
    if (soglieLette.data) soglie.current = soglieLette.data;

    const righe = soglie.current ?? [{ stadio: 1, punti_minimi: 0 }];
    const punti = creatura.data?.punti ?? 0;
    const { stadio, sogliaAttuale, sogliaProssima, quota } = derivaStadio(punti, righe);

    setStato({ punti, stadio, sogliaAttuale, sogliaProssima, quota, loading: false, errore: null });

    /**
     * ⚠️ **Il primo giro non festeggia mai.** Alla prima apertura su un
     * dispositivo nuovo non c'e' un «visto» da confrontare, e prendere il
     * punteggio accumulato in mesi per una novita' farebbe partire una festa
     * per qualcosa successo a marzo. Si prende nota e basta.
     */
    if (primoGiro.current) {
      primoGiro.current = false;
      if (visto.current === null) {
        visto.current = { punti, stadio };
        setStadioVisto(stadio);
        await scriviVisto(utenteId, visto.current);
        return;
      }
      setStadioVisto(visto.current.stadio);
    }

    const prima = visto.current ?? { punti, stadio };
    if (stadio > prima.stadio) setEvoluzioneInSospeso(true);
    else if (punti > prima.punti) setFestaInSospeso(true);
    // ⚠️ `else if`: quando si sale di stadio i punti sono cresciuti per forza,
    // e mettere in coda anche la festa farebbe partire due momenti uno sopra
    // l'altro. L'evoluzione e' la piu' rara delle due e vince.
  }, [coppiaId, utenteId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  /**
   * Il canale in tempo reale (0034).
   *
   * 🔑 Serve per l'azione **dell'altro**: la tua la scopriresti ricaricando,
   * la sua succede su un altro telefono. E' quello che rende vera la promessa
   * di D-102 — *se e' il partner a segnare un luogo, la festa la vedi tu*.
   */
  React.useEffect(() => {
    if (!coppiaId) return;
    const canale: RealtimeChannel = supabase
      .channel(`creatura:${coppiaId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creatura',
          filter: `coppia_id=eq.${coppiaId}`,
        },
        () => {
          ricarica();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canale);
    };
  }, [coppiaId, ricarica]);

  const segnaFestaVista = React.useCallback(async () => {
    setFestaInSospeso(false);
    if (!utenteId) return;
    visto.current = { punti: stato.punti, stadio: stato.stadio };
    await scriviVisto(utenteId, visto.current);
  }, [utenteId, stato.punti, stato.stadio]);

  const segnaEvoluzioneVista = React.useCallback(async () => {
    setEvoluzioneInSospeso(false);
    setStadioVisto(stato.stadio);
    if (!utenteId) return;
    visto.current = { punti: stato.punti, stadio: stato.stadio };
    await scriviVisto(utenteId, visto.current);
  }, [utenteId, stato.punti, stato.stadio]);

  /**
   * «Adesso si puo' mostrare l'evoluzione»: chi disegna lo chiama quando la
   * schermata e' davvero davanti agli occhi. Da qui in poi `stadioVisto`
   * combacia con `stadio`, e il cambio del valore e' cio' che fa partire il
   * momento nel componente del disegno.
   */
  const mostraEvoluzione = React.useCallback(() => {
    setStadioVisto(stato.stadio);
  }, [stato.stadio]);

  return {
    ...stato,
    /** Lo stadio da **disegnare**: resta indietro finche' non e' il momento. */
    stadioVisto,
    festaInSospeso,
    evoluzioneInSospeso,
    mostraEvoluzione,
    segnaFestaVista,
    segnaEvoluzioneVista,
    ricarica,
  };
}
