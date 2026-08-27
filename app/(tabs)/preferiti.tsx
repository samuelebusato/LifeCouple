import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { ElencoElementi } from '@/components/elenco-elementi';
import { t } from '@/lib/i18n';

/**
 * La sezione **Film**.
 *
 * ⚠️ Conteneva due elenchi — film e luoghi — scelti da un selettore in cima.
 * Dal 2026-08-27 (D-51) i **luoghi vivono dentro la mappa**, come sua seconda
 * visualizzazione: un elenco di posti e una mappa di posti sono due modi di
 * guardare la stessa cosa, e tenerli in due sezioni diverse obbligava a
 * ricordare in quale delle due si fosse messo un posto.
 *
 * Qui resta il solo elenco dei film, e non serve piu' un selettore per una
 * scelta sola. La rotta continua a chiamarsi `preferiti` — vedi il debito
 * dichiarato in D-47.
 */
export default function Preferiti() {
  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-1 pt-1">
          <Text className="font-serif-bold text-3xl text-foreground">{t.tab.preferiti}</Text>
        </View>
        <ElencoElementi tipo="film" />
      </SafeAreaView>
    </View>
  );
}
