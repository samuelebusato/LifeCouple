import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

/**
 * Segnaposto della home: conferma che l'appaiamento e' andato a buon fine.
 * Le funzioni vere (calendario, mappa, foto, liste, giochi, creatura) arrivano
 * qui nell'ordine di History.md D-11.
 */
export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <Emblema size={88} />
        <View className="items-center gap-2">
          <Text className="font-serif-bold text-3xl text-foreground">Siete una coppia</Text>
          <Text className="max-w-xs text-center text-base text-muted-foreground">
            Il vostro spazio è pronto. Da qui in poi arriveranno il calendario, la
            mappa dei vostri posti, le foto e molto altro.
          </Text>
        </View>
        <Button variant="ghost" onPress={() => supabase.auth.signOut()}>
          <Text>Esci</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
