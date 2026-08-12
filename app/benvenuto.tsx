import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default function Benvenuto() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Emblema size={104} />
        <Text className="mt-8 font-serif-bold text-5xl text-foreground">LifeCouple</Text>
        <Text className="mt-4 max-w-xs text-center text-lg leading-relaxed text-muted-foreground">
          Il vostro diario condiviso. Un posto solo per voi due, dove tenere quello
          che vivete insieme.
        </Text>
      </View>

      <View className="gap-4 px-8 pb-4">
        <Button size="lg" onPress={() => router.push('/accedi')}>
          <Text>Iniziamo</Text>
        </Button>
        <Text className="text-center text-sm text-muted-foreground">
          Bastano la tua email e il tuo partner.
        </Text>
      </View>
    </SafeAreaView>
  );
}
