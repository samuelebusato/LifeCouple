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
  /**
   * 🔴 **`loading` dell'auth serve, e non guardarlo era un difetto** (2026-09-06).
   *
   * Fra l'avvio dell'app e il `getSession()` che si risolve, `session` e'
   * `null` — ma «non c'e' una sessione» e «non la sappiamo ancora» sono due
   * cose diverse, ed e' precisamente la distinzione che il commento in cima a
   * questo file dichiara di aver fatto. Era stata applicata all'**errore** e
   * dimenticata sull'**attesa**: senza questa riga la lettura concludeva
   * «nessuna coppia» *e si dichiarava pronta*, e la home offriva di creare uno
   * spazio a chi ne aveva gia' uno.
   *
   * ⚠️ Il difetto e' sempre esistito ed era intermittente: dipende da quanto
   * dura quella finestra. Si e' visto quando la creatura ha aggiunto due query
   * e un canale al primo render, allargandola quanto bastava — *un difetto di
   * tempistica non si presenta quando lo si introduce, si presenta quando
   * qualcos'altro rallenta abbastanza.*
   */
  const { session, loading: autenticazioneInCorso } = useAuth();
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

    // 🔎 **Solo in sviluppo, e ridotta all'osso.** La sonda del 2026-09-15
    // stampava anche l'email e le righe per intero: serviva a distinguere
    // «la riga non c'è» da «la RLS la nasconde» da «è connesso un altro
    // utente», e quella diagnosi è chiusa. ⚠️ *Le righe contengono
    // identificativi di entrambi i membri della coppia: non è roba da lasciare
    // in un log a ogni lettura.*
    if (__DEV__) {
      console.log(
        '[coppia]',
        JSON.stringify({
          righeVisibili: data?.length ?? 0,
          errore: error ? error.message : null,
        })
      );
    }

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
    // Non si conclude niente finche' l'auth non ha finito: una lettura fatta
    // con `session` ancora nulla direbbe «nessuna coppia» a chi ce l'ha.
    if (autenticazioneInCorso) return;
    ricarica();
  }, [ricarica, autenticazioneInCorso]);

  // ⚠️ E l'attesa dell'auth **e'** attesa anche per chi legge questo hook: chi
  // mostra una schermata deve vedere `loading: true` finche' non lo sappiamo,
  // o disegnera' lo stato sbagliato nel frattempo.
  return { ...stato, loading: loading || autenticazioneInCorso, ricarica };
}
