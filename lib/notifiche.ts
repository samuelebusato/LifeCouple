// =============================================================================
// notifiche — il permesso, il token del dispositivo e i consensi
//
// Qui NON si manda niente. L'invio lo fa una Edge Function, perché serve la
// chiave `service_role` per leggere i token di una persona diversa da chi
// scatena l'evento: chi segna un posto non può, e non deve, poter leggere i
// dispositivi del partner (policy di 0038, confine TB-2).
//
// 🔑 Le tre notifiche non sono la stessa cosa, e il codice lo rispecchia:
//    `luogo_del_partner` e `ricordi` raccontano qualcosa che la coppia ha
//    fatto — sono di servizio, e nascono accese. `inviti_a_tornare` è un
//    sollecito a usare il prodotto, cioè promozionale: nasce **spento** e si
//    accende con un gesto. Il default sta nella migrazione 0038, non qui, ma
//    va saputo leggendo questo file.
//
// ⚠️ Nessuna di esse usa la posizione. «Il partner ha segnato un posto» nasce
//    da una riga scritta da una persona, non dal telefono che si accorge di
//    essere da qualche parte: `threat-model.md` §3 elenca «niente posizione in
//    background» fra le mitigazioni implementate contro l'intimate partner
//    surveillance, e `app.json` disattiva `locationAlwaysPermission` di
//    proposito. Il geofencing sarebbe un'altra funzione, e un'altra decisione.
// =============================================================================

import * as React from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { lingua } from '@/lib/i18n';

/** I tre tipi, con gli stessi nomi delle colonne di `preferenze_notifiche`. */
export type TipoNotifica = 'luogo_del_partner' | 'ricordi' | 'inviti_a_tornare';

export type Preferenze = Record<TipoNotifica, boolean>;

/**
 * I valori che valgono per chi non ha mai toccato niente. ⚠️ Devono restare
 * identici ai `default` della migrazione 0038: se divergono, l'interfaccia
 * mostra uno stato e il server ne applica un altro — e la differenza si
 * scoprirebbe solo da una notifica arrivata a chi non la voleva.
 */
export const PREFERENZE_INIZIALI: Preferenze = {
  luogo_del_partner: true,
  ricordi: true,
  inviti_a_tornare: false,
};

/**
 * Come si comporta una notifica che arriva ad app aperta.
 * Nessun suono: sono ricordi e cortesie, non allarmi.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** L'id del progetto EAS, che il servizio push di Expo pretende. */
function idProgetto(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

export type EsitoRegistrazione =
  | { stato: 'registrato'; token: string }
  | { stato: 'negato' }
  | { stato: 'non-supportato'; motivo: string };

/**
 * Chiede il permesso e registra il dispositivo.
 *
 * 🔑 **Chiama questa funzione solo dopo che la persona ha capito perché.** Il
 * permesso si chiede **una volta sola**: se lo nega, iOS non ripropone il
 * dialogo e l'unica strada resta le impostazioni di sistema. Chiederlo
 * all'avvio, prima che ci sia qualcosa da notificare, è il modo più efficace
 * di perdere la possibilità di chiederlo quando serve davvero.
 */
export async function registraDispositivo(): Promise<EsitoRegistrazione> {
  // ⚠️ Su un simulatore non esiste nessun token: senza questo controllo la
  // chiamata fallisce con un errore che sembra un difetto e non lo è.
  if (!Device.isDevice) {
    return { stato: 'non-supportato', motivo: 'simulatore' };
  }
  if (Platform.OS === 'web') {
    return { stato: 'non-supportato', motivo: 'web' };
  }

  const { status: gia } = await Notifications.getPermissionsAsync();
  let stato = gia;
  if (stato !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    stato = status;
  }
  if (stato !== 'granted') return { stato: 'negato' };

  const progetto = idProgetto();
  if (!progetto) return { stato: 'non-supportato', motivo: 'projectId assente' };

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: progetto,
  });

  const { data: sessione } = await supabase.auth.getUser();
  const utente = sessione.user?.id;
  if (!utente) return { stato: 'non-supportato', motivo: 'nessuna sessione' };

  // `upsert` sul token e non sull'utente: la stessa persona può avere più
  // telefoni, e lo stesso telefono può cambiare proprietario. Il vincolo di
  // unicità sta sul token (0038), quindi è quello il conflitto da risolvere —
  // e riassegnare `utente_id` è esattamente il comportamento giusto quando un
  // telefono passa di mano.
  // 🔑 `lingua` viaggia insieme al token, e non è un dettaglio: il testo delle
  // notifiche lo compone il **server**, perché quando arrivano l'app non è in
  // esecuzione. Senza questa colonna scriverebbe in inglese a tutti, e la cosa
  // si scoprirebbe solo ricevendo la prima notifica — cioè dopo la
  // pubblicazione. Sta sul dispositivo perché il locale è del telefono: la
  // stessa persona con due telefoni impostati diversamente riceve ciascuno
  // nella sua lingua (0039).
  const { error } = await supabase.from('dispositivo').upsert(
    {
      utente_id: utente,
      token,
      piattaforma: Platform.OS === 'ios' ? 'ios' : 'android',
      lingua,
      visto_il: new Date().toISOString(),
    },
    { onConflict: 'token' }
  );
  if (error) return { stato: 'non-supportato', motivo: error.message };

  return { stato: 'registrato', token };
}

