import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';

/**
 * Gate d'ingresso: decide dove mandare l'utente in base a login e appaiamento.
 * Non disegna niente di suo se non lo splash di attesa.
 */
export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { coppiaId, loading: coppiaLoading } = useCoppia();

  if (authLoading || (session && coppiaLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#bf5333" />
      </View>
    );
  }

  if (!session) return <Redirect href="/benvenuto" />;
  if (!coppiaId) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
