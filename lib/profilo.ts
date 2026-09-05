import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * **Il questionario di profilo della coppia** — lettura, salvataggio, revoca.
 *
 * Il perché di questa funzione, e perché è l'unica del progetto con base
 * giuridica «consenso» invece che «contratto», sta per esteso nella migrazione
 * `0029_questionario_profilo.sql`. Qui vale la conseguenza pratica: **niente in
 * questo file deve poter salvare qualcosa senza un gesto esplicito**. Non c'è
 * un salvataggio automatico mentre si risponde, non c'è un invio parziale al
 * cambio di schermata: si salva quando si preme il bottone, e basta.
 */

export type Profilo = {
  conosciutoDa: string | null;
  fasciaEta: string | null;
  convivenza: string | null;
  interesse: string | null;
};

/** Le risposte ammesse. Devono restare allineate ai `check` della migrazione 0029. */
export const OPZIONI = {
  conosciutoDa: ['store', 'amici', 'social', 'ricerca', 'altro'],
  fasciaEta: ['14-17', '18-24', '25-34', '35-44', '45+'],
  convivenza: ['insieme', 'separati', 'distanza'],
  interesse: ['ricordi', 'organizzarsi', 'giocare'],
} as const;

export type Domanda = keyof typeof OPZIONI;
export const DOMANDE = Object.keys(OPZIONI) as Domanda[];

/**
 * «Non adesso» vive nel **dispositivo**, non nel database.
 *
 * 🔑 È la stessa scelta di `useIngressoRimandato`, e per la stessa ragione: un
 * rifiuto non è un dato della coppia, è una preferenza di chi sta guardando lo
 * schermo. Scriverlo nel database significherebbe **registrare qualcosa su chi
 * ha appena detto di no**, che è precisamente il contrario di ciò che ha
 * chiesto. Chi cambia idea lo ritrova nelle impostazioni.
 */
const chiaveRimando = (utenteId: string) => `lifecouple.questionario-rimandato.${utenteId}`;

export function useQuestionarioRimandato(utenteId: string | undefined) {
  const [rimandato, setRimandato] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let vivo = true;
    if (!utenteId) {
      setRimandato(false);
      setLoading(false);
      return;
    }
    AsyncStorage.getItem(chiaveRimando(utenteId))
      .then((v) => vivo && setRimandato(v === '1'))
      // Se la memoria locale non risponde si prosegue senza: al massimo
      // ricompare un invito che si può ignorare.
      .catch(() => vivo && setRimandato(false))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [utenteId]);

  const rimanda = React.useCallback(async () => {
    setRimandato(true);
    if (utenteId) await AsyncStorage.setItem(chiaveRimando(utenteId), '1').catch(() => {});
  }, [utenteId]);

  return { rimandato, loading, rimanda };
}

/**
 * Le risposte già date dalla coppia, o `null` se non ne ha date.
 *
 * ⚠️ `null` e "non lo so" restano **distinti** anche qui — è la lezione di B-03
 * portata su questa tabella: se la lettura fallisce, `errore` lo dice e
 * l'invito **non** compare. Un invito a rifare un questionario già fatto,
 * mostrato per un errore di rete, è un'app che dà dell'immemore all'utente.
 */
export function useProfilo() {
  const { session } = useAuth();
  const [profilo, setProfilo] = React.useState<Profilo | null>(null);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!session) {
      setProfilo(null);
      setErrore(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profilo_coppia')
      .select('conosciuto_da, fascia_eta, convivenza, interesse')
      .maybeSingle();
    if (error) {
      setErrore(error.message);
      setProfilo(null);
    } else {
      setErrore(null);
      setProfilo(
        data
          ? {
              conosciutoDa: data.conosciuto_da,
              fasciaEta: data.fascia_eta,
              convivenza: data.convivenza,
              interesse: data.interesse,
            }
          : null
      );
    }
    setLoading(false);
  }, [session]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { profilo, errore, loading, ricarica };
}

/** Salva le risposte. Chiamarla **è** l'atto di consenso: vedi la 0029. */
export async function salvaProfilo(r: Partial<Profilo>): Promise<string | null> {
  const { error } = await supabase.rpc('salva_profilo_coppia', {
    p_conosciuto_da: r.conosciutoDa ?? null,
    p_fascia_eta: r.fasciaEta ?? null,
    p_convivenza: r.convivenza ?? null,
    p_interesse: r.interesse ?? null,
  });
  return error?.message ?? null;
}

/** Revoca il consenso cancellando le risposte (art. 7.3). */
export async function cancellaProfilo(): Promise<string | null> {
  const { error } = await supabase.rpc('cancella_profilo_coppia');
  return error?.message ?? null;
}
