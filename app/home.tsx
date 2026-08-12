import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Emblema } from '@/components/emblema';
import { ServePartner } from '@/components/serve-partner';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { useInvito } from '@/lib/invito';
import { t } from '@/lib/i18n';

/**
 * Segnaposto della home. Da qui in avanti le funzioni vere, nell'ordine di
 * History.md D-11 — quelle che richiedono due persone useranno <ServePartner />
 * finche' la coppia non e' completa.
 */
export default function Home() {
  const { completa, loading, ricarica } = useCoppia();

  // Finche' si e' da soli si resta in ascolto: se il partner apre l'invito,
  // la conferma (D-14) dev'essere possibile anche da qui, non solo in onboarding.
  const invito = useInvito(!loading && !completa, ricarica);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#bf5333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <Emblema size={88} />
        <View className="items-center gap-2">
          <Text className="font-serif-bold text-3xl text-foreground">
            {completa ? t.home.titoloCoppia : t.home.titoloSolo}
          </Text>
          <Text className="max-w-xs text-center text-base text-muted-foreground">
            {completa ? t.home.testoCoppia : t.home.testoSolo}
          </Text>
        </View>

        {!completa &&
          (invito.invitoApertoId ? (
            <View className="w-full items-center gap-3 rounded-2xl bg-accent p-5">
              <Text className="text-center text-base text-accent-foreground">
                {t.onboarding.apertoInvito}
              </Text>
              <Button className="w-full" disabled={invito.attesa} onPress={invito.conferma}>
                <Text>{invito.attesa ? t.onboarding.unisco : t.onboarding.conferma}</Text>
              </Button>
              {invito.errore && (
                <Text className="text-center text-sm text-destructive">{invito.errore}</Text>
              )}
            </View>
          ) : (
            <ServePartner />
          ))}

        <Button variant="ghost" onPress={() => supabase.auth.signOut()}>
          <Text>{t.home.esci}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
