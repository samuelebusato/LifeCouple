import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * **Le date di nascita della coppia**, e il compleanno sul calendario (0032).
 *
 * 🔑 Il compleanno **non è un evento salvato**: è un confronto fra giorno e
 * mese, fatto al volo mentre il calendario disegna. La ragione sta nella
 * migrazione — un evento vale per un giorno solo, un compleanno torna ogni anno,
 * e salvarne uno per anno significherebbe una collezione che cresce per sempre e
 * va tenuta in sincronia con un dato che sta altrove. Così invece funziona per
 * ogni anno passato e futuro senza che nessuno crei niente, e correggere la data
 * corregge tutti gli anni insieme.
 *
 * È lo stesso principio del cuoricino: un segno che si **calcola**, non che si
 * conserva.
 */

/** L'età minima del servizio: 14 anni, art. 8 GDPR nell'ordinamento italiano. */
export const ETA_MINIMA = 14;

export type Compleanno = {
  utenteId: string;
  /** `AAAA-MM-GG`. */
  data: string;
  /** È la propria data, o quella del partner. */
  mia: boolean;
};

/**
 * Gli anni compiuti a una certa data.
 *
 * ⚠️ Si conta sui **giorni civili** e si sottrae un anno se il compleanno di
 * quest'anno non è ancora arrivato: `differenza di anni` da sola darebbe 14 a
 * chi li compie fra sei mesi, cioè farebbe entrare un tredicenne il primo
 * gennaio dell'anno in cui compie gli anni.
 */
export function anniCompiuti(dataNascita: string, oggi = new Date()): number | null {
  const [a, m, g] = dataNascita.split('-').map(Number);
  if (!a || !m || !g) return null;
  let anni = oggi.getFullYear() - a;
  const compiutoQuestAnno =
    oggi.getMonth() + 1 > m || (oggi.getMonth() + 1 === m && oggi.getDate() >= g);
  if (!compiutoQuestAnno) anni -= 1;
  return anni;
}

/**
 * Chi compie gli anni in questo giorno, fra i due della coppia.
 *
 * ⚠️ **Il confronto include l'anno, e non è pignoleria** (B-54): guardando solo
 * giorno e mese la torta compariva anche nel **1975**, cioè su compleanni che
 * non sono mai esistiti perché nessuno dei due era nato. Il calendario si scorre
 * indietro quanto si vuole, quindi quel caso non è teorico: basta arrivarci.
 *
 * 🔑 **L'anno di nascita è compreso**: il giorno in cui si è nati è un giorno da
 * segnare — tecnicamente non è un *compleanno*, ma è il primo di quella serie e
 * lasciarlo fuori sarebbe una precisione che non serve a nessuno.
 */
export function compleanniDelGiorno(d: Date, compleanni: Compleanno[]): Compleanno[] {
  const anno = d.getFullYear();
  const mese = d.getMonth() + 1;
  const giorno = d.getDate();
  return compleanni.filter((c) => {
    const [a, m, g] = c.data.split('-').map(Number);
    return m === mese && g === giorno && anno >= a;
  });
}

/**
 * Il mese contiene un compleanno: serve alla vista anno.
 *
 * 🔑 **Non si ferma a oggi**, e qui sta la differenza col cuoricino: un
 * compleanno cade in quel mese **ogni** anno, anche nei prossimi, mentre il
 * cuore racconta giorni **vissuti** e si arresta. Un compleanno futuro arriverà
 * comunque.
 *
 * ⚠️ **Ma non va nemmeno all'indietro senza limite** (B-54): prima dell'anno di
 * nascita non c'è nessun compleanno da segnare, e la prima versione lo faceva —
 * la torta compariva anche nel 1975.
 */
export function meseConCompleanno(mese: Date, compleanni: Compleanno[]): boolean {
  const anno = mese.getFullYear();
  const m = mese.getMonth() + 1;
  return compleanni.some((c) => {
    const [a, mm] = c.data.split('-').map(Number);
    return mm === m && anno >= a;
  });
}

/** Le date di nascita leggibili: la propria e — se c'è — quella del partner. */
export function useCompleanni() {
  const { session } = useAuth();
  const [compleanni, setCompleanni] = React.useState<Compleanno[]>([]);

  const ricarica = React.useCallback(async () => {
    if (!session) {
      setCompleanni([]);
      return;
    }
    // Nessun filtro: ci pensa la RLS a restituire solo se stessi e il partner.
    const { data, error } = await supabase
      .from('profilo_utente')
      .select('utente_id, data_nascita');
    if (error) return;
    setCompleanni(
      (data ?? [])
        .filter((r) => !!r.data_nascita)
        .map((r) => ({
          utenteId: r.utente_id,
          data: r.data_nascita as string,
          mia: r.utente_id === session.user.id,
        }))
    );
  }, [session]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { compleanni, ricarica };
}

/** Salva la propria data di nascita. Restituisce l'errore, o `null`. */
export async function salvaDataNascita(
  utenteId: string,
  data: string | null
): Promise<string | null> {
  const { error } = await supabase.from('profilo_utente').upsert(
    { utente_id: utenteId, data_nascita: data, aggiornato_il: new Date().toISOString() },
    { onConflict: 'utente_id' }
  );
  return error?.message ?? null;
}
