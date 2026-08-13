import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';

/**
 * Sezione che esiste nella barra ma non ha ancora dentro la sua funzione.
 *
 * Dice **cosa ci sara' e cosa manca perche' ci sia**, invece di mostrare una
 * schermata vuota o — peggio — dati finti. Nessun gap silenzioso vale anche
 * verso chi usa l'app, non solo nella documentazione.
 */
export function SezioneInArrivo({
  titolo,
  testo,
  manca,
  Icona,
}: {
  titolo: string;
  testo: string;
  manca: string;
  Icona: React.ComponentType<{ color?: string; size?: number }>;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-10 pb-24">
        <Icona color="#c9b8a8" size={56} />
        <Text className="text-center font-serif-bold text-2xl text-foreground">{titolo}</Text>
        <Text className="text-center text-base text-muted-foreground">{testo}</Text>
        <Text className="text-center text-xs uppercase tracking-wide text-muted-foreground/70">
          {manca}
        </Text>
      </View>
    </SafeAreaView>
  );
}