/**
 * Toglie questo telefono. È il modo di dire «su questo dispositivo basta»
 * senza spegnere le preferenze: chi ha due telefoni può volerne solo uno.
 */
export async function dimenticaDispositivo(token: string): Promise<string | null> {
  const { error } = await supabase.from('dispositivo').delete().eq('token', token);
  return error?.message ?? null;
}

/**
 * Legge e scrive i consensi.
 *
 * ⚠️ La riga può non esistere: chi non ha mai toccato niente non ne ha una, e
 * in quel caso valgono i default. Trattare l'assenza come «tutto spento»
 * spegnerebbe due notifiche di servizio senza che nessuno l'abbia chiesto;
 * trattarla come «tutto acceso» accenderebbe quella promozionale senza
 * consenso, che è il difetto peggiore dei due.
 */
export function usePreferenzeNotifiche() {
  const [preferenze, setPreferenze] = React.useState<Preferenze>(PREFERENZE_INIZIALI);
  const [loading, setLoading] = React.useState(true);
  const [errore, setErrore] = React.useState<string | null>(null);

  const ricarica = React.useCallback(async () => {
    const { data: sessione } = await supabase.auth.getUser();
    const utente = sessione.user?.id;
    if (!utente) {
      setPreferenze(PREFERENZE_INIZIALI);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('preferenze_notifiche')
      .select('luogo_del_partner, ricordi, inviti_a_tornare')
      .eq('utente_id', utente)
      .maybeSingle();

    setErrore(error?.message ?? null);
    setPreferenze(
      data
        ? {
            luogo_del_partner: data.luogo_del_partner,
            ricordi: data.ricordi,
            inviti_a_tornare: data.inviti_a_tornare,
          }
        : PREFERENZE_INIZIALI
    );
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void ricarica();
  }, [ricarica]);

  const cambia = React.useCallback(
    async (tipo: TipoNotifica, acceso: boolean): Promise<string | null> => {
      const { data: sessione } = await supabase.auth.getUser();
      const utente = sessione.user?.id;
      if (!utente) return 'nessuna-sessione';

      // Ottimistico: l'interruttore deve rispondere subito al dito. Se la
      // scrittura fallisce si rimette com'era — mostrare acceso qualcosa che
      // il server considera spento è la bugia peggiore di questa schermata.
      const prima = preferenze;
      setPreferenze({ ...preferenze, [tipo]: acceso });

      const { error } = await supabase.from('preferenze_notifiche').upsert(
        {
          utente_id: utente,
          ...preferenze,
          [tipo]: acceso,
          aggiornate_il: new Date().toISOString(),
        },
        { onConflict: 'utente_id' }
      );
      if (error) {
        setPreferenze(prima);
        return error.message;
      }
      return null;
    },
    [preferenze]
  );

  return { preferenze, loading, errore, cambia, ricarica };
}
