import { View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

/**
 * Schermata segnaposto: esercita l'intera catena UI (NativeWind, token,
 * componenti in stile RNR, icone lucide). Verra' sostituita dalla schermata
 * di benvenuto/appaiamento quando inizia il lavoro sulle funzioni.
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
        <Heart color="white" size={28} />
      </View>
      <View className="items-center gap-2">
        <Text className="text-3xl font-bold">LifeCouple</Text>
        <Text className="text-center text-muted-foreground">
          Base di progetto pronta. Da qui in poi, le funzioni.
        </Text>
      </View>
      <Button onPress={() => {}}>
        <Text>Iniziamo</Text>
      </Button>
    </View>
  );
}
