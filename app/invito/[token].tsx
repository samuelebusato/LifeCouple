// =============================================================================
// La porta d'ingresso di un invito toccato da fuori.
//   lifecouple://invito/<token>
//   https://lifecouple.heleox.it/invito/<token>   ← quello che conta
//
// ## Perché non esisteva fino al 2026-09-15
//
// Il messaggio d'invito dice *«Apri questo link»* da sempre, e **il link non
// aveva dove atterrare**: `app/invito/` non esisteva. Chi lo toccava apriva
// l'app sulla home, senza un motivo apparente.
//
// 🔑 **Il nodo non era la route, era l'ordine dei fatti.** Chi riceve un invito
//    quasi sempre **non ha ancora un account**: tocca il link, e la prima cosa
//    che deve fare è registrarsi. Una route che chiamasse `apri_invito` subito
//    fallirebbe per tutti tranne che per chi era già dentro — cioè per quasi
//    nessuno. *È il motivo per cui il 2026-08-13 si era scritto «non ancora
//    deciso come risolverlo» e non si era più ripreso.*
//
// La risposta è che il token **aspetta**: `salvaInvitoInAttesa` lo tiene da
// parte, l'onboarding lo riprende quando una sessione finalmente c'è.
//
// ## ⚠️ Questa schermata non conferma niente, e non è una semplificazione
//
// L'invito è **a due mani** per costruzione (`0003`): B lo *apre*, A lo
// *conferma*. Qui si fa solo la prima metà. 🔑 *Una route che unisse due
// account perché qualcuno ha toccato un indirizzo sarebbe un modo per entrare
// nel diario di due persone conoscendo una stringa* — e il secondo gesto è
// precisamente ciò che lo impedisce.
// =============================================================================

import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { Emblema } from '@/components/emblema';
import { useAuth } from '@/lib/auth';
import { salvaInvitoInAttesa } from '@/lib/preferenze';
import { t } from '@/lib/i18n';

/**
 * Il token arriva da un URL, quindi da fuori: si valida prima di conservarlo.
 *
 * ⚠️ **`[a-f0-9]` non è una cortesia**: `crea_invito` genera esadecimale, e
 * accettare qualunque stringa significherebbe tenere in memoria — e poi
 * spedire al database — ciò che un estraneo ha scritto in un indirizzo.
 */
function tokenValido(s: unknown): s is string {
  return typeof s === 'string' && /^[a-f0-9]{16,128}$/i.test(s);
}

export default function InvitoDaLink() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { session, loading } = useAuth();
  const [rifiutato, setRifiutato] = React.useState(false);

  React.useEffect(() => {
    // Finché l'auth non ha finito non si conclude niente: mandare al benvenuto
    // chi è già dentro lo farebbe rimbalzare, ed è la lezione di B-73.
    if (loading) return;

    if (!tokenValido(token)) {
      setRifiutato(true);
      return;
    }

    let vivo = true;
    (async () => {
      await salvaInvitoInAttesa(token);
      if (!vivo) return;
      // 🔑 **In entrambi i casi si va all'onboarding, non si apre nulla qui.**
      // Chi ha una sessione lo troverà già compilato; chi non ce l'ha passa
      // dal benvenuto e ci arriva dopo essersi registrato — con il token
      // ancora in memoria ad aspettarlo.
      router.replace(session ? '/onboarding' : '/(pubbliche)/benvenuto');
    })();
    return () => {
      vivo = false;
    };
  }, [loading, token, session, router]);

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1 items-center justify-center gap-4 px-10">
        <Emblema size={64} />
        {rifiutato ? (
          // ⚠️ Non si dice «token non valido»: chi legge non ha scritto nessun
          // token: ha toccato un link. Il messaggio parla di ciò che vede lui.
          <Text className="text-center text-base text-muted-foreground">
            {t.invitoDaLink.nonValido}
          </Text>
        ) : (
          <>
            <ActivityIndicator />
            <Text className="text-center text-base text-muted-foreground">
              {t.invitoDaLink.attesa}
            </Text>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
