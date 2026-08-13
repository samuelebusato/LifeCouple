import * as React from 'react';
import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import type { StatoCoppia } from '@/lib/coppia';
import { t } from '@/lib/i18n';

/**
 * Garantisce che lo spazio esista prima di un gesto che lo richiede.
 *
 * Da quando si puo' entrare senza creare niente, "Invita il partner" puo'
 * capitare a chi una coppia non ce l'ha: senza questo passo la chiamata
 * fallirebbe con "non sei in una coppia", che per chi legge e' un errore
 * incomprensibile davanti a un bottone che l'app gli ha appena offerto.
 */
export async function assicuraCoppia(
  coppiaId: string | null,
  ricarica: () => Promise<StatoCoppia>
): Promise<{ coppiaId: string | null; errore: string | null }> {
  if (coppiaId) return { coppiaId, errore: null };

  const { error } = await supabase.rpc('crea_coppia');
  // Si rilegge comunque, anche dopo un errore: il caso piu' probabile e' "sei
  // gia' in una coppia" (due tocchi ravvicinati), e guardare com'e' finita e'
  // piu' solido che riconoscere il testo di un messaggio d'errore.
  const stato = await ricarica();
  if (stato.coppiaId) return { coppiaId: stato.coppiaId, errore: null };
  return {
    coppiaId: null,
    errore: stato.errore ?? error?.message ?? t.coppia.erroreSpazio,
  };
}

/**
 * Ciclo di vita dell'invito, condiviso fra onboarding e home.
 *
 * Sta qui e non dentro una schermata perche' da quando l'invito non blocca
 * piu' l'ingresso (D-25) la **conferma** dev'essere raggiungibile anche
 * dall'app: e' il passo che, delle quattro condizioni di D-14, interrompe
 * davvero l'ingresso di un estraneo che ha aperto un link inoltrato. Se
 * vivesse solo nell'onboarding, chi entra da solo non potrebbe piu' confermare.
 */
export function useInvito(attivo: boolean, alConfermato?: () => unknown | Promise<unknown>) {
  const [link, setLink] = React.useState<string | null>(null);
  const [invitoApertoId, setInvitoApertoId] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);

  /** Genera un nuovo token (scade i precedenti: un solo invito vivo). */
  const creaLink = React.useCallback(async () => {
    setErrore(null);
    setAttesa(true);
    const { data: token, error } = await supabase.rpc('crea_invito');
    setAttesa(false);
    if (error) {
      setErrore(error.message);
      return null;
    }
    const l = Linking.createURL(`/invito/${token}`);
    setLink(l);
    return l;
  }, []);

  const condividi = React.useCallback(async (l?: string) => {
    const da_usare = l ?? link;
    if (!da_usare) return;
    try {
      await Share.share({ message: t.onboarding.messaggioCondivisione(da_usare) });
    } catch {
      // Il foglio di condivisione non c'e' (browser) o e' stato chiuso male.
      // Il token e' gia' stato creato: si mostra, cosi' resta copiabile a mano
      // invece di lasciare l'utente con un bottone che non fa niente.
      setErrore(t.onboarding.condivisioneNonRiuscita);
    }
  }, [link]);

  // Qualcuno ha aperto il link? Finche' la coppia non e' completa, si guarda.
  React.useEffect(() => {
    if (!attivo) return;
    const id = setInterval(async () => {
      const { data } = await supabase
        .from('invito')
        .select('id, stato')
        .eq('stato', 'aperto_in_attesa_conferma')
        .limit(1);
      setInvitoApertoId(data?.[0]?.id ?? null);
    }, 3000);
    return () => clearInterval(id);
  }, [attivo]);

  const conferma = React.useCallback(async () => {
    if (!invitoApertoId) return;
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.rpc('conferma_invito', { p_invito_id: invitoApertoId });
    setAttesa(false);
    if (error) return setErrore(error.message);
    setInvitoApertoId(null);
    await alConfermato?.();
  }, [invitoApertoId, alConfermato]);

  return { link, creaLink, condividi, invitoApertoId, conferma, attesa, errore, setErrore };
}
