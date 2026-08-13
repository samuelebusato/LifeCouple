import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Stato di appaiamento dell'utente corrente.
 *
 * Tre informazioni distinte, e la distinzione conta (D-25):
 *   - `coppiaId` dice se lo spazio **esiste**;
 *   - `completa` dice se il partner e' gia' dentro, e decide quali funzioni
 *     sono utilizzabili. Chi e' da solo entra lo stesso;
 *   - `errore` dice che **non lo sappiamo**, che non e' la stessa cosa di
 *     "non c'e'". Senza questa terza voce una query fallita (rete del
 *     telefono, token scaduto) si traveste da "non hai una coppia": l'app
 *     annuncia uno spazio che non c'e' e offre gesti che falliranno.
 *
 * La policy `membro_select` lascia vedere entrambi i membri della propria
 * coppia, quindi il conteggio si fa con la sola chiave anonima.
 */
export type StatoCoppia = {
  coppiaId: string | null;
  completa: boolean;
  /** Data da cui si sta insieme (`AAAA-MM-GG`), scelta quando la coppia si forma. */
  insiemeDal: string | null;
  errore: string | null;
};

export function useCoppia() {
  const { session } = useAuth();
  const [stato, setStato] = React.useState<StatoCoppia>({
    coppiaId: null,
    completa: false,
    insiemeDal: null,
    errore: null,
  });
  const [loading, setLoading] = React.useState(true);
  // Solo la **prima** lettura e' un'attesa a schermo intero. Le successive
  // aggiornano in silenzio: rimettere `loading` a true smonterebbe la
  // schermata sotto le dita di chi ha appena toccato un bottone, e con essa
  // il link d'invito appena generato.
  const primaLettura = React.useRef(true);

  /** Rilegge lo stato e lo **restituisce**: chi chiama puo' decidere subito,
   *  senza aspettare il giro di render (serve a "invita" che crea al volo). */
  const ricarica = React.useCallback(async (): Promise<StatoCoppia> => {
    if (!session) {
      const vuoto = { coppiaId: null, completa: false, insiemeDal: null, errore: null };
      setStato(vuoto);
      primaLettura.current = true;
      setLoading(false);
      return vuoto;
    }
    if (primaLettura.current) setLoading(true);
    const { data, error } = await supabase
      .from('membro_coppia')
      .select('coppia_id, utente_id')
      .is('uscito_il', null);

    let nuovo: StatoCoppia;
    if (error) {
      // Lettura fallita: si tiene quel che si sapeva e si dichiara il guasto.
      nuovo = { coppiaId: null, completa: false, insiemeDal: null, errore: error.message };
    } else {
      const mia = data?.find((r) => r.utente_id === session.user.id) ?? null;
      // Seconda lettura solo se c'e' una coppia: la riga porta la data da cui
      // si sta insieme, che serve al contatore in home.
      const { data: riga } = mia
        ? await supabase.from('coppia').select('insieme_dal').eq('id', mia.coppia_id).maybeSingle()
        : { data: null };
      nuovo = {
        coppiaId: mia?.coppia_id ?? null,
        completa: !!mia && data!.filter((r) => r.coppia_id === mia.coppia_id).length >= 2,
        insiemeDal: riga?.insieme_dal ?? null,
        errore: null,
      };
    }
    setStato(nuovo);
    primaLettura.current = false;
    setLoading(false);
    return nuovo;
  }, [session]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { ...stato, loading, ricarica };
}
