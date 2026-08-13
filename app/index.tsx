import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useIngressoRimandato } from '@/lib/preferenze';

/**
 * Gate d'ingresso: decide dove mandare l'utente in base a login e appaiamento.
 * Non disegna niente di suo se non lo splash di attesa.
 *
 * Chi ha scelto di entrare senza creare lo spazio non rivede la schermata di
 * scelta: sarebbe di nuovo il cancello che si e' tolto.
 */
export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { coppiaId, loading: coppiaLoading } = useCoppia();
  const { rimandato, loading: rimandatoLoading } = useIngressoRimandato(session?.user.id);

  if (authLoading || (session && (coppiaLoading || rimandatoLoading))) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#d64360" />
      </View>
    );
  }

  if (!session) return <Redirect href="/benvenuto" />;
  if (!coppiaId && !rimandato) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
