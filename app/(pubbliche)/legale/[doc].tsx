import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { TondoVetro } from '@/components/ui/vetro';
import { Markdown } from '@/components/markdown';
import { DOCUMENTI_LEGALI, type ChiaveDocumento } from '@/lib/legale/testi';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * I documenti legali, letti **dentro** l'applicazione.
 *
 * ## Perché non un collegamento a un sito
 *
 * L'art. 13 GDPR vuole che l'informativa sia resa **nel momento in cui i dati si
 * raccolgono** — cioè nella schermata di registrazione. Un rimando a un indirizzo
 * web ha due difetti che qui pesano: 🔴 al 2026-09-09 **quell'indirizzo non
 * esiste** (`landing/` non è pubblicata da nessuna parte), e comunque
 * ⚠️ *un'informativa leggibile solo con la rete non è resa a chi si registra
 * senza rete.*
 *
 * L'URL pubblico serve **lo stesso**, ma per un requisito diverso — la scheda
 * dello store — e resta a backlog. Le due cose non si sostituiscono a vicenda.
 *
 * ## 🔴 Perché sta dentro `(pubbliche)/` e non in `app/legale/`
 *
 * `GuardiaSessione` rimanda a `/benvenuto` **qualunque rotta fuori da
 * `app/(pubbliche)/`** quando non c'è una sessione. Messa altrove, questa
 * schermata sarebbe stata irraggiungibile esattamente per chi si sta
 * registrando — cioè *l'unica persona a cui l'art. 13 impone di renderla*.
 *
 * ⚠️ E il sintomo non sarebbe stato un errore: la schermata semplicemente non
 * si apre, com'è già successo il 2026-08-29 a `registrati` e `recupera`. La
 * cartella **è** la dichiarazione (vedi il commento in `app/_layout.tsx`); un
 * elenco di eccezioni sarebbe la stessa regola affidata alla memoria di chi
 * scrive la prossima schermata. Chi ha la sessione passa comunque: la guardia
 * si disattiva quando la sessione c'è.
 *
 * ## ⚠️ I documenti sono in inglese soltanto
 *
 * Decisione dell'utente del 2026-09-09 (**D-121**), presa dopo che il rischio è
 * stato sollevato: per un prodotto venduto anche in Italia il Codice del Consumo
 * chiede condizioni comprensibili al consumatore. Le **etichette** di questa
 * schermata seguono invece la lingua del telefono, come tutto il resto dell'app:
 * è il testo legale a non essere tradotto, non l'interfaccia.
 */
export default function Legale() {
  const router = useRouter();
  const { c } = useTema();
  const { doc } = useLocalSearchParams<{ doc: string }>();

  const chiave = doc as ChiaveDocumento;
  const documento = DOCUMENTI_LEGALI[chiave];

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between gap-3 px-6 pb-2 pt-1">
          <Text className="flex-1 font-serif-bold text-2xl text-foreground" numberOfLines={2}>
            {chiave === 'cookie' ? t.legale.cookieTitolo : t.legale.privacyTitolo}
          </Text>
          <TondoVetro lato={40} tinto={false} onPress={() => router.back()}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        <ScrollView contentContainerClassName="gap-4 px-6 pb-12 pt-2">
          {documento ? (
            <>
              {/* 🔑 Detto una volta sola, in cima e senza scuse: il documento che
                  segue è in inglese. Chi legge in italiano lo scopre qui, non a
                  metà pagina. */}
              <View className="rounded-2xl border border-border bg-card/60 px-4 py-3">
                <Text className="text-sm text-muted-foreground">{t.legale.soloInglese}</Text>
              </View>
              <Markdown testo={documento.testo} />
            </>
          ) : (
            // Non dovrebbe succedere: le rotte sono due e le genera il menu.
            // Ma una schermata legale vuota e muta sarebbe il peggior modo di
            // fallire, quindi il caso ha un testo suo.
            <Text className="text-base text-muted-foreground">{t.legale.nonTrovato}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
