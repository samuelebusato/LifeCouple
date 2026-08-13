import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { useTema } from '@/lib/tema';

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
  const { c } = useTema();
  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
        <View
          className="flex-1 items-center justify-center gap-4 px-10"
          style={{ paddingBottom: SPAZIO_BARRA }}
        >
          <View
            className="h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: c.alone }}
          >
            <Icona color={c.accento} size={44} />
          </View>
          <Text className="text-center font-serif-bold text-2xl text-foreground">{titolo}</Text>
          <Text className="text-center text-base text-muted-foreground">{testo}</Text>
          <Text className="text-center text-xs uppercase tracking-wide text-muted-foreground/70">
            {manca}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
