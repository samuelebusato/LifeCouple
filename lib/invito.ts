import * as React from 'react';
import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

/**
 * Ciclo di vita dell'invito, condiviso fra onboarding e home.
 *
 * Sta qui e non dentro una schermata perche' da quando l'invito non blocca
 * piu' l'ingresso (D-25) la **conferma** dev'essere raggiungibile anche
 * dall'app: e' il passo che, delle quattro condizioni di D-14, interrompe
 * davvero l'ingresso di un estraneo che ha aperto un link inoltrato. Se
 * vivesse solo nell'onboarding, chi entra da solo non potrebbe piu' confermare.
 */
export function useInvito(attivo: boolean, alConfermato?: () => void | Promise<void>) {
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
    await Share.share({ message: t.onboarding.messaggioCondivisione(da_usare) });
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
