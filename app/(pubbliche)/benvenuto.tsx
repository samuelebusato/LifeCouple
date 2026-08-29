import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { BottoneVetro } from '@/components/ui/vetro';
import { Fondo } from '@/components/schermata';
import { t } from '@/lib/i18n';

export default function Benvenuto() {
  const router = useRouter();
  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center px-8">
        <Emblema size={104} />
        <Text className="mt-8 font-serif-bold text-5xl text-foreground">LifeCouple</Text>
        <Text className="mt-4 max-w-xs text-center text-lg leading-relaxed text-muted-foreground">
          {t.benvenuto.sottotitolo}
        </Text>
      </View>

      {/* ⚠️ **Due strade dichiarate, non una che indovina** (2026-08-29). Prima
          c'era un solo bottone «Iniziamo» e il database decideva da sé se
          stavi nascendo o rientrando. Su un'app che custodisce ricordi la
          differenza fra *«sto creando il mio spazio»* e *«sto tornando nel
          mio»* è la prima cosa che l'utente vuole sapere — e la seconda è la
          sola che può andare storta in modo spaventoso. */}
      <View className="gap-3 px-8 pb-4">
        <BottoneVetro variante="accento" altezza={58} onPress={() => router.push('/registrati')}>
          <Text>{t.benvenuto.inizia}</Text>
        </BottoneVetro>
        <BottoneVetro altezza={52} onPress={() => router.push('/accedi')}>
          <Text>{t.benvenuto.haiGiaAccount}</Text>
        </BottoneVetro>
        <Text className="mt-1 text-center text-sm text-muted-foreground">{t.benvenuto.nota}</Text>
      </View>
      </SafeAreaView>
    </View>
  );
}
