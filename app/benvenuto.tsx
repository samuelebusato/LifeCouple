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

      <View className="gap-4 px-8 pb-4">
        <BottoneVetro variante="accento" altezza={58} onPress={() => router.push('/accedi')}>
          <Text>{t.benvenuto.inizia}</Text>
        </BottoneVetro>
        <Text className="text-center text-sm text-muted-foreground">{t.benvenuto.nota}</Text>
      </View>
      </SafeAreaView>
    </View>
  );
}
